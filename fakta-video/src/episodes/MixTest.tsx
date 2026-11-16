// Audio-only check of the music rules (rotation, ducking, fades) on the first 20 s of Ep001V2's voice.
// Render: npx remotion render Fakta-MixTest renders/_mixtest.wav --codec=wav [--props='{"mute":"music"}']
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill } from "remotion";
import { Soundtrack } from "../components/Soundtrack";
import { pickTrack } from "../music";
import captionsJson from "./ep001v2-captions.json";
import timing from "./ep001v2-timing.json";

export const MIXTEST_SECONDS = 20;
const EP001_SECONDS = timing[timing.length - 1].end + 0.3;
export const EP001_TRACK = pickTrack(1, EP001_SECONDS);

export const MixTest: React.FC<{ mute?: "voice" | "music" }> = ({ mute }) => (
  <AbsoluteFill style={{ background: "#07060D" }}>
    <Soundtrack voice="voice/ep001v2.wav" voiceLufs={-17.4} words={captionsJson as Caption[]} track={EP001_TRACK} seconds={MIXTEST_SECONDS} mute={mute} />
  </AbsoluteFill>
);
