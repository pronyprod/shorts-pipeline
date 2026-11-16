// Episode 3: "Krakatau 1883: suaranya terdengar sampai 4.800 km!" Built on the locked Ep001V3 template.
// One continuous map shot. The sound ring travels at 343 m/s, the pressure wave at 300 m/s (Gabrielson 2010:
// 300-325 m/s); the "jam ke-" clock is real hours after the explosion, compressed onto the voice.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import { geoCircle, geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import { Soundtrack } from "../components/Soundtrack";
import { Captions, Counter, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import { EARTH_R_KM, type LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, H, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep003-captions.json";
import timing from "./ep003-timing.json";
import { ANTIPODE, NUM, PT, type SegmentId } from "./ep003-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP003_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP003_TRACK = pickTrack(3, EP003_SECONDS);

const SAFE_BOTTOM = H * 0.8;
const CAPTION_TOP = 1390;
const STAMP_Y = 1250;
const TXT = 54;
const W_GLOBE = 21000;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};
const fade = (t: number, a: number, b: number, d = 0.3) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));

const K = PT.krakatau, ROD = PT.rodrigues;
const MID_KR = geoInterpolate(K, ROD)(0.5) as LonLat;
// Sabang–Merauke (5.240 km) laid from Krakatau towards Rodrigues, same great circle, true length
const SM_END = geoInterpolate(K, ROD)(NUM.sabangMeraukeKm / NUM.rodriguesKm) as LonLat;
const SUNDA: LonLat = [106.5, -4.5];

// ---- the clock: hours after the explosion, keyed to the spoken words ----
const T_TOKYO = at("cities", "Tokyo"), T_WINA = at("cities", "Wina"), T_NY = at("cities", "York");
const HOURS: [number, number][] = [
  [S.wave, 0],
  [T_TOKYO, 5.4], // computed arrival at 300 m/s (reported: 6 h)
  [T_WINA, 9.7], // reported 10 h
  [T_NY, 15.0], // reported 15 h
  [at("antipode", "Kolombia"), 18.5], // antipode
  [E.antipode, 26],
  [E.glasgow - 0.8, 121], // Glasgow's 7th passage, 5 days
];
const hoursAt = (t: number) => {
  if (t <= HOURS[0][0]) return 0;
  for (let i = 1; i < HOURS.length; i++) {
    const [ta, ha] = HOURS[i - 1], [tb, hb] = HOURS[i];
    if (t < tb) return ha + (hb - ha) * ramp(t, ta, tb, (x) => x);
  }
  return HOURS[HOURS.length - 1][1];
};
const deg = (km: number) => (km / EARTH_R_KM) * (180 / Math.PI);
// ring of the pressure wave after h hours: it runs to the antipode (180°) and back, again and again
const waveRadius = (h: number) => {
  const u = deg((h * 3600 * NUM.waveMs) / 1000) % 360;
  return u <= 180 ? u : 360 - u;
};
// drawn as an open line (not a filled polygon), so clipping at the globe's edge adds no stray edges
const ring = (center: LonLat, r: number): GeoPermissibleObjects => ({
  type: "LineString",
  coordinates: geoCircle().center(center).radius(Math.max(0.05, Math.min(179.9, r))).precision(1)().coordinates[0],
});
// sound ring 343 m/s during the "time" line: 0 -> 3,9 h (reaches Rodrigues)
const soundHours = (t: number) => NUM.soundHours * ramp(t, S.time, E.time - 0.2, (x) => x);

type Key = { t: number; c: LonLat; w: number };
const KEYS: Key[] = [
  { t: 0, c: ROD, w: 3000 },
  { t: S.source - 0.2, c: ROD, w: 3200 },
  { t: S.source + 1.4, c: MID_KR, w: 6300 },
  { t: S.local, c: MID_KR, w: 6300 },
  { t: S.local + 1.0, c: geoInterpolate(K, SM_END)(0.5) as LonLat, w: 6900 },
  { t: S.time, c: geoInterpolate(K, SM_END)(0.5) as LonLat, w: 6900 },
  { t: S.time + 0.6, c: MID_KR, w: 6300 },
  { t: S.twist, c: MID_KR, w: 6300 },
  { t: S.twist + 1.6, c: K, w: W_GLOBE },
  { t: S.wave + 1.5, c: K, w: W_GLOBE },
  { t: T_NY, c: geoInterpolate(K, PT.newYork)(0.55) as LonLat, w: W_GLOBE },
  { t: at("antipode", "Kolombia"), c: [-60, 15], w: W_GLOBE },
  { t: S.glasgow + 0.8, c: [10, 40], w: W_GLOBE },
  { t: E.glasgow, c: [10, 40], w: W_GLOBE },
  { t: S.area + 1.2, c: K, w: W_GLOBE },
  { t: S.close, c: K, w: W_GLOBE },
  { t: S.close + 1.6, c: SUNDA, w: 3200 },
  { t: 999, c: SUNDA, w: 3400 },
];
const camera = (t: number): Camera => {
  const i = Math.max(0, KEYS.findIndex((k) => k.t > t) - 1);
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

const Rings: React.FC<{ r: number; color: string; width: number }> = ({ r, color, width }) => (
  <>
    {[0.55, 0.78].map((f) => (
      <Geo key={f} d={ring(K, r * f)} fill="none" stroke={color} strokeWidth={width * 0.6} opacity={0.35 * f} />
    ))}
    <Geo d={ring(K, r)} fill="none" stroke={C.tinta} strokeWidth={width + 6} strokeOpacity={0.5} />
    <Geo d={ring(K, r)} fill="none" stroke={color} strokeWidth={width} />
  </>
);

const MapLayers: React.FC<{ t: number }> = ({ t }) => {
  const h = hoursAt(t);
  const boom = ramp(t, at("hook", "gemuruh") - 0.1, at("hook", "gemuruh") + 0.9, (x) => x);
  return (
    <>
      <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
      <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.88} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
      {/* hook: the rumble reaches Rodrigues */}
      {boom > 0 && boom < 1 && <Geo d={ring(ROD, 0.3 + 3.5 * boom)} fill="none" stroke={C.kunyit} strokeWidth={8} opacity={1 - boom} />}
      {/* Krakatau -> Rodrigues */}
      <g opacity={fade(t, S.source, S.twist + 0.4)}>
        <Route from={K} to={ROD} progress={ramp(t, at("source", "Krakatau"), at("source", "Jaraknya") + 0.6)} color={C.kunyit} width={11} />
      </g>
      {/* Sabang–Merauke length, same direction, from Krakatau */}
      <g opacity={fade(t, S.local, S.time + 0.4)}>
        <Route from={K} to={SM_END} progress={ramp(t, S.local + 0.3, at("local", "Merauke") + 0.2)} color={C.toska} width={9} dash="18 12" glow={false} />
      </g>
      {/* sound at 343 m/s */}
      {t > S.time && t < S.twist + 0.3 && <Rings r={deg(soundHours(t) * 3600 * 0.343)} color={C.kunyit} width={7} />}
      {/* pressure wave at 300 m/s */}
      {t > S.wave && t < S.area + 0.3 && (
        <g opacity={fade(t, S.wave, S.area + 0.3)}>
          <Rings r={waveRadius(h)} color={C.koral} width={9} />
        </g>
      )}
      <Pin at={ROD} from={0.2} to={S.twist + 0.3} r={19} />
      <Pin at={K} from={at("source", "Krakatau")} to={EP003_SECONDS + 1} color={C.koral} r={19} />
      <Pin at={SM_END} from={at("local", "Merauke")} to={S.time + 0.3} color={C.toska} r={15} />
      <Pin at={PT.tokyo} from={T_TOKYO} to={S.glasgow} color={C.toska} r={15} />
      <Pin at={PT.vienna} from={T_WINA} to={S.glasgow} color={C.toska} r={15} />
      <Pin at={PT.newYork} from={T_NY} to={S.glasgow} color={C.toska} r={15} />
      <Pin at={ANTIPODE} from={at("antipode", "Medelln")} to={S.glasgow} color={C.kunyit} r={15} />
      <Pin at={PT.glasgow} from={S.glasgow} to={S.area} color={C.kunyit} r={17} />
    </>
  );
};

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={ROD} from={0.2} to={S.twist} dy={-85}>Pulau Rodrigues</L>
    <L at={K} from={at("source", "Krakatau")} to={S.twist} dy={-85} bg={C.koral} fg={C.putih}>Krakatau</L>
    <L at={PT.tokyo} from={T_TOKYO} to={S.antipode + 0.5} dy={-80} bg={C.toska}>Tokyo · 6 jam</L>
    <L at={PT.vienna} from={T_WINA} to={S.antipode + 0.5} dy={-80} bg={C.toska}>Wina · 10 jam</L>
    <L at={PT.newYork} from={T_NY} to={S.antipode + 0.5} dy={85} bg={C.toska}>New York · 15 jam</L>
    <L at={ANTIPODE} from={at("antipode", "Medelln")} to={S.glasgow} dy={85} bg={C.kunyit}>Dekat Medellín</L>
    <L at={PT.glasgow} from={S.glasgow} to={S.area} dy={-80} bg={C.kunyit}>Glasgow</L>
    <L at={K} from={S.close + 1.2} to={EP003_SECONDS + 1} dy={-85} bg={C.koral} fg={C.putih}>Krakatau</L>
  </>
);

// two distances to scale
const Bars: React.FC<{ t: number }> = ({ t }) => {
  const rows = [
    { label: "Krakatau–Rodrigues", km: NUM.rodriguesKm, color: C.kunyit, from: S.local },
    { label: "Sabang–Merauke", km: NUM.sabangMeraukeKm, color: C.toska, from: S.local + 0.3 },
  ];
  const full = 960, max = NUM.sabangMeraukeKm;
  const k = useLife(S.local, S.time);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 110, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        const g = ramp(t, r.from, r.from + 0.8);
        return (
          <div key={r.label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{fmt(r.km * g)} km</span>
            </div>
            <div style={{ marginTop: 8, width: (full * r.km * g) / max, height: 44, borderRadius: 12, background: r.color, border: `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

// audible area: 1 square = Indonesia's area; 20,6 squares
const AreaGrid: React.FC<{ t: number }> = ({ t }) => {
  const from = at("area", "Lebih") - 0.2;
  const k = useLife(from, S.close + 0.2);
  if (k <= 0.001) return null;
  const n = NUM.audibleVsIndonesia, cols = 6, side = 132, gap = 18;
  const cells = Math.ceil(n);
  const x0 = W / 2 - (cols * side + (cols - 1) * gap) / 2;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, k * 1.4) }}>
      {Array.from({ length: cells }, (_, i) => {
        const g = ramp(t, from + i * 0.05, from + i * 0.05 + 0.3);
        const part = i === cells - 1 ? n - Math.floor(n) : 1;
        return (
          <div key={i} style={{ position: "absolute", left: x0 + (i % cols) * (side + gap), top: 500 + Math.floor(i / cols) * (side + gap), width: side, height: side, borderRadius: 10, border: `4px solid ${C.putih}`, background: "rgba(27,16,40,0.4)", transform: `scale(${g})`, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, bottom: 0, width: side * part, height: "100%", background: C.koral }} />
          </div>
        );
      })}
    </div>
  );
};

const Clock: React.FC<{ t: number }> = ({ t }) => {
  const k = useLife(S.wave, S.area);
  if (k <= 0.001) return null;
  const h = hoursAt(t);
  const passes = NUM.reported.glasgowHours.filter((x) => x <= h + 0.01).length;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, fontFamily: FONT, opacity: Math.min(1, k * 1.5) }}>
      <div style={{ padding: "14px 34px", borderRadius: 999, background: C.krim, color: C.tinta, fontSize: 60, fontWeight: 800, textTransform: "uppercase", boxShadow: "0 8px 0 rgba(27,16,40,0.85)", fontVariantNumeric: "tabular-nums" }}>
        Jam ke-{Math.floor(h)}
      </div>
      {t >= S.glasgow && (
        <div style={{ color: C.kunyit, fontSize: 150, fontWeight: 800, textShadow: SHADOW, letterSpacing: -3 }}>
          {passes}× <span style={{ fontSize: 60, color: C.putih }}>LEWAT GLASGOW</span>
        </div>
      )}
    </div>
  );
};

const Overlays: React.FC<{ t: number }> = ({ t }) => {
  const dim = 0.6 * fade(t, at("area", "Lebih") - 0.3, S.close + 0.2);
  return (
    <>
      <AbsoluteFill style={{ background: C.angkasa, opacity: dim }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.78) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 64%, rgba(7,6,13,0.72) 100%)" }} />

      {/* HOOK (second person) */}
      <Headline x={W / 2} y={150} from={-0.25} to={S.source} size={150} color={C.kunyit}>1883</Headline>
      <Headline x={W / 2} y={330} from={0.15} to={S.source} size={84}>Kamu di Pulau Rodrigues…</Headline>
      <Stamp x={W / 2} y={STAMP_Y} from={at("hook", "gemuruh")} to={S.source} color={C.kunyit} size={86}>Gemuruh!</Stamp>

      {/* SOURCE */}
      <Pill x={W / 2} y={170} from={at("source", "Krakatau")} to={S.local} size={TXT} bg={C.koral} fg={C.putih}>Sumbernya: Krakatau</Pill>
      <Counter x={W / 2} y={310} from={at("source", "Krakatau") + 0.1} to={S.local} a={0} b={NUM.rodriguesKm} t0={at("source", "Jaraknya")} t1={at("source", "kilometer")} unit="KM" size={160} />

      {/* LOCAL */}
      <Bars t={t} />
      <Stamp x={W / 2} y={STAMP_Y} from={at("local", "Indonesia")} to={S.time} color={C.kunyit} size={86}>{Math.round((NUM.rodriguesKm / NUM.sabangMeraukeKm) * 100)}% Sabang–Merauke</Stamp>

      {/* TIME */}
      <Pill x={W / 2} y={170} from={S.time} to={S.twist} size={TXT}>Kecepatan suara 343 m/s</Pill>
      <Counter x={W / 2} y={310} from={S.time + 0.1} to={S.twist} a={0} b={NUM.soundHours} t0={S.time} t1={E.time - 0.2} unit="JAM" size={160} decimals={1} />

      {/* TWIST */}
      <Headline x={W / 2} y={260} from={S.twist} to={S.wave} size={104} color={C.koral}>Baru permulaan…</Headline>

      {/* WAVE / CITIES / ANTIPODE / GLASGOW */}
      <Clock t={t} />
      <Pill x={W / 2} y={STAMP_Y} from={at("wave", "lima")} to={S.cities + 0.3} size={60} bg={C.kunyit}>50+ stasiun cuaca</Pill>
      <Stamp x={W / 2} y={STAMP_Y} from={at("antipode", "balik")} to={S.glasgow} color={C.kunyit} size={86}>Balik lagi!</Stamp>
      <Stamp x={W / 2} y={STAMP_Y} from={at("glasgow", "lima")} to={S.area} color={C.kunyit} size={86}>5 hari</Stamp>

      {/* AREA */}
      <Pill x={W / 2} y={170} from={S.area} to={S.close} size={60}>≈ 1/13 permukaan Bumi</Pill>
      <Pill x={W / 2} y={300} from={at("area", "Lebih") - 0.2} to={S.close} size={TXT} bg={C.koral} fg={C.putih}>1 kotak = luas Indonesia</Pill>
      <AreaGrid t={t} />
      <Stamp x={W / 2} y={STAMP_Y} from={at("area", "kali")} to={S.close} color={C.kunyit} size={86}>20× Indonesia</Stamp>

      {/* CLOSE */}
      <Headline x={W / 2} y={250} from={S.close + 0.2} to={S.question} size={100}>Satu gunung, <span style={{ color: C.kunyit }}>satu planet</span></Headline>

      {/* QUESTION */}
      <Headline x={W / 2} y={260} from={S.question} to={EP003_SECONDS + 1} size={100}>
        Dari kotamu <span style={{ color: C.kunyit }}>kedengaran?</span>
      </Headline>
      <Pill x={W / 2 - 230} y={1150} from={S.question + 0.3} to={EP003_SECONDS + 1} size={62} bg={C.kunyit}>Kedengaran</Pill>
      <Pill x={W / 2 + 270} y={1150} from={S.question + 0.45} to={EP003_SECONDS + 1} size={62} bg={C.krim}>Nggak</Pill>
      <Pill x={W / 2} y={1285} from={at("question", "Tulis")} to={EP003_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
    </>
  );
};

const sfx = (): { at: number; name: string; vol: number }[] => [
  { at: 0, name: "rise", vol: 0.25 },
  { at: at("hook", "gemuruh"), name: "stamp", vol: 0.5 },
  { at: at("source", "Krakatau"), name: "pop", vol: 0.35 },
  { at: S.local, name: "pop", vol: 0.35 },
  { at: at("local", "Indonesia"), name: "stamp", vol: 0.5 },
  { at: S.twist + 0.1, name: "whoosh", vol: 0.45 },
  { at: T_TOKYO, name: "pop", vol: 0.35 },
  { at: T_WINA, name: "pop", vol: 0.35 },
  { at: T_NY, name: "pop", vol: 0.35 },
  { at: at("antipode", "balik"), name: "stamp", vol: 0.5 },
  ...NUM.reported.glasgowHours.map((hh) => {
    // tick each time the wave passes Glasgow (same hour -> time mapping as the clock)
    let tt = S.glasgow;
    while (tt < E.glasgow && hoursAt(tt) < hh) tt += 1 / 30;
    return { at: tt, name: "tick", vol: 0.4 };
  }),
  { at: at("area", "kali"), name: "stamp", vol: 0.5 },
  { at: S.question, name: "pop", vol: 0.35 },
];

export const Ep003: React.FC = () => {
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
      <Soundtrack voice="voice/ep003.wav" voiceLufs={-16.5} words={captions} track={EP003_TRACK} seconds={EP003_SECONDS} />
      {sfx().map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={2 * fps} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
