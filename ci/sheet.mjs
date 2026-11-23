// Spreadsheet access for the cloud runs (no dependencies; Node 20+).
//
//   node ci/sheet.mjs check                       can the service account read the sheet?
//   node ci/sheet.mjs publish-at --channel X [--state <.episode_state.json>]
//                                                  prints the publish time for the next episode; a resumed
//                                                  episode keeps its state publishAt only while it is still ahead
//   node ci/sheet.mjs publish-at --channel X --redo EpNNN
//                                                  a redo keeps the episode's queued Publish at while it is still ahead
//   node ci/sheet.mjs deliver --channel X --episode EpNNN --url <mp4 url> --publish-at <iso> --topic "<text>" [--test]
//                                                  [--replace "<reason>"]  (redo: the old queue + Uploads rows of this
//                                                  episode are marked REMOVED with Publish at / Planned date cleared,
//                                                  as the owner's earlier removals, then new rows are written)
//
// Environment: GOOGLE_SA_JSON (the service account key file's content), SHEET_ID (the spreadsheet ID),
//              RUN_START (ISO time the workflow run started; defaults to now).
//
// Rules kept from the laptop version (next-episode.md steps 7-9):
//   - never append_values: find the next empty row, write the whole row in one update, read it back
//   - Episode, Publish at and Planned date are written with a leading apostrophe and must read back without it
//   - never touch row 1 (header) or row 2 (Zapier sample row); never edit or delete an existing row
//   - an episode that already has a row is never written twice
//   - any difference on read-back is an error (exit 2); nothing is repaired automatically
//
// Publish date rule (fixes the after-midnight bug): the day after the latest date in the queue,
// or the day after the run's START date in WIB if that is later. Never the time the run finishes.
import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CHANNELS = {
  countryballs: { project: "countryballs-video", queueTab: "Queue Countryballs", sheetName: "Countryballs", time: "07:30", time2: "18:00", file: (ep) => `${ep}.mp4` },
  whatif: { project: "whatif-video", queueTab: "Queue PomProds", sheetName: "PomProds", time: "07:30", file: (ep) => `WhatIf_${ep}.mp4` },
  fakta: { project: "fakta-video", queueTab: "Queue Fakta", sheetName: "Fakta Unik", time: "18:00", time2: "12:00", file: (ep) => `Fakta_${ep}.mp4` },
};
const TEST_QUEUE = "Queue Test";
const TEST_UPLOADS = "Uploads Test";
const QUEUE_HEADER = ["Episode", "Title", "Description", "Video URL", "Publish at", "Added"];
const UPLOADS_HEADER = ["Channel", "Episode", "Topic", "Video file", "Title", "Hook line (description start)", "Music", "Episode hashtags", "Full description (copy this)", "Status", "Planned date", "Posted date", "YouTube link", "TikTok link", "Instagram link", "Facebook link", "Pinned comment"];

const repo = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (name) => args.includes(`--${name}`);
const fail = (msg, code = 1) => {
  console.error(`sheet: ${msg}`);
  process.exit(code);
};

// ---------- time (WIB = UTC+7, no daylight saving) ----------
const WIB_MS = 7 * 3600 * 1000;
const wibParts = (date) => new Date(date.getTime() + WIB_MS).toISOString(); // read as if it were WIB
const wibDate = (date) => wibParts(date).slice(0, 10);
const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export const publishAtFor = (queueDates, runStart, time) => {
  const latest = queueDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().pop();
  const afterLatest = latest ? addDays(latest, 1) : "";
  const afterStart = addDays(wibDate(runStart), 1);
  const day = afterLatest > afterStart ? afterLatest : afterStart;
  return `${day}T${time}:00+07:00`;
};

// Second daily video (owner, 22 Nov 2026): a channel listed in the repository variable DOUBLE_CHANNELS gets two slots a
// day (its usual time + time2: Country Flux 18:00, PomProds 18:00, Fakta 12:00), but only once EVERY channel's queue
// reaches 3 days ahead. `queues` = live Publish at strings per channel; D = today's date (WIB).
export const doubleActive = (channel, publishAtsByChannel, D, env = process.env) => {
  const list = String(env.DOUBLE_CHANNELS ?? "").split(/[\s,]+/).filter(Boolean);
  if (!list.includes(channel) || !CHANNELS[channel].time2) return false;
  const day = (s) => String(s ?? "").slice(0, 10);
  return Object.values(publishAtsByChannel).every((arr) => {
    const latest = arr.map(day).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().pop();
    return latest && (Date.parse(latest) - Date.parse(D)) / 86400000 >= 3;
  });
};
export const slotTimes = (channel, double) => {
  const c = CHANNELS[channel];
  return double && c.time2 ? [c.time, c.time2].sort() : [c.time];
};
// The first free slot after the latest queued one, never today (same rule as publishAtFor, with 1 or 2 slots a day).
export const nextSlot = (publishAts, runStart, times) => {
  const toMs = (s) => Date.parse(s);
  const latest = Math.max(0, ...publishAts.filter((s) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s ?? "")).map((s) => toMs(s.length > 16 ? s : `${s}:00+07:00`)));
  // A run that starts 00:00-05:59 WIB (a scheduled run hours late, or a catch-up) belongs to the night before: it may
  // still fill TODAY's slot when that slot is at least 3 hours after the run's start (time to make, render and let
  // Zapier upload). Why (23 Nov 2026): PomProds' run started at 03:22 with nothing queued for 23 Nov; "never today"
  // gave its episode 24 Nov and the 23 Nov 07:30 slot stayed empty.
  const lateNight = new Date(runStart.getTime() + 7 * 3600 * 1000).getUTCHours() < 6;
  const earliest = lateNight ? runStart.getTime() + 3 * 3600 * 1000 : 0;
  let day = lateNight ? wibDate(runStart) : addDays(wibDate(runStart), 1);
  if (latest) {
    const latestDay = wibDate(new Date(latest));
    if (latestDay > day) day = latestDay;
  }
  for (let i = 0; i < 400; i++) {
    for (const t of times) {
      const slot = `${day}T${t}:00+07:00`;
      if (toMs(slot) > latest && toMs(slot) >= earliest) return slot;
    }
    day = addDays(day, 1);
  }
  throw new Error("no slot found");
};

// A resumed episode (state file) keeps the publishAt it was given, but only while that time is still after the
// run start and no queue row already uses that date. If it has passed (or is taken), the normal rule above applies.
export const publishAtResumed = (statePublishAt, queuePublishAts, runStart, times) => {
  const normal = nextSlot(queuePublishAts, runStart, times);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+07:00$/.test(statePublishAt ?? "")) return { publishAt: normal, kept: false };
  const ahead = Date.parse(statePublishAt) > runStart.getTime() + 3600 * 1000; // at least 1 h of margin
  const taken = queuePublishAts.some((q) => q && Date.parse(q.length > 16 ? q : `${q}:00+07:00`) === Date.parse(statePublishAt));
  return ahead && !taken ? { publishAt: statePublishAt, kept: true } : { publishAt: normal, kept: false, stale: statePublishAt };
};

// ---------- Google auth (service account, JWT bearer) ----------
const b64url = (x) => Buffer.from(x).toString("base64url");
let cachedToken;
const token = async () => {
  if (cachedToken) return cachedToken;
  const raw = process.env.GOOGLE_SA_JSON;
  if (!raw) fail("GOOGLE_SA_JSON is not set");
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch {
    fail("GOOGLE_SA_JSON is not valid JSON (paste the whole key file, from { to })");
  }
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 }));
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }),
  });
  if (!r.ok) fail(`Google sign-in failed (HTTP ${r.status}). Is the key still valid?`);
  cachedToken = (await r.json()).access_token;
  return cachedToken;
};

const api = async (method, urlPath, body) => {
  const id = process.env.SHEET_ID;
  if (!id) fail("SHEET_ID is not set");
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${urlPath}`, {
    method,
    headers: { authorization: `Bearer ${await token()}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const text = (await r.text()).slice(0, 300);
    if (r.status === 403) fail(`no access to the spreadsheet (HTTP 403). Share the sheet with the service account's email as Editor. ${text}`);
    if (r.status === 404) fail("spreadsheet not found (HTTP 404). Check the SHEET_ID secret.");
    fail(`Sheets API ${method} failed (HTTP ${r.status}): ${text}`);
  }
  return r.json();
};
const get = async (range) => (await api("GET", `/values/${encodeURIComponent(range)}`)).values ?? [];
const put = (range, row) => api("PUT", `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, { range, majorDimension: "ROWS", values: [row] });
const tabTitles = async () => (await api("GET", "?fields=sheets.properties.title")).sheets.map((s) => s.properties.title);

const ensureTestTab = async (title, header, lastCol) => {
  if ((await tabTitles()).includes(title)) return;
  await api("POST", ":batchUpdate", { requests: [{ addSheet: { properties: { title } } }] });
  await put(`'${title}'!A1:${lastCol}1`, header);
  const sample = ["SAMPLE (skip)", ...Array(header.length - 2).fill(""), "(test tab: Zapier does not watch this)"];
  await put(`'${title}'!A2:${lastCol}2`, sample);
  console.log(`sheet: created tab "${title}"`);
};

// ---------- row writing with the laptop's rules ----------
const colLetter = (n) => String.fromCharCode(64 + n);
const strip = (v) => (typeof v === "string" && v.startsWith("'") ? v.slice(1) : v);

// Writes one row into the first row below everything already in the tab, then reads it back.
// `isSame(row)` says whether an existing row is already this episode (then nothing is written).
const writeRow = async (tab, cells, isSame) => {
  const last = colLetter(cells.length);
  const all = await get(`'${tab}'!A:${last}`);
  const existing = all.findIndex((row, i) => i >= 2 && isSame(row));
  if (existing >= 0) {
    console.log(`sheet: "${tab}" already has this episode in row ${existing + 1}; nothing written`);
    return { row: existing + 1, written: false };
  }
  const row = all.length + 1; // rows returned + 1 = first row with nothing in any column
  if (row < 3) fail(`"${tab}" has fewer than 2 rows (header and sample row missing); refusing to write into row ${row}`, 2);
  const range = `'${tab}'!A${row}:${last}${row}`;
  if ((await get(range)).length) fail(`"${tab}" row ${row} is not empty; refusing to write`, 2);
  await put(range, cells);
  const back = (await get(range))[0] ?? [];
  const wrong = [];
  cells.forEach((cell, i) => {
    const want = strip(cell);
    const got = back[i] ?? "";
    if (got !== want) wrong.push(`${colLetter(i + 1)}${row}: wrote ${JSON.stringify(want).slice(0, 80)}, read ${JSON.stringify(got).slice(0, 80)}`);
  });
  if (wrong.length) fail(`"${tab}" read-back differs (row left as written, not repaired):\n  ${wrong.join("\n  ")}`, 2);
  console.log(`sheet: wrote "${tab}" row ${row}, read back exact`);
  return { row, written: true };
};

// ---------- uploads/EpNNN.txt ----------
const readUploads = (project, episode) => {
  const file = path.join(repo, project, "uploads", `${episode}.txt`);
  const text = readFileSync(file, "utf8");
  const pick = (label) => {
    const m = new RegExp(`^${label}:[ \\t]*(.*)$`, "m").exec(text);
    if (!m || !m[1].trim()) fail(`${project}/uploads/${episode}.txt has no "${label}:" line`, 2);
    return m[1].trim();
  };
  return { title: pick("Title"), hook: pick("Hook line"), tags: pick("Episode hashtags"), music: pick("Music"), pinned: pick("Pinned comment") };
};

// ---------- commands ----------
const channelOf = () => {
  const c = CHANNELS[opt("channel")];
  if (!c) fail(`--channel must be one of ${Object.keys(CHANNELS).join(", ")}`);
  return c;
};

// Only run a command when this file is the program (ci/stock.mjs imports the helpers below).
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
export { get as sheetGet };
if (!isMain) {
  // imported
} else if (cmd === "check") {
  const titles = await tabTitles();
  const need = ["Uploads", "Hashtags", ...Object.values(CHANNELS).map((c) => c.queueTab)];
  const missing = need.filter((t) => !titles.includes(t));
  if (missing.length) fail(`tabs missing: ${missing.join(", ")}`);
  console.log(`sheet: access OK, ${titles.length} tabs, all needed tabs present`);
} else if (cmd === "publish-at") {
  const c = channelOf();
  const runStart = new Date(process.env.RUN_START || Date.now());
  const col = await get(`'${c.queueTab}'!E:E`);
  const dates = col.slice(2).map((r) => String(r[0] ?? "").slice(0, 10));
  const fulls = col.slice(2).map((r) => String(r[0] ?? ""));
  const all = {};
  for (const [k, ch] of Object.entries(CHANNELS)) all[k] = k === opt("channel") ? fulls : (await get(`'${ch.queueTab}'!E:E`)).slice(2).map((r) => String(r[0] ?? ""));
  const double = doubleActive(opt("channel"), all, wibDate(runStart));
  const times = slotTimes(opt("channel"), double);
  if (double) console.error(`sheet: ${c.sheetName} has two daily slots now (${times.join(", ")})`);
  const redo = opt("redo");
  if (redo) {
    const rows = await get(`'${c.queueTab}'!A:E`);
    const live = rows.filter((r, i) => i >= 2 && r[0] === redo && /^\d{4}-\d{2}-\d{2}T/.test(r[4] ?? ""));
    if (live.length !== 1) fail(`redo ${redo}: expected exactly one live row in "${c.queueTab}", found ${live.length}`);
    const at = live[0][4];
    const ahead = Date.parse(at) > runStart.getTime() + 3600 * 1000;
    const r = ahead ? at : nextSlot(fulls, runStart, times);
    console.error(`sheet: redo ${redo} ${ahead ? "keeps its queued" : "had a passed"} Publish at ${at}${ahead ? "" : `; recomputed ${r}`}`);
    console.log(r);
    process.exit(0);
  }
  const statePath = opt("state");
  let statePublishAt;
  if (statePath && existsSync(statePath)) statePublishAt = JSON.parse(readFileSync(statePath, "utf8")).publishAt;
  const r = publishAtResumed(statePublishAt, fulls, runStart, times);
  if (r.stale) console.error(`sheet: the resumed episode's publishAt ${r.stale} has passed or is taken; recomputed ${r.publishAt}`);
  else if (r.kept) console.error(`sheet: resumed episode keeps its publishAt ${r.publishAt}`);
  console.log(r.publishAt);
} else if (cmd === "deliver") {
  const c = channelOf();
  const test = flag("test");
  const episode = opt("episode");
  const url = opt("url");
  const publishAt = opt("publish-at");
  const topic = opt("topic") ?? "";
  if (!/^Ep\d{3}(V\d+)?$/.test(episode ?? "")) fail("--episode must look like Ep014");
  if (!/^https:\/\/github\.com\/.+\.mp4$/.test(url ?? "")) fail("--url must be the release download URL of the MP4");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+07:00$/.test(publishAt ?? "")) fail("--publish-at must look like 2026-11-18T07:30:00+07:00");

  const up = readUploads(c.project, episode);
  const hashRows = await get("Hashtags!A:B");
  const core = hashRows.find((r) => r[0] === c.sheetName)?.[1];
  if (!core) fail(`Hashtags tab has no row for "${c.sheetName}"`, 2);
  const description = `${up.hook}\n\nVoiceover: AI\nMusic: ${up.music} (YouTube Audio Library)\n\n${core} ${up.tags}`;
  const added = `${wibParts(new Date()).slice(0, 16).replace("T", " ")} (Claude)`;

  const queueTab = test ? TEST_QUEUE : c.queueTab;
  const uploadsTab = test ? TEST_UPLOADS : "Uploads";
  if (test) {
    await ensureTestTab(TEST_QUEUE, QUEUE_HEADER, "F");
    await ensureTestTab(TEST_UPLOADS, UPLOADS_HEADER, "Q");
  }
  const testName = test ? `${c.sheetName} ${episode}` : episode; // the test tab is shared by 3 channels

  // Redo: mark the old rows REMOVED first (queue: Episode text + Publish at cleared, so Zapier and people skip it;
  // Uploads: Status + Planned date cleared), each read back, then the new rows below.
  const replace = opt("replace");
  const qOldRow = (all) => all.filter((r, i) => i >= 2 && r[0] === testName && r[3] !== url).length;
  if (replace) {
    const qAll = await get(`'${queueTab}'!A:E`);
    // the old row is the live one with a different video URL (on a delivery retry the new row is already there)
    const qOld = qAll.map((r, i) => [r, i + 1]).filter(([r, i]) => i >= 3 && r[0] === testName && r[3] !== url);
    if (qOld.length > 1) fail(`replace: ${qOld.length} old "${queueTab}" rows for ${testName}; fix by hand`, 2);
  }
  if (replace && qOldRow(await get(`'${queueTab}'!A:E`)) === 0) {
    console.log(`sheet: no old "${queueTab}" row left for ${testName} (already replaced); old rows untouched`);
  } else if (replace) {
    const day = new Date(Date.now() + WIB_MS).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
    const qAll = await get(`'${queueTab}'!A:E`);
    const qOld = qAll.map((r, i) => [r, i + 1]).filter(([r, i]) => i >= 3 && r[0] === testName && r[3] !== url);
    const qRow = qOld[0][1];
    const label = `${testName} (REMOVED ${day}, ${replace})`;
    await put(`'${queueTab}'!A${qRow}:A${qRow}`, [label]);
    await put(`'${queueTab}'!E${qRow}:E${qRow}`, [""]);
    const qBack = (await get(`'${queueTab}'!A${qRow}:E${qRow}`))[0] ?? [];
    if (qBack[0] !== label || (qBack[4] ?? "") !== "") fail(`replace: "${queueTab}" row ${qRow} read back wrong: ${JSON.stringify(qBack).slice(0, 200)}`, 2);
    console.log(`sheet: "${queueTab}" row ${qRow} marked REMOVED, Publish at cleared`);
    const uAll = await get(`'${uploadsTab}'!A:K`);
    const uOld = uAll.map((r, i) => [r, i + 1]).filter(([r, i]) => i >= 2 && r[0] === c.sheetName && r[1] === episode && !/^Removed/i.test(r[9] ?? ""));
    if (uOld.length !== 1) fail(`replace: expected one live "${uploadsTab}" row for ${c.sheetName} ${episode}, found ${uOld.length}`, 2);
    const uRow = uOld[0][1];
    const status = `Removed (${replace}, ${day})`;
    await put(`'${uploadsTab}'!J${uRow}:K${uRow}`, [status, ""]);
    const uBack = (await get(`'${uploadsTab}'!J${uRow}:K${uRow}`))[0] ?? [];
    if (uBack[0] !== status || (uBack[1] ?? "") !== "") fail(`replace: "${uploadsTab}" row ${uRow} read back wrong: ${JSON.stringify(uBack)}`, 2);
    console.log(`sheet: "${uploadsTab}" row ${uRow} marked ${status}, Planned date cleared`);
  }
  const q = await writeRow(queueTab, [`'${testName}`, up.title, description, url, `'${publishAt}`, added], (row) => row[0] === testName);
  const u = await writeRow(
    uploadsTab,
    [c.sheetName, `'${episode}`, topic, `${c.project}/renders/${c.file(episode)}`, up.title, up.hook, up.music, up.tags, description, "Ready", `'${publishAt.slice(0, 10)}`, "", "", "", "", "", up.pinned],
    (row) => row[0] === c.sheetName && row[1] === episode && !/^Removed/i.test(row[9] ?? ""),
  );
  console.log(JSON.stringify({ queueTab, queueRow: q.row, uploadsTab, uploadsRow: u.row }));
} else {
  fail("usage: sheet.mjs check | publish-at --channel X | deliver --channel X --episode EpNNN --url U --publish-at T --topic S [--test]");
}
