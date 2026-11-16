import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep005: #2, #6, #24, #18 (reveal colours: orange, blue, red, blue)
export const ep005: Episode = {
  id: "ep005",
  music: "rainy-day-games",
  layout: "low-child",
  rounds: [
    {
      parents: "ie",
      child: "ci",
      punchline: "I'm facing the other way.",
      childColor: "#ff8200",
      parentReaction: "confused",
      childReaction: "innocent",
    },
    {
      parents: "ru",
      child: "si",
      punchline: "I climbed a mountain.",
      childColor: "#0000bf",
      parentReaction: "proud",
      childReaction: "smug",
    },
    {
      parents: "ye",
      child: "eg",
      punchline: "An eagle sat on me.",
      childColor: "#ce1126",
      parentReaction: "shocked",
      childReaction: "proud",
    },
    {
      parents: "au",
      child: "nz",
      punchline: "I like red stars.",
      childColor: "#012169",
      parentReaction: "confused",
      childReaction: "defiant",
    },
  ],
};
