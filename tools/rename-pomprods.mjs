// One-off (owner, 22 Nov 2026): rename the channel "What If" to "PomProds" in the spreadsheet, all at once.
//   node tools/rename-pomprods.mjs --dry-run     show what would change
//   node tools/rename-pomprods.mjs               do it (run from the laptop, with the shorts-pipeline-secrets folder)
// Changes: tab "Queue What If" -> "Queue PomProds"; Uploads column A "What If" -> "PomProds"; Hashtags A "What If" ->
// "PomProds"; the Tracking A2 formula's channel order list. Tracking columns E:J are typed/auto values sitting next to
// the A:D formula, so the formula's sort order must stay identical: this script compares Tracking A:D (date, episode,
// position) before and after and stops loudly if any row moved. Summary reads the names from Hashtags, so it follows.
import { readFileSync, readdirSync } from "node:fs";
import { createSign } from "node:crypto";
import path from "node:path";

const DRY = process.argv.includes("--dry-run");
const dir = path.resolve(import.meta.dirname, "..", "..", "shorts-pipeline-secrets");
const read = (f) => readFileSync(path.join(dir, f), "utf8");
const sa = JSON.parse(readdirSync(dir).filter((f) => f.endsWith(".json")).map(read).find((t) => t.includes('"private_key"')));
const id = read("SHEET_ID.txt").trim();
const b64 = (x) => Buffer.from(x).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const head = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
const claim = b64(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 900 }));
const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key).toString("base64url");
const token = (await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }) })).json()).access_token;
const api = async (method, p, body) => {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${p}`, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${p}: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r.json();
};
const get = async (range, mode = "FORMATTED_VALUE") => (await api("GET", `/values/${encodeURIComponent(range)}?valueRenderOption=${mode}`)).values ?? [];
const put = (data) => api("POST", "/values:batchUpdate", { valueInputOption: "USER_ENTERED", data });

const OLD = "What If";
const NEW = "PomProds";
const meta = await api("GET", "?fields=sheets.properties(title,sheetId)");
const tab = meta.sheets.find((s) => s.properties.title === `Queue ${OLD}`);
if (!tab) throw new Error(`tab "Queue ${OLD}" not found (already renamed?)`);

const trackBefore = (await get("Tracking!A2:J")).map((r) => [r[0], r[1], r[2], r[4] ?? ""]);
const uploads = await get("Uploads!A1:A");
const uRows = uploads.map((r, i) => [r[0], i + 1]).filter(([v]) => v === OLD).map(([, i]) => i);
const hashtags = await get("Hashtags!A1:A");
const hRows = hashtags.map((r, i) => [r[0], i + 1]).filter(([v]) => v === OLD).map(([, i]) => i);
const f = (await get("Tracking!A2", "FORMULA"))[0]?.[0] ?? "";
const fNew = f.replace(`"${OLD}"`, `"${NEW}"`);
console.log(`tab: "Queue ${OLD}" -> "Queue ${NEW}" (sheetId ${tab.properties.sheetId})`);
console.log(`Uploads A rows to change: ${uRows.length} (${uRows.slice(0, 5).join(", ")}...)`);
console.log(`Hashtags A rows to change: ${hRows.join(", ")}`);
console.log(`Tracking A2 formula changes: ${f !== fNew}`);
if (f === fNew) throw new Error("Tracking A2 formula has no \"What If\" in its order list");
if (DRY) process.exit(0);

await api("POST", ":batchUpdate", { requests: [{ updateSheetProperties: { properties: { sheetId: tab.properties.sheetId, title: `Queue ${NEW}` }, fields: "title" } }] });
await put([
  ...uRows.map((r) => ({ range: `Uploads!A${r}`, values: [[NEW]] })),
  ...hRows.map((r) => ({ range: `Hashtags!A${r}`, values: [[NEW]] })),
  { range: "Tracking!A2", values: [[fNew]] },
]);
const trackAfter = (await get("Tracking!A2:J")).map((r) => [r[0], r[1] === NEW ? OLD : r[1], r[2], r[4] ?? ""]);
const moved = trackBefore.filter((row, i) => JSON.stringify(row) !== JSON.stringify(trackAfter[i] ?? []));
if (moved.length) {
  console.error(`STOP: ${moved.length} Tracking rows no longer line up with their numbers, e.g. ${JSON.stringify(moved[0])}`);
  process.exit(2);
}
const left = (await get("Uploads!A1:A")).filter((r) => r[0] === OLD).length;
console.log(`done: tab renamed, ${uRows.length} Uploads rows, ${hRows.length} Hashtags row(s), Tracking formula; Tracking rows line up (${trackBefore.length}); "${OLD}" left in Uploads A: ${left}`);
