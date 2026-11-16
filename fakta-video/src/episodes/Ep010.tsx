// Episode 10 (science, timely): the Leonid meteor shower, peak night 17-18 Nov 2026. Built on the locked template
// (from Ep009), with the 12 Nov 2026 LiveCaptions + SfxLayer. Meteor streaks, comet orbit and the Leo star figure
// are our own drawings (schematic; Leo stars placed from their RA/Dec).
import type { Caption } from "@remotion/captions";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React from "react";
import { AbsoluteFill } from "remotion";
import { LiveCaptions } from "../components/LiveCaptions";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import { SfxLayer } from "../components/SfxLayer";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife } from "../components/ui";
import { useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import ep001 from "../../data/ep001-facts.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, H, SHADOW, W } from "../theme";
import captionsJson from "./ep010-captions.json";
import timing from "./ep010-timing.json";
import { NUM, PT, type SegmentId } from "./ep010-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP010_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP010_TRACK = pickTrack(10, EP010_SECONDS);

const SAFE_BOTTOM = H * 0.8;
const CAPTION_TOP = 1390;
const STAMP_Y = 1210;
const TXT = 54;
const W_HOME = 6200;
const W_JAVA = 1150;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

// "hujan" here means meteors, not water: keep the kit's splash off those words (sound only; captions unchanged)
const sfxCaptions = captions.map((c) => (/hujan/i.test(c.text) ? { ...c, text: "meteor" } : c));

const P = ep001.points as Record<string, { coord: number[] }>;
const HOME = geoInterpolate(P.idWest.coord as LonLat, P.idEast.coord as LonLat)(0.5) as LonLat;
const JAVA = geoInterpolate(PT.jakarta, PT.surabaya)(0.5) as LonLat;
const ROUTE_T0 = S.reveal + 0.2;
const ROUTE_T1 = ROUTE_T0 + NUM.jkSbSec + 0.34; // real time: 663 km at 71 km/s = 9.34 s

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: HOME, w: W_HOME },
  { t: S.tebak, c: HOME, w: W_HOME },
  { t: S.reveal - 0.1, c: JAVA, w: W_JAVA },
  { t: ROUTE_T1 + 0.3, c: JAVA, w: W_JAVA },
  { t: S.now + 0.4, c: HOME, w: W_HOME },
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
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.6} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
    {t >= ROUTE_T0 - 0.5 && t < S.now + 0.5 && (
      <>
        <Route from={PT.jakarta} to={PT.surabaya} progress={ramp(t, ROUTE_T0, ROUTE_T1, (x) => x)} color={C.kunyit} width={12} />
        <Pin at={PT.jakarta} from={S.reveal} to={S.storm + 0.6} color={C.kunyit} r={14} />
        <Pin at={PT.surabaya} from={S.reveal} to={S.storm + 0.6} color={C.toska} r={14} />
      </>
    )}
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={PT.jakarta} from={S.reveal + 0.2} to={S.storm + 0.4} dy={-90}>Jakarta</L>
    <L at={PT.surabaya} from={S.reveal + 0.4} to={S.storm + 0.4} dy={90} bg={C.toska}>Surabaya</L>
  </>
);

// --- our own drawings ------------------------------------------------------------------------------------------
// one meteor streak: a bright head and a fading tail, drawn along a straight screen line
type Streak = { t: number; x: number; y: number; len: number; dur?: number; w?: number };
const STREAK_ANGLE = (205 * Math.PI) / 180; // all streaks point back to one spot (the radiant), top right
const MeteorStreaks: React.FC<{ t: number; list: Streak[] }> = ({ t, list }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    <defs>
      <linearGradient id="tail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#FFF4C2" stopOpacity="0" />
        <stop offset="0.7" stopColor={C.kunyit} stopOpacity="0.7" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
      </linearGradient>
    </defs>
    {list.map((s, i) => {
      const dur = s.dur ?? 0.7;
      const f = (t - s.t) / dur;
      if (f < 0 || f > 1.6) return null;
      const head = Math.min(1, f);
      const fade = f > 1 ? 1 - (f - 1) / 0.6 : 1;
      const dx = Math.cos(STREAK_ANGLE), dy = -Math.sin(STREAK_ANGLE);
      const hx = s.x + dx * s.len * head, hy = s.y + dy * s.len * head;
      const tl = Math.min(s.len * head, s.len * 0.55);
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      return (
        <g key={i} opacity={fade} transform={`translate(${hx},${hy}) rotate(${ang})`}>
          <rect x={-tl} y={-(s.w ?? 6) / 2} width={tl} height={s.w ?? 6} rx={(s.w ?? 6) / 2} fill="url(#tail)" />
          <circle r={(s.w ?? 6) * 1.1} fill="#FFFFFF" />
          <circle r={(s.w ?? 6) * 3} fill={C.kunyit} opacity={0.25} />
        </g>
      );
    })}
  </svg>
);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const shower = (from: number, to: number, n: number, seed: number, big = false): Streak[] =>
  Array.from({ length: n }, (_, i) => ({
    t: from + ((to - from) * (i + rnd(seed + i) * 0.8)) / n,
    x: 300 + rnd(seed + i * 3) * 760,
    y: 560 + rnd(seed + i * 7) * 520,
    len: (big ? 420 : 260) + rnd(seed + i * 11) * 200,
    w: big ? 9 : 6,
  }));

const STREAKS: Streak[] = [
  ...shower(0.1, S.name, 6, 1, true),
  ...shower(S.name, S.comet - 0.4, 3, 20),
  { t: S.burn + 0.05, x: 880, y: 600, len: 640, dur: 1.2, w: 12 },
  ...shower(S.burn + 0.6, S.storm, 3, 40),
  ...shower(S.storm + 0.2, S.now, 40, 60),
  ...shower(S.now + 0.3, S.question, 4, 90),
];

// a dark card behind the infographics, so they read over the map
const Card: React.FC<{ from: number; to: number; y: number; h: number; children: React.ReactNode }> = ({ from, to, y, h, children }) => {
  const k = useLife(from, to);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, width: W - 120, top: y, height: h, borderRadius: 36, background: "rgba(7,6,13,0.95)", border: "4px solid rgba(255,244,224,0.25)", opacity: Math.min(1, k * 1.4), transform: `scale(${0.9 + 0.1 * k})` }}>
      <svg width={W - 120} height={h} style={{ position: "absolute", inset: 0 }}>{children}</svg>
    </div>
  );
};

// the Leo figure from real star positions (RA hours, Dec degrees); east is to the left on the sky
const LEO: Record<string, [number, number]> = {
  regulus: [10.139, 11.97], eta: [10.122, 16.76], algieba: [10.333, 19.84], zeta: [10.278, 23.42],
  mu: [9.879, 26.01], epsilon: [9.764, 23.77], zosma: [11.235, 20.52], denebola: [11.818, 14.57], chertan: [11.237, 15.43],
};
const LEO_LINES = [["regulus", "eta"], ["eta", "algieba"], ["algieba", "zeta"], ["zeta", "mu"], ["mu", "epsilon"], ["algieba", "zosma"], ["zosma", "denebola"], ["denebola", "chertan"], ["chertan", "regulus"], ["zosma", "chertan"]];
const leoXY = ([ra, dec]: [number, number]): [number, number] => [480 - (ra * 15 - 162) * 24, 250 - (dec - 19) * 24];
const LeoCard: React.FC<{ t: number }> = ({ t }) => {
  const from = at("name", "rasi") - 0.4, to = S.comet + 0.1;
  const g = ramp(t, from + 0.2, from + 1.2);
  return (
    <Card from={from} to={to} y={640} h={480}>
      {LEO_LINES.map(([a, b], i) => {
        const [x1, y1] = leoXY(LEO[a]), [x2, y2] = leoXY(LEO[b]);
        return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * g} y2={y1 + (y2 - y1) * g} stroke={C.toska} strokeWidth={4} opacity={0.8} />;
      })}
      {Object.entries(LEO).map(([k, p]) => {
        const [x, y] = leoXY(p);
        return <circle key={k} cx={x} cy={y} r={k === "regulus" ? 13 : 9} fill="#FFFFFF" />;
      })}
      {/* the radiant, in the sickle */}
      <circle cx={leoXY([10.2, 21.5])[0]} cy={leoXY([10.2, 21.5])[1]} r={34 + 8 * Math.sin(t * 6)} fill="none" stroke={C.kunyit} strokeWidth={5} />
    </Card>
  );
};

// the comet's orbit: a long ellipse with the Sun at one focus (schematic)
const OrbitCard: React.FC<{ t: number }> = ({ t }) => {
  const from = S.comet + 0.1, to = S.grain;
  const a = 400, e = 0.9, b = a * Math.sqrt(1 - e * e), sx = 110, cy = 240, cx = sx + a * e;
  const g = ramp(t, from + 0.3, at("comet", "tiga"));
  const th = Math.PI * 2 * ramp(t, from + 0.3, to, (x) => x);
  const kx = cx + a * Math.cos(th + Math.PI), ky = cy + b * Math.sin(th + Math.PI);
  return (
    <Card from={from} to={to} y={640} h={480}>
      <ellipse cx={cx} cy={cy} rx={a} ry={b} fill="none" stroke={C.kunyit} strokeWidth={5} strokeDasharray={`${g * 1900} 2000`} />
      <circle cx={sx} cy={cy} r={60} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
      <circle cx={sx} cy={cy} r={26} fill={C.kunyit} />
      <circle cx={sx + 60} cy={cy} r={10} fill={C.toska} />
      <circle cx={kx} cy={ky} r={14} fill="#FFFFFF" />
    </Card>
  );
};

// grain sizes: a sand grain (~1 mm) and a pea (~7 mm), side by side at the same scale (schematic sizes)
const GrainCard: React.FC = () => (
  <Card from={S.grain + 0.2} to={S.tebak} y={700} h={360}>
    <circle cx={200} cy={160} r={10} fill={C.krim} />
    <circle cx={680} cy={160} r={70} fill={C.toska} />
  </Card>
);

// the "tebak dulu" beat: a big "?" that the reveal replaces
const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 180, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>? KM/DTK</div>
  );
};

const CITY_PILLS: [string, number, number][] = [
  ["Jakarta", 260, 1000], ["Medan", 700, 1000],
  ["Makassar", 270, 1110], ["Jayapura", 690, 1110],
];

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.8) 0%, rgba(7,6,13,0.2) 30%, rgba(7,6,13,0.2) 64%, rgba(7,6,13,0.72) 100%)" }} />
    <MeteorStreaks t={t} list={STREAKS} />

    {/* HOOK: the date on screen in the first second */}
    <Headline x={W / 2} y={200} from={-0.25} to={S.name} size={150} color={C.kunyit}>17 NOV</Headline>
    <Headline x={W / 2} y={370} from={-0.1} to={S.name} size={96}>Hujan bintang jatuh!</Headline>

    {/* NAME */}
    <Headline x={W / 2} y={200} from={S.name} to={S.comet} size={130} color={C.kunyit}>LEONID</Headline>
    <Pill x={W / 2} y={360} from={at("name", "rasi")} to={S.comet} size={TXT} bg={C.toska}>Dari arah rasi Leo</Pill>
    <LeoCard t={t} />

    {/* COMET */}
    <Pill x={W / 2} y={170} from={S.comet} to={S.grain} size={TXT}>Debu komet Tempel-Tuttle</Pill>
    <Counter x={W / 2} y={360} from={at("comet", "mengitari")} to={S.grain} a={0} b={NUM.orbitYears} t0={at("comet", "tiga")} t1={at("comet", "tahun") + 0.2} unit=" TAHUN" size={160} />
    <OrbitCard t={t} />
    <Pill x={W / 2} y={STAMP_Y} from={at("comet", "mengitari")} to={S.grain} size={TXT} bg={C.kunyit}>1 putaran Matahari</Pill>

    {/* GRAIN */}
    <Headline x={W / 2} y={220} from={S.grain} to={S.tebak} size={110}>Butirannya <span style={{ color: C.kunyit }}>kecil</span></Headline>
    <GrainCard />
    <Pill x={250} y={STAMP_Y} from={at("grain", "pasir")} to={S.tebak} size={TXT}>Pasir</Pill>
    <Pill x={750} y={STAMP_Y} from={at("grain", "kacang")} to={S.tebak} size={TXT} bg={C.toska}>Kacang polong</Pill>

    {/* TEBAK DULU */}
    <Headline x={W / 2} y={220} from={S.tebak} to={at("tebak", "Tebak")} size={110}>Tapi lajunya…</Headline>
    <Pill x={W / 2} y={150} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />

    {/* REVEAL: 71 km/s, then Jakarta -> Surabaya in real time */}
    <Counter x={W / 2} y={230} from={S.reveal} to={S.burn} a={0} b={NUM.speedKmS} t0={at("reveal", "tujuh")} t1={at("reveal", "detik") + 0.2} unit=" KM/DETIK" size={160} />
    <Stamp x={W / 2} y={440} from={at("reveal", "Lebih")} to={S.burn} color={C.kunyit} size={74}>200× suara!</Stamp>
    <Pill x={W / 2} y={STAMP_Y} from={S.reveal + 0.6} to={S.storm} size={TXT}>Jakarta–Surabaya ±9 dtk</Pill>

    {/* BURN */}
    <Headline x={W / 2} y={220} from={S.burn} to={S.storm} size={104}>Jadi <span style={{ color: C.kunyit }}>garis cahaya</span></Headline>
    <Pill x={W / 2} y={440} from={S.burn + 0.4} to={S.storm} size={TXT} bg={C.toska}>Sabang–Merauke ±74 dtk</Pill>

    {/* STORM 1833 */}
    <Headline x={W / 2} y={180} from={S.storm} to={S.now} size={130} color={C.koral}>Tahun 1833</Headline>
    <Counter x={W / 2} y={360} from={at("storm", "seratus") - 0.1} to={S.now} a={0} b={NUM.storm1833} t0={at("storm", "seratus")} t1={at("storm", "jam") + 0.2} unit=" /JAM" size={150} />
    <Pill x={W / 2} y={520} from={at("storm", "diperkirakan")} to={S.now} size={TXT}>Perkiraan</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("storm", "jam")} to={S.now} size={80}>Badai meteor!</Stamp>

    {/* NOW */}
    <Headline x={W / 2} y={190} from={S.now} to={S.tips} size={110}>Tahun ini</Headline>
    <Headline x={W / 2} y={360} from={at("now", "sepuluh")} to={S.tips} size={150} color={C.kunyit}>10–15 <span style={{ fontSize: 63, color: C.putih }}>/JAM</span></Headline>
    <Pill x={W / 2} y={STAMP_Y} from={at("now", "langit")} to={S.tips} size={TXT} bg={C.toska}>Di langit gelap</Pill>

    {/* TIPS */}
    <Headline x={W / 2} y={200} from={S.tips} to={S.question} size={104}>Malam <span style={{ color: C.kunyit }}>17→18 Nov</span></Headline>
    <Pill x={W / 2} y={370} from={at("tips", "tengah")} to={S.question} size={TXT}>Tengah malam–subuh</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("tips", "Cukup")} to={S.question} color={C.kunyit} size={76}>Tanpa teleskop</Stamp>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={260} from={S.question + 0.15} to={EP010_SECONDS + 1} size={100}>
      Kamu nonton dari <span style={{ color: C.kunyit }}>kota mana?</span>
    </Headline>
    {CITY_PILLS.map(([name, x, y], i) => (
      <Pill key={name} x={x} y={y} from={S.question + 0.2 + i * 0.08} to={EP010_SECONDS + 1} size={TXT} bg={C.kunyit}>{name}</Pill>
    ))}
    <Pill x={W / 2} y={STAMP_Y} from={at("question", "Tulis")} to={EP010_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "storm").map((s) => [s.start, s.end] as [number, number]);

export const Ep010: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <MapView cam={camera(t)}>
        <MapLayers t={t} />
      </MapView>
      <ProjectionOnly cam={camera(t)}>
        <MapHtmlLabels />
      </ProjectionOnly>
      <Overlays t={t} />
      <LiveCaptions captions={captions} top={CAPTION_TOP} bounce={BOUNCE} />
      <Soundtrack voice="voice/ep010.wav" voiceLufs={-16.3} words={captions} track={EP010_TRACK} seconds={EP010_SECONDS} />
      <SfxLayer captions={sfxCaptions} segments={segments} seconds={EP010_SECONDS} />
    </AbsoluteFill>
  );
};
