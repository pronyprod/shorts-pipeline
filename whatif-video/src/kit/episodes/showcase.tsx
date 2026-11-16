// KIT check: walks through all 8 places (B style) on Ep009's voice, to review the kit itself.
import { ep009 } from "../../whatif/episodes/ep009";
import voices from "../../whatif/episodes/ep009.voices.json";
import type { KitEp } from "../KitEpisode";

export const showcase: KitEp = {
  id: "showcase",
  style: "B",
  base: { episode: ep009, voices },
  beats: [
    { line: 0, place: "street", shot: "board", env: "day", pom: { expr: "neutral" }, falling: 0.4 },
    { line: 1, place: "city", shot: "wide", env: "sunset", pom: { expr: "shocked", pose: "pointUp" } },
    { line: 2, place: "ocean", shot: "board", env: "day", pom: { expr: "relieved" } },
    { line: 3, place: "space", shot: "medium", env: "space", pom: { expr: "scared", pose: "armsUp", float: true } },
    { line: 4, place: "desert", shot: "board", env: "day", pom: { expr: "neutral", pose: "hold" } },
    { line: 5, place: "lab", shot: "wide", env: "lab", pom: { expr: "shocked", outfit: "lab" } },
    { line: 6, place: "forest", shot: "board", env: "night", pom: { expr: "scared" } },
    { line: 7, place: "nightTown", shot: "wide", env: "night", pom: { expr: "relieved", pose: "armsUp" } },
  ],
};
