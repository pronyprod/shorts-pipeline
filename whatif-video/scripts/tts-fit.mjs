// Fits a Gemini narration (output of scripts/tts-episode.mjs) to the episode length
// and installs it for the video. No API calls.
//
//   node scripts/tts-fit.mjs <episodeId> --from tts-out/<id>-<voice> [--target 72] [--max-pause 0.45]
//
// 1. pauses INSIDE a line longer than --max-pause are shortened to it (the drama stays,
//    the dead air goes); pauses BETWEEN lines come from the episode data as usual
// 2. if the episode would still be longer than --target seconds, every line is sped up by
//    the same pitch-preserving tempo (ffmpeg atempo), never more than MAX_TEMPO (1.05x, owner rule
//    12 Nov 2026: Ep010 at 1.25x was far too fast). Still longer than MAX_LEN at 1.05x: STOP (exit 4),
//    cut words from the script and re-take; never speed up more.
// 3. every line, main take or re-take, is cleaned the same way (scripts/voice-clean.mjs: one shared noise
//    floor, end bursts and breaths removed, short fades), then loudness-matched; the join check must pass
// 4. each final clip is re-checked with whisper against its script line
// 5. writes public/voices/<id>/lineNN.wav and src/whatif/episodes/<id>.voices.json
//    (--out <dir>: write the clips there instead and leave the episode files alone, for tests)

import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FFMPEG } from "./loudness.mjs";
import { checkLine } from "./tts/align.mjs";
import { checkLines, cleanLine, fades, trimLeftoverEdges } from "./voice-clean.mjs";
import { concat, FRAME, frameLevels, normalise, pcm16ToFloat, readWav, SILENCE_DB, SR, wavBuffer, writeWav } from "./tts/audio.mjs";

const MAX_TEMPO = 1.05;
const MAX_LEN = 60; // seconds (Round 3 range 40-60 s)
const MIN_LEN = 40;
const DEFAULT_PAUSE = 0.35; // same as src/whatif/timing.ts
const TAIL = 0.6; // template 2/3 end hold

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const episodeId = args[0];
const from = opt("from");
if (!episodeId || !from) {
  console.error("Usage: node scripts/tts-fit.mjs <episodeId> --from <tts-out dir> [--target 72] [--max-pause 0.45]");
  process.exit(1);
}
const target = Number(opt("target", 56));
const outOpt = opt("out");
const maxPause = Number(opt("max-pause", 0.45));
const root = path.resolve(import.meta.dirname, "..");
const { [episodeId]: ep } = await import(pathToFileURL(path.join(root, "src", "whatif", "episodes", `${episodeId}.ts`)).href);
const src = path.resolve(root, from);
const srcVoices = JSON.parse(readFileSync(path.join(src, "voices.json"), "utf8"));

// 1. shorten long pauses inside each line
const capPauses = (s) => {
  const lv = frameLevels(s);
  const win = Math.round(FRAME * SR);
  const keep = Math.round((maxPause / 2) * SR);
  const parts = [];
  let pos = 0;
  let run = null;
  let cut = 0;
  for (let i = 0; i <= lv.length; i++) {
    if (i < lv.length && lv[i] <= SILENCE_DB) run ??= i;
    else if (run !== null) {
      const a = run * win;
      const b = i * win;
      if (a > 0 && i < lv.length && b - a > maxPause * SR) {
        parts.push(s.slice(pos, a + keep));
        pos = b - keep;
        cut += (b - a - 2 * keep) / SR;
      }
      run = null;
    }
  }
  parts.push(s.slice(pos));
  return { audio: concat(parts), cut };
};

const clips = ep.lines.map((_, i) => {
  const r = capPauses(readWav(path.join(src, `line${String(i + 1).padStart(2, "0")}.wav`)));
  return r;
});
const speech = clips.reduce((a, c) => a + c.audio.length / SR, 0);
const pauses = ep.lines.slice(1).reduce((a, l) => a + (l.pause ?? DEFAULT_PAUSE), 0);
const tempo = Math.min(MAX_TEMPO, Math.max(1, speech / (target - pauses - TAIL)));
console.log(
  `inner pauses capped at ${maxPause}s: -${clips.reduce((a, c) => a + c.cut, 0).toFixed(1)}s; speech ${speech.toFixed(1)}s + pauses ${pauses.toFixed(1)}s + tail ${TAIL}s; tempo ${tempo.toFixed(3)}x`,
);

// 2. same tempo for every line (pitch kept)
const atempo = (s) => {
  if (tempo === 1) return s;
  const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-f", "wav", "-i", "pipe:0", "-af", `atempo=${tempo.toFixed(4)}`, "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"], {
    input: wavBuffer(s),
    maxBuffer: 1e8,
  });
  if (r.status !== 0) throw new Error(`ffmpeg atempo failed: ${r.stderr}`);
  return pcm16ToFloat(r.stdout.subarray(r.stdout.indexOf("data") + 8));
};

// 3 + 4. clean, check and install
const outDir = outOpt ? path.resolve(root, outOpt) : path.join(root, "public", "voices", episodeId);
mkdirSync(outDir, { recursive: true });
const durations = [];
const problems = [];
const finals = [];
clips.forEach((c, i) => {
  const lvl = fades(normalise(cleanLine(atempo(c.audio), SR)), SR);
  // a short burst/breath left at the edges is cut here (no new recording); owner 26 Nov 2026
  const tr = trimLeftoverEdges(lvl, SR);
  if (tr.cut > 0) console.log(`AUTO-TRIM ${c.name ?? "line"}: ${tr.cut.toFixed(2)} s of burst/breath cut at the edges (no re-take)`);
  const audio = tr.s;
  finals.push(audio);
  const check = checkLine(ep.lines[i].say, audio);
  if (!check.ok) problems.push(`line ${i + 1}: ${check.notes.join("; ")}`);
  writeWav(path.join(outDir, `line${String(i + 1).padStart(2, "0")}.wav`), audio);
  durations.push(Number((audio.length / SR).toFixed(3)));
  console.log(`line ${String(i + 1).padStart(2)}: ${check.ok ? "OK  " : "DIFF"} ${(audio.length / SR).toFixed(2)}s${check.notes.length ? `  (${check.notes.join("; ")})` : ""}`);
});
const total = durations.reduce((a, b) => a + b, 0) + pauses + TAIL;
const joins = checkLines(finals, SR).filter((r) => !r.ok);
joins.forEach((r) => problems.push(`join line ${r.line}: ${r.problems.join("; ")}`));
if (outOpt) {
  console.log(`test output in ${outDir}; length ${total.toFixed(1)}s; ${problems.length ? `CHECK: ${problems.join(" | ")}` : "all checks passed"}`);
  process.exit(problems.length ? 1 : 0);
}
if (total > MAX_LEN) {
  console.log(`TOO LONG: ${total.toFixed(1)}s at tempo ${tempo.toFixed(3)}x (max ${MAX_LEN}s at ${MAX_TEMPO}x). Cut words from the script and re-take; never speed up more.`);
  process.exit(4);
}
writeFileSync(
  path.join(root, "src", "whatif", "episodes", `${episodeId}.voices.json`),
  JSON.stringify(
    {
      // every API answer is cached in raw/ (one .json each), across all runs of the pipeline
      narrator: { ...srcVoices.narrator, tempo: Number(tempo.toFixed(3)), innerPauseCap: maxPause, requests: readdirSync(path.join(src, "raw")).filter((f) => f.endsWith(".json")).length },
      durations,
    },
    null,
    2,
  ) + "\n",
);
console.log(`episode length ${total.toFixed(1)}s (target ${target}s, range ${MIN_LEN}-${MAX_LEN}s); ${problems.length ? `CHECK: ${problems.join(" | ")}` : "every line matches the script and every join is clean"}`);
if (total < MIN_LEN) console.log(`SHORT: ${total.toFixed(1)}s is under ${MIN_LEN}s; add a beat to the script if the story allows.`);
process.exit(problems.length ? 1 : 0);
