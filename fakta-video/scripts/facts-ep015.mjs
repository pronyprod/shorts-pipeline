// Ep015 facts: supermoon distance vs Sabang-Merauke. Usage: node scripts/facts-ep015.mjs
import { writeFileSync } from "node:fs";
const R = 6371.0088, rad = (d) => (d * Math.PI) / 180;
const hav = ([lo1, la1], [lo2, la2]) => { const a = Math.sin(rad(la2 - la1) / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(a)); };
const sm = hav([95.32, 5.89], [140.4, -8.49]);
const perigee = 363300;
const out = { sabangMeraukeKm: +sm.toFixed(0), perigeeKm: perigee, times: +(perigee / sm).toFixed(1) };
console.log(out); writeFileSync(new URL("../data/ep015-facts.json", import.meta.url), JSON.stringify(out, null, 2));
