// Episode 14 (language): "700+ bahasa: Indonesia nomor dua di dunia". Built on the locked template (from Ep013),
// captions v2 + SfxLayer2 + v2 mix. One map shot: Indonesia (Sabang -> Merauke) -> Papua -> back out.
import type { Caption } from "@remotion/captions";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { Geo, MapView, ProjectionOnly, type Camera } from "../components/MapView";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep014-captions.json";
import timing from "./ep014-timing.json";
import { KEYS, NUM, PT, type SegmentId } from "./ep014-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP014_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP014_TRACK = pickTrack(14, EP014_SECONDS);

const SAFE_BOTTOM = 1536;
const STAMP_Y = 1170;
const TXT = 54;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
// nth spoken occurrence of a word in a segment; falls back to the segment start if Whisper missed the word
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

// --- camera -----------------------------------------------------------------------------------------------------
const HOME = geoInterpolate(PT.sabang, PT.merauke)(0.5) as LonLat;
const PAPUA_CAM: LonLat = [137.5, -4.2];
type Key = { t: number; c: LonLat; w: number };
const CAM: Key[] = [
  { t: 0, c: HOME, w: 6350 },
  { t: S.papua - 0.2, c: HOME, w: 6250 },
  { t: S.papua + 1.4, c: PAPUA_CAM, w: 2900 },
  { t: S.share - 0.2, c: PAPUA_CAM, w: 2900 },
  { t: S.share + 1.4, c: HOME, w: 6250 },
  { t: 999, c: HOME, w: 6350 },
];
const ZOOMS = [S.papua, S.share];
const camera = (t: number): Camera => {
  const i = Math.max(0, CAM.findIndex((k) => k.t > t) - 1);
  const a = CAM[i], b = CAM[Math.min(i + 1, CAM.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

const MapLayers: React.FC = () => (
  <>
    <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.8} />
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.5} stroke={C.putih} strokeWidth={2.2} strokeLinejoin="round" />
    <Pin at={PT.sabang} from={at("name", "Sabang")} to={S.count} color={C.kunyit} r={16} />
    <Pin at={PT.merauke} from={at("name", "Merauke")} to={S.count} color={C.toska} r={16} />
    <Pin at={PT.papua} from={at("papua", "Papua")} to={S.share + 2.2} color={C.kunyit} r={18} />
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={PT.sabang} from={at("name", "Sabang")} to={S.count} dy={-80} bg={C.kunyit}>Sabang</L>
    <L at={PT.merauke} from={at("name", "Merauke")} to={S.count} dy={85} bg={C.toska}>Merauke</L>
    <L at={PT.papua} from={at("papua", "Papua")} to={S.share + 2.2} dy={-85} bg={C.kunyit}>Papua</L>
  </>
);

// to-scale bars (horizontal): label left, value right
type Row = { label: string; v: number; unit: string; color: string; from: number };
const Bars: React.FC<{ t: number; rows: Row[]; max: number; from: number; to: number; top?: number }> = ({ t, rows, max, from, to, top = 330 }) => {
  const full = 960;
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
              <span style={{ color: r.color }}>{fmt(r.v * g, 0)} {r.unit}</span>
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

const LANGS: [string, number, number][] = [
  ["Jawa", 290, 1000], ["Sunda", 790, 1000],
  ["Batak", 290, 1110], ["Bugis", 790, 1110],
];

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.8) 0%, rgba(7,6,13,0.2) 30%, rgba(7,6,13,0.2) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK: a number on screen in the first second */}
    <Counter x={W / 2} y={200} from={-0.2} to={S.name} a={0} b={NUM.total} t0={0} t1={1.4} unit=" BAHASA" size={150} />
    <Pill x={W / 2} y={360} from={0.2} to={S.name} size={TXT} bg={C.kunyit}>Satu negara: Indonesia</Pill>

    {/* NAME */}
    <Headline x={W / 2} y={200} from={S.name} to={S.count} size={104} color={C.kunyit}>Sabang–Merauke</Headline>
    <Pill x={W / 2} y={350} from={at("name", "ratusan")} to={S.count} size={TXT}>Ratusan cara bilang halo</Pill>

    {/* COUNT */}
    <Headline x={W / 2} y={200} from={S.count} to={S.tebak} size={110} color={C.kunyit}>718 bahasa</Headline>
    <Pill x={W / 2} y={350} from={at("count", "Badan")} to={S.tebak} size={TXT}>Badan Bahasa, 2019</Pill>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={150} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "nomor")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Nomor berapa di dunia?</Pill>

    {/* REVEAL + THIRD: bars to scale (Ethnologue) */}
    <Headline x={W / 2} y={190} from={S.reveal} to={S.papua} size={112} color={C.kunyit}>Nomor 2 dunia!</Headline>
    <Bars t={t} max={NUM.png} from={S.reveal + 0.2} to={S.papua} rows={[
      { label: "Papua Nugini", v: NUM.png, unit: "bahasa", color: C.toska, from: at("reveal", "Papua") - 0.1 },
      { label: "Indonesia", v: NUM.idn, unit: "bahasa", color: C.koral, from: S.reveal + 0.2 },
      { label: "Nigeria", v: NUM.nga, unit: "bahasa", color: C.kunyit, from: at("third", "Nigeria") - 0.1 },
    ]} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("reveal", "Nomor")} to={S.third} color={C.kunyit} size={84}>Nomor dua</Stamp>

    {/* PAPUA */}
    <Headline x={W / 2} y={170} from={S.papua} to={at("papua", "menyimpan")} size={110} color={C.koral}>Tapi tunggu…</Headline>
    <Counter x={W / 2} y={200} from={at("papua", "menyimpan")} to={S.share} a={0} b={NUM.papua} t0={at("papua", "menyimpan")} t1={at("papua", "bahasa", 0) + 0.2} unit=" BAHASA" size={150} />
    <Pill x={W / 2} y={360} from={at("papua", "menyimpan")} to={S.share} size={TXT} bg={C.kunyit}>Cuma di Papua</Pill>

    {/* SHARE: 428 of 718, to scale */}
    <Headline x={W / 2} y={170} from={S.share} to={S.question} size={116} color={C.kunyit}>±{fmt(NUM.sharePct, 1)}%</Headline>
    <Bars t={t} max={NUM.total} from={S.share + 0.2} to={S.question} top={300} rows={[
      { label: "Semua bahasa daerah", v: NUM.total, unit: "", color: C.toska, from: S.share + 0.2 },
      { label: "Papua", v: NUM.papua, unit: "", color: C.kunyit, from: at("share", "enam") - 0.2 },
    ]} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("share", "enam")} to={S.question} color={C.koral} size={70}>428 ÷ 718</Stamp>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={EP014_SECONDS + 1} size={96}>
      Bahasa <span style={{ color: C.kunyit }}>daerahmu apa?</span>
    </Headline>
    {LANGS.map(([name, x, y], i) => (
      <Pill key={name} x={x} y={y} from={S.question + 0.25 + i * 0.08} to={EP014_SECONDS + 1} size={TXT} bg={C.kunyit}>{name}</Pill>
    ))}
    <Pill x={W / 2} y={STAMP_Y + 80} from={at("question", "Tulis")} to={EP014_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "papua").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("reveal", "Nomor"), name: "impact" as const },
  { at: at("share", "enam"), name: "pop" as const },
];

export const Ep014: React.FC = () => {
  const t = useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [at("name", "Sabang"), at("name", "Merauke"), at("papua", "Papua"), S.question + 0.25];
  const counts: [number, number][] = [[0, 1.4], [at("papua", "menyimpan"), at("papua", "bahasa", 0) + 0.2]];
  const lands = [at("reveal", "Nomor"), at("share", "enam")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <MapView cam={camera(t)}>
          <MapLayers />
        </MapView>
        <ProjectionOnly cam={camera(t)}>
          <MapHtmlLabels />
        </ProjectionOnly>
        <Overlays t={t} />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep014.wav" voiceLufs={-16.2} words={captions} track={EP014_TRACK} seconds={EP014_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP014_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: ZOOMS, icons, counts, lands }} />
    </AbsoluteFill>
  );
};
