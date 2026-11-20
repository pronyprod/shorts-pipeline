// Episode 17 (records): "Bunga terbesar di dunia" (Rafflesia). Built on the locked template (from Ep016),
// captions v2 + SfxLayer2 + v2 mix. One map shot on Sumatra (Bengkulu), flower drawn to scale at the reveal.
import type { Caption } from "@remotion/captions";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { Geo, MapView, ProjectionOnly, type Camera } from "../components/MapView";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, SHADOW, W } from "../theme";
import captionsJson from "./ep017-captions.json";
import timing from "./ep017-timing.json";
import { KEYS, PT, type SegmentId } from "./ep017-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP017_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP017_TRACK = pickTrack(17, EP017_SECONDS);

const SAFE_BOTTOM = 1536;
const STAMP_Y = 1170;
const TXT = 54;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
// nth spoken occurrence of a word in a segment; falls back to the segment start if Whisper missed the word
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

const ANS = ["Sudah", "Belum", "Mau lihat"];
const ANS_POS: [number, number][] = [[250, 1000], [830, 1000], [540, 1110]];

// --- camera -----------------------------------------------------------------------------------------------------
const SUM: LonLat = [101.2, -1.0];
const BKL: LonLat = [102.0, -3.2];
type Key = { t: number; c: LonLat; w: number };
const CAM: Key[] = [
  { t: 0, c: SUM, w: 2500 },
  { t: S.find, c: SUM, w: 2400 },
  { t: S.find + 2.2, c: BKL, w: 1500 },
  { t: S.status, c: BKL, w: 1500 },
  { t: 999, c: BKL, w: 1500 },
];
const ZOOMS = [S.find];
const camera = (t: number): Camera => {
  const i = Math.max(0, CAM.findIndex((k) => k.t > t) - 1);
  const a = CAM[i], b = CAM[Math.min(i + 1, CAM.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

const QEND = EP017_SECONDS + 1;
const MapLayers: React.FC = () => (
  <>
    <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.8} />
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.5} stroke={C.putih} strokeWidth={2.2} strokeLinejoin="round" />
    <Pin at={PT.bengkulu} from={at("find", "Arnold")} to={S.status} color={C.kunyit} r={18} />
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <L at={PT.bengkulu} from={at("find", "Arnold")} to={S.twist} dy={85} bg={C.kunyit}>Bengkulu</L>
);

const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 180, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>???</div>;
};

// flower: five petals, diameter 700 px = about 1 m, with a measuring line. Drawn from the reveal on.
const Flower: React.FC = () => {
  const k = useLife(S.reveal, S.status);
  if (k <= 0.001) return null;
  const R = 350;
  return (
    <div style={{ position: "absolute", left: W / 2 - R, top: 640, width: 2 * R, height: 2 * R, transform: `scale(${k})` }}>
      <svg width={2 * R} height={2 * R} viewBox="-350 -350 700 700">
        {[0, 72, 144, 216, 288].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <ellipse cx={0} cy={-185} rx={120} ry={165} fill={C.koral} stroke={C.tinta} strokeWidth={8} />
            {[[-45, -230], [40, -190], [-10, -140], [50, -270], [-60, -150]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={14} fill={C.krim} />)}
          </g>
        ))}
        <circle r={85} fill={C.tinta} stroke={C.kunyit} strokeWidth={8} />
        <line x1={-350} y1={345} x2={350} y2={345} stroke={C.kunyit} strokeWidth={10} />
        <line x1={-350} y1={325} x2={-350} y2={365} stroke={C.kunyit} strokeWidth={10} />
        <line x1={350} y1={325} x2={350} y2={365} stroke={C.kunyit} strokeWidth={10} />
      </svg>
    </div>
  );
};

const Overlays: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.8) 0%, rgba(7,6,13,0.2) 30%, rgba(7,6,13,0.2) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK: on screen in the first second */}
    <Headline x={W / 2} y={200} from={0} to={S.find} size={96} color={C.kunyit}>Bunga terbesar</Headline>
    <Pill x={W / 2} y={360} from={0.3} to={S.find} size={TXT}>Tumbuh di Sumatra</Pill>

    {/* FIND */}
    <Headline x={W / 2} y={200} from={S.find} to={S.twist} size={150} color={C.kunyit}>1818</Headline>
    <Pill x={W / 2} y={370} from={at("find", "Arnold")} to={S.twist} size={TXT}>Joseph Arnold</Pill>

    {/* TWIST */}
    <Headline x={W / 2} y={190} from={S.twist} to={S.vine} size={104} color={C.koral}>Tapi tunggu…</Headline>
    <Pill x={W / 2} y={350} from={at("twist", "daun")} to={S.vine} size={TXT}>Tanpa daun & akar</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("twist", "daun")} to={S.vine} color={C.koral} size={84}>Tanpa daun</Stamp>

    {/* VINE */}
    <Headline x={W / 2} y={200} from={S.vine} to={S.tebak} size={104} color={C.kunyit}>Numpang hidup</Headline>
    <Pill x={W / 2} y={350} from={at("vine", "tanaman")} to={S.tebak} size={TXT}>Di tanaman rambat</Pill>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={150} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "selebar")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Selebar apa bunganya?</Pill>

    {/* REVEAL */}
    <Flower />
    <Headline x={W / 2} y={200} from={S.reveal} to={S.status} size={150} color={C.kunyit}>±1 METER</Headline>
    <Pill x={W / 2} y={350} from={at("reveal", "satu")} to={S.smell} size={TXT}>Terbesar di dunia</Pill>

    {/* SMELL */}
    <Pill x={W / 2} y={350} from={S.smell} to={S.short} size={TXT} bg={C.koral} fg={C.putih}>Bau daging busuk</Pill>

    {/* SHORT */}
    <Pill x={W / 2} y={350} from={S.short} to={S.status} size={TXT}>Kuncup: berbulan-bulan</Pill>
    <Pill x={W / 2} y={460} from={at("short", "beberapa")} to={S.status} size={TXT} bg={C.toska}>Mekar: beberapa hari</Pill>

    {/* STATUS */}
    <Headline x={W / 2} y={200} from={S.status} to={S.question} size={150} color={C.kunyit}>1993</Headline>
    <Pill x={W / 2} y={370} from={at("status", "puspa")} to={S.question} size={TXT}>Puspa langka Indonesia</Pill>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={QEND} size={96}>
      Pernah <span style={{ color: C.kunyit }}>lihat langsung?</span>
    </Headline>
    {ANS.map((name, i) => (
      <Pill key={name} x={ANS_POS[i][0]} y={ANS_POS[i][1]} from={S.question + 0.25 + i * 0.08} to={QEND} size={TXT} bg={C.kunyit}>{name}</Pill>
    ))}
    <Pill x={W / 2} y={STAMP_Y + 80} from={at("question", "Tulis")} to={QEND} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "smell").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("reveal", "satu"), name: "impact" as const },
  { at: at("twist", "daun"), name: "pop" as const },
];

export const Ep017: React.FC = () => {
  const t = useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [at("find", "Arnold"), S.reveal, S.question + 0.25];
  const counts: [number, number][] = [];
  const lands = [at("reveal", "satu"), at("twist", "daun")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <MapView cam={camera(t)}>
          <MapLayers />
        </MapView>
        <ProjectionOnly cam={camera(t)}>
          <MapHtmlLabels />
        </ProjectionOnly>
        <Overlays />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep017.wav" voiceLufs={-16.2} words={captions} track={EP017_TRACK} seconds={EP017_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP017_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: ZOOMS, icons, counts, lands }} />
    </AbsoluteFill>
  );
};
