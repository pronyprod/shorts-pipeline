// Weekly review, data part (the workflow runs this; Claude has no spreadsheet access).
//   node ci/review-data.mjs            writes ci-out/review/episodes.json and ci-out/review/episodes.csv
// One record per YouTube Tracking row, joined with its Uploads row (topic, title, hook, hashtags) by channel + episode.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sheetGet } from "./sheet.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const dir = path.join(repo, "ci-out", "review");
mkdirSync(dir, { recursive: true });

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[,%\s]/g, ""));
  return String(v ?? "").trim() === "" || Number.isNaN(n) ? null : n;
};
const tracking = await sheetGet("Tracking!A1:J");
const uploads = await sheetGet("Uploads!A1:Q");
const th = tracking[0];
const uh = uploads[0];
if (th[4] !== "Views at 48h" || th[6] !== "Average % viewed" || uh[2] !== "Topic" || uh[4] !== "Title") throw new Error(`unexpected headers: ${th.join("|")} / ${uh.join("|")}`);

const up = new Map();
for (const r of uploads.slice(1)) if (r[0] && r[1] && !/^removed/i.test(r[9] ?? "")) up.set(`${r[0]}|${r[1]}`, r);
const out = [];
for (const r of tracking.slice(1)) {
  if (!r[1] || r[3] !== "YouTube") continue;
  const u = up.get(`${r[1]}|${r[2]}`) ?? [];
  out.push({
    posted: r[0], channel: r[1], episode: r[2],
    views48h: num(r[4]), avgPctViewed: num(r[6]), stayedPct: num(r[5]), subs: num(r[7]), avgViewSec: num(r[9]),
    topic: u[2] ?? "", title: u[4] ?? "", hook: u[5] ?? "", music: u[6] ?? "", hashtags: u[7] ?? "", pinned: u[16] ?? "",
  });
}
writeFileSync(path.join(dir, "episodes.json"), `${JSON.stringify(out, null, 2)}\n`);
const cols = ["posted", "channel", "episode", "views48h", "avgPctViewed", "subs", "avgViewSec", "title", "topic", "hook"];
const csv = [cols.join(","), ...out.map((o) => cols.map((c) => JSON.stringify(o[c] ?? "")).join(","))].join("\n");
writeFileSync(path.join(dir, "episodes.csv"), `${csv}\n`);
console.log(`review-data: ${out.length} YouTube rows (${out.filter((o) => o.views48h !== null).length} with numbers) -> ci-out/review/`);
