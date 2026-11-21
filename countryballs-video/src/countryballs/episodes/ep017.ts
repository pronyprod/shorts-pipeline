import type { FormatEpisodeData } from "../formats/types";

// Series Part 1 of 2 "Biggest of four" (size duel quarter-finals). Part 2 (Ep018): the four winners meet.
// Areas: Wikipedia "List of countries and dependencies by area", checked 2026-11-21 (see Ep017.md).
// Reveal colours: red, yellow, green, red
export const ep017: FormatEpisodeData = {
  id: "ep017",
  music: "ukulele-beach",
  rounds: [
    {
      format: "size",
      a: { flag: "pe", name: "Peru", km2: 1285216 },
      b: { flag: "ne", name: "Niger", km2: 1267000 },
      intro: "Peru or Niger?",
      punchline: "I'm bigger. Barely.",
      color: "#d91023",
      winnerReaction: "proud",
      loserReaction: "shocked",
    },
    {
      format: "size",
      a: { flag: "co", name: "Colombia", km2: 1138910 },
      b: { flag: "et", name: "Ethiopia", km2: 1104300 },
      intro: "Colombia or Ethiopia?",
      punchline: "Bigger and caffeinated.",
      color: "#fcd116",
      winnerReaction: "smug",
      loserReaction: "disappointed",
    },
    {
      format: "size",
      a: { flag: "tz", name: "Tanzania", km2: 947303 },
      b: { flag: "ng", name: "Nigeria", km2: 923768 },
      intro: "Tanzania or Nigeria?",
      punchline: "More room for lions.",
      color: "#1eb53a",
      winnerReaction: "innocent",
      loserReaction: "confused",
    },
    {
      format: "size",
      a: { flag: "ao", name: "Angola", km2: 1246700 },
      b: { flag: "ml", name: "Mali", km2: 1240192 },
      intro: "Angola or Mali?",
      punchline: "Who's biggest? Part 2 tomorrow.",
      color: "#cc092f",
      winnerReaction: "defiant",
      loserReaction: "crying",
    },
  ],
};
