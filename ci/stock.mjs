// 3-day stock (owner, 21 Nov 2026): each channel's queue should reach 3 days ahead, within the limits.
// The workflow runs this; Claude never does.
//
//   node ci/stock.mjs plan                         round 1/2 of an episode run: make an episode now?  (GITHUB_OUTPUT)
//   node ci/stock.mjs queue-held [--channel X] [--only-if-needed]
//                                                  queue a held stock episode when the upload window allows
//                                                  (morning job), or, with --only-if-needed, only when channel X has
//                                                  nothing queued for tomorrow (start of X's nightly run)
//   node ci/stock.mjs window [--own X]             print the upload window check (for testing)
//
// Making and queueing are separate, because the upload limit binds: 3 episodes a day are needed and at most
// MAX_UPLOADS_24H (default 4) queue rows may be added in any rolling 24 h (each new row = one Zapier upload; the
// Added column is the clock). GitHub starts the nightly runs up to hours late, so an extra row added at night often
// has no room; held episodes are queued by a small morning job instead, far from the nightly runs.
//
// Rules (D = the run's start date in WIB; "ahead" = latest live Publish at date minus D, in days; "held" = episodes
// made and released but not yet queued, in ci/stock/held.json):
//   plan, round 1: redo, unfinished episode, delivery retry, or nothing queued for tomorrow: always make.
//                  otherwise: STOCK on: make while ahead + held < 3; STOCK off: one per run as before.
//   plan, round 2: STOCK on (or a forced test), round 1 delivered, ahead + held < 3, Country Flux first (a second
//                  What If / Fakta episode only when Country Flux has ahead + held >= 3), Gemini quota (today's
//                  requests for the channel's model + this episode's need + 3 spare <= daily limit), and time
//                  (minutes since the run started + the channel's typical episode time <= 200).
//   queueing (deliver.mjs, queue-held): nothing queued for tomorrow -> queue now; otherwise only when the upload
//                  window allows (windowCheck), else hold.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CHANNELS, publishAtFor, sheetGet } from "./sheet.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const env = process.env;
export const TARGET_DAYS = 3;
const SPARE = 3;
const NEED = { whatif: { model: "gemini-3.8-flash-tts", requests: 3, minutes: 90 }, fakta: { model: "gemini-3.1-flash-tts-preview", requests: 4, minutes: 50 }, countryballs: { minutes: 35 } };
const H = 3600 * 1000;
const WIB = 7 * H;
export const wibDate = (d) => new Date(d.getTime() + WIB).toISOString().slice(0, 10);
const addDays = (s, n) => new Date(Date.parse(`${s}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
export const maxUploads = () => Number(env.MAX_UPLOADS_24H || 4);
export const HELD = path.join(repo, "ci", "stock", "held.json");
export const readHeld = () => (existsSync(HELD) ? JSON.parse(readFileSync(HELD, "utf8")) : []);
export const writeHeld = (list) => {
  mkdirSync(path.dirname(HELD), { recursive: true });
  writeFileSync(HELD, `${JSON.stringify(list, null, 2)}\n`);
};

// ---------- the queues ----------
export const loadQueues = async () => {
  const q = {};
  for (const [key, ch] of Object.entries(CHANNELS)) q[key] = (await sheetGet(`'${ch.queueTab}'!A:F`)).slice(2);
  return q;
};
const liveDates = (rows) => rows.map((r) => String(r[4] ?? "").slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
export const latestOf = (queues, key) => liveDates(queues[key]).sort().pop() ?? "";
export const aheadOf = (queues, key, D) => {
  const l = latestOf(queues, key);
  return l ? Math.round((Date.parse(l) - Date.parse(D)) / 86400000) : -99;
};
// "2026-11-21 04:19 (Claude)" (WIB) -> ms
const addedAt = (cell) => {
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})/.exec(String(cell ?? ""));
  return m ? Date.parse(`${m[1]}T${m[2]}:${m[3]}:00+07:00`) : NaN;
};
// every queue row ever added (REMOVED rows too: they were uploaded), per channel
export const addedTimes = (queues) => Object.fromEntries(Object.entries(queues).map(([k, rows]) => [k, rows.map((r) => addedAt(r[5])).filter((t) => !Number.isNaN(t)).sort((a, b) => a - b)]));

// Would one more queue row now keep every rolling 24 h window at or under the limit?
// Counts the rows already added, this one, and the nightly episodes that will HAVE to be queued in the next 24 h:
// a channel must make one on the night its queue runs out (ahead < 1). Expected at its cron time (19:20, 20:20,
// 21:20 WIB) + 1 h, or within the hour if that time has passed. Channels with tomorrow covered are not counted:
// their own nightly delivery passes this same check. `own` = the channel whose nightly episode this row IS.
const CRON_WIB = { countryballs: 19 + 20 / 60, whatif: 20 + 20 / 60, fakta: 21 + 20 / 60 };
export const windowCheck = ({ queues, now = Date.now(), own = null, cap = maxUploads() }) => {
  const times = addedTimes(queues);
  const events = Object.values(times).flat().filter((t) => t > now - 48 * H && t <= now);
  const D = wibDate(new Date(now));
  const predicted = [];
  for (const key of Object.keys(times)) {
    if (key === own) continue;
    const ahead = Math.max(0, aheadOf(queues, key, D));
    let t = Date.parse(`${addDays(D, ahead)}T00:00:00+07:00`) + (CRON_WIB[key] + 1) * H;
    if (t <= now) t = now + 1 * H;
    if (t < now + 24 * H) predicted.push(t);
  }
  const all = [...events, now, ...predicted].sort((a, b) => a - b);
  let worst = 0;
  let worstStart = now;
  for (const s of all.filter((t) => t > now - 24 * H && t <= now)) {
    const n = all.filter((t) => t >= s && t < s + 24 * H).length;
    if (n > worst) [worst, worstStart] = [n, s];
  }
  const fmt = (t) => new Date(t + WIB).toISOString().slice(5, 16).replace("T", " ");
  return { ok: worst <= cap, worst, cap, detail: `busiest 24 h window from ${fmt(worstStart)} WIB would hold ${worst} uploads (limit ${cap}; ${events.filter((t) => t > now - 24 * H).length} in the last 24 h, ${predicted.length} nightly episode(s) that must still come)` };
};

const geminiOk = (channel, lines) => {
  if (!NEED[channel].model) return true;
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
  return used + NEED[channel].requests + SPARE <= limit;
};

const summary = (text) => {
  console.log(text);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${text}\n\n`);
};
const logLine = (line) => {
  const LOG = path.join(repo, "shared", "PROJECT_LOG.md");
  const text = readFileSync(LOG, "utf8");
  writeFileSync(LOG, `${text.replace(/\s*$/, "")}\n${line}\n`);
};

// ---------- commands ----------
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
const cmd = isMain ? process.argv[2] : null;
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

if (cmd === "plan") {
  const channel = env.CHANNEL;
  const c = CHANNELS[channel];
  if (!c) throw new Error("CHANNEL not set");
  const round = Number(env.ROUND || 1);
  const stockOn = env.STOCK === "on";
  const force = env.STOCK_FORCE === "true";
  const runStart = new Date(env.RUN_START || Date.now());
  const D = wibDate(runStart);
  const queues = await loadQueues();
  const held = readHeld().filter((h) => !h.test);
  const heldOf = (k) => held.filter((h) => h.channel === k).length;
  const level = (k) => aheadOf(queues, k, D) + heldOf(k);
  const lines = Object.keys(CHANNELS).map((k) => `${CHANNELS[k].sheetName}: latest queued ${latestOf(queues, k) || "none"} = ${aheadOf(queues, k, D)} day(s) ahead of ${D}, ${heldOf(k)} held (target ${TARGET_DAYS})`);
  const decide = (make, kind, reason) => {
    if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `make=${make}\nkind=${kind}\n`);
    summary(`**Round ${round} plan (${c.sheetName}): ${make ? "MAKE" : "SKIP"}, ${kind}.** ${reason}\n${lines.map((l) => `- ${l}`).join("\n")}`);
    process.exit(0);
  };
  const state = path.join(repo, c.project, ".episode_state.json");
  const pending = path.join(repo, "ci", "pending", `${channel}.json`);
  const ahead = aheadOf(queues, channel, D);
  if (round === 1) {
    if (env.REDO) decide(true, "redo", `Redo of ${env.REDO}.`);
    if (existsSync(state)) decide(true, "resume", "An unfinished episode is in the state file: it is finished first.");
    if (existsSync(pending) && env.TEST !== "true") decide(true, "delivery-retry", "A delivery from an earlier run is retried.");
    if (ahead < 1) decide(true, "mandatory", `Nothing queued for ${addDays(D, 1)} yet.`);
    if (!stockOn && !force) decide(true, "daily", "Stock is off: the usual one episode per run (queued if the upload window allows, else held).");
    if (level(channel) >= TARGET_DAYS) decide(false, "at-target", `${c.sheetName} already has ${level(channel)} days (queued + held).`);
    decide(true, "daily", `Below the ${TARGET_DAYS}-day target (${level(channel)} queued + held): the usual episode.`);
  }
  if (!stockOn && !force) decide(false, "stock-off", "Stock building is off (repository variable STOCK).");
  if (env.REDO) decide(false, "redo", "No second episode after a redo.");
  if (existsSync(state)) decide(false, "unfinished", "The first episode of this run did not finish (state file).");
  if (existsSync(pending)) decide(false, "pending", "The first episode's delivery did not finish.");
  if (ahead < 1 && env.TEST !== "true") decide(false, "first-failed", "Tomorrow is still not covered: the first episode did not deliver.");
  if (!force && level(channel) >= TARGET_DAYS) decide(false, "at-target", `${c.sheetName} already has ${level(channel)} days (queued + held).`);
  if (!force && channel !== "countryballs" && level("countryballs") < TARGET_DAYS)
    decide(false, "countryballs-first", `Country Flux first while building stock (it has ${level("countryballs")} days queued + held).`);
  if (!geminiOk(channel, lines)) decide(false, "gemini-quota", "Not enough Gemini quota left with 3 spare.");
  let startedMs = runStart.getTime();
  try {
    const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`, { headers: { authorization: `Bearer ${env.GH_TOKEN}` } });
    if (r.ok) startedMs = Date.parse((await r.json()).run_started_at) || startedMs;
  } catch {}
  const used = Math.round((Date.now() - startedMs) / 60000);
  lines.push(`time: ${used} min since this run started; a ${c.sheetName} episode takes about ${NEED[channel].minutes} min; limit 200`);
  if (used + NEED[channel].minutes > 200) decide(false, "time", "Not enough time left in this run.");
  decide(true, "stock", `Second episode for the stock (${level(channel)} days queued + held, target ${TARGET_DAYS}); queued if the upload window allows, else held for the morning job.`);
} else if (cmd === "queue-held") {
  const test = env.TEST === "true";
  const only = arg("channel");
  const ifNeeded = process.argv.includes("--only-if-needed");
  const queues = await loadQueues();
  const now = new Date();
  const D = wibDate(now);
  let held = readHeld().filter((h) => !!h.test === test);
  if (only) held = held.filter((h) => h.channel === only);
  if (!held.length) {
    summary("Held stock: none to queue.");
    process.exit(0);
  }
  // priority: a channel with nothing for tomorrow, then Country Flux, then the channel with the fewest days
  const rank = (h) => [aheadOf(queues, h.channel, D) < 1 ? 0 : 1, h.channel === "countryballs" ? 0 : 1, aheadOf(queues, h.channel, D), h.made ?? ""];
  held.sort((a, b) => {
    const x = rank(a);
    const y = rank(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
    return 0;
  });
  const h = held[0];
  const needed = aheadOf(queues, h.channel, D) < 1;
  if (ifNeeded && !needed) {
    summary(`Held stock: ${CHANNELS[h.channel].sheetName} ${h.episode} stays held (tomorrow is covered).`);
    process.exit(0);
  }
  const w = windowCheck({ queues, now: now.getTime() });
  if (!needed && !w.ok && !test) {
    summary(`Held stock: ${CHANNELS[h.channel].sheetName} ${h.episode} waits: ${w.detail}.`);
    process.exit(0);
  }
  const c = CHANNELS[h.channel];
  const publishAt = publishAtFor(liveDates(queues[h.channel]), now, c.time);
  const r = spawnSync("node", ["ci/sheet.mjs", "deliver", "--channel", h.channel, "--episode", h.episode, "--url", h.url, "--publish-at", publishAt, "--topic", h.topic ?? "", ...(test ? ["--test"] : [])], { cwd: repo, encoding: "utf8" });
  process.stdout.write(r.stdout ?? "");
  if (r.status !== 0) {
    logLine(`CHECK NEEDED: ${c.sheetName} ${h.episode} held stock could not be queued: ${(r.stderr ?? "").trim().slice(0, 300)} (${D})`);
    summary(`**CHECK NEEDED** queueing held ${c.sheetName} ${h.episode}: ${(r.stderr ?? "").trim().slice(0, 300)}`);
    process.exit(1);
  }
  const rows = JSON.parse(r.stdout.trim().split("\n").pop());
  writeHeld(readHeld().filter((x) => !(x.channel === h.channel && x.episode === h.episode && !!x.test === test)));
  logLine(`- **${c.sheetName} ${h.episode} queued from held stock${test ? " (TEST, not for upload)" : ""} (${D}):** queued for ${publishAt}; ${rows.queueTab} row ${rows.queueRow}, ${rows.uploadsTab} row ${rows.uploadsRow}; ${needed ? "nothing was queued for tomorrow" : w.detail}; video ${h.url}`);
  summary(`**${c.sheetName} ${h.episode}** queued from held stock for ${publishAt} (${rows.queueTab} row ${rows.queueRow}).`);
} else if (cmd === "window") {
  const queues = await loadQueues();
  console.log(windowCheck({ queues, own: arg("own") ?? null }));
  const D = wibDate(new Date());
  for (const k of Object.keys(CHANNELS)) console.log(k, "latest", latestOf(queues, k), "ahead", aheadOf(queues, k, D));
  console.log("held", readHeld());
} else if (cmd) {
  console.error("usage: stock.mjs plan | queue-held [--channel X] [--only-if-needed] | window");
  process.exit(1);
}
