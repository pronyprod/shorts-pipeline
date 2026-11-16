// Transcribes test takes with Whisper.cpp to check the words and the pace.
// Usage: node scripts/check-take.mts tests/id_Puck.wav [more.wav]
import { execFileSync } from "node:child_process";
import path from "node:path";
import { toCaptions, transcribe } from "@remotion/install-whisper-cpp";

const root = path.resolve(import.meta.dirname, "..");
const whisperDir = path.join(root, "whisper");
for (const f of process.argv.slice(2)) {
  const wav16 = path.join(root, "data", `_check-16k.wav`);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", f, "-ar", "16000", "-ac", "1", wav16]);
  const out = await transcribe({ inputPath: wav16, whisperPath: whisperDir, whisperCppVersion: "1.5.5", model: "small", modelFolder: whisperDir, tokenLevelTimestamps: true, language: "id", printOutput: false });
  const { captions } = toCaptions({ whisperCppOutput: out });
  const words = captions.map((c) => c.text).join("").trim();
  let maxGap = 0, at = 0;
  for (let i = 1; i < captions.length; i++) { const g = captions[i].startMs - captions[i - 1].endMs; if (g > maxGap) { maxGap = g; at = captions[i].startMs; } }
  const speech = (captions[captions.length - 1].endMs - captions[0].startMs) / 1000;
  console.log(`${path.basename(f)}: speech ${speech.toFixed(1)} s, longest gap ${(maxGap / 1000).toFixed(2)} s at ${(at / 1000).toFixed(1)} s\n  "${words}"`);
}
