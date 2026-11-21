import type { FormatEpisodeData } from "../formats/types";

// FLAG_PAIR_BANK.md Ep016, words in different languages (reveal colours: blue, gold, red, green)
// Meanings checked on Wiktionary 2026-11-21 (see Ep016.md).
export const ep016: FormatEpisodeData = {
  id: "ep016",
  music: "at-the-fair",
  rounds: [
    {
      format: "words",
      word: "Potato",
      intro: "The word is potato.",
      entries: [
        { flag: "fr", word: "pomme de terre" },
        { flag: "nl", word: "aardappel" },
        { flag: "de", word: "Kartoffel" },
        { flag: "es", word: "patata" },
      ],
      punchline: "France: earth apple.",
      color: "#0055a4",
    },
    {
      format: "words",
      word: "Raccoon",
      intro: "The word is raccoon.",
      entries: [
        { flag: "de", word: "Waschbär" },
        { flag: "fr", word: "raton laveur" },
        { flag: "es", word: "mapache" },
        { flag: "it", word: "procione" },
      ],
      punchline: "Germany: wash bear.",
      color: "#ffce00",
    },
    {
      format: "words",
      word: "Bat",
      intro: "The word is bat.",
      entries: [
        { flag: "de", word: "Fledermaus" },
        { flag: "fr", word: "chauve-souris" },
        { flag: "es", word: "murciélago" },
        { flag: "it", word: "pipistrello" },
      ],
      punchline: "France: a bald mouse.",
      color: "#ef4135",
    },
    {
      format: "words",
      word: "Penguin",
      intro: "The word is penguin.",
      entries: [
        { flag: "de", word: "Pinguin" },
        { flag: "es", word: "pingüino" },
        { flag: "it", word: "pinguino" },
        { flag: "fr", word: "manchot" },
      ],
      punchline: "France had to be different.",
      color: "#009246",
    },
  ],
};
