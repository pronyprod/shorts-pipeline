// Instagram and Facebook Reels for the three channels (owner, 21 Nov 2026, Phase 3 point k). No Claude here.
//
//   node ci/meta.mjs whoami                 which Pages / Instagram accounts the token can see, matched to channels
//   node ci/meta.mjs post [--test] [--channel X] [--episode EpNNN]
//   node ci/meta.mjs plan [--caption]       (no Meta token needed) what the next run would post if every account were visible
//   node ci/meta.mjs todo                   (no Meta token needed) the next episodes per channel that need a caption file
//                                           (written by Claude in meta-captions.yml, rules in ci/CAPTIONS.md)
//   node ci/meta.mjs check-captions         validate ci/meta/captions/*.json; a broken variant is removed (plain is used)
//   node ci/meta.mjs insights               read insights of posts 48 h+ old, then the safety brake (also part of "post")
//   node ci/meta.mjs compare                trend vs plain captions per account: median reach, plays, avg watch time
//   node ci/meta.mjs selftest               caption rules and brake on made-up data
//
// Captions (owner, 23 Nov 2026): Instagram = trend-adjacent hook (or a plain searchable hook) / the surprising fact /
// a question / "Voiceover: AI" / max 5 specific hashtags (never #reels #shorts #viral #fyp). Facebook = shorter, 1-3
// hashtags. Claude writes a "trend" and a "plain" variant per episode into ci/meta/captions/<channel>-<ep>.json
// (meta-captions.yml; used while under 72 h old). This script validates them; a missing or rule-breaking variant
// falls back to a plain caption built from the sheet (title, hook line, pinned-comment question, episode hashtags).
// Safety brake: about 48 h after each post (Meta's numbers lag up to 48 h) its insights (reach, plays, avg watch time; non-follower reach when the
// API gives it) go into posted.json. When an account's last 3 measured posts are all trend captions and each reached
// under half of that account's own baseline (median of its 4-10 earlier measured posts), the account switches to plain
// captions (ci/meta/mode.json) and a "REELS WARNING" line goes into shared/PROJECT_LOG.md.
//
// What "post" does, per channel and platform (Instagram always; Facebook only for channels in META_FB_CHANNELS):
//   - candidates = live rows of the channel's queue tab (Episode exactly "EpNNN", a Video URL, a Publish at that is
//     at least 30 minutes past, so the YouTube video is public first) whose Uploads row has no Instagram/Facebook link
//   - drip-feed: at most MAX_REELS_PER_DAY (default 2) per channel and platform per WIB day, at least MIN_GAP_HOURS
//     (default 4) apart, and one per run. Order: an episode that went public on YouTube in the last 24 h first (fresh),
//     then the backlog, oldest first
//   - the MP4 is downloaded (GitHub release or Drive link from the queue row) and sent to Meta as a resumable upload
//   - Instagram: REELS container -> wait until FINISHED -> media_publish -> permalink in Uploads "Instagram link"
//     Facebook: video_reels start -> upload -> finish PUBLISHED -> link in Uploads "Facebook link"
//   - every post is recorded in ci/meta/posted.json (the workflow commits it); an episode that fails 3 times on a
//     platform is skipped from then on (listed in the summary), so one bad file never blocks the drip
//   --test: the first candidate per channel and platform goes through download, upload and Meta's processing, but is
//     NOT published (Instagram: the container is left to expire; Facebook: finished as DRAFT, then deleted). Nothing
//     is written to the sheet or posted.json.
//
// Environment: META_TOKEN (Business portfolio system user token, no expiry), GOOGLE_SA_JSON, SHEET_ID,
//              META_FB_CHANNELS (e.g. "countryballs"; add "whatif fakta" once their Pages exist and are linked),
//              MAX_REELS_PER_DAY, MIN_GAP_HOURS, META_ACCOUNTS (optional JSON override {"fakta":{"ig":"..","page":".."}}).
// Accounts are found automatically: every Page the system user can manage, with its linked Instagram account. The
// Instagram username decides the channel (countryflux*, pomprods*, faktamantra*). An Instagram account that is not
// linked to a Page yet is not visible to the API: its channel simply waits (and its backlog drips in later).
import { createSign } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CHANNELS } from "./sheet.mjs";
import { creditFor, pickTrack } from "./reels-audio.mjs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const GRAPH = "https://graph.facebook.com/v27.0";
const RUPLOAD_IG = "https://rupload.facebook.com/ig-api-upload/v27.0";
const RUPLOAD_FB = "https://rupload.facebook.com/video-upload/v27.0";
const MATCH = { countryballs: /^countryflux/i, whatif: /^pomprods/i, fakta: /^fakta/i };
const PAGE_NAME = { countryballs: /country\s*flux/i, whatif: /pom\s*prods/i, fakta: /fakta/i };

const repo = path.resolve(import.meta.dirname, "..");
const POSTED = path.join(repo, "ci", "meta", "posted.json");
const MODE = path.join(repo, "ci", "meta", "mode.json");
const CAPDIR = path.join(repo, "ci", "meta", "captions");
const LOG = path.join(repo, "shared", "PROJECT_LOG.md");
const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const TEST = args.includes("--test");
const inCI = !!process.env.GITHUB_ACTIONS;
const note = (level, msg) => console.log(inCI ? `::${level}::${msg}` : `${level.toUpperCase()}: ${msg}`);
const fail = (msg) => {
  note("error", msg);
  process.exit(1);
};
const need = (name) => process.env[name] || fail(`${name} is not set`);
const summary = [];
const say = (line) => {
  console.log(line);
  summary.push(line);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WIB_MS = 7 * 3600 * 1000;
const now = new Date();
const wibDate = (d) => new Date(d.getTime() + WIB_MS).toISOString().slice(0, 10);
const today = wibDate(now);
const MAX_DAY = Number(process.env.MAX_REELS_PER_DAY || 2);
const MIN_GAP_H = Number(process.env.MIN_GAP_HOURS || 4);
const FB_CHANNELS = String(process.env.META_FB_CHANNELS ?? "countryballs").split(/[\s,]+/).filter(Boolean);

// ---------- Google Sheets (same service account as the other jobs) ----------
const b64url = (x) => Buffer.from(x).toString("base64url");
let saToken;
const sheetToken = async () => {
  if (saToken) return saToken;
  const sa = JSON.parse(need("GOOGLE_SA_JSON"));
  const t = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 3000 }));
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }) });
  if (!r.ok) fail(`spreadsheet sign-in failed (HTTP ${r.status})`);
  saToken = (await r.json()).access_token;
  return saToken;
};
const sheets = async (method, urlPath, body) => {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${need("SHEET_ID")}${urlPath}`, { method, headers: { authorization: `Bearer ${await sheetToken()}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) fail(`Sheets API ${method} failed (HTTP ${r.status}): ${(await r.text()).slice(0, 300)}`);
  return r.json();
};
const getRows = async (range) => (await sheets("GET", `/values/${encodeURIComponent(range)}`)).values ?? [];
const colLetter = (i) => (i >= 26 ? String.fromCharCode(64 + Math.floor(i / 26)) : "") + String.fromCharCode(65 + (i % 26));
// one cell, read back exactly (the laptop's rule: any difference is an error, nothing is repaired)
const putCell = async (range, value) => {
  await sheets("PUT", `/values/${encodeURIComponent(range)}?valueInputOption=RAW`, { range, majorDimension: "ROWS", values: [[value]] });
  const back = (await getRows(range))[0]?.[0] ?? "";
  if (back !== value) fail(`${range}: wrote ${value}, read back ${back}`);
};

// ---------- Meta Graph API ----------
class MetaError extends Error {}
const graph = async (method, url, params = {}, token = need("META_TOKEN")) => {
  const full = url.startsWith("http") ? url : `${GRAPH}/${url}`;
  const body = new URLSearchParams({ ...params, access_token: token });
  const r = await fetch(method === "GET" ? `${full}?${body}` : full, { method, body: method === "GET" ? undefined : body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) {
    const e = j.error ?? {};
    if (e.code === 190) fail(`Meta token rejected (${e.message?.slice(0, 120)}). Make a new system user token and update the META_TOKEN secret.`);
    throw new MetaError(`HTTP ${r.status} ${e.type ?? ""} ${e.code ?? ""}/${e.error_subcode ?? ""}: ${(e.message ?? JSON.stringify(j)).slice(0, 250)}`);
  }
  return j;
};
const rupload = async (url, token, buf) => {
  const r = await fetch(url, { method: "POST", headers: { authorization: `OAuth ${token}`, offset: "0", file_size: String(buf.length), "content-type": "application/octet-stream" }, body: buf });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false || j.error) throw new MetaError(`upload HTTP ${r.status}: ${JSON.stringify(j).slice(0, 250)}`);
};

const accounts = async () => {
  const pages = (await graph("GET", "me/accounts", { fields: "id,name,access_token,instagram_business_account{id,username}", limit: "100" })).data ?? [];
  const found = {};
  for (const ch of Object.keys(CHANNELS)) {
    const page = pages.find((p) => MATCH[ch].test(p.instagram_business_account?.username ?? "")) ?? pages.find((p) => PAGE_NAME[ch].test(p.name ?? ""));
    found[ch] = { page, ig: page?.instagram_business_account?.id ? page.instagram_business_account : undefined };
  }
  const override = process.env.META_ACCOUNTS ? JSON.parse(process.env.META_ACCOUNTS) : {};
  for (const [ch, o] of Object.entries(override)) {
    if (o.page) found[ch].page = pages.find((p) => p.id === o.page) ?? found[ch].page;
    if (o.ig) found[ch].ig = { id: o.ig, username: o.ig };
  }
  return { pages, found };
};

// ---------- data ----------
const readPosted = () => (existsSync(POSTED) ? JSON.parse(readFileSync(POSTED, "utf8")) : { posts: [], failures: {} });
const writePosted = (p) => {
  mkdirSync(path.dirname(POSTED), { recursive: true });
  writeFileSync(POSTED, `${JSON.stringify(p, null, 2)}\n`);
};

const loadChannel = async (ch, uploads, head) => {
  const c = CHANNELS[ch];
  const q = await getRows(`'${c.queueTab}'!A3:E`);
  const live = q
    .filter((r) => /^Ep\d{3}$/.test(r[0] ?? "") && /^https:\/\//.test(r[3] ?? "") && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(r[4] ?? ""))
    .map((r) => ({ ep: r[0], title: r[1] ?? "", description: r[2] ?? "", url: r[3], at: Date.parse(r[4].length > 16 ? r[4] : `${r[4]}:00+07:00`) }));
  const iCh = head.indexOf("Channel"), iEp = head.indexOf("Episode"), iSt = head.indexOf("Status");
  for (const e of live) {
    const idx = uploads.findIndex((r) => r[iCh] === c.sheetName && r[iEp] === e.ep && !/^Removed/i.test(r[iSt] ?? ""));
    e.row = idx >= 0 ? idx + 1 : undefined; // 1-based sheet row (uploads includes the header row)
    e.links = idx >= 0 ? uploads[idx] : [];
    const f = (h) => (idx >= 0 ? String(uploads[idx][head.indexOf(h)] ?? "") : "");
    Object.assign(e, { channel: ch, hook: f("Hook line (description start)"), tags: f("Episode hashtags"), question: f("Pinned comment"), music: f("Music"), topic: f("Topic") });
  }
  return live;
};

// ---------- captions ----------
const BANNED = /^#(reels?|shorts?|viral|fyp|foryou|foryoupage|fy|explore|trending)$/i;
const NICHE = { countryballs: ["#countryballs", "#flags", "#geography"], whatif: ["#whatif", "#science"], fakta: ["#faktaunik", "#indonesia"] };
const QUESTION = { countryballs: "How many did you guess before the reveal?", whatif: "Would you survive it? Tell me below.", fakta: "Kamu sudah tahu fakta ini? Tulis di komentar!" };
const hashtagsOf = (t) => String(t).match(/#[\p{L}\p{N}_]+/gu) ?? [];
// The rules a caption must pass, whoever wrote it. Returns a list of problems (empty = fine).
export const captionProblems = (text, pf) => {
  const p = [];
  const t = String(text ?? "");
  if (!t.trim()) return ["empty"];
  if (!/Voiceover: AI/.test(t)) p.push('no "Voiceover: AI" line');
  const tags = hashtagsOf(t);
  const max = pf === "instagram" ? 5 : 3;
  if (tags.length > max) p.push(`${tags.length} hashtags (max ${max})`);
  if (pf === "facebook" && tags.length < 1) p.push("no hashtag (1-3)");
  const bad = tags.filter((h) => BANNED.test(h));
  if (bad.length) p.push(`banned hashtag ${bad.join(" ")}`);
  if (new Set(tags.map((h) => h.toLowerCase())).size !== tags.length) p.push("repeated hashtag");
  if (t.length > (pf === "instagram" ? 2200 : 1500)) p.push("too long");
  const lines = t.split("\n").filter((l) => l.trim());
  if (lines.length < (pf === "instagram" ? 4 : 3)) p.push(`only ${lines.length} lines`);
  if (!/\?/.test(t)) p.push("no question");
  return p;
};
// Plain caption built from the sheet (also the fallback when Claude's file is missing or broken).
const plainCaption = (e, pf) => {
  const tags = [];
  for (const h of [...hashtagsOf(e.tags), ...NICHE[e.channel]]) if (!BANNED.test(h) && !tags.some((x) => x.toLowerCase() === h.toLowerCase())) tags.push(h);
  const q = /\?/.test(e.question) ? e.question : QUESTION[e.channel];
  const fact = e.hook || e.description.split("\n")[0];
  const music = process.env.META_AUDIO === "own" || !e.music ? "" : `\nMusic: ${e.music} (YouTube Audio Library)`;
  if (pf === "facebook") return `${e.title}\n${q}\n\nVoiceover: AI${music}\n\n${tags.slice(0, 3).join(" ")}`;
  return `${e.title}\n${fact}\n${q}\n\nVoiceover: AI${music}\n\n${tags.slice(0, 5).join(" ")}`;
};
const readJson = (f, d) => {
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return d;
  }
};
const capFile = (ch, ep) => path.join(CAPDIR, `${ch}-${ep}.json`);
const FRESH_H = 72;
// -> { text, type: "trend" | "plain" | "plain-built", source? }
const chooseCaption = (e, pf, mode) => {
  const c = pickCaption(e, pf, mode);
  // Reels with our own music bed (META_AUDIO=own) must not credit the YouTube Audio Library track
  if (process.env.META_AUDIO === "own") c.text = c.text.split("\n").filter((l) => !/^Music:/.test(l)).join("\n");
  return c;
};
const pickCaption = (e, pf, mode) => {
  const f = readJson(capFile(e.channel, e.ep), null);
  const fresh = f && Date.now() - Date.parse(f.written) < FRESH_H * 3600000;
  const v = f?.[pf] ?? {};
  if (fresh && mode !== "plain" && v.trend && !captionProblems(v.trend, pf).length) return { text: v.trend, type: "trend", source: f.trend?.source ?? "" };
  if (f && v.plain && !captionProblems(v.plain, pf).length) return { text: v.plain, type: "plain" };
  return { text: plainCaption(e, pf), type: "plain-built" };
};
const readMode = () => readJson(MODE, {});
const modeOf = (ch, pf) => readMode()[`${ch}/${pf}`]?.mode ?? "trend";

const download = async (url) => {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new MetaError(`download HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 100000 || buf.subarray(4, 8).toString() !== "ftyp") throw new MetaError(`download is not an MP4 (${buf.length} bytes; a Drive file that is not shared "anyone with the link"?)`);
  return buf;
};

// ---------- the Reels version (CC BY music, owner 23 Nov 2026) ----------
// Only the Reels version is posted: <file>-reels.mp4 next to the YouTube file in the same GitHub release, made by
// ci/reels-audio.mjs. Episodes without one (Drive-era and older releases) are skipped, never posted with YouTube music.
const reelsUrlOf = (e) => (/^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\//.test(e.url) ? e.url.replace(/\.mp4$/i, "-reels.mp4") : null);
const reelsSeen = new Map();
const hasReels = async (e) => {
  const u = reelsUrlOf(e);
  if (!u) return false;
  if (!reelsSeen.has(u)) reelsSeen.set(u, await fetch(u, { method: "HEAD", redirect: "follow" }).then((r) => r.ok).catch(() => false));
  return reelsSeen.get(u);
};
// the credit written into the file by ci/reels-audio.mjs (falls back to the track list's pick)
const creditOf = (buf, e) => {
  const f = path.join(tmpdir(), `reels-${process.pid}.mp4`);
  writeFileSync(f, buf);
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format_tags=comment", "-of", "default=nw=1:nk=1", f], { encoding: "utf8" });
  rmSync(f, { force: true });
  const c = (r.stdout ?? "").trim();
  return /^Music: .*CC BY/.test(c) ? c : creditFor(pickTrack(e.channel, e.ep));
};
// replace any "Music:" line by the Reels track's credit, right after "Voiceover: AI"
const withCredit = (text, credit) => {
  const lines = text.split("\n").filter((l) => !/^Music:/.test(l));
  const i = lines.findIndex((l) => /Voiceover: AI/.test(l));
  lines.splice(i >= 0 ? i + 1 : lines.length, 0, credit);
  return lines.join("\n");
};

const postInstagram = async (acct, e, buf) => {
  const token = acct.page?.access_token ?? need("META_TOKEN");
  const fields = { media_type: "REELS", caption: e.cap.text, share_to_feed: "true", is_ai_generated: "true" };
  let c = await graph("POST", `${acct.ig.id}/media`, { ...fields, upload_type: "resumable" }, token);
  try {
    await rupload(`${RUPLOAD_IG}/${c.id}`, token, buf);
  } catch (err) {
    // PomProds Ep017 (22 Nov 2026): the binary upload was refused ("ProcessingFailedError") every time while other
    // files worked. Second way: Meta fetches the public file itself (a new container with video_url).
    console.log(`${e.ep}: direct upload refused (${err.message.slice(0, 120)}); trying again with the video link`);
    const r = await fetch(e.videoUrl, { method: "HEAD", redirect: "follow" });
    c = await graph("POST", `${acct.ig.id}/media`, { ...fields, video_url: r.url || e.videoUrl }, token);
  }
  let status = "";
  for (let i = 0; i < 40; i++) {
    await sleep(15000);
    status = (await graph("GET", c.id, { fields: "status_code,status" }, token)).status_code;
    if (status === "FINISHED") break;
    if (status === "ERROR" || status === "EXPIRED") throw new MetaError(`Instagram processing ${status}`);
  }
  if (status !== "FINISHED") throw new MetaError(`Instagram still ${status} after 10 minutes`);
  if (TEST) return { test: `container ${c.id} FINISHED (not published; it expires by itself)` };
  const m = await graph("POST", `${acct.ig.id}/media_publish`, { creation_id: c.id }, token);
  const link = (await graph("GET", m.id, { fields: "permalink" }, token)).permalink ?? `https://www.instagram.com/${acct.ig.username}/`;
  return { id: m.id, link };
};

const postFacebook = async (acct, e, buf) => {
  const token = acct.page.access_token;
  const s = await graph("POST", `${acct.page.id}/video_reels`, { upload_phase: "start" }, token);
  await rupload(`${RUPLOAD_FB}/${s.video_id}`, token, buf);
  for (let i = 0; i < 20; i++) {
    const st = (await graph("GET", s.video_id, { fields: "status" }, token)).status ?? {};
    if (st.uploading_phase?.status === "complete") break;
    if (st.video_status === "error" || st.video_status === "upload_failed") throw new MetaError(`Facebook upload ${st.video_status}`);
    await sleep(5000);
  }
  await graph("POST", `${acct.page.id}/video_reels`, { video_id: s.video_id, upload_phase: "finish", video_state: TEST ? "DRAFT" : "PUBLISHED", description: e.cap.text, title: e.title.slice(0, 255) }, token);
  let st = {};
  for (let i = 0; i < 40; i++) {
    await sleep(15000);
    st = (await graph("GET", s.video_id, { fields: "status" }, token)).status ?? {};
    if (st.video_status === "error" || st.processing_phase?.status === "error") throw new MetaError(`Facebook processing error: ${JSON.stringify(st).slice(0, 200)}`);
    if (TEST ? st.video_status === "ready" : st.publishing_phase?.publish_status === "published") break;
  }
  if (TEST) {
    await graph("DELETE", s.video_id, {}, token).catch(() => {});
    return { test: `reel ${s.video_id} processed as a draft (${st.video_status}), then deleted` };
  }
  if (st.publishing_phase?.publish_status !== "published") throw new MetaError(`Facebook reel ${s.video_id} not published after 10 minutes: ${JSON.stringify(st).slice(0, 200)}`);
  return { id: s.video_id, link: `https://www.facebook.com/reel/${s.video_id}` };
};

// ---------- insights and the safety brake ----------
// Instagram media insights need instagram_manage_insights; Facebook video insights need read_insights. Each metric is
// asked alone, so one the API does not offer never hides the others.
const IG_METRICS = ["reach", "views", "ig_reels_avg_watch_time", "total_interactions"];
// Facebook Reels have no reach metric (post_impressions_unique is refused for Reels, 23 Nov 2026): "reach" there = plays.
const FB_METRICS = ["blue_reels_play_count", "fb_reels_total_plays", "post_video_avg_time_watched", "post_video_followers"];
const metric = async (url, params, token) => {
  try {
    const d = (await graph("GET", url, params, token)).data ?? [];
    return { value: d[0]?.values?.[0]?.value ?? d[0]?.total_value?.value ?? null, d0: d[0] };
  } catch (e) {
    return { error: e.message.slice(0, 160) };
  }
};
const readInsights = async (p, acct) => {
  const token = acct.page?.access_token ?? need("META_TOKEN");
  const out = { at: new Date().toISOString(), ageH: Math.round((Date.now() - Date.parse(p.at)) / 3600000) };
  const errors = [];
  if (p.platform === "instagram") {
    for (const m of IG_METRICS) {
      const r = await metric(`${p.id}/insights`, { metric: m }, token);
      if (r.error) errors.push(`${m}: ${r.error}`);
      else out[m] = r.value;
    }
    // reach split into followers / non-followers, when this API version offers the breakdown
    const r = await metric(`${p.id}/insights`, { metric: "reach", breakdown: "follow_type", metric_type: "total_value" }, token);
    const res = r.d0?.total_value?.breakdowns?.[0]?.results;
    if (Array.isArray(res)) for (const x of res) out[`reach_${String(x.dimension_values?.[0] ?? "").toLowerCase()}`] = x.value;
  } else {
    for (const m of FB_METRICS) {
      const r = await metric(`${p.id}/video_insights`, { metric: m, period: "lifetime" }, token);
      if (r.error) errors.push(`${m}: ${r.error}`);
      else out[m] = r.value;
    }
  }
  out.reach = p.platform === "instagram" ? out.reach ?? null : out.blue_reels_play_count ?? out.fb_reels_total_plays ?? null;
  out.plays = p.platform === "instagram" ? out.views ?? null : out.blue_reels_play_count ?? out.fb_reels_total_plays ?? null;
  out.avgWatchMs = p.platform === "instagram" ? out.ig_reels_avg_watch_time ?? null : out.post_video_avg_time_watched ?? null;
  if (errors.length) out.errors = errors;
  return out;
};
const median = (a) => {
  const x = [...a].sort((m, n) => m - n);
  return x.length ? (x.length % 2 ? x[(x.length - 1) / 2] : (x[x.length / 2 - 1] + x[x.length / 2]) / 2) : null;
};
const logLine = (line) => {
  if (!TEST) appendFileSync(LOG, `${line}\n`);
  say(line);
};
// After insights: per account, its last 3 measured posts all trend captions and each under half the baseline
// (median reach of its 4-10 measured posts before them) -> that account uses plain captions from now on.
export const brakeDecision = (posts, acc) => {
  const measured = posts.filter((p) => `${p.channel}/${p.platform}` === acc && typeof p.insights?.reach === "number").sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (measured.length < 7) return null;
  const last3 = measured.slice(-3);
  const base = median(measured.slice(-13, -3).map((p) => p.insights.reach));
  if (!base || !last3.every((p) => p.captionType === "trend")) return null;
  if (!last3.every((p) => p.insights.reach < base / 2)) return null;
  return { reason: `last 3 trend posts reached ${last3.map((p) => p.insights.reach).join(", ")} vs baseline ${base}`, eps: last3.map((p) => p.ep) };
};
const brake = (posted) => {
  const mode = readMode();
  let changed = false;
  for (const acc of [...new Set(posted.posts.map((p) => `${p.channel}/${p.platform}`))]) {
    if ((mode[acc]?.mode ?? "trend") === "plain") continue;
    const d = brakeDecision(posted.posts, acc);
    if (!d) continue;
    mode[acc] = { mode: "plain", since: new Date().toISOString(), reason: d.reason };
    changed = true;
    logLine(`- REELS WARNING (${today}): ${acc} switched to PLAIN captions by the safety brake: ${d.reason} (${d.eps.join(", ")}). To switch back, set its mode to "trend" in ci/meta/mode.json.`);
  }
  if (changed && !TEST) writeFileSync(MODE, `${JSON.stringify(mode, null, 2)}\n`);
};
const updateInsights = async (posted, found) => {
  let n = 0;
  for (const p of posted.posts) {
    const age = (Date.now() - Date.parse(p.at)) / 3600000;
    if ((p.insights && p.insights.reach != null) || age < Number(opt("min-age") ?? 48) || age > 24 * 14 || !p.id) continue;
    const acct = found[p.channel];
    if (!acct?.page && !acct?.ig) continue;
    p.insights = await readInsights(p, acct);
    n++;
    const i = p.insights;
    say(`insights ${p.channel} ${p.platform} ${p.ep} (${i.ageH} h, ${p.captionType ?? "old caption"}): reach ${i.reach ?? "-"}, plays ${i.plays ?? "-"}, avg watch ${i.avgWatchMs ?? "-"} ms${i.errors ? `; not available: ${i.errors.map((x) => x.split(":")[0]).join(", ")}` : ""}`);
    if (i.errors?.length && i.reach == null) for (const x of [...new Set(i.errors.map((y) => y.replace(/^[^:]+: /, "")))].slice(0, 3)) say(`  error: ${x.slice(0, 200)} (${i.errors.filter((y) => y.endsWith(x)).map((y) => y.split(":")[0]).join(", ")})`);
  }
  if (n && !TEST) writePosted(posted);
  brake(posted);
  return n;
};

// The next episodes a channel/platform would post, in order (fresh first, then the backlog oldest first).
const queueFor = (posted, ch, pf, live, col) => {
  const mine = posted.posts.filter((p) => p.channel === ch && p.platform === pf);
  const key = (e) => `${ch}/${e.ep}/${pf}`;
  const cand = live.filter((e) => e.at + 30 * 60000 <= now.getTime() && e.row && !e.links[col[pf]] && !mine.some((p) => p.ep === e.ep) && (posted.failures[key(e)] ?? 0) < 3);
  const fresh = cand.filter((e) => now.getTime() - e.at < 24 * 3600000).sort((x, y) => y.at - x.at);
  const backlog = cand.filter((e) => !fresh.includes(e)).sort((x, y) => x.at - y.at);
  return { order: [...fresh, ...backlog], fresh, cand, mine, key };
};

// ---------- commands ----------
if (cmd === "whoami") {
  const { pages, found } = await accounts();
  console.log(`Pages the token can manage: ${pages.map((p) => `${p.name} (${p.id}${p.instagram_business_account ? `, Instagram @${p.instagram_business_account.username}` : ", no Instagram linked"})`).join("; ") || "none"}`);
  for (const [ch, a] of Object.entries(found)) {
    const fb = FB_CHANNELS.includes(ch);
    let limit = "";
    if (a.ig) {
      const l = await graph("GET", `${a.ig.id}/content_publishing_limit`, { fields: "quota_usage,config" }, a.page?.access_token).catch((e) => ({ err: e.message }));
      limit = l.err ? ` (limit check failed: ${l.err})` : ` (${l.data?.[0]?.quota_usage ?? "?"} of ${l.data?.[0]?.config?.quota_total ?? "?"} posts used in 24 h)`;
    }
    console.log(`${CHANNELS[ch].sheetName}: Instagram ${a.ig ? `@${a.ig.username}${limit}` : "NOT visible (link it to a Page and assign it to the system user)"}; Facebook ${fb ? (a.page ? `on, Page "${a.page.name}"` : "on, but no Page found") : "off (not in META_FB_CHANNELS)"}`);
  }
} else if (cmd === "post" || cmd === "plan") {
  const PLAN = cmd === "plan";
  const posted = readPosted();
  const { found } = PLAN ? { found: Object.fromEntries(Object.keys(CHANNELS).map((k) => [k, { ig: { id: "-" }, page: { id: "-" } }])) } : await accounts();
  if (!PLAN && !opt("episode")) await updateInsights(posted, found);
  const uploads = await getRows("'Uploads'!A1:Z");
  const head = uploads[0] ?? [];
  const col = { instagram: head.indexOf("Instagram link"), facebook: head.indexOf("Facebook link") };
  if (col.instagram < 0 || col.facebook < 0) fail(`Uploads has no "Instagram link" / "Facebook link" header`);
  let failed = false;
  for (const ch of Object.keys(CHANNELS).filter((k) => !opt("channel") || k === opt("channel"))) {
    const name = CHANNELS[ch].sheetName;
    const a = found[ch];
    const platforms = [];
    if (a.ig) platforms.push("instagram");
    else say(`${name}: Instagram not visible to the token yet: waiting`);
    if (FB_CHANNELS.includes(ch)) {
      if (a.page) platforms.push("facebook");
      else say(`${name}: Facebook is on but no Page was found: waiting`);
    }
    if (!platforms.length) continue;
    const live = await loadChannel(ch, uploads, head);
    for (const pf of platforms) {
      const q = queueFor(posted, ch, pf, live, col);
      const { fresh, mine, key } = q;
      let cand = q.cand;
      const todayN = mine.filter((p) => wibDate(new Date(p.at)) === today).length;
      const last = Math.max(0, ...mine.map((p) => Date.parse(p.at)));
      if (opt("episode")) cand = live.filter((e) => e.ep === opt("episode"));
      const skipped = live.filter((e) => (posted.failures[key(e)] ?? 0) >= 3 && !e.links[col[pf]]).map((e) => e.ep);
      if (skipped.length) say(`${name} ${pf}: skipped after 3 failures: ${skipped.join(", ")} (fix the file, then remove them from failures in ci/meta/posted.json)`);
      let next;
      for (const e of opt("episode") ? cand : q.order) if (await hasReels(e)) { next = e; break; }
      if (!next && cand.length) {
        say(`${name} ${pf}: ${cand.length} waiting, none has a Reels version (CC BY music) yet`);
        continue;
      }
      if (!next) {
        say(`${name} ${pf}: nothing waiting`);
        continue;
      }
      if (!TEST && todayN >= MAX_DAY) {
        say(`${name} ${pf}: ${todayN} posted today (max ${MAX_DAY}); ${cand.length} waiting`);
        continue;
      }
      if (!TEST && last && now.getTime() - last < MIN_GAP_H * 3600000) {
        say(`${name} ${pf}: last post ${((now.getTime() - last) / 3600000).toFixed(1)} h ago (gap ${MIN_GAP_H} h); ${cand.length} waiting`);
        continue;
      }
      next.cap = chooseCaption(next, pf, modeOf(ch, pf));
      if (PLAN) {
        say(`${name} ${pf}: next ${next.ep} (${fresh.includes(next) ? "fresh" : "backlog"}; ${cand.length} waiting, ${todayN} today; caption ${next.cap.type}, mode ${modeOf(ch, pf)})`);
        if (args.includes("--caption")) console.log(`${withCredit(next.cap.text, creditFor(pickTrack(ch, next.ep)))}\n---`);
        continue;
      }
      try {
        next.videoUrl = reelsUrlOf(next);
        const buf = await download(next.videoUrl);
        next.cap = { ...next.cap, text: withCredit(next.cap.text, creditOf(buf, next)) };
        const r = pf === "instagram" ? await postInstagram(a, next, buf) : await postFacebook(a, next, buf);
        if (TEST) {
          say(`TEST ${name} ${pf} ${next.ep} (${(buf.length / 1e6).toFixed(1)} MB, caption ${next.cap.type}): ${r.test}`);
          continue;
        }
        posted.posts.push({ channel: ch, ep: next.ep, platform: pf, at: new Date().toISOString(), id: r.id, link: r.link, captionType: next.cap.type, ...(next.cap.source ? { trend: next.cap.source } : {}) });
        delete posted.failures[key(next)];
        writePosted(posted);
        await putCell(`'Uploads'!${colLetter(col[pf])}${next.row}`, r.link);
        say(`${name} ${pf}: posted ${next.ep} ${r.link} (caption ${next.cap.type}${next.cap.source ? `: ${next.cap.source}` : ""}; ${cand.length - 1} still waiting)`);
      } catch (err) {
        if (!(err instanceof MetaError)) throw err;
        failed = true;
        if (!TEST) {
          posted.failures[key(next)] = (posted.failures[key(next)] ?? 0) + 1;
          writePosted(posted);
        }
        note("warning", `${name} ${pf} ${next.ep}: ${err.message}`);
        summary.push(`${name} ${pf} ${next.ep}: FAILED ${err.message}`);
      }
    }
  }
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary.map((l) => `- ${l}`).join("\n")}\n`, { flag: "a" });
  if (failed) process.exitCode = 1;
} else if (cmd === "todo") {
  // the next 2 episodes per channel (any platform) plus tomorrow's, whose caption file is missing or over 48 h old
  const posted = readPosted();
  const uploads = await getRows("'Uploads'!A1:Z");
  const head = uploads[0] ?? [];
  const col = { instagram: head.indexOf("Instagram link"), facebook: head.indexOf("Facebook link") };
  const todo = [];
  for (const ch of Object.keys(CHANNELS)) {
    const live = await loadChannel(ch, uploads, head);
    const eps = [];
    for (const pf of ["instagram", "facebook"]) for (const e of queueFor(posted, ch, pf, live, col).order.slice(0, 2)) if (!eps.some((x) => x.ep === e.ep)) eps.push(e);
    for (const e of live.filter((x) => x.row && x.at > now.getTime() && x.at - now.getTime() < 24 * 3600000)) if (!eps.some((x) => x.ep === e.ep)) eps.push(e);
    const withReels = [];
    for (const e of eps) if (await hasReels(e)) withReels.push(e);
    for (const e of withReels.slice(0, 3)) {
      const f = readJson(capFile(ch, e.ep), null);
      if (f && Date.now() - Date.parse(f.written) < 48 * 3600000) continue;
      todo.push({
        channel: ch,
        account: { countryballs: "Country Flux", whatif: "PomProds", fakta: "FaktaMantra" }[ch],
        language: ch === "fakta" ? "Indonesian" : "English",
        episode: e.ep,
        file: `ci/meta/captions/${ch}-${e.ep}.json`,
        youtubeTitle: e.title,
        youtubeDescription: e.description,
        hookLine: e.hook,
        topic: e.topic,
        episodeHashtags: e.tags,
        question: e.question,
        plainFallback: { instagram: plainCaption(e, "instagram"), facebook: plainCaption(e, "facebook") },
      });
    }
  }
  console.log(JSON.stringify(todo, null, 2));
} else if (cmd === "check-captions") {
  if (!existsSync(CAPDIR)) process.exit(0);
  let bad = 0;
  for (const f of readdirSync(CAPDIR).filter((x) => x.endsWith(".json"))) {
    const file = path.join(CAPDIR, f);
    const j = readJson(file, null);
    if (!j || !Date.parse(j.written)) {
      console.log(`${f}: unreadable or no "written" time: removed`);
      rmSync(file);
      bad++;
      continue;
    }
    for (const pf of ["instagram", "facebook"]) {
      for (const v of ["trend", "plain"]) {
        const t = j[pf]?.[v];
        if (t == null) continue;
        const pr = captionProblems(t, pf);
        if (pr.length) {
          console.log(`${f} ${pf} ${v}: ${pr.join("; ")}: variant removed`);
          delete j[pf][v];
          bad++;
        }
      }
    }
    if ((j.instagram?.trend || j.facebook?.trend) && !(j.trend?.source && j.trend?.sourceUrl)) {
      console.log(`${f}: trend caption without a named trend and source link: trend variants removed`);
      for (const pf of ["instagram", "facebook"]) if (j[pf]) delete j[pf].trend;
      bad++;
    }
    writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
    console.log(`${f}: ${["instagram", "facebook"].map((pf) => `${pf} ${["trend", "plain"].filter((v) => j[pf]?.[v]).join("+") || "none"}`).join(", ")}${j.trend?.source ? ` (trend: ${j.trend.source})` : ""}`);
  }
  console.log(`check-captions: ${bad} problem(s) removed`);
} else if (cmd === "insights") {
  const posted = readPosted();
  const { found } = await accounts();
  const n = await updateInsights(posted, found);
  say(`insights: ${n} post(s) measured`);
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary.map((l) => `- ${l}`).join("\n")}\n`, { flag: "a" });
} else if (cmd === "selftest") {
  // caption rules and the brake on made-up data (no network)
  let bad = 0;
  const ok = (name, cond) => {
    console.log(`${cond ? "PASS" : "FAIL"} ${name}`);
    if (!cond) bad++;
  };
  const good = ["Ronaldo's free kicks hit 130 km/h. Lightning hits far faster.", "A park ranger was struck 7 times and lived.", "Would you go outside in a storm?", "", "Voiceover: AI", "", "#lightning #whatif #science"].join("\n");
  ok("good Instagram caption passes", captionProblems(good, "instagram").length === 0);
  ok("#reels is refused", captionProblems(`${good} #reels`, "instagram").some((x) => /banned/.test(x)));
  ok("6 hashtags refused on Instagram", captionProblems(`${good} #a #b #c`, "instagram").some((x) => /hashtags/.test(x)));
  ok("no Voiceover line refused", captionProblems(good.replace("Voiceover: AI", ""), "instagram").length > 0);
  ok("no question refused", captionProblems(good.replace("?", "."), "instagram").length > 0);
  ok("Facebook max 3 hashtags", captionProblems(["Hook", "Question?", "", "Voiceover: AI", "", "#a #b #c #d"].join("\n"), "facebook").some((x) => /hashtags/.test(x)));
  const e = { channel: "fakta", title: "Bendera kita nyaris kembar sama Monako?", hook: "Merah di atas, putih di bawah.", description: "", question: "Siapa yang lebih tua?", tags: "#bendera #monako", music: "x" };
  ok("built plain Instagram caption passes its own rules", captionProblems(plainCaption(e, "instagram"), "instagram").length === 0);
  ok("built plain Facebook caption passes its own rules", captionProblems(plainCaption(e, "facebook"), "facebook").length === 0);
  const mk = (reach, type, i) => ({ channel: "c", platform: "instagram", ep: `Ep${i}`, at: new Date(Date.UTC(2026, 10, 1 + i)).toISOString(), captionType: type, insights: { reach } });
  const base = [1000, 1200, 900, 1100, 1000, 950].map((r, i) => mk(r, "plain", i));
  ok("brake fires on 3 trend posts under half", !!brakeDecision([...base, mk(300, "trend", 7), mk(400, "trend", 8), mk(200, "trend", 9)], "c/instagram"));
  ok("brake does not fire when one is fine", !brakeDecision([...base, mk(300, "trend", 7), mk(900, "trend", 8), mk(200, "trend", 9)], "c/instagram"));
  ok("brake does not fire on plain posts", !brakeDecision([...base, mk(300, "plain", 7), mk(400, "plain", 8), mk(200, "plain", 9)], "c/instagram"));
  ok("brake needs a baseline of 4", !brakeDecision([...base.slice(0, 3), mk(300, "trend", 7), mk(400, "trend", 8), mk(200, "trend", 9)], "c/instagram"));
  process.exit(bad);
} else if (cmd === "copyright") {
  // Has Meta flagged or muted any posted Reel? (the first 12 carry YouTube Audio Library music; owner 23 Nov 2026)
  // Instagram: media field copyright_check_information; Facebook: the video's status and copyright fields. Each field is
  // asked alone so one the API does not know never hides the others. A flag is also written to the log.
  const posted = readPosted();
  const { found } = await accounts();
  const flagged = [];
  for (const p of posted.posts) {
    const acct = found[p.channel];
    const token = acct?.page?.access_token ?? need("META_TOKEN");
    const fields = p.platform === "instagram" ? ["copyright_check_information", "media_product_type", "is_shared_to_feed"] : ["status", "copyright_check_information", "copyright_monitoring_status", "published"];
    const got = {};
    for (const f of fields) {
      try {
        got[f] = (await graph("GET", p.id, { fields: f }, token))[f] ?? null;
      } catch (e) {
        got[f] = `(not available: ${e.message.slice(0, 80)})`;
      }
    }
    const txt = JSON.stringify(got);
    const bad = /"matches_found":true|muted|blocked|copyright_violation|"status":"(?:error|blocked)"|"video_status":"(?:error|blocked)"/i.test(txt);
    if (bad) flagged.push(`${p.channel} ${p.platform} ${p.ep} ${p.link}`);
    say(`${bad ? "FLAGGED" : "ok"} ${p.channel} ${p.platform} ${p.ep}: ${txt.slice(0, 400)}`);
  }
  if (flagged.length) logLine(`- REELS WARNING (${today}): Meta flagged/muted ${flagged.length} Reel(s) (copyright check): ${flagged.join("; ")}`);
  say(`copyright: ${posted.posts.length} checked, ${flagged.length} flagged`);
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary.map((l) => `- ${l}`).join("\n")}\n`, { flag: "a" });
} else if (cmd === "compare") {
  const posted = readPosted();
  const rows = [];
  for (const acc of [...new Set(posted.posts.map((p) => `${p.channel}/${p.platform}`))]) {
    for (const type of ["trend", "plain", "plain-built", "old"]) {
      const ps = posted.posts.filter((p) => `${p.channel}/${p.platform}` === acc && (p.captionType ?? "old") === type && p.insights);
      if (!ps.length) continue;
      const m = (k) => median(ps.map((p) => p.insights[k]).filter((x) => typeof x === "number"));
      rows.push(`| ${acc} | ${type} | ${ps.length} | ${m("reach") ?? "-"} | ${m("plays") ?? "-"} | ${m("avgWatchMs") ?? "-"} |`);
    }
  }
  console.log(["| Account | Caption | Posts | Median reach | Median plays | Median avg watch (ms) |", "|---|---|---|---|---|---|", ...rows].join("\n"));
} else {
  fail("usage: node ci/meta.mjs whoami | post [--test] [--channel X] [--episode EpNNN] | plan [--caption] | todo | check-captions | insights | compare");
}
