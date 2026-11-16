// TEST ONLY (14 Nov 2026): captions v2 (key phrases by meaning, entrances, stickers), SfxLayer2 (action sounds) and the
// v2 mix, on the first 15 s of Ep009's voice (its own whisper captions and timing; 0 Gemini requests). Not an episode.
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, Pill } from "../components/ui";
import { C, W } from "../theme";
import captionsJson from "./ep009-captions.json";
import timing from "./ep009-timing.json";
import { EP009_TRACK } from "./Ep009";

export const LIVETEST2_SECONDS = 15;
const captions = (captionsJson as Caption[]).filter((c) => c.startMs < LIVETEST2_SECONDS * 1000 - 300);
const segments = timing.filter((s) => s.start < LIVETEST2_SECONDS).map((s) => ({ id: s.id, start: s.start, end: s.end }));
// what an episode script would export as KEYS (whole units a person would stress)
const KEYS: Partial<Record<string, string[]>> = { hook: ["lima pulau", "Indonesia"], islands: ["Nusa Tenggara Timur"], find: ["seribu sembilan ratus sepuluh"], size: ["tiga meter"] };
const word = (w: string) => (captions.find((c) => c.text.trim().replace(/[^\p{L}]/gu, "") === w)?.startMs ?? 0) / 1000;

export const LiveTest2: React.FC<{ mute?: "voice" | "bed" }> = ({ mute }) => {
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, segments.filter((s) => s.id === "find").map((s) => [s.start, s.end] as [number, number])), []);
  const t5 = word("lima");
  const icons = [word("Komodo"), word("Rinca"), word("Flores")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #2B1B4F 0%, ${C.angkasa} 75%)` }} />
        <Headline x={W / 2} y={330} from={0} to={LIVETEST2_SECONDS} size={86}>
          Tes <span style={{ color: C.kunyit }}>teks v2</span>
        </Headline>
        <Counter x={W / 2} y={620} from={t5 - 0.2} to={5.3} a={0} b={5} t0={t5} t1={t5 + 0.6} unit=" pulau" size={150} color={C.kunyit} />
        {["Komodo", "Rinca", "Flores"].map((n, i) => (
          <Pill key={n} x={260 + i * 280} y={900} from={icons[i]} to={11.2} size={52} bg={C.toska}>
            {n}
          </Pill>
        ))}
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep009.wav" voiceLufs={-16.2} words={captions} track={EP009_TRACK} seconds={LIVETEST2_SECONDS} mix="v2" mute={mute === "voice" ? "voice" : mute === "bed" ? "music" : undefined} />
      {mute === "bed" ? null : (
        <SfxLayer2 captions={captions} segments={segments} seconds={LIVETEST2_SECONDS} actions={{ moments: captionMoments2(plan), icons, counts: [[t5, t5 + 0.6]], zooms: [segments[1].start - 0.3] }} />
      )}
    </AbsoluteFill>
  );
};
