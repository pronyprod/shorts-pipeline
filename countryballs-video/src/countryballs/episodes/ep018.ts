import type { FormatEpisodeData } from "../formats/types";

// Series Part 2 of 2: "Size duel tournament" (FLAG_PAIR_BANK.md, Series). Ep017 = four duels, Ep018 = semi-finals, 3rd place, final.
// Areas: Wikipedia "List of countries and dependencies by area", checked 2026-11-21.
// Reveal colours: yellow (Chad), red (Peru), orange (Niger), red (Peru)
export const ep018: FormatEpisodeData = {
  id: "ep018",
  music: "claudio-the-worm",
  rounds: [
    {
      format: "size",
      a: { flag: "td", name: "Chad", km2: 1284000 },
      b: { flag: "ne", name: "Niger", km2: 1267000 },
      intro: "Yesterday: four winners. Chad or Niger?",
      punchline: "Just a little bigger.",
      color: "#fecb00",
      winnerReaction: "smug",
      loserReaction: "confused",
    },
    {
      format: "size",
      a: { flag: "ao", name: "Angola", km2: 1246700 },
      b: { flag: "pe", name: "Peru", km2: 1285216 },
      intro: "Angola or Peru?",
      punchline: "Bigger. Not by much.",
      color: "#d91023",
      winnerReaction: "proud",
      loserReaction: "shocked",
    },
    {
      format: "size",
      a: { flag: "ne", name: "Niger", km2: 1267000 },
      b: { flag: "ao", name: "Angola", km2: 1246700 },
      intro: "Third place: Niger or Angola?",
      punchline: "Bronze for me.",
      color: "#e05206",
      winnerReaction: "innocent",
      loserReaction: "disappointed",
    },
    {
      format: "size",
      a: { flag: "td", name: "Chad", km2: 1284000 },
      b: { flag: "pe", name: "Peru", km2: 1285216 },
      intro: "The final: Chad or Peru?",
      punchline: "Biggest. Barely.",
      color: "#d91023",
      winnerReaction: "laughing",
      loserReaction: "crying",
    },
  ],
};
