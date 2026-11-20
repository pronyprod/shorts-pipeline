// Ep017 facts: constants only (no computation needed). Usage: node scripts/facts-ep017.mjs
import { writeFileSync } from "node:fs";
const out = { year: 1818, decree: 1993, diameterM: 1 };
console.log(out); writeFileSync(new URL("../data/ep017-facts.json", import.meta.url), JSON.stringify(out, null, 2));
