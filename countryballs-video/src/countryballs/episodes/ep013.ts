import type { FormatEpisodeData } from "../formats/types";

// FLAG_PAIR_BANK.md Ep013, reverse quiz (reveal colours: light blue, red, green, blue)
export const ep013: FormatEpisodeData = {
  id: "ep013",
  music: "bubble-bath",
  rounds: [
    {
      format: "reverse",
      parents: "ar",
      child: "uy",
      punchline: "My sun moved upstairs.",
      color: "#74acdf",
      parentReaction: "proud",
      childReaction: "smug",
    },
    {
      format: "reverse",
      parents: "hu",
      child: "tj",
      punchline: "I got a crown.",
      color: "#d43516",
      parentReaction: "shocked",
      childReaction: "proud",
      childEyes: "down",
    },
    {
      format: "reverse",
      parents: "it",
      child: "hu",
      punchline: "I rolled over.",
      color: "#009246",
      parentReaction: "confused",
      childReaction: "innocent",
    },
    {
      format: "reverse",
      parents: "au",
      child: "fj",
      punchline: "I swapped stars for a shield.",
      color: "#00008b",
      parentReaction: "disappointed",
      childReaction: "defiant",
      parentEyes: "up",
      childEyes: "up",
    },
  ],
};
