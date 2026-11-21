import type { FormatEpisodeData } from "../formats/types";

// Series Part 1 of 2: "Size duel tournament" (FLAG_PAIR_BANK.md, Series). Ep018 = semi-finals, 3rd place, final.
// Areas: Wikipedia "List of countries and dependencies by area", checked 2026-11-21.
// Reveal colours: red, yellow, orange, red (Peru, Chad, Niger, Angola)
export const ep017: FormatEpisodeData = {
  id: "ep017",
  music: "rainy-day-games",
  rounds: [
    {
      format: "size",
      a: { flag: "pe", name: "Peru", km2: 1285216 },
      b: { flag: "co", name: "Colombia", km2: 1138910 },
      intro: "Peru or Colombia?",
      punchline: "Bigger than you think.",
      color: "#d91023",
      winnerReaction: "proud",
      loserReaction: "shocked",
    },
    {
      format: "size",
      a: { flag: "td", name: "Chad", km2: 1284000 },
      b: { flag: "et", name: "Ethiopia", km2: 1104300 },
      intro: "Chad or Ethiopia?",
      punchline: "Sand counts too.",
      color: "#fecb00",
      winnerReaction: "smug",
      loserReaction: "confused",
    },
    {
      format: "size",
      a: { flag: "ne", name: "Niger", km2: 1267000 },
      b: { flag: "za", name: "South Africa", km2: 1219090 },
      intro: "Niger or South Africa?",
      punchline: "Small gap. Big win.",
      color: "#e05206",
      winnerReaction: "innocent",
      loserReaction: "disappointed",
    },
    {
      format: "size",
      a: { flag: "ao", name: "Angola", km2: 1246700 },
      b: { flag: "ml", name: "Mali", km2: 1240192 },
      intro: "Angola or Mali?",
      punchline: "Part 2 tomorrow.",
      color: "#cc092f",
      winnerReaction: "laughing",
      loserReaction: "crying",
    },
  ],
};
