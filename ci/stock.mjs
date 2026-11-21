// Does this run (round 1 or 2) make an episode? Owner, 21 Nov 2026: build a 3-day stock per channel, within limits.
// The workflow runs this before anything expensive; Claude never runs it.
//
//   node ci/stock.mjs plan          (writes make=true|false, kind=... to GITHUB_OUTPUT and the step summary)
//
// Rules (D = the run's start date in WIB; "latest" = the latest Publish at of the channel's live queue rows):
//   - round 1, latest < D+1 (nothing queued for tomorrow): MANDATORY, always make one (as before).
//   - round 1 with an unfinished episode (state file), a delivery to retry or a redo: always go on.
//   - anything else is STOCK and must pass every gate:
//       target     latest < D+3 (the queue reaches 3 days ahead); with STOCK off, round 1 keeps the old
//                  one-episode-per-run behaviour (no target) and round 2 never runs
//       uploads    queue rows Added in the last 24 h, all channels (REMOVED rows too: they were uploaded),
//                  plus this one, at most MAX_UPLOADS_24H (repository variable, default 4; Zapier/YouTube limit)
//       order      Country Flux first while building stock: a SECOND What If / Fakta episode only when Country
//                  Flux is already at target
//       Gemini     What If / Fakta: today's (Pacific day) requests for the channel's model, counted in both
//                  .tts-quota.json files, plus this episode's typical need, leave at least 3 spare of the daily limit
//       time       round 2 only: the minutes since the workflow run started plus this channel's typical
//                  episode time stay within 200 min
// Environment: CHANNEL, ROUND (1|2), TEST, STOCK (on|off), STOCK_FORCE (true = test: skip the target/order gates),
//              MAX_UPLOADS_24H, RUN_START, REDO, GOOGLE_SA_JSON, SHEET_ID, GH_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID,
//              GITHUB_OUTPUT, GITHUB_STEP_SUMMARY.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { CHANNELS, sheetGet } from "./sheet.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const env = process.env;
const channel = env.CHANNEL;
const c = CHANNELS[channel];
if (!c) throw new Error("CHANNEL not set");
const round = Number(env.ROUND || 1);
const stockOn = env.STOCK === "on";
const force = env.STOCK_FORCE === "true";
const maxUploads = Number(env.MAX_UPLOADS_24H || 4);
const TARGET_DAYS = 3;
const SPARE = 3;
const NEED = { whatif: { model: "gemini-3.8-flash-tts", requests: 3, minutes: 90 }, fakta: { model: "gemini-3.1-flash-tts-preview", requests: 4, minutes: 50 }, countryballs: { minutes: 35 } };

const WIB = 7 * 3600 * 1000;
const runStart = new Date(env.RUN_START || Date.now());
const ymd = (d) => new Date(d.getTime() + WIB).toISOString().slice(0, 10);
const addDays = (s, n) => new Date(Date.parse(`${s}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const D = ymd(runStart);

const out = (k, v) => env.GITHUB_OUTPUT && appendFileSync(env.GITHUB_OUTPUT, `${k}=${v}\n`);
const lines = [];
const decide = (make, kind, reason) => {
  out("make", make ? "true" : "false");
  out("kind", kind);
  const text = `**Round ${round} plan (${c.sheetName}): ${make ? "MAKE" : "SKIP"}, ${kind}.** ${reason}\n${lines.map((l) => `- ${l}`).join("\n")}`;
  console.log(text);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${text}\n\n`);
  process.exit(0);
};

// ---------- what the queues say ----------
const queues = {};
for (const [key, ch] of Object.entries(CHANNELS)) queues[key] = await sheetGet(`'${ch.queueTab}'!A:F`);
const latestOf = (key) =>
  queues[key]
    .slice(2)
    .map((r) => String(r[4] ?? "").slice(0, 10))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .pop() ?? "";
const ahead = (key) => {
  const l = latestOf(key);
  return l ? Math.round((Date.parse(l) - Date.parse(D)) / 86400000) : -99;
};
for (const key of Object.keys(CHANNELS)) lines.push(`${CHANNELS[key].sheetName}: latest queued ${latestOf(key) || "none"} = ${ahead(key)} day(s) ahead of ${D} (target ${TARGET_DAYS})`);

// queue rows Added in the last 24 h ("2026-11-21 04:19 (Claude)", WIB)
const addedAt = (cell) => {
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})/.exec(String(cell ?? ""));
  return m ? Date.parse(`${m[1]}T${m[2]}:${m[3]}:00+07:00`) : NaN;
};
const now = Date.now();
const recent = Object.values(queues).flatMap((rows) => rows.slice(2).map((r) => addedAt(r[5]))).filter((t) => t > now - 24 * 3600 * 1000 && t <= now + 60000);
lines.push(`uploads queued in the last 24 h (all channels): ${recent.length}; limit ${maxUploads}`);

const state = path.join(repo, c.project, ".episode_state.json");
const pending = path.join(repo, "ci", "pending", `${channel}.json`);

// ---------- round 1: always-go cases ----------
if (round === 1) {
  if (env.REDO) decide(true, "redo", `Redo of ${env.REDO}.`);
  if (existsSync(state)) decide(true, "resume", "An unfinished episode is in the state file: it is finished first.");
  if (existsSync(pending) && env.TEST !== "true") decide(true, "delivery-retry", "A delivery from an earlier run is retried.");
  if (ahead(channel) < 1) {
    if (recent.length + 1 > maxUploads) lines.push(`warning: this makes ${recent.length + 1} uploads in 24 h, over ${maxUploads}; made anyway because nothing is queued for tomorrow`);
    decide(true, "mandatory", `Nothing queued for ${addDays(D, 1)} yet.`);
  }
  if (!stockOn && !force) {
    // old behaviour: one episode per run, but never past the upload limit when tomorrow is already covered
    if (recent.length + 1 > maxUploads) decide(false, "upload-limit", `Tomorrow is covered and ${recent.length} uploads are already queued in 24 h.`);
    decide(true, "daily", "Stock is off: the usual one episode per run.");
  }
} else {
  if (!stockOn && !force) decide(false, "stock-off", "Stock building is off (repository variable STOCK).");
  if (env.REDO) decide(false, "redo", "No second episode after a redo.");
  if (existsSync(state)) decide(false, "unfinished", "The first episode of this run did not finish (state file).");
  if (existsSync(pending)) decide(false, "pending", "The first episode's delivery did not finish.");
  if (ahead(channel) < 1) decide(false, "first-failed", "Tomorrow is still not covered: the first episode did not deliver.");
}

// ---------- stock gates ----------
if (!force && ahead(channel) >= TARGET_DAYS) decide(false, "at-target", `${c.sheetName} already reaches ${TARGET_DAYS} days ahead.`);
// (only for a SECOND episode: a channel's own daily episode keeps its level and is not held back)
if (!force && round === 2 && channel !== "countryballs" && ahead("countryballs") < TARGET_DAYS)
  decide(false, "countryballs-first", `Country Flux first while building stock (it is ${ahead("countryballs")} day(s) ahead).`);
if (env.TEST !== "true" && recent.length + 1 > maxUploads)
  decide(false, "upload-limit", `${recent.length} uploads already queued in the last 24 h; one more would pass ${maxUploads}.`);
if (NEED[channel].model) {
  const pacific = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  let used = 0;
  let limit = 10;
  for (const p of ["whatif-video", "fakta-video"]) {
    const f = path.join(repo, p, ".tts-quota.json");
    if (!existsSync(f)) continue;
    const q = JSON.parse(readFileSync(f, "utf8"));
    used += q.days?.[pacific]?.[NEED[channel].model]?.used ?? 0;
    limit = q.limits?.[NEED[channel].model]?.perDay ?? limit;
  }
  lines.push(`Gemini ${NEED[channel].model}: ${used} of ${limit} used on Pacific day ${pacific}; this episode needs about ${NEED[channel].requests}, keep ${SPARE} spare`);
  if (used + NEED[channel].requests + SPARE > limit) decide(false, "gemini-quota", "Not enough Gemini quota left with 3 spare.");
}
if (round === 2) {
  let startedMs = runStart.getTime();
  try {
    const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`, { headers: { authorization: `Bearer ${env.GH_TOKEN}` } });
    if (r.ok) startedMs = Date.parse((await r.json()).run_started_at) || startedMs;
  } catch {}
  const used = Math.round((now - startedMs) / 60000);
  lines.push(`time: ${used} min since this run started; a ${c.sheetName} episode takes about ${NEED[channel].minutes} min; limit 200`);
  if (used + NEED[channel].minutes > 200) decide(false, "time", "Not enough time left in this run.");
}
decide(true, "stock", `Below the ${TARGET_DAYS}-day target (${ahead(channel)} day(s) ahead): stock episode for ${addDays(latestOf(channel) || D, 1)}.`);
