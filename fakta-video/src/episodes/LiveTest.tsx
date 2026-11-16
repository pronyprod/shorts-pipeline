// TEST ONLY (12 Nov 2026): the lively captions + the SFX layer on the first 15 s of Ep009's voice
// (its own whisper captions and timing; 0 Gemini requests). Plain background; not an episode.
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill } from "remotion";
import { LiveCaptions } from "../components/LiveCaptions";
import { SfxLayer } from "../components/SfxLayer";
import { Soundtrack } from "../components/Soundtrack";
import { Headline } from "../components/ui";
import { C, W } from "../theme";
import captionsJson from "./ep009-captions.json";
import timing from "./ep009-timing.json";
import { EP009_TRACK } from "./Ep009";

export const LIVETEST_SECONDS = 15;
const captions = (captionsJson as Caption[]).filter((c) => c.startMs < LIVETEST_SECONDS * 1000 - 300);
const segments = timing.filter((s) => s.start < LIVETEST_SECONDS);

export const LiveTest: React.FC<{ sfx?: boolean }> = ({ sfx = true }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #2B1B4F 0%, ${C.angkasa} 75%)` }}>
    <Headline x={W / 2} y={420} from={0} to={LIVETEST_SECONDS} size={90}>
      Tes <span style={{ color: C.kunyit }}>teks hidup</span>
    </Headline>
    <LiveCaptions captions={captions} bounce={segments.filter((s) => s.id === "reveal" || s.id === "size").map((s) => [s.start, s.end] as [number, number])} />
    <Soundtrack voice="voice/ep009.wav" voiceLufs={-16.2} words={captions} track={EP009_TRACK} seconds={LIVETEST_SECONDS} />
    {sfx ? <SfxLayer captions={captions} segments={segments} seconds={LIVETEST_SECONDS} /> : null}
  </AbsoluteFill>
);
