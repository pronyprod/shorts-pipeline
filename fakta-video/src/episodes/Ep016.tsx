// Episode 16 (food): "Kenapa kopi disebut java?". Built on the locked template (from Ep014),
// captions v2 + SfxLayer2 + v2 mix. One map shot: Java (Batavia) -> out to Amsterdam -> back to Indonesia.
import type { Caption } from "@remotion/captions";
import { geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { Geo, MapView, ProjectionOnly, Route, type Camera } from "../components/MapView";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, MapLabel, Pill, Pin, Stamp, ramp, useLife, useT } from "../components/ui";
import countries from "../data/countries.json";
import indonesia from "../data/indonesia.json";
import type { LonLat } from "../lib/geo";
import { pickTrack } from "../music";
import { C, FONT, SHADOW, W } from "../theme";
import captionsJson from "./ep016-captions.json";
import timing from "./ep016-timing.json";
import { KEYS, NUM, PT, type SegmentId } from "./ep016-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP016_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP016_TRACK = pickTrack(16, EP016_SECONDS);

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

// --- camera -----------------------------------------------------------------------------------------------------
const JAVA: LonLat = [110.3, -7.3];
const MID = geoInterpolate(PT.batavia, PT.amsterdam)(0.5) as LonLat;
const HOME: LonLat = [118, -2.5];
type Key = { t: number; c: LonLat; w: number };
const CAM: Key[] = [
  { t: 0, c: JAVA, w: 1350 },
  { t: S.europe - 0.3, c: JAVA, w: 1300 },
  { t: S.europe + 2.4, c: MID, w: 17500 },
  { t: S.rank, c: MID, w: 17500 },
  { t: S.rank + 1.8, c: HOME, w: 6300 },
  { t: 999, c: HOME, w: 6300 },
];
const ZOOMS = [S.europe, S.rank];
const camera = (t: number): Camera => {
  const i = Math.max(0, CAM.findIndex((k) => k.t > t) - 1);
  const a = CAM[i], b = CAM[Math.min(i + 1, CAM.length - 1)];
  const k = b.t > a.t ? ramp(t, a.t, b.t) : 0;
  const [lon, lat] = geoInterpolate(a.c, b.c)(k) as LonLat;
  return { lon, lat, widthKm: Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * k) };
};

const QEND = EP016_SECONDS + 1;
const MapLayers: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Geo d={countries as GeoPermissibleObjects} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.8} />
    <Geo d={indonesia as GeoPermissibleObjects} fill={C.koral} fillOpacity={0.5} stroke={C.putih} strokeWidth={2.2} strokeLinejoin="round" />
    <Pin at={PT.batavia} from={at("plant", "Batavia")} to={S.rank} color={C.kunyit} r={16} />
    <Pin at={PT.amsterdam} from={at("europe", "Eropa")} to={S.rank} color={C.toska} r={22} />
    <Route from={PT.batavia} to={PT.amsterdam} progress={ramp(t, at("europe", "dikirim"), at("europe", "Eropa") + 0.6) * (t < S.rank ? 1 : 0)} color={C.kunyit} width={14} />
  </>
);

const L: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => <MapLabel size={TXT} clamp maxY={SAFE_BOTTOM - 20} {...p} />;
const MapHtmlLabels: React.FC = () => (
  <>
    <L at={PT.batavia} from={at("plant", "Batavia")} to={S.europe + 1.5} dy={-85} bg={C.kunyit}>Batavia</L>
    <L at={PT.batavia} from={S.europe + 1.5} to={S.rank} dy={85} bg={C.kunyit}>Batavia</L>
    <L at={PT.amsterdam} from={at("europe", "Eropa")} to={S.rank} dy={-85} bg={C.toska}>Amsterdam</L>
  </>
);

const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 180, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>???</div>;
};

const COFFEES = ["Gayo", "Toraja", "Flores", "Kintamani"];
const COFFEE_POS: [number, number][] = [[290, 1000], [790, 1000], [290, 1110], [790, 1110]];

const Overlays: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.8) 0%, rgba(7,6,13,0.2) 30%, rgba(7,6,13,0.2) 64%, rgba(7,6,13,0.72) 100%)" }} />

    {/* HOOK: on screen in the first second */}
    <Headline x={W / 2} y={200} from={0} to={S.plant} size={124} color={C.kunyit}>Java = kopi?</Headline>
    <Pill x={W / 2} y={360} from={0.3} to={S.plant} size={TXT}>Java juga nama pulau</Pill>

    {/* PLANT */}
    <Headline x={W / 2} y={200} from={S.plant} to={S.flood} size={150} color={C.kunyit}>1696</Headline>
    <Pill x={W / 2} y={370} from={at("plant", "bibit")} to={S.flood} size={TXT}>Bibit kopi pertama</Pill>

    {/* FLOOD */}
    <Headline x={W / 2} y={190} from={S.flood} to={S.second} size={104} color={C.koral}>Tapi tunggu…</Headline>
    <Pill x={W / 2} y={350} from={at("flood", "gagal")} to={S.second} size={TXT}>Banjir di Batavia</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("flood", "gagal")} to={S.second} color={C.koral} size={84}>Gagal</Stamp>

    {/* SECOND */}
    <Headline x={W / 2} y={200} from={S.second} to={S.tebak} size={150} color={C.kunyit}>1699</Headline>
    <Pill x={W / 2} y={370} from={at("second", "Kiriman")} to={S.tebak} size={TXT}>Kiriman kedua</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("second", "berhasil")} to={S.tebak} color={C.toska} size={84}>Berhasil</Stamp>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={150} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "berapa")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Berapa tahun sejak 1699?</Pill>

    {/* REVEAL */}
    <Counter x={W / 2} y={200} from={S.reveal} to={S.europe} a={0} b={NUM.years} t0={S.reveal} t1={S.reveal + 1.4} unit=" TAHUN" size={150} />
    <Stamp x={W / 2} y={STAMP_Y} from={at("reveal", "Tiga")} to={S.europe} color={C.kunyit} size={72}>2026 − 1699</Stamp>

    {/* EUROPE */}
    <Headline x={W / 2} y={200} from={S.europe} to={S.code} size={112} color={C.kunyit}>Java = kopi</Headline>
    <Pill x={W / 2} y={350} from={at("europe", "melekat")} to={S.code} size={TXT}>Dari pulau Jawa</Pill>

    {/* CODE */}
    <Headline x={W / 2} y={200} from={S.code} to={S.rank} size={104} color={C.kunyit}>Bahasa Java</Headline>
    <Pill x={W / 2} y={350} from={at("code", "dinamai")} to={S.rank} size={TXT}>Dinamai dari kopi Java</Pill>

    {/* RANK */}
    <Headline x={W / 2} y={190} from={S.rank} to={S.question} size={88} color={C.kunyit}>Lima besar dunia</Headline>
    <Pill x={W / 2} y={350} from={at("rank", "produsen")} to={S.question} size={TXT}>Produsen kopi, 2025</Pill>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={QEND} size={96}>
      Kopi <span style={{ color: C.kunyit }}>daerahmu apa?</span>
    </Headline>
    {COFFEES.map((name, i) => (
      <Pill key={name} x={COFFEE_POS[i][0]} y={COFFEE_POS[i][1]} from={S.question + 0.25 + i * 0.08} to={QEND} size={TXT} bg={C.kunyit}>{name}</Pill>
    ))}
    <Pill x={W / 2} y={STAMP_Y + 80} from={at("question", "Tulis")} to={QEND} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "code").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("reveal", "Tiga"), name: "impact" as const },
  { at: at("second", "berhasil"), name: "pop" as const },
];

export const Ep016: React.FC = () => {
  const t = useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [at("plant", "Batavia"), at("europe", "Eropa"), S.question + 0.25];
  const counts: [number, number][] = [[S.reveal, S.reveal + 1.4]];
  const lands = [at("reveal", "Tiga"), at("second", "berhasil"), at("flood", "gagal")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <MapView cam={camera(t)}>
          <MapLayers t={t} />
        </MapView>
        <ProjectionOnly cam={camera(t)}>
          <MapHtmlLabels />
        </ProjectionOnly>
        <Overlays />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep016.wav" voiceLufs={-16.3} words={captions} track={EP016_TRACK} seconds={EP016_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP016_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: ZOOMS, icons, counts, lands }} />
    </AbsoluteFill>
  );
};
