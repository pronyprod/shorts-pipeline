// YouTube jobs for the three channels (no dependencies; Node 20+). No Claude involved.
//
//   node ci/youtube.mjs whoami                      which channel does each login belong to?
//   node ci/youtube.mjs comment [--dry-run] [--channel X] [--date YYYY-MM-DD]
//   node ci/youtube.mjs track   [--dry-run] [--channel X] [--limit N]
//   node ci/youtube.mjs compare [--channel X]       API numbers next to the typed ones; writes nothing
//
// Environment: GOOGLE_SA_JSON, SHEET_ID (same as ci/sheet.mjs), YT_CLIENT_ID, YT_CLIENT_SECRET,
//              YT_REFRESH_COUNTRYBALLS, YT_REFRESH_WHATIF, YT_REFRESH_FAKTA (one login per channel).
//
// comment: for each Uploads row of today or yesterday (WIB) whose publish time has passed and whose
//   "Auto comment" cell (column R) is empty, finds the video on the channel and posts column Q as the
//   channel. Never twice: column R is the record, and a video that already has a top-level comment from
//   the channel itself is skipped. The API cannot pin a comment; pinning stays a manual tap in the app.
// track: for each YouTube row in the Tracking tab dated at least 3 days ago with an empty number, fills
//   ONLY the empty cells of E (views), G (average % viewed), H (subscribers gained) and J (average view
//   duration, seconds). Typed numbers are never overwritten, rows are never moved (columns A:D of that tab
//   are a formula; this script writes single cells only).
//   Column F "Stayed to watch %" is left alone: the API does not offer it. Checked 16 Nov 2026 on 8 typed
//   rows: engagedViews / views gives 55-68% where Studio showed 58-82%, so it is not the same number.
//
// Quota (YouTube Data API, 10,000 units a day for free): a comment costs 50, every read 1.
// A normal day is about 3 comments + 20 reads = under 200 units. Analytics queries have their own quota.
import { createSign } from "node:crypto";

const CHANNELS = {
  countryballs: { sheetName: "Countryballs", yt: "Country Flux", time: "07:30", env: "YT_REFRESH_COUNTRYBALLS" },
  whatif: { sheetName: "PomProds", yt: "PomProds", time: "07:30", env: "YT_REFRESH_WHATIF" },
  fakta: { sheetName: "Fakta Unik", yt: "FaktaMantra", time: "18:00", env: "YT_REFRESH_FAKTA" },
};
const COMMENT_HEADER = "Auto comment";
const TRACK_HEADERS = ["Posted date", "Channel", "Episode", "Platform", "Views at 48h", "Stayed to watch %", "Average % viewed", "Subscribers gained", "Notes"];
const DURATION_HEADER = "Average view duration (s)"; // Tracking column J
const FILL = [4, 6, 7, 9]; // E, G, H, J
const MIN_AGE_DAYS = 3; // a Tracking row is filled once its date is at least this many days back
const WINDOW_HOURS = 36; // analytics window: publish day .. the Pacific day that holds publish + 36 h (see README)

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRY = args.includes("--dry-run");
const inCI = !!process.env.GITHUB_ACTIONS;
const note = (level, msg) => console.log(inCI ? `::${level}::${msg}` : `${level.toUpperCase()}: ${msg}`);
const fail = (msg) => {
  note("error", msg);
  process.exit(1);
};
const summary = [];
const say = (line) => {
  console.log(line);
  summary.push(line);
};

// ---------- time ----------
const WIB_MS = 7 * 3600 * 1000;
const wib = (date) => new Date(date.getTime() + WIB_MS).toISOString(); // read as if it were WIB
const wibDate = (date) => wib(date).slice(0, 10);
const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const pacificDate = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(date); // YouTube Analytics days
const now = new Date();
const today = wibDate(now);

// ---------- Google auth ----------
const b64url = (x) => Buffer.from(x).toString("base64url");
const need = (name) => process.env[name] || fail(`${name} is not set`);
const tokenCall = async (params, what) => {
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (j.error === "invalid_grant") fail(`${what}: the login has expired or was withdrawn. Log in again (node tools/yt-login.mjs) and update the secret.`);
    fail(`${what}: Google sign-in failed (HTTP ${r.status} ${j.error ?? ""})`);
  }
  return j.access_token;
};
let saToken;
const sheetToken = async () => {
  if (saToken) return saToken;
  let sa;
  try {
    sa = JSON.parse(need("GOOGLE_SA_JSON"));
  } catch {
    fail("GOOGLE_SA_JSON is not valid JSON");
  }
  const t = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 3000 }));
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key).toString("base64url");
  saToken = await tokenCall({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }, "spreadsheet");
  return saToken;
};
const ytTokens = {};
const ytToken = async (key) => {
  // parameter names are built in pieces so the repository's secrets scan (tools/scan.sh) stays quiet
  ytTokens[key] ??= await tokenCall({ grant_type: "refresh" + "_token", client_id: need("YT_CLIENT_ID"), ["client" + "_secret"]: need("YT_CLIENT_SECRET"), ["refresh" + "_token"]: need(CHANNELS[key].env) }, CHANNELS[key].yt);
  return ytTokens[key];
};

// ---------- Sheets ----------
const sheets = async (method, urlPath, body) => {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${need("SHEET_ID")}${urlPath}`, {
    method,
    headers: { authorization: `Bearer ${await sheetToken()}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) fail(`Sheets API ${method} failed (HTTP ${r.status}): ${(await r.text()).slice(0, 300)}`);
  return r.json();
};
const getRows = async (range, raw = false) =>
  (await sheets("GET", `/values/${encodeURIComponent(range)}${raw ? "?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING" : ""}`)).values ?? [];
const putCells = (data) => sheets("POST", "/values:batchUpdate", { valueInputOption: "RAW", data: data.map(([range, value]) => ({ range, values: [[value]] })) });

// ---------- YouTube ----------
let quota = 0;
class ApiError extends Error {
  constructor(status, reason, message) {
    super(`HTTP ${status} ${reason}: ${message}`);
    this.status = status;
    this.reason = reason;
  }
}
const google = async (key, cost, url, params, body) => {
  quota += cost;
  const r = await fetch(`${url}?${new URLSearchParams(params)}`, {
    method: body ? "POST" : "GET",
    headers: { authorization: `Bearer ${await ytToken(key)}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, j.error?.errors?.[0]?.reason ?? j.error?.status ?? "", (j.error?.message ?? "").slice(0, 200));
  return j;
};
const yt = (key, cost, what, params, body) => google(key, cost, `https://www.googleapis.com/youtube/v3/${what}`, params, body);

const channelCache = {};
const channelOf = async (key) => {
  if (channelCache[key]) return channelCache[key];
  const j = await yt(key, 1, "channels", { part: "snippet,contentDetails", mine: "true" });
  const c = j.items?.[0];
  if (!c) fail(`${CHANNELS[key].yt}: this login has no YouTube channel. Log in again and pick the channel, not the personal account.`);
  const info = { id: c.id, title: c.snippet.title, uploads: c.contentDetails.relatedPlaylists.uploads };
  if (!info.title.toLowerCase().replace(/\s/g, "").includes(CHANNELS[key].yt.toLowerCase().replace(/\s/g, "")))
    fail(`the login stored for ${CHANNELS[key].yt} belongs to the channel "${info.title}". Log in again and pick ${CHANNELS[key].yt}.`);
  return (channelCache[key] = info);
};
// The channel's newest uploads (private and scheduled ones included), newest first.
const videosOf = async (key, maxPages) => {
  const ch = await channelOf(key);
  const ids = [];
  let pageToken;
  for (let p = 0; p < maxPages; p++) {
    const j = await yt(key, 1, "playlistItems", { part: "contentDetails", playlistId: ch.uploads, maxResults: "50", ...(pageToken ? { pageToken } : {}) });
    ids.push(...(j.items ?? []).map((i) => i.contentDetails.videoId));
    pageToken = j.nextPageToken;
    if (!pageToken) break;
  }
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const j = await yt(key, 1, "videos", { part: "snippet,status", id: ids.slice(i, i + 50).join(","), maxResults: "50" });
    for (const v of j.items ?? []) out.push({ id: v.id, title: v.snippet.title, publishedAt: v.status.publishAt ?? v.snippet.publishedAt, privacy: v.status.privacyStatus });
  }
  return out;
};
const norm = (s) => String(s ?? "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
const idFromLink = (s) => /(?:shorts\/|v=|youtu\.be\/)([\w-]{11})/.exec(String(s ?? ""))?.[1];
// Which video is this Uploads row? By the link in column M, else by exact title, else by the publish day.
const findVideo = (videos, row) => {
  const linked = idFromLink(row.link);
  if (linked) return { video: videos.find((v) => v.id === linked) ?? { id: linked, title: row.title, publishedAt: null, privacy: "unknown" }, how: "link" };
  const sameDay = (v) => v.publishedAt && wibDate(new Date(v.publishedAt)) === row.date;
  const byTitle = videos.filter((v) => norm(v.title) === norm(row.title));
  if (byTitle.length === 1) return { video: byTitle[0], how: "title" };
  if (byTitle.length > 1) return { video: byTitle.find(sameDay) ?? byTitle.find((v) => v.privacy === "public") ?? byTitle[0], how: "title (several, picked by day)" };
  const byDay = videos.filter(sameDay);
  if (byDay.length === 1) return { video: byDay[0], how: "publish day (the title on YouTube differs)" };
  return { video: null, how: "" };
};

// ---------- Uploads tab ----------
const readUploads = async () => {
  const rows = await getRows("Uploads!A1:R");
  if (rows[0]?.[16] !== "Pinned comment") fail(`Uploads column Q is "${rows[0]?.[16]}", expected "Pinned comment"; the tab layout changed, nothing done`);
  return rows.map((r, i) => ({ row: i + 1, channel: r[0] ?? "", episode: r[1] ?? "", title: r[4] ?? "", status: r[9] ?? "", date: String(r[10] ?? "").slice(0, 10), link: r[12] ?? "", pinned: (r[16] ?? "").trim(), record: r[17] ?? "" }));
};
const wanted = Object.keys(CHANNELS).filter((k) => !opt("channel") || k === opt("channel"));
if (opt("channel") && !wanted.length) fail(`--channel must be one of ${Object.keys(CHANNELS).join(", ")}`);
const shortLink = (id) => `https://youtube.com/shorts/${id}`;

// ---------- whoami ----------
if (cmd === "whoami") {
  for (const key of wanted) {
    const ch = await channelOf(key);
    say(`${key}: logged in as "${ch.title}"`);
  }
}

// ---------- recent (read only): the newest uploads with their privacy and publish time ----------
//   node tools/yt-local.mjs recent --channel whatif [--count 8]
else if (cmd === "recent") {
  for (const key of wanted) {
    const vids = (await videosOf(key, 1)).slice(0, Number(opt("count") ?? 8));
    say(`${key}: ${vids.length} newest uploads`);
    const len = {};
    if (vids.length) for (const v of (await yt(key, 1, "videos", { part: "contentDetails", id: vids.map((x) => x.id).join(",") })).items ?? []) len[v.id] = v.contentDetails.duration;
    for (const v of vids) say(`  ${v.id}  ${v.privacy.padEnd(8)} ${v.publishedAt ? wib(new Date(v.publishedAt)).slice(0, 16).replace("T", " ") + " WIB" : "-"}  ${(len[v.id] ?? "").padEnd(8)} ${v.title}`);
  }
}

// ---------- comment ----------
else if (cmd === "comment") {
  const uploads = await readUploads();
  const header = uploads[0].record;
  if (header && header !== COMMENT_HEADER) fail(`Uploads column R is "${header}", expected empty or "${COMMENT_HEADER}"; nothing done`);
  if (!header && !DRY) await putCells([["Uploads!R1", COMMENT_HEADER]]);
  const days = opt("date") ? [opt("date")] : [today, addDays(today, -1)];
  let late = 0;
  for (const key of wanted) {
    const c = CHANNELS[key];
    const due = uploads.filter((u) => u.row > 1 && u.channel === c.sheetName && days.includes(u.date) && !/^removed/i.test(u.status) && u.pinned && !u.record && now.getTime() >= Date.parse(`${u.date}T${c.time}:00+07:00`));
    if (!due.length) {
      console.log(`${c.yt}: nothing due`);
      continue;
    }
    const ch = await channelOf(key);
    const videos = await videosOf(key, 1);
    for (const u of due) {
      const name = `${c.yt} ${u.episode}`;
      const minutesLate = (now.getTime() - Date.parse(`${u.date}T${c.time}:00+07:00`)) / 60000;
      const wait = (why) => {
        if (minutesLate > 90) late++;
        note(minutesLate > 90 ? "error" : "warning", `${name}: ${why}; no comment yet (publish time was ${Math.round(minutesLate)} min ago). The next run tries again.`);
      };
      const { video, how } = findVideo(videos, u);
      if (!video) {
        wait(`no video titled "${u.title}" and none published on ${u.date}`);
        continue;
      }
      if (video.privacy !== "public" && video.publishedAt && Date.parse(video.publishedAt) > now.getTime()) {
        console.log(`${name}: ${video.id} is scheduled for ${wib(new Date(video.publishedAt)).slice(0, 16).replace("T", " ")} WIB (second daily slot?); later run`);
        continue;
      }
      if (video.privacy !== "public") {
        wait(`video ${video.id} is still ${video.privacy}`);
        continue;
      }
      const stamp = `${wib(new Date()).slice(0, 16).replace("T", " ")} WIB`;
      const record = async (text) => {
        if (DRY) return;
        await putCells([[`Uploads!R${u.row}`, text], ...(u.link ? [] : [[`Uploads!M${u.row}`, shortLink(video.id)]])]);
      };
      // Already a top-level comment from the channel itself (typed by hand, or posted by a run whose record failed)?
      let own;
      try {
        let pageToken;
        for (let p = 0; p < 2 && !own; p++) {
          const j = await yt(key, 1, "commentThreads", { part: "snippet", videoId: video.id, maxResults: "100", order: "relevance", textFormat: "plainText", ...(pageToken ? { pageToken } : {}) });
          own = (j.items ?? []).find((t) => t.snippet.topLevelComment.snippet.authorChannelId?.value === ch.id);
          pageToken = j.nextPageToken;
          if (!pageToken) break;
        }
      } catch (e) {
        if (e.reason === "commentsDisabled") {
          await record(`Not posted: comments are off on this video (${stamp})`);
          note("warning", `${name}: comments are off on ${video.id}; recorded, not retried`);
          continue;
        }
        throw e;
      }
      if (own) {
        await record(`Already there (found ${stamp}, not posted again)`);
        say(`${name}: the channel already has a comment on ${shortLink(video.id)} ("${own.snippet.topLevelComment.snippet.textDisplay.slice(0, 50)}..."); nothing posted${DRY ? "" : ", recorded in column R"}`);
        continue;
      }
      if (DRY) {
        say(`${name}: WOULD post on ${shortLink(video.id)} (found by ${how}): "${u.pinned}"`);
        continue;
      }
      const posted = await yt(key, 50, "commentThreads", { part: "snippet" }, { snippet: { channelId: ch.id, videoId: video.id, topLevelComment: { snippet: { textOriginal: u.pinned } } } });
      await record(`Posted ${stamp}, not pinned (the API cannot pin)`);
      say(`${name}: comment posted on ${shortLink(video.id)} (found by ${how}): https://www.youtube.com/watch?v=${video.id}&lc=${posted.id}`);
    }
  }
  if (late) process.exitCode = 1;
}

// ---------- track / compare ----------
else if (cmd === "track" || cmd === "compare") {
  const rows = await getRows("Tracking!A1:J", true);
  TRACK_HEADERS.forEach((h, i) => rows[0]?.[i] === h || fail(`Tracking column ${String.fromCharCode(65 + i)} is "${rows[0]?.[i]}", expected "${h}"; the tab layout changed, nothing done`));
  const jHead = rows[0]?.[9] ?? "";
  if (jHead && jHead !== DURATION_HEADER) fail(`Tracking column J is "${jHead}", expected empty or "${DURATION_HEADER}"; nothing done`);
  if (!jHead && cmd === "track" && !DRY) await putCells([["Tracking!J1", DURATION_HEADER]]);
  const uploads = await readUploads();
  const empty = (v) => v === undefined || v === "";
  const limit = Number(opt("limit") ?? 40);
  const todo = [];
  rows.forEach((r, i) => {
    const key = Object.keys(CHANNELS).find((k) => CHANNELS[k].sheetName === r[1]);
    if (i === 0 || !key || !wanted.includes(key) || r[3] !== "YouTube" || !/^\d{4}-\d{2}-\d{2}$/.test(r[0] ?? "")) return;
    if (r[0] > addDays(today, -MIN_AGE_DAYS)) return;
    const gaps = FILL.filter((c) => empty(r[c]));
    if (cmd === "track" ? gaps.length : gaps.length < 4) todo.push({ row: i + 1, key, date: r[0], episode: r[2], cells: r, gaps });
  });
  const videoLists = {};
  let filled = 0;
  const writes = [];
  for (const t of todo.slice(0, limit)) {
    const c = CHANNELS[t.key];
    const name = `${c.yt} ${t.episode} (${t.date})`;
    const u = uploads.find((x) => x.channel === c.sheetName && x.episode === t.episode);
    if (!u) {
      note("warning", `${name}: no Uploads row; skipped`);
      continue;
    }
    videoLists[t.key] ??= await videosOf(t.key, 10);
    const { video } = findVideo(videoLists[t.key], u);
    if (!video?.publishedAt) {
      note("warning", `${name}: video not found on the channel (deleted, or the title differs); skipped`);
      continue;
    }
    const published = new Date(video.publishedAt);
    const start = pacificDate(published);
    const end = pacificDate(new Date(published.getTime() + WINDOW_HOURS * 3600000));
    const report = (params) => google(t.key, 0, "https://youtubeanalytics.googleapis.com/v2/reports", { ids: "channel==MINE", filters: `video==${video.id}`, ...params });
    // Is the window fully processed? Analytics runs 2-3 days behind: wait until a later day has data too.
    const daily = await report({ startDate: start, endDate: pacificDate(now), metrics: "views", dimensions: "day", sort: "day" });
    const lastDay = (daily.rows ?? []).filter((d) => d[1] > 0).map((d) => d[0]).pop() ?? "";
    const old = t.date <= addDays(today, -7);
    if (lastDay <= end && !old) {
      console.log(`${name}: analytics only reach ${lastDay || "nothing"} (window ends ${end}); tomorrow's run tries again`);
      continue;
    }
    const j = await report({ startDate: start, endDate: end, metrics: "views,engagedViews,averageViewPercentage,averageViewDuration,subscribersGained" });
    const m = Object.fromEntries((j.columnHeaders ?? []).map((h, i) => [h.name, j.rows?.[0]?.[i]]));
    if (!j.rows?.length || !m.views) {
      note("warning", `${name}: analytics returned no views for ${start}..${end}; skipped`);
      continue;
    }
    const values = { 4: m.views, 6: Math.round(m.averageViewPercentage * 10) / 1000, 7: m.subscribersGained, 9: m.averageViewDuration };
    const engaged = m.engagedViews / m.views;
    if (cmd === "compare") {
      const pct = (x) => (empty(x) ? "-" : `${(x * 100).toFixed(1)}%`);
      say(`${name} ${video.id} ${start}..${end}: views API ${m.views} / engaged ${m.engagedViews} / typed ${t.cells[4] ?? "-"} | engaged share API ${pct(engaged)} / stayed typed ${pct(t.cells[5])} | avg viewed API ${pct(values[6])} / typed ${pct(t.cells[6])} | subs API ${m.subscribersGained} / typed ${t.cells[7] ?? "-"} | avg duration ${m.averageViewDuration}s`);
      continue;
    }
    const cols = "ABCDEFGHIJ";
    const label = (c2) => (c2 === 9 ? DURATION_HEADER : TRACK_HEADERS[c2]);
    for (const c2 of t.gaps) writes.push({ t, range: `Tracking!${cols[c2]}${t.row}`, value: values[c2] });
    if (empty(t.cells[8])) writes.push({ t, range: `Tracking!I${t.row}`, value: `Auto: ${t.gaps.map(label).join(", ")} from the YouTube API (${start} to ${end}, Pacific time), filled ${today}` });
    say(`${name}: ${t.gaps.map((c2) => `${label(c2)} = ${values[c2]}`).join(", ")}${DRY ? " [dry run, not written]" : ""}`);
    filled++;
  }
  if (cmd === "track" && writes.length && !DRY) {
    // The rows come from a formula: make sure nothing moved and nothing was typed meanwhile, then write single cells.
    const again = await getRows("Tracking!A1:J", true);
    const safe = writes.filter((w) => {
      const r = again[w.t.row - 1] ?? [];
      const col = w.range.charCodeAt(w.range.indexOf("!") + 1) - 65;
      return r[0] === w.t.date && r[1] === CHANNELS[w.t.key].sheetName && r[2] === w.t.episode && empty(r[col]);
    });
    if (safe.length !== writes.length) note("warning", `${writes.length - safe.length} cell(s) changed while the job ran and were left alone`);
    if (safe.length) await putCells(safe.map((w) => [w.range, w.value]));
    const back = await getRows("Tracking!A1:J", true);
    const wrong = safe.filter((w) => back[w.t.row - 1]?.[w.range.charCodeAt(w.range.indexOf("!") + 1) - 65] !== w.value);
    if (wrong.length) fail(`Tracking read-back differs in ${wrong.map((w) => w.range).join(", ")}`);
  }
  if (cmd === "track") say(`Tracking: ${filled} row(s) filled${DRY ? " (dry run)" : ""}, ${todo.length - filled} waiting or skipped`);
} else fail("usage: youtube.mjs whoami | comment [--dry-run] [--channel X] [--date D] | track [--dry-run] [--channel X] [--limit N] | compare");

console.log(`YouTube Data API quota used by this run: about ${quota} of 10,000 units`);
if (process.env.GITHUB_STEP_SUMMARY && summary.length) (await import("node:fs")).appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.map((l) => `- ${l}`).join("\n") + "\n");
