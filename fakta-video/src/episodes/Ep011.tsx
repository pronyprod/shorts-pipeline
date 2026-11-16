// Episode 11 (geography): "Kalimantan: satu pulau, tiga negara". Built on the locked template (from Ep010), with
// LiveCaptions + SfxLayer. Borneo is moved to Europe by rotating it on the sphere (moveGeo), true size, one projection.
import type { Caption } from "@remotion/captions";
import { geoBounds, geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React from "react";
import { AbsoluteFill } from "remotion";
import { LiveCaptions } from "../components/LiveCaptions";
import { Geo, MapView, ProjectionOnly, type Camera } from "../components/MapView";
import { SfxLayer } from "../components/SfxLayer";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, FlagRow, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import ep001 from "../../data/ep001-facts.json";
import facts from "../../data/ep011-facts.json";
import { along, moveGeo, type LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, SHADOW, W } from "../theme";
import captionsJson from "./ep011-captions.json";
import timing from "./ep011-timing.json";
import { NUM, PT, type SegmentId } from "./ep011-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP011_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP011_TRACK = pickTrack(11, EP011_SECONDS);

const SAFE_BOTTOM = 1536;
const CAPTION_TOP = 1390;
const STAMP_Y = 1180;
const TXT = 54;
const W_BORNEO = 1500;
const W_BRUNEI = 330;
const W_JAVA = 2300;
const W_HOME = 6200;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

// --- geometry: the Borneo part of each country, Java, metropolitan France (Natural Earth 1:50m) -----------------
type Poly = number[][][];
type Feat = { properties: { iso: string }; geometry: { type: string; coordinates: Poly | Poly[] } };
const feats = (countries as { features: Feat[] }).features;
const polysOf = (iso: string): Poly[] => {
  const g = feats.find((f) => f.properties.iso === iso)!.geometry;
  return g.type === "Polygon" ? [g.coordinates as Poly] : (g.coordinates as Poly[]);
};
const inBox = (p: Poly, [x0, y0, x1, y1]: number[]) => {
  const [[a, b], [c, d]] = geoBounds({ type: "Polygon", coordinates: p } as GeoPermissibleObjects);
  const cx = (a + c) / 2, cy = (b + d) / 2;
  return cx > x0 && cx < x1 && cy > y0 && cy < y1;
};
const multi = (ps: Poly[]) => ({ type: "MultiPolygon", coordinates: ps }) as GeoPermissibleObjects;
const BOX = [108.5, -4.5, 119.5, 7.5];
const IDN_B = multi(polysOf("IDN").filter((p) => inBox(p, BOX)));
const MYS_B = multi(polysOf("MYS").filter((p) => inBox(p, BOX)));
const BRN = multi(polysOf("BRN"));
const FRA = multi(polysOf("FRA").filter((p) => inBox(p, [-6, 41, 10, 52])));
const idnPolys = (indonesia as { geometry: { coordinates: Poly[] } }).geometry.coordinates;
const JAVA = multi(idnPolys.filter((p) => inBox(p, [105, -9, 114.7, -5.5])).slice(0, 1));

// --- timeline -------------------------------------------------------------------------------------------------
const DRAG_EU: [number, number] = [at("europe", "geser") - 0.1, at("europe", "ukurannya") + 0.4];
const DRAG_HOME: [number, number] = [S.three - 0.2, S.three + 1.6];
const BRUNEI_C: LonLat = [114.85, 4.62];
const P = ep001.points as Record<string, { coord: number[] }>;
const HOME = geoInterpolate(P.idWest.coord as LonLat, P.idEast.coord as LonLat)(0.5) as LonLat;
const JAVA_C: LonLat = [111.5, -3.0];

// where Borneo's centre is right now (it travels to France and back)
const borneoAt = (t: number): LonLat => {
  if (t < DRAG_EU[0]) return PT.borneo;
  if (t < DRAG_EU[1]) return along(PT.borneo, PT.france, ramp(t, ...DRAG_EU));
  if (t < DRAG_HOME[0]) return PT.france;
  if (t < DRAG_HOME[1]) return along(PT.france, PT.borneo, ramp(t, ...DRAG_HOME));
  return PT.borneo;
};

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: PT.borneo, w: 1650 },
  { t: 1.2, c: PT.borneo, w: W_BORNEO },
  { t: S.brunei - 0.1, c: PT.borneo, w: W_BORNEO },
  { t: S.brunei + 1.1, c: BRUNEI_C, w: W_BRUNEI },
  { t: S.java - 0.3, c: BRUNEI_C, w: W_BRUNEI },
  { t: S.java + 0.9, c: JAVA_C, w: W_JAVA },
  { t: S.prov - 0.2, c: JAVA_C, w: W_JAVA },
  { t: S.prov + 0.8, c: PT.borneo, w: W_BORNEO },
  { t: S.question - 0.1, c: PT.borneo, w: W_BORNEO },
  { t: S.question + 1.2, c: HOME, w: W_HOME },
  { t: 999, c: HOME, w: 6400 },
];
const keyCam = (t: number): Camera => {
  const i = Math.max(0, KEYS.findIndex((k) => k.t > t) - 1);
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};
// during the Europe trip the camera follows Borneo and zooms out only while it is dragged (the "hop")
const camera = (t: number): Camera => {
  if (t < DRAG_EU[0] || t >= DRAG_HOME[1]) return keyCam(t);
  const [lon, lat] = borneoAt(t);
  const hop = (r: [number, number]) => 7000 * Math.sin(Math.PI * ramp(t, ...r));
  const w = t < DRAG_EU[1] ? W_BORNEO + hop(DRAG_EU) : t < DRAG_HOME[0] ? W_BORNEO : W_BORNEO + hop(DRAG_HOME);
  return { lon, lat, widthKm: w };
};

const fade = (t: number, a: number, b: number, d = 0.3) => Math.max(0, Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b)));

const MapLayers: React.FC<{ t: number }> = ({ t }) => {
  const pos = borneoAt(t);
  const away = t > DRAG_EU[0] && t < DRAG_HOME[1];
  const mv = (g: GeoPermissibleObjects) => (away ? moveGeo(g, PT.borneo, pos) : g);
  const javaOn = fade(t, S.java, S.prov + 0.4);
  const idnRest = fade(t, S.question, 999);
  return (
    <>
      <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
      <g opacity={idnRest}>
        <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.55} stroke={C.putih} strokeWidth={2.2} strokeLinejoin="round" />
      </g>
      {away && (
        <Geo d={multi([...polysOf("IDN").filter((p) => inBox(p, BOX)), ...polysOf("MYS").filter((p) => inBox(p, BOX)), ...polysOf("BRN")])} fill="none" stroke={C.krim} strokeWidth={3} strokeDasharray="10 9" opacity={0.6} />
      )}
      <g opacity={fade(t, DRAG_EU[0] + 0.3, DRAG_HOME[0] + 0.6)}>
        <Geo d={FRA} fill={C.toska} fillOpacity={0.2} stroke={C.toska} strokeWidth={5} />
      </g>
      <g opacity={away ? 0.8 : 1} style={{ filter: away ? "drop-shadow(0 16px 12px rgba(0,0,0,0.6))" : undefined }}>
        <Geo d={mv(IDN_B)} fill={C.koral} fillOpacity={0.85} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
        <Geo d={mv(MYS_B)} fill={C.toska} fillOpacity={t > S.europe && t < S.three ? 0.85 : 0.7} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
        <Geo d={mv(BRN)} fill={C.kunyit} fillOpacity={0.95} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
      </g>
      <g opacity={fade(t, DRAG_EU[0] + 0.3, DRAG_HOME[0] + 0.6)}>
        <Geo d={FRA} fill="none" stroke={C.toska} strokeWidth={6} strokeDasharray="14 8" />
      </g>
      <g opacity={javaOn}>
        <Geo d={JAVA} fill={C.kunyit} fillOpacity={0.85} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
      </g>
      <Pin at={PT.tanjungSelor} from={at("prov", "Kalimantan")} to={S.question + 0.3} color={C.kunyit} r={16} />
    </>
  );
};

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    {/* three countries */}
    <L at={[113.6, -1.0]} from={at("three", "Indonesia")} to={S.tebak + 0.2}>Indonesia</L>
    <L at={[116.9, 5.4]} from={at("three", "Malaysia")} to={S.tebak + 0.2} dy={-30} bg={C.toska}>Malaysia</L>
    <L at={PT.bsb} from={at("three", "Brunei")} to={S.tebak + 0.2} dy={-150} bg={C.kunyit}>Brunei</L>
    {/* France */}
    <L at={PT.france} from={at("europe", "Prancis") - 0.2} to={S.three} dy={-260} bg={C.toska}>Prancis</L>
    {/* Brunei close-up: two parts */}
    <L at={[114.6, 4.55]} from={S.brunei + 1.0} to={S.java} dy={-200} bg={C.kunyit}>Brunei</L>
    <L at={[115.15, 4.55]} from={at("brunei", "terbelah")} to={S.java} dx={130} dy={-60} bg={C.kunyit}>Brunei juga</L>
    {/* Java */}
    <L at={[110.0, -7.2]} from={at("java", "Jawa") - 0.3} to={S.prov + 0.3} dy={-90} bg={C.kunyit}>Jawa</L>
    <L at={[113.0, -1.2]} from={S.java + 0.6} to={S.prov + 0.3}>Kalimantan</L>
    {/* Kalimantan Utara */}
    <L at={PT.tanjungSelor} from={at("prov", "Utara")} to={S.question} dy={-90} bg={C.kunyit}>Kaltara · 2012</L>
  </>
);

// shares of Borneo, bars to scale (73 / 26 / 1 %)
const ShareBars: React.FC<{ t: number }> = ({ t }) => {
  const full = 960;
  const rows = [
    { label: "Indonesia", v: NUM.idnPct, text: "±73%", color: C.koral, from: at("reveal", "persen") },
    { label: "Malaysia", v: NUM.mysPct, text: "±26%", color: C.toska, from: at("reveal", "Malaysia") },
    { label: "Brunei", v: NUM.brnPct, text: "<1%", color: C.kunyit, from: S.brunei },
  ];
  const k = useLife(at("reveal", "persen"), S.brunei + 1.0);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 360, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        if (t < r.from) return null;
        const g = ramp(t, r.from, r.from + 0.6);
        return (
          <div key={r.label} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{r.text}</span>
            </div>
            <div style={{ marginTop: 6, width: Math.max(10, (full * r.v * g) / 100), height: 34, borderRadius: 10, background: r.color, border: `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

// Kalimantan (Indonesian part) vs Java: squares with side ∝ √area (Natural Earth areas, scripts/facts-ep011.mjs)
const AreaSquares: React.FC<{ t: number }> = ({ t }) => {
  const k = useLife(S.java + 0.2, S.prov);
  if (k <= 0.001) return null;
  const big = 330;
  const small = big * Math.sqrt(facts.ne.javaKm2 / facts.ne.idnKm2);
  const g = ramp(t, at("java", "empat") - 0.2, at("java", "Jawa"));
  const base = 560;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, k * 1.4) }}>
      <div style={{ position: "absolute", left: 190, top: base - big, width: big, height: big, background: C.koral, border: `5px solid ${C.tinta}`, borderRadius: 8, boxShadow: "0 8px 0 rgba(27,16,40,0.85)" }} />
      <div style={{ position: "absolute", left: 640, top: base - small * g, width: small, height: small * g, background: C.kunyit, border: `5px solid ${C.tinta}`, borderRadius: 8, boxShadow: "0 8px 0 rgba(27,16,40,0.85)" }} />
      <div style={{ position: "absolute", left: 640 + small + 30, top: base - 150, fontFamily: FONT, fontWeight: 800, fontSize: 130, color: C.kunyit, textShadow: SHADOW, opacity: g }}>×4</div>
    </div>
  );
};

// the "tebak dulu" beat: a big "?" that the reveal replaces
const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 200, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>?%</div>
  );
};

const PROVS: [string, number, number][] = [
  ["Kalbar", 230, 380], ["Kalteng", 540, 380], ["Kalsel", 850, 380],
  ["Kaltim", 385, 490], ["Kaltara", 695, 490],
];
const ISLANDS: [string, number, number][] = [
  ["Kalimantan", 300, 1010], ["Jawa", 780, 1010],
  ["Sumatra", 260, 1120], ["Sulawesi", 560, 1120], ["Papua", 860, 1120],
];

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.8) 0%, rgba(7,6,13,0.2) 30%, rgba(7,6,13,0.2) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK: on screen in the first second */}
    <Headline x={W / 2} y={190} from={-0.25} to={S.name} size={150} color={C.kunyit}>1 PULAU</Headline>
    <Headline x={W / 2} y={350} from={-0.1} to={S.name} size={116}>3 NEGARA!</Headline>
    <FlagRow codes={["id", "my", "bn"]} x={W / 2} y={490} from={0.6} to={S.name} step={0.2} h={70} />

    {/* NAME */}
    <Headline x={W / 2} y={200} from={S.name} to={S.europe} size={130} color={C.kunyit}>KALIMANTAN</Headline>
    <Pill x={W / 2} y={360} from={at("name", "terbesar")} to={S.europe} size={TXT}>Terbesar ke-3 dunia</Pill>
    <Pill x={W / 2} y={STAMP_Y} from={at("name", "dunia")} to={S.europe} size={TXT} bg={C.toska}>{"> 740.000 km²"}</Pill>

    {/* EUROPE: true size, rotated on the sphere */}
    <Headline x={W / 2} y={200} from={S.europe} to={at("europe", "Lebih")} size={110}>Geser ke <span style={{ color: C.toska }}>Eropa</span></Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("europe", "asli")} to={S.three} color={C.kunyit} size={76}>Ukuran asli</Stamp>
    <Headline x={W / 2} y={200} from={at("europe", "Lebih")} to={S.three} size={100}>Lebih luas dari <span style={{ color: C.toska }}>Prancis!</span></Headline>

    {/* THREE COUNTRIES */}
    <Headline x={W / 2} y={190} from={S.three + 0.3} to={S.tebak} size={104}>Satu-satunya di dunia</Headline>
    <FlagRow codes={["id", "my", "bn"]} x={W / 2} y={350} from={at("three", "Indonesia")} to={S.tebak} step={0.7} h={70} />

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={150} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "persen")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Milik Indonesia?</Pill>

    {/* REVEAL */}
    <Counter x={W / 2} y={210} from={S.reveal} to={S.brunei} a={0} b={NUM.idnPct} t0={at("reveal", "tujuh")} t1={at("reveal", "persen") + 0.2} unit="%" size={160} color={C.koral} />
    <ShareBars t={t} />

    {/* BRUNEI: less than 1 %, split in two */}
    <Headline x={W / 2} y={200} from={S.brunei} to={S.java} size={120} color={C.kunyit}>Brunei &lt;1%</Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("brunei", "terbelah")} to={S.java} size={80}>Terbelah dua!</Stamp>

    {/* JAVA */}
    <Headline x={W / 2} y={150} from={S.java} to={S.prov} size={80}>Kalimantan <span style={{ color: C.kunyit }}>vs Jawa</span></Headline>
    <AreaSquares t={t} />
    <Pill x={W / 2} y={STAMP_Y} from={at("java", "empat")} to={S.prov} size={TXT} bg={C.kunyit}>Lebih dari 4× Jawa</Pill>

    {/* PROVINCES */}
    <Headline x={W / 2} y={210} from={S.prov} to={S.question} size={120} color={C.kunyit}>5 PROVINSI</Headline>
    {PROVS.map(([name, x, y], i) => (
      <Pill key={name} x={x} y={y} from={at("prov", "lima") + i * 0.12} to={S.question} size={TXT} bg={name === "Kaltara" ? C.kunyit : C.krim}>{name}</Pill>
    ))}
    <Stamp x={W / 2} y={STAMP_Y} from={at("prov", "lahir")} to={S.question} color={C.kunyit} size={76}>Kaltara: 2012</Stamp>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.1} to={EP011_SECONDS + 1} size={100}>
      Kamu tinggal di <span style={{ color: C.kunyit }}>pulau mana?</span>
    </Headline>
    {ISLANDS.map(([name, x, y], i) => (
      <Pill key={name} x={x} y={y} from={S.question + 0.2 + i * 0.08} to={EP011_SECONDS + 1} size={TXT} bg={C.kunyit}>{name}</Pill>
    ))}
    <Pill x={W / 2} y={STAMP_Y} from={at("question", "Tulis")} to={EP011_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "brunei").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("europe", "Prancis"), name: "impact" as const, vol: 0.7 },
  { at: at("three", "Indonesia"), name: "pop" as const },
  { at: at("brunei", "terbelah"), name: "impact" as const },
  { at: at("java", "empat"), name: "pop" as const },
];

export const Ep011: React.FC = () => {
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
      <Soundtrack voice="voice/ep011.wav" voiceLufs={-16.3} words={captions} track={EP011_TRACK} seconds={EP011_SECONDS} />
      <SfxLayer captions={captions} segments={segments} seconds={EP011_SECONDS} extra={SFX_EXTRA} />
    </AbsoluteFill>
  );
};
