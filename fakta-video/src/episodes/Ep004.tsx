// Episode 4 (history): "Manhattan pernah 'ditukar' pulau kecil di Maluku?" Built on the locked Ep001V3 template.
// New from Ep004 (owner's rule): a "tebak dulu" beat before the big number and an identity question at the end.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import { Soundtrack } from "../components/Soundtrack";
import { Captions, Counter, Flag, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import ep001 from "../../data/ep001-facts.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, H, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep004-captions.json";
import timing from "./ep004-timing.json";
import { NUM, PT, type SegmentId } from "./ep004-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP004_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP004_TRACK = pickTrack(4, EP004_SECONDS);

const SAFE_BOTTOM = H * 0.8;
const CAPTION_TOP = 1390;
const STAMP_Y = 1250;
const TXT = 54;
const W_HOME = 6200;
const W_GLOBE = 21000;
const W_BANDA = 2200;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};
const fade = (t: number, a: number, b: number, d = 0.3) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));

const P = ep001.points as Record<string, { coord: number[] }>;
const HOME = geoInterpolate(P.idWest.coord as LonLat, P.idEast.coord as LonLat)(0.5) as LonLat;
const RUN = PT.run, NY = PT.manhattan, GD = PT.grenada;
const ARCTIC = geoInterpolate(RUN, NY)(0.5) as LonLat; // midpoint over the pole: both ends visible on one globe
const INDIAN: LonLat = [105, 2];
const T_GRENADA = at("twist", "Grenada");

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: RUN, w: W_BANDA },
  { t: S.run + 0.2, c: RUN, w: W_BANDA },
  { t: S.tebak, c: HOME, w: W_HOME },
  { t: S.english - 0.2, c: HOME, w: W_HOME },
  { t: S.english + 1.0, c: RUN, w: W_BANDA },
  { t: S.newyork, c: RUN, w: W_BANDA },
  { t: S.newyork + 0.9, c: ARCTIC, w: W_GLOBE },
  { t: S.newyork + 2.0, c: NY, w: 5000 },
  { t: S.breda, c: NY, w: 5000 },
  { t: S.breda + 1.2, c: ARCTIC, w: W_GLOBE },
  { t: E.win, c: ARCTIC, w: W_GLOBE },
  { t: S.twist + 1.4, c: INDIAN, w: 13000 },
  { t: T_GRENADA - 0.1, c: INDIAN, w: 13000 },
  { t: T_GRENADA + 0.9, c: [20, 15], w: W_GLOBE },
  { t: T_GRENADA + 1.9, c: GD, w: 5000 },
  { t: S.banda, c: GD, w: 5000 },
  { t: S.banda + 0.8, c: [20, 15], w: W_GLOBE },
  { t: S.banda + 1.8, c: RUN, w: W_BANDA },
  { t: S.question - 0.3, c: RUN, w: W_BANDA },
  { t: S.question + 0.5, c: HOME, w: W_HOME },
  { t: 999, c: HOME, w: 6400 },
];
const camera = (t: number): Camera => {
  const i = Math.max(0, KEYS.findIndex((k) => k.t > t) - 1);
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

const MapLayers: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.88} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
    {/* the exchange, over the Arctic */}
    <g opacity={fade(t, S.breda + 0.8, S.twist + 0.3)}>
      <Route from={NY} to={RUN} progress={ramp(t, S.breda + 1.0, at("breda", "Run"))} color={C.kunyit} width={11} />
    </g>
    {/* the trees leave: Banda -> Ceylon */}
    <g opacity={fade(t, S.twist + 0.6, T_GRENADA + 0.6)}>
      <Route from={RUN} to={PT.ceylon} progress={ramp(t, S.twist + 1.0, T_GRENADA - 0.2)} color={C.toska} width={10} />
    </g>
    <Pin at={RUN} from={0.1} to={EP004_SECONDS + 1} color={C.kunyit} r={19} />
    <Pin at={NY} from={S.newyork + 1.2} to={S.twist + 0.3} color={C.toska} r={19} />
    <Pin at={PT.ceylon} from={at("twist", "Ceylon")} to={T_GRENADA + 0.6} color={C.toska} r={17} />
    <Pin at={GD} from={T_GRENADA} to={S.banda + 0.4} color={C.toska} r={19} />
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={RUN} from={0.2} to={S.tebak} dy={-85}>Pulau Run</L>
    <L at={RUN} from={S.english + 1.0} to={S.newyork} dy={-85}>Pulau Run</L>
    <L at={NY} from={S.newyork + 1.8} to={S.breda + 0.6} dy={-85} bg={C.toska}>New Amsterdam</L>
    <L at={NY} from={S.breda + 1.0} to={S.twist} dy={85} bg={C.toska}>Manhattan</L>
    <L at={RUN} from={S.breda + 1.0} to={S.twist} dy={-85}>Pulau Run</L>
    <L at={PT.ceylon} from={at("twist", "Ceylon")} to={T_GRENADA + 0.2} dy={-85} bg={C.toska}>Ceylon</L>
    <L at={GD} from={T_GRENADA + 1.0} to={S.banda} dy={85} bg={C.toska}>Grenada</L>
    <L at={RUN} from={S.banda + 1.6} to={S.question} dy={-85}>Kepulauan Banda</L>
  </>
);

const FlagPill: React.FC<{ y: number; from: number; to: number; code: string; text: string; bg?: string }> = ({ y, from, to, code, text, bg }) => (
  <Pill x={W / 2} y={y} from={from} to={to} size={TXT} bg={bg} icon={<Flag code={code} h={50} />}>{text}</Pill>
);

// the "tebak dulu" beat: a big "?×" that the reveal replaces
const Guess: React.FC = () => {
  const k = useLife(S.tebak + 0.2, S.reveal);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 240, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 220, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>?×</div>
  );
};

const BigFlag: React.FC = () => {
  const k = useLife(S.flag, S.banda);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: W / 2, top: 330, transform: `translate(-50%,-50%) scale(${k})` }}>
      <Flag code="gd" h={270} />
    </div>
  );
};

// population today, to scale: Run's bar is a sliver
const Bars: React.FC<{ t: number }> = ({ t }) => {
  const rows = [
    { label: "Manhattan", n: NUM.manhattanPeople, color: C.toska, from: S.today + 0.1 },
    { label: "Pulau Run", n: NUM.runPeople, color: C.kunyit, from: at("today", "Run") },
  ];
  const full = 960, max = NUM.manhattanPeople;
  const k = useLife(S.today, S.question);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 130, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        const g = ramp(t, r.from, r.from + 0.8);
        if (t < r.from) return null;
        return (
          <div key={r.label} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{fmt(r.n * g)}</span>
            </div>
            <div style={{ marginTop: 8, width: (full * r.n * g) / max, height: 44, borderRadius: 6, background: r.color, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

const ISLANDS: [string, number, number][] = [
  ["Sumatra", 178, 1040], ["Jawa", 442, 1040], ["Kalimantan", 795, 1040],
  ["Sulawesi", 200, 1150], ["Papua", 508, 1150], ["Maluku", 825, 1150],
];

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.78) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK */}
    <Headline x={W / 2} y={260} from={-0.25} to={S.run} size={100}>
      Manhattan ditukar <span style={{ color: C.kunyit }}>pulau kecil?</span>
    </Headline>
    <Pill x={W / 2} y={STAMP_Y} from={at("hook", "Panjangnya")} to={S.run} size={60} bg={C.kunyit}>Panjang cuma 3 km</Pill>

    {/* RUN */}
    <Pill x={W / 2} y={190} from={S.run} to={S.tebak} size={60} bg={C.kunyit}>Kepulauan Banda</Pill>
    <Pill x={W / 2} y={320} from={at("run", "Sampai")} to={S.tebak} size={TXT}>Satu-satunya sumber pala</Pill>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={170} from={S.tebak} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "dijual")} to={S.reveal} size={TXT}>Harga pala di Eropa</Pill>

    {/* REVEAL */}
    <Counter x={W / 2} y={320} from={S.reveal} to={S.english} a={1} b={NUM.priceMultiple} t0={S.reveal} t1={at("reveal", "lipat")} unit="×" size={220} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("reveal", "Beli")} to={S.english} color={C.kunyit} size={74}>1.000 → 300.000</Stamp>

    {/* ENGLISH ON RUN */}
    <Headline x={W / 2} y={230} from={at("english", "Masalahnya")} to={S.newyork} size={150} color={C.kunyit}>1616</Headline>
    <FlagPill y={380} from={at("english", "Masalahnya")} to={S.newyork} code="gb" text="Run dipegang Inggris" />

    {/* NEW AMSTERDAM */}
    <FlagPill y={190} from={S.newyork + 1.2} to={at("newyork", "Tahun")} code="nl" text="Kota Belanda" />
    <Headline x={W / 2} y={230} from={at("newyork", "Tahun")} to={S.breda} size={150} color={C.kunyit}>1664</Headline>
    <FlagPill y={380} from={at("newyork", "Tahun") + 0.3} to={S.breda} code="gb" text="Pindah ke Inggris" />

    {/* BREDA */}
    <Headline x={W / 2} y={170} from={S.breda} to={S.win} size={120} color={C.kunyit}>1667</Headline>
    <Pill x={W / 2} y={300} from={S.breda + 0.2} to={S.win} size={TXT}>Perjanjian Breda</Pill>
    <FlagPill y={410} from={at("breda", "Inggris")} to={S.win} code="gb" text="Tetap pegang Manhattan" bg={C.toska} />
    <FlagPill y={520} from={at("breda", "Belanda")} to={S.win} code="nl" text="Dapat Pulau Run" bg={C.kunyit} />

    {/* WIN */}
    <Stamp x={W / 2} y={STAMP_Y} from={S.win + 0.2} to={S.twist} color={C.kunyit} size={74}>Monopoli lengkap</Stamp>

    {/* TWIST */}
    <Headline x={W / 2} y={190} from={S.twist} to={at("twist", "Tahun") + 0.1} size={116} color={C.koral}>Tapi tunggu…</Headline>
    <Headline x={W / 2} y={230} from={at("twist", "Tahun") + 0.1} to={S.flag} size={150} color={C.kunyit}>1817</Headline>
    <Pill x={W / 2} y={380} from={at("twist", "Tahun") + 0.3} to={S.flag} size={TXT} bg={C.toska}>Pohon pala dibawa pergi</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("twist", "tamat") - 0.1} to={S.flag} size={86}>Monopoli tamat</Stamp>

    {/* FLAG */}
    <BigFlag />
    <Pill x={W / 2} y={560} from={S.flag + 0.3} to={S.banda} size={TXT} bg={C.kunyit}>Ada pala di bendera</Pill>

    {/* BANDA */}
    <Pill x={W / 2} y={190} from={S.banda + 1.4} to={S.today} size={TXT}>Orang Banda, sebelum 1621</Pill>
    <Headline x={W / 2} y={300} from={S.banda + 1.5} to={S.today} size={90} color={C.kunyit}>13–15 ribu</Headline>
    <Pill x={W / 2} y={STAMP_Y - 110} from={at("banda", "sendiri") - 0.2} to={S.today} size={TXT}>Yang tersisa di sana</Pill>
    <Headline x={W / 2} y={STAMP_Y} from={at("banda", "sendiri")} to={S.today} size={90} color={C.putih}>Sekitar 1.000</Headline>

    {/* TODAY */}
    <Bars t={t} />

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={260} from={S.question} to={EP004_SECONDS + 1} size={104}>
      Kamu dari <span style={{ color: C.kunyit }}>pulau mana?</span>
    </Headline>
    {ISLANDS.map(([name, x, y], i) => (
      <Pill key={name} x={x} y={y} from={S.question + 0.1 + i * 0.06} to={EP004_SECONDS + 1} size={TXT} bg={C.kunyit}>{name}</Pill>
    ))}
    <Pill x={W / 2} y={1285} from={at("question", "Tulis")} to={EP004_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const sfx = (): { at: number; name: string; vol: number }[] => [
  { at: 0, name: "rise", vol: 0.25 },
  { at: S.run + 0.2, name: "pop", vol: 0.35 },
  { at: S.tebak + 0.2, name: "pop", vol: 0.35 },
  { at: E.tebak - 0.9, name: "rise", vol: 0.3 },
  { at: S.reveal, name: "stamp", vol: 0.5 },
  { at: S.newyork + 0.1, name: "whoosh", vol: 0.45 },
  { at: S.breda + 0.1, name: "whoosh", vol: 0.45 },
  { at: S.win + 0.2, name: "stamp", vol: 0.5 },
  { at: T_GRENADA, name: "whoosh", vol: 0.45 },
  { at: at("twist", "tamat") - 0.1, name: "stamp", vol: 0.5 },
  { at: S.flag, name: "pop", vol: 0.35 },
  { at: S.today + 0.1, name: "pop", vol: 0.35 },
  { at: S.question, name: "pop", vol: 0.35 },
];

export const Ep004: React.FC = () => {
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
      <Soundtrack voice="voice/ep004.wav" voiceLufs={-16.4} words={captions} track={EP004_TRACK} seconds={EP004_SECONDS} />
      {sfx().map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={2 * fps} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
