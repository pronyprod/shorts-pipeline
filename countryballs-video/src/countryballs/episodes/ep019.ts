import type { FormatEpisodeData } from "../formats/types";

// FLAG_PAIR_BANK.md Ep019, size duel
// Areas: Wikipedia "List of countries and dependencies by area", checked 2026-11-22.
// Reveal colours: light blue, blue, red, green
export const ep019: FormatEpisodeData = {
  id: "ep019",
  music: "bubble-bath",
  rounds: [
    {
      format: "size",
      a: { flag: "ar", name: "Argentina", km2: 2780400 },
      b: { flag: "kz", name: "Kazakhstan", km2: 2724910 },
      intro: "Argentina or Kazakhstan?",
      punchline: "Close, but it's mine.",
      color: "#74acdf",
      winnerReaction: "proud",
      loserReaction: "disappointed",
    },
    {
      format: "size",
      a: { flag: "cu", name: "Cuba", km2: 109884 },
      b: { flag: "is", name: "Iceland", km2: 103000 },
      intro: "Cuba or Iceland?",
      punchline: "Warmer and bigger.",
      color: "#002a8f",
      winnerReaction: "smug",
      loserReaction: "shocked",
    },
    {
      format: "size",
      a: { flag: "tr", name: "Turkey", km2: 783562 },
      b: { flag: "cl", name: "Chile", km2: 756102 },
      intro: "Turkey or Chile?",
      punchline: "You're just very long.",
      color: "#e30a17",
      winnerReaction: "innocent",
      loserReaction: "confused",
    },
    {
      format: "size",
      a: { flag: "mg", name: "Madagascar", km2: 587041 },
      b: { flag: "ke", name: "Kenya", km2: 580367 },
      intro: "Madagascar or Kenya?",
      punchline: "An island beat you.",
      color: "#007e3a",
      winnerReaction: "laughing",
      loserReaction: "crying",
    },
  ],
};
