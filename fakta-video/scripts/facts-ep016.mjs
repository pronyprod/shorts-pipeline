// Ep016 facts: years since the 1699 successful coffee shipment. Usage: node scripts/facts-ep016.mjs
import { writeFileSync } from "node:fs";
const out = { first: 1696, second: 1699, now: 2026, years: 2026 - 1699 };
console.log(out); writeFileSync(new URL("../data/ep016-facts.json", import.meta.url), JSON.stringify(out, null, 2));
