// Offline test of the TTS pipeline: no API calls, temporary quota files.
// Usage: node scripts/tts-selftest.mjs
// Uses the voice tests in tests/ as stand-ins for API responses and the Kokoro
// clips as stand-ins for re-generated lines. Outputs go to tests/offline_run/.

import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checkLine } from "./tts/align.mjs";
import { readWav } from "./tts/audio.mjs";
import { ALL_MODELS, QuotaExhaustedError, TtsClient } from "./tts/gemini.mjs";
import { Quota } from "./tts/quota.mjs";
import { offlineTransport, runEpisode } from "./tts-episode.mjs";

const root = path.resolve(import.meta.dirname, "..");
const { ep001v2 } = await import(pathToFileURL(path.join(root, "src", "whatif", "episodes", "ep001v2.ts")).href);
const tmp = mkdtempSync(path.join(os.tmpdir(), "tts-selftest-"));
const M38 = "gemini-3.8-flash-tts";
const M31 = "gemini-3.1-flash-tts-preview";
let failed = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failed++;
};
const quiet = () => {};
const take = (f) => path.join(root, "tests", f);
const line1 = { n: 1, style: "excited", tagged: "[excited] What if a raindrop DOUBLED in size, every second?" };

// ---- 1. quota + model fallback ----------------------------------------------------
{
  const q = new Quota(path.join(tmp, "q1.json"));
  const c = new TtsClient({ quota: q, voice: "Puck", persona: "p", models: ALL_MODELS, transport: offlineTransport({ take: take("voice38_A.wav"), episodeId: "ep001v2" }), log: quiet });
  const r = await c.line(line1);
  check(r.model === M38 && q.left(M38) === 9 && q.left(M31) === 10, "fresh day: uses 3.8 first and counts the request (9/10 left)");
}
{
  const q = new Quota(path.join(tmp, "q2.json"));
  const c = new TtsClient({ quota: q, voice: "Puck", persona: "p", models: ALL_MODELS, transport: offlineTransport({ take: take("voice38_A.wav"), episodeId: "ep001v2", dailyLimitHit: [M38] }), log: quiet });
  const r = await c.line(line1);
  check(r.model === M31, "3.8 answers 'per day' 429: falls back to 3.1 automatically");
  check(q.left(M38) === 0 && q.left(M31) === 9, "the 429 marks 3.8 used up for today; 3.1 counted (9/10 left)");
  const again = await c.line(line1);
  check(again.model === M31 && c.sent.filter((s) => s.model === M38).length === 0, "next request skips 3.8 without calling it");
}
{
  const q = new Quota(path.join(tmp, "q3.json"));
  const c = new TtsClient({ quota: q, voice: "Puck", persona: "p", models: ALL_MODELS, transport: offlineTransport({ take: take("voice38_A.wav"), episodeId: "ep001v2", dailyLimitHit: [M38, M31] }), log: quiet });
  let err = null;
  try {
    await c.line(line1);
  } catch (e) {
    err = e;
  }
  check(err instanceof QuotaExhaustedError, "both models out: stops with a clear 'out of free requests' error");
  check(/Next reset/.test(err?.message ?? ""), `error says when to come back: "${(err?.message ?? "").split("\n").pop()}"`);
}

{
  // project default (owner rule): 3.8 only, so a daily limit on 3.8 must STOP, not fall back
  const q = new Quota(path.join(tmp, "q4.json"));
  const c = new TtsClient({ quota: q, voice: "Puck", persona: "p", transport: offlineTransport({ take: take("voice38_A.wav"), episodeId: "ep001v2", dailyLimitHit: [M38] }), log: quiet });
  let err = null;
  try {
    await c.line(line1);
  } catch (e) {
    err = e;
  }
  check(err instanceof QuotaExhaustedError && c.sent.length === 0, "project default: 3.8 out of quota -> stops, never touches 3.1");
}

// ---- 2. whole flow on real takes ------------------------------------------------------
const flow = async (name, opts) => {
  const out = path.join(root, "tests", "offline_run", name);
  rmSync(out, { recursive: true, force: true });
  console.log(`\n--- ${name} ---`);
  const report = await runEpisode({ episodeId: "ep001v2", voice: "Puck", out, quotaFile: path.join(tmp, `${name}.json`), log: (m) => console.log(`  ${m}`), allowHurry: true, ...opts });
  // Independent check of the saved files: every clip reported OK must, transcribed on
  // its own, say exactly its script line (no neighbour's words from a bad cut).
  const wrong = Object.entries(report.result)
    .filter(([, r]) => r.ok)
    .map(([n]) => [n, checkLine(ep001v2.lines[n - 1].say, readWav(path.join(out, `line${String(n).padStart(2, "0")}.wav`)))])
    .filter(([, c]) => !c.ok)
    .map(([n, c]) => `${n} (${c.notes.join("; ")})`);
  check(wrong.length === 0, `${name}: every saved clip marked OK really holds exactly its line${wrong.length ? ` (wrong: ${wrong.join(", ")})` : ""}`);
  return report;
};

// 3.1 whole-episode take (19 lines). Kokoro clips stand in for re-generated lines.
let r = await flow("full_A_31", { models: [M31], from: 1, to: 19, transport: offlineTransport({ take: take("voice_test_full_A.wav"), episodeId: "ep001v2" }) });
check(Object.keys(r.result).length === 19 && r.status === "done", `full episode: 19 clips, all lines match after re-generation (${r.requests.length} requests)`);
check(r.requests.length <= 1 + 2 * 19 && r.requests[0].label === "episode", "1 request for the episode + only the mismatched lines");

// Fenrir take with an ad-lib ("That's as tall as a house"): line 7 must be caught
r = await flow("B_31_adlib", { models: [M31], from: 1, to: 7, transport: offlineTransport({ take: take("voice_test_B.wav"), episodeId: "ep001v2" }) });
check(r.result[7]?.source.startsWith("retry"), `ad-libbed line 7 detected and replaced (${r.result[7]?.source})`);

// 3.8 per-line take joined earlier: everything should match, no extra requests
r = await flow("A_38_clean", { models: [M38], from: 1, to: 7, transport: offlineTransport({ take: take("voice38_A.wav"), episodeId: "ep001v2" }) });
check(r.requests.length === 1 && r.status === "done", `clean take: exactly 1 request, nothing re-generated (${r.requests.length})`);

// Re-run: the cached take is reused, 0 new requests
r = await flow("A_38_clean_rerun", { models: [M38], from: 1, to: 7, transport: offlineTransport({ take: take("voice38_A.wav"), episodeId: "ep001v2" }) });
const out = path.join(root, "tests", "offline_run", "A_38_clean_rerun");
r = await runEpisode({ episodeId: "ep001v2", voice: "Puck", out, from: 1, to: 7, models: [M38], allowHurry: true, quotaFile: path.join(tmp, "rerun.json"), transport: offlineTransport({ take: take("voice38_A.wav"), episodeId: "ep001v2" }), log: quiet });
check(r.requests.length === 0, "re-running the same episode reuses the cache: 0 requests");

// Quota runs out mid-episode: stops cleanly, keeps what it has
{
  const q = new Quota(path.join(tmp, "stop.json"));
  for (let i = 0; i < 10; i++) q.record(M31); // 3.1 used up today
  q.record(M38);
  for (let i = 0; i < 8; i++) q.record(M38); // 3.8: 1 left -> enough for the episode, none for retries
  let stopped = false;
  try {
    await flow("B_quota_stop", { models: [M38, M31], from: 1, to: 7, quotaFile: path.join(tmp, "stop.json"), transport: offlineTransport({ take: take("voice_test_B.wav"), episodeId: "ep001v2" }) });
  } catch (e) {
    stopped = e instanceof QuotaExhaustedError;
  }
  check(stopped, "quota runs out before the re-generation: stops cleanly (exit 3 in the CLI), take cached for later");
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failed ? `${failed} FAILED` : "all passed"}`);
process.exit(failed ? 1 : 0);
