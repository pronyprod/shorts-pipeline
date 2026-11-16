// Episode 1, version 3: V2's picture (phone readability) with the channel's real sound:
// Gemini TTS narration (Puck, gemini-3.1-flash-tts-preview) and rotated YouTube Audio Library music,
// ducked under the voice by <Soundtrack>. Voice/captions come from the ep001v3 files. V1 and V2 stay untouched.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { Captions, Counter, Flag, FlagRow, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import { Soundtrack } from "../components/Soundtrack";
import { pickTrack } from "../music";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import usa48 from "../data/usa48.json";
import { along, moveFn, moveGeo, type LonLat } from "../lib/geo";
import { C, FONT, H, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep001v3-captions.json";
import timing from "./ep001v3-timing.json";
import { EU_COVERED, NUM, PLACE, PT, type SegmentId } from "./ep001-script";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3; // seconds after the last word (the question is on screen ~3 s in total)
export const EP001V3_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP001V3_TRACK = pickTrack(1, EP001V3_SECONDS); // Brain Trust (see USED in src/music.ts)

// ---- phone layout (1080x1920) ----
const SAFE_BOTTOM = H * 0.8; // 1536: nothing below this line (YouTube/TikTok UI covers it)
const CAPTION_TOP = 1390; // caption line 1390-1467
const STAMP_Y = 1250;
const TXT = 54; // smallest text size anywhere (capital letters ~40 px)
const W_HOME = 6200; // km across the frame: Indonesia (5.366 km) fills ~87% of the width
const W_AWAY = 6300;

// start time (s) of the nth word matching `w` inside a segment
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

const ID_MID = geoInterpolate(PT.idWest, PT.idEast)(0.5) as LonLat;
const HOME = ID_MID;

// ---- choreography ----
const DRAG_US: [number, number] = [at("lift", "geser") - 0.5, S.usWidth + 0.5];
const DRAG_EU: [number, number] = [S.europe + 0.1, at("europe", "Sabang") - 0.1];
const DRAG_HOME: [number, number] = [S.timezones + 0.1, S.timezones + 2.3];
const TZ = at("timezones", "Indonesia") + 0.2; // WIB/WITA/WIT appear
const Q_PILLS = at("question", "mana"); // WIB/WITA/WIT answer pills

// Where Indonesia's centre is at time t (the shape is rotated there on the sphere, true size).
const idTarget = (t: number): LonLat => {
  if (t < DRAG_US[0]) return HOME;
  if (t < DRAG_US[1]) return along(HOME, PLACE.usTarget, ramp(t, ...DRAG_US));
  if (t < DRAG_EU[0]) return PLACE.usTarget;
  if (t < DRAG_EU[1]) return along(PLACE.usTarget, PLACE.euTarget, ramp(t, ...DRAG_EU));
  if (t < DRAG_HOME[0]) return PLACE.euTarget;
  return along(PLACE.euTarget, HOME, ramp(t, ...DRAG_HOME));
};

const camera = (t: number): Camera => {
  const [lon, lat] = idTarget(t);
  const hop = (r: [number, number], peak: number) => peak * Math.sin(Math.PI * ramp(t, ...r));
  let widthKm = W_HOME;
  if (t < DRAG_US[0]) widthKm = interpolate(t, [0, DRAG_US[0]], [5900, W_HOME]);
  else if (t < DRAG_US[1]) widthKm = W_HOME + (W_AWAY - W_HOME) * ramp(t, ...DRAG_US) + hop(DRAG_US, 8000);
  else if (t < DRAG_EU[0]) widthKm = W_AWAY;
  else if (t < DRAG_EU[1]) widthKm = W_AWAY + hop(DRAG_EU, 5500);
  else if (t < DRAG_HOME[0]) widthKm = W_AWAY;
  else if (t < DRAG_HOME[1]) widthKm = interpolate(ramp(t, ...DRAG_HOME), [0, 1], [W_AWAY, W_HOME]) + hop(DRAG_HOME, 5500);
  else widthKm = interpolate(t, [DRAG_HOME[1], EP001V3_SECONDS], [W_HOME, 6400]);
  return { lon, lat, widthKm };
};

const fade = (t: number, a: number, b: number, d = 0.3) =>
  Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));

const MapLayers: React.FC<{ t: number }> = ({ t }) => {
  const target = idTarget(t);
  const mv = moveFn(HOME, target);
  const moved = moveGeo(indonesia as GeoPermissibleObjects, HOME, target);
  const away = t > DRAG_US[0] && t < DRAG_HOME[1];
  const usOn = fade(t, S.usWidth - 0.4, DRAG_EU[0] + 0.8);
  const lift = fade(t, S.lift, DRAG_US[1] + 0.3, 0.4);
  const onUS = t >= DRAG_US[1] && t < DRAG_EU[0];
  const onEU = t >= DRAG_EU[1] && t < DRAG_HOME[0];
  return (
    <>
      <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} />
      {away && <Geo d={indonesia as GeoPermissibleObjects} fill="none" stroke={C.koral} strokeWidth={3.5} strokeDasharray="10 9" opacity={0.7} />}
      <g opacity={usOn}>
        <Geo d={usa48 as GeoPermissibleObjects} fill={C.toska} fillOpacity={0.14} stroke={C.toska} strokeWidth={5} />
      </g>
      <g style={{ filter: `drop-shadow(0 ${18 * lift}px ${14 * lift}px rgba(0,0,0,0.6))` }}>
        <Geo d={moved} fill={C.koral} fillOpacity={0.88} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
      </g>

      {/* Sabang–Merauke at home (opening and closing) */}
      <g opacity={fade(t, S.sabang, S.extremes + 0.4) + fade(t, S.close, EP001V3_SECONDS + 1)}>
        <Route from={PT.sabang} to={PT.merauke} progress={t < S.close ? ramp(t, S.sabang + 0.5, at("sabang", "lurusnya")) : ramp(t, S.close + 0.2, S.close + 1.6)} color={C.kunyit} width={12} />
      </g>
      <Pin at={PT.sabang} from={S.sabang + 0.3} to={S.extremes + 0.4} r={19} />
      <Pin at={PT.merauke} from={at("sabang", "Merauke")} to={S.extremes + 0.4} r={19} />
      <Pin at={PT.sabang} from={S.close + 0.2} to={EP001V3_SECONDS + 1} r={19} />
      <Pin at={PT.merauke} from={S.close + 1.5} to={EP001V3_SECONDS + 1} r={19} />

      {/* true extremes */}
      <g opacity={fade(t, S.extremes, DRAG_US[0])}>
        <Route from={PT.idWest} to={PT.idEast} progress={ramp(t, at("extremes", "Benggala"), at("extremes", "Torasi") + 0.3)} color={C.kunyit} width={9} />
      </g>
      <Pin at={PT.idWest} from={at("extremes", "Benggala")} to={DRAG_US[0]} color={C.koral} r={16} />
      <Pin at={PT.idEast} from={at("extremes", "Torasi")} to={DRAG_US[0]} color={C.koral} r={16} />

      {/* US width */}
      <g opacity={usOn}>
        <Route from={PT.usWest} to={PT.usEast} progress={ramp(t, at("usWidth", "Cape"), at("usWidth", "Head") + 0.4)} color={C.toska} width={11} />
      </g>
      <Pin at={PT.usWest} from={at("usWidth", "Cape")} to={DRAG_EU[0]} color={C.toska} r={16} />
      <Pin at={PT.usEast} from={at("usWidth", "Head")} to={DRAG_EU[0]} color={C.toska} r={16} />

      {/* moved Indonesia width over the US */}
      {onUS && (
        <g opacity={fade(t, S.overhang, DRAG_EU[0] + 0.1)}>
          <Route from={mv(PT.idWest)} to={mv(PT.idEast)} progress={ramp(t, S.overhang, S.overhang + 1.1)} color={C.kunyit} width={11} />
        </g>
      )}
      {onUS && <Pin at={mv(PT.idWest)} from={at("overhang", "Pasifik") - 0.2} to={DRAG_EU[0]} r={18} />}
      {onUS && <Pin at={mv(PT.idEast)} from={at("overhang", "Atlantik") - 0.2} to={DRAG_EU[0]} r={18} />}

      {/* over Europe */}
      {onEU && (
        <g opacity={fade(t, DRAG_EU[1], DRAG_HOME[0] + 0.1)}>
          <Route from={mv(PT.sabang)} to={mv(PT.merauke)} progress={ramp(t, DRAG_EU[1], at("europe", "Kaspia"))} color={C.kunyit} width={11} />
        </g>
      )}
      {onEU && <Pin at={mv(PT.sabang)} from={at("europe", "Sabang")} to={DRAG_HOME[0]} r={18} />}
      {onEU && <Pin at={mv(PT.merauke)} from={at("europe", "Merauke")} to={DRAG_HOME[0]} r={18} />}
    </>
  );
};

// Map labels: HTML (outside the SVG) with the same projection, kept inside the frame and above the safe line.
const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;

const MapHtmlLabels: React.FC<{ t: number }> = ({ t }) => {
  const mv = moveFn(HOME, idTarget(t));
  return (
    <>
      <L at={PT.sabang} from={S.sabang + 0.3} to={S.extremes + 0.3} dy={-80}>Sabang</L>
      <L at={PT.merauke} from={at("sabang", "Merauke")} to={S.extremes + 0.3} dy={85}>Merauke</L>
      <L at={PT.idWest} from={at("extremes", "Benggala")} to={DRAG_US[0]} dy={-80} bg={C.koral} fg={C.putih}>P. Benggala</L>
      <L at={PT.idEast} from={at("extremes", "Torasi")} to={DRAG_US[0]} dy={85} bg={C.koral} fg={C.putih}>Muara Torasi</L>
      <L at={PT.usWest} from={at("usWidth", "Cape")} to={S.overhang} dy={-80} bg={C.toska}>Cape Alava</L>
      <L at={PT.usEast} from={at("usWidth", "Head")} to={S.overhang} dy={85} bg={C.toska}>West Quoddy Head</L>
      <L at={mv(PT.idWest)} from={at("overhang", "Pasifik") - 0.2} to={at("area", "Amerika") - 0.3} dy={-80}>Samudra Pasifik</L>
      <L at={mv(PT.idEast)} from={at("overhang", "Atlantik") - 0.2} to={at("area", "Amerika") - 0.3} dy={85}>Samudra Atlantik</L>
      <L at={mv([110, -5.3])} from={at("area", "laut") - 0.3} to={S.europe} dy={95} bg="rgba(61,219,217,0.95)">Laut Jawa</L>
      <L at={mv([127.5, -5.5])} from={at("area", "laut") - 0.05} to={S.europe} dy={-85} bg="rgba(61,219,217,0.95)">Laut Banda</L>
      <L at={mv(PT.sabang)} from={at("europe", "Sabang")} to={DRAG_HOME[0]} dy={-80}>Sabang → Atlantik</L>
      <L at={mv(PT.merauke)} from={at("europe", "Merauke")} to={DRAG_HOME[0]} dy={85}>Merauke → L. Kaspia</L>
      <L at={[101.5, -0.5]} from={TZ} to={S.close + 1.0} dy={0} size={62} bg={C.kunyit}>WIB</L>
      <L at={[120.5, -3.2]} from={TZ + 0.25} to={S.close + 1.0} dy={0} size={62} bg={C.kunyit}>WITA</L>
      <L at={[138.5, -4.2]} from={TZ + 0.5} to={S.close + 1.0} dy={0} size={62} bg={C.kunyit}>WIT</L>
    </>
  );
};

// Horizontal bars, true to scale (km). Label + number on one line, the bar below it at full width.
const Bars: React.FC<{ t: number }> = ({ t }) => {
  const rows = [
    { label: "Indonesia", km: NUM.idExtremes, color: C.kunyit, from: S.overhang + 0.1 },
    { label: "AS daratan", km: NUM.usWidth, color: C.toska, from: S.overhang + 0.3 },
    { label: "Terpanjang di AS", km: NUM.usDiagonal, color: C.toska, from: at("diagonal", "terpanjang"), dashed: true },
  ];
  const max = NUM.idExtremes, full = 960;
  const k = useLife(S.overhang, S.area + 0.1);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 110, width: full, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        const g = ramp(t, r.from, r.from + 0.8);
        if (t < r.from) return null;
        return (
          <div key={r.label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{fmt(r.km * g)} km</span>
            </div>
            <div style={{ marginTop: 8, width: (full * r.km * g) / max, height: 44, borderRadius: 12, background: r.dashed ? "rgba(27,16,40,0.5)" : r.color, border: r.dashed ? `6px dashed ${r.color}` : `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

// Area squares, side ∝ √area so the AREAS are to scale
const AreaSquares: React.FC<{ t: number }> = ({ t }) => {
  const from = at("area", "Amerika") - 0.2;
  const k = useLife(from, at("area", "laut") - 0.3);
  if (k <= 0.001) return null;
  const us = 740, id = us * Math.sqrt(NUM.idArea / NUM.usArea);
  const g = ramp(t, from + 0.3, from + 1.1);
  const top = 470;
  return (
    <div style={{ position: "absolute", left: W / 2 - us / 2, top, width: us, height: us, opacity: Math.min(1, k * 1.4), fontFamily: FONT, fontWeight: 800, fontSize: TXT, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.08 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,219,217,0.25)", border: `6px solid ${C.toska}`, borderRadius: 10 }} />
      <div style={{ position: "absolute", left: 24, top: 18, color: C.toska }}>AS daratan<br />{fmt(NUM.usArea / 1e6, 2)} jt km²</div>
      <div style={{ position: "absolute", right: 0, bottom: 0, width: id * g, height: id * g, background: C.koral, border: `5px solid ${C.putih}`, borderRadius: 8 }} />
      <div style={{ position: "absolute", right: 0, top: us + 18, color: C.putih, opacity: g, whiteSpace: "nowrap" }}>Indonesia · {fmt(NUM.idArea / 1e6, 2)} jt km²</div>
    </div>
  );
};

const Clocks: React.FC<{ n: number; color: string; s?: number }> = ({ n, color, s = 50 }) => (
  <span style={{ display: "inline-flex", gap: 8 }}>
    {Array.from({ length: n }, (_, i) => (
      <svg key={i} width={s} height={s} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={17} fill="none" stroke={color} strokeWidth={5} />
        <path d={`M20 20 L20 9 M20 20 L${20 + 8 * Math.cos(i)} ${20 + 8 * Math.sin(i)}`} stroke={color} strokeWidth={4} strokeLinecap="round" />
      </svg>
    ))}
  </span>
);

const Overlays: React.FC<{ t: number }> = ({ t }) => {
  const dim = 0.6 * fade(t, at("area", "Amerika") - 0.3, at("area", "laut") - 0.2);
  return (
    <>
      <AbsoluteFill style={{ background: C.angkasa, opacity: dim }} />
      {/* top and bottom gradients for legibility */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.78) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 64%, rgba(7,6,13,0.72) 100%)" }} />

      {/* HOOK */}
      <Headline x={W / 2} y={250} from={-0.25} to={S.sabang} size={100}>
        Indonesia lebih lebar dari <span style={{ color: C.kunyit }}>Amerika?</span>
      </Headline>
      <Pill x={300} y={480} from={0.1} to={S.sabang} size={TXT} icon={<Flag code="id" h={50} />}>Indonesia</Pill>
      <Pill x={800} y={480} from={0.3} to={S.sabang} size={TXT} bg={C.toska} icon={<Flag code="us" h={50} />}>Amerika</Pill>
      <Pill x={W / 2} y={STAMP_Y} from={at("hook", "ukur")} to={S.sabang} size={60} bg={C.kunyit}>Kita ukur sendiri</Pill>

      {/* SABANG–MERAUKE */}
      <Pill x={W / 2} y={170} from={S.sabang + 0.1} to={S.extremes} size={TXT}>Sabang → Merauke</Pill>
      <Counter x={W / 2} y={310} from={S.sabang + 0.2} to={S.extremes} a={0} b={NUM.sabangMerauke} t0={S.sabang + 0.5} t1={at("sabang", "lurusnya") + 0.6} unit="KM" size={160} />
      <Pill x={W / 2} y={STAMP_Y} from={at("sabang", "lurusnya")} to={S.extremes} size={TXT} bg={C.kunyit}>Garis lurus</Pill>

      {/* EXTREMES */}
      <Pill x={W / 2} y={170} from={S.extremes} to={S.lift} size={TXT} bg={C.koral} fg={C.putih}>Titik paling ujung</Pill>
      <Counter x={W / 2} y={310} from={S.extremes} to={S.lift} a={NUM.sabangMerauke} b={NUM.idExtremes} t0={at("extremes", "lima")} t1={E.extremes} unit="KM" size={160} />

      {/* LIFT */}
      <Pill x={W / 2} y={190} from={at("lift", "Ukurannya")} to={S.usWidth} size={60}>✓ Ukuran asli</Pill>
      <Pill x={W / 2} y={320} from={at("lift", "proyeksinya")} to={S.usWidth} size={60}>✓ Proyeksi sama</Pill>
      <Stamp x={W / 2} y={STAMP_Y} from={at("lift", "trik")} to={at("lift", "geser")} size={86}>Tanpa trik</Stamp>

      {/* US WIDTH */}
      <Pill x={W / 2} y={170} from={S.usWidth} to={S.overhang} size={TXT} bg={C.toska}>48 negara bagian AS</Pill>
      <Counter x={W / 2} y={310} from={S.usWidth + 0.1} to={S.overhang} a={0} b={NUM.usWidth} t0={at("usWidth", "Cape")} t1={E.usWidth} unit="KM" color={C.toska} size={160} />

      {/* OVERHANG + DIAGONAL */}
      <Bars t={t} />
      <Stamp x={W / 2} y={STAMP_Y} from={at("overhang", "seribu")} to={at("overhang", "Sabang", 0)} color={C.kunyit} size={86}>+{fmt(NUM.overhang)} km</Stamp>
      <Stamp x={W / 2} y={STAMP_Y} from={at("diagonal", "kalah")} to={S.area} size={86}>Tetap kalah</Stamp>

      {/* AREA TWIST */}
      <Headline x={W / 2} y={250} from={S.area} to={at("area", "Amerika") - 0.1} size={116} color={C.koral}>Tapi tunggu…</Headline>
      <Pill x={W / 2} y={380} from={at("area", "Lebar")} to={at("area", "laut") - 0.3} size={60}>Lebar ≠ luas</Pill>
      <AreaSquares t={t} />
      <Stamp x={W / 2 - 60} y={790} from={at("area", "empat")} to={at("area", "laut") - 0.3} size={74}>{fmt(NUM.areaRatio, 1)}× lebih luas</Stamp>
      <Pill x={W / 2} y={250} from={at("area", "laut") - 0.3} to={S.europe} size={60} bg={C.toska}>Kebanyakan laut</Pill>

      {/* EUROPE */}
      <Headline x={W / 2} y={190} from={S.europe} to={S.timezones} size={116} color={C.kunyit}>Eropa</Headline>
      <Headline x={W / 2} y={320} from={at("europe", "Merauke") - 0.1} to={S.timezones + 0.5} size={TXT}>Ikut tertutup, antara lain:</Headline>
      <FlagRow codes={EU_COVERED} x={W / 2} y={420} from={at("europe", "Merauke")} to={S.timezones + 0.5} step={0.07} h={64} />

      {/* TIME ZONES */}
      <Pill x={W / 2} y={190} from={at("timezones", "empat")} to={S.close + 1.0} size={TXT} bg={C.toska} icon={<Clocks n={4} color={C.tinta} />}>AS daratan: 4 zona</Pill>
      <Pill x={W / 2} y={320} from={TZ} to={S.close + 1.0} size={TXT} bg={C.kunyit} icon={<Clocks n={3} color={C.tinta} />}>Indonesia: 3 zona</Pill>

      {/* CLOSE */}
      <Headline x={W / 2} y={230} from={S.close + 1.0} to={S.question} size={90}>Dari Sabang sampai Merauke</Headline>
      <Pill x={W / 2} y={420} from={at("close", "Amerika")} to={S.question} size={60} bg={C.kunyit}>Amerika nggak muat</Pill>

      {/* QUESTION (~3 s) */}
      <Headline x={W / 2} y={260} from={S.question} to={EP001V3_SECONDS + 1} size={104}>
        Kamu tinggal di zona <span style={{ color: C.kunyit }}>mana?</span>
      </Headline>
      {["WIB", "WITA", "WIT"].map((z, i) => (
        <Pill key={z} x={W / 2 + (i - 1) * 310} y={1150} from={Q_PILLS + i * 0.15} to={EP001V3_SECONDS + 1} size={70} bg={C.kunyit}>{z}</Pill>
      ))}
      <Pill x={W / 2} y={1285} from={at("question", "Tulis")} to={EP001V3_SECONDS + 1} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
    </>
  );
};

// Sound effects placed on the visual beats
const sfx = (): { at: number; name: string; vol: number }[] => [
  { at: 0, name: "rise", vol: 0.25 },
  { at: S.sabang + 0.3, name: "pop", vol: 0.35 },
  { at: at("sabang", "Merauke"), name: "pop", vol: 0.35 },
  { at: at("extremes", "Benggala"), name: "pop", vol: 0.35 },
  { at: at("extremes", "Torasi"), name: "pop", vol: 0.35 },
  { at: at("lift", "trik"), name: "stamp", vol: 0.5 },
  { at: DRAG_US[0], name: "whoosh", vol: 0.45 },
  { at: at("overhang", "seribu"), name: "stamp", vol: 0.5 },
  { at: at("diagonal", "kalah"), name: "stamp", vol: 0.5 },
  { at: S.area - 0.9, name: "rise", vol: 0.3 },
  { at: at("area", "empat"), name: "stamp", vol: 0.5 },
  { at: DRAG_EU[0], name: "whoosh", vol: 0.45 },
  { at: DRAG_HOME[0], name: "whoosh", vol: 0.45 },
  { at: TZ, name: "pop", vol: 0.35 },
  { at: Q_PILLS, name: "pop", vol: 0.35 },
  { at: Q_PILLS + 0.15, name: "pop", vol: 0.35 },
  { at: Q_PILLS + 0.3, name: "pop", vol: 0.35 },
];

export const Ep001V3: React.FC = () => {
  const t = useT();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <MapView cam={camera(t)}>
        <MapLayers t={t} />
      </MapView>
      <MapViewLabels t={t} />
      <Overlays t={t} />
      <Captions captions={captions} top={CAPTION_TOP} />

      <Soundtrack voice="voice/ep001v3.wav" voiceLufs={-16.6} words={captions} track={EP001V3_TRACK} seconds={EP001V3_SECONDS} />
      {sfx().map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={2 * fps} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// HTML labels need the projection too: same camera, same projection, no drawing.
const MapViewLabels: React.FC<{ t: number }> = ({ t }) => (
  <ProjectionOnly cam={camera(t)}>
    <MapHtmlLabels t={t} />
  </ProjectionOnly>
);
