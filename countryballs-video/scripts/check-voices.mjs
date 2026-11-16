// node --no-warnings scripts/check-voices.mjs ep007
// Transcribes every voice clip with whisper.cpp and compares it to the script (rules: voice-match.mjs).
// Exits 1 if any line doesn't match and lists the clips to redo. Install once with scripts/setup-whisper.mjs.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PASS_SCORE, matchScore } from "./voice-match.mjs";

const root = path.resolve(import.meta.dirname, "..");
const id = process.argv[2];
const bin = path.join(root, "whisper.cpp", "main.exe");
const model = path.join(root, "whisper.cpp", "ggml-base.en.bin");
if (!id || !existsSync(bin) || !existsSync(model)) {
  console.error(id ? "Whisper is not installed: run scripts/setup-whisper.mjs" : "Usage: check-voices.mjs ep007");
  process.exit(1);
}
const ffmpeg = path.join(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");

const mod = await import(pathToFileURL(path.join(root, "src", "countryballs", "episodes", `${id}.ts`)).href);
const lines = [
  ["mom", "My mom."],
  ["dad", "My dad."],
  ["me", "Me."],
  ...mod[id].rounds.map((r, i) => [`punch${i + 1}`, r.punchline]),
  ...mod[id].rounds.flatMap((r, i) => (r.intro ? [[`intro${i + 1}`, r.intro]] : [])),
];

const tmp = mkdtempSync(path.join(os.tmpdir(), "voices-"));
const failed = [];
for (const [clip, script] of lines) {
  const wav = path.join(tmp, `${clip}.wav`);
  // whisper needs 16 kHz mono; the padding keeps very short clips like "Me." from being dropped
  spawnSync(ffmpeg, ["-v", "error", "-y", "-i", path.join(root, "public", "voices", id, `${clip}.wav`),
    "-af", "apad=pad_dur=1", "-ar", "16000", "-ac", "1", wav]);
  const r = spawnSync(bin, ["-m", model, "-f", wav, "-nt", "-np", "-l", "en"], { encoding: "utf8" });
  const heard = (r.stdout ?? "").trim();
  const score = matchScore(script, heard);
  const ok = score >= PASS_SCORE;
  if (!ok) failed.push(clip);
  console.log(`${ok ? "ok  " : "FAIL"} ${clip} ${Math.round(score * 100)}%: "${script}" | heard: "${heard}"`);
}
rmSync(tmp, { recursive: true, force: true });
console.log(failed.length ? `Failed: ${failed.join(" ")}` : `All ${lines.length} lines match`);
process.exit(failed.length ? 1 : 0);
