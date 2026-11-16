// Template 3 music: one library track per episode (rotating), started at an offset so
// its biggest build lands on the episode's climax, and ducked under the narration.
// Used by the video (WhatIfEpisode) and by scripts/credits.mjs, so both always agree.
import { MUSIC_LIBRARY } from "./musicLibrary.ts";
import type { LineTiming } from "./timing";
import type { Episode } from "./types";

type Track = (typeof MUSIC_LIBRARY)[number];

// Episode number from its id ("ep001v3" -> 1). All versions of an episode share a track;
// consecutive episodes never get the same one (7 tracks in a fixed rotation).
export const episodeNumber = (ep: Episode) => Number(/^ep(\d+)/.exec(ep.id)?.[1] ?? 1);
export const trackForEpisode = (n: number): Track => MUSIC_LIBRARY[(n - 1) % MUSIC_LIBRARY.length];

// Mix levels in dB relative to the voice (music copies are normalised to the same
// loudness as each narration line, -16.8 LUFS).
export const DUCK_UNDER_VOICE_DB = -19; // while someone is talking
export const GAP_DB = -13; // between lines, so the music breathes
export const MIX_BUILD_DB = -4; // extra cut before the climax when the track can't build there itself
const ATTACK = 0.15; // music dips this long before a line starts
const RELEASE = 0.4; // and comes back up over this long after it ends
const FADE_OUT_EXTRA = 1.0; // keep this much track after the video ends

export type MusicPlan = {
  track: Track;
  // seconds into the track at which the video starts
  offset: number;
  climaxSec: number;
  // "track build": the track's own rise lands on the climax.
  // "early build": the track only rises near its start, so the video opens on a full-level
  //   section from later in the track (`intro`), then cross-fades into the track's start at
  //   `switchSec`, timed so the rise lands on the climax.
  // "mix build": no usable rise at all; the mix holds the music lower before the climax and lifts it there.
  mode: "track build" | "early build" | "mix build";
  build: { t: number; rise: number } | null;
  // early build only: video second of the switch, and the track second the opening section starts at
  switchSec?: number;
  introOffset?: number;
};

const SWITCH_FADE = 1.5; // the opening section fades out over this long, ending as the track's start begins

export const climaxSecOf = (ep: Episode, lines: LineTiming[]) => {
  const i = ep.lines.findIndex((l) => l.beat === "climax");
  return i === -1 ? lines[Math.floor(lines.length * 0.75)].start : lines[i].start;
};

export const planMusic = (ep: Episode, lines: LineTiming[], videoSec: number): MusicPlan => {
  const track = trackForEpisode(episodeNumber(ep));
  const climaxSec = climaxSecOf(ep, lines);
  // biggest build that can sit on the climax with enough track left for the rest of the video
  const build = track.builds.find((b) => b.t >= climaxSec && b.t - climaxSec + videoSec + FADE_OUT_EXTRA <= track.duration);
  if (build) return { track, offset: build.t - climaxSec, climaxSec, mode: "track build", build };
  // biggest rise that comes before the climax and still leaves enough track for the rest of the video
  const early = [...track.builds, ...("introBuild" in track && track.introBuild ? [track.introBuild] : [])]
    .filter((b) => b.t <= climaxSec && b.t + (videoSec - climaxSec) + FADE_OUT_EXTRA <= track.duration)
    .sort((a, b) => b.rise - a.rise)[0];
  if (early) {
    const switchSec = climaxSec - early.t;
    // the opening plays a full-level stretch from after the rise
    const introOffset = Math.min(early.t + 10, Math.max(0, track.duration - switchSec - SWITCH_FADE - 1));
    return { track, offset: 0, climaxSec, mode: "early build", build: early, switchSec, introOffset };
  }
  return { track, offset: 0, climaxSec, mode: "mix build", build: null };
};

// Music sections to play: [{ videoStart, trackOffset, gain(sec) }]. One section, except for
// "early build" (opening section + the track from its start, cross-faded).
export const musicSections = (plan: MusicPlan) => {
  if (plan.mode !== "early build" || plan.switchSec === undefined) return [{ videoStart: 0, trackOffset: plan.offset, fade: () => 1 }];
  const sw = plan.switchSec;
  return [
    { videoStart: 0, trackOffset: plan.introOffset ?? 0, fade: (sec: number) => Math.min(1, Math.max(0, (sw - sec) / SWITCH_FADE)) },
    { videoStart: sw, trackOffset: 0, fade: () => 1 },
  ];
};

// Music gain (linear) at a given second of the video
export const musicGain = (sec: number, plan: MusicPlan, lines: LineTiming[], videoSec: number, fadeIn: number, fadeOut: number) => {
  let talk = 0;
  for (const l of lines) {
    const up = Math.min(1, Math.max(0, (sec - (l.start - ATTACK)) / ATTACK));
    const down = Math.min(1, Math.max(0, (l.end + RELEASE - sec) / RELEASE));
    talk = Math.max(talk, Math.min(up, down));
  }
  let db = GAP_DB + (DUCK_UNDER_VOICE_DB - GAP_DB) * talk;
  if (plan.mode === "mix build") db += MIX_BUILD_DB * Math.min(1, Math.max(0, (plan.climaxSec - sec) / 2));
  const fade = Math.min(1, sec / Math.max(0.01, fadeIn), (videoSec - sec) / Math.max(0.01, fadeOut));
  return 10 ** (db / 20) * Math.max(0, fade);
};
