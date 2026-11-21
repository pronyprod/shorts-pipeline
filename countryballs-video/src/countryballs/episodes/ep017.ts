import type { FormatEpisodeData } from "../formats/types";

// FLAG_PAIR_BANK.md Ep017, reverse quiz (reveal colours: red, green, yellow, blue)
export const ep017: FormatEpisodeData = {
  id: "ep017",
  music: "rainy-day-games",
  rounds: [
    {
      format: "reverse",
      parents: "bo",
      child: "et",
      punchline: "I got a blue badge.",
      color: "#d52b1e",
      parentReaction: "shocked",
      childReaction: "proud",
      parentEyes: "up",
      childEyes: "up",
    },
    {
      format: "reverse",
      parents: "ml",
      child: "cm",
      punchline: "I found a star.",
      color: "#009a00",
      parentReaction: "proud",
      childReaction: "innocent",
      childEyes: "up",
    },
    {
      format: "reverse",
      parents: "ec",
      child: "ve",
      punchline: "I swapped birds for stars.",
      color: "#ffe800",
      parentReaction: "confused",
      childReaction: "smug",
      parentEyes: "down",
      childEyes: "down",
    },
    {
      format: "reverse",
      parents: "se",
      child: "ax",
      punchline: "Red joined my cross.",
      color: "#005293",
      parentReaction: "squint",
      childReaction: "defiant",
    },
  ],
};
