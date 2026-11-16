// Per-line Gemini TTS take for a voice comparison.
// Usage: node scripts/voice-test-perline.mjs <3.8|3.1> <voice> <out.wav> [firstLine] [lastLine]
//
// For each script line: one request -> trim silence -> transcribe with whisper.cpp ->
// compare with the script words -> re-generate (up to MAX_TRIES) on extra/missing words ->
// normalise loudness. Lines are joined with our own short pauses.
// Writes <out>.json with per-line attempts, transcripts and lengths.
// Needs GEMINI_API_KEY in the environment (never printed or saved).

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FFMPEG, integratedLoudness } from "./loudness.mjs";

const [modelArg, voice, outFile, first = "1", last = "7"] = process.argv.slice(2);
const MODEL = { "3.8": "gemini-3.8-flash-tts", "3.1": "gemini-3.1-flash-tts-preview" }[modelArg];
if (!MODEL || !voice || !outFile) {
  console.error("Usage: node scripts/voice-test-perline.mjs <3.8|3.1> <voice> <out.wav> [first] [last]");
  process.exit(1);
}
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error("GEMINI_API_KEY is not set");

const root = path.resolve(import.meta.dirname, "..");
const WHISPER = path.join(root, "..", "fakta-video", "whisper");
const SR = 24000;
const MAX_TRIES = 4;
const VOICE_LUFS = -16.8; // same per-line level as the Kokoro pipeline
const PEAK_CEILING_DB = -5.5;
// pause after each line (seconds): short by default, longer only where the direction lands a big moment
const PAUSE_AFTER = { 1: 0.4, 10: 0.6, 13: 0.5, 15: 0.5, 16: 0.6, 18: 0.6 };
const DEFAULT_PAUSE = 0.3;

const dir = JSON.parse(readFileSync(path.join(root, "tests", "ep001v2_voice_direction.json"), "utf8"));
const { ep001v2 } = await import(pathToFileURL(path.join(root, "src", "whatif", "episodes", "ep001v2.ts")).href);
const tmp = path.join(os.tmpdir(), "whatif-voicetest");
mkdirSync(tmp, { recursive: true });

// ---- direction -> request ---------------------------------------------------
// 3.8: sustained delivery goes in the style field; only point-in-time vocal
// events stay inline, in angle brackets. Mood tags like [excited] move into the style.
const VOCAL = { "short pause": "short pause", "long pause": "long pause", laughs: "laugh", chuckles: "chuckle" };
const PERSONA_38 = "Energetic, charismatic YouTube science narrator talking to a friend: conversational, human, smiling, natural breaths";
const to38 = (line) => {
  const moods = [];
  const text = line.tagged
    .replace(/\[([^\]]+)\]\s*/g, (_, tag) => {
      if (VOCAL[tag]) return `<${VOCAL[tag]}> `;
      moods.push(tag === "whispers" ? "starts in a whisper" : tag);
      return "";
    })
    .trim();
  return { text, style: `${PERSONA_38}. ${line.style}${moods.length ? `; ${moods.join(", ")}` : ""}` };
};
// 3.1: style as plain text in the prompt, tags inline in square brackets (as in the first test)
const to31 = (line) => ({ text: `${dir.persona}\n\n(${line.style}) ${line.tagged}`, style: null });

const synth = async ({ text, style }) => {
  for (let wait = 20; ; wait *= 2) {
    let res;
    try {
    if (MODEL.startsWith("gemini-3.8")) {
      res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        signal: AbortSignal.timeout(120_000),
        headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          input: [{ type: "user_input", content: [{ type: "text", text, annotations: [{ type: "speech_metadata", style }] }] }],
          response_format: { type: "audio" },
          generation_config: { speech_config: [{ voice }] },
        }),
      });
    } else {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: "POST",
        signal: AbortSignal.timeout(120_000),
        headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
        }),
      });
    }
    } catch (e) {
      // dropped connections happen after long idle gaps (whisper runs); just retry
      stats.networkRetries++;
      console.log(`  network error (${e.cause?.code ?? e.message}), retrying in 5s`);
      if (stats.networkRetries > 20) throw e;
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    const json = await res.json();
    if (res.status === 429 || res.status >= 500) {
      const retry = JSON.stringify(json).match(/"retryDelay":"(\d+)s"/)?.[1];
      const s = retry ? Number(retry) + 2 : wait;
      console.log(`  HTTP ${res.status} ${json.error?.status ?? ""}: waiting ${s}s (${json.error?.message?.slice(0, 160) ?? ""})`);
      stats.throttled.push({ status: res.status, message: json.error?.message?.slice(0, 300) });
      // a daily quota won't reset by waiting a few minutes: stop instead of retrying
      if (/per day/i.test(json.error?.message ?? "")) throw new Error(`daily quota reached: ${json.error.message}`);
      if (wait > 320) throw new Error("giving up after repeated rate limiting");
      await new Promise((r) => setTimeout(r, s * 1000));
      continue;
    }
    if (!res.ok || json.error) throw new Error(`HTTP ${res.status}: ${json.error?.message ?? JSON.stringify(json).slice(0, 300)}`);
    stats.requests++;
    const b64 = MODEL.startsWith("gemini-3.8")
      ? json.steps?.flatMap((s) => s.content ?? []).find((c) => c.type === "audio")?.data
      : json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
    stats.outTokens += MODEL.startsWith("gemini-3.8") ? (json.usage?.total_output_tokens ?? 0) : (json.usageMetadata?.candidatesTokenCount ?? 0);
    let buf = Buffer.from(b64, "base64");
    let rate = SR;
    if (buf.subarray(0, 4).toString() === "RIFF") {
      rate = buf.readUInt32LE(24);
      buf = buf.subarray(buf.indexOf("data") + 8);
    }
    if (rate !== SR) throw new Error(`unexpected sample rate ${rate}`);
    const out = new Float32Array(Math.floor(buf.length / 2));
    for (let i = 0; i < out.length; i++) out[i] = buf.readInt16LE(i * 2) / 32768;
    return out;
  }
};

// ---- audio helpers ------------------------------------------------------------
const trim = (s) => {
  const win = Math.round(0.01 * SR);
  const loud = (i) => {
    let e = 0;
    for (let j = i; j < Math.min(s.length, i + win); j++) e += s[j] * s[j];
    return 10 * Math.log10(e / win + 1e-12) > -45;
  };
  let a = 0;
  while (a < s.length && !loud(a)) a += win;
  let b = s.length - win;
  while (b > a && !loud(b)) b -= win;
  const pad = Math.round(0.04 * SR);
  return s.slice(Math.max(0, a - pad), Math.min(s.length, b + win + pad));
};
const limit = (s) => {
  const c = 10 ** (PEAK_CEILING_DB / 20);
  const look = Math.round(0.005 * SR);
  const rel = Math.exp(-1 / (0.06 * SR));
  const need = s.map((v) => Math.min(1, c / Math.max(1e-9, Math.abs(v))));
  const out = new Float32Array(s.length);
  let env = 1;
  for (let i = 0; i < s.length; i++) {
    let m = 1;
    for (let j = i; j < Math.min(s.length, i + look); j++) m = Math.min(m, need[j]);
    env = m < env ? m : m + (env - m) * rel;
    out[i] = Math.max(-c, Math.min(c, s[i] * env));
  }
  return out;
};
const normalise = (s) => {
  let out = s;
  for (let p = 0; p < 4; p++) {
    const gain = 10 ** ((VOICE_LUFS - integratedLoudness([out], SR)) / 20);
    out = limit(out.map((v) => v * gain));
  }
  return out;
};
const wav = (s) => {
  const data = Buffer.alloc(s.length * 2);
  s.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
};

// ---- transcription check ------------------------------------------------------
const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
const numWords = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
const words = (t) =>
  t
    .toLowerCase()
    .replace(/\b\d+\b/g, (d) => (Number(d) < 100 ? numWords(Number(d)) : d))
    .replace(/[-–]/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
const transcribe = (samples) => {
  const f24 = path.join(tmp, "line24.wav");
  const f16 = path.join(tmp, "line16.wav");
  writeFileSync(f24, wav(samples));
  spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-i", f24, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", f16]);
  const r = spawnSync(path.join(WHISPER, "main.exe"), ["-m", path.join(WHISPER, "ggml-small.bin"), "-f", f16, "-nt", "-l", "en"], { encoding: "utf8", timeout: 180_000 });
  return r.stdout.trim().replace(/\s+/g, " ");
};

// ---- run ----------------------------------------------------------------------
const t0 = Date.now();
const log = (msg) => console.log(`  [${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}`);
const stats = { requests: 0, outTokens: 0, throttled: [], networkRetries: 0 };
const report = { model: MODEL, voice, lines: [] };
const parts = [];
for (let n = Number(first); n <= Number(last); n++) {
  const line = dir.lines.find((l) => l.n === n);
  const req = MODEL.startsWith("gemini-3.8") ? to38(line) : to31(line);
  const expected = words(ep001v2.lines[n - 1].say);
  const attempts = [];
  let best = null;
  for (let a = 1; a <= MAX_TRIES; a++) {
    log(`line ${n}: request`);
    const raw = await synth(req);
    log(`got ${(raw.length / SR).toFixed(1)}s of audio, trimming`);
    const audio = trim(raw);
    log(`transcribing ${(audio.length / SR).toFixed(1)}s`);
    const heard = transcribe(audio);
    const got = words(heard);
    const ok = got.join(" ") === expected.join(" ");
    attempts.push({ heard, ok, seconds: Number((audio.length / SR).toFixed(2)) });
    console.log(`line ${n} try ${a}: ${ok ? "OK  " : "DIFF"} ${(audio.length / SR).toFixed(2)}s  "${heard}"`);
    if (!best || ok) best = { audio, ok };
    if (ok) break;
  }
  report.lines.push({ n, request: req, expected: ep001v2.lines[n - 1].say, attempts, final: best.ok ? "match" : "MISMATCH (kept first take)" });
  log(`normalising line ${n}`);
  parts.push(normalise(best.audio));
  if (n < Number(last)) parts.push(new Float32Array(Math.round((PAUSE_AFTER[n] ?? DEFAULT_PAUSE) * SR)));
}
const total = new Float32Array(parts.reduce((a, p) => a + p.length, 0));
let o = 0;
for (const p of parts) {
  total.set(p, o);
  o += p.length;
}
writeFileSync(outFile, wav(total));
report.seconds = Number((total.length / SR).toFixed(2));
report.loudnessLUFS = Number(integratedLoudness([total], SR).toFixed(1));
report.stats = stats;
writeFileSync(outFile.replace(/\.wav$/, ".json"), JSON.stringify(report, null, 2) + "\n");
console.log(`${outFile}: ${report.seconds}s, ${report.loudnessLUFS} LUFS, ${stats.requests} requests, ${stats.outTokens} audio tokens, throttled ${stats.throttled.length}x`);
