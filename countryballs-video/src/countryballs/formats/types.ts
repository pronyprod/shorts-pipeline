import type { TrackId } from "../music";
import type { Reaction, VoiceManifest } from "../types";

// Optional episode formats. None of this touches the normal "Flag Family" round.
// One row = one round; `format` picks the component.

// Kid first, then guess the parents.
export type ReverseRoundData = {
  format: "reverse";
  parents: string;
  child: string;
  punchline: string;
  color: string; // reveal background, taken from the parents' flag
  parentReaction: Reaction;
  childReaction: Reaction;
  parentEyes?: "up" | "down";
  childEyes?: "up" | "down";
};

export type Country = { flag: string; name: string; km2: number };

// Two balls grow to their countries' true area. Ball area = country area.
export type SizeRoundData = {
  format: "size";
  a: Country;
  b: Country;
  intro: string; // spoken, e.g. "Thailand or Spain?"
  punchline: string; // said by the winner
  color: string; // winner's background
  winnerReaction: Reaction;
  loserReaction: Reaction;
};

// One word, four countries. The voice only says English; foreign words are on screen.
export type WordsRoundData = {
  format: "words";
  word: string; // shown large
  intro: string; // spoken, e.g. "Sloth."
  entries: { flag: string; word: string }[]; // exactly 4
  punchline: string;
  color: string;
};

export type FormatRoundData = ReverseRoundData | SizeRoundData | WordsRoundData;

export type FormatEpisodeData = {
  id: string;
  music: TrackId;
  rounds: FormatRoundData[];
};

// `intros` = durations of intro1.wav ... (null for rounds without an intro)
export type FormatVoices = VoiceManifest & { intros?: (number | null)[] };
