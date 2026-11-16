// Episode 1, version 3: same script, facts and look as ep001v2, re-voiced with the
// Gemini narrator (Puck) and on template 3 (rotating library music with a build
// lined up with the climax, ducked under the voice).
import type { Episode } from "../types";
import { ep001v2 } from "./ep001v2.ts";

export const ep001v3: Episode = {
  ...ep001v2,
  id: "ep001v3",
  template: 3,
};
