// Ep010 facts: Leonid speed conversions and the Jakarta-Surabaya time at meteor speed. Output: data/ep010-facts.json
import { writeFileSync } from "node:fs";
const R = 6371.0088, rad = Math.PI / 180;
const hav = ([o1, a1], [o2, a2]) => { const h = Math.sin((a2 - a1) * rad / 2) ** 2 + Math.cos(a1 * rad) * Math.cos(a2 * rad) * Math.sin((o2 - o1) * rad / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
// Monas, Jakarta (-6.1754, 106.8272); Tugu Pahlawan, Surabaya (-7.2458, 112.7378) (Wikipedia coordinates)
const jakarta = [106.8272, -6.1754], surabaya = [112.7378, -7.2458];
const speedKmS = 71;            // NASA Leonids page (body text: 71 km/s; fast facts 69.7 km/s)
const soundKmS = 0.343;         // speed of sound in air at 20 °C
const jkSbKm = hav(jakarta, surabaya);
const out = {
  speedKmS, speedKmH: speedKmS * 3600, timesSound: speedKmS / soundKmS,
  jkSbKm, jkSbSec: jkSbKm / speedKmS, jkSbSecAt69_7: jkSbKm / 69.7,
  sabangMeraukeKm: 5240, sabangMeraukeSec: 5240 / speedKmS,
  storm1833PerHour: 150000, storm1966PerSec: 70, storm1966PerHour: 70 * 3600, rate2026PerHour: [10, 15],
  cometKm: 3.6, orbitYears: 33, nextReturn: 2031,
  points: { jakarta, surabaya },
};
writeFileSync("data/ep010-facts.json", JSON.stringify(out, null, 2));
console.log(out);
