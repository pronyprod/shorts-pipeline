// The gate between Claude's "ready" and the release (owner, 18 Nov 2026: a part 2 that took 19 s / 7 turns
// must not be trusted on its word). Claude never runs this: the workflow does, before ci/deliver.mjs.
//
//   1. ci-out/result.json must carry `checks` with every mandatory check for the channel, each with pass: true
//      and its numbers (see ci/CLOUD_RULES.md, "Mandatory checks in the result file").
//   2. The workflow measures the MP4 itself (ffprobe, decode, length, loudness, true peak, silence) and compares
//      with Claude's numbers.
//   3. It re-runs the channel's own deterministic checks where a script exists (PomProds: line joins and the
//      episode self-test; Countryballs: whisper voice check).
// Any failure: CHECK NEEDED line in the log, result.json becomes "check-needed", and the state file is written
// back (the render stays in the work-in-progress cache), so nothing is released and the next run resumes at the checks.
// Environment: CHANNEL, PROJECT, GITHUB_STEP_SUMMARY, GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, PUBLISH_AT.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CHANNELS } from "./sheet.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const env = process.env;
const channel = env.CHANNEL;
const c = CHANNELS[channel];
if (!c) throw new Error("CHANNEL not set");
const RESULT = path.join(repo, "ci-out", "result.json");
const LOG = path.join(repo, "shared", "PROJECT_LOG.md");
const proj = path.join(repo, c.project);

// per channel: required checks, length range, silence threshold, the step a failed verification resumes at
const RULES = {
  countryballs: { need: ["voice", "loudness", "truePeak", "length", "silence", "facts", "file", "visual"], len: [15, 25], noise: -45, resumeStep: 4 },
  whatif: { need: ["voice", "loudness", "truePeak", "length", "silence", "lineJoins", "facts", "file", "visual"], len: [40, 60], noise: -50, resumeStep: 5 },
  fakta: { need: ["voice", "loudness", "truePeak", "length", "silence", "lineJoins", "facts", "file", "visual"], len: [40, 60], noise: -50, resumeStep: 5 },
}[channel];
// numbers each check must report
const NUMBERS = { voice: ["lines", "matched"], loudness: ["lufs"], truePeak: ["dbtp"], length: ["seconds"], silence: ["longestSeconds"], facts: ["sources"], visual: ["stills", "beats"] };

if (!existsSync(RESULT)) process.exit(0); // deliver reports a missing result
const result = JSON.parse(readFileSync(RESULT, "utf8"));
if (result.status !== "ready" || result.url) process.exit(0); // nothing to verify (or a delivery retry of a checked episode)

const run = (cmd, args, cwd = proj) => spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const problems = [];
const lines = [];
const ok = (msg) => lines.push(`- ok: ${msg}`);
const bad = (msg) => {
  problems.push(msg);
  lines.push(`- **FAIL: ${msg}**`);
};
const num = (v) => typeof v === "number" && Number.isFinite(v);

// ---------- 1. Claude's own report ----------
const checks = result.checks ?? {};
for (const k of RULES.need) {
  const ch = checks[k];
  if (!ch || typeof ch !== "object") bad(`result.json has no "${k}" check`);
  else if (ch.pass !== true) bad(`"${k}" check did not pass: ${JSON.stringify(ch).slice(0, 160)}`);
  else {
    const missing = (NUMBERS[k] ?? []).filter((n) => !num(ch[n]));
    if (missing.length) bad(`"${k}" check has no number for ${missing.join(", ")}`);
    else ok(`${k} reported: ${JSON.stringify(ch).slice(0, 140)}`);
  }
}
if (checks.voice && num(checks.voice.lines) && checks.voice.matched !== checks.voice.lines) bad(`voice: ${checks.voice.matched} of ${checks.voice.lines} lines matched`);
if (checks.visual && Array.isArray(checks.visual.issues) && checks.visual.issues.length) bad(`visual: open issues: ${checks.visual.issues.join("; ").slice(0, 200)}`);
if (checks.visual && num(checks.visual.stills) && num(checks.visual.beats) && checks.visual.stills < checks.visual.beats) bad(`visual: ${checks.visual.stills} stills for ${checks.visual.beats} beats (every beat needs one)`);

// ---------- 2. measure the MP4 ----------
const mp4 = path.join(proj, "renders", c.file(result.episode ?? ""));
if (!existsSync(mp4)) bad(`MP4 missing: ${path.relative(repo, mp4)}`);
else {
  const p = run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height:format=duration", "-of", "json", mp4]);
  let probe = {};
  try {
    probe = JSON.parse(p.stdout);
  } catch {}
  const v = (probe.streams ?? []).filter((s) => s.codec_type === "video");
  const a = (probe.streams ?? []).filter((s) => s.codec_type === "audio");
  const dur = Number(probe.format?.duration);
  if (p.status !== 0 || v.length !== 1 || a.length !== 1 || v[0].codec_name !== "h264" || v[0].width !== 1080 || v[0].height !== 1920) bad(`file: ffprobe ${JSON.stringify(probe.streams ?? p.stderr).slice(0, 200)}`);
  else ok(`file: h264 1080x1920 + ${a[0].codec_name}`);
  const dec = run("ffmpeg", ["-v", "error", "-i", mp4, "-f", "null", "-"]);
  if (dec.status !== 0 || dec.stderr.trim()) bad(`file: decode errors: ${dec.stderr.trim().slice(0, 160)}`);
  else ok("file: decodes without errors");
  if (!(dur >= RULES.len[0] && dur <= RULES.len[1])) bad(`length ${dur.toFixed(1)} s is outside ${RULES.len[0]}-${RULES.len[1]} s`);
  else ok(`length ${dur.toFixed(1)} s`);
  if (num(checks.length?.seconds) && Math.abs(checks.length.seconds - dur) > 0.5) bad(`length: result says ${checks.length.seconds} s, the file is ${dur.toFixed(2)} s`);

  const e = run("ffmpeg", ["-hide_banner", "-nostats", "-i", mp4, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const summaryText = e.stderr.slice(e.stderr.lastIndexOf("Summary:"));
  const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summaryText)?.[1]);
  const tp = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summaryText)?.[1]);
  if (!num(lufs) || lufs < -15 || lufs > -13) bad(`loudness ${lufs} LUFS (needs -14 ±1)`);
  else ok(`loudness ${lufs} LUFS`);
  if (!num(tp) || tp > -1) bad(`true peak ${tp} dBTP (needs <= -1)`);
  else ok(`true peak ${tp} dBTP`);
  if (num(checks.loudness?.lufs) && Math.abs(checks.loudness.lufs - lufs) > 0.5) bad(`loudness: result says ${checks.loudness.lufs}, the file measures ${lufs}`);
  if (num(checks.truePeak?.dbtp) && Math.abs(checks.truePeak.dbtp - tp) > 0.6) bad(`true peak: result says ${checks.truePeak.dbtp}, the file measures ${tp}`);

  const sd = run("ffmpeg", ["-hide_banner", "-nostats", "-i", mp4, "-af", `silencedetect=noise=${RULES.noise}dB:d=1`, "-f", "null", "-"]);
  const n = (sd.stderr.match(/silence_start/g) ?? []).length;
  if (n) bad(`silence: ${n} stretch(es) over 1 s at ${RULES.noise} dB`);
  else ok(`silence: none over 1 s at ${RULES.noise} dB`);
}

// ---------- 3. the channel's own scripts ----------
const ep = (result.episode ?? "").toLowerCase();
const script = (label, args, okRe) => {
  const r = run("node", args);
  const out = `${r.stdout}\n${r.stderr}`.trim();
  if (r.status !== 0 || (okRe && !okRe.test(out))) bad(`${label}: exit ${r.status}: ${out.split("\n").filter((l) => /FAIL|rror|problem/i.test(l)).slice(0, 3).join(" | ").slice(0, 200) || out.slice(-200)}`);
  else ok(`${label}: passes (${out.split("\n").filter(Boolean).pop()?.slice(0, 100)})`);
};
if (channel === "whatif") {
  if (existsSync(path.join(proj, "public", "voices", ep))) script("line joins (voice-clean check)", ["scripts/voice-clean.mjs", "check", `public/voices/${ep}`]);
  else bad(`line joins: public/voices/${ep} is missing, cannot re-check`);
  script("facts self-test", ["--no-warnings", `src/whatif/episodes/${ep}.ts`], /OK/);
  // owner, 22 Nov 2026: never the phrase "You see" in a PomProds episode
  const epFile = path.join(proj, "src", "whatif", "episodes", `${ep}.ts`);
  const spoken = existsSync(epFile) ? [...readFileSync(epFile, "utf8").matchAll(/(?:say|text): *[`"]([^`"]*)[`"]/g)].map((m) => m[1]).join(" ") : "";
  if (/\byou see\b/i.test(spoken)) bad('script uses the banned phrase "You see"');
  else ok('no "You see" in the script');
}
if (channel === "countryballs") script("voice check (whisper)", ["--no-warnings", "scripts/check-voices.mjs", ep], /All \d+ lines match/);

// ---------- verdict ----------
const runUrl = `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
const report = `### Mandatory checks, verified by the workflow (${c.sheetName} ${result.episode})\n${lines.join("\n")}`;
console.log(report);
if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${report}\n\n`);
if (!problems.length) process.exit(0);

const reason = `workflow check: ${problems.slice(0, 3).join("; ").slice(0, 300)}`;
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const text = readFileSync(LOG, "utf8");
writeFileSync(LOG, `${text.replace(/\s*$/, "")}\nCHECK NEEDED: ${c.sheetName} ${result.episode} ${reason}; nothing released, state kept at the checks (${today}, ${runUrl})\n`);
writeFileSync(RESULT, `${JSON.stringify({ status: "check-needed", episode: result.episode, reason, redo: result.redo }, null, 2)}\n`);
const STATE = path.join(proj, ".episode_state.json");
if (!existsSync(STATE)) {
  writeFileSync(STATE, `${JSON.stringify({ episode: result.episode, step: RULES.resumeStep, status: "check-needed", publishAt: env.PUBLISH_AT, redo: !!result.redo, reason, note: `The workflow's verification of the mandatory checks failed (${today}). The render is kept in renders/ (work-in-progress cache). Resume at the mandatory checks: run every one yourself, write all of them with their numbers into result.json; fix (and re-render) only what fails.` }, null, 2)}\n`);
}
console.log(`verify: ${problems.length} problem(s); not released`);
process.exit(1);
