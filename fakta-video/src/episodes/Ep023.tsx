// Episode 23 (geography): "Taruh Sabang di London: Merauke sampai di Arab Saudi". Built on the locked template (from Ep011 map +
// Ep019 captions v2 / SfxLayer2 / v2 mix). Indonesia is moved to Europe by ROTATING it on the sphere (moveFn), true size, one projection.
import type { Caption } from "@remotion/captions";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, FlagRow, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import facts from "../../data/ep023-facts.json";
import { along, moveFn, moveGeo, type LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, W } from "../theme";
import captionsJson from "./ep023-captions.json";
import timing from "./ep023-timing.json";
import { KEYS, NUM, PT, type SegmentId } from "./ep023-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP023_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP023_TRACK = pickTrack(23, EP023_SECONDS);

const SAFE_BOTTOM = 1536;
const STAMP_Y = 1290;
const TXT = 54;
const W_MAP = 6300;
const QEND = EP023_SECONDS + 1;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

// --- geometry --------------------------------------------------------------------------------------------------
const SAB = PT.sabang, MER = PT.merauke, LON = PT.london, MOS = PT.moscow;
const LAND = facts.merauke.lonlat as LonLat; // where Merauke lands when Sabang sits on London
const HOME_MID = geoInterpolate(SAB, MER)(0.5) as LonLat;
const EU_MID = geoInterpolate(LON, LAND)(0.5) as LonLat;
const DRAG: [number, number] = [at("move", "geser") - 0.1, at("move", "mendarat") + 0.5];

// where Sabang is right now (Indonesia travels from its home to London)
const sabangAt = (t: number): LonLat => (t <= DRAG[0] ? SAB : t >= DRAG[1] ? LON : along(SAB, LON, ramp(t, ...DRAG)));
const mvFor = (t: number) => moveFn(SAB, sabangAt(t));
const cache = new Map<string, GeoPermissibleObjects>();
const idnAt = (pos: LonLat) => {
  const key = pos.map((v) => v.toFixed(3)).join(",");
  if (!cache.has(key)) cache.set(key, moveGeo(indonesia as GeoPermissibleObjects, SAB, pos));
  return cache.get(key)!;
};

const camera = (t: number): Camera => {
  const k = ramp(t, ...DRAG);
  const f = mvFor(t);
  const [lon, lat] = k <= 0 ? HOME_MID : k >= 1 ? EU_MID : (f(HOME_MID) as LonLat);
  const hop = 7000 * Math.sin(Math.PI * k);
  return { lon, lat, widthKm: W_MAP + hop };
};

const MapLayers: React.FC<{ t: number }> = ({ t }) => {
  const pos = sabangAt(t);
  const f = mvFor(t);
  const away = t > DRAG[0];
  const sab = f(SAB), mer = f(MER);
  const routeP = ramp(t, S.measure + 0.2, at("measure", "lurusnya") + 0.6);
  const moscowP = ramp(t, S.moscow + 0.3, at("moscow", "Moskow") + 0.2);
  return (
    <>
      <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1.8} />
      {away && <Geo d={indonesia as GeoPermissibleObjects} fill="none" stroke={C.krim} strokeWidth={3} strokeDasharray="10 9" opacity={0.5 * (1 - ramp(t, DRAG[1], DRAG[1] + 0.4))} />}
      <g style={{ filter: away ? "drop-shadow(0 16px 12px rgba(0,0,0,0.6))" : undefined }}>
        <Geo d={idnAt(pos)} fill={C.koral} fillOpacity={0.8} stroke={C.putih} strokeWidth={2.6} strokeLinejoin="round" />
      </g>
      <Route from={sab} to={mer} progress={routeP} color={C.kunyit} width={12} />
      <Route from={LON} to={MOS} progress={moscowP} color={C.toska} width={11} />
      <Pin at={sab} from={0.3} to={QEND} color={C.kunyit} r={16} />
      <Pin at={mer} from={0.6} to={QEND} color={C.kunyit} r={16} />
      <Pin at={MOS} from={S.moscow + 0.3} to={S.tebak} color={C.toska} r={16} />
    </>
  );
};

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC<{ t: number }> = ({ t }) => {
  const f = mvFor(t);
  const sab = f(SAB), mer = f(MER);
  const mid = geoInterpolate(LON, MOS)(0.5) as LonLat;
  return (
    <>
      <L at={sab} from={0.4} to={at("move", "geser")} dy={-85}>Sabang</L>
      <L at={mer} from={0.7} to={at("move", "geser")} dy={85}>Merauke</L>
      <L at={sab} from={at("move", "London")} to={QEND} dy={-85} bg={C.toska}>London</L>
      <L at={mer} from={at("move", "London") + 0.5} to={S.tebak} dy={85}>Merauke</L>
      {/* countries on the line, spread so they never overlap */}
      <L at={[2.5, 48.8]} from={at("cross", "Prancis")} to={at("cross", "Jerman")} dy={110} dx={-60} bg={C.krim}>Prancis</L>
      <L at={[10.0, 50.0]} from={at("cross", "Jerman")} to={at("cross", "Austria")} dy={-110} dx={170} bg={C.krim}>Jerman</L>
      <L at={[14.0, 47.6]} from={at("cross", "Austria")} to={at("cross", "Turki")} dy={110} dx={90} bg={C.krim}>Austria</L>
      <L at={[33.0, 41.0]} from={at("cross", "Turki")} to={S.moscow} dy={-100} bg={C.krim}>Turki</L>
      {/* Moscow */}
      <L at={mid} from={at("moscow", "jarak")} to={S.tebak} dy={95} bg={C.toska}>2.501 km</L>
      <L at={MOS} from={at("moscow", "Moskow")} to={S.tebak} dy={-95} bg={C.toska}>Moskow</L>
      {/* tebak + reveal at the landing point */}
      <L at={mer} from={S.tebak} to={S.reveal} dy={-85} bg={C.kunyit}>?</L>
      <L at={mer} from={S.reveal} to={QEND} dy={-100} bg={C.koral} fg={C.putih}>Arab Saudi</L>
    </>
  );
};

const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontWeight: 800, fontSize: 190, color: C.kunyit, textShadow: "0 6px 0 #1B1028", transform: `scale(${k})` }}>???</div>;
};

const Overlays: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.8) 0%, rgba(7,6,13,0.2) 30%, rgba(7,6,13,0.2) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK: on screen in the first second */}
    <Headline x={W / 2} y={190} from={-0.25} to={S.measure} size={88} color={C.kunyit}>Sabang di London?</Headline>
    <Headline x={W / 2} y={310} from={-0.1} to={S.measure} size={88}>Merauke ke mana?</Headline>

    {/* MEASURE */}
    <Pill x={W / 2} y={170} from={S.measure} to={S.move} size={TXT} bg={C.kunyit}>Sabang → Merauke</Pill>
    <Counter x={W / 2} y={340} from={S.measure} to={S.move} a={0} b={NUM.km} t0={at("measure", "lima")} t1={at("measure", "kilometer") + 0.2} unit="KM" size={150} color={C.kunyit} />

    {/* MOVE: true size, rotated on the sphere */}
    <Headline x={W / 2} y={200} from={S.move} to={S.cross} size={112}>Geser ke <span style={{ color: C.toska }}>Eropa</span></Headline>
    <Stamp x={W / 2} y={STAMP_Y} from={at("move", "asli")} to={S.cross} color={C.kunyit} size={76}>Ukuran asli</Stamp>

    {/* CROSS */}
    <Headline x={W / 2} y={200} from={S.cross} to={S.moscow} size={100}>Lewat 4 negara…</Headline>
    <Pill x={W / 2} y={340} from={at("cross", "Belum")} to={S.moscow} size={TXT} bg={C.koral} fg={C.putih}>Belum sampai juga!</Pill>

    {/* MOSCOW */}
    <Headline x={W / 2} y={200} from={S.moscow} to={S.tebak} size={104} color={C.koral}>Tapi tunggu…</Headline>
    <Stamp x={W / 2} y={350} from={at("moscow", "dua")} to={S.tebak} color={C.toska} size={76}>2× London–Moskow</Stamp>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={150} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "negara")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Merauke di negara apa?</Pill>

    {/* REVEAL */}
    <Headline x={W / 2} y={200} from={S.reveal} to={S.payoff} size={130} color={C.kunyit}>ARAB SAUDI!</Headline>
    <FlagRow codes={["gb", "sa"]} x={W / 2} y={360} from={S.reveal + 0.2} to={S.payoff} step={0.25} h={70} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("reveal", "Saudi")} to={S.payoff} color={C.koral} size={80}>Merauke!</Stamp>

    {/* PAYOFF */}
    <Headline x={W / 2} y={190} from={S.payoff} to={S.question} size={96} color={C.kunyit}>1 negara</Headline>
    <Headline x={W / 2} y={340} from={at("payoff", "selebar")} to={S.question} size={70}>London → Arab Saudi</Headline>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={200} from={S.question + 0.1} to={QEND} size={96}>
      Dekat ke <span style={{ color: C.kunyit }}>mana?</span>
    </Headline>
    <Pill x={290} y={330} from={S.question + 0.25} to={QEND} size={TXT} bg={C.kunyit}>Sabang</Pill>
    <Pill x={790} y={330} from={S.question + 0.33} to={QEND} size={TXT} bg={C.kunyit}>Merauke</Pill>
    <Pill x={W / 2} y={STAMP_Y} from={at("question", "Tulis")} to={QEND} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "moscow").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("move", "London"), name: "impact" as const, vol: 0.7 },
  { at: at("reveal", "Saudi"), name: "impact" as const },
  { at: at("moscow", "dua"), name: "pop" as const },
];

export const Ep023: React.FC = () => {
  const t = useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [0.3, 0.6, at("cross", "Prancis"), at("cross", "Jerman"), at("cross", "Austria"), at("cross", "Turki"), S.moscow + 0.3, S.tebak, S.question + 0.25];
  const counts: [number, number][] = [[at("measure", "lima"), at("measure", "kilometer") + 0.2]];
  const zooms = [DRAG[0]];
  const lands = [DRAG[1], at("reveal", "Saudi")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <MapView cam={camera(t)}>
          <MapLayers t={t} />
        </MapView>
        <ProjectionOnly cam={camera(t)}>
          <MapHtmlLabels t={t} />
        </ProjectionOnly>
        <Overlays />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep023.wav" voiceLufs={-16.1} words={captions} track={EP023_TRACK} seconds={EP023_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP023_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms, icons, counts, lands }} />
    </AbsoluteFill>
  );
};
