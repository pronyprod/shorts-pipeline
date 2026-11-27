// Gemini TTS narration for an episode with as few requests as possible (free tier: 10/day/model, shared).
//
//   node scripts/gemini-voice.mts --ep=ep001v3 [--max-requests=5]
//
// 1. ONE request for the whole episode (persona + one direction per line, a pause between lines)
// 2. whisper.cpp (local) transcribes it; the words are aligned to the script to find each line
// 3. the take is cut at the silence between lines; each clip is transcribed on its own and checked:
//    every word of the line, and every number (5.240 heard as digits counts as "lima ribu dua ratus empat puluh")
// 4. only lines that are wrong are re-generated, one request each (max 1 retry per line)
// 5. clips go to data/tts/<ep>/lines/NN.wav; then run make-voice --tts to join, speed up and normalise
// Every API response is cached in data/tts/<ep>/raw/, so a re-run never pays for the same audio twice.
// The API key is read only from GEMINI_API_KEY and never printed or saved.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEpisode } from "./episode.mts";
// @ts-ignore plain JS module shared by the cloud runs
import { guardGeminiRequest, refundGeminiRequest } from "../../ci/gemini-guard.mjs";

const root = path.resolve(import.meta.dirname, "..");
const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const id = arg("ep") ?? "ep001v3";
// --lines=N: only the first N lines; --work=dir: another work folder (both for offline tests)
const EPI = await loadEpisode(id);
const SEGMENTS = EPI.segments.slice(0, Number(arg("lines") ?? 99));
const MAX_REQUESTS = Number(arg("max-requests") ?? 5);
const { voice, model, persona, styles } = EPI.voice;
// owner rule 12 Nov 2026: clear, unhurried delivery, punch only on the key line; directions that ask for speed are refused
const HURRY = /\b(fast|faster|quick|quicker|quickly|brisk|briskly|rapid|rapidly|hurried|rushed|racing|speedy|cepat|buru-buru)\b/i;
for (const text of [persona, ...Object.values(styles as Record<string, string>)]) {
  const m = HURRY.exec(text);
  if (m) throw new Error(`voice direction asks for speed ("${m[0]}"): write it clear and unhurried, with punch on the key line`);
}
if (!model.startsWith("gemini-3.1")) throw new Error(`this project uses only gemini-3.1 TTS (got ${model})`);
const work = path.resolve(root, arg("work") ?? `data/tts/${id}`);
const rawDir = path.join(work, "raw"), linesDir = path.join(work, "lines");
mkdirSync(rawDir, { recursive: true });
mkdirSync(linesDir, { recursive: true });

// ---------------- shared free-quota counter (fakta's own file; other channels' files are only read) ----------------
const LIMIT = 10;
const QUOTA_FILE = path.join(root, ".tts-quota.json");
const OTHERS = ["../whatif-video/.tts-quota.json", "../my-video/.tts-quota.json"].map((f) => path.resolve(root, f));
const day = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
const readJson = (f: string) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : { days: {} });
const usedIn = (f: string) => readJson(f).days?.[day()]?.[model]?.used ?? 0;
const left = () => Math.max(0, LIMIT - usedIn(QUOTA_FILE) - OTHERS.reduce((a, f) => a + usedIn(f), 0));
const record = () => {
  const d = readJson(QUOTA_FILE);
  d.days ??= {};
  ((d.days[day()] ??= {})[model] ??= { used: 0 }).used++;
  writeFileSync(QUOTA_FILE, JSON.stringify(d, null, 2) + "\n");
};

// ---------------- Gemini request (cached) ----------------
let sent = 0, last = 0;
const tts = async (name: string, text: string): Promise<string> => {
  const wav = path.join(rawDir, `${name}.wav`);
  if (existsSync(wav)) return wav;
  if (sent >= MAX_REQUESTS) throw new Error(`request cap of ${MAX_REQUESTS} reached`);
  if (left() <= 0) throw new Error(`${model}: no free quota left today (resets ~14:00 WIB)`);
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  guardGeminiRequest({ project: "fakta-video", episode: id }); // cloud: right episode, max 4 per run
  const wait = last + 20_000 - Date.now();
  if (wait > 0) {
    console.log(`  waiting ${Math.ceil(wait / 1000)} s (3 requests per minute)`);
    await new Promise((r) => setTimeout(r, wait));
  }
  last = Date.now();
  sent++;
  record(); // counted when sent: a request that fails on the network may still count at Google
  console.log(`  request ${sent}: ${name} (${model}, ${voice}; ${left()} left today after this one)`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
    }),
    signal: AbortSignal.timeout(300_000),
  });
  const json = await res.json();
  const b64 = json.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)?.inlineData?.data;
  if (!b64) {
    // keep the response for diagnosis (it holds no key and no audio)
    writeFileSync(path.join(rawDir, `${name}.error-${Date.now()}.json`), JSON.stringify(json, null, 2));
    const c = json.candidates?.[0];
    const why = json.error?.message ?? `finishReason ${c?.finishReason ?? "?"}${c?.content?.parts?.[0]?.text ? `, text: "${c.content.parts[0].text.slice(0, 120)}"` : ""}`;
    if (res.status === 400) refundGeminiRequest({ project: "fakta-video" }); // refused, nothing generated: not counted against this run
    throw new Error(`HTTP ${res.status}: no audio (${why})`);
  }
  const pcm = Buffer.from(b64, "base64");
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(24000, 24);
  h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  writeFileSync(wav, Buffer.concat([h, pcm]));
  return wav;
};
const promptFor = (segs: readonly { id: string; say: string }[]) =>
  `${persona}\n\n${segs.map((s) => `(${styles[s.id as keyof typeof styles]}) ${s.say}`).join("\n")}\n`;

// ---------------- whisper (local) ----------------
const WHISPER = path.join(root, "whisper");
type Word = { w: string; start: number; end: number };
const transcribe = (wav: string, prompt?: string): Word[] => {
  const f16 = path.join(work, "_16k.wav"), base = path.join(work, "_words");
  // speech level + 0.5 s tail: whisper drops the last word of short, quiet clips otherwise
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5,apad=pad_dur=0.5", "-ar", "16000", "-ac", "1", f16]);
  const r = spawnSync(path.join(WHISPER, "main.exe"),
    ["-m", path.join(WHISPER, "ggml-small.bin"), "-f", f16, "-l", "id", "-ml", "1", "-sow", "-oj", "-of", base, "-np", ...(prompt ? ["--prompt", prompt] : [])],
    { encoding: "utf8", timeout: 900_000 });
  if (r.status !== 0) throw new Error(`whisper failed: ${r.stderr?.slice(0, 300)}`);
  const segs: Word[] = [];
  for (const s of JSON.parse(readFileSync(`${base}.json`, "utf8")).transcription) {
    const prev = segs[segs.length - 1];
    if (prev && s.text && !/^\s/.test(s.text) && /[\p{L}\d]$/u.test(prev.w)) { prev.w += s.text; prev.end = s.offsets.to / 1000; }
    else if (s.text.trim()) segs.push({ w: s.text.trim(), start: s.offsets.from / 1000, end: s.offsets.to / 1000 });
  }
  return segs;
};

// ---------------- checking: words + numbers ----------------
const NUM: Record<string, number> = { nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9 };
const isNumWord = (w: string) => w in NUM || ["puluh", "ratus", "ribu", "belas", "sepuluh", "sebelas", "seratus", "seribu"].includes(w);
const norm = (t: string) =>
  t.toLowerCase().replace(/\bkm\b/g, "kilometer").replace(/(\d)\.(\d{3})/g, "$1$2").replace(/[^\p{L}\d ]/gu, " ").split(/\s+/).filter(Boolean);
// words -> tokens where each run of number words (or digits) becomes one "#<value>" token
const tokens = (t: string) => {
  const out: string[] = [];
  let total = 0, cur = 0, small = 0, inNum = false;
  const flush = () => { if (inNum) out.push(`#${total + cur + small}`); total = cur = small = 0; inNum = false; };
  for (const w of norm(t)) {
    if (/^\d+$/.test(w)) { flush(); out.push(`#${Number(w)}`); continue; }
    if (!isNumWord(w)) { flush(); out.push(w); continue; }
    inNum = true;
    if (w in NUM) small += NUM[w];
    else if (w === "belas") { cur += 10 + small; small = 0; }
    else if (w === "puluh") { cur += small * 10; small = 0; }
    else if (w === "ratus") { cur += small * 100; small = 0; }
    else if (w === "ribu") { total += (cur + small || 1) * 1000; cur = small = 0; }
    else if (w === "sepuluh") cur += 10;
    else if (w === "sebelas") cur += 11;
    else if (w === "seratus") cur += 100;
    else if (w === "seribu") total += 1000;
  }
  flush();
  return out;
};
const sim = (a: string, b: string) => {
  if (a === b) return 1;
  if (a.startsWith("#") || b.startsWith("#")) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
};
// alignment of expected tokens A to heard tokens B: returns matched index pairs and the differences
const align = (A: string[], B: string[]) => {
  const n = A.length, m = B.length;
  const S = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const s = sim(A[i - 1], B[j - 1]);
    S[i][j] = Math.max(S[i - 1][j], S[i][j - 1], S[i - 1][j - 1] + (s >= 0.6 ? s : -1));
  }
  const pairs: [number, number][] = [];
  for (let i = n, j = m; i > 0 && j > 0; ) {
    const s = sim(A[i - 1], B[j - 1]);
    if (s >= 0.6 && S[i][j] === S[i - 1][j - 1] + s) { pairs.unshift([i - 1, j - 1]); i--; j--; }
    else if (S[i][j] === S[i - 1][j]) i--;
    else j--;
  }
  const missing = A.filter((_, i) => !pairs.some((p) => p[0] === i));
  const extra = B.filter((_, j) => !pairs.some((p) => p[1] === j));
  return { pairs, missing, extra };
};
type Check = { ok: boolean; errors: number; notes: string[] };
const checkHeard = (say: string, heard: Word[]): Check => {
  const { missing, extra } = align(tokens(say), tokens(heard.map((h) => h.w).join(" ")));
  const numBad = [...missing, ...extra].some((t) => t.startsWith("#"));
  const errors = missing.length + extra.length;
  // one stray word is tolerated (whisper mishearing a foreign name, or a harmless "kilometer"); a wrong number never is
  return { ok: !numBad && errors <= 1, errors: errors + (numBad ? 10 : 0), notes: [...missing.map((t) => `missing "${t}"`), ...extra.map((t) => `extra "${t}"`)] };
};
// First a plain listen; only if that differs, a second listen with the script as whisper's prompt
// (the prompt helps with names, but on its own it sometimes skips the first sentence).
const checkClip = (say: string, wav: string): Check => {
  const plain = checkHeard(say, transcribe(wav));
  if (plain.ok) return plain;
  const prompted = checkHeard(say, transcribe(wav, say));
  return prompted.errors < plain.errors ? prompted : plain;
};

const silences = (wav: string) => {
  const err = spawnSync("ffmpeg", ["-hide_banner", "-i", wav, "-af", "silencedetect=n=-38dB:d=0.25", "-f", "null", "-"]).stderr.toString();
  const s = [...err.matchAll(/silence_start: ([\d.]+)/g)].map((x) => +x[1]);
  const e = [...err.matchAll(/silence_end: ([\d.]+)/g)].map((x) => +x[1]);
  return s.map((a, i) => ({ a, b: e[i] ?? a, mid: (a + (e[i] ?? a)) / 2, len: (e[i] ?? a) - a }));
};
const cut = (src: string, a: number, b: number, out: string) =>
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", src, "-ss", a.toFixed(3), "-to", b.toFixed(3), "-c:a", "pcm_s16le", out]);

// ---------------- 1-3: whole take, split, check ----------------
console.log(`${id}: ${SEGMENTS.length} lines, voice ${voice}, ${model}`);
const take = await tts("episode", promptFor(SEGMENTS));
const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", take]).toString());
console.log(`  take: ${dur.toFixed(1)} s`);

const heard = transcribe(take);
const expected = SEGMENTS.flatMap((s, li) => tokens(s.say).map((t) => ({ t, li })));
const heardTok: { t: string; start: number }[] = [];
for (const h of heard) for (const t of tokens(h.w)) heardTok.push({ t, start: h.start });
const { pairs } = align(expected.map((e) => e.t), heardTok.map((h) => h.t));
const lineTimes = SEGMENTS.map((_, li) => {
  const ts = pairs.filter(([i]) => expected[i].li === li).map(([, j]) => heardTok[j].start);
  return ts.length ? { first: Math.min(...ts), last: Math.max(...ts) } : null;
});
const sil = silences(take);
const cuts = [0];
for (let k = 0; k < SEGMENTS.length - 1; k++) {
  const lo = (lineTimes[k]?.last ?? cuts[k]) - 0.2, hi = (lineTimes[k + 1]?.first ?? dur) + 0.4;
  const c = sil.filter((s) => s.mid > Math.max(lo, cuts[k] + 0.5) && s.mid < hi).sort((x, y) => y.len - x.len)[0];
  cuts.push(c ? c.mid : Math.max(cuts[k] + 0.5, ((lineTimes[k]?.last ?? lo) + (lineTimes[k + 1]?.first ?? hi)) / 2));
}
cuts.push(dur);

const result: { n: number; id: string; source: string; check: Check }[] = [];
for (let k = 0; k < SEGMENTS.length; k++) {
  const n = String(k + 1).padStart(2, "0");
  const out = path.join(linesDir, `${n}.wav`);
  cut(take, cuts[k], cuts[k + 1], out);
  const check = checkClip(SEGMENTS[k].say, out);
  result.push({ n: k + 1, id: SEGMENTS[k].id, source: "episode take", check });
  console.log(`  line ${n} ${SEGMENTS[k].id.padEnd(10)} ${check.ok ? "OK  " : "DIFF"} ${(cuts[k + 1] - cuts[k]).toFixed(2)} s ${check.notes.join("; ")}`);
}

// ---------------- 4: re-generate only the wrong lines ----------------
for (const r of result.filter((x) => !x.check.ok)) {
  const seg = SEGMENTS[r.n - 1];
  let wav: string;
  try {
    wav = await tts(`line${String(r.n).padStart(2, "0")}`, promptFor([seg]).replace(" with a clear one-second pause between lines", ""));
  } catch (e) {
    console.log(`  ${(e as Error).message}: line ${r.n} stays as it is`);
    break;
  }
  const check = checkClip(seg.say, wav);
  console.log(`  line ${String(r.n).padStart(2, "0")} retry: ${check.ok ? "OK  " : "DIFF"} ${check.notes.join("; ")}`);
  if (check.errors < r.check.errors) {
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", wav, "-c:a", "pcm_s16le", path.join(linesDir, `${String(r.n).padStart(2, "0")}.wav`)]);
    Object.assign(r, { source: "retry", check });
  }
}

writeFileSync(path.join(work, "report.json"), JSON.stringify({ id, voice, model, requests: sent, quotaLeft: left(), lines: result }, null, 2) + "\n");
const bad = result.filter((r) => !r.check.ok).map((r) => r.n);
console.log(`requests this run: ${sent}; ${model} left today: ${left()}`);
console.log(bad.length ? `STILL DIFFERENT: lines ${bad.join(", ")} (see report.json)` : "all lines match the script");
console.log(`next: node scripts/make-voice.mts --ep=${id} --own --tts --from=data/tts/${id}/lines`);
