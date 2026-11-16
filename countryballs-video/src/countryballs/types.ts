import type { TrackId } from "./music";

// One row = one round. Flag codes are lowercase ISO codes from the flag-icons package.
export type RoundData = {
  parents: string;
  child: string;
  punchline: string;
  // Optional background colour for the reveal. If left out, the child flag's
  // dominant colour is detected automatically.
  childColor?: string;
  // How the balls react when the child says the punchline (see components/reactions.ts)
  parentReaction?: Reaction;
  childReaction?: Reaction;
  // Force emblem-safe eyes ("up"/"down") for this round, on top of the list in
  // emblems.ts (template 3+), e.g. when the punchline is about an emblem.
  parentEyes?: "up" | "down";
  childEyes?: "up" | "down";
};

export type Reaction =
  | "shocked"
  | "squint"
  | "disappointed"
  | "confused"
  | "proud"
  | "smug"
  | "defiant"
  | "innocent"
  | "laughing"
  | "crying";

export type Episode = {
  id: string;
  rounds: RoundData[];
  // "classic" = Ep001 layout. "low-child" = child sits lower, caption sits
  // between the parents' eyes and the child so it never covers the child.
  layout?: "classic" | "low-child";
  // Template version. Leave it out for new episodes (= latest). Older episodes
  // pin the version they were made with so they never change. See TEMPLATES in theme.ts.
  template?: TemplateVersion;
  // Background track (see music.ts). Never the same as the previous episode's.
  music?: TrackId;
};

export type TemplateVersion = 1 | 2 | 3;

export type Expression = "open" | "half" | "squint" | "shocked";

// Durations (seconds) of the generated voice files, written by scripts/generate-voices.mjs
export type VoiceManifest = {
  mom: number;
  dad: number;
  me: number;
  punchlines: number[];
};
