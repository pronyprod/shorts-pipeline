// Episode 2: "Garis pantai Indonesia bisa melilit Bumi 2,5 kali?" Built on the locked Ep001V3 template
// (same components, layout rules, Puck voice, Soundtrack, finalize). One continuous map shot; beats on spoken words.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import { geoInterpolate, geoPath, type GeoPermissibleObjects } from "d3-geo";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Geo, MapView, ProjectionOnly, Route, useProjection, type Camera } from "../components/MapView";
import { Soundtrack } from "../components/Soundtrack";
import { Captions, Counter, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import ep001 from "../../data/ep001-facts.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, H, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep002-captions.json";
import timing from "./ep002-timing.json";
import { NUM, type SegmentId } from "./ep002-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP002_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP002_TRACK = pickTrack(2, EP002_SECONDS);

// ---- phone layout (locked template values) ----
const SAFE_BOTTOM = H * 0.8;
const CAPTION_TOP = 1390;
const STAMP_Y = 1250;
const TXT = 54;
const W_HOME = 6200;
const W_GLOBE = 21000; // the globe disc fills the frame width

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};
const fade = (t: number, a: number, b: number, d = 0.3) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));

const P = Object.fromEntries(Object.entries(ep001.points).map(([k, v]) => [k, (v as { coord: number[] }).coord as LonLat])) as Record<string, LonLat>;
const HOME = geoInterpolate(P.idWest, P.idEast)(0.5) as LonLat;
const SULAWESI: LonLat = [121.3, -2.0];
const GLOBE_C: LonLat = [HOME[0], 14];

// ---- the wrap: Indonesia's coastline (BIG 2013) wound around the Earth as a spiral, 2,47 laps ----
const LAP_RISE = 3.2; // degrees of latitude per lap, so the laps sit side by side
const lapsAt = (t: number) => {
  const k1 = at("wrap", "putaran", 0) + 0.25, k2 = at("wrap", "putaran", 1) + 0.25, k3 = at("wrap", "setengah") + 0.35;
  if (t < S.wrap + 0.15) return 0;
  if (t < k1) return ramp(t, S.wrap + 0.15, k1);
  if (t < k2) return 1 + ramp(t, k1, k2);
  return 2 + (NUM.lapsBig - 2) * ramp(t, k2, k3);
};
const WRAP_END = at("wrap", "setengah") + 0.9;

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: HOME, w: 5900 },
  { t: S.equator - 0.2, c: HOME, w: W_HOME },
  { t: S.equator + 1.4, c: GLOBE_C, w: W_GLOBE },
  { t: S.wrap, c: GLOBE_C, w: W_GLOBE },
  // (wrap: the camera follows the head of the spiral, see camera())
  { t: WRAP_END, c: GLOBE_C, w: W_GLOBE },
  { t: S.local + 1.2, c: HOME, w: W_HOME },
  { t: S.ruler, c: HOME, w: W_HOME },
  { t: S.ruler + 1.6, c: SULAWESI, w: 1500 },
  { t: E.sulawesi + 0.1, c: SULAWESI, w: 1500 },
  { t: S.bignew + 1.4, c: HOME, w: W_HOME },
  { t: 999, c: HOME, w: 6500 },
];
const camera = (t: number): Camera => {
  if (t >= S.wrap && t < WRAP_END) {
    // the globe turns east with the head of the spiral; a full extra turn per lap
    const laps = lapsAt(t);
    const spin = 360 * laps * ramp(t, S.wrap, S.wrap + 0.4) - 360 * laps * ramp(t, WRAP_END - 0.8, WRAP_END);
    return { lon: GLOBE_C[0] + spin, lat: GLOBE_C[1] + LAP_RISE * laps * 0.5, widthKm: W_GLOBE };
  }
  const i = Math.max(0, KEYS.findIndex((k) => k.t > t) - 1);
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

// spiral line from Indonesia eastwards: `laps` turns, rising LAP_RISE° per turn
const spiral = (laps: number): GeoPermissibleObjects => {
  const pts: LonLat[] = [];
  for (let s = 0; s <= laps; s += 0.004) pts.push([((HOME[0] + 360 * s + 540) % 360) - 180, s * LAP_RISE]);
  pts.push([((HOME[0] + 360 * laps + 540) % 360) - 180, laps * LAP_RISE]);
  return { type: "LineString", coordinates: pts };
};
const equator: GeoPermissibleObjects = { type: "LineString", coordinates: Array.from({ length: 181 }, (_, i) => [-180 + i * 2, 0]) };

// divider (ruler) walk around Sulawesi, drawn up to `progress` (0..1)
const Divider: React.FC<{ points: number[][]; progress: number; color: string }> = ({ points, progress, color }) => {
  const proj = useProjection();
  if (progress <= 0) return null;
  const n = Math.max(2, Math.ceil(points.length * progress));
  const pts = points.slice(0, n) as LonLat[];
  const d = geoPath(proj)({ type: "LineString", coordinates: pts }) ?? "";
  return (
    <g>
      <path d={d} fill="none" stroke={C.tinta} strokeWidth={13} strokeLinejoin="round" opacity={0.6} />
      <path d={d} fill="none" stroke={color} strokeWidth={7} strokeLinejoin="round" />
      {pts.map((p, i) => {
        const xy = proj(p);
        return xy ? <circle key={i} cx={xy[0]} cy={xy[1]} r={7} fill={color} stroke={C.tinta} strokeWidth={3} /> : null;
      })}
    </g>
  );
};

const RULER_A = at("sulawesi", "Penggaris", 0);
const RULER_B = at("sulawesi", "Penggaris", 1);

const MapLayers: React.FC<{ t: number }> = ({ t }) => {
  const coastGlow = fade(t, 0, S.equator + 0.8) + fade(t, S.big, S.wrap + 0.5) + fade(t, S.ruler, RULER_A + 0.2);
  const onWrap = t > S.equator && t < S.local + 1.0;
  return (
    <>
      <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
      <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.88} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
      {/* the coastline itself, in turmeric */}
      <g opacity={Math.min(1, coastGlow)}>
        <Geo d={indonesia as GeoPermissibleObjects} fill="none" stroke={C.kunyit} strokeWidth={5} strokeLinejoin="round" />
      </g>
      {/* equator (40.075 km) and the wound coastline */}
      {onWrap && (
        <g opacity={fade(t, S.equator + 0.6, S.local + 1.0)}>
          <Geo d={equator} fill="none" stroke={C.toska} strokeWidth={7} strokeDasharray="1 0" />
        </g>
      )}
      {onWrap && lapsAt(t) > 0 && (
        <g opacity={fade(t, S.wrap, S.local + 1.0)}>
          <Geo d={spiral(lapsAt(t))} fill="none" stroke={C.tinta} strokeWidth={14} opacity={0.6} />
          <Geo d={spiral(lapsAt(t))} fill="none" stroke={C.kunyit} strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {/* local: Sabang–Merauke */}
      <g opacity={fade(t, S.local + 0.8, S.cia + 0.3)}>
        <Route from={P.sabang} to={P.merauke} progress={ramp(t, S.local + 0.8, S.local + 1.8)} color={C.kunyit} width={12} />
      </g>
      <Pin at={P.sabang} from={S.local + 0.8} to={S.cia + 0.3} r={19} />
      <Pin at={P.merauke} from={S.local + 1.6} to={S.cia + 0.3} r={19} />
      {/* Sulawesi measured with two rulers */}
      <g opacity={fade(t, RULER_A - 0.2, S.bignew + 0.6)}>
        <Divider points={NUM.sulawesi200.points} progress={ramp(t, RULER_A, RULER_A + 1.4)} color={C.toska} />
      </g>
      <g opacity={fade(t, RULER_B - 0.2, S.bignew + 0.6)}>
        <Divider points={NUM.sulawesi25.points} progress={ramp(t, RULER_B, RULER_B + 1.8)} color={C.kunyit} />
      </g>
    </>
  );
};

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={P.sabang} from={S.local + 0.8} to={S.cia} dy={-80}>Sabang</L>
    <L at={P.merauke} from={S.local + 1.6} to={S.cia} dy={85}>Merauke</L>
    <L at={[120.4, 1.2]} from={S.ruler + 1.2} to={S.bignew} dy={-110}>Sulawesi</L>
  </>
);

// horizontal bars, true to scale (km)
const Bars: React.FC<{ t: number; rows: { label: string; km: number; color: string; from: number }[]; from: number; to: number }> = ({ t, rows, from, to }) => {
  const max = NUM.bigNew, full = 960;
  const k = useLife(from, to);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 110, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        const g = ramp(t, r.from, r.from + 0.8);
        if (t < r.from) return null;
        return (
          <div key={r.label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{fmt(r.km * g)} km</span>
            </div>
            <div style={{ marginTop: 8, width: (full * r.km * g) / max, height: 44, borderRadius: 12, background: r.color, border: `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

const LapCounter: React.FC<{ t: number }> = ({ t }) => {
  const k = useLife(at("wrap", "Satu") - 0.1, S.local);
  if (k <= 0.001) return null;
  const laps = lapsAt(t);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 190, color: C.kunyit, textShadow: SHADOW, opacity: Math.min(1, k * 1.5), letterSpacing: -4 }}>
      {fmt(laps, laps >= 2.0 ? 2 : 1)}×
    </div>
  );
};

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.78) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK */}
    <Headline x={W / 2} y={250} from={-0.25} to={S.equator} size={100}>
      Garis pantai Indonesia melilit Bumi <span style={{ color: C.kunyit }}>2,5×?</span>
    </Headline>
    <Pill x={W / 2} y={STAMP_Y} from={at("hook", "buktikan")} to={S.equator} size={60} bg={C.kunyit}>Kita buktikan</Pill>

    {/* EQUATOR */}
    <Pill x={W / 2} y={170} from={S.equator} to={S.big} size={TXT} bg={C.toska}>Keliling khatulistiwa</Pill>
    <Counter x={W / 2} y={310} from={S.equator + 0.1} to={S.big} a={0} b={NUM.equatorKm} t0={S.equator + 0.3} t1={at("equator", "kilometer")} unit="KM" color={C.toska} size={160} />

    {/* BIG 2013 */}
    <Pill x={W / 2} y={170} from={S.big} to={S.wrap} size={TXT}>Garis pantai · BIG</Pill>
    <Counter x={W / 2} y={310} from={S.big + 0.1} to={S.wrap} a={0} b={NUM.big2013} t0={at("big", "sembilan")} t1={at("big", "kilometer")} unit="KM" size={160} />

    {/* WRAP */}
    <Pill x={W / 2} y={150} from={S.wrap} to={S.local} size={TXT}>Putaran keliling Bumi</Pill>
    <LapCounter t={t} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("wrap", "setengah")} to={S.local} color={C.kunyit} size={86}>{fmt(NUM.lapsBig, 2)}× Bumi</Stamp>

    {/* LOCAL */}
    <Counter x={W / 2} y={260} from={S.local} to={S.cia} a={0} b={NUM.timesSabangMerauke} t0={S.local + 0.2} t1={at("local", "Merauke")} unit="×" size={160} decimals={1} />
    <Pill x={W / 2} y={440} from={S.local + 0.3} to={S.cia} size={60}>Sabang–Merauke</Pill>
    <Pill x={W / 2} y={STAMP_Y} from={at("local", "Jalan")} to={S.cia} size={TXT} bg={C.kunyit}>Jalan kaki nonstop: 2+ tahun</Pill>

    {/* CIA vs BIG */}
    <Bars t={t} from={S.cia} to={S.paradox + 0.2} rows={[
      { label: "BIG (2013)", km: NUM.big2013, color: C.kunyit, from: S.cia + 0.1 },
      { label: "CIA Factbook", km: NUM.cia, color: C.toska, from: at("cia", "CIA") },
    ]} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("cia", "setengahnya")} to={S.paradox} size={86}>Hampir setengah</Stamp>

    {/* PARADOX */}
    <Headline x={W / 2} y={250} from={at("paradox", "Namanya") - 0.2} to={S.ruler + 0.2} size={104} color={C.koral}>Paradoks garis pantai</Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("paradox", "benar")} to={S.ruler} color={C.kunyit} size={86}>Dua-duanya benar</Stamp>
    <Pill x={W / 2} y={200} from={S.ruler + 0.2} to={RULER_A - 0.1} size={60}>Penggaris pendek = lebih panjang</Pill>

    {/* SULAWESI */}
    <Pill x={W / 2} y={170} from={RULER_A} to={RULER_B} size={TXT} bg={C.toska}>Penggaris 200 km</Pill>
    <Counter x={W / 2} y={310} from={RULER_A + 0.1} to={RULER_B} a={0} b={NUM.sulawesi200.lengthKm} t0={RULER_A + 0.2} t1={RULER_A + 1.6} unit="KM" color={C.toska} size={160} />
    <Pill x={W / 2} y={170} from={RULER_B} to={S.bignew} size={TXT} bg={C.kunyit}>Penggaris 25 km</Pill>
    <Counter x={W / 2} y={310} from={RULER_B + 0.1} to={S.bignew} a={NUM.sulawesi200.lengthKm} b={NUM.sulawesi25.lengthKm} t0={RULER_B + 0.2} t1={RULER_B + 2.0} unit="KM" size={160} />
    <Stamp x={W / 2} y={STAMP_Y} from={E.sulawesi - 0.8} to={S.bignew + 0.1} color={C.kunyit} size={86}>+{Math.round((NUM.sulawesi25.lengthKm / NUM.sulawesi200.lengthKm - 1) * 100)}%</Stamp>

    {/* BIG NEW */}
    <Bars t={t} from={S.bignew} to={S.rank + 0.2} rows={[
      { label: "CIA Factbook", km: NUM.cia, color: C.toska, from: S.bignew },
      { label: "BIG (2013)", km: NUM.big2013, color: C.kunyit, from: S.bignew + 0.15 },
      { label: "BIG terbaru", km: NUM.bigNew, color: C.koral, from: at("bignew", "seratus") },
    ]} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("bignew", "keliling")} to={S.rank} color={C.kunyit} size={86}>{fmt(NUM.lapsBigNew, 1)}× Bumi</Stamp>

    {/* RANK */}
    <Pill x={W / 2} y={190} from={S.rank} to={S.question} size={60} bg={C.toska}>CIA: #3 dunia</Pill>
    <Pill x={W / 2} y={320} from={S.rank + 0.3} to={S.question} size={60} bg={C.toska}>WRI: #4 dunia</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("rank", "lima")} to={S.question} color={C.kunyit} size={86}>Lima besar dunia</Stamp>

    {/* QUESTION */}
    <Headline x={W / 2} y={260} from={S.question} to={EP002_SECONDS + 1} size={104}>
      Pantai favoritmu <span style={{ color: C.kunyit }}>di mana?</span>
    </Headline>
    <Pill x={W / 2} y={1285} from={at("question", "Tulis")} to={EP002_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const sfx = (): { at: number; name: string; vol: number }[] => [
  { at: 0, name: "rise", vol: 0.25 },
  { at: S.equator + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("wrap", "Satu"), name: "pop", vol: 0.35 },
  { at: at("wrap", "Dua"), name: "pop", vol: 0.35 },
  { at: at("wrap", "setengah"), name: "stamp", vol: 0.5 },
  { at: S.local + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("cia", "setengahnya"), name: "stamp", vol: 0.5 },
  { at: at("paradox", "benar"), name: "stamp", vol: 0.5 },
  { at: S.ruler + 0.1, name: "whoosh", vol: 0.45 },
  { at: RULER_A, name: "tick", vol: 0.4 },
  { at: RULER_B, name: "tick", vol: 0.4 },
  { at: E.sulawesi - 0.8, name: "stamp", vol: 0.5 },
  { at: at("bignew", "keliling"), name: "stamp", vol: 0.5 },
  { at: at("rank", "lima"), name: "stamp", vol: 0.5 },
  { at: S.question, name: "pop", vol: 0.35 },
];

export const Ep002: React.FC = () => {
  const t = useT();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <MapView cam={camera(t)}>
        <MapLayers t={t} />
      </MapView>
      <ProjectionOnly cam={camera(t)}>
        <MapHtmlLabels />
      </ProjectionOnly>
      <Overlays t={t} />
      <Captions captions={captions} top={CAPTION_TOP} />
      <Soundtrack voice="voice/ep002.wav" voiceLufs={-16.4} words={captions} track={EP002_TRACK} seconds={EP002_SECONDS} />
      {sfx().map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={2 * fps} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
