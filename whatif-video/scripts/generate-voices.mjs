// Generates the narration for one episode with kokoro-js (runs locally, no API key).
// Usage: npm run voices -- ep001
//
// Output:
//   public/voices/<id>/line01.wav ... lineNN.wav  (one clip per script line)
//   src/whatif/episodes/<id>.voices.json         (durations in seconds, used for timing and captions)
//
// Every line is trimmed of silence and normalised to the same loudness (LUFS),
// so the narrator sounds equally loud all the way through.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { KokoroTTS } from "kokoro-js";
import { integratedLoudness } from "./loudness.mjs";

// The channel's one narrator. Never change this between episodes.
export const NARRATOR = { voice: "af_heart", speed: 0.92 };
// Each line's loudness. With the music at MUSIC_VOLUME this puts the final
// mix at about -14 LUFS integrated (YouTube's playback level).
const VOICE_LUFS = -16.8;
const PEAK_CEILING_DB = -5.5;
const SAMPLE_RATE = 24000;

const root = path.resolve(import.meta.dirname, "..");
const id = process.argv[2];
if (!id) {
  console.error("Usage: npm run voices -- ep001");
  process.exit(1);
}

const epFile = path.join(root, "src", "whatif", "episodes", `${id}.ts`);
const episode = (await import(pathToFileURL(epFile).href))[id];
const outDir = path.join(root, "public", "voices", id);
mkdirSync(outDir, { recursive: true });

const trimSilence = (samples) => {
  const threshold = 0.02;
  const pad = Math.round(0.04 * SAMPLE_RATE);
  let start = 0;
  while (start < samples.length && Math.abs(samples[start]) < threshold) start++;
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) < threshold) end--;
  return samples.slice(Math.max(0, start - pad), Math.min(samples.length, end + pad));
};

// Look-ahead peak limiter: turns down only the loudest peaks, smoothly
const limit = (samples) => {
  const ceiling = 10 ** (PEAK_CEILING_DB / 20);
  const look = Math.round(0.005 * SAMPLE_RATE);
  const release = Math.exp(-1 / (0.06 * SAMPLE_RATE));
  const needed = samples.map((v) => Math.min(1, ceiling / Math.max(1e-9, Math.abs(v))));
  const out = new Float32Array(samples.length);
  let env = 1;
  for (let i = 0; i < samples.length; i++) {
    let m = 1;
    for (let j = i; j < Math.min(samples.length, i + look); j++) m = Math.min(m, needed[j]);
    env = m < env ? m : m + (env - m) * release;
    out[i] = Math.max(-ceiling, Math.min(ceiling, samples[i] * env));
  }
  return out;
};

const normalise = (samples) => {
  let out = samples;
  for (let pass = 0; pass < 4; pass++) {
    const gain = 10 ** ((VOICE_LUFS - integratedLoudness([out], SAMPLE_RATE)) / 20);
    out = limit(out.map((v) => v * gain));
  }
  return out;
};

const writeWav = (file, samples) => {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([header, data]));
};

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });

const durations = [];
for (const [i, line] of episode.lines.entries()) {
  const name = `line${String(i + 1).padStart(2, "0")}`;
  const audio = await tts.generate(line.say, NARRATOR);
  const samples = normalise(trimSilence(audio.audio));
  writeWav(path.join(outDir, `${name}.wav`), samples);
  const seconds = samples.length / SAMPLE_RATE;
  durations.push(Number(seconds.toFixed(3)));
  console.log(`${name}.wav  ${seconds.toFixed(2)}s  "${line.say}"`);
}

writeFileSync(
  path.join(root, "src", "whatif", "episodes", `${id}.voices.json`),
  JSON.stringify({ narrator: NARRATOR, durations }, null, 2) + "\n",
);
console.log(`Done. Speech total ${durations.reduce((a, b) => a + b, 0).toFixed(1)}s`);
