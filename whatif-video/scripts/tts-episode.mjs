// Gemini narration for a whole episode with as few requests as possible.
//
//   node scripts/tts-episode.mjs <episodeId> --voice Puck [--lines 1-19] [--out tts-out/<id>-<voice>]
//
// 1. ONE request for the whole episode (per-line style, <long pause> between lines)
// 2. whisper.cpp transcribes it with word timestamps; each line is matched to the script
// 3. the take is split into per-line clips (silence + timestamps), trimmed and normalised
// 4. only lines with extra/missing words are re-generated, one request each (max 2 retries)
// 5. clips are re-timed with the episode's own pauses (preview.wav) and saved for the video
//    (lineNN.wav + voices.json, same format as the Kokoro voices)
// Models: gemini-3.8-flash-tts first, then gemini-3.1-flash-tts-preview when its daily
// free quota is used up; if both are, it stops cleanly (exit code 3). Requests per model per
// day are counted in .tts-quota.json. Every API response is cached in <out>/raw/, so a re-run
// (e.g. after the quota resets) continues without paying for the same audio twice.
//
// Offline test (no API calls): --offline-take <wav> --offline-model <model> [--offline-regen kokoro]
//   uses an existing WAV as the "episode response" and Kokoro clips as "re-generated lines".

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checkLine, normWords } from "./tts/align.mjs";
import { concat, frameLevels, silentRuns, normalise, readWav, SR, silence, trim, wavBuffer, writeWav } from "./tts/audio.mjs";
import { HURRY, MODELS, QuotaExhaustedError, RequestBudgetError, TtsClient } from "./tts/gemini.mjs";
import { DEFAULT_QUOTA_FILE, Quota } from "./tts/quota.mjs";

const root = path.resolve(import.meta.dirname, "..");
const DEFAULT_PAUSE = 0.35; // same as src/whatif/timing.ts
// where to look for the gap after a line (seconds around whisper's word times, which are approximate)
// candidate line ends: between words x 0.15 s and words x 0.55 s + 2.5 s after the line's start
const CUT_MIN_PER_WORD = 0.15;
const CUT_MAX_PER_WORD = 0.55;
const CUT_MAX_EXTRA = 2.5;
const MAX_CUT_TRIES = 14;

// Offline stand-in for the HTTP transport: serves files instead of calling Google.
export const offlineTransport = ({ take, episodeId, regen = "kokoro", dailyLimitHit = [] }) => async (model, body, label) => {
  if (dailyLimitHit.includes(model)) {
    return { status: 429, json: { error: { message: `Rate limit exceeded for model ${model} (limit: 10 requests per day on Free Tier). Please retry in 5h0m0s` } } };
  }
  let file;
  if (label.startsWith("episode")) file = take;
  else if (regen === "kokoro") file = path.join(root, "public", "voices", episodeId, `line${label.split(" ")[1].padStart(2, "0")}.wav`);
  else return { status: 500, json: { error: { message: "offline: no audio for this request" } } };
  const data = readFileSync(file).toString("base64");
  return model.startsWith("gemini-3.8")
    ? { status: 200, json: { steps: [{ type: "model_output", content: [{ type: "audio", mime_type: "audio/wav", data }] }] } }
    : { status: 200, json: { candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/wav", data } }] } }] } };
};

// allowHurry: only for the offline self-test, which replays old episodes' directions
export const runEpisode = async ({ episodeId, voice, from = 1, to, out, quotaFile = DEFAULT_QUOTA_FILE, models = MODELS, transport, maxRetries = 2, maxRequests = Infinity, log = console.log, allowHurry = false }) => {
  const { [episodeId]: ep } = await import(pathToFileURL(path.join(root, "src", "whatif", "episodes", `${episodeId}.ts`)).href);
  const dir = JSON.parse(readFileSync(path.join(root, "tests", `${episodeId}_voice_direction.json`), "utf8"));
  to ??= ep.lines.length;
  const ids = [];
  for (let n = from; n <= to; n++) ids.push(n);
  const directions = ids.map((n) => dir.lines.find((l) => l.n === n));
  for (const text of allowHurry ? [] : [dir.persona ?? "", ...directions.map((d) => d?.style ?? "")]) {
    const m = HURRY.exec(text);
    if (m) throw new Error(`voice direction asks for speed ("${m[0]}"): write it clear and unhurried, with punch on the key line (owner rule, 12 Nov)`);
  }
  for (const d of directions) {
    if (normWords(d.tagged).join(" ") !== normWords(ep.lines[d.n - 1].say).join(" ")) throw new Error(`direction for line ${d.n} doesn't say the script's words`);
  }

  out ??= path.join(root, "tts-out", `${episodeId}-${voice}`);
  const rawDir = path.join(out, "raw");
  mkdirSync(rawDir, { recursive: true });
  const quota = new Quota(quotaFile);
  const client = new TtsClient({ quota, voice, persona: dir.persona, models, transport, log, maxRequests });
  client.episodeId = episodeId; // ci/gemini-guard.mjs: in the cloud only the state file's episode may spend requests
  const report = { episodeId, voice, lines: `${from}-${to}`, requests: [], result: {} };
  const finish = (status) => {
    report.status = status;
    report.requests = client.sent;
    report.serverErrors = client.failed;
    report.quotaLeft = Object.fromEntries(models.map((m) => [m, quota.left(m)]));
    writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
    return report;
  };

  // cached API audio, so re-runs never pay twice
  const cached = async (name, make) => {
    const wav = path.join(rawDir, `${name}.wav`);
    const meta = path.join(rawDir, `${name}.json`);
    if (existsSync(wav) && existsSync(meta)) return { audio: readWav(wav), ...JSON.parse(readFileSync(meta, "utf8")), cached: true };
    const r = await make();
    writeWav(wav, r.audio);
    writeFileSync(meta, JSON.stringify({ model: r.model }) + "\n");
    return r;
  };

  try {
    // 1. whole episode in one request
    log(`episode ${episodeId}, lines ${from}-${to}, voice ${voice}`);
    const take = await cached("episode", () => client.episode(directions));
    report.model = take.model;
    log(`  take: ${(take.audio.length / SR).toFixed(1)}s from ${take.model}${take.cached ? " (cached)" : ""}`);

    // 2 + 3. split at the silence between lines and check each line. Silence length alone can't
    // tell the gap between lines from a dramatic pause inside one ("Mount ... EVEREST"), so each
    // candidate cut is tried in turn (longest silence first) and the first one whose clip,
    // transcribed on its own, says exactly the line wins: too early drops the last word, too
    // late grabs the next line's first word. (Whisper's word TIMES on a whole take drift across
    // long pauses, so they are not used.) This costs local whisper time only, never API requests.
    const levels = frameLevels(take.audio);
    const takeLen = take.audio.length / SR;
    const clipAt = (a, b) => trim(take.audio.slice(Math.round(a * SR), Math.round(b * SR)));
    const clips = {};
    let start = 0;
    ids.forEach((n, k) => {
      const last = k === ids.length - 1;
      // Whisper's word TIMES drift across long pauses (it places words inside silences), so
      // the search window comes from the line's length in words, not from whisper's times:
      // every silence where this line could plausibly end is a candidate.
      const nWords = normWords(ep.lines[n - 1].say).length;
      const lo = start + Math.max(0.5, nWords * CUT_MIN_PER_WORD);
      const hi = Math.min(takeLen, start + nWords * CUT_MAX_PER_WORD + CUT_MAX_EXTRA);
      // true silences first, then quiet dips (some lines run almost straight into the next)
      const silent = silentRuns(levels, lo, hi, 0.06);
      const dips = silentRuns(levels, lo, hi, 0.06, -32).filter((d) => silent.every((r) => Math.abs(r.mid - d.mid) > 0.1));
      const cands = last ? [{ mid: takeLen }] : [...silent, ...dips].slice(0, MAX_CUT_TRIES);
      if (!cands.length) cands.push({ mid: Math.min(takeLen, (lo + hi) / 2) });
      let pick = null;
      for (const c of cands) {
        const own = checkLine(ep.lines[n - 1].say, clipAt(start, c.mid));
        if (!pick || own.errors < pick.own.errors) pick = { cut: c.mid, own };
        if (own.ok) break;
      }
      const audio = clipAt(start, pick.cut);
      clips[n] = { audio, errors: pick.own.ok ? 0 : Math.max(1, pick.own.errors), notes: pick.own.notes, source: "episode take", model: take.model };
      log(`  line ${String(n).padStart(2)}: ${pick.own.ok ? "OK  " : "DIFF"} ${(audio.length / SR).toFixed(2)}s${pick.own.notes.length ? `  (${pick.own.notes.join("; ")})` : ""}`);
      start = pick.cut;
    });

    // 4. re-generate only the lines that don't match, one request each
    regen: for (const n of ids.filter((x) => clips[x].errors > 0)) {
      for (let attempt = 1; attempt <= maxRetries && clips[n].errors > 0; attempt++) {
        let r;
        try {
          r = await cached(`line${String(n).padStart(2, "0")}_try${attempt}`, () => client.line(directions[ids.indexOf(n)], take.model));
        } catch (e) {
          if (!(e instanceof RequestBudgetError)) throw e;
          log(`  ${e.message}: lines still wrong are kept as they are and reported`);
          break regen;
        }
        const audio = trim(r.audio);
        const check = checkLine(ep.lines[n - 1].say, audio);
        log(`  line ${String(n).padStart(2)} retry ${attempt}: ${check.errors === 0 ? "OK  " : "DIFF"} ${(audio.length / SR).toFixed(2)}s from ${r.model}${r.cached ? " (cached)" : ""}${check.notes.length ? `  (${check.notes.join("; ")})` : ""}`);
        if (check.errors < clips[n].errors) clips[n] = { audio, errors: check.errors, notes: check.notes, source: `retry ${attempt}`, model: r.model };
      }
    }

    // 5. normalise, save per-line clips + durations, and a preview with our own pauses
    const parts = [];
    const durations = [];
    ids.forEach((n, k) => {
      const audio = normalise(clips[n].audio);
      writeWav(path.join(out, `line${String(n).padStart(2, "0")}.wav`), audio);
      durations.push(Number((audio.length / SR).toFixed(3)));
      if (k > 0) parts.push(silence(ep.lines[n - 1].pause ?? DEFAULT_PAUSE));
      parts.push(audio);
      report.result[n] = { seconds: durations[k], source: clips[n].source, model: clips[n].model, ok: clips[n].errors === 0, notes: clips[n].notes };
      if (clips[n].model !== take.model) log(`  note: line ${n} comes from ${clips[n].model}, the rest from ${take.model} (may sound slightly different)`);
    });
    writeFileSync(path.join(out, "preview.wav"), wavBuffer(concat(parts)));
    writeFileSync(
      path.join(out, "voices.json"),
      JSON.stringify({ narrator: { engine: "gemini", voice, models: [...new Set(Object.values(clips).map((c) => c.model))] }, firstLine: from, durations }, null, 2) + "\n",
    );
    const bad = ids.filter((n) => clips[n].errors > 0);
    report.previewSeconds = Number((concat(parts).length / SR).toFixed(2));
    log(`  preview.wav ${report.previewSeconds}s; ${bad.length ? `STILL WRONG: lines ${bad.join(", ")}` : "all lines match the script"}`);
    log(`  requests this run: ${client.sent.length} (${client.sent.map((s) => `${s.label}: ${s.model}`).join(", ") || "none"})`);
    log(quota.summary(models).replace(/^/gm, "  "));
    return finish(bad.length ? "done with mismatches" : "done");
  } catch (e) {
    if (e instanceof QuotaExhaustedError) {
      log(`STOPPED: ${e.message}`);
      log("Everything generated so far is cached in raw/; run the same command again after the reset to continue.");
      finish("stopped: quota exhausted");
      e.handled = true;
    }
    throw e;
  }
};

// ---- CLI ---------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? undefined : args[i + 1];
  };
  const episodeId = args[0];
  const voice = opt("voice");
  if (!episodeId || !voice) {
    console.error("Usage: node scripts/tts-episode.mjs <episodeId> --voice <name> [--lines a-b] [--out dir] [--max-requests N] [--offline-take wav --offline-model model]");
    process.exit(1);
  }
  const [from, to] = (opt("lines") ?? "").split("-").map(Number);
  const take = opt("offline-take");
  const transport = take ? offlineTransport({ take, episodeId }) : undefined;
  try {
    await runEpisode({
      episodeId,
      voice,
      from: from || 1,
      to: to || undefined,
      out: opt("out"),
      quotaFile: opt("quota-file"),
      maxRequests: opt("max-requests") ? Number(opt("max-requests")) : Infinity,
      // offline: pretend the take came from this model
      models: take && opt("offline-model") ? [opt("offline-model")] : MODELS,
      transport,
    });
  } catch (e) {
    if (e.handled) process.exit(3);
    console.error(e.message);
    process.exit(1);
  }
}
