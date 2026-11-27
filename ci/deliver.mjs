// Delivery after Claude has made and checked an episode. Claude never runs this: the workflow does.
//   1. upload the MP4 as a GitHub Release asset (test mode: a pre-release)
//   2. download it back WITHOUT any login and compare it byte for byte
//   3. write the queue row and the Uploads row (ci/sheet.mjs: same rules and read-back checks as the laptop)
//   4. add one line to shared/PROJECT_LOG.md
// If any step fails: "CHECK NEEDED" goes into the log, ci/pending/<channel>.json remembers the episode,
// and the next run of that channel retries the delivery before making anything new.
//
// Environment: CHANNEL, TEST (true/false), PUBLISH_AT, GITHUB_REPOSITORY, GH_TOKEN, GITHUB_RUN_ID,
//              GOOGLE_SA_JSON, SHEET_ID, RUN_START.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CHANNELS } from "./sheet.mjs";
import { GAP_H, HARD_CAP, aheadOf, gapCheck, queueLaterActive, readyHeld, urgency, loadQueues, readHeld, wibDate, windowCheck, writeHeld } from "./stock.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const env = process.env;
const channel = env.CHANNEL;
const test = env.TEST === "true";
const c = CHANNELS[channel];
if (!c) throw new Error(`CHANNEL must be one of ${Object.keys(CHANNELS).join(", ")}`);

const LOG = path.join(repo, "shared", "PROJECT_LOG.md");
const PENDING = path.join(repo, "ci", "pending", `${channel}.json`);
const RESULT = path.join(repo, "ci-out", "result.json");
const runUrl = `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

const summary = (text) => {
  console.log(text);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${text}\n\n`);
};
const logLine = (line) => {
  const text = readFileSync(LOG, "utf8");
  if (text.includes(line)) return; // never the same line twice
  writeFileSync(LOG, `${text.replace(/\s*$/, "")}\n${line}\n`);
};
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", cwd: repo, ...opts });

let result;
const stop = (reason, keepPending = true) => {
  const ep = result?.episode ?? "(no episode)";
  logLine(`CHECK NEEDED: ${c.sheetName} ${ep} cloud delivery${test ? " (TEST)" : ""}: ${reason} (${today}, ${runUrl})`);
  if (keepPending && !test && result?.episode) {
    mkdirSync(path.dirname(PENDING), { recursive: true });
    writeFileSync(PENDING, `${JSON.stringify(result, null, 2)}\n`);
  }
  summary(`**CHECK NEEDED** ${c.sheetName} ${ep}: ${reason}`);
  process.exit(1);
};

// ---------- what did Claude leave? ----------
if (!existsSync(RESULT)) {
  // ci/claude-error.mjs says why the Claude step stopped (22 Nov 2026). A usage/rate limit is not an episode problem:
  // nothing to fix, nothing kept, the next run makes the episode, so it is logged as CLAUDE LIMIT, not CHECK NEEDED.
  const ERR = path.join(repo, "ci-out", "claude-error.json");
  const err = existsSync(ERR) ? JSON.parse(readFileSync(ERR, "utf8")) : null;
  if (err?.kind === "limit") {
    logLine(`CLAUDE LIMIT: ${c.sheetName} cloud run${test ? " (TEST)" : ""} stopped before making the episode: Claude usage/rate limit ("${err.text.slice(0, 160)}"). Not an episode problem, nothing to fix; the next run makes it (${today}, ${runUrl})`);
    summary(`**CLAUDE LIMIT** ${c.sheetName}: ${err.text}. Nothing to fix; the next run makes the episode.`);
    process.exit(1);
  }
  logLine(`CHECK NEEDED: ${c.sheetName} cloud run${test ? " (TEST)" : ""} ended without a result file${err ? ` (Claude: "${err.text.slice(0, 160)}")` : ""} (${today}, ${runUrl})`);
  summary(`**CHECK NEEDED** ${c.sheetName}: the Claude step ended without ci-out/result.json${err ? `: ${err.text}` : ". Open the run log."}`);
  process.exit(1);
}
result = JSON.parse(readFileSync(RESULT, "utf8"));
if (result.status !== "ready") {
  // Claude already wrote its own log line (CHECK NEEDED or waiting for quota) and kept its state file.
  summary(`${c.sheetName}: nothing to deliver. Status **${result.status}**${result.reason ? `: ${result.reason}` : ""}`);
  process.exit(result.status === "waiting-quota" ? 0 : 1);
}

const episode = result.episode;
if (!/^Ep\d{3}(V\d+)?$/.test(episode ?? "")) stop(`result.json has a bad episode name: ${episode}`, false);
const fileName = c.file(episode);
const mp4 = path.join(repo, c.project, "renders", fileName);
const publishAt = env.PUBLISH_AT;
if (!publishAt) stop("PUBLISH_AT was not computed");

// ---------- 1. release ----------
// A redo (owner fixed an already queued episode) gets its own release: <channel>-<episode>-v2, -v3, ...
let tag = test ? `test-${channel}-${episode}-r${env.GITHUB_RUN_ID}` : `${channel}-${episode}`;
if (result.redo && !result.url) {
  for (let v = 2; v < 20; v++) {
    const t = `${tag}-v${v}`;
    if (run("gh", ["release", "view", t]).status !== 0) {
      tag = t;
      break;
    }
  }
  if (!/-v\d+$/.test(tag)) stop("redo: no free release tag");
}
let url = result.url;
if (!url) {
  if (!existsSync(mp4)) stop(`MP4 not found at ${c.project}/renders/${fileName} (and no release yet); it must be rendered again`);
  const probe = run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type", "-of", "csv=p=0", mp4]);
  const streams = (probe.stdout ?? "").trim().split(/\s+/).sort().join(",");
  if (probe.status !== 0 || streams !== "audio,video") stop(`MP4 is not one video + one audio stream (ffprobe: ${streams || probe.stderr})`);

  const title = `${c.sheetName} ${episode}${test ? " (TEST)" : ""}`;
  const notes = test ? "Test run. Not for upload." : `Queued for ${publishAt}.${result.redo ? ` Redo: ${result.redoReason ?? "fixed version"}; replaces ${channel}-${episode}.` : ""}`;
  const exists = run("gh", ["release", "view", tag]).status === 0;
  const up = exists
    ? run("gh", ["release", "upload", tag, mp4, "--clobber"])
    : run("gh", ["release", "create", tag, mp4, "--title", title, "--notes", notes, ...(test ? ["--prerelease"] : []), "--latest=false"]);
  if (up.status !== 0) stop(`release upload failed: ${(up.stderr ?? "").slice(0, 200)}`);
  url = `https://github.com/${env.GITHUB_REPOSITORY}/releases/download/${tag}/${fileName}`;
  // Reels version (CC BY music) made by ci/reels-audio.mjs: uploaded next to it; its absence never stops the delivery
  const reels = path.join(repo, "ci-out", "reels", fileName.replace(/\.mp4$/i, "-reels.mp4"));
  if (existsSync(reels)) {
    const r = run("gh", ["release", "upload", tag, reels, "--clobber"]);
    console.log(r.status === 0 ? `deliver: Reels version uploaded (${path.basename(reels)})` : `deliver: Reels version NOT uploaded: ${(r.stderr ?? "").slice(0, 160)}`);
  } else console.log("deliver: no Reels version for this episode (Instagram/Facebook skip it)");
  result.url = url;
}

// ---------- 2. public download check (no token, no cookies) ----------
if (existsSync(mp4)) {
  const local = createHash("sha256").update(readFileSync(mp4)).digest("hex");
  let ok = false;
  let why = "";
  for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
    try {
      const r = await fetch(url, { redirect: "follow" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = Buffer.from(await r.arrayBuffer());
      if (body.length !== statSync(mp4).size) throw new Error(`size ${body.length} != ${statSync(mp4).size}`);
      if (createHash("sha256").update(body).digest("hex") !== local) throw new Error("content differs");
      ok = true;
    } catch (e) {
      why = String(e.message ?? e);
      await new Promise((res) => setTimeout(res, 8000));
    }
  }
  if (!ok) stop(`the release URL does not download the file without login (${why})`);
  console.log(`deliver: ${url} downloads without login, identical to the render`);
}

// ---------- 2b. queue now, or hold as stock? (owner, 21 Nov 2026: at most MAX_UPLOADS_24H queue rows in 24 h) ----------
// Nothing queued for tomorrow, or a redo: queue now. Otherwise queue only when the upload window allows; else the
// episode (already released) waits in ci/stock/held.json and the morning job queues it (ci/stock.mjs queue-held).
if (!result.redo) {
  const queues = await loadQueues();
  const D = wibDate(new Date(env.RUN_START || Date.now()));
  // A run that starts after midnight (00:00-05:59 WIB: a scheduled run hours late, or a manual catch-up) belongs to
  // the night before. Its episode is urgent only when nothing is queued for TODAY; one for tomorrow can wait for the
  // morning job, so catch-up runs never push the upload window over the cap (owner, 22 Nov 2026: six rows in 24 h
  // after the late runs of 21/22 Nov and YouTube throttled the sixth).
  const { needed, lateNight } = urgency(queues, channel, env.RUN_START || new Date().toISOString());
  if (lateNight) console.log(`deliver: late run (started ${String(env.RUN_START ?? "").slice(11, 16)} UTC, after midnight WIB): urgent only if nothing is queued for ${D}`);
  const w = windowCheck({ queues, own: ["stock", "second-daily"].includes(env.KIND) ? null : channel });
  // a channel's episodes are queued strictly in order (an older held one goes first), and a series Part 1 waits
  // until its Part 2 is released, so the two parts land on consecutive days (owner, 22 Nov 2026)
  const olderHeld = readHeld().filter((h) => h.channel === channel && !!h.test === test && readyHeld(h)).length;
  const part1 = result.series?.part === 1;
  // a needed episode is still held when it would pass the HARD cap (4 in 24 h, Zapier's throttle point); the
  // queue-later job queues it when the window allows
  const hardFull = needed && !test && !windowCheck({ queues, own: channel, cap: HARD_CAP(), predict: false }).ok;
  if (hardFull) console.log(`deliver: needed, but the hard upload cap (${HARD_CAP()} in 24 h) is reached: held; the queue-later job queues it when the window allows`);
  // at least 2 h between any two queue rows of all channels, and never while the queue-later job is busy (owner 27 Nov 2026)
  const gap = gapCheck(queues);
  const laterBusy = !test && (await queueLaterActive()) > 0;
  const gapHold = !test && (!gap.ok || laterBusy);
  if (gapHold) console.log(`deliver: ${laterBusy ? "the queue-later job is running (it queues held stock)" : gap.detail}: held; the queue-later job queues it (at least ${GAP_H()} h between any two queue rows)`);
  const hold = test ? ["stock", "second-daily"].includes(env.KIND) || part1 : (!needed && (!w.ok || olderHeld > 0 || part1)) || hardFull || gapHold;
  if (!needed && olderHeld) console.log(`deliver: ${olderHeld} older ${c.sheetName} episode(s) are held: this one waits behind them`);
  if (part1) console.log("deliver: series Part 1: held until its Part 2 is released");
  console.log(`deliver: ${needed ? `nothing queued for ${lateNight ? "today" : "tomorrow"}` : w.detail} -> ${hold ? "HOLD" : "queue now"}`);
  // an emergency (evergreen) episode is kept apart: released, never queued, used by the health job when needed
  if (env.KIND === "emergency" && !test) {
    const ef = path.join(repo, "ci", "stock", "emergency.json");
    const list = existsSync(ef) ? JSON.parse(readFileSync(ef, "utf8")) : [];
    writeFileSync(ef, `${JSON.stringify([...list, { channel, episode, url, topic: result.topic ?? "", made: today, run: env.GITHUB_RUN_ID, evergreen: true }], null, 2)}\n`);
    logLine(`- **${c.sheetName} ${episode} kept as EMERGENCY episode (${today}):** evergreen, made, checked and released, not queued; the health job queues it only if a day would otherwise be empty; video ${url}`);
    rmSync(PENDING, { force: true });
    summary(`**${c.sheetName} ${episode}** released and kept as an EMERGENCY episode (not queued)`);
    process.exit(0);
  }
  if (hold) {
    writeHeld([...readHeld(), { channel, episode, url, topic: result.topic ?? "", made: today, run: env.GITHUB_RUN_ID, ...(result.series ? { series: result.series } : {}), ...(test ? { test: true } : {}) }]);
    logLine(`- **${c.sheetName} ${episode} held as stock${test ? " (TEST)" : ""} (${today}):** made, checked and released, not queued yet (${gapHold ? (laterBusy ? "queue-later job busy" : gap.detail) : hardFull ? `hard cap ${HARD_CAP()} in 24 h` : w.detail}); the queue-later job queues it when the gap and the upload window allow${needed ? " (needed: it goes first)" : ""}; video ${url}`);
    rmSync(PENDING, { force: true });
    summary(`**${c.sheetName} ${episode}** released and HELD as stock (not queued): ${w.detail}`);
    process.exit(0);
  }
}

// ---------- 3. spreadsheet ----------
const sheet = run("node", ["ci/sheet.mjs", "deliver", "--channel", channel, "--episode", episode, "--url", url, "--publish-at", publishAt, "--topic", result.topic ?? "", ...(test ? ["--test"] : []), ...(result.redo ? ["--replace", `owner: ${result.redoReason ?? "fixed version"}, new upload`.slice(0, 120)] : [])]);
process.stdout.write(sheet.stdout ?? "");
if (sheet.status !== 0) stop(`${sheet.status === 2 ? "queue or Uploads row" : "spreadsheet"}: ${(sheet.stderr ?? "").trim().slice(0, 300)}`);
const rows = JSON.parse(sheet.stdout.trim().split("\n").pop());
// the sheet writer may have moved the publish time to the next free slot (validation); log the real one
const queuedAt = rows.publishAt ?? publishAt;

// ---------- 4. log ----------
logLine(`- **${c.sheetName} ${episode} cloud delivery${["stock", "second-daily"].includes(env.KIND) ? " (STOCK: extra episode for the 3-day target)" : ""}${result.redo ? " (REDO, replaces the earlier version: its queue and Uploads rows are marked REMOVED)" : ""}${test ? " (TEST, not for upload)" : ""} (${today}):** queued for ${queuedAt}; ${rows.queueTab} row ${rows.queueRow}, ${rows.uploadsTab} row ${rows.uploadsRow}; video ${url}`);
rmSync(PENDING, { force: true });
summary(`**${c.sheetName} ${episode}** ${test ? "TEST delivered" : "queued"} for ${queuedAt}\n\n- ${rows.queueTab} row ${rows.queueRow}, ${rows.uploadsTab} row ${rows.uploadsRow}\n- ${url}`);
