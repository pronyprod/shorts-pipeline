import type { FormatEpisodeData } from "../formats/types";

// FLAG_PAIR_BANK.md Ep011, size duel (reveal colours: red, green, red, green)
// Areas: Wikipedia "List of countries and dependencies by area", checked 2026-11-14.
export const ep011: FormatEpisodeData = {
  id: "ep011",
  music: "rainy-day-games",
  rounds: [
    {
      format: "size",
      a: { flag: "th", name: "Thailand", km2: 513120 },
      b: { flag: "es", name: "Spain", km2: 505370 },
      intro: "Thailand or Spain?",
      punchline: "By a whisker.",
      color: "#a51931",
      winnerReaction: "smug",
      loserReaction: "shocked",
    },
    {
      format: "size",
      a: { flag: "dz", name: "Algeria", km2: 2381741 },
      b: { flag: "gl", name: "Greenland", km2: 2166086 },
      intro: "Algeria or Greenland?",
      punchline: "Maps lied to you.",
      color: "#006233",
      winnerReaction: "proud",
      loserReaction: "confused",
    },
    {
      format: "size",
      a: { flag: "jp", name: "Japan", km2: 377915 },
      b: { flag: "de", name: "Germany", km2: 357581 },
      intro: "Japan or Germany?",
      punchline: "Long countries count too.",
      color: "#bc002d",
      winnerReaction: "innocent",
      loserReaction: "disappointed",
    },
    {
      format: "size",
      a: { flag: "br", name: "Brazil", km2: 8510346 },
      b: { flag: "au", name: "Australia", km2: 7741220 },
      intro: "Brazil or Australia?",
      punchline: "Sorry, mate. I'm bigger.",
      color: "#229e45",
      winnerReaction: "laughing",
      loserReaction: "crying",
    },
  ],
};
