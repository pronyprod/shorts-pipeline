import type { FormatEpisodeData } from "../formats/types";

// FLAG_PAIR_BANK.md Ep020, words in different languages (reveal colours: gold, green, red, blue)
// Timely round: Pumpkin (Thanksgiving, Thursday 26 Nov 2026). Meanings checked on Wiktionary 2026-11-24 (see Ep020.md).
export const ep020: FormatEpisodeData = {
  id: "ep020",
  music: "ukulele-beach",
  rounds: [
    {
      format: "words",
      word: "Hippo",
      intro: "The word is hippo.",
      entries: [
        { flag: "de", word: "Flusspferd" },
        { flag: "fr", word: "hippopotame" },
        { flag: "es", word: "hipopótamo" },
        { flag: "it", word: "ippopotamo" },
      ],
      punchline: "Germany: river horse.",
      color: "#ffce00",
    },
    {
      format: "words",
      word: "Pumpkin",
      intro: "The word is pumpkin.",
      entries: [
        { flag: "de", word: "Kürbis" },
        { flag: "fr", word: "citrouille" },
        { flag: "es", word: "calabaza" },
        { flag: "it", word: "zucca" },
      ],
      punchline: "Italy: mother of zucchini.",
      color: "#009246",
    },
    {
      format: "words",
      word: "Skunk",
      intro: "The word is skunk.",
      entries: [
        { flag: "de", word: "Stinktier" },
        { flag: "es", word: "mofeta" },
        { flag: "fr", word: "mouffette" },
        { flag: "it", word: "moffetta" },
      ],
      punchline: "Germany: stink animal.",
      color: "#dd0000",
    },
    {
      format: "words",
      word: "Hedgehog",
      intro: "The word is hedgehog.",
      entries: [
        { flag: "de", word: "Igel" },
        { flag: "es", word: "erizo" },
        { flag: "fr", word: "hérisson" },
        { flag: "it", word: "riccio" },
      ],
      punchline: "Spiky in every language.",
      color: "#0055a4",
    },
  ],
};
