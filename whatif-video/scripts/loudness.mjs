// Loudness measurement (ITU-R BS.1770 / EBU R128, the method YouTube uses).
//
// As a command:  node scripts/loudness.mjs renders/Ep002.mp4
//   prints integrated loudness (LUFS) and sample peak, and cross-checks the
//   loudness with ffmpeg's own loudnorm meter.
// As a module:   import { integratedLoudness } from "./loudness.mjs"

import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
export const FFMPEG = path.join(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");

const biquad = (x, b, a) => {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2) / a[0];
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
};

// K-weighting filter coefficients for any sample rate
const kWeight = (x, sr) => {
  {
    const G = 3.99984385397, Q = 0.7071752369554193, fc = 1681.9744509555319;
    const A = 10 ** (G / 40), w0 = (2 * Math.PI * fc) / sr, alpha = Math.sin(w0) / (2 * Q), c = Math.cos(w0);
    x = biquad(
      x,
      [A * (A + 1 + (A - 1) * c + 2 * Math.sqrt(A) * alpha), -2 * A * (A - 1 + (A + 1) * c), A * (A + 1 + (A - 1) * c - 2 * Math.sqrt(A) * alpha)],
      [A + 1 - (A - 1) * c + 2 * Math.sqrt(A) * alpha, 2 * (A - 1 - (A + 1) * c), A + 1 - (A - 1) * c - 2 * Math.sqrt(A) * alpha],
    );
  }
  {
    const Q = 0.5003270373253953, fc = 38.13547087613982;
    const w0 = (2 * Math.PI * fc) / sr, alpha = Math.sin(w0) / (2 * Q), c = Math.cos(w0);
    x = biquad(x, [1, -2, 1], [1 + alpha, -2 * c, 1 - alpha]);
  }
  return x;
};

// channels: array of Float32Array (one per channel). Returns LUFS (or -Infinity).
export const integratedLoudness = (channels, sr) => {
  const weighted = channels.map((c) => kWeight(c, sr));
  const block = Math.round(0.4 * sr);
  const step = Math.round(0.1 * sr);
  const powers = [];
  for (let s = 0; s + block <= weighted[0].length; s += step) {
    let p = 0;
    for (const ch of weighted) {
      let e = 0;
      for (let i = s; i < s + block; i++) e += ch[i] * ch[i];
      p += e / block;
    }
    powers.push(p);
  }
  if (powers.length === 0) return -Infinity;
  const lufs = (p) => -0.691 + 10 * Math.log10(p);
  const abs = powers.filter((p) => lufs(p) > -70);
  if (abs.length === 0) return -Infinity;
  const relGate = lufs(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const gated = abs.filter((p) => lufs(p) > relGate);
  return lufs(gated.reduce((a, b) => a + b, 0) / gated.length);
};

// Decodes any audio/video file to 48 kHz stereo floats using Remotion's ffmpeg
export const decode = (file) => {
  const res = spawnSync(
    FFMPEG,
    ["-hide_banner", "-loglevel", "error", "-i", file, "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"],
    { maxBuffer: 1e9 },
  );
  if (res.status !== 0) throw new Error(res.stderr.toString());
  const buf = res.stdout;
  const data = buf.indexOf("data") + 8;
  const frames = Math.floor((buf.length - data) / 4);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    left[i] = buf.readInt16LE(data + i * 4) / 32768;
    right[i] = buf.readInt16LE(data + i * 4 + 2) / 32768;
  }
  return { channels: [left, right], sr: 48000 };
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/loudness.mjs <file>");
    process.exit(1);
  }
  const { channels, sr } = decode(file);
  let peak = 0;
  for (const ch of channels) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  console.log(`Integrated loudness: ${integratedLoudness(channels, sr).toFixed(1)} LUFS`);
  console.log(`Sample peak:         ${(20 * Math.log10(peak)).toFixed(1)} dBFS`);

  const check = spawnSync(FFMPEG, ["-hide_banner", "-i", file, "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
  const json = check.stderr.toString().match(/\{[\s\S]*?\}/);
  if (json) {
    const r = JSON.parse(json[0]);
    console.log(`ffmpeg cross-check:  ${r.input_i} LUFS, true peak ${r.input_tp} dBTP`);
  }
}
