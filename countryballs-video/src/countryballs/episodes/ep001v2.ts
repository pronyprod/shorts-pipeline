import type { Episode } from "../types";

// Copy of ep001 with reactions and the low-child layout
export const ep001v2: Episode = {
  id: "ep001v2",
  template: 1, // made before the template polish; keeps rendering exactly as before
  music: "bubble-bath", // replaces the old generated loop (2026-10-31)
  layout: "low-child",
  rounds: [
    {
      parents: "jp",
      child: "bd",
      punchline: "I touched grass.",
      parentReaction: "shocked",
      childReaction: "proud",
    },
    {
      parents: "nl",
      child: "lu",
      punchline: "I turned the brightness up.",
      childColor: "#00a1de", // Luxembourg's light blue is the joke
      parentReaction: "squint",
      childReaction: "smug",
    },
    {
      parents: "it",
      child: "mx",
      punchline: "I got a tattoo.",
      childColor: "#006847", // Mexico's three stripes tie, so pick the green
      parentReaction: "disappointed",
      childReaction: "defiant",
    },
    {
      parents: "pl",
      child: "id",
      punchline: "I'm upside down.",
      parentReaction: "confused",
      childReaction: "innocent",
    },
  ],
};
