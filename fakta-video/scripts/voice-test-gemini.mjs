// Indonesian voice test with Gemini TTS: the first ~15 s of Ep001 (lines 1-3), one request per voice.
// Usage: node scripts/voice-test-gemini.mjs Puck Zephyr Fenrir
// Output: tests/id_<Voice>.wav (24 kHz mono, as returned by the API)
//
// - The API key is read only from the GEMINI_API_KEY environment variable and never printed or saved.
// - Free tier: 3 requests per minute, so requests are spaced 20 s apart; hard cap of 4 requests per run.
// - The free quota is shared by all channels (same Google project). Fakta counts its own requests in
//   .tts-quota.json here and only READS the other channels' counters (never edits them), so "left today"
//   is the shared total.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SEGMENTS_V2 } from "../src/episodes/ep001-script.ts";

const MODEL = "gemini-3.1-flash-tts-preview"; // 3.8 is saved for the other channel
const GAP_MS = 20_000;
const MAX_REQUESTS = 4;
const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "tests");
mkdirSync(outDir, { recursive: true });

const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error("GEMINI_API_KEY is not set");
const voices = process.argv.slice(2);
if (!voices.length) throw new Error("name at least one voice, e.g. Puck");

// Directions are in English (the model follows them better); the spoken text is Indonesian.
const PERSONA =
  "Speak in natural, casual Bahasa Indonesia with a Jakarta accent, like an energetic Indonesian educational TikTok creator " +
  "talking to a friend: quick but clear, smiling, lively changes of pitch and rhythm, punchy on the numbers, never like a news reader. " +
  "Read only the Indonesian lines; never read the directions in parentheses.";
const STYLE = [
  "curious and a bit teasing, voice rising on the question, then playful disbelief, then a confident invitation",
  "building up, slow down slightly and stress the number",
  "excited and a little faster, land hard on the final number",
];
const lines = SEGMENTS_V2.slice(0, 3).map((s, i) => `(${STYLE[i]}) ${s.say}`);
const prompt = `${PERSONA}\n\n${lines.join("\n")}\n`;

const wav = (pcm, rate = 24000) => {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
};

// ---- shared free-quota counter (requests per model per Pacific-time day; resets ~14:00 WIB) ----
const LIMIT_PER_DAY = 10;
const QUOTA_FILE = path.join(root, ".tts-quota.json");
const OTHER_COUNTERS = ["../whatif-video/.tts-quota.json", "../my-video/.tts-quota.json"].map((f) => path.resolve(root, f));
const day = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
const readJson = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : { days: {} });
const quota = {
  usedHere: (m) => readJson(QUOTA_FILE).days?.[day()]?.[m]?.used ?? 0,
  usedElsewhere: (m) => OTHER_COUNTERS.reduce((a, f) => a + (readJson(f).days?.[day()]?.[m]?.used ?? 0), 0),
  left(m) {
    return Math.max(0, LIMIT_PER_DAY - this.usedHere(m) - this.usedElsewhere(m));
  },
  record(m) {
    const d = readJson(QUOTA_FILE);
    d.days ??= {};
    const t = ((d.days[day()] ??= {})[m] ??= { used: 0 });
    t.used++;
    d.note = "Fakta's Gemini TTS requests per model per Pacific-time day (the other channels keep their own files).";
    writeFileSync(QUOTA_FILE, JSON.stringify(d, null, 2) + "\n");
  },
};
let sent = 0;
let last = 0;
const request = async (voice) => {
  if (sent >= MAX_REQUESTS) throw new Error(`request cap of ${MAX_REQUESTS} reached`);
  if (quota.left(MODEL) <= 0) throw new Error(`${MODEL}: no free quota left today`);
  const wait = last + GAP_MS - Date.now();
  if (wait > 0) {
    console.log(`  waiting ${Math.ceil(wait / 1000)} s (free tier: 3 requests per minute)`);
    await new Promise((r) => setTimeout(r, wait));
  }
  last = Date.now();
  sent++;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
    }),
    signal: AbortSignal.timeout(180_000),
  });
  quota.record(MODEL);
  const json = await res.json();
  const b64 = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
  if (!b64) throw new Error(`HTTP ${res.status}: ${json.error?.message ?? "no audio in response"}`);
  return Buffer.from(b64, "base64");
};

for (const voice of voices) {
  console.log(`${voice}: request ${sent + 1} (${MODEL}, ${quota.left(MODEL)} left today)`);
  let pcm;
  try {
    pcm = await request(voice);
  } catch (e) {
    console.log(`  failed: ${e.message}`);
    if (sent >= MAX_REQUESTS) break;
    pcm = await request(voice).catch((e2) => (console.log(`  retry failed: ${e2.message}`), null)); // one retry
    if (!pcm) continue;
  }
  const file = path.join(outDir, `id_${voice}.wav`);
  writeFileSync(file, wav(pcm));
  console.log(`  saved ${file} (${(pcm.length / 48000).toFixed(1)} s)`);
}
console.log(`requests sent: ${sent}; ${MODEL} left today: ${quota.left(MODEL)}`);
