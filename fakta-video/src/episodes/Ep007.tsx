// Episode 7 (history): Borobudur, covered for centuries. Built on the locked template, from Ep006.
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
import { C, FONT, H, SHADOW, W } from "../theme";
import captionsJson from "./ep007-captions.json";
import timing from "./ep007-timing.json";
import { NUM, PT, TEMPLE_M, type SegmentId } from "./ep007-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP007_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP007_TRACK = pickTrack(7, EP007_SECONDS);

const SAFE_BOTTOM = H * 0.8;
const CAPTION_TOP = 1390;
const STAMP_Y = 1250;
const TXT = 54;
const W_HOME = 6200;
const W_JAVA = 1500;
const W_SEMARANG = 420;
const W_ASIA = 5200;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};
const fade = (t: number, a: number, b: number, d = 0.3) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));

const P = ep001.points as Record<string, { coord: number[] }>;
const HOME = geoInterpolate(P.idWest.coord as LonLat, P.idEast.coord as LonLat)(0.5) as LonLat;
const BORO = PT.borobudur;
const BETWEEN: LonLat = [110.3, -7.3];
const ASIA_VIEW: LonLat = [105, 3];
const HALF_ROUTE = geoInterpolate(PT.semarang, BORO)(0.5) as LonLat;

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: HOME, w: W_HOME },
  { t: S.build, c: HOME, w: W_HOME },
  { t: S.build + 1.2, c: BORO, w: W_JAVA },
  { t: S.raffles, c: BORO, w: W_JAVA },
  { t: S.raffles + 1.0, c: BETWEEN, w: W_SEMARANG },
  { t: S.cornelius, c: BETWEEN, w: W_SEMARANG },
  { t: S.cornelius + 1.0, c: BORO, w: W_JAVA },
  { t: S.siam, c: BORO, w: W_JAVA },
  { t: S.siam + 1.2, c: ASIA_VIEW, w: W_ASIA },
  { t: E.siam - 0.2, c: ASIA_VIEW, w: W_ASIA },
  { t: S.million + 0.8, c: BORO, w: W_JAVA },
  { t: S.question, c: BORO, w: W_JAVA },
  { t: 999, c: BORO, w: 1800 },
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
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.75} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
    <g opacity={fade(t, S.raffles + 0.4, S.cornelius + 0.3)}>
      <Route from={PT.semarang} to={BORO} progress={ramp(t, at("raffles", "Tujuh"), at("raffles", "candi"))} color={C.kunyit} width={10} />
    </g>
    <g opacity={fade(t, S.siam + 0.6, S.million + 0.2)}>
      <Route from={BORO} to={PT.bangkok} progress={ramp(t, S.siam + 0.8, at("siam", "gerobak"))} color={C.toska} width={10} />
    </g>
    <Pin at={BORO} from={S.build + 0.8} to={S.cover} color={C.kunyit} r={16} />
    <Pin at={PT.yogyakarta} from={at("build", "dekat")} to={S.cover} color={C.toska} r={14} />
    <Pin at={BORO} from={S.raffles + 0.8} to={S.cornelius + 0.3} color={C.kunyit} r={16} />
    <Pin at={PT.semarang} from={S.raffles + 0.8} to={S.cornelius + 0.3} color={C.toska} r={16} />
    <Pin at={PT.bangkok} from={S.siam + 1.0} to={S.million + 0.2} color={C.toska} r={16} />
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={BORO} from={S.build + 0.8} to={S.cover} dy={-85}>Borobudur</L>
    <L at={PT.yogyakarta} from={at("build", "dekat")} to={S.cover} dy={95} bg={C.toska}>Yogyakarta</L>
    <L at={PT.semarang} from={S.raffles + 0.9} to={S.cornelius + 0.2} dy={-90} bg={C.toska}>Semarang</L>
    <L at={BORO} from={S.raffles + 0.9} to={S.cornelius + 0.2} dy={95}>Borobudur</L>
    <L at={HALF_ROUTE} from={at("raffles", "Tujuh")} to={S.cornelius + 0.2} dx={230} dy={0} bg={C.kunyit}>±{NUM.semarangKm} km</L>
    <L at={PT.bangkok} from={S.siam + 1.1} to={S.million + 0.1} dy={-90} bg={C.toska}>Siam</L>
    <L at={BORO} from={S.siam + 1.1} to={S.million + 0.1} dx={210} dy={-75}>Borobudur</L>
  </>
);

// ---------- the temple, side view (our own schematic: base and height to scale, terraces by eye) ----------
const PX = 7.3; // px per metre
const GROUND = 1040;
const HUTAN = "#2E7D4F";
const ABU = "#6F6A66";
const FOOT_M = 6;
type Layer = { w: number; h: number };
const SQUARE: Layer[] = [{ w: 109, h: 3.6 }, { w: 100, h: 3.2 }, { w: 91, h: 2.8 }, { w: 82, h: 2.4 }, { w: 73, h: 2 }];
const ROUND: Layer[] = [{ w: 51, h: 1.6 }, { w: 38, h: 1.6 }, { w: 26, h: 1.6 }];
const DOME_W = 16, DOME_H = 7.2;

const Stones: React.FC<{ layers: Layer[]; start: number; lift: number; dx: (i: number) => number; dy: (i: number) => number }> = ({ layers, start, dx, dy }) => {
  let y = start;
  return (
    <>
      {layers.map((l, i) => {
        y += l.h;
        const w = l.w * PX, h = l.h * PX;
        return (
          <g key={i} transform={`translate(${dx(i)} ${dy(i)})`}>
            <rect x={W / 2 - w / 2} y={GROUND - y * PX} width={w} height={h} fill={C.krim} stroke={C.tinta} strokeWidth={4} />
            <line x1={W / 2 - w / 2 + 8} x2={W / 2 + w / 2 - 8} y1={GROUND - y * PX + h / 2} y2={GROUND - y * PX + h / 2} stroke={C.tinta} strokeWidth={3} strokeDasharray="6 14" opacity={0.45} />
          </g>
        );
      })}
    </>
  );
};

const Temple: React.FC<{ t: number }> = ({ t }) => {
  const a = Math.max(useLife(-0.2, S.build + 0.1), useLife(S.cover, S.raffles), useLife(S.cornelius, S.reveal), useLife(S.million, EP007_SECONDS + 1));
  if (a <= 0.001) return null;

  // ash and forest
  const ash = t < S.build ? ramp(t, 0.2, 3)
    : Math.min(ramp(t, S.cover + 0.3, E.cover - 0.2), 1 - 0.55 * ramp(t, S.cornelius + 0.4, E.cornelius), 1 - ramp(t, at("notyet", "terbuka"), E.notyet));
  const w = 152 * PX, h = ash * 42 * PX, x0 = W / 2 - w / 2, x1 = W / 2 + w / 2;
  const bez = (u: number): [number, number] => {
    const c1 = x0 + w * 0.15, c2 = x1 - w * 0.15, cy = GROUND - 1.35 * h, v = 1 - u;
    return [v * v * v * x0 + 3 * v * v * u * c1 + 3 * v * u * u * c2 + u * u * u * x1, v * v * v * GROUND + 3 * v * v * u * cy + 3 * v * u * u * cy + u * u * u * GROUND];
  };
  const treeK = ramp(ash, 0.55, 1);

  // the 1975-82 dismantling
  const open = Math.min(ramp(t, at("million", "dibongkar") - 0.2, at("million", "dibongkar") + 0.6), 1 - ramp(t, at("million", "dipasang") - 0.2, at("million", "dipasang") + 0.6));
  const dy = (i: number) => -open * (i + 1) * 32;
  const dx = (i: number) => open * (i % 2 ? 24 : -24);
  const topLift = dy(SQUARE.length);

  // the casing over the hidden foot: slides off, comes back, leaves the corner open
  const opened = ramp(t, at("hidden", "ditemukan"), at("hidden", "tersembunyi") + 0.3);
  const closed = ramp(t, at("still", "ditutup"), at("still", "Sekarang"));
  const casing = (1 - opened) + opened * closed * 0.86;
  const baseW = TEMPLE_M.base * PX, footH = FOOT_M * PX, fx = W / 2 - baseW / 2, fy = GROUND - footH;

  const squareTop = FOOT_M + SQUARE.reduce((s, l) => s + l.h, 0);
  const roundTop = squareTop + ROUND.reduce((s, l) => s + l.h, 0);
  const domeBase = GROUND - roundTop * PX;
  return (
    <>
      <AbsoluteFill style={{ background: "#07060D", opacity: a * 0.55 }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: a }}>
        <rect x={40} y={GROUND} width={W - 80} height={6} rx={3} fill={C.putih} opacity={0.7} />
        {/* hidden foot + casing */}
        <rect x={fx} y={fy} width={baseW} height={footH} fill={C.koral} stroke={C.tinta} strokeWidth={4} />
        {Array.from({ length: 30 }, (_, i) => <rect key={i} x={fx + 12 + (i * (baseW - 24)) / 30} y={fy + 10} width={18} height={footH - 20} fill={C.krim} opacity={0.85} />)}
        <rect x={fx - 4} y={fy - 2} width={(baseW + 8) * casing} height={footH + 4} fill={C.krim} stroke={C.tinta} strokeWidth={4} />
        <Stones layers={SQUARE} start={FOOT_M} lift={0} dx={dx} dy={dy} />
        <g transform={`translate(0 ${topLift})`}>
          <Stones layers={ROUND} start={squareTop} lift={0} dx={() => 0} dy={() => 0} />
          <path d={`M ${W / 2 - (DOME_W * PX) / 2} ${domeBase} Q ${W / 2} ${domeBase - 2 * DOME_H * PX} ${W / 2 + (DOME_W * PX) / 2} ${domeBase} Z`} fill={C.krim} stroke={C.tinta} strokeWidth={4} />
          <rect x={W / 2 - 5} y={GROUND - TEMPLE_M.height * PX} width={10} height={(TEMPLE_M.height - roundTop - DOME_H + 2) * PX} fill={C.krim} stroke={C.tinta} strokeWidth={3} />
        </g>
        {/* ash + forest */}
        {ash > 0.005 && (
          <>
            <path d={`M ${x0} ${GROUND} C ${x0 + w * 0.15} ${GROUND - 1.35 * h} ${x1 - w * 0.15} ${GROUND - 1.35 * h} ${x1} ${GROUND} Z`} fill={ABU} stroke={C.tinta} strokeWidth={4} />
            {treeK > 0 && Array.from({ length: 11 }, (_, i) => {
              const [x, y] = bez(0.1 + i * 0.08);
              return <circle key={i} cx={x} cy={y - 4} r={(i % 2 ? 40 : 54) * treeK} fill={HUTAN} stroke={C.tinta} strokeWidth={4} />;
            })}
          </>
        )}
      </svg>
    </>
  );
};

// the "tebak dulu" beat: a big "?" that the reveal replaces
const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 270, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 190, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>? PATUNG</div>
  );
};

// 504 dots, one per statue (36 x 14); the top two rows are the 72 inside stupas
const Dots: React.FC<{ t: number }> = ({ t }) => {
  const k = useLife(S.reveal, S.siam);
  if (k <= 0.001) return null;
  const COLS = 36, ROWS = 14, STEP = 26, n = Math.round(NUM.buddhas * ramp(t, S.reveal, E.reveal));
  const x0 = (W - (COLS - 1) * STEP) / 2, y0 = 660;
  return (
    <>
      <AbsoluteFill style={{ background: "#07060D", opacity: k * 0.75 }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: k }}>
        {Array.from({ length: NUM.buddhas }, (_, i) => {
          if (i >= n) return null;
          const row = ROWS - 1 - Math.floor(i / COLS), col = i % COLS;
          const inStupa = row < 2 && t >= S.stupa;
          return <circle key={i} cx={x0 + col * STEP} cy={y0 + row * STEP} r={inStupa ? 11 : 9} fill={inStupa ? C.toska : C.kunyit} />;
        })}
      </svg>
    </>
  );
};

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.78) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 64%, rgba(7,6,13,0.72) 100%)" }} />
    <Temple t={t} />
    <Dots t={t} />

    {/* HOOK */}
    <Headline x={W / 2} y={260} from={-0.25} to={S.build} size={100}>
      Candi terbesar, <span style={{ color: C.kunyit }}>ratusan tahun tertutup?</span>
    </Headline>

    {/* BUILD */}
    <Headline x={W / 2} y={230} from={S.build} to={S.cover} size={116} color={C.kunyit}>±1.200 tahun lalu</Headline>

    {/* COVER */}
    <Headline x={W / 2} y={250} from={S.cover} to={at("cover", "Abu")} size={92}>
      Kenapa ditinggalkan? <span style={{ color: C.kunyit }}>Nggak ada yang tahu</span>
    </Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("cover", "ditinggalkan")} to={at("cover", "Abu")} size={74}>Ditinggalkan</Stamp>
    <Pill x={W / 2} y={STAMP_Y} from={at("cover", "Abu")} to={S.raffles} size={TXT} bg={C.kunyit}>Abu + hutan</Pill>

    {/* RAFFLES */}
    <Headline x={W / 2} y={190} from={S.raffles} to={S.locals} size={150} color={C.kunyit}>1814</Headline>
    <Pill x={W / 2} y={340} from={S.raffles + 0.3} to={S.locals} size={TXT}>Raffles</Pill>

    {/* LOCALS */}
    <Pill x={W / 2} y={200} from={S.locals} to={S.cornelius} size={TXT} bg={C.toska}>Monumen di hutan</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("locals", "Jadi")} to={S.cornelius} color={C.kunyit} size={78}>Warga sudah tahu!</Stamp>

    {/* CORNELIUS */}
    <Counter x={W / 2} y={230} from={S.cornelius} to={S.notyet} a={1} b={NUM.men} t0={at("cornelius", "dua")} t1={at("cornelius", "orang")} unit=" ORANG" size={130} />
    <Pill x={W / 2} y={1200} from={at("cornelius", "dua", 1)} to={S.notyet} size={TXT} bg={C.kunyit}>2 bulan: tebang, gali</Pill>

    {/* NOT YET */}
    <Headline x={W / 2} y={190} from={S.notyet} to={at("notyet", "Raffles")} size={116} color={C.koral}>Tapi tunggu…</Headline>
    <Pill x={W / 2} y={200} from={at("notyet", "Raffles")} to={at("notyet", "candinya")} size={TXT} bg={C.toska}>Raffles nggak ke sana</Pill>
    <Headline x={W / 2} y={190} from={at("notyet", "candinya")} to={S.tebak} size={150} color={C.kunyit}>1835</Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("notyet", "terbuka")} to={S.tebak} color={C.kunyit} size={74}>Terbuka semua</Stamp>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={170} from={S.tebak} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />

    {/* REVEAL */}
    <Counter x={W / 2} y={320} from={S.reveal} to={S.siam} a={1} b={NUM.buddhas} t0={S.reveal} t1={E.reveal - 0.1} unit="" size={200} />
    <Pill x={W / 2} y={520} from={S.reveal + 0.2} to={S.siam} size={TXT}>Patung, awalnya</Pill>
    <Pill x={W / 2} y={STAMP_Y} from={S.stupa} to={S.siam} size={TXT} bg={C.toska}>{NUM.stupas} dalam stupa</Pill>

    {/* SIAM */}
    <Headline x={W / 2} y={190} from={S.siam} to={S.million} size={150} color={C.kunyit}>1896</Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("siam", "delapan", 1)} to={S.million} color={C.toska} size={78}>{NUM.carts} gerobak</Stamp>

    {/* MILLION */}
    <Pill x={W / 2} y={190} from={S.million + 0.2} to={at("million", "lebih")} size={TXT}>UNESCO</Pill>
    <Counter x={W / 2} y={210} from={at("million", "lebih")} to={S.hidden} a={1000} b={1000000} t0={at("million", "lebih")} t1={at("million", "batu")} unit="+ BATU" size={130} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("million", "dibongkar")} to={at("million", "dipasang")} size={78}>Dibongkar</Stamp>
    <Stamp x={W / 2} y={STAMP_Y} from={at("million", "dipasang")} to={S.hidden} color={C.kunyit} size={78}>Dipasang lagi</Stamp>

    {/* HIDDEN FOOT */}
    <Headline x={W / 2} y={190} from={S.hidden} to={S.still} size={150} color={C.kunyit}>1885</Headline>
    <Pill x={W / 2} y={350} from={at("hidden", "ditemukan")} to={S.still} size={TXT}>Kaki tersembunyi</Pill>
    <Pill x={W / 2} y={STAMP_Y} from={at("hidden", "seratus")} to={S.still} size={TXT} bg={C.koral} fg={C.putih}>{NUM.hiddenPanels} panel relief</Pill>

    {/* STILL */}
    <Stamp x={W / 2} y={260} from={at("still", "ditutup")} to={S.payoff} color={C.koral} size={84}>Ditutup lagi</Stamp>
    <Pill x={720} y={1180} from={at("still", "pojok")} to={S.question} size={TXT} bg={C.kunyit}>Pojok tenggara</Pill>

    {/* PAYOFF */}
    <Headline x={W / 2} y={260} from={S.payoff} to={S.question} size={96}>
      Sebagian <span style={{ color: C.kunyit }}>masih tertutup</span>
    </Headline>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={260} from={S.question} to={EP007_SECONDS + 1} size={100}>
      Kamu pernah ke <span style={{ color: C.kunyit }}>Borobudur?</span>
    </Headline>
    <Pill x={300} y={1160} from={S.question + 0.1} to={EP007_SECONDS + 1} size={TXT} bg={C.kunyit}>Sudah</Pill>
    <Pill x={780} y={1160} from={S.question + 0.18} to={EP007_SECONDS + 1} size={TXT} bg={C.toska}>Belum</Pill>
    <Pill x={W / 2} y={1285} from={at("question", "Tulis")} to={EP007_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const sfx = (): { at: number; name: string; vol: number }[] => [
  { at: 0, name: "rise", vol: 0.25 },
  { at: S.build + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("cover", "ditinggalkan"), name: "stamp", vol: 0.4 },
  { at: S.raffles + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("locals", "Jadi"), name: "stamp", vol: 0.5 },
  { at: S.cornelius + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("notyet", "terbuka"), name: "stamp", vol: 0.5 },
  { at: E.tebak - 0.9, name: "rise", vol: 0.3 },
  { at: S.reveal, name: "stamp", vol: 0.5 },
  { at: S.stupa, name: "pop", vol: 0.35 },
  { at: S.siam + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("siam", "delapan", 1), name: "stamp", vol: 0.5 },
  { at: S.million + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("million", "dibongkar"), name: "stamp", vol: 0.5 },
  { at: at("million", "dipasang"), name: "stamp", vol: 0.45 },
  { at: S.hidden, name: "pop", vol: 0.35 },
  { at: at("still", "ditutup"), name: "stamp", vol: 0.45 },
  { at: S.question, name: "pop", vol: 0.35 },
];

export const Ep007: React.FC = () => {
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
      <Soundtrack voice="voice/ep007.wav" voiceLufs={-16.3} words={captions} track={EP007_TRACK} seconds={EP007_SECONDS} />
      {sfx().map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={2 * fps} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
