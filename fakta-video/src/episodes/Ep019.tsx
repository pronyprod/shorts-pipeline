// Episode 19 (geography): "Indonesia punya berapa pulau?". Built on the locked template (from Ep017),
// captions v2 + SfxLayer2 + v2 mix. Infographic only: counters and a 10x5 dot grid (17 of 50 = 34% lit), no map.
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, Pill, Stamp, ramp, usePop, useT } from "../components/ui";
import { pickTrack } from "../music";
import { C, W } from "../theme";
import captionsJson from "./ep019-captions.json";
import timing from "./ep019-timing.json";
import { KEYS, type SegmentId } from "./ep019-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP019_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP019_TRACK = pickTrack(19, EP019_SECONDS);

const TXT = 54;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};


const QEND = EP019_SECONDS + 1;
const COLS = 10, ROWS = 5, GAP = 100, GX0 = (W - (COLS - 1) * GAP) / 2, GY0 = 650, LIT = 17; // 17 of 50 = 34%
const COUNT_Y = 330;

// one dot = one island; the first LIT dots stay turmeric (inhabited), the rest fade out at the reveal
const Dot: React.FC<{ i: number }> = ({ i }) => {
  const t = useT();
  const col = i % COLS, row = Math.floor(i / COLS);
  const k = usePop(0.2 + i * 0.03);
  const f = ramp(t, at("reveal", "enam"), at("reveal", "enam") + 0.6);
  const inhabited = i < LIT;
  const size = 64 + (inhabited ? 10 * f : 0);
  const opacity = inhabited ? 1 : 1 - 0.7 * f;
  const bg = inhabited && f > 0.5 ? C.kunyit : C.toska;
  return <div style={{ position: "absolute", left: GX0 + col * GAP - size / 2, top: GY0 + row * GAP - size / 2, width: size, height: size, borderRadius: size, background: bg, opacity, border: `6px solid ${C.tinta}`, boxSizing: "border-box", transform: `scale(${k})` }} />;
};

const Overlays: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(60,40,90,1) 0%, rgba(27,16,40,1) 55%, rgba(7,6,13,1) 100%)" }} />
    {Array.from({ length: COLS * ROWS }, (_, i) => <Dot key={i} i={i} />)}

    {/* HOOK */}
    <Headline x={W / 2} y={200} from={0} to={S.survey} size={104} color={C.kunyit}>Berapa pulau kita?</Headline>
    <Pill x={W / 2} y={380} from={0.3} to={S.survey} size={TXT}>Jawabannya beda-beda</Pill>

    {/* SURVEY */}
    <Pill x={W / 2} y={170} from={S.survey} to={S.law} size={TXT} bg={C.toska}>Survei 2007–2010</Pill>
    <Counter x={W / 2} y={COUNT_Y} from={S.survey} to={at("law", "tujuh")} a={0} b={13466} t0={S.survey + 0.4} t1={at("survey", "pulau")} unit="PULAU" size={170} color={C.toska} />

    {/* LAW */}
    <Headline x={W / 2} y={170} from={S.law} to={S.why} size={96} color={C.koral}>Tapi tunggu…</Headline>
    <Pill x={W / 2} y={1150} from={at("law", "undang-undang")} to={S.why} size={TXT} bg={C.kunyit}>Undang-undang 1996</Pill>
    <Counter x={W / 2} y={COUNT_Y + 40} from={at("law", "tujuh")} to={S.why} a={13466} b={17508} t0={at("law", "tujuh")} t1={at("law", "delapan")} unit="PULAU" size={170} color={C.kunyit} />

    {/* WHY */}
    <Headline x={W / 2} y={250} from={S.why} to={S.tebak} size={96} color={C.kunyit}>Selisihnya dari mana?</Headline>
    <Pill x={W / 2} y={1150} from={at("why", "karang")} to={S.tebak} size={TXT}>Karang & pulau pasir</Pill>
    <Pill x={W / 2} y={1260} from={at("why", "muncul")} to={S.tebak} size={TXT} bg={C.toska}>Muncul saat air surut</Pill>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={170} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Headline x={W / 2} y={380} from={at("tebak", "Tebak")} to={S.reveal} size={190} color={C.kunyit}>???</Headline>
    <Pill x={W / 2} y={1150} from={at("tebak", "berapa")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Berapa yang dihuni?</Pill>

    {/* REVEAL */}
    <Pill x={W / 2} y={170} from={S.reveal} to={S.java} size={TXT}>Pulau berpenghuni</Pill>
    <Counter x={W / 2} y={COUNT_Y} from={S.reveal} to={S.java} a={0} b={6000} t0={at("reveal", "sekitar")} t1={at("reveal", "pulau")} unit="PULAU" size={170} color={C.kunyit} />
    <Pill x={W / 2} y={470} from={at("reveal", "sekitar")} to={S.java} size={TXT} bg={C.toska}>sekitar</Pill>
    <Stamp x={W / 2} y={1170} from={at("reveal", "sepertiganya")} to={S.java} color={C.koral} size={72}>Sepertiga</Stamp>

    {/* JAVA */}
    <Headline x={W / 2} y={230} from={S.java} to={S.question} size={104} color={C.kunyit}>Lebih dari 50%</Headline>
    <Pill x={W / 2} y={380} from={at("java", "separuh")} to={S.question} size={TXT}>orang Indonesia</Pill>
    <Stamp x={W / 2} y={1170} from={at("java", "Jawa")} to={S.question} color={C.koral} size={72}>Di Jawa</Stamp>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={QEND} size={96}>
      Kamu tinggal di <span style={{ color: C.kunyit }}>pulau mana?</span>
    </Headline>
    <Pill x={290} y={1150} from={S.question + 0.25} to={QEND} size={TXT} bg={C.kunyit}>Jawa</Pill>
    <Pill x={790} y={1150} from={S.question + 0.33} to={QEND} size={TXT} bg={C.kunyit}>Sumatra</Pill>
    <Pill x={W / 2} y={1260} from={at("question", "Tulis")} to={QEND} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "law").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("reveal", "sepertiganya"), name: "impact" as const },
  { at: at("law", "tujuh"), name: "pop" as const },
];

export const Ep019: React.FC = () => {
  useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [at("law", "undang-undang"), at("why", "karang"), at("why", "muncul"), S.question + 0.25];
  const counts: [number, number][] = [
    [S.survey + 0.4, at("survey", "pulau")],
    [at("law", "tujuh"), at("law", "delapan")],
    [at("reveal", "sekitar"), at("reveal", "pulau")],
  ];
  const lands = [at("reveal", "sepertiganya"), at("java", "Jawa")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <Overlays />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep019.wav" voiceLufs={-16.1} words={captions} track={EP019_TRACK} seconds={EP019_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP019_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: [], icons, counts, lands }} />
    </AbsoluteFill>
  );
};
