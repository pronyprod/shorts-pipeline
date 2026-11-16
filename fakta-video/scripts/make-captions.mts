// Indonesian captions with word timestamps from Whisper.cpp (runs locally, free).
// 1. installs whisper.cpp + the multilingual "small" model into ./whisper (first run only)
// 2. transcribes public/voice/<ep>.wav with token-level timestamps (language: id)
// 3. aligns Whisper's words to the script words, so captions are spelled exactly as written
//    but timed by Whisper (Whisper may write "5.240" where the script says "lima ribu ...").
// Output: src/episodes/<ep>-captions.json (Remotion Caption[]) and data/<ep>-whisper.json (raw)
// Usage: node scripts/make-captions.mts --ep=ep001v2   (default: ep001)

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } from "@remotion/install-whisper-cpp";
import type { Caption } from "@remotion/captions";
import { loadEpisode } from "./episode.mts";

const root = path.resolve(import.meta.dirname, "..");
const id = process.argv.find((a) => a.startsWith("--ep="))?.split("=")[1] ?? "ep001";
const { segments: SEGMENTS } = await loadEpisode(id);
if (!SEGMENTS) throw new Error(`unknown --ep=${id}`);
const timing: { start: number; end: number }[] = JSON.parse(readFileSync(path.join(root, "src/episodes", `${id}-timing.json`), "utf8"));
const whisperDir = path.join(root, "whisper");
const VERSION = "1.5.5";
const MODEL = "small";

await installWhisperCpp({ to: whisperDir, version: VERSION, printOutput: false });
await downloadWhisperModel({ model: MODEL, folder: whisperDir, printOutput: false });

mkdirSync(path.join(root, "data"), { recursive: true });
const wav16 = path.join(root, "data", `${id}-16k.wav`);
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", path.join(root, "public/voice", `${id}.wav`), "-ar", "16000", "-ac", "1", wav16]);

const out = await transcribe({
  inputPath: wav16,
  whisperPath: whisperDir,
  whisperCppVersion: VERSION,
  model: MODEL,
  modelFolder: whisperDir,
  tokenLevelTimestamps: true,
  language: "id",
  printOutput: false,
});
const { captions: tokens } = toCaptions({ whisperCppOutput: out });
// Whisper gives sub-word tokens ("Ser", "ikat"); a token that starts with a space begins a new word
const heard: Caption[] = [];
for (const tk of tokens) {
  const last = heard[heard.length - 1];
  if (last && !tk.text.startsWith(" ")) {
    last.text += tk.text;
    last.endMs = tk.endMs;
  } else heard.push({ ...tk });
}
writeFileSync(path.join(root, "data", `${id}-whisper.json`), JSON.stringify(heard, null, 2));

// --- alignment: script words <-> heard words (edit-distance alignment on normalised words) ---
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const sim = (a: string, b: string) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
};

const captions: Caption[] = [];
let anchors = 0;
let total = 0;
SEGMENTS.forEach((seg, si) => {
  const t = timing[si];
  const words = seg.say.split(/\s+/);
  // Whisper words heard inside this line's time span
  const h = heard.filter((c) => c.startMs / 1000 >= t.start - 0.15 && c.startMs / 1000 < t.end - 0.05);
  const A = words.map(norm);
  const B = h.map((c) => norm(c.text));
  // DP: maximise total similarity of matched pairs (gaps cost 0)
  const n = A.length, m = B.length;
  const S: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const s = sim(A[i - 1], B[j - 1]);
      S[i][j] = Math.max(S[i - 1][j], S[i][j - 1], S[i - 1][j - 1] + (s >= 0.6 ? s : -1));
    }
  const match: (number | null)[] = Array(n).fill(null);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    const s = sim(A[i - 1], B[j - 1]);
    if (s >= 0.6 && S[i][j] === S[i - 1][j - 1] + s) { match[i - 1] = j - 1; i--; j--; }
    else if (S[i][j] === S[i - 1][j]) i--;
    else j--;
  }
  // timed anchors: matched words get Whisper's times; the segment edges are anchors too
  const startOf = (i: number) => (match[i] !== null ? h[match[i]!].startMs : null);
  const pts: { i: number; ms: number }[] = [{ i: 0, ms: t.start * 1000 }];
  words.forEach((_, i) => { const s = startOf(i); if (s !== null && i > 0) pts.push({ i, ms: s }); });
  pts.push({ i: n, ms: t.end * 1000 });
  anchors += match.filter((x) => x !== null).length;
  total += n;
  // between anchors, spread the words by their character length
  const starts: number[] = Array(n + 1).fill(0);
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    const span = words.slice(a.i, b.i);
    const chars = span.reduce((x, w) => x + w.length + 1, 0);
    let acc = 0;
    span.forEach((w, q) => { starts[a.i + q] = a.ms + ((b.ms - a.ms) * acc) / chars; acc += w.length + 1; });
  }
  starts[n] = t.end * 1000;
  words.forEach((w, i) => {
    captions.push({
      text: (i === 0 && si === 0 ? "" : " ") + w,
      startMs: Math.round(starts[i]),
      endMs: Math.round(i === n - 1 ? t.end * 1000 : starts[i + 1]),
      timestampMs: Math.round(starts[i]),
      confidence: match[i] !== null ? 1 : 0.5,
    });
  });
});

writeFileSync(path.join(root, "src/episodes", `${id}-captions.json`), JSON.stringify(captions, null, 1));
console.log(`Whisper heard ${heard.length} words; ${anchors}/${total} script words matched directly, the rest interpolated.`);
