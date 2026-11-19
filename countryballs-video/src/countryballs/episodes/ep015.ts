import type { FormatEpisodeData } from "../formats/types";

// FLAG_PAIR_BANK.md Ep015, size duel, timely slot (Mexico: Revolution Day long weekend, 16 Nov 2026)
// Areas: Wikipedia "List of countries and dependencies by area", checked 2026-11-18.
// Reveal colours: red, green, yellow, red
export const ep015: FormatEpisodeData = {
  id: "ep015",
  music: "sand-castle",
  rounds: [
    {
      format: "size",
      a: { flag: "nz", name: "New Zealand", km2: 268838 },
      b: { flag: "gb", name: "UK", km2: 244376 },
      intro: "New Zealand or United Kingdom?",
      punchline: "I beat you quietly.",
      color: "#cc142b",
      winnerReaction: "innocent",
      loserReaction: "shocked",
    },
    {
      format: "size",
      a: { flag: "mx", name: "Mexico", km2: 1964375 },
      b: { flag: "id", name: "Indonesia", km2: 1904569 },
      intro: "Mexico or Indonesia?",
      punchline: "I win. Just.",
      color: "#006847",
      winnerReaction: "smug",
      loserReaction: "disappointed",
    },
    {
      format: "size",
      a: { flag: "bo", name: "Bolivia", km2: 1098581 },
      b: { flag: "eg", name: "Egypt", km2: 1001450 },
      intro: "Bolivia or Egypt?",
      punchline: "Landlocked and still bigger.",
      color: "#f9e804",
      winnerReaction: "proud",
      loserReaction: "confused",
    },
    {
      format: "size",
      a: { flag: "hu", name: "Hungary", km2: 93025 },
      b: { flag: "pt", name: "Portugal", km2: 92090 },
      intro: "Hungary or Portugal?",
      punchline: "Nobody saw that coming.",
      color: "#ce2939",
      winnerReaction: "laughing",
      loserReaction: "crying",
    },
  ],
};
