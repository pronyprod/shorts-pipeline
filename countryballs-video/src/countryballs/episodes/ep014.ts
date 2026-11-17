import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep014, twins (reveal colours: red, blue, yellow, green)
export const ep014: Episode = {
  id: "ep014",
  music: "ukulele-beach",
  layout: "low-child",
  rounds: [
    {
      parents: "dk",
      child: "ch",
      punchline: "I centred myself.",
      childColor: "#ff0000",
      parentReaction: "squint",
      childReaction: "proud",
    },
    {
      parents: "th",
      child: "cr",
      punchline: "I turned inside out.",
      childColor: "#0000b4",
      parentReaction: "confused",
      childReaction: "innocent",
    },
    {
      parents: "co",
      child: "ve",
      punchline: "I added eight stars.",
      childColor: "#ffcc00",
      parentReaction: "proud",
      childReaction: "smug",
    },
    {
      parents: "kw",
      child: "ae",
      punchline: "We swapped black and red.",
      childColor: "#00732f",
      parentReaction: "laughing",
      childReaction: "laughing",
    },
  ],
};
