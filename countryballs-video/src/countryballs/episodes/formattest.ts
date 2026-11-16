import type { FormatEpisodeData } from "../formats/types";

// One round of each optional format, to check the components (Tests folder).
export const formattest: FormatEpisodeData = {
  id: "formattest",
  music: "sand-castle",
  rounds: [
    {
      format: "reverse",
      parents: "us",
      child: "lr",
      punchline: "I kept one star.",
      color: "#b22234",
      parentReaction: "shocked",
      childReaction: "proud",
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
      color: "#c60b1e",
    },
  ],
};
