import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep023, classic Flag Family: #35 ML->GH, #36 SE->FI, #17 RO->AD, #37 AR->NI (reveal colours: red, blue, yellow, blue)
export const ep023: Episode = {
  id: "ep023",
  music: "rainy-day-games",
  layout: "low-child",
  rounds: [
    {
      parents: "ml",
      child: "gh",
      punchline: "I lay down and got a star.",
      childColor: "#ce1126",
      childEyes: "up",
      parentReaction: "confused",
      childReaction: "smug",
    },
    {
      parents: "se",
      child: "fi",
      punchline: "I swapped my colors.",
      childColor: "#002f6c",
      parentReaction: "shocked",
      childReaction: "innocent",
    },
    {
      parents: "ro",
      child: "ad",
      punchline: "I got a shield.",
      childColor: "#fedf00",
      childEyes: "up",
      parentReaction: "proud",
      childReaction: "smug",
    },
    {
      parents: "ar",
      child: "ni",
      punchline: "I traded the sun for a triangle.",
      childColor: "#0067c6",
      childEyes: "up",
      parentReaction: "disappointed",
      childReaction: "defiant",
    },
  ],
};
