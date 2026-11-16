// Emblem-safe eyes (template 3): flags with an important emblem that the eyes
// must not cover. "up" moves the eyes toward the top of the ball and makes them
// smaller; "down" does the same toward the bottom (for emblems in the top part
// of the 1x1 flag). Checked visually on the EmblemCheck still in Studio.
// Codes are flag-icons codes (lowercase).
export type EyePlacement = "up" | "down";

export const EMBLEM_SAFE: Record<string, EyePlacement> = {
  // requested list
  tn: "up",
  lb: "up",
  ca: "up",
  hr: "up",
  sg: "down",
  gl: "up",
  ne: "up",
  pw: "up",
  cm: "up",
  sn: "up",
  md: "up",
  ad: "up",
  ec: "up",
  eg: "up",
  gt: "up",
  si: "down", // shield sits in the top-left
  sk: "up",
  py: "up",
  ht: "up",
  li: "down", // crown sits in the top-left
  // punchlines in the pair bank are about these emblems
  tr: "up", // crescent ("I put mine in a circle")
  in: "up", // wheel ("My wheel became an orange")
  ar: "up", // sun ("I traded the sun for...")
  mx: "up", // coat of arms ("I got a tattoo")
};

// A round can also force it for its child or parents with `emblemSafe` in the data.
