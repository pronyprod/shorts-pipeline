// Runs ci/youtube.mjs on the laptop with the values from ..\shorts-pipeline-secrets (never printed).
//   node tools/yt-local.mjs whoami
//   node tools/yt-local.mjs comment --dry-run
//   node tools/yt-local.mjs track --dry-run
// Needs in that folder: the service account key (*.json with "private_key"), SHEET_ID.txt,
// client_secret....json and yt-tokens.json (made by tools/yt-login.mjs).
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const dir = path.resolve(import.meta.dirname, "..", "..", "shorts-pipeline-secrets");
const read = (f) => readFileSync(path.join(dir, f), "utf8");
const files = readdirSync(dir);
const client = JSON.parse(read(files.find((f) => /^client_secret.*\.json$/i.test(f)))).installed;
const tokens = JSON.parse(read("yt-tokens.json"));
const env = {
  ...process.env,
  GOOGLE_SA_JSON: read(files.find((f) => f.endsWith(".json") && read(f).includes('"private_key"'))),
  SHEET_ID: read("SHEET_ID.txt").trim(),
  YT_CLIENT_ID: client.client_id,
  YT_CLIENT_SECRET: client.client_secret,
  YT_REFRESH_COUNTRYBALLS: tokens.countryballs?.refresh ?? "",
  YT_REFRESH_WHATIF: tokens.whatif?.refresh ?? "",
  YT_REFRESH_FAKTA: tokens.fakta?.refresh ?? "",
};
const r = spawnSync(process.execPath, [path.resolve(import.meta.dirname, "..", "ci", "youtube.mjs"), ...process.argv.slice(2)], { env, stdio: "inherit" });
process.exit(r.status ?? 1);
