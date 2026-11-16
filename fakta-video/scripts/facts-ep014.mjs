// Ep014 facts: Papua's share of Indonesia's regional languages. Usage: node scripts/facts-ep014.mjs
import { writeFileSync } from "node:fs";
const out = { total: 718, papua: 428, sharePct: +(428 / 718 * 100).toFixed(1), png: 840, idn: 715, nga: 527 };
console.log(out); writeFileSync(new URL("../data/ep014-facts.json", import.meta.url), JSON.stringify(out, null, 2));
