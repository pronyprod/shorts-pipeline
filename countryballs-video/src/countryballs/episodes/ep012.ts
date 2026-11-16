import type { FormatEpisodeData } from "../formats/types";

// FLAG_PAIR_BANK.md Ep012, words in different languages (reveal colours: gold, red, blue, green)
// Meanings checked on Wiktionary 2026-11-16 (see Ep012.md).
export const ep012: FormatEpisodeData = {
  id: "ep012",
  music: "claudio-the-worm",
  rounds: [
    {
      format: "words",
      word: "Glove",
      intro: "The word is glove.",
      entries: [
        { flag: "de", word: "Handschuh" },
        { flag: "nl", word: "handschoen" },
        { flag: "fr", word: "gant" },
        { flag: "es", word: "guante" },
      ],
      punchline: "Germany: hand shoes.",
      color: "#ffce00",
    },
    {
      format: "words",
      word: "Turkey",
      intro: "The word is turkey.",
      entries: [
        { flag: "pt", word: "peru" },
        { flag: "tr", word: "hindi" },
        { flag: "fr", word: "dinde" },
        { flag: "es", word: "pavo" },
      ],
      punchline: "Turkey blames India.",
      color: "#e30a17",
    },
    {
      format: "words",
      word: "Jellyfish",
      intro: "The word is jellyfish.",
      entries: [
        { flag: "de", word: "Qualle" },
        { flag: "es", word: "medusa" },
        { flag: "fr", word: "méduse" },
        { flag: "it", word: "medusa" },
      ],
      punchline: "Don't look at it.",
      color: "#0055a4",
    },
    {
      format: "words",
      word: "Sloth",
      intro: "The word is sloth.",
      entries: [
        { flag: "de", word: "Faultier" },
        { flag: "es", word: "perezoso" },
        { flag: "fr", word: "paresseux" },
        { flag: "pt", word: "preguiça" },
      ],
      punchline: "Everyone agrees: it's lazy.",
      color: "#006600",
    },
  ],
};
