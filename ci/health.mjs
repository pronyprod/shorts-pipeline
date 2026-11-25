// Morning health check and catch-up runs (owner, 25 Nov 2026). No Claude here.
//
//   node ci/health.mjs check     per channel: today / tomorrow / the day after covered (queued or held)? a missed day
//                                in the last 3 days? CHECK NEEDED / CLAUDE LIMIT lines of the last 2 days, an episode
//                                waiting for a fix. Problems -> GitHub issue "Health alert" (GitHub emails the owner),
//                                a "HEALTH ALERT" line in shared/PROJECT_LOG.md, and exit 1 (red run).
//   node ci/health.mjs catchup   when a channel has nothing for tomorrow (queued + held) and no episode run is going,
//                                start that channel's episode run (workflow_dispatch, test off). One channel per call.
//
// Why: this week GitHub did not start the scheduled runs of 23 Nov evening at all and started the others 10-12 h
// late; PomProds and Fakta missed 24 Nov and PomProds 25 Nov. The catch-up does not wait for the schedule.
// Catch-up rules: no episode run in progress or waiting; a channel is not restarted within 4 h of its last catch-up
// (ci/stock/catchup.json); a channel whose episode stopped twice and waits for a fix is reported, not restarted;
// PomProds and Fakta (Gemini voices) only after the daily Gemini reset (15:00 WIB) or at night (20:00-05:59), so a
// retry never meets a used-up quota.
// Environment: GOOGLE_SA_JSON, SHEET_ID, GH_TOKEN, GITHUB_REPOSITORY (+ GITHUB_RUN_ID for links).
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CHANNELS, sheetGet } from "./sheet.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const cmd = process.argv[2];
const env = process.env;
const WIB = 7 * 3600 * 1000;
const now = new Date();
const wibDate = (d) => new Date(d.getTime() + WIB).toISOString().slice(0, 10);
const wibHour = (d) => new Date(d.getTime() + WIB).getUTCHours() + new Date(d.getTime() + WIB).getUTCMinutes() / 60;
const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const today = wibDate(now);
const NAME = { countryballs: "Country Flux", whatif: "PomProds", fakta: "FaktaMantra" };
const GEMINI = new Set(["whatif", "fakta"]);
const out = [];
const say = (t) => {
  console.log(t);
  out.push(t);
};
const summary = () => env.GITHUB_STEP_SUMMARY && appendFileSync(env.GITHUB_STEP_SUMMARY, `${out.join("\n")}\n`);

const gh = async (method, url, body) => {
  const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}${url}`, {
    method,
    headers: { authorization: `Bearer ${env.GH_TOKEN}`, accept: "application/vnd.github+json", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok && r.status !== 204) throw new Error(`GitHub ${method} ${url}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? {} : r.json();
};

// live publish dates per channel (REMOVED rows have no Publish at) + held stock
const coverage = async () => {
  const held = existsSync(path.join(repo, "ci/stock/held.json")) ? JSON.parse(readFileSync(path.join(repo, "ci/stock/held.json"), "utf8")).filter((h) => !h.test) : [];
  const res = {};
  for (const [k, c] of Object.entries(CHANNELS)) {
    const rows = (await sheetGet(`'${c.queueTab}'!A3:E`)).filter((r) => /^Ep\d{3}$/.test(r[0] ?? "") && /^\d{4}-\d{2}-\d{2}T/.test(r[4] ?? ""));
    const days = new Set(rows.map((r) => r[4].slice(0, 10)));
    const latest = [...days].sort().pop() ?? "";
    const heldN = held.filter((h) => h.channel === k).length;
    const state = existsSync(path.join(repo, c.project, ".episode_state.json")) ? JSON.parse(readFileSync(path.join(repo, c.project, ".episode_state.json"), "utf8")) : null;
    res[k] = { days, latest, heldN, state };
  }
  return res;
};
// tomorrow is covered when queued, or when a held episode exists and today's/tomorrow's chain is not broken
// the day the next episode is for: tomorrow, but between midnight and 06:00 WIB still today (that morning slot)
const needDay = () => (wibHour(now) < 6 ? today : addDays(today, 1));
const coveredTomorrow = (c) => c.days.has(needDay()) || (c.heldN > 0 && c.latest >= addDays(needDay(), -1));
const waitingForFix = (st) => st?.cloudStop?.retried === true;

const activeRuns = async () => {
  let n = 0;
  for (const s of ["in_progress", "queued", "waiting", "pending", "requested"]) n += (await gh("GET", `/actions/workflows/episode.yml/runs?status=${s}&per_page=1`)).total_count ?? 0;
  return n;
};

if (cmd === "check") {
  const cov = await coverage();
  const alerts = [];
  say(`## Health check ${today} (WIB)`);
  for (const [k, c] of Object.entries(cov)) {
    const look = [-3, -2, -1, 0, 1, 2].map((d) => addDays(today, d));
    const line = look.map((d) => `${d.slice(5)} ${c.days.has(d) ? "ok" : d > today ? (d === addDays(today, 1) && coveredTomorrow(c) ? "held" : "--") : "MISSING"}`).join(" | ");
    say(`- **${NAME[k]}**: ${line}; held ${c.heldN}${c.state ? `; unfinished ${c.state.episode} (${c.state.status ?? `step ${c.state.step}`})` : ""}`);
    const missed = look.filter((d) => d <= today && !c.days.has(d));
    if (missed.length) alerts.push(`${NAME[k]} had NO video on ${missed.join(", ")}`);
    if (!coveredTomorrow(c)) alerts.push(`${NAME[k]} has nothing for ${needDay()} yet`);
    if (waitingForFix(c.state)) alerts.push(`${NAME[k]} ${c.state.episode} stopped twice and waits for a fix: ${String(c.state.cloudStop.reason ?? "").slice(0, 160)}`);
  }
  // stops of the last 2 days
  const log = readFileSync(path.join(repo, "shared", "PROJECT_LOG.md"), "utf8").split("\n");
  const recent = [addDays(today, -1), today];
  const stops = log.filter((l) => /^(CHECK NEEDED|CLAUDE LIMIT)/.test(l) && recent.some((d) => l.includes(d)));
  for (const s of stops) say(`- stop: ${s.slice(0, 220)}`);
  const warn = log.filter((l) => /REELS WARNING/.test(l) && recent.some((d) => l.includes(d)));
  for (const w of warn) say(`- ${w.slice(0, 220)}`);
  if (!alerts.length) {
    say(`\nAll channels covered; no missed day in the last 3 days.`);
    summary();
    process.exit(0);
  }
  say(`\n### ALERT\n${alerts.map((a) => `- ${a}`).join("\n")}`);
  summary();
  if (env.HEALTH_DRY !== "true") {
    appendFileSync(path.join(repo, "shared", "PROJECT_LOG.md"), `- **HEALTH ALERT (${today}):** ${alerts.join("; ")}.\n`);
    // one open issue, updated with a comment each day (GitHub emails the owner on both)
    const body = `${out.join("\n")}\n\nRun: ${env.GITHUB_SERVER_URL ?? "https://github.com"}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID ?? ""}`;
    const open = (await gh("GET", "/issues?state=open&labels=health&per_page=5")).filter((i) => !i.pull_request);
    if (open.length) await gh("POST", `/issues/${open[0].number}/comments`, { body });
    else await gh("POST", "/issues", { title: `Health alert: ${alerts[0]}`, body, labels: ["health"] });
  }
  process.exit(1);
} else if (cmd === "catchup") {
  const cov = await coverage();
  const file = path.join(repo, "ci", "stock", "catchup.json");
  const last = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const h = wibHour(now);
  if ((await activeRuns()) > 0) {
    say("catch-up: an episode run is going or waiting; nothing started");
    summary();
    process.exit(0);
  }
  // order: the channel with the earliest missing day first (Country Flux first on ties)
  const order = Object.keys(CHANNELS).sort((a, b) => (cov[a].latest || "").localeCompare(cov[b].latest || ""));
  for (const k of order) {
    const c = cov[k];
    if (coveredTomorrow(c)) continue;
    if (waitingForFix(c.state)) {
      say(`catch-up: ${NAME[k]} needs tomorrow but ${c.state.episode} waits for a fix; not restarted`);
      continue;
    }
    if (GEMINI.has(k) && h >= 6 && h < 15.1) {
      say(`catch-up: ${NAME[k]} needs tomorrow; waiting for the Gemini reset (15:00 WIB)`);
      continue;
    }
    if (last[k] && now.getTime() - Date.parse(last[k]) < 4 * 3600000) {
      say(`catch-up: ${NAME[k]} needs tomorrow; started at ${last[k]} already (less than 4 h ago)`);
      continue;
    }
    if (env.HEALTH_DRY === "true") {
      say(`catch-up (dry): would start ${NAME[k]}`);
      break;
    }
    await gh("POST", "/actions/workflows/episode.yml/dispatches", { ref: "main", inputs: { channel: k, test: false } });
    last[k] = now.toISOString();
    writeFileSync(file, `${JSON.stringify(last, null, 2)}\n`);
    appendFileSync(path.join(repo, "shared", "PROJECT_LOG.md"), `- **CATCH-UP (${today} ${new Date(now.getTime() + WIB).toISOString().slice(11, 16)} WIB):** ${NAME[k]} had nothing queued for ${needDay()} (latest ${c.latest || "none"}, ${c.heldN} held) and no episode run was going: its episode run was started by ci/health.mjs.\n`);
    say(`catch-up: started ${NAME[k]} (nothing for ${needDay()})`);
    break;
  }
  if (!out.length) say("catch-up: every channel has tomorrow covered");
  summary();
} else {
  console.error("usage: node ci/health.mjs check | catchup");
  process.exit(1);
}
