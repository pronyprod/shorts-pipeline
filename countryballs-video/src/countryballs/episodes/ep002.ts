import type { Episode } from "../types";

// Rounds from FLAG_PAIR_BANK.md: #8, #12, #23, #20
export const ep002: Episode = {
  id: "ep002",
  template: 2, // published on template 2; keeps rendering exactly as before
  music: "ukulele-beach",
  layout: "low-child",
  rounds: [
    {
      parents: "nl",
      child: "hr",
      punchline: "I learned chess.",
      childColor: "#ff0000", // Croatia's red and blue stripes tie, so pick the red
      parentReaction: "confused",
      childReaction: "smug",
    },
    {
      parents: "jp",
      child: "pw",
      punchline: "I moved to the beach.",
      parentReaction: "shocked",
      childReaction: "proud",
    },
    {
      parents: "tr",
      child: "tn",
      punchline: "I put mine in a circle.",
      parentReaction: "confused",
      childReaction: "innocent",
    },
    {
      parents: "no",
      child: "is",
      punchline: "Same cross. Colder.",
      parentReaction: "squint",
      childReaction: "proud",
    },
  ],
};
