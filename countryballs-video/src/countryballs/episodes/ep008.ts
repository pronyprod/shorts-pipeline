import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep008: #14, #28, #7, #30 (reveal colours: yellow, light blue, red, green)
export const ep008: Episode = {
  id: "ep008",
  music: "ukulele-beach",
  layout: "low-child",
  rounds: [
    {
      parents: "sn",
      child: "ml",
      punchline: "I left my star at home.",
      childColor: "#ffff00",
      parentReaction: "disappointed",
      childReaction: "innocent",
    },
    {
      parents: "ar",
      child: "gt",
      punchline: "I traded the sun for a bird.",
      childColor: "#4997d0",
      parentReaction: "confused",
      childReaction: "smug",
    },
    {
      parents: "ru",
      child: "sk",
      punchline: "I got a badge.",
      childColor: "#ee1c25",
      parentReaction: "squint",
      childReaction: "proud",
    },
    {
      parents: "hu",
      child: "bg",
      punchline: "I shuffled my stripes.",
      childColor: "#00966e",
      parentReaction: "confused",
      childReaction: "innocent",
    },
  ],
};
