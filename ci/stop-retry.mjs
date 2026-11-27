// What happens to an episode that stopped with CHECK NEEDED in the cloud (workflow only; Claude never runs this).
//
//   node ci/stop-retry.mjs start   before Claude: decide whether this run retries the stopped episode
//   node ci/stop-retry.mjs end     after delivery: remember the stop in the state file
//
// Rule (owner, 18 Nov 2026):
//   - The first run after a stop always tries once more, with fresh attempt counters (a fix may have landed,
//     or the failure may not repeat).
//   - If that retry stops again, later runs do NOT call Claude for this episode (safe stop, no spend, no new
//     log lines) until a new commit by someone other than the workflow bot changes the channel's project
//     folder, ci/ or .github/ (a fix). Then it tries once more, and so on.
//
// The stop is kept in the state file as  "cloudStop": { "fixMark": "<commit>", "retried": true|false, "date": "..." }.
// Environment: PROJECT (project folder), GITHUB_OUTPUT, GITHUB_STEP_SUMMARY.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const project = process.env.PROJECT;
if (!project) throw new Error("PROJECT is not set");
const STATE = path.join(repo, project, ".episode_state.json");
const RESULT = path.join(repo, "ci-out", "result.json");
const CONTEXT = path.join(repo, "ci-out", "context.json");
const out = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
const summary = (t) => {
  console.log(t);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${t}\n\n`);
};
const readJson = (f) => JSON.parse(readFileSync(f, "utf8"));
const writeJson = (f, o) => writeFileSync(f, `${JSON.stringify(o, null, 2)}\n`);

// Latest commit that is not the workflow bot's and touches what a fix would touch.
const fixMark = () => {
  const r = spawnSync("git", ["log", "-1", "--format=%H", "--perl-regexp", "--author=^(?!github-actions)",
    "--", project, "ci", ".github", `:(exclude)${project}/.episode_state.json`, `:(exclude)${project}/.tts-quota.json`],
    { cwd: repo, encoding: "utf8" });
  return (r.stdout ?? "").trim() || "unknown";
};

// ---------- parking (owner 27 Nov 2026: never stuck) ----------
// A stopped episode gets one automatic retry. If the retry stops too, the episode is PARKED: its state moves to
// <project>/parked/<Ep>.json and the next run starts the NEXT topic at once. A parked episode gets one repair attempt
// per day (only when tomorrow is already covered, so a repair never costs a day) and is dropped after 3 days
// (moved to <project>/parked/dropped/, kept for the owner). Fakta Ep020 blocked its channel 25-26 Nov under the old
// rule (wait for a human commit).
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
const PARKED = path.join(repo, project, "parked");
const today = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const logLine = (t) => appendFileSync(path.join(repo, "shared", "PROJECT_LOG.md"), `${t}\n`);
const park = (state, why) => {
  mkdirSync(PARKED, { recursive: true });
  const f = path.join(PARKED, `${state.episode}.json`);
  const old = existsSync(f) ? readJson(f) : null;
  writeJson(f, { ...state, parked: { since: old?.parked?.since ?? today(), attempts: (old?.parked?.attempts ?? 0) + (old ? 1 : 0), lastAttempt: today(), reason: why } });
  rmSync(STATE, { force: true });
  logLine(`- **PARKED (${today()}):** ${project} ${state.episode}: ${why}. The next run makes the next topic; one repair attempt per day while tomorrow is covered, dropped after 3 days.`);
  summary(`**Parked** ${state.episode}: ${why}`);
};
const parkedList = () => (existsSync(PARKED) ? readdirSync(PARKED).filter((f) => /^Ep\d{3}.*\.json$/.test(f)).map((f) => ({ f: path.join(PARKED, f), s: readJson(path.join(PARKED, f)) })) : []);

const cmd = process.argv[2];
if (cmd === "start") {
  const mark = fixMark();
  out("fix_mark", mark);
  if (!existsSync(STATE)) {
    out("skip", "false");
    out("retry", "false");
    // drop parked episodes older than 3 days; repair one per day when tomorrow is covered (COVERED=true from the plan)
    for (const p of parkedList()) {
      if ((Date.parse(today()) - Date.parse(p.s.parked?.since ?? today())) / 86400000 >= 3) {
        mkdirSync(path.join(PARKED, "dropped"), { recursive: true });
        renameSync(p.f, path.join(PARKED, "dropped", path.basename(p.f)));
        logLine(`- **DROPPED (${today()}):** ${project} ${p.s.episode} was parked since ${p.s.parked?.since} and is dropped (kept in ${project}/parked/dropped/). Reason: ${p.s.parked?.reason ?? ""}`);
      }
    }
    const due = parkedList().find((p) => p.s.parked?.lastAttempt !== today());
    if (due && process.env.COVERED === "true" && process.env.KIND !== "redo") {
      const { parked, cloudStop, voiceAttempts, ...st } = due.s;
      writeJson(STATE, { ...st, repairOf: parked });
      writeJson(due.f, { ...due.s, parked: { ...parked, lastAttempt: today() } });
      const ctx = readJson(CONTEXT);
      writeJson(CONTEXT, { ...ctx, retryAfterStop: true, repairParked: true });
      out("retry", "true");
      summary(`Repair attempt for parked ${st.episode} (parked ${parked?.since}: ${parked?.reason ?? ""}).`);
    }
  } else {
    const state = readJson(STATE);
    const stop = state.cloudStop;
    if (stop && stop.retried) {
      park(state, `stopped twice (${String(stop.reason ?? "").slice(0, 160)})`);
      out("skip", "false");
      out("retry", "false");
    } else if (stop) {
      // Fresh try: attempt counters reset, the stop forgotten (Claude reads retryAfterStop in context.json).
      delete state.cloudStop;
      delete state.voiceAttempts;
      writeJson(STATE, state);
      const ctx = readJson(CONTEXT);
      writeJson(CONTEXT, { ...ctx, retryAfterStop: true, fixLanded: stop.fixMark !== mark });
      out("skip", "false");
      out("retry", "true");
      summary(`Retrying ${state.episode} after its stop on ${stop.date} (${stop.fixMark !== mark ? "a fix landed since" : "first automatic retry"}).`);
    } else {
      out("skip", "false");
      out("retry", "false");
    }
  }
} else if (cmd === "end") {
  if (!existsSync(STATE) || !existsSync(RESULT)) process.exit(0);
  const result = readJson(RESULT);
  if (result.status !== "check-needed") process.exit(0);
  const state = readJson(STATE);
  if (state.cloudStop) process.exit(0); // a skipped run: keep the stop as it was
  const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  state.cloudStop = { fixMark: process.env.FIX_MARK || fixMark(), retried: process.env.RETRY === "true", date: today, reason: result.reason ?? "" };
  writeJson(STATE, state);
  if (process.env.RETRY === "true") park(state, `stopped again after its retry: ${String(result.reason ?? "").slice(0, 200)}`);
  console.log(`stop-retry: stop remembered (${state.cloudStop.retried ? "after a retry: waits for a fix" : "next run retries once"})`);
} else {
  console.error("usage: stop-retry.mjs start | end");
  process.exit(1);
}
