// Episode 5 (Kenapa + language): "Kenapa bahasa nasional kita bukan bahasa Jawa?" Built on the locked Ep001V3 template,
// with the "tebak dulu" beat before the big number and an identity question at the end.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import { Soundtrack } from "../components/Soundtrack";
import { Captions, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import ep001 from "../../data/ep001-facts.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, H, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep005-captions.json";
import timing from "./ep005-timing.json";
import { NUM, PT, type SegmentId } from "./ep005-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP005_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP005_TRACK = pickTrack(5, EP005_SECONDS);

const SAFE_BOTTOM = H * 0.8;
const CAPTION_TOP = 1390;
const STAMP_Y = 1250;
const TXT = 54;
const W_HOME = 6200;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};
const fade = (t: number, a: number, b: number, d = 0.3) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));

const E1 = ep001.points as Record<string, { coord: number[] }>;
const HOME = geoInterpolate(E1.idWest.coord as LonLat, E1.idEast.coord as LonLat)(0.5) as LonLat;
const JAVA_C: LonLat = [110, -7.3];

// Java = the largest Natural Earth polygon inside this box
const box = (r: number[][]) => r.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [999, 999, -999, -999]);
const javaRing = (indonesia.geometry.coordinates as number[][][][]).map((p) => p[0]).filter((r) => {
  const b = box(r);
  return b[0] > 104 && b[2] < 116 && b[1] < -7 && b[3] < -5;
}).sort((a, b) => b.length - a.length)[0];
const java: GeoPermissibleObjects = { type: "Polygon", coordinates: [javaRing] as number[][][] };

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: HOME, w: 5900 },
  { t: S.java, c: HOME, w: W_HOME },
  { t: S.java + 1.2, c: JAVA_C, w: 2400 },
  { t: S.tebak, c: JAVA_C, w: 2400 },
  { t: S.tebak + 1.2, c: HOME, w: W_HOME },
  { t: S.levels, c: HOME, w: W_HOME },
  { t: S.levels + 1.0, c: JAVA_C, w: 2400 },
  { t: S.easy + 0.2, c: JAVA_C, w: 2400 },
  { t: S.easy + 1.4, c: HOME, w: W_HOME },
  { t: S.pledge, c: HOME, w: W_HOME },
  { t: S.pledge + 1.2, c: PT.jakarta, w: 2400 },
  { t: S.today, c: PT.jakarta, w: 2400 },
  { t: S.today + 1.2, c: HOME, w: W_HOME },
  { t: 999, c: HOME, w: 6400 },
];
const camera = (t: number): Camera => {
  const i = Math.max(0, KEYS.findIndex((k) => k.t > t) - 1);
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

const T_AMBON = at("trade", "Ambon"), T_MANADO = at("trade", "Manado"), T_KUPANG = at("trade", "Kupang");

const MapLayers: React.FC<{ t: number }> = ({ t }) => {
  const javaOn = fade(t, S.hook + 0.4, S.tebak + 0.8) + fade(t, S.levels, S.easy + 1.2);
  return (
    <>
      <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
      <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.88} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
      <g opacity={Math.min(1, javaOn)}>
        <Geo d={java} fill={C.kunyit} stroke={C.putih} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <g opacity={fade(t, S.easy + 1.0, S.fair + 0.6)}>
        <Route from={PT.malacca} to={PT.ambon} progress={ramp(t, S.trade, T_AMBON + 0.2)} color={C.toska} width={9} />
        <Route from={PT.malacca} to={PT.manado} progress={ramp(t, T_AMBON, T_MANADO + 0.2)} color={C.toska} width={9} />
        <Route from={PT.malacca} to={PT.kupang} progress={ramp(t, T_MANADO, T_KUPANG + 0.3)} color={C.toska} width={9} />
      </g>
      <Pin at={PT.malacca} from={S.trade} to={S.fair + 0.4} color={C.kunyit} r={19} />
      <Pin at={PT.ambon} from={T_AMBON} to={S.fair + 0.4} color={C.toska} r={16} />
      <Pin at={PT.manado} from={T_MANADO} to={S.fair + 0.4} color={C.toska} r={16} />
      <Pin at={PT.kupang} from={T_KUPANG} to={S.fair + 0.4} color={C.toska} r={16} />
      <Pin at={PT.jakarta} from={S.pledge + 1.0} to={S.today + 0.6} color={C.kunyit} r={19} />
    </>
  );
};

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={JAVA_C} from={S.java + 1.0} to={S.tebak} dy={-110} bg={C.kunyit}>Pulau Jawa</L>
    <L at={PT.malacca} from={S.trade} to={S.fair} dy={-150} dx={-40}>Selat Malaka</L>
    <L at={PT.manado} from={T_MANADO} to={S.fair} dy={-90} dx={40} bg={C.toska}>Manado</L>
    <L at={PT.ambon} from={T_AMBON} to={S.fair} dy={-90} dx={120} bg={C.toska}>Ambon</L>
    <L at={PT.kupang} from={T_KUPANG} to={S.fair} dy={85} bg={C.toska}>Kupang</L>
    <L at={PT.jakarta} from={S.pledge + 1.0} to={S.today} dy={-85} bg={C.kunyit}>Jakarta (Batavia)</L>
  </>
);

// percentage bars, to scale
const PctBars: React.FC<{ t: number }> = ({ t }) => {
  const full = 960;
  const rows = [
    { label: "Suku Jawa", v: NUM.javanesePct, text: `${fmt(NUM.javanesePct, 1)}%`, color: C.kunyit, from: at("java", "Empat") },
    { label: "Bahasa ibu Melayu", v: NUM.malayPct, text: "<5%", color: C.toska, from: S.reveal },
  ];
  const k = useLife(at("java", "Empat"), S.levels);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 120, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        const g = ramp(t, r.from, r.from + 0.6);
        if (t < r.from) return null;
        return (
          <div key={r.label} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{r.text}</span>
            </div>
            <div style={{ marginTop: 8, width: (full * r.v * g) / 100, height: 44, borderRadius: 10, background: r.color, border: `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

// speakers today, to scale
const TodayBars: React.FC<{ t: number }> = ({ t }) => {
  const full = 960;
  const rows = [
    { label: "Semua penutur", v: NUM.totalM, color: C.kunyit, from: S.today + 0.1 },
    { label: "Bahasa ibu", v: NUM.nativeM, color: C.toska, from: at("today", "Yang") },
  ];
  const k = useLife(S.today, S.question);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 120, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        const g = ramp(t, r.from, r.from + 0.7);
        if (t < r.from) return null;
        return (
          <div key={r.label} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{Math.round(r.v * g)} juta</span>
            </div>
            <div style={{ marginTop: 8, width: (full * r.v * g) / NUM.totalM, height: 44, borderRadius: 10, background: r.color, border: `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 200, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>?%</div>
  );
};

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.78) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK */}
    <Headline x={W / 2} y={260} from={-0.25} to={S.java} size={100}>
      Kenapa bukan <span style={{ color: C.kunyit }}>bahasa Jawa?</span>
    </Headline>

    {/* JAVA + TEBAK + REVEAL */}
    <PctBars t={t} />
    <Pill x={W / 2} y={STAMP_Y} from={S.java + 0.2} to={at("java", "Empat") + 0.1} size={60} bg={C.kunyit}>Saat merdeka</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={S.reveal} to={S.why + 0.1} size={86}>Kurang dari 5%</Stamp>
    <Pill x={W / 2} y={STAMP_Y} from={S.why + 0.1} to={S.levels} size={60} bg={C.kunyit}>Kok malah terpilih?</Pill>

    {/* LEVELS */}
    <Pill x={W / 2} y={170} from={S.levels} to={S.easy} size={TXT}>1. Bahasa Jawa bertingkat</Pill>
    <Pill x={W / 2} y={300} from={at("levels", "makan")} to={S.easy} size={TXT} bg={C.toska}>"Makan" dalam bahasa Jawa</Pill>
    <Pill x={W / 2} y={STAMP_Y - 110} from={at("levels", "teman")} to={S.easy} size={60}>Ke teman: mangan</Pill>
    <Pill x={W / 2} y={STAMP_Y} from={at("levels", "dihormati")} to={S.easy} size={60} bg={C.kunyit}>Ke yang dihormati: dhahar</Pill>

    {/* EASY */}
    <Pill x={W / 2} y={170} from={S.easy + 0.4} to={S.fair} size={TXT}>2. Melayu gampang dipelajari</Pill>
    <Headline x={W / 2} y={300} from={at("easy", "lebih")} to={S.trade} size={84} color={C.kunyit}>1.000+ tahun</Headline>
    <Pill x={W / 2} y={STAMP_Y} from={at("easy", "lebih") + 0.3} to={S.trade} size={TXT} bg={C.toska}>Bahasa pergaulan</Pill>
    <Stamp x={W / 2} y={1315} from={T_KUPANG + 0.4} to={S.fair} color={C.kunyit} size={66} rotate={-4}>Bahasa pedagang</Stamp>

    {/* FAIR */}
    <Pill x={W / 2} y={300} from={S.fair} to={S.pledge} size={TXT} bg={C.toska}>3. Terasa netral</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("fair", "semua") - 0.1} to={S.pledge} color={C.kunyit} size={80}>Milik semua</Stamp>

    {/* PLEDGE */}
    <Headline x={W / 2} y={190} from={S.pledge} to={S.today} size={110} color={C.kunyit}>28 Oktober 1928</Headline>
    <Pill x={W / 2} y={380} from={at("pledge", "Sumpah")} to={S.today} size={60}>Sumpah Pemuda</Pill>
    <Pill x={W / 2} y={STAMP_Y} from={at("pledge", "Drafnya")} to={at("pledge", "jadilah")} size={60} bg={C.toska}>Draf: bahasa Melayu</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("pledge", "jadilah")} to={S.today} color={C.kunyit} size={74}>Bahasa Indonesia!</Stamp>

    {/* TODAY */}
    <TodayBars t={t} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("today", "delapan")} to={S.question} color={C.kunyit} size={74}>190 juta belajar</Stamp>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={260} from={S.question} to={EP005_SECONDS + 1} size={104}>
      Bahasa daerahmu <span style={{ color: C.kunyit }}>apa?</span>
    </Headline>
    {[["Jawa", 200], ["Sunda", 470], ["Minang", 790]].map(([z, x], i) => (
      <Pill key={z} x={x as number} y={1040} from={S.question + 0.1 + i * 0.08} to={EP005_SECONDS + 1} size={TXT} bg={C.kunyit}>{z}</Pill>
    ))}
    {[["Bugis", 220], ["Batak", 500], ["Lainnya?", 800]].map(([z, x], i) => (
      <Pill key={z} x={x as number} y={1150} from={S.question + 0.3 + i * 0.08} to={EP005_SECONDS + 1} size={TXT} bg={C.kunyit}>{z}</Pill>
    ))}
    <Pill x={W / 2} y={1285} from={at("question", "Tulis")} to={EP005_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const sfx = (): { at: number; name: string; vol: number }[] => [
  { at: 0, name: "rise", vol: 0.25 },
  { at: S.java + 0.2, name: "whoosh", vol: 0.45 },
  { at: at("java", "Empat"), name: "pop", vol: 0.35 },
  { at: at("tebak", "Tebak"), name: "pop", vol: 0.35 },
  { at: E.tebak - 0.9, name: "rise", vol: 0.3 },
  { at: S.reveal, name: "stamp", vol: 0.5 },
  { at: at("levels", "teman"), name: "pop", vol: 0.35 },
  { at: at("levels", "dihormati"), name: "pop", vol: 0.35 },
  { at: T_AMBON, name: "pop", vol: 0.35 },
  { at: T_MANADO, name: "pop", vol: 0.35 },
  { at: T_KUPANG, name: "pop", vol: 0.35 },
  { at: S.pledge + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("pledge", "jadilah"), name: "stamp", vol: 0.5 },
  { at: S.question, name: "pop", vol: 0.35 },
];

export const Ep005: React.FC = () => {
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
      <Soundtrack voice="voice/ep005.wav" voiceLufs={-16.6} words={captions} track={EP005_TRACK} seconds={EP005_SECONDS} />
      {sfx().map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={2 * fps} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
