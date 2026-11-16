// Voice comparison for the first ~20 s of an episode.
// Usage: node scripts/voice-test.mjs <firstLine> <lastLine> A:Puck B:Fenrir C:Zephyr
//   Builds one Gemini TTS prompt from tests/ep001v2_voice_direction.json
//   (persona + one directed line per script line), generates tests/voice_test_<X>.wav
//   per voice, and tests/voice_test_kokoro.wav from the current Kokoro clips.
// Needs GEMINI_API_KEY in the environment (read by scripts/gemini-tts.mjs; never saved).

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const [first, last, ...voices] = process.argv.slice(2);
const from = Number(first);
const to = Number(last);
const dir = JSON.parse(readFileSync(path.join(root, "tests", "ep001v2_voice_direction.json"), "utf8"));
const { ep001v2 } = await import(pathToFileURL(path.join(root, "src", "whatif", "episodes", "ep001v2.ts")).href);

// Safety: the tagged text must say exactly the episode's words
const words = (s) => s.replace(/\[[^\]]*\]/g, " ").replace(/[^a-z0-9' ]/gi, " ").toLowerCase().split(/\s+/).filter(Boolean).join(" ");
for (const l of dir.lines) {
  if (words(l.tagged) !== words(ep001v2.lines[l.n - 1].say)) throw new Error(`line ${l.n}: tagged words differ from the script`);
}

const selected = dir.lines.filter((l) => l.n >= from && l.n <= to);
const prompt = `${dir.persona}\n\n${selected.map((l) => `(${l.style}) ${l.tagged}`).join("\n")}\n`;
const promptFile = path.join(root, "tests", `voice_test_prompt_lines${from}-${to}.txt`);
writeFileSync(promptFile, prompt);

for (const spec of voices) {
  const [label, voice] = spec.split(":");
  const out = path.join(root, "tests", `voice_test_${label}.wav`);
  const r = spawnSync(process.execPath, [path.join(root, "scripts", "gemini-tts.mjs"), promptFile, out, voice], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`voice ${label} (${voice}) failed with exit code ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

// Kokoro reference: the same lines from public/voices/<id>/, with the episode's pauses
const SR = 24000;
const pcm = [];
for (const [i, l] of ep001v2.lines.entries()) {
  if (i + 1 < from || i + 1 > to) continue;
  if (pcm.length) pcm.push(Buffer.alloc(Math.round((l.pause ?? 0.35) * SR) * 2));
  const wav = readFileSync(path.join(root, "public", "voices", ep001v2.id, `line${String(i + 1).padStart(2, "0")}.wav`));
  pcm.push(wav.subarray(44));
}
const data = Buffer.concat(pcm);
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);
writeFileSync(path.join(root, "tests", "voice_test_kokoro.wav"), Buffer.concat([header, data]));
console.log(`tests/voice_test_kokoro.wav: ${(data.length / 2 / SR).toFixed(2)}s`);
