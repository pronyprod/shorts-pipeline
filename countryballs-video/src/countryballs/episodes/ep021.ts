import type { Episode } from "../types";

// FLAG_PAIR_BANK.md Ep021, classic Flag Family: #9 NL->PY, #31 CM->SN, #33 GB->AU, #34 DK->NO (reveal colours: red, green, blue, red)
export const ep021: Episode = {
  id: "ep021",
  music: "sand-castle",
  layout: "low-child",
  rounds: [
    {
      parents: "nl",
      child: "py",
      punchline: "I joined a club.",
      childColor: "#d52b1e",
      parentReaction: "disappointed",
      childReaction: "defiant",
      childEyes: "up",
    },
    {
      parents: "cm",
      child: "sn",
      punchline: "My star turned green.",
      childColor: "#0b7226",
      parentReaction: "squint",
      childReaction: "proud",
      parentEyes: "up",
      childEyes: "up",
    },
    {
      parents: "gb",
      child: "au",
      punchline: "I got stars down under.",
      childColor: "#00008b",
      parentReaction: "proud",
      childReaction: "smug",
    },
    {
      parents: "dk",
      child: "no",
      punchline: "I added a blue stripe.",
      childColor: "#ed2939",
      parentReaction: "squint",
      childReaction: "innocent",
    },
  ],
};
