// Episode 13 (geography): "Selat Malaka: jalan tol laut tersibuk di dunia?". Built on the locked template (from
// Ep012), with captions v2 (LiveCaptions2 + PunchIn), SfxLayer2 and the v2 mix. One map shot:
// the strait -> Indian Ocean to South China Sea -> Singapore -> the strait -> Indonesia (Lombok detour).
// The shipping lane and the ships are our own drawing (approximate waypoints), not a traffic map.
import type { Caption } from "@remotion/captions";
import { geoDistance, geoInterpolate, geoPath, type GeoPermissibleObjects } from "d3-geo";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { Geo, MapView, ProjectionOnly, useProjection, type Camera } from "../components/MapView";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import ep001 from "../../data/ep001-facts.json";
import facts from "../../data/ep013-facts.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep013-captions.json";
import timing from "./ep013-timing.json";
import { DETOUR, KEYS, LANE, NUM, PT, type SegmentId } from "./ep013-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP013_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP013_TRACK = pickTrack(13, EP013_SECONDS);

const SAFE_BOTTOM = 1536;
const STAMP_Y = 1170;
const TXT = 54;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

// --- camera -----------------------------------------------------------------------------------------------------
const P = ep001.points as Record<string, { coord: number[] }>;
const HOME = geoInterpolate(P.idWest.coord as LonLat, P.idEast.coord as LonLat)(0.5) as LonLat;
const REGION: LonLat = [100.7, 3.2];
const WIDE: LonLat = [101.0, 3.5];
const SG: LonLat = [103.7, 1.4];
type Key = { t: number; c: LonLat; w: number };
const CAM: Key[] = [
  { t: 0, c: REGION, w: 2000 },
  { t: S.name + 0.4, c: REGION, w: 1750 },
  { t: S.why, c: REGION, w: 1750 },
  { t: at("why", "jalan"), c: WIDE, w: 5200 },
  { t: S.narrow, c: WIDE, w: 5200 },
  { t: S.narrow + 1.6, c: SG, w: 520 },
  { t: S.reveal - 0.2, c: SG, w: 520 },
  { t: S.reveal + 1.2, c: REGION, w: 1900 },
  { t: S.lombok, c: REGION, w: 1900 },
  { t: S.lombok + 1.6, c: HOME, w: 6250 },
  { t: 999, c: HOME, w: 6350 },
];
const ZOOMS = [S.name, at("why", "jalan") - 1, S.narrow, S.reveal - 0.2, S.lombok];
const camera = (t: number): Camera => {
  const i = Math.max(0, CAM.findIndex((k) => k.t > t) - 1);
  const a = CAM[i], b = CAM[Math.min(i + 1, CAM.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

const fade = (t: number, a: number, b: number, d = 0.3) => Math.max(0, Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b)));

// --- a polyline along the sphere: drawn with a reveal, and points along it for the ships -------------------------
const along = (pts: LonLat[]) => {
  const seg = pts.slice(1).map((p, i) => geoDistance(pts[i], p));
  const total = seg.reduce((a, b) => a + b, 0);
  return (k: number): LonLat => {
    let d = Math.max(0, Math.min(1, k)) * total;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) return geoInterpolate(pts[i], pts[i + 1])(Math.min(1, d / seg[i])) as LonLat;
      d -= seg[i];
    }
    return pts[pts.length - 1];
  };
};
const laneAt = along(LANE);

const Lane: React.FC<{ pts: LonLat[]; progress: number; color: string; width?: number; opacity?: number }> = ({ pts, progress, color, width = 10, opacity = 1 }) => {
  const proj = useProjection();
  if (progress <= 0 || opacity <= 0.001) return null;
  const d = geoPath(proj)({ type: "LineString", coordinates: pts }) ?? "";
  const common = { d, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, style: { strokeDasharray: "1 1", strokeDashoffset: 1 - progress } };
  return (
    <g opacity={opacity}>
      <path {...common} stroke={color} strokeWidth={width * 2.6} opacity={0.25} />
      <path {...common} stroke={C.tinta} strokeWidth={width + 6} opacity={0.6} />
      <path {...common} stroke={color} strokeWidth={width} />
    </g>
  );
};

// little ships moving along the lane (both directions); `n` grows for the "280 per day" reveal
const Ships: React.FC<{ t: number; n: number; opacity: number }> = ({ t, n, opacity }) => {
  const proj = useProjection();
  if (opacity <= 0.001 || n < 1) return null;
  return (
    <g opacity={opacity}>
      {Array.from({ length: Math.floor(n) }, (_, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        const phase = (i * 0.618034) % 1;
        const k = (((phase + dir * t * 0.035) % 1) + 1) % 1;
        const xy = proj(laneAt(k));
        if (!xy) return null;
        const off = dir * 7;
        return <circle key={i} cx={xy[0] + off} cy={xy[1] - off} r={8} fill={dir > 0 ? C.krim : C.kunyit} stroke={C.tinta} strokeWidth={3.5} />;
      })}
    </g>
  );
};

const MapLayers: React.FC<{ t: number }> = ({ t }) => {
  const shipsN = t < S.reveal ? 14 : 14 + 26 * ramp(t, at("reveal", "dua"), at("reveal", "kapal") + 0.3);
  return (
    <>
      <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.8} />
      <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.5} stroke={C.putih} strokeWidth={2.2} strokeLinejoin="round" />
      {/* the main lane: Indian Ocean -> the strait -> Singapore -> South China Sea */}
      <Lane pts={LANE} progress={ramp(t, 0, 2.2)} color={C.kunyit} width={11} opacity={1 - ramp(t, S.lombok + 0.6, S.lombok + 1.6) * 0.5} />
      <Ships t={t} n={shipsN} opacity={fade(t, 0.8, S.lombok + 1.2)} />
      {/* the detour for the biggest ships: Lombok Strait */}
      <Lane pts={DETOUR} progress={ramp(t, at("lombok", "memutar"), at("lombok", "Lombok") + 0.6)} color={C.toska} width={11} opacity={fade(t, S.lombok, S.question + 0.4)} />
      <Pin at={PT.melaka} from={at("name", "Melaka")} to={S.long} color={C.kunyit} r={16} />
      <Pin at={PT.phillip} from={at("narrow", "menyempit")} to={S.reveal} color={C.koral} r={16} />
      <Pin at={PT.lombok} from={at("lombok", "Lombok")} to={S.question + 0.3} color={C.toska} r={16} />
    </>
  );
};

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={[101.3, -0.6]} from={S.name} to={S.why} dy={0}>Sumatra</L>
    <L at={PT.melaka} from={at("name", "Melaka")} to={S.long} dy={-85} bg={C.kunyit}>Melaka</L>
    <L at={[91.5, 1.5]} from={at("why", "Samudra")} to={S.narrow + 0.4} dy={0} bg={C.toska}>Samudra Hindia</L>
    <L at={[111.0, 9.5]} from={at("why", "Laut")} to={S.narrow + 0.4} dy={0} bg={C.toska}>Laut Cina Selatan</L>
    <L at={PT.singapore} from={at("narrow", "Singapura")} to={at("narrow", "menyempit")} dy={-90}>Singapura</L>
    <L at={PT.phillip} from={at("narrow", "menyempit")} to={S.tebak} dy={-90} bg={C.koral} fg={C.putih}>Phillip Channel</L>
    <L at={[99.0, 4.6]} from={S.lombok + 1.4} to={S.question} dy={-80} bg={C.kunyit}>Selat Malaka</L>
    <L at={PT.lombok} from={at("lombok", "Lombok")} to={S.question} dy={90} bg={C.toska}>Selat Lombok</L>
  </>
);

// to-scale bars (horizontal): label left, value right
type Row = { label: string; v: number; unit: string; color: string; from: number; dec?: number };
const Bars: React.FC<{ t: number; rows: Row[]; from: number; to: number; top?: number }> = ({ t, rows, from, to, top = 300 }) => {
  const full = 960;
  const max = Math.max(...rows.map((r) => r.v));
  const k = useLife(from, to);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        if (t < r.from) return null;
        const g = ramp(t, r.from, r.from + 0.7);
        return (
          <div key={r.label} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{fmt(r.v * g, r.dec ?? 0)} {r.unit}</span>
            </div>
            <div style={{ marginTop: 6, width: Math.max(10, (full * r.v * g) / max), height: 34, borderRadius: 10, background: r.color, border: `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 180, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>???</div>;
};

const SEAS: [string, number, number][] = [
  ["Laut Jawa", 290, 1000], ["Selat Bali", 790, 1000],
  ["Laut Banda", 290, 1110], ["Selat Sunda", 790, 1110],
];

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.8) 0%, rgba(7,6,13,0.2) 30%, rgba(7,6,13,0.2) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK: a number on screen in the first second */}
    <Counter x={W / 2} y={200} from={-0.2} to={S.name} a={0} b={NUM.ships2025} t0={0} t1={1.4} unit=" KAPAL" size={150} />
    <Pill x={W / 2} y={360} from={0.2} to={S.name} size={TXT} bg={C.kunyit}>Dalam setahun (2025)</Pill>

    {/* NAME */}
    <Headline x={W / 2} y={200} from={S.name} to={S.long} size={116} color={C.kunyit}>Selat Malaka</Headline>
    <Pill x={W / 2} y={350} from={at("name", "Malaysia")} to={S.long} size={TXT}>Dari kota Melaka</Pill>

    {/* LONG: strait length vs Jakarta-Surabaya, to scale */}
    <Headline x={W / 2} y={170} from={S.long} to={S.why} size={110} color={C.kunyit}>±900 km</Headline>
    <Bars t={t} from={S.long + 0.2} to={S.why} rows={[
      { label: "Selat Malaka", v: NUM.lengthKm, unit: "km", color: C.kunyit, from: S.long + 0.2 },
      { label: "Jakarta–Surabaya", v: Math.round(facts.jakartaSurabaya.haversineKm), unit: "km", color: C.toska, from: at("long", "Jakarta") - 0.2 },
    ]} />

    {/* WHY */}
    <Headline x={W / 2} y={200} from={S.why} to={S.narrow} size={110}>Jalan pintas</Headline>
    <Pill x={W / 2} y={350} from={at("why", "Selatan") + 0.2} to={S.narrow} size={TXT} bg={C.kunyit}>±22% dagang laut dunia</Pill>

    {/* NARROW + WIDTH */}
    <Headline x={W / 2} y={200} from={S.narrow} to={S.width} size={116} color={C.koral}>Tapi tunggu…</Headline>
    <Headline x={W / 2} y={170} from={S.width} to={S.tebak} size={110} color={C.kunyit}>Cuma 2,8 km</Headline>
    <Bars t={t} from={S.width + 0.2} to={S.tebak} rows={[
      { label: "Jembatan Suramadu", v: facts.suramaduKm.value, unit: "km", color: C.toska, from: at("width", "Suramadu") - 0.3, dec: 1 },
      { label: "Phillip Channel", v: NUM.phillipsKm, unit: "km", color: C.koral, from: S.width + 0.2, dec: 1 },
    ]} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("width", "separuh")} to={S.tebak} color={C.kunyit} size={80}>½ Suramadu</Stamp>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={150} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "kapal")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Berapa kapal sehari?</Pill>

    {/* REVEAL */}
    <Counter x={W / 2} y={200} from={S.reveal} to={S.deep} a={0} b={NUM.perDay} t0={at("reveal", "dua")} t1={at("reveal", "kapal") + 0.2} unit=" KAPAL" size={160} />
    <Pill x={W / 2} y={360} from={at("reveal", "Setiap")} to={S.deep} size={TXT} bg={C.kunyit}>Setiap hari!</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("reveal", "Setiap")} to={S.deep} color={C.toska} size={64}>102.500 ÷ 365 hari</Stamp>

    {/* DEEP + LOMBOK: depths to scale */}
    <Headline x={W / 2} y={170} from={S.deep} to={S.lombok} size={96}>Kapal raksasa?</Headline>
    <Headline x={W / 2} y={170} from={S.lombok} to={S.question} size={96}>Memutar!</Headline>
    <Bars t={t} from={at("deep", "terdangkal") - 0.2} to={S.question} rows={[
      { label: "Selat Malaka", v: NUM.minDepth, unit: "m", color: C.kunyit, from: at("deep", "terdangkal") - 0.2 },
      { label: "Selat Lombok", v: NUM.lombokDepth, unit: "m", color: C.toska, from: at("lombok", "Dalamnya") - 0.1 },
    ]} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("deep", "muat")} to={S.lombok} size={84}>Nggak muat</Stamp>
    <Stamp x={W / 2} y={STAMP_Y} from={at("lombok", "lima", 0) + 0.2} to={S.question} color={C.toska} size={80}>10× lebih dalam</Stamp>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={EP013_SECONDS + 1} size={96}>
      Laut terdekat <span style={{ color: C.kunyit }}>dari rumahmu?</span>
    </Headline>
    {SEAS.map(([name, x, y], i) => (
      <Pill key={name} x={x} y={y} from={S.question + 0.25 + i * 0.08} to={EP013_SECONDS + 1} size={TXT} bg={C.kunyit}>{name}</Pill>
    ))}
    <Pill x={W / 2} y={STAMP_Y + 80} from={at("question", "Tulis")} to={EP013_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "narrow" || s.id === "lombok").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("deep", "muat"), name: "impact" as const },
  { at: at("width", "separuh"), name: "pop" as const },
];

export const Ep013: React.FC = () => {
  const t = useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [at("name", "Melaka"), at("why", "Samudra"), at("why", "Laut"), at("narrow", "menyempit"), at("lombok", "Lombok"), S.question + 0.25];
  const counts: [number, number][] = [[0, 1.4], [at("reveal", "dua"), at("reveal", "kapal") + 0.2]];
  const lands = [at("width", "separuh"), at("reveal", "Setiap"), at("lombok", "lima", 0) + 0.2];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <MapView cam={camera(t)}>
          <MapLayers t={t} />
        </MapView>
        <ProjectionOnly cam={camera(t)}>
          <MapHtmlLabels />
        </ProjectionOnly>
        <Overlays t={t} />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep013.wav" voiceLufs={-16.2} words={captions} track={EP013_TRACK} seconds={EP013_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP013_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: ZOOMS, icons, counts, lands }} />
    </AbsoluteFill>
  );
};
