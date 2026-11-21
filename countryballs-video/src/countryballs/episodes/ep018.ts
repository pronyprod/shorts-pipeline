import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep018, twins (reveal colours: blue, red, green, dark blue)
export const ep018: Episode = {
  id: "ep018",
  music: "claudio-the-worm",
  layout: "low-child",
  rounds: [
    {
      parents: "no",
      child: "fo",
      punchline: "I painted the walls white.",
      childColor: "#003897",
      parentReaction: "disappointed",
      childReaction: "innocent",
    },
    {
      parents: "pl",
      child: "mc",
      punchline: "I'm upside down.",
      childColor: "#f31830",
      parentReaction: "confused",
      childReaction: "defiant",
    },
    {
      parents: "bo",
      child: "gh",
      punchline: "My shield became a star.",
      childColor: "#006b3f",
      parentReaction: "shocked",
      childReaction: "proud",
      parentEyes: "up",
      childEyes: "up",
    },
    {
      parents: "us",
      child: "my",
      punchline: "I traded stars for a moon.",
      childColor: "#000066",
      parentReaction: "squint",
      childReaction: "smug",
    },
  ],
};
