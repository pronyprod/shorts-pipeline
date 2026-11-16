// Episode 12 (animals): "Burung cenderawasih pernah dikira nggak punya kaki?". Built on the locked template (from
// Ep011), with LiveCaptions + SfxLayer. One map shot: Papua/Maluku -> globe (Maluku-Spain line) -> Papua.
// The bird is our own simple drawing (SVG shapes), not a photo.
import type { Caption } from "@remotion/captions";
import { geoBounds, geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React from "react";
import { AbsoluteFill } from "remotion";
import { LiveCaptions } from "../components/LiveCaptions";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import { SfxLayer } from "../components/SfxLayer";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Flag, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import ep001 from "../../data/ep001-facts.json";
import facts from "../../data/ep012-facts.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep012-captions.json";
import timing from "./ep012-timing.json";
import { NUM, PT, type SegmentId } from "./ep012-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP012_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP012_TRACK = pickTrack(12, EP012_SECONDS);

const SAFE_BOTTOM = 1536;
const CAPTION_TOP = 1390;
const STAMP_Y = 1180;
const TXT = 54;
const W_PAPUA = 3300;
const W_GLOBE = 17500;
const W_HOME = 6200;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

// --- geometry: New Guinea = Indonesian Papua + Papua New Guinea (Natural Earth) ------------------------------------
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
const idnPolys = (indonesia as { geometry: { coordinates: Poly[] } }).geometry.coordinates;
const NG_BOX = [130.5, -11, 151, 0.5];
const NEW_GUINEA = multi([...idnPolys.filter((p) => inBox(p, NG_BOX)), ...polysOf("PNG").filter((p) => inBox(p, [140, -11, 151, -1]))]);
const MALUKU = multi(idnPolys.filter((p) => inBox(p, [124.5, -8.5, 131.5, 3])));

// --- camera -----------------------------------------------------------------------------------------------------
const P = ep001.points as Record<string, { coord: number[] }>;
const SABANG = P.sabang.coord as LonLat, MERAUKE = P.merauke.coord as LonLat;
const HOME = geoInterpolate(P.idWest.coord as LonLat, P.idEast.coord as LonLat)(0.5) as LonLat;
const REGION: LonLat = [135.5, -3.6];
const MID = geoInterpolate(PT.tidore, PT.seville)(0.5) as LonLat;
const GLOBE_C: LonLat = [MID[0] + 4, MID[1] - 6];

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: REGION, w: 3600 },
  { t: S.name + 0.6, c: REGION, w: W_PAPUA },
  { t: S.ship + 0.2, c: REGION, w: W_PAPUA },
  { t: at("ship", "kapal"), c: GLOBE_C, w: W_GLOBE },
  { t: S.nofeet - 0.2, c: GLOBE_C, w: W_GLOBE },
  { t: S.nofeet + 1.2, c: REGION, w: W_PAPUA },
  { t: S.question - 0.1, c: REGION, w: W_PAPUA },
  { t: S.question + 1.2, c: HOME, w: W_HOME },
  { t: 999, c: HOME, w: 6400 },
];
const camera = (t: number): Camera => {
  const i = Math.max(0, KEYS.findIndex((k) => k.t > t) - 1);
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

const fade = (t: number, a: number, b: number, d = 0.3) => Math.max(0, Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b)));

const MapLayers: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.55} stroke={C.putih} strokeWidth={2.2} strokeLinejoin="round" />
    <g opacity={fade(t, S.name, S.ship + 0.6) + fade(t, S.species, S.question + 0.4)}>
      <Geo d={NEW_GUINEA} fill={C.kunyit} fillOpacity={0.8} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
    </g>
    <g opacity={fade(t, at("name", "Maluku"), S.ship + 0.6)}>
      <Geo d={MALUKU} fill={C.toska} fillOpacity={0.85} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
    </g>
    {/* Maluku -> Spain, straight line (the real voyage went round Africa) */}
    <g opacity={fade(t, at("ship", "kulitnya"), S.nofeet + 0.3)}>
      <Route from={PT.tidore} to={PT.seville} progress={ramp(t, at("ship", "kulitnya"), at("ship", "Spanyol"))} color={C.kunyit} width={11} />
      <Route from={SABANG} to={MERAUKE} progress={ramp(t, at("far", "Sabang") - 0.1, at("far", "Merauke") + 0.2)} color={C.toska} width={11} />
    </g>
    <Pin at={PT.tidore} from={at("ship", "kulitnya")} to={S.nofeet + 0.2} color={C.kunyit} r={16} />
    <Pin at={PT.seville} from={at("ship", "Spanyol") - 0.1} to={S.nofeet + 0.2} color={C.kunyit} r={16} />
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={[138.5, -4.6]} from={at("name", "Papua")} to={S.ship + 0.3} dy={90}>Papua</L>
    <L at={[128.0, 0.4]} from={at("name", "Maluku")} to={S.ship + 0.3} dy={-90} bg={C.toska}>Maluku</L>
    <L at={PT.tidore} from={at("ship", "Maluku")} to={S.nofeet} dx={170} dy={-40}>Maluku</L>
    <L at={PT.seville} from={at("ship", "Spanyol")} to={S.nofeet} dy={-90}>Spanyol</L>
    <L at={[136.5, -3.0]} from={at("species", "Papua") - 0.2} to={S.question} dy={-100}>Pulau Papua</L>
  </>
);

// --- our own bird drawing: a bird-of-paradise silhouette with plumes; legs can vanish -------------------------------
const Bird: React.FC<{ t: number; x: number; y: number; scale: number; opacity: number; legs: number; flap: number }> = ({ t, x, y, scale, opacity, legs, flap }) => {
  if (opacity <= 0.001) return null;
  const wing = flap * Math.sin(t * 9) * 28;
  const bob = flap * Math.sin(t * 9 + 1) * 10;
  return (
    <svg width={520 * scale} height={420 * scale} viewBox="0 0 520 420" style={{ position: "absolute", left: x - 260 * scale, top: y - 210 * scale + bob, opacity, overflow: "visible" }}>
      <g stroke={C.tinta} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round">
        {/* plumes */}
        <path d="M200 230 C 150 300, 90 330, 20 340 C 90 300, 130 270, 170 220 Z" fill={C.kunyit} />
        <path d="M215 240 C 180 320, 120 380, 50 400 C 120 340, 160 290, 185 230 Z" fill={C.krim} />
        <path d="M230 245 C 220 330, 180 390, 120 415 C 170 350, 195 300, 205 240 Z" fill={C.kunyit} />
        {/* legs */}
        <g opacity={legs} fill="none">
          <path d="M265 265 L 255 330 M 255 330 L 235 345 M 255 330 L 275 345 M300 262 L 305 330 M 305 330 L 285 345 M 305 330 L 325 345" stroke={C.tinta} strokeWidth={20} />
          <path d="M265 265 L 255 330 M 255 330 L 235 345 M 255 330 L 275 345 M300 262 L 305 330 M 305 330 L 285 345 M 305 330 L 325 345" stroke={C.kunyit} strokeWidth={9} />
        </g>
        {/* body */}
        <ellipse cx="285" cy="215" rx="95" ry="62" fill={C.koral} />
        {/* wing */}
        <path d={`M240 200 C 280 ${150 - wing}, 340 ${150 - wing}, 360 ${185 - wing / 3} C 330 230, 280 235, 240 200 Z`} fill="#C2405A" />
        {/* head */}
        <circle cx="375" cy="150" r="48" fill={C.kunyit} />
        <path d="M418 145 L 470 160 L 418 172 Z" fill={C.krim} />
        <circle cx="388" cy="140" r="8" fill={C.tinta} stroke="none" />
        {/* throat */}
        <path d="M340 175 C 355 200, 385 200, 400 182" fill={C.toska} />
      </g>
    </svg>
  );
};
// a red cross drawn where the legs would be
const NoLegs: React.FC<{ x: number; y: number; scale: number; k: number }> = ({ x, y, scale, k }) => {
  if (k <= 0.001) return null;
  const s = 150 * scale * k;
  return (
    <svg width={s * 2} height={s * 2} viewBox="-100 -100 200 200" style={{ position: "absolute", left: x - s, top: y - s, overflow: "visible" }}>
      <circle r="80" fill="none" stroke={C.koral} strokeWidth={18} />
      <path d="M-56 56 L56 -56" stroke={C.koral} strokeWidth={18} strokeLinecap="round" />
    </svg>
  );
};

// to-scale distance bars (straight line Maluku-Spain vs Sabang-Merauke)
const DistBars: React.FC<{ t: number }> = ({ t }) => {
  const full = 960;
  const rows = [
    { label: "Maluku–Spanyol", v: facts.tidoreSeville.haversineKm, color: C.kunyit, from: S.far },
    { label: "Sabang–Merauke", v: facts.sabangMerauke.haversineKm, color: C.toska, from: at("far", "Sabang") - 0.2 },
  ];
  const max = rows[0].v;
  const k = useLife(S.far, S.nofeet);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 300, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        if (t < r.from) return null;
        const g = ramp(t, r.from, r.from + 0.7);
        return (
          <div key={r.label} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{fmt(Math.round((r.v * g) / 10) * 10)} km</span>
            </div>
            <div style={{ marginTop: 6, width: Math.max(10, (full * r.v * g) / max), height: 34, borderRadius: 10, background: r.color, border: `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

// 40 dots = about 40 species; 27 lit = on the island of New Guinea (Cornell Lab)
const SpeciesDots: React.FC<{ t: number }> = ({ t }) => {
  const k = useLife(at("species", "empat"), S.question);
  if (k <= 0.001) return null;
  const lit = ramp(t, at("species", "Dua") - 0.1, at("species", "Papua"));
  const cols = 10, d = 72, gap = 20, w = cols * d + (cols - 1) * gap;
  return (
    <div style={{ position: "absolute", left: (W - w) / 2, top: 330, width: w, display: "flex", flexWrap: "wrap", gap, opacity: Math.min(1, k * 1.4) }}>
      {Array.from({ length: NUM.species }, (_, i) => {
        const on = i < Math.round(lit * NUM.papuaSpecies);
        const pop = ramp(t, at("species", "empat") + i * 0.02, at("species", "empat") + i * 0.02 + 0.3);
        return <div key={i} style={{ width: d, height: d, borderRadius: "50%", background: on ? C.kunyit : C.krim, border: `5px solid ${C.tinta}`, transform: `scale(${pop})`, boxShadow: "0 5px 0 rgba(27,16,40,0.85)" }} />;
      })}
    </div>
  );
};

// the "tebak dulu" beat: a big "TAHUN ?" that the reveal replaces
const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 180, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>17??</div>
  );
};

const ANIMALS: [string, number, number][] = [
  ["Komodo", 300, 1010], ["Orangutan", 760, 1010],
  ["Anoa", 190, 1120], ["Jalak Bali", 520, 1120], ["Badak", 870, 1120],
];

const BIRD_X = W / 2, BIRD_Y = 800;

const Overlays: React.FC<{ t: number }> = ({ t }) => {
  // the bird is on screen in the hook and from "Tapi tunggu" to the end of the twist
  const birdOn = Math.max(fade(t, -1, S.name + 0.2), fade(t, S.nofeet + 0.2, S.species + 0.1));
  const legs = t < S.twist ? 0 : ramp(t, at("twist", "kakinya") - 0.1, at("twist", "kakinya") + 0.5);
  const flap = t > S.myth && t < S.tebak ? 1 : 0.15;
  const noLegsK = Math.max(fade(t, 0.3, S.name, 0.2), fade(t, at("nofeet", "tanpa"), S.myth + 0.2, 0.2), fade(t, at("reveal", "tanpa"), S.twist, 0.2));
  const dim = Math.max(fade(t, -1, S.name + 0.2), fade(t, S.nofeet + 0.2, S.species + 0.1));
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.8) 0%, rgba(7,6,13,0.2) 30%, rgba(7,6,13,0.2) 64%, rgba(7,6,13,0.72) 100%)" }} />
      <AbsoluteFill style={{ background: `rgba(7,6,13,${0.45 * dim})` }} />
      <Bird t={t} x={BIRD_X} y={BIRD_Y} scale={1.5} opacity={birdOn} legs={legs} flap={flap} />
      <NoLegs x={BIRD_X + 30} y={BIRD_Y + 210} scale={0.9} k={noLegsK} />

      {/* HOOK: on screen in the first second */}
      <Headline x={W / 2} y={200} from={-0.25} to={S.name} size={150} color={C.kunyit}>0 KAKI?</Headline>
      <Headline x={W / 2} y={360} from={-0.1} to={S.name} size={84}>Burung ini dikira…</Headline>

      {/* NAME */}
      <Headline x={W / 2} y={200} from={S.name} to={S.ship} size={112} color={C.kunyit}>CENDERAWASIH</Headline>
      <Pill x={W / 2} y={350} from={at("name", "khas")} to={S.ship} size={TXT}>Khas Papua &amp; Maluku</Pill>

      {/* SHIP */}
      <Headline x={W / 2} y={200} from={S.ship} to={S.far} size={150} color={C.kunyit}>1522</Headline>
      <Pill x={W / 2} y={350} from={at("ship", "kapal")} to={S.far} size={TXT}>Kapal Victoria</Pill>

      {/* FAR */}
      <Headline x={W / 2} y={170} from={S.far} to={S.nofeet} size={88}>Jarak lurus</Headline>
      <DistBars t={t} />
      <Stamp x={790} y={760} from={at("far", "kali")} to={S.nofeet} color={C.kunyit} size={80}>2,5× lebih!</Stamp>

      {/* NO FEET */}
      <Headline x={W / 2} y={200} from={S.nofeet} to={at("nofeet", "kulit")} size={116} color={C.koral}>Tapi tunggu…</Headline>
      <Headline x={W / 2} y={200} from={at("nofeet", "kulit")} to={S.myth} size={96}>Kulitnya dijual…</Headline>
      <Stamp x={W / 2} y={STAMP_Y} from={at("nofeet", "tanpa")} to={S.myth} size={84}>Tanpa kaki</Stamp>

      {/* MYTH */}
      <Headline x={W / 2} y={190} from={S.myth} to={S.tebak} size={110}>Mitos <span style={{ color: C.toska }}>Eropa</span></Headline>
      <Pill x={W / 2} y={340} from={at("myth", "terbang")} to={S.tebak} size={TXT} bg={C.toska}>Terbang terus</Pill>
      <Stamp x={W / 2} y={STAMP_Y} from={at("myth", "hinggap")} to={S.tebak} color={C.kunyit} size={74}>Nggak pernah hinggap</Stamp>

      {/* TEBAK DULU */}
      <Pill x={W / 2} y={150} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
      <Guess />
      <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "nama")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Diberi nama tahun?</Pill>

      {/* REVEAL */}
      <Headline x={W / 2} y={210} from={S.reveal} to={S.twist} size={170} color={C.kunyit}>1758</Headline>
      <Pill x={W / 2} y={380} from={at("reveal", "Nama")} to={S.twist} size={TXT} icon={<Flag code="se" h={42} />}><i>Paradisaea apoda</i></Pill>
      <Stamp x={W / 2} y={STAMP_Y} from={at("reveal", "artinya")} to={S.twist} size={80}>apoda = tanpa kaki</Stamp>

      {/* TWIST */}
      <Headline x={W / 2} y={190} from={S.twist} to={S.species} size={116} color={C.koral}>Padahal…</Headline>
      <Pill x={W / 2} y={340} from={at("twist", "seratus")} to={S.species} size={TXT} bg={C.toska}>Sejak ±1650-an</Pill>
      <Stamp x={W / 2} y={STAMP_Y} from={at("twist", "kakinya")} to={S.species} color={C.kunyit} size={80}>Kakinya ada!</Stamp>

      {/* SPECIES */}
      <Counter x={W / 2} y={170} from={S.species} to={S.question} a={0} b={NUM.species} t0={at("species", "empat")} t1={at("species", "jenis") + 0.2} unit=" JENIS" size={130} />
      <SpeciesDots t={t} />
      <Stamp x={W / 2} y={STAMP_Y} from={at("species", "tujuh")} to={S.question} color={C.kunyit} size={80}>27 di Pulau Papua</Stamp>

      {/* IDENTITY QUESTION */}
      <Headline x={W / 2} y={250} from={S.question + 0.15} to={EP012_SECONDS + 1} size={96}>
        Hewan khas <span style={{ color: C.kunyit }}>daerahmu?</span>
      </Headline>
      {ANIMALS.map(([name, x, y], i) => (
        <Pill key={name} x={x} y={y} from={S.question + 0.25 + i * 0.08} to={EP012_SECONDS + 1} size={TXT} bg={C.kunyit}>{name}</Pill>
      ))}
      <Pill x={W / 2} y={STAMP_Y + 80} from={at("question", "Tulis")} to={EP012_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
    </>
  );
};

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "twist").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("nofeet", "tanpa"), name: "impact" as const },
  { at: at("far", "kali"), name: "pop" as const },
  { at: at("twist", "kakinya"), name: "impact" as const, vol: 0.7 },
];

export const Ep012: React.FC = () => {
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
      <Soundtrack voice="voice/ep012.wav" voiceLufs={-16.6} words={captions} track={EP012_TRACK} seconds={EP012_SECONDS} />
      <SfxLayer captions={captions} segments={segments} seconds={EP012_SECONDS} extra={SFX_EXTRA} />
    </AbsoluteFill>
  );
};
