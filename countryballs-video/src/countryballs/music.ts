// Background music: YouTube Audio Library tracks ("attribution not required").
// Files are loudness-normalised copies in public/music/norm (all -16.2 LUFS,
// made by `npm run normalize-music`); the originals in public/music stay untouched.
// `start` = seconds into the track where it's lively (quiet intros skipped),
// picked from the loudness curves the normalise script prints.

export type TrackId =
  | "sand-castle"
  | "ukulele-beach"
  | "at-the-fair"
  | "rainy-day-games"
  | "claudio-the-worm"
  | "bubble-bath"
  | "this-old-man";

export type Track = {
  title: string;
  artist: string;
  file: string; // inside public/music/norm
  start: number;
};

export const TRACKS: Record<TrackId, Track> = {
  "sand-castle": { title: "Sand Castle", artist: "Quincas Moreira", file: "Sand Castle - Quincas Moreira.mp3", start: 4 },
  "ukulele-beach": { title: "Ukulele Beach", artist: "Doug Maxwell", file: "Ukulele Beach - Doug Maxwell.mp3", start: 20 },
  "at-the-fair": { title: "At The Fair", artist: "The Green Orbs", file: "At The Fair - The Green Orbs.mp3", start: 20 },
  "rainy-day-games": { title: "Rainy Day Games", artist: "The Green Orbs", file: "Rainy Day Games - The Green Orbs.mp3", start: 20 },
  "claudio-the-worm": { title: "Claudio The Worm", artist: "The Green Orbs", file: "Claudio The Worm - The Green Orbs.mp3", start: 45 },
  "bubble-bath": { title: "Bubble Bath", artist: "The Green Orbs", file: "Bubble Bath - The Green Orbs.mp3", start: 64 },
  // Last resort only: nursery-rhyme melody (could read as "made for kids")
  "this-old-man": { title: "This Old Man (instrumental)", artist: "The Green Orbs", file: "This Old Man (instrumental) - The Green Orbs.mp3", start: 10 },
};

// Suggested order for new episodes. Never the same track in two consecutive
// episodes (checked automatically when an episode loads).
export const ROTATION: TrackId[] = [
  "ukulele-beach",
  "sand-castle",
  "at-the-fair",
  "rainy-day-games",
  "claudio-the-worm",
  "bubble-bath",
];

export const FADE_IN = 0.3; // seconds
export const FADE_OUT = 0.6; // seconds, ending exactly at the last frame
