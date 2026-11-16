// Transcription (whisper.cpp, local) and script alignment for the TTS pipeline.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { FFMPEG, integratedLoudness } from "../loudness.mjs";
import { concat, silence, SR, writeWav } from "./audio.mjs";

const WHISPER = path.resolve(import.meta.dirname, "..", "..", "..", "fakta-video", "whisper");
// one folder per process and one file set per call, so parallel runs never read each other's audio
const TMP = path.join(os.tmpdir(), "whatif-tts", String(process.pid));
let calls = 0;
mkdirSync(TMP, { recursive: true });

// ---- word normalisation (so "12" == "twelve", "it's" == "its") -------------
const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
const numWords = (n) =>
  n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "") : `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numWords(n % 100)}` : ""}`;
export const normWords = (t) =>
  t
    .toLowerCase()
    .replace(/<[^>]*>|\[[^\]]*\]/g, " ") // TTS tags
    .replace(/\([^)]*\)|\*[^*]*\*/g, " ") // whisper's non-speech notes: (laughing), *sigh*
    .replace(/(\d)\s*(mm|cm|km)\b/g, (_, d, u) => `${d} ${{ mm: "millimeters", cm: "centimeters", km: "kilometers" }[u]}`) // "2mm"
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, (m, d) => ORDINALS[Number(d)] ?? m) // "4th" -> "fourth"
    .replace(/,000\b/g, " thousand") // "2,000" -> "2 thousand"
    .replace(/\b(\d{1,3}),(\d{3})\b/g, (_, a, b) => `${a} thousand ${Number(b)}`) // "1,750" -> "1 thousand 750"
    .replace(/(\d+)\.(\d+)/g, (_, a, b) => `${a} point ${b.split("").join(" ")}`) // "11.2" -> "11 point 2"
    .replace(/%/g, " percent")
    .replace(/\b(1[1-9])([1-9]\d)\b/g, (_, a, b) => `${numWords(Number(a))} ${numWords(Number(b))}`) // a year: whisper writes "1966" for "nineteen sixty six"
    .replace(/\b20([1-9]\d)\b/g, (_, b) => `twenty ${numWords(Number(b))}`) // a year: whisper writes "2022" for "twenty twenty two"
    .replace(/\b(1[1-9])00\b/g, (_, a) => `${numWords(Number(a))} hundred`) // whisper writes "1200" for "twelve hundred"
    .replace(/\b([1-9])(\d{3})\b/g, (_, a, b) => `${numWords(Number(a))} thousand${Number(b) ? ` ${numWords(Number(b))}` : ""}`) // "9600" -> "nine thousand six hundred"
    .replace(/\b\d+\b/g, (d) => (Number(d) < 1000 ? numWords(Number(d)) : d))
    .replace(/[-–]/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => SAME_SOUND[w] ?? w)
    .join(" ")
    .replace(/\ba (hundred|thousand|million|billion)\b/g, "one $1") // "a hundred" == "one hundred"
    .replace(/\bhundred and (?=(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b)/g, "hundred ") // "a hundred and twenty" == "120"
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine) point five\b/g, "$1 and a half") // whisper writes "2.5" for "two and a half"
    .replace(/\b(ha )*ha\b/g, " ") // a laugh is not a word
    .split(" ")
    .filter(Boolean);
// Words that sound identical; whisper may spell either one
const SAME_SOUND = { tons: "tonnes", kilometre: "kilometer", kilometres: "kilometers", metre: "meter", metres: "meters", litre: "liter", litres: "liters", spec: "speck", mm: "millimeters", km: "kilometers", cm: "centimeters", columbia: "colombia", rap: "wrap", aluminium: "aluminum" };
// "4th" -> "fourth" (whisper writes spoken ordinals as digits)
const ORDINALS = [, "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth"];

// ---- whisper.cpp with word timestamps -------------------------------------
// Returns [{ word, start, end }] (seconds); one whisper token may expand to
// several normalised words ("23" -> "twenty three"), sharing its time span.
// `prompt` (the script text) biases whisper towards the expected words. Only used as a
// second opinion (see checkLine): on its own it sometimes returns nothing for short clips.
// Whisper drops the last words of short, quiet clips (Gemini's raw output is ~-21 LUFS),
// so the clip is brought to speech level and given 0.5 s of silence at the end first.
export const transcribeWords = (samples, prompt) => {
  const id = ++calls;
  const f24 = path.join(TMP, `in24_${id}.wav`);
  const f16 = path.join(TMP, `in16_${id}.wav`);
  const base = path.join(TMP, `words_${id}`);
  const lufs = integratedLoudness([samples], SR);
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  const gain = Number.isFinite(lufs) ? Math.min(10 ** ((-16 - lufs) / 20), 0.95 / Math.max(peak, 1e-6)) : 1;
  writeWav(f24, concat([samples.map((v) => v * gain), silence(0.5)]));
  spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-i", f24, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", f16]);
  const r = spawnSync(
    path.join(WHISPER, "main.exe"),
    ["-m", path.join(WHISPER, "ggml-small.bin"), "-f", f16, "-l", "en", "-ml", "1", "-sow", "-oj", "-of", base, "-np", ...(prompt ? ["--prompt", prompt] : [])],
    { encoding: "utf8", timeout: 600_000 },
  );
  if (r.status !== 0) throw new Error(`whisper failed: ${r.stderr?.slice(0, 300)}`);
  const json = JSON.parse(readFileSync(`${base}.json`, "utf8"));
  for (const f of [f24, f16, `${base}.json`]) rmSync(f, { force: true });
  // a token without a leading space continues the previous word ("rain" + "drop")
  const segs = [];
  for (const seg of json.transcription) {
    const last = segs[segs.length - 1];
    if (last && seg.text && !/^\s/.test(seg.text) && /[a-z0-9]$|\d,$/i.test(last.text)) {
      last.text += seg.text;
      last.to = seg.offsets.to;
    } else segs.push({ text: seg.text, from: seg.offsets.from, to: seg.offsets.to });
  }
  const out = [];
  for (const seg of segs) {
    const ws = normWords(seg.text);
    const start = seg.from / 1000;
    const end = seg.to / 1000;
    ws.forEach((w, i) => out.push({ word: w, start: start + ((end - start) * i) / ws.length, end: start + ((end - start) * (i + 1)) / ws.length, raw: seg.text.trim() }));
  }
  return out;
};

// ---- alignment ----------------------------------------------------------------
// expected: [{ word, line }]; heard: [{ word, start, end }]
// Edit-distance alignment; returns per-line { errors, notes, start, end }.
export const alignLines = (expected, heard, lineIds) => {
  const n = expected.length;
  const m = heard.length;
  const D = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = 0; i <= n; i++) D[i][0] = i;
  for (let j = 0; j <= m; j++) D[0][j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      D[i][j] = Math.min(D[i - 1][j - 1] + (expected[i - 1].word === heard[j - 1].word ? 0 : 1), D[i - 1][j] + 1, D[i][j - 1] + 1);

  // backtrack into ops
  const ops = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (expected[i - 1].word === heard[j - 1].word ? 0 : 1)) {
      ops.push({ type: expected[i - 1].word === heard[j - 1].word ? "match" : "sub", e: i - 1, h: j - 1 });
      i--;
      j--;
    } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) {
      ops.push({ type: "del", e: i - 1 });
      i--;
    } else {
      ops.push({ type: "ins", h: j - 1, before: i }); // inserted before expected[i]
      j--;
    }
  }
  ops.reverse();
  // A dropped word right next to a swapped word is usually two words heard as one
  // ("speck us" -> "back"); an extra one next to a swap, one word heard as two.
  // Those count as possible mishearings, not as added/missing words.
  ops.forEach((op, k) => {
    if (op.type !== "sub") return;
    for (const nb of [ops[k - 1], ops[k + 1]]) {
      if (!nb || nb.joined || (nb.type !== "del" && nb.type !== "ins")) continue;
      const lineOf = (o) => (o.type === "ins" ? (o.before < n ? expected[o.before].line : expected[n - 1].line) : expected[o.e].line);
      if (lineOf(nb) !== expected[op.e].line) continue;
      nb.joined = true;
      break;
    }
  });

  const lines = Object.fromEntries(lineIds.map((id) => [id, { errors: 0, addedOrMissing: 0, notes: [], start: null, end: null, lastWordStart: null, heard: [] }]));
  const span = (L, w) => {
    L.start = L.start === null ? w.start : Math.min(L.start, w.start);
    L.end = L.end === null ? w.end : Math.max(L.end, w.end);
  };
  // times of matched words, to attribute boundary insertions to the closer line
  const lastEndOf = {};
  const firstStartOf = {};
  for (const op of ops) {
    if (op.type === "match" || op.type === "sub") {
      const id = expected[op.e].line;
      lastEndOf[id] = heard[op.h].end;
      firstStartOf[id] ??= heard[op.h].start;
    }
  }
  for (const op of ops) {
    if (op.type === "match" || op.type === "sub") {
      const L = lines[expected[op.e].line];
      span(L, heard[op.h]);
      L.heard.push(heard[op.h].word);
      // whisper stretches a word's end over the silence after it, so the gap after a
      // line starts at its last word's START, not at the line's end time
      L.lastWordStart = heard[op.h].start;
      if (op.type === "sub") {
        L.errors++;
        L.notes.push(`"${expected[op.e].word}" heard as "${heard[op.h].word}"`);
      }
    } else if (op.type === "del") {
      const L = lines[expected[op.e].line];
      L.errors++;
      if (!op.joined) L.addedOrMissing++;
      L.notes.push(op.joined ? `"${expected[op.e].word}" run into the next/previous word` : `missing "${expected[op.e].word}"`);
    } else {
      const prev = op.before > 0 ? expected[op.before - 1].line : null;
      const next = op.before < n ? expected[op.before].line : null;
      let id = prev ?? next;
      if (prev !== null && next !== null && prev !== next) {
        const h = heard[op.h];
        const dPrev = Math.abs(h.start - (lastEndOf[prev] ?? -1e9));
        const dNext = Math.abs((firstStartOf[next] ?? 1e9) - h.end);
        id = dPrev <= dNext ? prev : next;
      }
      const L = lines[id];
      span(L, heard[op.h]);
      L.heard.push(`+${heard[op.h].word}`);
      L.errors++;
      if (!op.joined) L.addedOrMissing++;
      L.notes.push(op.joined ? `"${heard[op.h].word}" split off a word` : `extra "${heard[op.h].word}"`);
    }
  }
  return lines;
};

// A line is right when whisper hears exactly the script. When the only differences
// are swapped words (same count: probably a mishearing), a second transcription
// prompted with the script decides. Extra or missing words always fail.
export const verdict = (plain, prompted) => plain.errors === 0 || (plain.addedOrMissing === 0 && prompted?.errors === 0);

// Whole-clip check for a single regenerated line: { ok, errors, notes }
export const checkLine = (expectedText, samples) => {
  const exp = normWords(expectedText).map((w) => ({ word: w, line: 0 }));
  const plain = alignLines(exp, transcribeWords(samples), [0])[0];
  if (plain.errors === 0 || plain.addedOrMissing > 0) return { ok: plain.errors === 0, errors: plain.errors, notes: plain.notes };
  const prompted = alignLines(exp, transcribeWords(samples, expectedText), [0])[0];
  const ok = verdict(plain, prompted);
  return { ok, errors: ok ? 0 : plain.errors, notes: ok ? [`mishearing only (${plain.notes.join("; ")}); prompted check OK`] : plain.notes };
};
