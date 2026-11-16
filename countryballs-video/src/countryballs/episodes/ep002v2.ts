import type { Episode } from "../types";

// Copy of ep002 (FLAG_PAIR_BANK.md #8, #12, #23, #20) on the latest template
export const ep002v2: Episode = {
  id: "ep002v2",
  music: "ukulele-beach", // same episode as ep002, same track
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
