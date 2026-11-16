// Computes the numbers for Ep002 (coastline) and Ep003 (Krakatau) from sourced inputs.
// Writes data/ep002-facts.json and data/ep003-facts.json. Usage: node scripts/facts-ep002-003.mjs
// Sources for every input are listed in episodes/Ep002.md and episodes/Ep003.md.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const R = 6371.0088; // IUGG mean Earth radius (km)
const rad = (d) => (d * Math.PI) / 180;
const hav = ([lon1, lat1], [lon2, lat2]) => {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
const r1 = (x) => Math.round(x * 10) / 10;

// ---------------- Ep002: coastline ----------------
const EQUATOR_KM = 2 * Math.PI * 6378.137; // WGS84 equatorial radius -> 40.075 km
const BIG_2013 = 99093; // BIG 2013 (secondary citations, see Ep002.md)
const BIG_NEW = 108000; // BIG e-book "Jelajah Pantai Indonesia"
const CIA = 54716; // CIA World Factbook
const WRI = 95181; // World Resources Institute (World Vector Shoreline 1:250.000)
const SABANG_MERAUKE = JSON.parse(readFileSync(path.join(root, "data/ep001-facts.json"), "utf8")).sabangMerauke.greatCircleKm;
const WALK_KMH = 5;

// Coastline paradox, measured on our own map data: Sulawesi (Natural Earth 1:50m) with the "divider" method.
const idn = JSON.parse(readFileSync(path.join(root, "src/data/indonesia.json"), "utf8"));
const polys = idn.geometry.coordinates.map((p) => p[0]);
const bbox = (ring) => ring.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [999, 999, -999, -999]);
const sulawesi = polys
  .filter((ring) => { const b = bbox(ring); return b[0] > 118 && b[2] < 126 && b[3] > 1 && b[1] < -5; })
  .sort((a, b) => b.length - a.length)[0];
if (!sulawesi) throw new Error("Sulawesi not found");
const perimeter = sulawesi.slice(1).reduce((a, p, i) => a + hav(sulawesi[i], p), 0);
// walk a pair of dividers (compass) set to `ruler` km around the coast; returns the measured length and the points
const divide = (ring, ruler) => {
  const pts = [ring[0]];
  // position along the coast = segment index i (ring[i-1] -> ring[i]) and fraction t0 on it; always moves forward
  let cur = ring[0], i = 1, t0 = 0;
  for (;;) {
    while (i < ring.length && hav(cur, ring[i]) < ruler) { i++; t0 = 0; }
    if (i >= ring.length) break;
    // binary search on the rest of segment i for the point exactly `ruler` away from cur
    const at = (t) => [ring[i - 1][0] + (ring[i][0] - ring[i - 1][0]) * t, ring[i - 1][1] + (ring[i][1] - ring[i - 1][1]) * t];
    let lo = t0, hi = 1;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (hav(cur, at(m)) < ruler) lo = m; else hi = m; }
    cur = at(hi);
    t0 = hi;
    pts.push(cur);
  }
  const length = (pts.length - 1) * ruler + hav(cur, ring[0]);
  pts.push(ring[0]);
  return { ruler, steps: pts.length - 2, lengthKm: Math.round(length), points: pts.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]) };
};
const rulers = [400, 200, 100, 50, 25].map((r) => divide(sulawesi, r));

const ep002 = {
  equatorKm: Math.round(EQUATOR_KM),
  coast: { big2013: BIG_2013, bigNew: BIG_NEW, cia: CIA, wri: WRI },
  laps: { big2013: +(BIG_2013 / EQUATOR_KM).toFixed(3), bigNew: +(BIG_NEW / EQUATOR_KM).toFixed(3), cia: +(CIA / EQUATOR_KM).toFixed(3) },
  sabangMeraukeKm: SABANG_MERAUKE,
  timesSabangMerauke: r1(BIG_2013 / SABANG_MERAUKE),
  walk: { kmh: WALK_KMH, hours: Math.round(BIG_2013 / WALK_KMH), days: Math.round(BIG_2013 / WALK_KMH / 24), years: +(BIG_2013 / WALK_KMH / 24 / 365.25).toFixed(2) },
  ciaShareOfBig: +(CIA / BIG_2013).toFixed(3),
  sulawesi: { source: "Natural Earth 1:50m admin-0 (src/data/indonesia.json)", vertices: sulawesi.length, perimeterKm: Math.round(perimeter), rulers },
};
writeFileSync(path.join(root, "data/ep002-facts.json"), JSON.stringify(ep002, null, 1));
console.log("Ep002:", JSON.stringify({ ...ep002, sulawesi: { ...ep002.sulawesi, rulers: rulers.map(({ ruler, steps, lengthKm }) => ({ ruler, steps, lengthKm })) } }, null, 1));

// ---------------- Ep003: Krakatau ----------------
const P = {
  krakatau: { coord: [105.423, -6.102], source: "Wikipedia, 'Krakatoa' infobox: 6°06′07″S 105°25′23″E (accessed 2026-10-31)" },
  rodrigues: { coord: [63.417, -19.717], source: "Wikipedia, 'Rodrigues' infobox: 19°43′S 63°25′E (accessed 2026-10-31)" },
  tokyo: { coord: [139.692, 35.69], source: "Wikipedia, 'Tokyo' (35°41′N 139°41′E)" },
  vienna: { coord: [16.372, 48.208], source: "Wikipedia, 'Vienna' (48°12′N 16°22′E)" },
  newYork: { coord: [-74.006, 40.713], source: "Wikipedia, 'New York City' (40°43′N 74°00′W)" },
  glasgow: { coord: [-4.251, 55.861], source: "Wikipedia, 'Glasgow' (55°52′N 4°15′W)" },
  medellin: { coord: [-75.575, 6.244], source: "Wikipedia, 'Medellín' (6°15′N 75°35′W)" },
};
const K = P.krakatau.coord;
const antipode = [K[0] > 0 ? K[0] - 180 : K[0] + 180, -K[1]];
const SOUND_MS = 343; // speed of sound in air at 20 °C
const WAVE_MS = 300; // pressure wave: observed 300-325 m/s (Gabrielson 2010); low end matches the reported arrival times
const EARTH_AREA = 4 * Math.PI * R * R;
const ID_LAND_KM2 = 1904569; // Indonesia total area (same source as Ep001)
const dist = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, Math.round(hav(K, v.coord))]));
const ep003 = {
  points: P,
  antipode: antipode.map((x) => +x.toFixed(3)),
  antipodeToMedellinKm: Math.round(hav(antipode, P.medellin.coord)),
  distKm: dist,
  sabangMeraukeKm: SABANG_MERAUKE,
  rodriguesVsSabangMerauke: +(dist.rodrigues / SABANG_MERAUKE).toFixed(3),
  soundHoursToRodrigues: +((dist.rodrigues * 1000) / SOUND_MS / 3600).toFixed(2),
  waveHours: Object.fromEntries(["tokyo", "vienna", "newYork"].map((k) => [k, +((dist[k] * 1000) / WAVE_MS / 3600).toFixed(1)])),
  waveHoursToAntipode: +((Math.PI * R * 1000) / WAVE_MS / 3600).toFixed(1),
  reported: { tokyoH: 6, viennaH: 10, newYorkH: 15, stations: "more than 50", glasgowPassages: 7, glasgowHours: [11, 25, 48, 59, 84, 94, 121], audibleShareOfEarth: 1 / 13 },
  audibleAreaKm2: Math.round(EARTH_AREA / 13),
  audibleVsIndonesia: r1(EARTH_AREA / 13 / ID_LAND_KM2),
};
writeFileSync(path.join(root, "data/ep003-facts.json"), JSON.stringify(ep003, null, 1));
console.log("Ep003:", JSON.stringify({ ...ep003, points: undefined }, null, 1));
