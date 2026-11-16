// Episode 1 video. One continuous map shot (no hard cuts); every beat is timed to a spoken word.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { Captions, Counter, Flag, FlagRow, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import usa48 from "../data/usa48.json";
import { along, moveFn, moveGeo, type LonLat } from "../lib/geo";
import { C, FONT, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep001-captions.json";
import timing from "./ep001-timing.json";
import { EU_COVERED, NUM, PLACE, PT, type SegmentId } from "./ep001-script";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
export const EP001_SECONDS = timing[timing.length - 1].end + 1.6;

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
  let widthKm = 7000;
  if (t < DRAG_US[0]) widthKm = interpolate(t, [0, DRAG_US[0]], [6200, 7000]);
  else if (t < DRAG_US[1]) widthKm = 7000 + 900 * ramp(t, ...DRAG_US) + hop(DRAG_US, 9000);
  else if (t < DRAG_EU[0]) widthKm = interpolate(t, [DRAG_US[1], DRAG_EU[0]], [7900, 8400]);
  else if (t < DRAG_EU[1]) widthKm = 8400 + hop(DRAG_EU, 6000);
  else if (t < DRAG_HOME[0]) widthKm = interpolate(t, [DRAG_EU[1], DRAG_HOME[0]], [8400, 8800]);
  else if (t < DRAG_HOME[1]) widthKm = interpolate(ramp(t, ...DRAG_HOME), [0, 1], [8800, 7000]) + hop(DRAG_HOME, 6000);
  else widthKm = interpolate(t, [DRAG_HOME[1], EP001_SECONDS], [7000, 7600]);
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
      <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.4} />
      {away && <Geo d={indonesia as GeoPermissibleObjects} fill="none" stroke={C.koral} strokeWidth={3} strokeDasharray="8 8" opacity={0.7} />}
      <g opacity={usOn}>
        <Geo d={usa48 as GeoPermissibleObjects} fill={C.toska} fillOpacity={0.14} stroke={C.toska} strokeWidth={4} />
      </g>
      <g style={{ filter: `drop-shadow(0 ${18 * lift}px ${14 * lift}px rgba(0,0,0,0.6))` }}>
        <Geo d={moved} fill={C.koral} fillOpacity={0.88} stroke={C.putih} strokeWidth={2.2} strokeLinejoin="round" />
      </g>

      {/* Sabang–Merauke at home (opening and closing) */}
      <g opacity={fade(t, S.sabang, S.extremes + 0.4) + fade(t, S.close, EP001_SECONDS + 1)}>
        <Route from={PT.sabang} to={PT.merauke} progress={t < S.close ? ramp(t, S.sabang + 0.5, at("sabang", "lurusnya")) : ramp(t, S.close + 0.2, S.close + 1.6)} color={C.kunyit} />
      </g>
      <Pin at={PT.sabang} from={S.sabang + 0.3} to={S.extremes + 0.4} />
      <Pin at={PT.merauke} from={at("sabang", "Merauke")} to={S.extremes + 0.4} />
      <Pin at={PT.sabang} from={S.close + 0.2} to={EP001_SECONDS + 1} />
      <Pin at={PT.merauke} from={S.close + 1.5} to={EP001_SECONDS + 1} />

      {/* true extremes */}
      <g opacity={fade(t, S.extremes, DRAG_US[0])}>
        <Route from={PT.idWest} to={PT.idEast} progress={ramp(t, at("extremes", "Benggala"), at("extremes", "Torasi") + 0.3)} color={C.kunyit} width={7} />
      </g>
      <Pin at={PT.idWest} from={at("extremes", "Benggala")} to={DRAG_US[0]} color={C.koral} r={13} />
      <Pin at={PT.idEast} from={at("extremes", "Torasi")} to={DRAG_US[0]} color={C.koral} r={13} />

      {/* US width */}
      <g opacity={usOn}>
        <Route from={PT.usWest} to={PT.usEast} progress={ramp(t, at("usWidth", "Cape"), at("usWidth", "Head") + 0.4)} color={C.toska} width={9} />
      </g>
      <Pin at={PT.usWest} from={at("usWidth", "Cape")} to={DRAG_EU[0]} color={C.toska} r={13} />
      <Pin at={PT.usEast} from={at("usWidth", "Head")} to={DRAG_EU[0]} color={C.toska} r={13} />

      {/* moved Indonesia width over the US */}
      {onUS && (
        <g opacity={fade(t, S.overhang, DRAG_EU[0] + 0.1)}>
          <Route from={mv(PT.idWest)} to={mv(PT.idEast)} progress={ramp(t, S.overhang, S.overhang + 1.1)} color={C.kunyit} width={9} />
        </g>
      )}
      {onUS && <Pin at={mv(PT.idWest)} from={at("overhang", "Pasifik") - 0.2} to={DRAG_EU[0]} />}
      {onUS && <Pin at={mv(PT.idEast)} from={at("overhang", "Atlantik") - 0.2} to={DRAG_EU[0]} />}

      {/* over Europe */}
      {onEU && (
        <g opacity={fade(t, DRAG_EU[1], DRAG_HOME[0] + 0.1)}>
          <Route from={mv(PT.sabang)} to={mv(PT.merauke)} progress={ramp(t, DRAG_EU[1], at("europe", "Kaspia"))} color={C.kunyit} width={9} />
        </g>
      )}
      {onEU && <Pin at={mv(PT.sabang)} from={at("europe", "Sabang")} to={DRAG_HOME[0]} />}
      {onEU && <Pin at={mv(PT.merauke)} from={at("europe", "Merauke")} to={DRAG_HOME[0]} />}
    </>
  );
};

// Labels that follow moved points must be HTML (outside the SVG) but use the same projection.
const MapHtmlLabels: React.FC<{ t: number }> = ({ t }) => {
  const mv = moveFn(HOME, idTarget(t));
  const sea: { name: string; at: LonLat }[] = [
    { name: "Laut Jawa", at: [110, -5.3] },
    { name: "Selat Makassar", at: [118.3, -1.5] },
    { name: "Laut Banda", at: [127.5, -5.5] },
  ];
  return (
    <>
      <MapLabel at={PT.sabang} from={S.sabang + 0.3} to={S.extremes + 0.3} size={34} dy={-62}>Sabang</MapLabel>
      <MapLabel at={PT.merauke} from={at("sabang", "Merauke")} to={S.extremes + 0.3} size={34} dy={62}>Merauke</MapLabel>
      <MapLabel at={PT.idWest} from={at("extremes", "Benggala")} to={DRAG_US[0]} size={30} dy={70} dx={60} bg={C.koral} fg={C.putih}>P. Benggala</MapLabel>
      <MapLabel at={PT.idEast} from={at("extremes", "Torasi")} to={DRAG_US[0]} size={30} dy={-64} dx={-40} bg={C.koral} fg={C.putih}>Muara Torasi</MapLabel>
      <MapLabel at={PT.usWest} from={at("usWidth", "Cape")} to={S.overhang} size={30} dy={-64} dx={40} bg={C.toska}>Cape Alava</MapLabel>
      <MapLabel at={PT.usEast} from={at("usWidth", "Head")} to={S.overhang} size={30} dy={-64} dx={-40} bg={C.toska}>West Quoddy Head</MapLabel>
      <MapLabel at={mv(PT.idWest)} from={at("overhang", "Pasifik") - 0.2} to={DRAG_EU[0]} size={34} dy={-66} dx={40}>Samudra Pasifik</MapLabel>
      <MapLabel at={mv(PT.idEast)} from={at("overhang", "Atlantik") - 0.2} to={DRAG_EU[0]} size={34} dy={66} dx={-30}>Samudra Atlantik</MapLabel>
      {sea.map((s, i) => (
        <MapLabel key={s.name} at={mv(s.at)} from={at("area", "laut") - 0.3 + i * 0.25} to={S.europe} size={30} dy={0} bg="rgba(61,219,217,0.92)">{s.name}</MapLabel>
      ))}
      <MapLabel at={mv(PT.sabang)} from={at("europe", "Sabang")} to={DRAG_HOME[0]} size={32} dy={-66} dx={70}>Sabang → Atlantik</MapLabel>
      <MapLabel at={mv(PT.merauke)} from={at("europe", "Merauke")} to={DRAG_HOME[0]} size={32} dy={70} dx={-70}>Merauke → Laut Kaspia</MapLabel>
      <MapLabel at={[101.5, -0.5]} from={TZ} to={S.close + 1.0} size={44} dy={0} bg={C.kunyit}>WIB</MapLabel>
      <MapLabel at={[120.5, -3.2]} from={TZ + 0.25} to={S.close + 1.0} size={44} dy={0} bg={C.kunyit}>WITA</MapLabel>
      <MapLabel at={[138.5, -4.2]} from={TZ + 0.5} to={S.close + 1.0} size={44} dy={0} bg={C.kunyit}>WIT</MapLabel>
    </>
  );
};

// Horizontal bars, true to scale (km)
const Bars: React.FC<{ t: number }> = ({ t }) => {
  const rows = [
    { label: "Indonesia", flag: "id", km: NUM.idExtremes, color: C.kunyit, from: S.overhang + 0.1 },
    { label: "Amerika", flag: "us", km: NUM.usWidth, color: C.toska, from: S.overhang + 0.3 },
    { label: "AS diagonal", flag: "us", km: NUM.usDiagonal, color: C.toska, from: at("diagonal", "terpanjang"), dashed: true },
  ];
  const max = 5600, full = 470;
  const k = useLife(S.overhang, S.area + 0.1);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 150, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        const g = ramp(t, r.from, r.from + 0.8);
        if (t < r.from) return null;
        return (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 16, height: 96 }}>
            <div style={{ width: 230, color: C.putih, fontSize: 36, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase" }}>{r.label}</div>
            <div style={{ width: (full * r.km * g) / max, height: 54, borderRadius: 12, background: r.dashed ? "transparent" : r.color, border: r.dashed ? `6px dashed ${r.color}` : `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
            <div style={{ color: r.color, fontSize: 46, fontWeight: 800, textShadow: SHADOW, whiteSpace: "nowrap" }}>{fmt(r.km * g)} km</div>
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
  const unit = 560 / Math.sqrt(NUM.usArea);
  const us = unit * Math.sqrt(NUM.usArea), id = unit * Math.sqrt(NUM.idArea);
  const g = ramp(t, from + 0.3, from + 1.1);
  return (
    <div style={{ position: "absolute", left: W / 2 - us / 2, top: 560, width: us, height: us, opacity: Math.min(1, k * 1.4), fontFamily: FONT }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,219,217,0.25)", border: `6px solid ${C.toska}`, borderRadius: 10 }} />
      <div style={{ position: "absolute", left: 18, top: 14, color: C.toska, fontSize: 38, fontWeight: 800, textShadow: SHADOW }}>AS daratan · {fmt(NUM.usArea / 1e6, 2)} jt km²</div>
      <div style={{ position: "absolute", right: 0, bottom: 0, width: id * g, height: id * g, background: C.koral, border: `5px solid ${C.putih}`, borderRadius: 8 }} />
      <div style={{ position: "absolute", right: id + 16, bottom: 10, color: C.putih, fontSize: 34, fontWeight: 800, textShadow: SHADOW, opacity: g, whiteSpace: "nowrap" }}>Indonesia · {fmt(NUM.idArea / 1e6, 2)} jt km²</div>
    </div>
  );
};

const Clocks: React.FC<{ n: number; color: string }> = ({ n, color }) => (
  <span style={{ display: "inline-flex", gap: 8 }}>
    {Array.from({ length: n }, (_, i) => (
      <svg key={i} width={40} height={40} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={17} fill="none" stroke={color} strokeWidth={5} />
        <path d={`M20 20 L20 9 M20 20 L${20 + 8 * Math.cos(i)} ${20 + 8 * Math.sin(i)}`} stroke={color} strokeWidth={4} strokeLinecap="round" />
      </svg>
    ))}
  </span>
);

const Overlays: React.FC<{ t: number }> = ({ t }) => {
  const dim = 0.55 * fade(t, at("area", "Amerika") - 0.3, at("area", "laut") - 0.2);
  return (
    <>
      <AbsoluteFill style={{ background: C.angkasa, opacity: dim }} />
      {/* top gradient for legibility */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.75) 0%, rgba(7,6,13,0) 30%, rgba(7,6,13,0) 68%, rgba(7,6,13,0.7) 100%)" }} />

      {/* HOOK */}
      <Headline x={W / 2} y={250} from={-0.25} to={S.sabang} size={98}>
        Indonesia lebih lebar dari <span style={{ color: C.kunyit }}>Amerika?</span>
      </Headline>
      <Pill x={W / 2 - 240} y={450} from={0.1} to={S.sabang} size={34} icon={<Flag code="id" h={44} />}>Indonesia</Pill>
      <Headline x={W / 2} y={450} from={0.2} to={S.sabang} size={52} width={120}>vs</Headline>
      <Pill x={W / 2 + 240} y={450} from={0.3} to={S.sabang} size={34} bg={C.toska} icon={<Flag code="us" h={44} />}>Amerika</Pill>
      <Pill x={W / 2} y={1260} from={at("hook", "ukur")} to={S.sabang} size={46} bg={C.kunyit}>Kita ukur sendiri</Pill>

      {/* SABANG–MERAUKE */}
      <Pill x={W / 2} y={170} from={S.sabang + 0.1} to={S.extremes} size={38}>Sabang → Merauke · garis lurus</Pill>
      <Counter x={W / 2} y={300} from={S.sabang + 0.2} to={S.extremes} a={0} b={NUM.sabangMerauke} t0={S.sabang + 0.5} t1={at("sabang", "lurusnya") + 0.6} unit="KM" />

      {/* EXTREMES */}
      <Pill x={W / 2} y={170} from={S.extremes} to={S.lift} size={38} bg={C.koral} fg={C.putih}>Titik paling ujung</Pill>
      <Counter x={W / 2} y={300} from={S.extremes} to={S.lift} a={NUM.sabangMerauke} b={NUM.idExtremes} t0={at("extremes", "lima")} t1={E.extremes} unit="KM" />

      {/* LIFT */}
      <Pill x={W / 2} y={190} from={at("lift", "Ukurannya")} to={S.usWidth} size={44}>✓ Ukuran asli</Pill>
      <Pill x={W / 2} y={300} from={at("lift", "proyeksinya")} to={S.usWidth} size={44}>✓ Proyeksi sama</Pill>
      <Stamp x={W / 2} y={1250} from={at("lift", "trik")} to={at("lift", "geser")}>Tanpa trik</Stamp>

      {/* US WIDTH */}
      <Pill x={W / 2} y={170} from={S.usWidth} to={S.overhang} size={34} bg={C.toska}>Amerika daratan · 48 negara bagian</Pill>
      <Counter x={W / 2} y={300} from={S.usWidth + 0.1} to={S.overhang} a={0} b={NUM.usWidth} t0={at("usWidth", "Cape")} t1={E.usWidth} unit="KM" color={C.toska} />

      {/* OVERHANG + DIAGONAL */}
      <Bars t={t} />
      <Stamp x={W / 2} y={1250} from={at("overhang", "seribu")} to={at("overhang", "Sabang", 0)} color={C.kunyit}>+{fmt(NUM.overhang)} km</Stamp>
      <Stamp x={W / 2} y={1250} from={at("diagonal", "kalah")} to={S.area}>Tetap kalah</Stamp>

      {/* AREA TWIST */}
      <Headline x={W / 2} y={250} from={S.area} to={at("area", "Amerika") - 0.1} size={110} color={C.koral}>Tapi tunggu…</Headline>
      <Pill x={W / 2} y={420} from={at("area", "Lebar")} to={at("area", "laut") - 0.3} size={46}>Lebar ≠ luas</Pill>
      <AreaSquares t={t} />
      <Stamp x={W / 2} y={1250} from={at("area", "empat")} to={at("area", "laut") - 0.3}>{fmt(NUM.areaRatio, 1)}× lebih luas</Stamp>
      <Pill x={W / 2} y={250} from={at("area", "laut") - 0.3} to={S.europe} size={46} bg={C.toska}>Bentangan kita: kebanyakan laut</Pill>

      {/* EUROPE */}
      <Headline x={W / 2} y={230} from={S.europe} to={S.timezones} size={110} color={C.kunyit}>Eropa</Headline>
      <Pill x={W / 2} y={1140} from={at("europe", "Masuk")} to={S.timezones} size={32}>Ikut tertutup, antara lain:</Pill>
      <FlagRow codes={EU_COVERED} x={W / 2} y={1230} from={at("europe", "Masuk") + 0.1} to={S.timezones} step={0.12} h={58} />

      {/* TIME ZONES */}
      <Pill x={W / 2} y={190} from={at("timezones", "empat")} to={S.close + 1.0} size={38} bg={C.toska} icon={<Clocks n={4} color={C.tinta} />}>AS daratan: 4 zona</Pill>
      <Pill x={W / 2} y={310} from={TZ} to={S.close + 1.0} size={38} bg={C.kunyit} icon={<Clocks n={3} color={C.tinta} />}>Indonesia: 3 zona</Pill>

      {/* CLOSE */}
      <Headline x={W / 2} y={230} from={S.close + 1.0} to={S.question} size={84}>Dari Sabang sampai Merauke</Headline>
      <Pill x={W / 2} y={400} from={at("close", "Amerika")} to={S.question} size={50} bg={C.kunyit}>{fmt(NUM.sabangMerauke)} km · Amerika nggak muat</Pill>

      {/* QUESTION */}
      <Headline x={W / 2} y={260} from={S.question} to={EP001_SECONDS + 1} size={100}>
        Kamu tinggal di zona <span style={{ color: C.kunyit }}>mana?</span>
      </Headline>
      {["WIB", "WITA", "WIT"].map((z, i) => (
        <Pill key={z} x={W / 2 + (i - 1) * 300} y={1250} from={at("question", z) - 0.1} to={EP001_SECONDS + 1} size={64} bg={C.kunyit}>{z}</Pill>
      ))}
      <Pill x={W / 2} y={1370} from={at("question", "Tulis")} to={EP001_SECONDS + 1} size={40} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
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
  { at: at("question", "WIB") - 0.1, name: "pop", vol: 0.35 },
  { at: at("question", "WITA") - 0.1, name: "pop", vol: 0.35 },
  { at: at("question", "WIT") - 0.1, name: "pop", vol: 0.35 },
];

export const Ep001: React.FC = () => {
  const t = useT();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <MapView cam={camera(t)}>
        <MapLayers t={t} />
      </MapView>
      <MapViewLabels t={t} />
      <Overlays t={t} />
      <Captions captions={captions} />

      <Audio src={staticFile("voice/ep001.wav")} />
      <Audio
        src={staticFile("music/peta-pulse.wav")}
        volume={(f) => interpolate(f / fps, [0, 0.3, E.question, EP001_SECONDS], [0.18, 0.13, 0.13, 0.3], { extrapolateRight: "clamp" })}
      />
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
