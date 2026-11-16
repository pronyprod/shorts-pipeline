// Loudness-normalised copies of the music tracks, so every track sits at the same level under the voice.
// In:  public/music/*.mp3 (YouTube Audio Library downloads; the originals are never changed)
// Out: public/music/norm/<id>.m4a at -16 LUFS integrated, true peak <= -1.5 dBTP (two-pass loudnorm)
// Usage: node scripts/prepare-music.mjs        (skips tracks that are already done)
// The track list, rotation rules and credits live in src/music.ts.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const { TRACKS, MUSIC_LUFS } = await import("../src/music.ts");
const outDir = path.join(root, "public/music/norm");
mkdirSync(outDir, { recursive: true });

const ff = (args) => spawnSync("ffmpeg", ["-hide_banner", ...args]).stderr.toString();
for (const t of TRACKS) {
  const src = path.join(root, "public/music", t.source);
  const out = path.join(outDir, `${t.id}.m4a`);
  if (existsSync(out)) continue;
  const target = `I=${MUSIC_LUFS}:TP=-1.5:LRA=20`;
  const m = JSON.parse(ff(["-i", src, "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"]).match(/\{[\s\S]*?\}/)[0]);
  ff(["-y", "-v", "error", "-i", src, "-af",
    `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    "-ar", "48000", "-c:a", "aac", "-b:a", "256k", out]);
  const after = ff(["-i", out, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const I = after.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop();
  console.log(`${t.id.padEnd(20)} ${m.input_i} LUFS -> ${I}`);
}
