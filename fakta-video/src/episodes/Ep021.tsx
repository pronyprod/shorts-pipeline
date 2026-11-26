// Episode 21 (history): Makassan trepang voyages to Arnhem Land. Locked template (from Ep019),
// captions v2 + SfxLayer2 + v2 mix. Infographic only: sea gradient, route line, counters, pills.
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, Pill, Stamp, useT } from "../components/ui";
import { pickTrack } from "../music";
import { C, W } from "../theme";
import captionsJson from "./ep021-captions.json";
import timing from "./ep021-timing.json";
import { KEYS, type SegmentId } from "./ep021-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP021_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP021_TRACK = pickTrack(21, EP021_SECONDS);

const TXT = 54;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};



const QEND = EP021_SECONDS + 1;

// decoration: slow sea waves
const Wave: React.FC<{ i: number }> = ({ i }) => {
  const t = useT();
  const x = ((t * (40 + i * 9) + i * 211) % 1400) - 160;
  return <div style={{ position: "absolute", left: x, top: 640 + i * 70, width: 220, height: 8, borderRadius: 8, background: "rgba(255,255,255,0.14)" }} />;
};

// route Makassar -> Arnhem Land (schematic, not to scale), drawn between two dots
const Route: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const t = useT();
  const p = Math.max(0, Math.min(1, (t - from) / 1.6));
  if (t < from || t > to) return null;
  const x0 = 170, y0 = 760, x1 = 910, y1 = 1010;
  return (
    <>
      <div style={{ position: "absolute", left: x0, top: y0, width: Math.hypot(x1 - x0, y1 - y0) * p, height: 12, borderRadius: 12, background: C.kunyit, transformOrigin: "0 50%", transform: `rotate(${Math.atan2(y1 - y0, x1 - x0)}rad)`, boxShadow: "0 0 24px rgba(255,176,0,0.7)" }} />
      <div style={{ position: "absolute", left: x0 - 24, top: y0 - 18, width: 48, height: 48, borderRadius: 48, background: C.koral, border: `6px solid ${C.tinta}` }} />
      <div style={{ position: "absolute", left: x1 - 24, top: y1 - 18, width: 48, height: 48, borderRadius: 48, background: C.toska, border: `6px solid ${C.tinta}`, opacity: p > 0.95 ? 1 : 0 }} />
    </>
  );
};

const Overlays: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,40,70,1) 0%, rgba(8,28,56,1) 55%, rgba(5,10,24,1) 100%)" }} />
    {Array.from({ length: 8 }, (_, i) => <Wave key={i} i={i} />)}

    {/* HOOK */}
    <Headline x={W / 2} y={230} from={0} to={S.why} size={104} color={C.kunyit}>Pelaut Makassar</Headline>
    <Pill x={W / 2} y={420} from={at("hook", "Australia,")} to={S.why} size={TXT} bg={C.toska}>→ Australia</Pill>
    <Stamp x={W / 2} y={1150} from={at("hook", "lebih")} to={S.why} color={C.koral} size={72}>100+ tahun lebih awal</Stamp>

    {/* WHY */}
    <Pill x={W / 2} y={170} from={S.why} to={S.dist} size={TXT}>Mencari teripang</Pill>
    <Headline x={W / 2} y={330} from={at("why", "teripang,")} to={S.dist} size={104} color={C.kunyit}>Dijual ke Tiongkok</Headline>
    <Pill x={W / 2} y={1150} from={at("why", "angin")} to={S.dist} size={TXT} bg={C.toska}>Ikut angin muson</Pill>

    {/* DIST */}
    <Pill x={290} y={620} from={at("dist", "Makassar")} to={S.fleet} size={TXT} bg={C.koral} fg={C.putih}>Makassar</Pill>
    <Pill x={720} y={1130} from={at("dist", "Arnhem")} to={S.fleet} size={TXT} bg={C.toska}>Arnhem Land</Pill>
    <Route from={at("dist", "sekitar")} to={S.fleet} />
    <Counter x={W / 2} y={330} from={at("dist", "sekitar")} to={S.fleet} a={0} b={2000} t0={at("dist", "sekitar")} t1={at("dist", "kilometer,")} unit="KM" size={170} color={C.kunyit} />
    <Pill x={W / 2} y={1270} from={at("dist", "tiga")} to={S.fleet} size={TXT} bg={C.kunyit}>3× Jakarta → Surabaya</Pill>

    {/* FLEET */}
    <Headline x={W / 2} y={170} from={S.fleet} to={at("fleet", "seorang")} size={96} color={C.koral}>Tapi tunggu…</Headline>
    <Pill x={W / 2} y={330} from={at("fleet", "seribu")} to={S.words} size={TXT} bg={C.toska}>Tahun 1803</Pill>
    <Counter x={W / 2} y={560} from={at("fleet", "sekitar")} to={S.words} a={0} b={60} t0={at("fleet", "sekitar")} t1={at("fleet", "perahu")} unit="PERAHU" size={170} color={C.kunyit} />
    <Pill x={W / 2} y={1150} from={at("fleet", "penjelajah")} to={S.words} size={TXT}>Dilihat Matthew Flinders</Pill>

    {/* WORDS */}
    <Pill x={W / 2} y={170} from={S.words} to={S.tebak} size={TXT} bg={C.toska}>Dagang dengan orang Yolngu</Pill>
    <Headline x={W / 2} y={400} from={at("words", "rupiah")} to={S.tebak} size={150} color={C.kunyit}>“rrupia”</Headline>
    <Pill x={W / 2} y={620} from={at("words", "rupiah")} to={S.tebak} size={TXT} bg={C.kunyit}>= uang, sampai sekarang</Pill>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={170} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Headline x={W / 2} y={380} from={at("tebak", "Tebak")} to={S.reveal} size={190} color={C.kunyit}>???</Headline>
    <Pill x={W / 2} y={1150} from={at("tebak", "tahun")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Kapan perahu terakhir?</Pill>

    {/* REVEAL */}
    <Pill x={W / 2} y={170} from={S.reveal} to={S.question} size={TXT}>Perahu terakhir datang</Pill>
    <Headline x={W / 2} y={380} from={at("reveal", "Seribu")} to={S.question} size={190} color={C.kunyit}>1907</Headline>
    <Stamp x={W / 2} y={1170} from={at("reveal", "tujuh!")} to={S.question} color={C.koral} size={72}>Akhir pelayaran</Stamp>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={QEND} size={96}>
      Pelaut <span style={{ color: C.kunyit }}>atau petani?</span>
    </Headline>
    <Pill x={290} y={1150} from={S.question + 0.25} to={QEND} size={TXT} bg={C.kunyit}>Pelaut</Pill>
    <Pill x={790} y={1150} from={S.question + 0.33} to={QEND} size={TXT} bg={C.kunyit}>Petani</Pill>
    <Pill x={W / 2} y={1260} from={at("question", "Tulis")} to={QEND} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "fleet").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("reveal", "Seribu"), name: "impact" as const },
  { at: at("hook", "lebih"), name: "pop" as const },
];

export const Ep021: React.FC = () => {
  useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [at("hook", "Australia,"), at("why", "angin"), at("dist", "Arnhem"), at("fleet", "penjelajah"), at("words", "rupiah"), S.question + 0.25];
  const counts: [number, number][] = [
    [at("dist", "sekitar"), at("dist", "kilometer,")],
    [at("fleet", "sekitar"), at("fleet", "perahu")],
  ];
  const lands = [at("reveal", "Seribu"), at("hook", "lebih")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <Overlays />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep021.wav" voiceLufs={-16.4} words={captions} track={EP021_TRACK} seconds={EP021_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP021_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: [], icons, counts, lands }} />
    </AbsoluteFill>
  );
};
