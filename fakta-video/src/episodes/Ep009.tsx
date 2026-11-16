// Episode 9 (animals): Komodo lives on only 5 islands. Built on the locked template, from Ep006.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Geo, MapView, ProjectionOnly, type Camera } from "../components/MapView";
import { Soundtrack } from "../components/Soundtrack";
import { Captions, Counter, Flag, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import ep001 from "../../data/ep001-facts.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, H, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep009-captions.json";
import timing from "./ep009-timing.json";
import { NUM, PT, type SegmentId } from "./ep009-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP009_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP009_TRACK = pickTrack(9, EP009_SECONDS);

const SAFE_BOTTOM = H * 0.8;
const CAPTION_TOP = 1390;
const STAMP_Y = 1250;
const TXT = 54;
const W_HOME = 6200;
const W_ISL = 240;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

const P = ep001.points as Record<string, { coord: number[] }>;
const HOME = geoInterpolate(P.idWest.coord as LonLat, P.idEast.coord as LonLat)(0.5) as LonLat;
const ISL: LonLat = [119.7, -8.66];

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: HOME, w: W_HOME },
  { t: at("hook", "Indonesia") - 0.2, c: HOME, w: W_HOME },
  { t: S.islands + 0.4, c: ISL, w: W_ISL },
  { t: S.payoff + 0.6, c: ISL, w: W_ISL },
  { t: S.payoff + 2.0, c: HOME, w: W_HOME },
  { t: 999, c: HOME, w: 6400 },
];
const camera = (t: number): Camera => {
  const i = Math.max(0, KEYS.findIndex((k) => k.t > t) - 1);
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

const ISLANDS: { key: keyof typeof PT; word: string; nth?: number }[] = [
  { key: "komodo", word: "Komodo" },
  { key: "rinca", word: "Rinca" },
  { key: "flores", word: "Flores" },
  { key: "giliMotang", word: "Motang" },
  { key: "giliDasami", word: "Dasami" },
];

const MapLayers: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.75} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
    {/* hook: one pin on NTT while the map is wide */}
    <Pin at={ISL} from={at("hook", "lima")} to={S.islands + 0.3} color={C.kunyit} r={18} />
    {/* the five islands */}
    {ISLANDS.map((s) => (
      <Pin key={s.key} at={PT[s.key]} from={at("islands", s.word)} to={S.payoff + 1.2} color={C.kunyit} r={12} />
    ))}
    {/* Padar: none since the 1970s */}
    <Pin at={PT.padar} from={at("padar", "Padar")} to={S.virgin + 0.2} color={C.toska} r={12} />
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={ISL} from={at("hook", "lima")} to={S.islands + 0.2} dy={-90}>NTT</L>
    <L at={PT.komodo} from={at("islands", "Komodo")} to={S.find} dx={-120} dy={-130}>Komodo</L>
    <L at={PT.rinca} from={at("islands", "Rinca")} to={S.find} dx={-170} dy={150}>Rinca</L>
    <L at={PT.flores} from={at("islands", "Flores")} to={S.find} dx={130} dy={-150}>Flores</L>
    <L at={PT.giliMotang} from={at("islands", "Motang")} to={S.find} dx={120} dy={130}>Gili Motang</L>
    <L at={PT.giliDasami} from={at("islands", "Dasami")} to={S.find} dx={260} dy={10}>Gili Dasami</L>
    <L at={PT.padar} from={at("padar", "Padar") + 0.1} to={S.virgin} dx={-60} dy={-110} bg={C.toska}>Padar</L>
  </>
);

// the "tebak dulu" beat: a big "? KM²" that the reveal replaces
const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 200, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>? KM²</div>
  );
};

// to-scale bars
type Row = { label: string; n: number; color: string; from: number; unit: string };
const Bars: React.FC<{ t: number; rows: Row[]; from: number; to: number; top?: number }> = ({ t, rows, from, to, top = 130 }) => {
  const full = 960, max = Math.max(...rows.map((r) => r.n));
  const k = useLife(from, to);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        const g = ramp(t, r.from, r.from + 0.7);
        if (t < r.from) return null;
        return (
          <div key={r.label} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{fmt(r.n * g)} {r.unit}</span>
            </div>
            <div style={{ marginTop: 8, width: (full * r.n * g) / max, height: 44, borderRadius: 6, background: r.color, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

const ISLAND_PILLS: [string, number, number][] = [
  ["Flores", 230, 1040], ["Jawa", 660, 1040],
  ["Sumatra", 250, 1150], ["Sulawesi", 680, 1150],
];

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.78) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK: the number in the first second */}
    <Headline x={W / 2} y={230} from={-0.25} to={S.islands} size={100}>
      Kadal terbesar: <span style={{ color: C.kunyit }}>cuma 5 pulau</span>
    </Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("hook", "Indonesia")} to={S.islands} color={C.kunyit} size={80}>Semua di Indonesia</Stamp>

    {/* ISLANDS */}
    <Headline x={W / 2} y={200} from={S.islands} to={S.find} size={130} color={C.kunyit}>5 pulau</Headline>
    <Pill x={W / 2} y={340} from={at("islands", "Nusa")} to={S.find} size={TXT}>Nusa Tenggara Timur</Pill>

    {/* FIND */}
    <Headline x={W / 2} y={190} from={S.find} to={S.size} size={150} color={C.kunyit}>1910</Headline>
    <Pill x={W / 2} y={340} from={S.find + 0.3} to={S.size} size={TXT}>Dicatat ilmuwan Barat</Pill>

    {/* SIZE */}
    <Counter x={W / 2} y={230} from={S.size} to={S.meal} a={0} b={NUM.lengthM} t0={S.size + 0.1} t1={at("size", "meter")} unit=" M" size={160} />
    <Pill x={W / 2} y={STAMP_Y} from={at("size", "Beratnya")} to={S.meal} size={TXT} bg={C.toska}>Biasanya ±70 kg</Pill>

    {/* MEAL */}
    <Counter x={W / 2} y={230} from={S.meal} to={S.nose} a={0} b={NUM.mealPct} t0={at("meal", "delapan")} t1={at("meal", "berat")} unit=" %" size={160} />
    <Pill x={W / 2} y={380} from={at("meal", "menghabiskan")} to={S.nose} size={TXT}>Dari berat badannya</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("meal", "sekali")} to={S.nose} size={80}>Sekali makan!</Stamp>

    {/* NOSE */}
    <Counter x={W / 2} y={230} from={S.nose} to={S.tebak} a={0} b={NUM.smellKm} t0={at("nose", "empat")} t1={at("nose", "kilometer") + 0.3} unit=" KM" size={160} />
    <Pill x={W / 2} y={380} from={at("nose", "Bau")} to={S.tebak} size={TXT} bg={C.toska}>Bau makanan tercium</Pill>

    {/* TEBAK DULU */}
    <Headline x={W / 2} y={200} from={S.tebak} to={at("tebak", "Tebak")} size={110}>Rumahnya kecil</Headline>
    <Pill x={W / 2} y={170} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "daratan")} to={S.reveal} size={TXT}>Daratan TN Komodo</Pill>

    {/* REVEAL: to-scale bars */}
    <Bars t={t} from={S.reveal} to={S.padar} rows={[
      { label: "TN Komodo (darat)", n: NUM.parkLandKm2, color: C.kunyit, from: S.reveal, unit: "km²" },
      { label: "Jakarta", n: NUM.jakartaKm2, color: C.toska, from: at("reveal", "Jakarta") - 0.2, unit: "km²" },
    ]} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("reveal", "Lebih")} to={S.padar} color={C.kunyit} size={74}>Lebih kecil!</Stamp>

    {/* PADAR */}
    <Headline x={W / 2} y={190} from={S.padar} to={at("padar", "Di")} size={116} color={C.koral}>Tapi tunggu…</Headline>
    <Headline x={W / 2} y={200} from={at("padar", "Di")} to={S.virgin} size={100}>Padar: <span style={{ color: C.toska }}>nggak ada lagi</span></Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("padar", "sejak")} to={S.virgin} size={80}>Sejak 1970-an</Stamp>

    {/* VIRGIN BIRTH */}
    <Headline x={W / 2} y={170} from={S.virgin} to={at("virgin", "Komodo")} size={116}>Satu lagi…</Headline>
    <Headline x={W / 2} y={200} from={at("virgin", "Komodo")} to={S.status} size={96}>
      Betina punya anak <span style={{ color: C.kunyit }}>tanpa pejantan</span>
    </Headline>
    <Pill x={W / 2} y={STAMP_Y} from={at("virgin", "Ini")} to={S.status} size={TXT} icon={<Flag code="gb" h={46} />}>2 kebun binatang</Pill>

    {/* STATUS */}
    <Headline x={W / 2} y={190} from={S.status} to={S.payoff} size={150} color={C.kunyit}>2021</Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("status", "terancam")} to={S.payoff} size={78}>Terancam punah</Stamp>
    <Pill x={W / 2} y={350} from={at("status", "Air")} to={S.payoff} size={TXT} bg={C.toska}>Air laut naik</Pill>

    {/* PAYOFF */}
    <Pill x={W / 2} y={180} from={S.payoff + 0.2} to={S.question} size={TXT} bg={C.toska}>Taman nasional: stabil</Pill>
    <Headline x={W / 2} y={370} from={at("payoff", "Rumah")} to={S.question} size={92}>
      Rumahnya cuma <span style={{ color: C.kunyit }}>di Indonesia</span>
    </Headline>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={260} from={S.question} to={EP009_SECONDS + 1} size={100}>
      Kamu dari <span style={{ color: C.kunyit }}>pulau mana?</span>
    </Headline>
    {ISLAND_PILLS.map(([name, x, y], i) => (
      <Pill key={name} x={x} y={y} from={S.question + 0.1 + i * 0.08} to={EP009_SECONDS + 1} size={TXT} bg={C.kunyit}>{name}</Pill>
    ))}
    <Pill x={W / 2} y={1285} from={at("question", "Tulis")} to={EP009_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const sfx = (): { at: number; name: string; vol: number }[] => [
  { at: 0, name: "rise", vol: 0.2 },
  { at: at("hook", "Indonesia"), name: "stamp", vol: 0.32 },
  { at: S.islands, name: "whoosh", vol: 0.32 },
  { at: S.find, name: "pop", vol: 0.27 },
  { at: S.size, name: "pop", vol: 0.27 },
  { at: at("meal", "sekali"), name: "stamp", vol: 0.32 },
  { at: S.nose, name: "pop", vol: 0.27 },
  { at: E.tebak - 0.9, name: "rise", vol: 0.24 },
  { at: S.reveal, name: "stamp", vol: 0.32 },
  { at: at("padar", "sejak"), name: "stamp", vol: 0.32 },
  { at: S.virgin, name: "whoosh", vol: 0.32 },
  { at: at("status", "terancam"), name: "stamp", vol: 0.24 },
  { at: S.payoff + 0.6, name: "whoosh", vol: 0.32 },
  { at: S.question, name: "pop", vol: 0.27 },
];

export const Ep009: React.FC = () => {
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
      <Soundtrack voice="voice/ep009.wav" voiceLufs={-16.2} words={captions} track={EP009_TRACK} seconds={EP009_SECONDS} />
      {sfx().map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={2 * fps} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
