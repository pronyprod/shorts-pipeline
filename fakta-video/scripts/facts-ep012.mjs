// Ep012 facts: straight-line (great-circle) distance Tidore -> Seville vs Sabang -> Merauke; years between dates.
// Haversine R = 6371.0088 km, Vincenty WGS84 cross-check. Output: data/ep012-facts.json.  Usage: node scripts/facts-ep012.mjs
import { readFileSync, writeFileSync } from "node:fs";
const R = 6371.0088, rad = Math.PI / 180;
const hav = ([l1, p1], [l2, p2]) => { const a = Math.sin(((p2 - p1) * rad) / 2) ** 2 + Math.cos(p1 * rad) * Math.cos(p2 * rad) * Math.sin(((l2 - l1) * rad) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(a)); };
function vincenty([L1, B1], [L2, B2]) {
  const a = 6378137, f = 1 / 298.257223563, b = a * (1 - f);
  const U1 = Math.atan((1 - f) * Math.tan(B1 * rad)), U2 = Math.atan((1 - f) * Math.tan(B2 * rad)), L = (L2 - L1) * rad;
  let l = L, s, c, sg, sa, c2a, c2m, lp;
  for (let i = 0; i < 200; i++) {
    const sl = Math.sin(l), cl = Math.cos(l);
    s = Math.hypot(Math.cos(U2) * sl, Math.cos(U1) * Math.sin(U2) - Math.sin(U1) * Math.cos(U2) * cl);
    c = Math.sin(U1) * Math.sin(U2) + Math.cos(U1) * Math.cos(U2) * cl; sg = Math.atan2(s, c);
    sa = (Math.cos(U1) * Math.cos(U2) * sl) / s; c2a = 1 - sa * sa; c2m = c - (2 * Math.sin(U1) * Math.sin(U2)) / c2a;
    const C = (f / 16) * c2a * (4 + f * (4 - 3 * c2a)); lp = l;
    l = L + (1 - C) * f * sa * (sg + C * s * (c2m + C * c * (-1 + 2 * c2m * c2m))); if (Math.abs(l - lp) < 1e-12) break;
  }
  const u2 = (c2a * (a * a - b * b)) / (b * b), A = 1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2))), B = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
  const ds = B * s * (c2m + (B / 4) * (c * (-1 + 2 * c2m * c2m) - (B / 6) * c2m * (-3 + 4 * s * s) * (-3 + 4 * c2m * c2m)));
  return (b * A * (sg - ds)) / 1000;
}
const ep1 = JSON.parse(readFileSync("data/ep001-facts.json", "utf8")).points;
const P = {
  tidore: { coord: [127.4, 0.68], source: "Wikipedia, 'Tidore' (island) infobox: 0°41′N 127°24′E" },
  seville: { coord: [-5.9869, 37.3772], source: "Wikipedia, 'Seville' infobox: 37°22′38″N 5°59′13″W" },
  sabang: ep1.sabang, merauke: ep1.merauke,
};
const d = (a, b) => ({ haversineKm: hav(P[a].coord, P[b].coord), vincentyKm: vincenty(P[a].coord, P[b].coord) });
const route = d("tidore", "seville"), home = d("sabang", "merauke");
const out = {
  method: "great-circle haversine R=6371.0088 km, Vincenty WGS84 cross-check",
  points: P, tidoreSeville: route, sabangMerauke: home,
  ratio: route.haversineKm / home.haversineKm,
  years: { voyageToLinnaeus: 1758 - 1522, voyageToLesson: 1824 - 1522 },
};
writeFileSync("data/ep012-facts.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify({ route, home, ratio: out.ratio, years: out.years }, null, 1));
