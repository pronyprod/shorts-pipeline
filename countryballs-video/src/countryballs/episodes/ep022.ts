import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep022, twins (reveal colours: blue, red, orange, blue)
export const ep022: Episode = {
  id: "ep022",
  music: "at-the-fair",
  layout: "low-child",
  rounds: [
    {
      parents: "pl",
      child: "cz",
      punchline: "I added a blue wedge.",
      childColor: "#11457e",
      parentReaction: "confused",
      childReaction: "proud",
    },
    {
      parents: "ch",
      child: "to",
      punchline: "I put my cross in a box.",
      childColor: "#c10000",
      parentReaction: "shocked",
      childReaction: "innocent",
    },
    {
      parents: "ie",
      child: "in",
      punchline: "I lay down and got a wheel.",
      childColor: "#ff9933",
      parentReaction: "squint",
      childReaction: "smug",
      childEyes: "up",
    },
    {
      parents: "cl",
      child: "cu",
      punchline: "I traded a square for stripes.",
      childColor: "#002a8f",
      parentReaction: "disappointed",
      childReaction: "defiant",
    },
  ],
};
