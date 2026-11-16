// Loudness-normalises every music track in public/music to the same level.
// Originals stay untouched; copies go to public/music/norm/<same name>.mp3.
// Also prints each track's loudness over time and a suggested "lively" start
// (first point where the next 25 s stay near the track's usual loudness).
// Usage: node scripts/normalize-music.mjs

import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { decode, FFMPEG, integratedLoudness, loudnessCurve } from "./loudness.mjs";

// Every track's integrated loudness after normalising. With the template's
// music level (0.15) this puts the music ~18-20 LU under the voices
// (measured on Ep002: -19.7 gave 22-23 LU, so +3.5 dB).
export const MUSIC_LUFS = -16.2;
const PEAK_CEILING_DB = -1.5;

// Look-ahead peak limiter (only touches peaks above the ceiling)
const limit = (channels, sr) => {
  const ceiling = 10 ** (PEAK_CEILING_DB / 20);
  const look = Math.round(0.005 * sr);
  const release = Math.exp(-1 / (0.08 * sr));
  const n = channels[0].length;
  const needed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let p = 0;
    for (const ch of channels) p = Math.max(p, Math.abs(ch[i]));
    needed[i] = Math.min(1, ceiling / Math.max(p, 1e-9));
  }
  // minimum over the look-ahead window (sliding, via a simple deque)
  const minAhead = new Float32Array(n);
  const dq = [];
  for (let i = n - 1; i >= 0; i--) {
    while (dq.length && needed[dq[dq.length - 1]] >= needed[i]) dq.pop();
    dq.push(i);
    while (dq[0] > i + look) dq.shift();
    minAhead[i] = needed[dq[0]];
  }
  let env = 1;
  let limited = 0;
  for (let i = 0; i < n; i++) {
    const m = minAhead[i];
    env = m < env ? m : m + (env - m) * release;
    if (env < 0.999) limited++;
    for (const ch of channels) ch[i] = Math.max(-ceiling, Math.min(ceiling, ch[i] * env));
  }
  return limited / sr;
};

const writeWav = (file, channels, sr) => {
  const n = channels[0].length;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.round(channels[0][i] * 32767), i * 4);
    data.writeInt16LE(Math.round(channels[1][i] * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
};
const SEGMENT = 25; // seconds of music an episode needs, with a margin

const root = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(root, "public", "music");
const outDir = path.join(srcDir, "norm");
mkdirSync(outDir, { recursive: true });

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

for (const file of readdirSync(srcDir).filter((f) => f.toLowerCase().endsWith(".mp3"))) {
  const input = path.join(srcDir, file);
  const { channels, sr } = decode(input);
  const lufs = integratedLoudness(channels, sr);
  const gain = MUSIC_LUFS - lufs;

  // gain + peak limiting in JS, then encode to MP3 with Remotion's ffmpeg
  const g = 10 ** (gain / 20);
  for (const ch of channels) for (let i = 0; i < ch.length; i++) ch[i] *= g;
  const limitedSeconds = limit(channels, sr);
  const tmp = path.join(outDir, `${file}.tmp.wav`);
  writeWav(tmp, channels, sr);
  const output = path.join(outDir, file);
  const res = spawnSync(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y", "-i", tmp,
    "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "320k", output,
  ]);
  rmSync(tmp);
  if (res.status !== 0) throw new Error(res.stderr.toString());

  const after = decode(output);
  let peak = 0;
  for (const ch of after.channels) for (const v of ch) peak = Math.max(peak, Math.abs(v));

  // lively start: the 25 s from here never drop more than 4 LU below the
  // track's usual short-term loudness, and start within 1.5 LU of it
  const curve = loudnessCurve(after.channels, after.sr, 3, 0.5);
  const usual = median(curve.filter((v) => v > -40));
  const steps = SEGMENT / 0.5;
  let start = -1;
  for (let i = 0; i + steps < curve.length; i++) {
    const seg = curve.slice(i, i + steps);
    if (curve[i] >= usual - 1.5 && Math.min(...seg) >= usual - 4) {
      start = i * 0.5;
      break;
    }
  }
  const segLufs =
    start >= 0
      ? integratedLoudness(
          after.channels.map((c) => c.slice(Math.round(start * sr), Math.round((start + 20) * sr))),
          sr,
        )
      : NaN;

  console.log(`\n${file}`);
  console.log(
    `  original ${lufs.toFixed(1)} LUFS -> ${integratedLoudness(after.channels, after.sr).toFixed(1)} LUFS (gain ${gain >= 0 ? "+" : ""}${gain.toFixed(1)} dB), peak ${(20 * Math.log10(peak)).toFixed(1)} dBFS, limiter active ${limitedSeconds.toFixed(2)}s`,
  );
  console.log(`  usual short-term ${usual.toFixed(1)} LUFS; suggested lively start ${start}s (that 20s: ${segLufs.toFixed(1)} LUFS)`);
  // loudness every 5 s, so starts can be checked by eye
  const every5 = curve.filter((_, i) => i % 10 === 0).map((v, i) => `${i * 5}s:${v.toFixed(0)}`);
  console.log(`  curve ${every5.join(" ")}`);
}
