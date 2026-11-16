import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep010, twins (reveal colours: blue, red, blue, red)
// Timely slot: round 2 (Qatar hosted the MotoGP Qatar GP 6-8 Nov 2026, F1 Qatar GP 27-29 Nov 2026)
export const ep010: Episode = {
  id: "ep010",
  music: "at-the-fair",
  layout: "low-child",
  rounds: [
    {
      parents: "ni",
      child: "sv",
      punchline: "Same flag. Darker jeans.",
      childColor: "#0f47af",
      parentReaction: "squint",
      childReaction: "smug",
      parentEyes: "up",
      childEyes: "up",
    },
    {
      parents: "qa",
      child: "bh",
      punchline: "I'm just less pointy.",
      childColor: "#ce1126",
      parentReaction: "confused",
      childReaction: "innocent",
    },
    {
      parents: "gr",
      child: "uy",
      punchline: "Same stripes. Better weather.",
      childColor: "#0038a8",
      parentReaction: "disappointed",
      childReaction: "defiant",
      parentEyes: "down",
      childEyes: "down",
    },
    {
      parents: "si",
      child: "sk",
      punchline: "My shield hit the gym.",
      childColor: "#ee1c25",
      parentReaction: "shocked",
      childReaction: "proud",
    },
  ],
};
