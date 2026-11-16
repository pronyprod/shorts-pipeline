import { MIN_ROUND } from "../timing";
import type { FormatRoundData, FormatVoices } from "./types";

export const REVEAL = 2.4; // seconds: same countdown length as the normal round
export const GUESS_FROM = 1.2;

export const reverseTimes = (voices: FormatVoices) => {
  const me = 0.15;
  const mom = REVEAL;
  const dad = Math.max(3.0, mom + voices.mom + 0.05);
  const punch = dad + voices.dad + 0.12;
  return { me, mom, dad, punch };
};

// Rounds with a spoken intro: the intro, then the countdown, then the reveal.
export const introTimes = (voices: FormatVoices, index: number) => {
  const intro = voices.intros?.[index] ?? 0;
  const guess = Math.max(GUESS_FROM, 0.1 + intro + 0.1);
  const reveal = Math.max(REVEAL, guess + 0.9);
  const punch = reveal + 0.5;
  return { intro: 0.1, guess, reveal, punch };
};

export const punchAt = (round: FormatRoundData, voices: FormatVoices, index: number) =>
  round.format === "reverse" ? reverseTimes(voices).punch : introTimes(voices, index).punch;

export const formatRoundFrames = (
  round: FormatRoundData,
  voices: FormatVoices,
  index: number,
  fps: number,
) =>
  Math.ceil(Math.max(MIN_ROUND, punchAt(round, voices, index) + voices.punchlines[index] + 0.25) * fps);
