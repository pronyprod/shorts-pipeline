// Spreadsheet access for the cloud runs (no dependencies; Node 20+).
//
//   node ci/sheet.mjs check                       can the service account read the sheet?
//   node ci/sheet.mjs publish-at --channel X      prints the publish time for the next episode
//   node ci/sheet.mjs deliver --channel X --episode EpNNN --url <mp4 url> --publish-at <iso> --topic "<text>" [--test]
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
import { readFileSync } from "node:fs";
import path from "node:path";

export const CHANNELS = {
  countryballs: { project: "countryballs-video", queueTab: "Queue Countryballs", sheetName: "Countryballs", time: "07:30", file: (ep) => `${ep}.mp4` },
  whatif: { project: "whatif-video", queueTab: "Queue What If", sheetName: "What If", time: "07:30", file: (ep) => `WhatIf_${ep}.mp4` },
  fakta: { project: "fakta-video", queueTab: "Queue Fakta", sheetName: "Fakta Unik", time: "18:00", file: (ep) => `Fakta_${ep}.mp4` },
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

if (cmd === "check") {
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
  console.log(publishAtFor(dates, runStart, c.time));
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
  const q = await writeRow(queueTab, [`'${testName}`, up.title, description, url, `'${publishAt}`, added], (row) => row[0] === testName);
  const u = await writeRow(
    uploadsTab,
    [c.sheetName, `'${episode}`, topic, `${c.project}/renders/${c.file(episode)}`, up.title, up.hook, up.music, up.tags, description, "Ready", `'${publishAt.slice(0, 10)}`, "", "", "", "", "", up.pinned],
    (row) => row[0] === c.sheetName && row[1] === episode,
  );
  console.log(JSON.stringify({ queueTab, queueRow: q.row, uploadsTab, uploadsRow: u.row }));
} else if (import.meta.url === `file://${process.argv[1]}` || cmd) {
  fail("usage: sheet.mjs check | publish-at --channel X | deliver --channel X --episode EpNNN --url U --publish-at T --topic S [--test]");
}
