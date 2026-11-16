import type { VoiceManifest } from "./types";

// Round beats in seconds (see CLAUDE.md)
export const BEATS = {
  mom: 0,
  dad: 0.6,
  guess: 1.2,
  countdown: 1.2,
  child: 2.4,
  punch: 2.8,
};
export const MIN_ROUND = 4.5;
export const OUTRO = 0.3;

// When each voice line starts in a round. Lines never overlap: a line that
// would start before the previous one ends is pushed back a little.
export const voiceTimes = (voices: VoiceManifest, roundIndex: number) => {
  const gap = 0.05;
  const mom = BEATS.mom;
  const dad = Math.max(BEATS.dad, mom + voices.mom + gap);
  const me = BEATS.child;
  const punch = Math.max(BEATS.punch, me + voices.me + 0.12);
  const end = punch + voices.punchlines[roundIndex] + 0.25;
  return { mom, dad, me, punch, roundLength: Math.max(MIN_ROUND, end) };
};

export const roundFrames = (voices: VoiceManifest, roundIndex: number, fps: number) =>
  Math.ceil(voiceTimes(voices, roundIndex).roundLength * fps);
