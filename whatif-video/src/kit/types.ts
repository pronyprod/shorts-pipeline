// KIT: shared types for the B (blocky 3D) and D (paper cut-out in 3D) What If styles.
// amazed = shocked eyes with a big open grin ("friendly-shocked", used for the channel profile picture)
export type Expression = "neutral" | "shocked" | "scared" | "relieved" | "amazed";
export type Pose = "idle" | "armsUp" | "hold" | "run" | "pointUp";
// Outfits recolour Pom (same design). "suit" = a plain white test suit, used when Pom stands in
// for a real person in a story (never draw the real person's likeness).
export type Outfit = "pom" | "suit" | "lab" | "red";
export const outfitColors = (o: Outfit = "pom"): Partial<Record<"hat" | "hatBand" | "jumper" | "jumperDark" | "legs" | "pom", string>> => {
  if (o === "suit") return { hat: "#E9EEF5", hatBand: "#C9D2DE", jumper: "#F2F5FA", jumperDark: "#C9D2DE", legs: "#AEB8C8", pom: "#FF7A45" };
  if (o === "lab") return { jumper: "#F4F6FA", jumperDark: "#D5DBE5", legs: "#3A4766" };
  if (o === "red") return { jumper: "#E2434A", jumperDark: "#B8333A", hat: "#2E7BE0", hatBand: "#1F5DB3" };
  return {};
};
