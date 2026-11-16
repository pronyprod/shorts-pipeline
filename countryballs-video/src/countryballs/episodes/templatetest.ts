import type { Episode } from "../types";

// One-round test of the latest template (loudness + caption pill).
// Striped flags with light rays: the hardest background for captions.
export const templatetest: Episode = {
  id: "templatetest",
  layout: "low-child",
  rounds: [
    {
      parents: "nl",
      child: "lu",
      punchline: "I turned the brightness up.",
      childColor: "#00a1de",
      parentReaction: "squint",
      childReaction: "smug",
    },
  ],
};
