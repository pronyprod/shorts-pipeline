import { Easing } from "remotion";
import { templateOf } from "./theme.ts";
import type { Episode } from "./types";

export type LineTiming = { start: number; end: number };

export type Schedule = {
  lines: LineTiming[];
  // story time for every video frame
  story: number[];
  durationInFrames: number;
  // frame from which each rung's icon shows
  rungFrames: number[];
  // template 2: camera zoom per frame, as log2 of the diameter that fills CAMERA_BASE px
  camera: number[];
};

// Camera: follows log2(diameter) with a lag, so the drop visibly swells when
// the story races and the world then shrinks away as the camera catches up.
const CAMERA_TAU = 0.9; // seconds
export const MAX_SWELL = 1.6; // the drop never gets more than 1.6x its base size on screen

const DEFAULT_PAUSE = 0.35;
const ease = Easing.inOut(Easing.cubic);

// Lays the narration lines end to end (with their pauses) and works out where
// the story clock is on every frame: it races between lines and creeps during them.
export const buildSchedule = (ep: Episode, durations: number[], fps: number): Schedule => {
  const tpl = templateOf(ep);
  let cursor = tpl.leadIn;
  const lines = ep.lines.map((line, i) => {
    const start = cursor + (i === 0 ? 0 : (line.pause ?? DEFAULT_PAUSE));
    cursor = start + durations[i];
    return { start, end: cursor };
  });
  const durationInFrames = Math.ceil((cursor + tpl.tail) * fps);

  const keys: [number, number][] = [];
  ep.lines.forEach((line, i) => {
    keys.push([lines[i].start, line.t]);
    keys.push([lines[i].end, line.to ?? line.t]);
  });

  const storyAt = (sec: number) => {
    if (sec <= keys[0][0]) return keys[0][1];
    for (let k = 1; k < keys.length; k++) {
      const [s1, v1] = keys[k];
      if (sec <= s1) {
        const [s0, v0] = keys[k - 1];
        const p = s1 === s0 ? 1 : (sec - s0) / (s1 - s0);
        // even k = a pause between lines (race, eased); odd k = during a line (linear)
        return v0 + (v1 - v0) * (k % 2 === 0 ? ease(p) : p);
      }
    }
    return ep.endT;
  };

  const story = Array.from({ length: durationInFrames }, (_, f) => Math.min(ep.endT, storyAt(f / fps)));
  const rungFrames = ep.rungs.map((r) => {
    const f = story.findIndex((t) => t >= r.t - (r.lead ?? 0.5));
    return f === -1 ? durationInFrames : f;
  });
  const k = 1 - Math.exp(-1 / (CAMERA_TAU * fps));
  const camera: number[] = [];
  story.forEach((t, f) => {
    const target = Math.log2(ep.diameterAt(t));
    const prev = f === 0 ? target : camera[f - 1];
    camera.push(Math.min(target, Math.max(target - Math.log2(MAX_SWELL), prev + (target - prev) * k)));
  });
  return { lines, story, durationInFrames, rungFrames, camera };
};
