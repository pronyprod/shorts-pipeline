// Voice + music for an episode: the music is ducked DUCK_DB under the voice while words are spoken,
// rises to OPEN_DB in longer gaps, fades in at the start and out at the end.
// Levels assume the normalised music copies (MUSIC_LUFS) and a voice at VOICE_LUFS; pass `voiceLufs`
// when the voice file was made at another level. The final mix is brought to -14 LUFS by scripts/finalize.mjs.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import { DUCK_DB, MUSIC_LUFS, OPEN_DB, VOICE_LUFS, musicFile, type Track } from "../music";
import { reelsMusic } from "../reelsMusic";
const RM = reelsMusic();

const db = (x: number) => Math.pow(10, x / 20);
const MERGE_GAP = 0.6; // pauses shorter than this keep the music ducked
const ATTACK = 0.12; // s: music goes down this long before a word
const RELEASE = 0.4; // s: and comes back up over this long after
const FADE_IN = 0.6;
const FADE_OUT = 1.2;

// Spoken intervals [start, end] in seconds, short pauses merged
export const speechSpans = (words: Caption[]) => {
  const spans: [number, number][] = [];
  for (const w of words) {
    const a = w.startMs / 1000, b = w.endMs / 1000;
    const last = spans[spans.length - 1];
    if (last && a - last[1] < MERGE_GAP) last[1] = Math.max(last[1], b);
    else spans.push([a, b]);
  }
  return spans;
};

// 1 = fully ducked, 0 = open
export const duckAmount = (t: number, spans: [number, number][]) => {
  let k = 0;
  for (const [a, b] of spans) {
    if (t >= a && t <= b) return 1;
    if (t < a) k = Math.max(k, 1 - (a - t) / ATTACK);
    else k = Math.max(k, 1 - (t - b) / RELEASE);
  }
  return Math.max(0, Math.min(1, k));
};

export const Soundtrack: React.FC<{
  voice: string; // file in public/
  words: Caption[]; // caption words of the voice (for ducking)
  track: Track;
  seconds: number; // episode length
  voiceLufs?: number;
  musicStart?: number; // s into the track
  mute?: "voice" | "music"; // for level checks only
  // "v2" (new episodes from 14 Nov 2026, owner: music a bit louder): ducked 15 dB under the voice instead of 19, and
  // 7 dB in pauses instead of 9. Left out = the old mix, so published episodes render exactly as before.
  mix?: "v2";
}> = ({ voice, words, track, seconds, voiceLufs = VOICE_LUFS, musicStart = 0, mute, mix }) => {
  const { fps } = useVideoConfig();
  const spans = useMemo(() => speechSpans(words), [words]);
  const voiceGain = db(VOICE_LUFS - voiceLufs);
  const duck = db(VOICE_LUFS - (mix === "v2" ? DUCK_DB - 4 : DUCK_DB) - MUSIC_LUFS), open = db(VOICE_LUFS - (mix === "v2" ? OPEN_DB - 2 : OPEN_DB) - MUSIC_LUFS);
  const musicVolume = (f: number) => {
    const t = f / fps;
    const fade = Math.min(
      interpolate(t, [0, FADE_IN], [0, 1], { extrapolateRight: "clamp" }),
      interpolate(t, [seconds - FADE_OUT, seconds], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    );
    const k = duckAmount(t, spans);
    return fade * (duck * k + open * (1 - k));
  };
  return (
    <>
      {mute !== "voice" && <Audio src={staticFile(voice)} volume={voiceGain} />}
      {mute !== "music" && <Audio src={staticFile(RM?.file ?? musicFile(track))} trimBefore={Math.round((RM ? RM.start : musicStart) * fps)} volume={musicVolume} />}
    </>
  );
};
