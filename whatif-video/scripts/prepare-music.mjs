// Prepares the what-if music library (YouTube Audio Library tracks in public/music).
// Usage: npm run music:prepare
//
// For each track in TRACKS:
// - measures integrated loudness (EBU R128) and writes a loudness-normalised AAC copy
//   to public/music/whatif/<id>.m4a (originals stay untouched)
// - computes a short-term loudness curve (3 s windows every 0.5 s) and finds the
//   biggest "builds": moments where the music rises into a clearly louder section
// Writes src/whatif/musicLibrary.ts, which the video (src/whatif/music.ts) and the
// credits script read, so both always agree on the track and its build times.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { decode, FFMPEG, integratedLoudness } from "./loudness.mjs";

// Rotation order = the order of this list (one track per episode, never the same twice in a row)
const TRACKS = [
  { id: "new-morning", title: "New Morning", artist: "TrackTribe", file: "New Morning - TrackTribe.mp3" },
  { id: "spring-field", title: "Spring Field", artist: "Godmode", file: "Spring Field - Godmode.mp3" },
  { id: "the-worlds-fair", title: "The World's Fair", artist: "Godmode", file: "The World's Fair - Godmode.mp3" },
  { id: "thumb-piano-man", title: "Thumb Piano Man", artist: "Freedom Trail Studio", file: "Thumb Piano Man - Freedom Trail Studio.mp3" },
  { id: "stasis", title: "Stasis", artist: "TrackTribe", file: "Stasis - TrackTribe.mp3" },
  { id: "wunderkind", title: "Wunderkind", artist: "Freedom Trail Studio", file: "Wunderkind - Freedom Trail Studio.mp3" },
  { id: "just-dance", title: "Just Dance", artist: "Patrick Patrikios", file: "Just Dance - Patrick Patrikios.mp3" },
];
// Same level as each narration line; the video ducks the music under the voice.
const TARGET_LUFS = -16.8;
const PEAK_LIMIT_DB = -1;
const SR = 48000;

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "music", "whatif");
mkdirSync(outDir, { recursive: true });

// short-term loudness every `step` s over `win` s windows (both channels)
const curve = (channels, win = 3, step = 0.5) => {
  const n = channels[0].length;
  const out = [];
  for (let s = 0; s + win * SR <= n; s += step * SR) {
    const a = Math.round(s);
    const b = Math.round(s + win * SR);
    out.push({ t: (a + b) / 2 / SR, lufs: integratedLoudness(channels.map((c) => c.subarray(a, b)), SR) });
  }
  return out;
};

// A build = how much louder the next 5 s are than the 10 s that ended 5 s ago
// (catches gradual ramps as well as sudden jumps). Returns local maxima of at least
// 2 LU, at least 10 s apart, biggest first.
const findBuilds = (pts) => {
  const mean = (a, b) => {
    const xs = pts.filter((p) => p.t >= a && p.t < b && Number.isFinite(p.lufs)).map((p) => p.lufs);
    return xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : -70;
  };
  const rises = pts.map((p) => ({ t: p.t, rise: mean(p.t, p.t + 5) - mean(p.t - 15, p.t - 5), after: mean(p.t, p.t + 5) }));
  const peaks = rises.filter((r, i) => r.rise >= 2 && r.t >= 15 && rises.slice(Math.max(0, i - 10), i + 11).every((o) => o.rise <= r.rise));
  const chosen = [];
  for (const p of peaks.sort((x, y) => y.rise - x.rise)) {
    if (chosen.every((c) => Math.abs(c.t - p.t) >= 10)) chosen.push(p);
  }
  return chosen.slice(0, 6).map((c) => ({ t: Number(c.t.toFixed(1)), rise: Number(c.rise.toFixed(1)), loudnessAfter: Number(c.after.toFixed(1)) }));
};

// The intro build: where the track first reaches its normal level after a quieter start
// (at least 3 LU quieter). Tracks whose only rise is at the start use this to put the
// rise on the climax (see src/whatif/music.ts, "intro build").
const findIntroBuild = (pts) => {
  const xs = pts.filter((p) => Number.isFinite(p.lufs)).map((p) => p.lufs).sort((a, b) => a - b);
  const plateau = xs[Math.floor(xs.length / 2)];
  const at = pts.find((p) => p.t >= 3 && p.lufs >= plateau - 1);
  if (!at || at.t > 40) return null;
  const before = Math.min(...pts.filter((p) => p.t < at.t && Number.isFinite(p.lufs)).map((p) => p.lufs));
  const rise = plateau - 1 - before;
  return rise >= 3 ? { t: Number(at.t.toFixed(1)), rise: Number(rise.toFixed(1)) } : null;
};

const FORCE = process.argv.includes("--force");
const library = [];
for (const tr of TRACKS) {
  const src = path.join(root, "public", "music", tr.file);
  const { channels } = decode(src);
  const duration = channels[0].length / SR;
  const lufs = integratedLoudness(channels, SR);
  let peak = 0;
  for (const c of channels) for (const v of c) peak = Math.max(peak, Math.abs(v));
  // gain to the target, but never push peaks above -1 dBFS
  const gainDb = Math.min(TARGET_LUFS - lufs, PEAK_LIMIT_DB - 20 * Math.log10(peak));
  const g = 10 ** (gainDb / 20);

  // write the normalised copy: 16-bit WAV into ffmpeg, AAC 192k out
  const frames = channels[0].length;
  const data = Buffer.alloc(frames * 4);
  for (let i = 0; i < frames; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, channels[0][i] * g)) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, channels[1][i] * g)) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  const out = path.join(outDir, `${tr.id}.m4a`);
  // existing copies are kept (published episodes use them); --force re-encodes
  const r = existsSync(out) && !FORCE ? { status: 0 } : spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-f", "wav", "-i", "pipe:0", "-c:a", "aac", "-b:a", "192k", "-f", "mp4", out], {
    input: Buffer.concat([h, data]),
    maxBuffer: 1e9,
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${tr.file}: ${r.stderr}`);

  const pts = curve(channels.map((c) => c.map((v) => v * g)));
  const builds = findBuilds(pts);
  const introBuild = findIntroBuild(pts);
  const finalLufs = lufs + gainDb;
  library.push({ ...tr, file: `music/whatif/${tr.id}.m4a`, source: `public/music/${tr.file}`, duration: Number(duration.toFixed(2)), lufs: Number(finalLufs.toFixed(1)), originalLufs: Number(lufs.toFixed(1)), builds, introBuild });
  console.log(
    `${tr.title.padEnd(18)} ${duration.toFixed(0).padStart(4)}s  ${lufs.toFixed(1)} -> ${finalLufs.toFixed(1)} LUFS  builds: ${builds.map((b) => `${b.t}s (+${b.rise})`).join(", ")}; intro build: ${introBuild ? `${introBuild.t}s (+${introBuild.rise})` : "-"}`,
  );
}

writeFileSync(
  path.join(root, "src", "whatif", "musicLibrary.ts"),
  `// Generated by scripts/prepare-music.mjs (npm run music:prepare). Do not edit by hand.
// Tracks: YouTube Audio Library. builds = moments the music rises into a louder section
// (t in seconds, rise in LU), biggest first. introBuild = where a quiet start reaches full level.
export const MUSIC_LIBRARY = ${JSON.stringify(library, null, 2)} as const;
`,
);
console.log("wrote src/whatif/musicLibrary.ts");
