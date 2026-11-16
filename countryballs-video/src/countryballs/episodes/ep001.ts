import type { Episode } from "../types";

export const ep001: Episode = {
  id: "ep001",
  template: 1, // made before the template polish; keeps rendering exactly as before
  rounds: [
    { parents: "jp", child: "bd", punchline: "I touched grass." },
    {
      parents: "nl",
      child: "lu",
      punchline: "I turned the brightness up.",
      childColor: "#00a1de", // Luxembourg's light blue is the joke
    },
    {
      parents: "it",
      child: "mx",
      punchline: "I got a tattoo.",
      childColor: "#006847", // Mexico's three stripes tie, so pick the green
    },
    { parents: "pl", child: "id", punchline: "I'm upside down." },
  ],
};
