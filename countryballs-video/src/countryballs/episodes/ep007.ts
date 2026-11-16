import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep007: #21, #4, #15, #26 (reveal colours: blue, maroon, green, red)
export const ep007: Episode = {
  id: "ep007",
  music: "bubble-bath",
  layout: "low-child",
  rounds: [
    {
      parents: "li",
      child: "ht",
      punchline: "We matched at the Olympics.",
      childColor: "#0a328c",
      parentReaction: "laughing",
      childReaction: "laughing",
    },
    {
      parents: "at",
      child: "lv",
      punchline: "My white stripe went on a diet.",
      childColor: "#981e32",
      parentReaction: "squint",
      childReaction: "proud",
    },
    {
      parents: "ml",
      child: "gn",
      punchline: "I walk backwards.",
      childColor: "#009900",
      parentReaction: "confused",
      childReaction: "smug",
    },
    {
      parents: "pe",
      child: "ca",
      punchline: "I grew a leaf.",
      childColor: "#d52b1e",
      parentReaction: "shocked",
      childReaction: "innocent",
    },
  ],
};
