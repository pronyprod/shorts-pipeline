// Computes the Episode 1 distances from sourced coordinates and writes data/ep001-facts.json.
// Usage: node scripts/distances.mjs
//
// Main method: great-circle (haversine) on a sphere with the IUGG mean Earth radius 6371.0088 km.
// Cross-check: Vincenty's inverse formula on the WGS84 ellipsoid (the "real" surface distance).

import { writeFileSync } from "node:fs";
import path from "node:path";

const R = 6371.0088;
const rad = (d) => (d * Math.PI) / 180;
const dms = (d, m = 0, s = 0, sign = 1) => sign * (d + m / 60 + s / 3600);

export const haversine = ([lon1, lat1], [lon2, lat2]) => {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const vincenty = ([lon1, lat1], [lon2, lat2]) => {
  const a = 6378137, f = 1 / 298.257223563, b = a * (1 - f);
  const L = rad(lon2 - lon1);
  const U1 = Math.atan((1 - f) * Math.tan(rad(lat1)));
  const U2 = Math.atan((1 - f) * Math.tan(rad(lat2)));
  const sU1 = Math.sin(U1), cU1 = Math.cos(U1), sU2 = Math.sin(U2), cU2 = Math.cos(U2);
  let lambda = L, prev, sinS, cosS, sigma, cos2a, cos2sm;
  do {
    const sL = Math.sin(lambda), cL = Math.cos(lambda);
    sinS = Math.sqrt((cU2 * sL) ** 2 + (cU1 * sU2 - sU1 * cU2 * cL) ** 2);
    cosS = sU1 * sU2 + cU1 * cU2 * cL;
    sigma = Math.atan2(sinS, cosS);
    const sinA = (cU1 * cU2 * sL) / sinS;
    cos2a = 1 - sinA ** 2;
    cos2sm = cosS - (2 * sU1 * sU2) / cos2a;
    const C = (f / 16) * cos2a * (4 + f * (4 - 3 * cos2a));
    prev = lambda;
    lambda = L + (1 - C) * f * sinA * (sigma + C * sinS * (cos2sm + C * cosS * (-1 + 2 * cos2sm ** 2)));
  } while (Math.abs(lambda - prev) > 1e-12);
  const u2 = (cos2a * (a * a - b * b)) / (b * b);
  const A = 1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
  const B = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
  const dS = B * sinS * (cos2sm + (B / 4) * (cosS * (-1 + 2 * cos2sm ** 2) - (B / 6) * cos2sm * (-3 + 4 * sinS ** 2) * (-3 + 4 * cos2sm ** 2)));
  return (b * A * (sigma - dS)) / 1000;
};

// [lon, lat]. Every point names its source.
export const POINTS = {
  sabang: {
    name: "Sabang (kota)",
    coord: [dms(95, 19, 9), dms(5, 53, 39)],
    source: "Wikipedia, 'Sabang, Aceh' infobox: 5°53′39″N 95°19′9″E (accessed 2026-10-29)",
  },
  merauke: {
    name: "Merauke (kota)",
    coord: [dms(140, 20), dms(8, 28, 0, -1)],
    source: "Wikipedia, 'Merauke' infobox: 8°28′S 140°20′E (accessed 2026-10-29)",
  },
  idWest: {
    name: "Pulau Benggala, Aceh (titik paling barat Indonesia)",
    coord: [dms(94, 58, 22), dms(5, 47, 32)],
    source: "Wikipedia, 'Extreme points of Indonesia': 5°47′32″N 94°58′22″E (accessed 2026-10-29)",
  },
  idEast: {
    name: "Muara Torasi, Merauke (titik paling timur Indonesia)",
    coord: [dms(141, 1, 10), dms(9, 7, 42, -1)],
    source: "Wikipedia, 'Extreme points of Indonesia': 9°7′42″S 141°1′10″E (accessed 2026-10-29)",
  },
  usWest: {
    name: "Cape Alava, Washington (titik paling barat AS daratan)",
    coord: [dms(124, 44, 11.8, -1), dms(48, 10)],
    source: "Wikipedia, 'Cape Alava': 48°10′N, longitude 124°44′11.8″W (accessed 2026-10-29)",
  },
  usEast: {
    name: "West Quoddy Head, Maine (titik paling timur AS daratan)",
    coord: [-66.95047, 44.81511],
    source: "Wikipedia, 'West Quoddy Head Light': 44°48′54″N 66°57′02″W (accessed 2026-10-29)",
  },
};

const pair = (a, b) => {
  const gc = haversine(POINTS[a].coord, POINTS[b].coord);
  const ell = vincenty(POINTS[a].coord, POINTS[b].coord);
  return { from: a, to: b, greatCircleKm: Math.round(gc), wgs84Km: Math.round(ell) };
};

const facts = {
  method: "Great-circle distance (haversine), sphere R = 6371.0088 km (IUGG mean radius). Cross-check: Vincenty on WGS84.",
  points: POINTS,
  sabangMerauke: pair("sabang", "merauke"),
  indonesiaExtremes: pair("idWest", "idEast"),
  usContiguous: pair("usWest", "usEast"),
  areas: {
    indonesiaKm2: 1904569,
    indonesiaSource: "Wikipedia 'Indonesia' and 'Geography of Indonesia' (total area 1,904,569 km², citing CIA World Factbook 2025), accessed 2026-10-29",
    usContiguousKm2: 8080464,
    usContiguousSource: "Wikipedia 'Contiguous United States' (3,119,884.69 sq mi = 8,080,464.3 km²), accessed 2026-10-29",
  },
};
facts.areas.ratio = +(facts.areas.usContiguousKm2 / facts.areas.indonesiaKm2).toFixed(2);

const out = path.resolve(import.meta.dirname, "..", "data", "ep001-facts.json");
writeFileSync(out, JSON.stringify(facts, null, 2));
for (const k of ["sabangMerauke", "indonesiaExtremes", "usContiguous"]) {
  const p = facts[k];
  console.log(`${k.padEnd(18)} great-circle ${p.greatCircleKm} km | WGS84 ${p.wgs84Km} km`);
}
console.log(`area ratio US contiguous / Indonesia: ${facts.areas.ratio}`);
