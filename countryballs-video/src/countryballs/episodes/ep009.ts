import type { FormatEpisodeData } from "../formats/types";

// FLAG_PAIR_BANK.md Ep009, reverse quiz (reveal colours: red, green, yellow, red)
export const ep009: FormatEpisodeData = {
  id: "ep009",
  music: "sand-castle",
  rounds: [
    {
      format: "reverse",
      parents: "us",
      child: "lr",
      punchline: "I kept one star.",
      color: "#bd3d44",
      parentReaction: "shocked",
      childReaction: "proud",
    },
    {
      format: "reverse",
      parents: "bo",
      child: "lt",
      punchline: "I left my shield behind.",
      color: "#007934",
      parentReaction: "disappointed",
      childReaction: "innocent",
      parentEyes: "up",
    },
    {
      format: "reverse",
      parents: "gh",
      child: "sn",
      punchline: "I turned sideways.",
      color: "#fcd116",
      parentReaction: "confused",
      childReaction: "smug",
      parentEyes: "up",
    },
    {
      format: "reverse",
      parents: "jp",
      child: "la",
      punchline: "My sun turned white.",
      color: "#bc002d",
      parentReaction: "squint",
      childReaction: "defiant",
      parentEyes: "up",
      childEyes: "up",
    },
  ],
};
