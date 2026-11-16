import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep006: #13, #5, #29, #16 (reveal colours: red, yellow, light blue, yellow)
export const ep006: Episode = {
  id: "ep006",
  music: "claudio-the-worm",
  layout: "low-child",
  rounds: [
    {
      parents: "jp",
      child: "gl",
      punchline: "I'm half and half.",
      childColor: "#d00c33",
      parentReaction: "confused",
      childReaction: "innocent",
    },
    {
      parents: "de",
      child: "be",
      punchline: "I stood up.",
      childColor: "#ffd90c",
      parentReaction: "shocked",
      childReaction: "proud",
    },
    {
      parents: "ar",
      child: "hn",
      punchline: "I traded the sun for stars.",
      childColor: "#18c3df",
      parentReaction: "disappointed",
      childReaction: "defiant",
      childEyes: "up", // the punchline is about Honduras's central stars
    },
    {
      parents: "ro",
      child: "md",
      punchline: "A bird landed on me.",
      childColor: "#ffde00",
      parentReaction: "shocked",
      childReaction: "proud",
    },
  ],
};
