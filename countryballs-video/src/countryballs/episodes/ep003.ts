import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep003: #3, #10, #27, #19 (reordered so reveal colours
// alternate: red, blue, orange, yellow)
export const ep003: Episode = {
  id: "ep003",
  music: "sand-castle",
  layout: "low-child",
  rounds: [
    {
      parents: "id",
      child: "mc",
      punchline: "Same flag. More money.",
      childColor: "#f31830",
      parentReaction: "shocked",
      childReaction: "smug",
    },
    {
      parents: "fr",
      child: "nl",
      punchline: "I lay down.",
      childColor: "#21468b",
      parentReaction: "confused",
      childReaction: "defiant",
    },
    {
      parents: "in",
      child: "ne",
      punchline: "My wheel became an orange.",
      childColor: "#e05206",
      parentReaction: "disappointed",
      childReaction: "innocent",
    },
    {
      parents: "co",
      child: "ec",
      punchline: "A condor adopted me.",
      childColor: "#ffe800",
      parentReaction: "shocked",
      childReaction: "proud",
    },
  ],
};
