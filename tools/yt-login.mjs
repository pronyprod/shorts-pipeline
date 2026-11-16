// One-time YouTube login per channel, on the laptop. Nothing is written inside this repo.
//
//   node tools/yt-login.mjs countryballs      (then pick the channel "Country Flux" in the browser)
//   node tools/yt-login.mjs whatif            (PomProds)
//   node tools/yt-login.mjs fakta             (FaktaMantra)
//   node tools/yt-login.mjs paste-file        writes GITHUB_SECRETS_TO_PASTE.txt (the 5 values for GitHub)
//
// Needs the OAuth client file downloaded from Google Cloud (Desktop app), saved as
//   ..\shorts-pipeline-secrets\client_secret_....json   (the folder next to this repo, never inside it)
// Stores the logins in ..\shorts-pipeline-secrets\yt-tokens.json. Values are never printed.
import { createServer } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const CHANNELS = { countryballs: "Country Flux", whatif: "PomProds", fakta: "FaktaMantra" };
const SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl", "https://www.googleapis.com/auth/yt-analytics.readonly"];
const dir = path.resolve(import.meta.dirname, "..", "..", "shorts-pipeline-secrets");
const tokensFile = path.join(dir, "yt-tokens.json");
const stop = (msg) => {
  console.error(`yt-login: ${msg}`);
  process.exit(1);
};

const clientFile = existsSync(dir) && readdirSync(dir).find((f) => /^client_secret.*\.json$/i.test(f));
if (!clientFile) stop(`no client_secret....json in ${dir}. Download it from Google Cloud > APIs & Services > Credentials (the Desktop client) and save it there.`);
const client = JSON.parse(readFileSync(path.join(dir, clientFile), "utf8")).installed;
if (!client) stop(`${clientFile} is not a "Desktop app" client (no "installed" section). Create the client with type Desktop app.`);
const tokens = existsSync(tokensFile) ? JSON.parse(readFileSync(tokensFile, "utf8")) : {};

const key = process.argv[2];
if (key === "paste-file") {
  const missing = Object.keys(CHANNELS).filter((k) => !tokens[k]);
  if (missing.length) stop(`not logged in yet: ${missing.join(", ")}`);
  const blocks = [
    ["YT_CLIENT_ID", client.client_id],
    ["YT_CLIENT_SECRET", client.client_secret],
    ["YT_REFRESH_COUNTRYBALLS", tokens.countryballs.refresh],
    ["YT_REFRESH_WHATIF", tokens.whatif.refresh],
    ["YT_REFRESH_FAKTA", tokens.fakta.refresh],
  ];
  const out = path.join(dir, "GITHUB_SECRETS_TO_PASTE.txt");
  writeFileSync(out, "GitHub > the repo > Settings > Secrets and variables > Actions > New repository secret.\nFive secrets: the Name is the line in capitals, the Secret is the line under it (the whole line, nothing else).\nDelete this file when done.\n\n" + blocks.map(([n, v]) => `${n}\n${v}\n`).join("\n"));
  console.log(`Written: ${out}`);
  process.exit(0);
}
if (!CHANNELS[key]) stop(`say which channel: ${Object.keys(CHANNELS).join(" | ")} (or paste-file)`);

const verifier = randomBytes(48).toString("base64url");
const state = randomBytes(16).toString("hex");
const server = createServer();
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const redirect = `http://127.0.0.1:${server.address().port}`;
const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: client.client_id,
  redirect_uri: redirect,
  response_type: "code",
  scope: SCOPES.join(" "),
  access_type: "offline",
  prompt: "consent select_account",
  state,
  code_challenge: createHash("sha256").update(verifier).digest("base64url"),
  code_challenge_method: "S256",
})}`;
console.log(`\nLogin for ${CHANNELS[key]}. A browser window opens now.\n  1. Pick the Google account, then the channel "${CHANNELS[key]}" (not the personal account).\n  2. "Google hasn't verified this app": Advanced > Go to ... (unsafe). That is our own app.\n  3. Tick both boxes if shown, then Continue.\nIf no window opens, copy this address into the browser:\n${url}\n`);
if (process.platform === "win32") spawn("rundll32", ["url.dll,FileProtocolHandler", url], { detached: true, stdio: "ignore" }).unref();
else spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], { detached: true, stdio: "ignore" }).unref();

const code = await new Promise((resolve) => {
  const timer = setTimeout(() => stop("no login within 10 minutes; run it again"), 600000);
  server.on("request", (req, res) => {
    const q = new URL(req.url, redirect).searchParams;
    if (!q.get("code") && !q.get("error")) return res.end();
    res.setHeader("content-type", "text/html; charset=utf-8");
    if (q.get("state") !== state || q.get("error")) {
      res.end("<h2>Login not completed. Close this tab and run the command again.</h2>");
      stop(`login not completed (${q.get("error") ?? "state mismatch"})`);
    }
    res.end("<h2>Done. You can close this tab and go back to Claude.</h2>");
    clearTimeout(timer);
    resolve(q.get("code"));
  });
});
server.close();

const r = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: client.client_id, client_secret: client.client_secret, redirect_uri: redirect, code_verifier: verifier }),
});
const t = await r.json();
if (!r.ok || !t.refresh_token) stop(`Google gave no long-lived login (HTTP ${r.status} ${t.error ?? ""}). Run it again.`);
const granted = (t.scope ?? "").split(" ");
const lacking = SCOPES.filter((s) => !granted.includes(s));
if (lacking.length) stop(`a permission box was left unticked (${lacking.map((s) => s.split("/").pop()).join(", ")}). Run it again and tick both.`);

const me = await (await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { authorization: `Bearer ${t.access_token}` } })).json();
const title = me.items?.[0]?.snippet?.title;
const same = (a, b) => a.toLowerCase().replace(/\s/g, "").includes(b.toLowerCase().replace(/\s/g, ""));
if (!title || !same(title, CHANNELS[key])) stop(`that login is for "${title ?? "an account without a channel"}", not "${CHANNELS[key]}". Nothing saved. Run it again and pick the channel ${CHANNELS[key]}.`);

tokens[key] = { channel: title, channelId: me.items[0].id, refresh: t.refresh_token, savedAt: new Date().toISOString() };
writeFileSync(tokensFile, JSON.stringify(tokens, null, 2));
const left = Object.keys(CHANNELS).filter((k) => !tokens[k]);
console.log(`Saved the login for "${title}". ${left.length ? `Still to do: ${left.join(", ")}` : "All 3 channels are logged in."}`);
process.exit(0);
