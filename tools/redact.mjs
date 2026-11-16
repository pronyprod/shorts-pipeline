// Removes personal details and private IDs from the copies in this repo (never from the laptop originals).
// Run by tools/sync-from-laptop.sh. Safe to run twice. It never edits the tools/ folder itself.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", ".git", "assets", "skills", "tools"]);
const TEXT = /\.(md|txt|json|ts|tsx|mjs|mts|js|yml|yaml)$/i;
const PROSE = /\.(md|txt)$/i;

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEXT.test(name) && name !== "package-lock.json") out.push(p);
  }
  return out;
};

// The spreadsheet ID, split so this file itself never holds it in one piece.
const BS = String.fromCharCode(92); // a backslash
const SHEET = ["1jLH-3Ee2c605", "pmryUBYHy8XU9s", "CCaKRl7ebklSFFm1w"].join("");

// Applied to every text file. Replacements go through a function so "$" is never special.
const everywhere = [
  [new RegExp("https://docs\.google\.com/spreadsheets/d/" + SHEET + "/edit ?", "g"), ""],
  [new RegExp(SHEET, "g"), "[SHEET_ID secret]"],
  [/joko?klar\d*(@gmail\.com)?/gi, "the owner"],
  [/gen-lang-client-\d+/g, "[project-id]"],
  [/trig_[0-9A-Za-z]+/g, "[trigger-id]"],
  [/C:[\x5c]Users[\x5c]HP VICTUS/g, "C:" + BS + "Users" + BS + "<user>"],
  [/C:\/Users\/HP VICTUS/g, "C:/Users/<user>"],
];
// Prose files only, so code and data are never touched: Google Drive file and folder IDs.
const prose = [[/(?<![A-Za-z0-9_-])1[A-Za-z0-9_-]{32}(?![A-Za-z0-9_-])/g, "[drive-id]"]];

// shared/PROJECT_LOG.md only.
const logOnly = [
  [/^Owner: .*$/m, "Owner: the channel owner (UTC+7)"],
  [/unemployed, so full-time effort/g, "full-time effort"],
  [/ \(owner's Drive, the owner\)/g, " (owner's Drive)"],
  [/ Owner's partner to be given access\./g, ""],
  [/, by owner's friend;/g, ";"],
  [/ \(incl\. friend [^)]*\)/g, ""],
  [/ \/ \[project-id\]/g, ""],
  [/Windows laptop "HP VICTUS"/g, "Windows laptop"],
];
// Whole sections that are personal finance, not pipeline: income estimates and tax notes.
const dropSections = [/^## 10c\. [\s\S]*?(?=^## )/m, /^## 10d\. [\s\S]*?(?=^## )/m];

const apply = (text, rules) => rules.reduce((t, [re, to]) => t.replace(re, () => to), text);

let changed = 0;
for (const file of walk(repo)) {
  const before = readFileSync(file, "utf8");
  let text = apply(before, everywhere);
  if (PROSE.test(file)) text = apply(text, prose);
  if (file.replaceAll("\\", "/").endsWith("shared/PROJECT_LOG.md")) {
    for (const re of dropSections) text = text.replace(re, "");
    text = apply(text, logOnly);
  }
  if (text !== before) {
    writeFileSync(file, text);
    changed++;
  }
}
console.log(`redact: ${changed} file(s) changed`);
