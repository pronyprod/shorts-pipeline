import type { Episode } from "../types";

// Emergency evergreen episode, classic Flag Family (new pairs, SVG-checked): IT->MX, US->LR, NL->LU, ID->PL (reveal colours: green, red, blue, red)
export const ep024: Episode = {
  id: "ep024",
  music: "claudio-the-worm",
  layout: "low-child",
  rounds: [
    {
      parents: "it",
      child: "mx",
      punchline: "An eagle moved in.",
      childColor: "#006847",
      childEyes: "up",
      parentReaction: "shocked",
      childReaction: "proud",
    },
    {
      parents: "us",
      child: "lr",
      punchline: "I kept just one star.",
      childColor: "#bf0a30",
      parentReaction: "disappointed",
      childReaction: "defiant",
    },
    {
      parents: "nl",
      child: "lu",
      punchline: "My blue is lighter.",
      childColor: "#00a1de",
      parentReaction: "squint",
      childReaction: "innocent",
    },
    {
      parents: "id",
      child: "pl",
      punchline: "I flipped upside down.",
      childColor: "#dc143c",
      parentReaction: "confused",
      childReaction: "smug",
    },
  ],
};
