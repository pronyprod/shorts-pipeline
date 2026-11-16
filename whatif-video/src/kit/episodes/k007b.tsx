// KIT TEST (B): Ep007 "What if the Moon vanished for exactly one day?" in style B.
// Same script, voice, numbers and music as the published Ep007; only the visuals are the kit's.
import { ep007, RETURN_T, VANISH_T } from "../../whatif/episodes/ep007";
import voices from "../../whatif/episodes/ep007.voices.json";
import type { KitEp } from "../KitEpisode";

export const k007b: KitEp = {
  id: "k007b",
  style: "B",
  base: { episode: ep007, voices },
  beats: [
    { line: 0, place: "nightTown", shot: "wide", env: "night", pom: { expr: "neutral", pose: "pointUp" } },
    { line: 1, place: "nightTown", shot: "medium", pom: { expr: "shocked" } },
    { line: 2, place: "space", shot: "wide", env: "space", nudge: { look: [2, 0, 0] } },
    { line: 3, place: "nightTown", shot: "low", env: "night", pom: { expr: "scared" } },
    { line: 4, place: "forest", shot: "high", pom: { expr: "relieved" } },
    { line: 5, place: "ocean", shot: "board", env: "sunset", pom: { expr: "neutral", pose: "pointUp" } },
    { line: 6, place: "ocean", shot: "medium", pom: { expr: "shocked" } },
    { line: 7, place: "ocean", shot: "wide", env: "day", pom: { expr: "relieved" } },
    { line: 8, place: "space", shot: "far", env: "space", nudge: { look: [-3, 0, 0] } },
    { line: 9, place: "ocean", shot: "low", env: "sunset", pom: { expr: "relieved" } },
    { line: 10, place: "space", shot: "wide", env: "space" },
    { line: 11, place: "space", shot: "far" },
    { line: 12, place: "space", shot: "medium", pom: { expr: "scared", pose: "armsUp", float: true } },
    { line: 13, place: "city", shot: "board", env: "day", pom: { expr: "neutral", at: [-1.5, 0, 3.4], to: [2.0, 0, 3.4] } },
    { line: 14, place: "nightTown", shot: "wide", env: "night", pom: { expr: "relieved", pose: "armsUp" } },
    { line: 15, place: "nightTown", shot: "medium", pom: { expr: "neutral", pose: "pointUp" } },
  ],
  // the Moon is in the sky until its light runs out, and again once it pops back
  moon: (c) => (c.t < VANISH_T || c.t >= RETURN_T ? 1 : 0),
  opts: (c) => ({
    space: {
      moon: c.t < VANISH_T ? 1 : c.beat === 10 ? 0.35 : 0,
      orbit: c.beat >= 10 && c.beat <= 12 ? 1 : 0,
      earthShift: c.beat === 11 ? c.p * 2.5 : c.beat === 12 ? 2.5 : 0,
    },
    ocean: { tide: c.beat >= 6 ? -0.22 : 0, waves: c.beat >= 6 ? 0.5 : 1 },
  }),
};
