// Episode 20 (science, TIMELY): Geminid meteor shower 13-14 Dec 2026, from asteroid Phaethon. Locked template (from Ep019),
// captions v2 + SfxLayer2 + v2 mix. Infographic only: sky gradient, meteor streaks, counters, pills.
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, Pill, Stamp, useT } from "../components/ui";
import { pickTrack } from "../music";
import { C, W } from "../theme";
import captionsJson from "./ep020-captions.json";
import timing from "./ep020-timing.json";
import { KEYS, type SegmentId } from "./ep020-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP020_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP020_TRACK = pickTrack(20, EP020_SECONDS);

const TXT = 54;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};



const QEND = EP020_SECONDS + 1;

// meteor streaks: pure decoration, all radiating from the top-right (the Geminid radiant)
const Streak: React.FC<{ i: number }> = ({ i }) => {
  const t = useT();
  const period = 1.6 + (i % 4) * 0.35;
  const p = ((t + i * 0.47) % period) / period;
  const x0 = 120 + ((i * 197) % 900), y0 = 120 + ((i * 331) % 900);
  const len = 260 + (i % 3) * 90;
  const dx = p * 340, dy = p * 340;
  const op = Math.sin(Math.PI * p) * 0.85;
  return <div style={{ position: "absolute", left: x0 + dx, top: y0 + dy, width: len, height: 6, borderRadius: 6, background: `linear-gradient(90deg, rgba(255,255,255,0), ${C.kunyit})`, opacity: op, transform: "rotate(45deg)", transformOrigin: "0 0" }} />;
};

const Overlays: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(25,20,70,1) 0%, rgba(14,10,38,1) 55%, rgba(5,4,14,1) 100%)" }} />
    {Array.from({ length: 9 }, (_, i) => <Streak key={i} i={i} />)}

    {/* HOOK */}
    <Headline x={W / 2} y={230} from={0} to={S.rock} size={104} color={C.kunyit}>Hujan meteor Geminid</Headline>
    <Pill x={W / 2} y={420} from={at("hook", "Desember")} to={S.rock} size={TXT} bg={C.toska}>13–14 Desember 2026</Pill>
    <Stamp x={W / 2} y={1150} from={at("hook", "bukan")} to={S.rock} color={C.koral} size={72}>Bukan dari komet!</Stamp>

    {/* ROCK */}
    <Pill x={W / 2} y={170} from={S.rock} to={S.size} size={TXT}>Kebanyakan: komet</Pill>
    <Headline x={W / 2} y={330} from={at("rock", "batu:")} to={S.size} size={104} color={C.kunyit}>Geminid: batu</Headline>
    <Pill x={W / 2} y={1150} from={at("rock", "asteroid")} to={S.size} size={TXT} bg={C.toska}>Asteroid Phaethon</Pill>

    {/* SIZE */}
    <Pill x={W / 2} y={170} from={S.size} to={S.speed} size={TXT} bg={C.toska}>Ditemukan 1983</Pill>
    <Counter x={W / 2} y={330} from={at("size", "sekitar")} to={S.speed} a={0} b={5} t0={at("size", "sekitar")} t1={at("size", "kilometer.")} unit="KM LEBAR" size={170} color={C.kunyit} />

    {/* SPEED */}
    <Headline x={W / 2} y={170} from={S.speed} to={at("speed", "serpihannya")} size={96} color={C.koral}>Tapi tunggu…</Headline>
    <Counter x={W / 2} y={330} from={at("speed", "melesat")} to={S.tebak} a={0} b={35} t0={at("speed", "melesat")} t1={at("speed", "detik.")} unit="KM/DETIK" size={170} color={C.kunyit} />
    <Pill x={W / 2} y={1150} from={at("speed", "Jakarta")} to={S.tebak} size={TXT} bg={C.toska}>Jakarta → Surabaya</Pill>
    <Pill x={W / 2} y={1260} from={at("speed", "kurang")} to={S.tebak} size={TXT} bg={C.koral} fg={C.putih}>kurang dari 20 detik</Pill>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={170} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Headline x={W / 2} y={380} from={at("tebak", "Tebak")} to={S.reveal} size={190} color={C.kunyit}>???</Headline>
    <Pill x={W / 2} y={1150} from={at("tebak", "berapa")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Berapa meteor per jam?</Pill>

    {/* REVEAL */}
    <Pill x={W / 2} y={170} from={S.reveal} to={S.question} size={TXT}>Di langit gelap</Pill>
    <Headline x={W / 2} y={380} from={at("reveal", "empat")} to={S.question} size={190} color={C.kunyit}>40–50</Headline>
    <Pill x={W / 2} y={560} from={at("reveal", "meteor")} to={S.question} size={TXT} bg={C.toska}>meteor per jam</Pill>
    <Stamp x={W / 2} y={1170} from={at("reveal", "langitnya")} to={S.question} color={C.koral} size={72}>Langit gelap</Stamp>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={QEND} size={96}>
      Begadang <span style={{ color: C.kunyit }}>atau tidur?</span>
    </Headline>
    <Pill x={290} y={1150} from={S.question + 0.25} to={QEND} size={TXT} bg={C.kunyit}>Begadang</Pill>
    <Pill x={790} y={1150} from={S.question + 0.33} to={QEND} size={TXT} bg={C.kunyit}>Tidur</Pill>
    <Pill x={W / 2} y={1260} from={at("question", "Tulis")} to={QEND} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "speed").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("reveal", "empat"), name: "impact" as const },
  { at: at("hook", "bukan"), name: "pop" as const },
];

export const Ep020: React.FC = () => {
  useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [at("hook", "Desember"), at("rock", "asteroid"), at("speed", "Jakarta"), at("speed", "kurang"), S.question + 0.25];
  const counts: [number, number][] = [
    [at("size", "sekitar"), at("size", "kilometer.")],
    [at("speed", "melesat"), at("speed", "detik.")],
  ];
  const lands = [at("reveal", "empat"), at("hook", "bukan")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <Overlays />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep020.wav" voiceLufs={-16.2} words={captions} track={EP020_TRACK} seconds={EP020_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP020_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: [], icons, counts, lands }} />
    </AbsoluteFill>
  );
};
