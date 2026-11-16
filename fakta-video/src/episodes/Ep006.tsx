// Episode 6 (animals): the Wallace Line, Bali and Lombok. Built on the locked template, from Ep004.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import { Soundtrack } from "../components/Soundtrack";
import { Captions, Counter, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import ep001 from "../../data/ep001-facts.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, H, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep006-captions.json";
import timing from "./ep006-timing.json";
import { LINE, NUM, PT, type SegmentId } from "./ep006-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP006_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP006_TRACK = pickTrack(6, EP006_SECONDS);

const SAFE_BOTTOM = H * 0.8;
const CAPTION_TOP = 1390;
const STAMP_Y = 1250;
const TXT = 54;
const W_HOME = 6200;
const W_STRAIT = 700;
const W_ASIA = 4600;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};
const fade = (t: number, a: number, b: number, d = 0.3) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));

const P = ep001.points as Record<string, { coord: number[] }>;
const HOME = geoInterpolate(P.idWest.coord as LonLat, P.idEast.coord as LonLat)(0.5) as LonLat;
const STRAIT = PT.strait;
const ASIA_VIEW: LonLat = [108, 2];
const WEST_BALI: LonLat = [114.6, -8.2];

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: STRAIT, w: W_STRAIT },
  { t: S.ship + 0.1, c: STRAIT, w: W_STRAIT },
  { t: S.ship + 1.2, c: HOME, w: W_HOME },
  { t: E.ship - 0.3, c: HOME, w: W_HOME },
  { t: S.bali + 0.5, c: STRAIT, w: W_STRAIT },
  { t: S.line, c: STRAIT, w: W_STRAIT },
  { t: S.line + 1.0, c: HOME, w: W_HOME },
  { t: E.reveal, c: HOME, w: W_HOME },
  { t: S.land + 0.8, c: ASIA_VIEW, w: W_ASIA },
  { t: E.land - 0.2, c: ASIA_VIEW, w: W_ASIA },
  { t: S.twist + 0.8, c: STRAIT, w: W_STRAIT },
  { t: S.payoff, c: STRAIT, w: W_STRAIT },
  { t: S.payoff + 1.0, c: HOME, w: W_HOME },
  { t: 999, c: HOME, w: 6400 },
];
const camera = (t: number): Camera => {
  const i = Math.max(0, KEYS.findIndex((k) => k.t > t) - 1);
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

// the line draws itself, one segment after another
const WallaceLine: React.FC<{ t: number }> = ({ t }) => {
  const a = at("line", "garis"), b = at("line", "Barat") - 0.1;
  const n = LINE.length - 1;
  return (
    <>
      {LINE.slice(0, n).map((p, i) => (
        <Route key={i} from={p} to={LINE[i + 1]} progress={ramp(t, a + ((b - a) * i) / n, a + ((b - a) * (i + 1)) / n, (x) => x)} color={C.kunyit} width={9} glow={false} />
      ))}
    </>
  );
};

const MapLayers: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.75} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
    {/* the crossing */}
    <g opacity={fade(t, 0.2, S.ship + 0.3)}>
      <Route from={PT.bali} to={PT.lombok} progress={ramp(t, 0.3, at("hook", "kilometer"))} color={C.kunyit} width={10} />
    </g>
    {/* no direct ship; the way round */}
    <g opacity={fade(t, S.ship + 1.0, S.bali + 0.2)}>
      <Route from={PT.singapore} to={PT.makassar} progress={ramp(t, S.ship + 1.2, at("ship", "Makassar"))} color={C.toska} width={9} dash="0.03 0.025" />
      <Route from={PT.singapore} to={PT.bali} progress={ramp(t, at("ship", "Terpaksa"), E.ship)} color={C.kunyit} width={10} />
    </g>
    <WallaceLine t={t} />
    {/* on foot, down to Bali */}
    <g opacity={fade(t, S.land + 0.4, S.twist + 0.4)}>
      <Route from={PT.asia} to={PT.sumatra} progress={ramp(t, S.land + 0.6, at("land", "Jawa") + 0.4)} color={C.toska} width={10} />
      <Route from={PT.sumatra} to={PT.java} progress={ramp(t, at("land", "Jawa") + 0.4, at("land", "Bali") + 0.1)} color={C.toska} width={10} />
      <Route from={PT.java} to={PT.bali} progress={ramp(t, at("land", "Bali") + 0.1, at("land", "Bali", 1))} color={C.toska} width={10} />
    </g>
    <Pin at={PT.bali} from={0.1} to={S.ship + 0.4} color={C.kunyit} r={16} />
    <Pin at={PT.lombok} from={0.2} to={S.ship + 0.4} color={C.toska} r={16} />
    <Pin at={PT.singapore} from={S.ship + 1.0} to={S.bali + 0.2} color={C.kunyit} r={15} />
    <Pin at={PT.makassar} from={S.ship + 1.0} to={S.bali + 0.2} color={C.toska} r={15} />
    <Pin at={WEST_BALI} from={at("wall", "kakatua")} to={S.payoff} color={C.toska} r={15} />
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={PT.bali} from={0.2} to={S.ship + 0.4} dx={-30} dy={-105}>Bali</L>
    <L at={PT.lombok} from={0.3} to={S.ship + 0.4} dx={50} dy={105} bg={C.toska}>Lombok</L>
    <L at={PT.singapore} from={S.ship + 1.2} to={S.bali + 0.1} dy={-85}>Singapura</L>
    <L at={PT.makassar} from={S.ship + 1.2} to={S.bali + 0.1} dy={-85} bg={C.toska}>Makassar</L>
    <L at={PT.bali} from={S.bali + 0.4} to={S.line} dx={-30} dy={-105}>Bali</L>
    <L at={PT.lombok} from={S.bali + 0.4} to={S.line} dx={50} dy={105} bg={C.toska}>Lombok</L>
    <L at={PT.sumatra} from={S.animals} to={S.tebak} dy={120} dx={-40}>Gajah</L>
    <L at={PT.borneo} from={at("animals", "orangutan")} to={S.tebak} dy={-85} dx={-70}>Orangutan</L>
    <L at={PT.sulawesi} from={at("animals", "Kuskus")} to={S.tebak} dy={-105} dx={170} bg={C.toska}>Kuskus</L>
    <L at={PT.papua} from={at("animals", "kanguru")} to={S.tebak} dy={125} bg={C.toska}>Kanguru pohon</L>
    <L at={PT.bali} from={S.twist + 0.7} to={S.payoff} dx={-30} dy={-105}>Bali</L>
    <L at={PT.lombok} from={S.twist + 0.7} to={S.payoff} dx={50} dy={105} bg={C.toska}>Lombok</L>
  </>
);

// the "tebak dulu" beat: a big "? m" that the reveal replaces
const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 240, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 220, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>? M</div>
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

const ANIMALS: [string, number, number][] = [
  ["Komodo", 215, 1040], ["Orangutan", 680, 1040],
  ["Anoa", 170, 1150], ["Cenderawasih", 610, 1150],
];

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.78) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK */}
    <Headline x={W / 2} y={230} from={-0.25} to={S.ship} size={100}>
      Cuma ±35 km, <span style={{ color: C.kunyit }}>hewannya beda dunia</span>
    </Headline>

    {/* SHIP */}
    <Headline x={W / 2} y={190} from={S.ship} to={S.bali} size={150} color={C.kunyit}>1856</Headline>
    <Pill x={W / 2} y={340} from={S.ship + 0.3} to={S.bali} size={TXT}>Alfred Wallace</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("ship", "Makassar") - 0.3} to={S.bali} color={C.toska} size={68}>Nggak ada kapal</Stamp>

    {/* BIRDS */}
    <Pill x={W / 2} y={190} from={S.bali + 0.2} to={S.lombok} size={TXT} bg={C.kunyit}>Bali: takur, pelatuk</Pill>
    <Pill x={W / 2} y={190} from={S.lombok} to={S.bogor} size={TXT} bg={C.toska}>Lombok: semua hilang</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("lombok", "kakatua") - 0.1} to={S.bogor} color={C.kunyit} size={86}>Malah kakatua!</Stamp>

    {/* BOGOR */}
    <Bars t={t} from={S.bogor} to={S.line} rows={[
      { label: "Bali–Lombok", n: NUM.km, color: C.kunyit, from: S.bogor, unit: "km" },
      { label: "Jakarta–Bogor", n: NUM.jakartaBogorKm, color: C.toska, from: at("bogor", "Jakarta"), unit: "km" },
    ]} />

    {/* LINE */}
    <Headline x={W / 2} y={190} from={S.line + 0.4} to={S.animals} size={110} color={C.kunyit}>Garis Wallace</Headline>
    <Pill x={225} y={STAMP_Y} from={at("line", "Barat")} to={S.tebak} size={TXT} bg={C.kunyit}>Hewan Asia</Pill>
    <Pill x={765} y={STAMP_Y} from={at("line", "Timur")} to={S.tebak} size={TXT} bg={C.toska}>Hewan Australia</Pill>

    {/* TEBAK DULU */}
    <Headline x={W / 2} y={190} from={S.tebak} to={at("tebak", "Tebak")} size={110}>Kenapa bisa?</Headline>
    <Pill x={W / 2} y={170} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "Di")} to={S.reveal} size={TXT}>Laut turun, zaman es</Pill>

    {/* REVEAL */}
    <Counter x={W / 2} y={320} from={S.reveal} to={S.land} a={1} b={NUM.seaDropM} t0={S.reveal} t1={at("reveal", "meter")} unit=" M" size={200} />

    {/* LAND */}
    <Pill x={W / 2} y={190} from={S.land + 0.3} to={S.twist} size={TXT} bg={C.toska}>Nyambung ke Asia</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("land", "jalan")} to={S.twist} color={C.kunyit} size={74}>Jalan kaki</Stamp>

    {/* TWIST + GAP: the two depths to scale */}
    <Headline x={W / 2} y={190} from={S.twist} to={at("twist", "Selat")} size={116} color={C.koral}>Tapi tunggu…</Headline>
    <Bars t={t} from={at("twist", "Selat")} to={S.wall} rows={[
      { label: "Selat Lombok, min.", n: NUM.straitMinM, color: C.koral, from: at("twist", "Selat"), unit: "m" },
      { label: "Laut turun", n: NUM.seaDropM, color: C.toska, from: S.gap, unit: "m" },
    ]} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("gap", "putus") - 0.2} to={S.wall} size={86}>Jalan putus</Stamp>

    {/* NOT A WALL */}
    <Stamp x={W / 2} y={230} from={S.wall} to={S.payoff} color={C.kunyit} size={80}>Bukan tembok</Stamp>
    <Pill x={W / 2} y={370} from={at("wall", "Kelelawar")} to={S.payoff} size={TXT}>Kelelawar menyeberang</Pill>
    <Pill x={W / 2} y={STAMP_Y} from={at("wall", "kakatua")} to={S.payoff} size={TXT} bg={C.toska}>Sedikit kakatua di sini</Pill>

    {/* PAYOFF */}
    <Headline x={W / 2} y={250} from={at("payoff", "satu")} to={S.question} size={92}>
      Satu negara, <span style={{ color: C.kunyit }}>dua dunia hewan</span>
    </Headline>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={260} from={S.question} to={EP006_SECONDS + 1} size={100}>
      Hewan khas <span style={{ color: C.kunyit }}>daerahmu apa?</span>
    </Headline>
    {ANIMALS.map(([name, x, y], i) => (
      <Pill key={name} x={x} y={y} from={S.question + 0.1 + i * 0.08} to={EP006_SECONDS + 1} size={TXT} bg={C.kunyit}>{name}</Pill>
    ))}
    <Pill x={W / 2} y={1285} from={at("question", "Tulis")} to={EP006_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const sfx = (): { at: number; name: string; vol: number }[] => [
  { at: 0, name: "rise", vol: 0.25 },
  { at: S.ship + 0.1, name: "whoosh", vol: 0.45 },
  { at: S.bali + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("lombok", "kakatua") - 0.1, name: "stamp", vol: 0.5 },
  { at: S.bogor, name: "pop", vol: 0.35 },
  { at: S.line, name: "whoosh", vol: 0.45 },
  { at: E.tebak - 0.9, name: "rise", vol: 0.3 },
  { at: S.reveal, name: "stamp", vol: 0.5 },
  { at: S.land + 0.1, name: "whoosh", vol: 0.45 },
  { at: E.land - 0.1, name: "whoosh", vol: 0.45 },
  { at: at("gap", "putus") - 0.2, name: "stamp", vol: 0.5 },
  { at: S.wall, name: "stamp", vol: 0.4 },
  { at: S.payoff, name: "whoosh", vol: 0.45 },
  { at: S.question, name: "pop", vol: 0.35 },
];

export const Ep006: React.FC = () => {
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
      <Soundtrack voice="voice/ep006.wav" voiceLufs={-16.4} words={captions} track={EP006_TRACK} seconds={EP006_SECONDS} />
      {sfx().map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={2 * fps} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
