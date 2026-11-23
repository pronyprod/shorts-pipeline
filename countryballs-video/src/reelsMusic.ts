// Reels versions only (owner, 23 Nov 2026): Instagram/Facebook get a CC BY 4.0 track instead of the YouTube Audio
// Library one. ci/reels-audio.mjs renders the episode's audio again with the input prop
//   --props='{"reelsMusic":{"file":"music/reels/<id>.m4a","start":<seconds>}}'
// and every music <Audio> uses that file and start instead, with exactly the same volume curve (fades, ducking).
// Without the prop nothing changes: the YouTube render is untouched.
import { getInputProps } from "remotion";

export type ReelsMusic = { file: string; start: number };
export const reelsMusic = (): ReelsMusic | null => {
  try {
    const p = getInputProps() as { reelsMusic?: ReelsMusic };
    return p?.reelsMusic?.file ? { file: p.reelsMusic.file, start: Number(p.reelsMusic.start) || 0 } : null;
  } catch {
    return null;
  }
};
