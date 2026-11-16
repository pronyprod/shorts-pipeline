// Generates the voice lines for one episode with kokoro-js (runs locally, no API key).
// Usage: node scripts/generate-voices.mjs ep001
//        node scripts/generate-voices.mjs ep001 --line punch2 --attempt 1
//
// --line remakes one clip only and updates its duration. Each --attempt reads
// the line at a slightly different speed, so a retry isn't just the same audio.
//
// Output:
//   public/voices/<id>/mom.wav, dad.wav, me.wav, punch1.wav ... punchN.wav
//   src/countryballs/episodes/<id>.voices.json  (durations in seconds, used for timing)
//
// Every line is trimmed of silence and normalised to the same loudness (LUFS).
// The child voice is pitched up with ffmpeg so it sounds younger.

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { KokoroTTS } from "kokoro-js";
import { integratedLoudness } from "./loudness.mjs";

const VOICES = {
  mom: "af_heart",
  dad: "am_michael",
  child: "af_sky",
};
const CHILD_PITCH = 1.22;
// Each line's loudness. With the music at MUSIC_VOLUME this puts the final
// mix at about -14 LUFS integrated (YouTube's playback level).
// Episodes made before this (template 1) used -18 dBFS RMS instead.
const VOICE_LUFS = -15.8;
const PEAK_CEILING_DB = -2;
const SAMPLE_RATE = 24000;
const RETRY_SPEEDS = { 1: 0.92, 2: 1.08 };

const root = path.resolve(import.meta.dirname, "..");
const id = process.argv[2];
const option = (flag) => {
  const i = process.argv.indexOf(flag);
  return i < 0 ? undefined : process.argv[i + 1];
};
const onlyLine = option("--line");
const speed = onlyLine ? RETRY_SPEEDS[option("--attempt")] : 1;
if (!id || !speed) {
  console.error("Usage: node scripts/generate-voices.mjs ep001 [--line punch2 --attempt 1|2]");
  process.exit(1);
}

const epFile = path.join(root, "src", "countryballs", "episodes", `${id}.ts`);
const mod = await import(pathToFileURL(epFile).href);
const episode = mod[id];
const outDir = path.join(root, "public", "voices", id);
mkdirSync(outDir, { recursive: true });

const ffmpeg = path.join(
  root,
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
  "ffmpeg.exe",
);

const pitchUp = (samples) => {
  const res = spawnSync(
    ffmpeg,
    [
      "-hide_banner", "-loglevel", "error",
      "-f", "f32le", "-ar", String(SAMPLE_RATE), "-ac", "1", "-i", "pipe:0",
      "-af", `asetrate=${SAMPLE_RATE * CHILD_PITCH},aresample=${SAMPLE_RATE},atempo=${(1 / CHILD_PITCH).toFixed(4)}`,
      // Remotion's bundled ffmpeg can't write raw audio, so read back a 16-bit WAV
      "-c:a", "pcm_s16le", "-f", "wav", "-ar", String(SAMPLE_RATE), "-ac", "1", "pipe:1",
    ],
    { input: Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength), maxBuffer: 1e8 },
  );
  if (res.status !== 0) throw new Error(res.stderr.toString());
  const out = res.stdout;
  const dataStart = out.indexOf("data") + 8;
  const count = Math.floor((out.length - dataStart) / 2);
  const result = new Float32Array(count);
  for (let i = 0; i < count; i++) result[i] = out.readInt16LE(dataStart + i * 2) / 32768;
  return result;
};

const trimSilence = (samples) => {
  const threshold = 0.02;
  const pad = Math.round(0.03 * SAMPLE_RATE);
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

// Normalise to VOICE_LUFS (EBU R128 loudness), limiting peaks on the way
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
  samples.forEach((v, i) =>
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2),
  );
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

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
  dtype: "q8",
  device: "cpu",
});

const make = async (name, text, speaker) => {
  const audio = await tts.generate(text, { voice: VOICES[speaker], speed });
  let samples = audio.audio;
  if (speaker === "child") samples = pitchUp(samples);
  samples = normalise(trimSilence(samples));
  writeWav(path.join(outDir, `${name}.wav`), samples);
  const seconds = samples.length / SAMPLE_RATE;
  console.log(`${name}.wav  ${seconds.toFixed(2)}s  "${text}"`);
  return seconds;
};

const manifestFile = path.join(root, "src", "countryballs", "episodes", `${id}.voices.json`);

if (onlyLine) {
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  const intro = onlyLine.match(/^intro(\d+)$/)?.[1];
  const round = onlyLine.match(/^punch(\d+)$/)?.[1];
  if (intro) {
    const i = Number(intro) - 1;
    manifest.intros[i] = await make(onlyLine, episode.rounds[i].intro, "dad");
  } else if (round) {
    const i = Number(round) - 1;
    manifest.punchlines[i] = await make(onlyLine, episode.rounds[i].punchline, "child");
  } else if (onlyLine === "mom" || onlyLine === "dad") {
    manifest[onlyLine] = await make(onlyLine, onlyLine === "mom" ? "My mom." : "My dad.", onlyLine);
  } else if (onlyLine === "me") {
    manifest.me = await make("me", "Me.", "child");
  } else {
    throw new Error(`Unknown line: ${onlyLine}`);
  }
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  console.log("Done.");
  process.exit(0);
}

const manifest = {
  mom: await make("mom", "My mom.", "mom"),
  dad: await make("dad", "My dad.", "dad"),
  me: await make("me", "Me.", "child"),
  punchlines: [],
};
for (const [i, round] of episode.rounds.entries()) {
  manifest.punchlines.push(await make(`punch${i + 1}`, round.punchline, "child"));
}
// Optional formats: a spoken intro before the round (see src/countryballs/formats)
if (episode.rounds.some((r) => r.intro)) {
  manifest.intros = [];
  for (const [i, round] of episode.rounds.entries()) {
    manifest.intros.push(round.intro ? await make(`intro${i + 1}`, round.intro, "dad") : null);
  }
}

writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
console.log("Done.");
