import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep004: #25, #11, #1, #22 (reordered so reveal colours
// alternate: green, orange, blue, red)
export const ep004: Episode = {
  id: "ep004",
  music: "at-the-fair",
  layout: "low-child",
  rounds: [
    {
      parents: "at",
      child: "lb",
      punchline: "I planted a tree.",
      childColor: "#00a850", // the cedar's green
      parentReaction: "proud",
      childReaction: "proud",
    },
    {
      parents: "it",
      child: "ie",
      punchline: "I prefer carrots.",
      childColor: "#ff7900",
      parentReaction: "disappointed",
      childReaction: "defiant",
    },
    {
      parents: "td",
      child: "ro",
      // bank's alternative: the main line ("Same flag. Different passport.")
      // was too long for a big caption
      punchline: "I'm the bright one.",
      childColor: "#00319c",
      parentReaction: "confused",
      childReaction: "smug",
    },
    {
      parents: "id",
      child: "sg",
      punchline: "I got a moon and stars.",
      childColor: "#df0000",
      parentReaction: "proud",
      childReaction: "proud",
    },
  ],
};
