// Instagram and Facebook Reels for the three channels (owner, 21 Nov 2026, Phase 3 point k). No Claude here.
//
//   node ci/meta.mjs whoami                 which Pages / Instagram accounts the token can see, matched to channels
//   node ci/meta.mjs post [--test] [--channel X] [--episode EpNNN]
//   node ci/meta.mjs plan                   (no Meta token needed) what the next run would post if every account were visible
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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CHANNELS } from "./sheet.mjs";

const GRAPH = "https://graph.facebook.com/v27.0";
const RUPLOAD_IG = "https://rupload.facebook.com/ig-api-upload/v27.0";
const RUPLOAD_FB = "https://rupload.facebook.com/video-upload/v27.0";
const MATCH = { countryballs: /^countryflux/i, whatif: /^pomprods/i, fakta: /^fakta/i };
const PAGE_NAME = { countryballs: /country\s*flux/i, whatif: /pom\s*prods/i, fakta: /fakta/i };

const repo = path.resolve(import.meta.dirname, "..");
const POSTED = path.join(repo, "ci", "meta", "posted.json");
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
  }
  return live;
};

const caption = (e) => {
  let text = `${e.title}\n\n${e.description}`.replace(/#shorts\b/gi, "#reels");
  let n = 0;
  text = text.replace(/#[\p{L}\p{N}_]+/gu, (t) => (++n > 30 ? "" : t)).replace(/[ \t]+\n/g, "\n").trim(); // Instagram allows 30 hashtags
  return text.slice(0, 2200);
};

const download = async (url) => {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new MetaError(`download HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 100000 || buf.subarray(4, 8).toString() !== "ftyp") throw new MetaError(`download is not an MP4 (${buf.length} bytes; a Drive file that is not shared "anyone with the link"?)`);
  return buf;
};

const postInstagram = async (acct, e, buf) => {
  const token = acct.page?.access_token ?? need("META_TOKEN");
  const c = await graph("POST", `${acct.ig.id}/media`, { media_type: "REELS", upload_type: "resumable", caption: caption(e), share_to_feed: "true", is_ai_generated: "true" }, token);
  await rupload(`${RUPLOAD_IG}/${c.id}`, token, buf);
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
  await graph("POST", `${acct.page.id}/video_reels`, { video_id: s.video_id, upload_phase: "finish", video_state: TEST ? "DRAFT" : "PUBLISHED", description: caption(e), title: e.title.slice(0, 255) }, token);
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
      const mine = posted.posts.filter((p) => p.channel === ch && p.platform === pf);
      const todayN = mine.filter((p) => wibDate(new Date(p.at)) === today).length;
      const last = Math.max(0, ...mine.map((p) => Date.parse(p.at)));
      const key = (e) => `${ch}/${e.ep}/${pf}`;
      let cand = live.filter((e) => e.at + 30 * 60000 <= now.getTime() && e.row && !e.links[col[pf]] && !mine.some((p) => p.ep === e.ep) && (posted.failures[key(e)] ?? 0) < 3);
      if (opt("episode")) cand = live.filter((e) => e.ep === opt("episode"));
      const skipped = live.filter((e) => (posted.failures[key(e)] ?? 0) >= 3 && !e.links[col[pf]]).map((e) => e.ep);
      if (skipped.length) say(`${name} ${pf}: skipped after 3 failures: ${skipped.join(", ")} (fix the file, then remove them from failures in ci/meta/posted.json)`);
      const fresh = cand.filter((e) => now.getTime() - e.at < 24 * 3600000).sort((x, y) => y.at - x.at);
      const backlog = cand.filter((e) => !fresh.includes(e)).sort((x, y) => x.at - y.at);
      const next = [...fresh, ...backlog][0];
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
      if (PLAN) {
        say(`${name} ${pf}: next ${next.ep} (${fresh.includes(next) ? "fresh" : "backlog"}; ${cand.length} waiting, ${todayN} today)`);
        if (args.includes("--caption")) console.log(caption(next));
        continue;
      }
      try {
        const buf = await download(next.url);
        const r = pf === "instagram" ? await postInstagram(a, next, buf) : await postFacebook(a, next, buf);
        if (TEST) {
          say(`TEST ${name} ${pf} ${next.ep} (${(buf.length / 1e6).toFixed(1)} MB): ${r.test}`);
          continue;
        }
        posted.posts.push({ channel: ch, ep: next.ep, platform: pf, at: new Date().toISOString(), id: r.id, link: r.link });
        delete posted.failures[key(next)];
        writePosted(posted);
        await putCell(`'Uploads'!${colLetter(col[pf])}${next.row}`, r.link);
        say(`${name} ${pf}: posted ${next.ep} ${r.link} (${cand.length - 1} still waiting)`);
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
} else {
  fail("usage: node ci/meta.mjs whoami | post [--test] [--channel X] [--episode EpNNN]");
}
