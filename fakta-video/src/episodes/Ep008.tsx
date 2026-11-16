// Episode 8 (science): the day without a shadow. Built on the locked template, from Ep007.
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
import captionsJson from "./ep008-captions.json";
import timing from "./ep008-timing.json";
import { NUM, PT, type SegmentId } from "./ep008-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP008_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP008_TRACK = pickTrack(8, EP008_SECONDS);

const SAFE_BOTTOM = H * 0.8;
const CAPTION_TOP = 1390;
const STAMP_Y = 1250;
const TXT = 54;
const W_HOME = 6200;
const W_CITY = 1700;
const W_GLOBE = 14000;
const W_HOP = 11000;
const W_EGYPT = 2600;
const W_LOCAL = 2600;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};
const fade = (t: number, a: number, b: number, d = 0.3) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));

const P = ep001.points as Record<string, { coord: number[] }>;
const HOME = geoInterpolate(P.idWest.coord as LonLat, P.idEast.coord as LonLat)(0.5) as LonLat;
const BAND_VIEW: LonLat = [105, 0];
const WORLD_VIEW: LonLat = [70, 20];
const EGYPT: LonLat = [31.4, 27.6];
const LOCAL_VIEW: LonLat = [109.25, -3.45];
const HALF_ROUTE = geoInterpolate(PT.pontianak, PT.tegal)(0.5) as LonLat;
const SEA_HOP: LonLat = [65, 10];

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: HOME, w: W_HOME },
  { t: S.pontianak, c: HOME, w: W_HOME },
  { t: S.pontianak + 1.0, c: PT.pontianak, w: W_CITY },
  { t: S.wait, c: PT.pontianak, w: W_CITY },
  { t: S.wait + 1.0, c: HOME, w: W_HOME },
  { t: S.all, c: HOME, w: W_HOME },
  { t: S.all + 1.4, c: BAND_VIEW, w: W_GLOBE },
  { t: S.never, c: BAND_VIEW, w: W_GLOBE },
  { t: S.never + 0.9, c: WORLD_VIEW, w: W_GLOBE },
  { t: S.moment, c: WORLD_VIEW, w: W_GLOBE },
  { t: S.sabang - 0.2, c: PT.sabang, w: W_CITY },
  { t: S.erat, c: PT.sabang, w: W_CITY },
  { t: S.erat + 0.7, c: SEA_HOP, w: W_HOP },
  { t: S.erat + 1.5, c: EGYPT, w: W_EGYPT },
  { t: S.local, c: EGYPT, w: W_EGYPT },
  { t: S.local + 0.7, c: SEA_HOP, w: W_HOP },
  { t: S.local + 1.5, c: LOCAL_VIEW, w: W_LOCAL },
  { t: S.question, c: LOCAL_VIEW, w: W_LOCAL },
  { t: S.question + 0.6, c: HOME, w: W_HOME },
  { t: 999, c: HOME, w: W_HOME + 300 },
];
const camera = (t: number): Camera => {
  const i = Math.max(0, KEYS.findIndex((k) => k.t > t) - 1);
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

// ---------- latitude lines and the tropics band, sampled so they follow the parallels ----------
const parallel = (lat: number) => ({ type: "LineString" as const, coordinates: Array.from({ length: 181 }, (_, i) => [-180 + i * 2, lat]) });
const EQUATOR = parallel(0);
const TROPIC_N = parallel(NUM.tilt);
const TROPIC_S = parallel(-NUM.tilt);
const BAND = {
  type: "MultiPolygon" as const,
  coordinates: Array.from({ length: 72 }, (_, i) => {
    const a = -180 + i * 5, b = a + 5, n = NUM.tilt;
    return [[[a, -n], [a, n], [b, n], [b, -n], [a, -n]]];
  }),
};

const MapLayers: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.75} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
    <g opacity={fade(t, S.pontianak, S.dates)}>
      <Geo d={EQUATOR} fill="none" stroke={C.kunyit} strokeWidth={8} strokeDasharray="26 18" />
    </g>
    <g opacity={fade(t, S.all + 0.3, S.moment + 0.2)}>
      <Geo d={BAND} fill={C.kunyit} fillOpacity={0.22 + 0.16 * ramp(t, S.reveal, S.reveal + 0.5)} stroke="none" />
      <Geo d={TROPIC_N} fill="none" stroke={C.kunyit} strokeWidth={7} />
      <Geo d={TROPIC_S} fill="none" stroke={C.kunyit} strokeWidth={7} />
    </g>
    <g opacity={fade(t, at("erat2", "Di") - 0.1, S.local)}>
      <Route from={PT.syene} to={PT.alexandria} progress={ramp(t, at("erat2", "Di"), at("erat2", "lain"))} color={C.kunyit} width={10} />
    </g>
    <g opacity={fade(t, S.local + 1.2, S.question)}>
      <Route from={PT.pontianak} to={PT.tegal} progress={ramp(t, S.local + 1.3, E.local)} color={C.kunyit} width={10} />
    </g>
    <Pin at={PT.pontianak} from={S.pontianak + 0.8} to={S.wait + 0.9} color={C.kunyit} r={16} />
    <Pin at={PT.merauke} from={at("dates", "Merauke")} to={S.all + 0.3} color={C.toska} r={15} />
    <Pin at={PT.jakarta} from={at("dates", "Jakarta")} to={S.all + 0.3} color={C.toska} r={15} />
    <Pin at={PT.sabang} from={at("dates", "Sabang")} to={S.all + 0.3} color={C.toska} r={15} />
    <Pin at={PT.tokyo} from={at("never", "Tokyo")} to={S.moment + 0.1} color={C.toska} r={15} />
    <Pin at={PT.paris} from={at("never", "Paris")} to={S.moment + 0.1} color={C.toska} r={15} />
    <Pin at={PT.sabang} from={S.sabang + 0.2} to={S.erat + 0.3} color={C.kunyit} r={16} />
    <Pin at={PT.syene} from={at("erat2", "Di")} to={S.local} color={C.kunyit} r={15} />
    <Pin at={PT.alexandria} from={at("erat2", "Di", 2)} to={S.local} color={C.toska} r={15} />
    <Pin at={PT.pontianak} from={S.local + 1.2} to={S.question} color={C.kunyit} r={15} />
    <Pin at={PT.tegal} from={S.local + 1.2} to={S.question} color={C.toska} r={15} />
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={PT.pontianak} from={S.pontianak + 0.9} to={S.wait + 0.8} dy={-95}>Pontianak</L>
    <L at={PT.merauke} from={at("dates", "Merauke")} to={S.all + 0.2} dy={100} bg={C.toska}>Merauke 27 Feb</L>
    <L at={PT.jakarta} from={at("dates", "Jakarta")} to={S.all + 0.2} dy={-90} bg={C.toska}>Jakarta 5 Mar</L>
    <L at={PT.sabang} from={at("dates", "Sabang")} to={S.all + 0.2} dy={-90} bg={C.toska}>Sabang 5 Apr</L>
    <L at={[150, NUM.tilt]} from={S.all + 1.4} to={S.tebak} dy={-65} bg={C.kunyit}>Garis balik utara</L>
    <L at={[150, -NUM.tilt]} from={S.all + 1.4} to={S.tebak} dy={65} bg={C.kunyit}>Garis balik selatan</L>
    <L at={PT.tokyo} from={at("never", "Tokyo")} to={S.moment} dy={-85} bg={C.toska}>Tokyo</L>
    <L at={PT.paris} from={at("never", "Paris")} to={S.moment} dy={-85} bg={C.toska}>Paris</L>
    <L at={PT.sabang} from={S.sabang + 0.3} to={S.erat + 0.2} dy={100}>Sabang</L>
    <L at={PT.syene} from={at("erat2", "Di")} to={S.local - 0.1} dx={-210} dy={0}>Syene 0°</L>
    <L at={PT.alexandria} from={at("erat2", "Di", 2)} to={S.local - 0.1} dy={-90} bg={C.toska}>{`Alexandria ${NUM.angleOld}°`}</L>
    <L at={PT.pontianak} from={S.local + 1.3} to={S.question - 0.1} dy={-85}>Pontianak</L>
    <L at={PT.tegal} from={S.local + 1.3} to={S.question - 0.1} dy={90} bg={C.toska}>Tegal</L>
    <L at={HALF_ROUTE} from={S.result} to={S.question - 0.1} dx={250} dy={0} bg={C.kunyit}>±{NUM.distanceKm} km</L>
  </>
);

// ---------- the sun, a person and the shadow (our own schematic; the shadow follows the sun's altitude) ----------
const GROUND = 1060;
const PERSON_H = 330;
const ARC = 510;
const Person: React.FC<{ x: number }> = ({ x }) => (
  <g stroke={C.tinta} strokeWidth={5}>
    <circle cx={x} cy={GROUND - PERSON_H + 42} r={42} fill={C.krim} />
    <rect x={x - 42} y={GROUND - PERSON_H + 92} width={84} height={136} rx={30} fill={C.toska} />
    <rect x={x - 36} y={GROUND - 112} width={30} height={112} rx={12} fill={C.krim} />
    <rect x={x + 6} y={GROUND - 112} width={30} height={112} rx={12} fill={C.krim} />
  </g>
);
const SunShadow: React.FC<{ t: number }> = ({ t }) => {
  const a = Math.max(useLife(-0.2, S.pontianak + 0.1), useLife(S.moment, S.sabang));
  if (a <= 0.001) return null;
  // degrees: 0 = horizon on the right, 90 = overhead, 180 = horizon on the left
  const alt = t < S.pontianak
    ? 35 + 55 * ramp(t, 0.3, at("sun", "tepat"))
    : 90 + 40 * ramp(t, at("moment", "Cuma"), E.moment);
  const r = (alt * Math.PI) / 180;
  const sx = W / 2 + ARC * Math.cos(r), sy = GROUND - ARC * Math.sin(r);
  const len = Math.abs(Math.sin(r)) > 0.02 ? (PERSON_H * Math.cos(r)) / Math.sin(r) : 0; // to the opposite side from the sun
  const shadowX = W / 2 - len;
  return (
    <>
      <AbsoluteFill style={{ background: "#07060D", opacity: a * 0.62 }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: a }}>
        <rect x={40} y={GROUND} width={W - 80} height={52} rx={10} fill={C.krim} />
        <path d={`M ${W / 2 - 40} ${GROUND + 4} L ${shadowX - 40} ${GROUND + 44} L ${shadowX + 40} ${GROUND + 44} L ${W / 2 + 40} ${GROUND + 4} Z`} fill={C.tinta} opacity={0.95} />
        <ellipse cx={W / 2} cy={GROUND + 6} rx={62} ry={13} fill={C.tinta} />
        <Person x={W / 2} />
        {Array.from({ length: 12 }, (_, i) => {
          const q = (i * Math.PI) / 6;
          return <line key={i} x1={sx + 72 * Math.cos(q)} y1={sy + 72 * Math.sin(q)} x2={sx + 100 * Math.cos(q)} y2={sy + 100 * Math.sin(q)} stroke={C.kunyit} strokeWidth={10} strokeLinecap="round" />;
        })}
        <circle cx={sx} cy={sy} r={58} fill={C.kunyit} stroke={C.tinta} strokeWidth={5} />
      </svg>
    </>
  );
};

// Two sticks to scale: 1 m = 220 px, so 12 cm of shadow = 26 px
const Sticks: React.FC = () => {
  const k = useLife(at("local", "tongkat"), S.result);
  if (k <= 0.001) return null;
  const base = 460, h = 220, shadow = (NUM.stickCm / 100) * h;
  const stick = (x: number, s: number) => (
    <g>
      <rect x={x - 130} y={base} width={260} height={6} rx={3} fill={C.putih} />
      <rect x={x - 7} y={base - h} width={14} height={h} fill={C.krim} stroke={C.tinta} strokeWidth={4} />
      {s > 0 && <rect x={x + 7} y={base} width={s} height={16} rx={3} fill={C.kunyit} stroke={C.tinta} strokeWidth={3} />}
    </g>
  );
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: k }}>
      {stick(290, 0)}
      {stick(790, shadow)}
    </svg>
  );
};

// the "tebak dulu" beat: a big "?" that the reveal replaces
const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 270, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 190, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>? %</div>
  );
};

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.78) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 64%, rgba(7,6,13,0.72) 100%)" }} />
    <SunShadow t={t} />
    <Sticks />

    {/* HOOK */}
    <Headline x={W / 2} y={260} from={-0.25} to={S.sun} size={104}>
      2× setahun, <span style={{ color: C.kunyit }}>bayanganmu hilang?</span>
    </Headline>

    {/* SUN */}
    <Pill x={W / 2} y={230} from={S.sun} to={S.pontianak} size={TXT} bg={C.kunyit}>Tepat di atas kepala</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("sun", "Bayanganmu")} to={S.pontianak} size={70} color={C.kunyit}>Di bawah kaki</Stamp>

    {/* PONTIANAK */}
    <Headline x={W / 2} y={240} from={S.pontianak + 0.2} to={S.wait} size={100} color={C.kunyit}>±21 Maret, ±23 September</Headline>
    <Pill x={W / 2} y={STAMP_Y} from={at("pontianak", "garis")} to={S.wait} size={TXT} bg={C.kunyit}>Garis khatulistiwa</Pill>

    {/* WAIT + DATES */}
    <Headline x={W / 2} y={230} from={S.wait} to={S.dates} size={116} color={C.koral}>Tapi tunggu…</Headline>
    <Headline x={W / 2} y={240} from={S.dates} to={S.all} size={96}>
      Tanggalnya <span style={{ color: C.kunyit }}>beda-beda</span>
    </Headline>

    {/* ALL */}
    <Headline x={W / 2} y={240} from={S.all} to={S.tebak} size={96}>
      Seluruh <span style={{ color: C.kunyit }}>Indonesia</span>
    </Headline>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={170} from={S.tebak} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "permukaan")} to={S.reveal} size={TXT}>Permukaan Bumi</Pill>

    {/* REVEAL */}
    <Counter x={W / 2} y={320} from={S.reveal} to={S.never} a={1} b={NUM.sharePct} t0={S.reveal} t1={S.reveal + 0.6} unit="%" size={200} />
    <Pill x={W / 2} y={STAMP_Y} from={S.reveal + 0.2} to={S.never} size={TXT}>Permukaan Bumi</Pill>

    {/* NEVER */}
    <Headline x={W / 2} y={240} from={S.never} to={S.moment} size={130} color={C.koral}>0 kali</Headline>
    <Pill x={W / 2} y={STAMP_Y} from={at("never", "New")} to={S.moment} size={TXT} bg={C.toska}>New York juga</Pill>

    {/* MOMENT */}
    <Headline x={W / 2} y={230} from={S.moment} to={S.sabang} size={100} color={C.koral}>Bukan seharian</Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("moment", "Cuma")} to={S.sabang} color={C.kunyit} size={70}>Beberapa menit</Stamp>

    {/* SABANG */}
    <Headline x={W / 2} y={220} from={S.sabang} to={S.erat} size={150} color={C.kunyit}>±{NUM.sabangClock}</Headline>
    <Pill x={W / 2} y={360} from={at("sabang", "Di")} to={S.erat} size={TXT}>WIB, bukan 12.00</Pill>

    {/* ERATOSTHENES */}
    <Headline x={W / 2} y={230} from={S.erat + 0.2} to={S.erat2} size={100} color={C.kunyit}>±2.200 tahun lalu</Headline>
    <Pill x={W / 2} y={STAMP_Y} from={at("erat", "Eratosthenes")} to={S.erat2} size={TXT}>Eratosthenes</Pill>
    <Headline x={W / 2} y={230} from={S.erat2} to={S.local} size={92}>
      Selisih bayangan <span style={{ color: C.kunyit }}>= ukuran Bumi</span>
    </Headline>
    <Pill x={W / 2} y={STAMP_Y} from={at("erat2", "selisih")} to={S.local} size={TXT} bg={C.kunyit}>{NUM.angleOld}° = 1/50 lingkaran</Pill>

    {/* LOCAL */}
    <Headline x={W / 2} y={230} from={S.local} to={at("local", "tongkat")} size={100} color={C.kunyit}>Versi kita</Headline>
    <Pill x={290} y={540} from={at("local", "tongkat")} to={S.result} size={TXT}>0 cm</Pill>
    <Pill x={790} y={540} from={at("local", "dua")} to={S.result} size={TXT} bg={C.kunyit}>{NUM.stickCm} cm</Pill>
    <Pill x={W / 2} y={140} from={at("local", "tongkat")} to={S.result} size={TXT}>Tongkat 1 meter</Pill>

    {/* RESULT */}
    <Pill x={W / 2} y={230} from={S.result} to={at("result", "keliling")} size={TXT} bg={C.toska}>Selisih {NUM.angleLocal}°</Pill>
    <Pill x={W / 2} y={1285} from={at("result", "Hitung")} to={S.payoff} size={TXT}>{NUM.distanceKm} km × {NUM.factor}</Pill>
    <Counter x={W / 2} y={260} from={at("result", "keliling")} to={S.payoff} a={1000} b={NUM.earthKm} t0={at("result", "keliling")} t1={at("result", "kilometer", 1)} unit=" KM" size={150} />

    {/* PAYOFF */}
    <Headline x={W / 2} y={260} from={S.payoff} to={S.question} size={100}>
      Cuma <span style={{ color: C.kunyit }}>tongkat</span> dan <span style={{ color: C.kunyit }}>bayangan</span>
    </Headline>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={260} from={S.question} to={EP008_SECONDS + 1} size={100}>
      Kamu dari <span style={{ color: C.kunyit }}>kota mana?</span>
    </Headline>
    <Pill x={249} y={1160} from={S.question + 0.1} to={EP008_SECONDS + 1} size={TXT} bg={C.kunyit}>Jakarta</Pill>
    <Pill x={578} y={1160} from={S.question + 0.16} to={EP008_SECONDS + 1} size={TXT} bg={C.toska}>Medan</Pill>
    <Pill x={868} y={1160} from={S.question + 0.22} to={EP008_SECONDS + 1} size={TXT}>Ambon</Pill>
    <Pill x={W / 2} y={1285} from={at("question", "Tulis")} to={EP008_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const sfx = (): { at: number; name: string; vol: number }[] => [
  { at: 0, name: "rise", vol: 0.25 },
  { at: at("sun", "Bayanganmu"), name: "stamp", vol: 0.45 },
  { at: S.pontianak + 0.1, name: "whoosh", vol: 0.28 },
  { at: S.wait, name: "whoosh", vol: 0.45 },
  { at: at("dates", "Merauke"), name: "pop", vol: 0.35 },
  { at: at("dates", "Jakarta"), name: "pop", vol: 0.35 },
  { at: at("dates", "Sabang"), name: "pop", vol: 0.35 },
  { at: S.all + 0.1, name: "whoosh", vol: 0.28 },
  { at: E.tebak - 0.9, name: "rise", vol: 0.3 },
  { at: S.reveal, name: "stamp", vol: 0.26 },
  { at: S.never, name: "stamp", vol: 0.28 },
  { at: at("moment", "Cuma"), name: "stamp", vol: 0.32 },
  { at: S.sabang, name: "whoosh", vol: 0.4 },
  { at: S.erat + 0.1, name: "whoosh", vol: 0.45 },
  { at: S.local + 0.1, name: "whoosh", vol: 0.45 },
  { at: at("local", "dua"), name: "pop", vol: 0.35 },
  { at: at("result", "keliling"), name: "rise", vol: 0.22 },
  { at: S.payoff, name: "stamp", vol: 0.45 },
  { at: S.question, name: "pop", vol: 0.22 },
];

export const Ep008: React.FC = () => {
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
      <Soundtrack voice="voice/ep008.wav" voiceLufs={-16.3} words={captions} track={EP008_TRACK} seconds={EP008_SECONDS} />
      {sfx().map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={2 * fps} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
