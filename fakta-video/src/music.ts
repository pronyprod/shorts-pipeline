// Music for the fakta channel: the track list, the rotation rule and the mix levels.
// Tracks: YouTube Audio Library downloads (owner, 30 Oct 2026) in public/music; the loudness-normalised
// copies used in the videos are made by scripts/prepare-music.mjs (public/music/norm/<id>.m4a).
// peta-pulse.wav (our old generated loop) is retired and not in this list.

export type Track = {
  id: string;
  title: string;
  artist: string;
  source: string; // original file in public/music
  seconds: number;
  maxEpisodeSec?: number; // only for episodes shorter than this
  needsApproval?: boolean; // skipped until the owner approves it (add the id to APPROVED)
};

export const MUSIC_LUFS = -16; // every normalised copy
export const VOICE_LUFS = -16; // the voice track is brought to this level in the mix
export const DUCK_DB = 19; // music sits this far below the voice while someone is talking (rule: 18-20 dB)
export const OPEN_DB = 9; // ... and this far below in gaps longer than ~0.6 s

export const TRACKS: Track[] = [
  { id: "brain-trust", title: "Brain Trust", artist: "Wayne Jones", source: "Brain Trust - Wayne Jones.mp3", seconds: 105.5 },
  { id: "cooper-ave", title: "Cooper Ave", artist: "The Westerlies", source: "Cooper Ave - The Westerlies.mp3", seconds: 95.6 },
  { id: "dog-park", title: "Dog Park", artist: "Silent Partner", source: "Dog Park - Silent Partner.mp3", seconds: 92.8 },
  { id: "dog-and-pony-show", title: "Dog and Pony Show", artist: "Silent Partner", source: "Dog and Pony Show - Silent Partner.mp3", seconds: 93.2 },
  { id: "good-starts", title: "Good Starts", artist: "Jingle Punks", source: "Good Starts - Jingle Punks.mp3", seconds: 69.9, maxEpisodeSec: 58 }, // music ends ~60 s
  { id: "mr-sunny-face", title: "Mr. Sunny Face", artist: "Wayne Jones", source: "Mr. Sunny Face - Wayne Jones.mp3", seconds: 104.4 },
  { id: "sad-eyed-waltz", title: "Sad Eyed Waltz", artist: "Telecasted", source: "Sad Eyed Waltz - Telecasted.mp3", seconds: 128.8, needsApproval: true },
  { id: "sneaky-business", title: "Sneaky Business", artist: "Biz Baz Studio", source: "Sneaky Business - Biz Baz Studio.mp3", seconds: 97.7 },
  { id: "the-curious-kitten", title: "The Curious Kitten", artist: "Aaron Kenny", source: "The Curious Kitten - Aaron Kenny.mp3", seconds: 99.4 }, // very quiet original (-30.6 LUFS)
];

export const APPROVED: string[] = []; // e.g. ["sad-eyed-waltz"] once the owner OKs it

const eligible = (seconds: number) =>
  TRACKS.filter((t) => (!t.needsApproval || APPROVED.includes(t.id)) && (t.maxEpisodeSec === undefined || seconds < t.maxEpisodeSec) && t.seconds >= seconds + 1);

// Which episode used which track. Add a line when an episode is published (also in CREDITS.md).
export const USED: Record<number, string> = {
  1: "brain-trust", // Ep001 (V3, Gemini voice)
  2: "cooper-ave", // Ep002 coastline (64.1 s)
  3: "dog-park", // Ep003 Krakatau (54.8 s): first never-used track in list order
  4: "dog-and-pony-show", // Ep004 Run/Manhattan (64.8 s)
  5: "good-starts", // Ep005 Kenapa bahasa Jawa (56.2 s, under the 58 s limit)
  6: "mr-sunny-face", // Ep006 Wallace Line (65.6 s)
  7: "sneaky-business", // Ep007 Borobudur (78.4 s)
  8: "the-curious-kitten", // Ep008 hari tanpa bayangan (72.4 s)
  9: "brain-trust", // Ep009 Komodo 5 pulau (60.0 s): least recently used (Ep001)
  10: "cooper-ave", // Ep010 Leonid (51.4 s): least recently used (Ep002)
  11: "dog-park", // Ep011 Kalimantan tiga negara (47.4 s): least recently used (Ep003)
  12: "dog-and-pony-show", // Ep012 cenderawasih tanpa kaki (47.4 s): least recently used (Ep004)
  13: "good-starts", // Ep013 Selat Malaka (52.3 s, under the 58 s limit): least recently used (Ep005)
  14: "mr-sunny-face", // Ep014 bahasa daerah (48.0 s): least recently used (Ep006)
  15: "sneaky-business", // Ep015 supermoon (40.4 s): least recently used (Ep007)
  16: "the-curious-kitten", // Ep016 kopi java (42.4 s): least recently used (Ep008)
  17: "brain-trust", // Ep017 rafflesia (43.8 s): least recently used (Ep009)
  18: "cooper-ave", // Ep018 bendera Monako (41.6 s): least recently used (Ep010)
  19: "dog-park", // Ep019 pulau Indonesia (44.8 s): least recently used (Ep011)
  20: "dog-and-pony-show", // Ep020 Geminid (42.7 s): least recently used (Ep012)
  21: "good-starts", // Ep021 Makassan trepang (46.7 s, under the 58 s limit): least recently used (Ep013)
  22: "mr-sunny-face", // Ep022 rice cooker (43.7 s): least recently used (Ep014)
};

// Rotation: an episode that already has a track keeps it. A new episode takes the eligible track that was
// used longest ago (never-used tracks first, in list order), so no track repeats until all have played.
export const pickTrack = (episode: number, seconds: number): Track => {
  const list = eligible(seconds);
  if (!list.length) throw new Error(`no music track is long enough for ${seconds.toFixed(1)} s`);
  const fixed = list.find((t) => t.id === USED[episode]);
  if (fixed) return fixed;
  const lastUse = (id: string) => Math.max(0, ...Object.entries(USED).filter(([e, t]) => t === id && +e < episode).map(([e]) => +e));
  return [...list].sort((x, y) => lastUse(x.id) - lastUse(y.id))[0];
};

export const musicFile = (t: Track) => `music/norm/${t.id}.m4a`;
export const creditLine = (t: Track) => `Music: "${t.title}" by ${t.artist} (YouTube Audio Library)`;
