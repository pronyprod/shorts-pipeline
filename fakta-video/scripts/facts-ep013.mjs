// Ep013 facts: Jakarta-Surabaya straight line vs the 900 km strait; ships per day; Phillips Channel vs Suramadu; depth ratio.
// Haversine R = 6371.0088 km, Vincenty WGS84 cross-check. Output: data/ep013-facts.json.  Usage: node scripts/facts-ep013.mjs
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
const P = {
  jakarta: { coord: [106.8272, -6.1754], source: "Monas, Jakarta (Wikipedia, 'National Monument (Indonesia)': 6°10′31″S 106°49′38″E)" },
  surabaya: { coord: [112.7378, -7.2458], source: "Tugu Pahlawan, Surabaya (Wikipedia, 'Heroes Monument': 7°14′45″S 112°44′16″E)" },
};
const js = { haversineKm: hav(P.jakarta.coord, P.surabaya.coord), vincentyKm: vincenty(P.jakarta.coord, P.surabaya.coord) };
const out = {
  method: "great-circle haversine R=6371.0088 km, Vincenty WGS84 cross-check",
  points: P,
  jakartaSurabaya: js,
  straitLengthKm: { value: 900, source: "Wikipedia, 'Strait of Malacca' (lead: 900 km long; infobox max 930 km)" },
  lengthVsJakartaSurabaya: 900 / js.haversineKm,
  ships: { y2024: 94300, y2025: 102500, source: "Malaysia Marine Department via Reuters / Malay Mail, 23 Apr 2026" },
  shipsPerDay2025: 102500 / 365,
  phillipsKm: { value: 2.8, source: "Wikipedia, 'Strait of Malacca' (2.8 km = 1.5 nmi at Phillip Channel); Reuters/Malay Mail: 2.7 km" },
  suramaduKm: { value: 5.438, source: "Wikipedia, 'Suramadu Bridge' infobox 5,438 m" },
  phillipsVsSuramadu: 2.8 / 5.438,
  phillipsVsSuramaduLow: 2.7 / 5.438,
  depthM: { malaccaMin: 25, lombokMin: 250, malaccamaxDraft: 20.5, source: "Wikipedia, 'Malaccamax' (25 m deep strait, 20.5 m draught); 'Lombok Strait' (minimum 250 m)" },
  depthRatio: 250 / 25,
};
writeFileSync("data/ep013-facts.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
