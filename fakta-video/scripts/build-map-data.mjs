// Turns Natural Earth 1:50m countries (public domain) into the small GeoJSON files the video uses.
// Input:  data/raw/ne_50m_admin_0_countries.geojson
// Output: src/data/countries.json  (all countries, outlines only, coordinates rounded to 0.01°)
//         src/data/indonesia.json  (Indonesia, full detail)
//         src/data/usa48.json      (contiguous United States: Alaska and Hawaii removed)
// Usage: node scripts/build-map-data.mjs

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geoArea, geoBounds } from "d3-geo";

const root = path.resolve(import.meta.dirname, "..");
const ne = JSON.parse(readFileSync(path.join(root, "data/raw/ne_50m_admin_0_countries.geojson"), "utf8"));
const outDir = path.join(root, "src/data");
mkdirSync(outDir, { recursive: true });

const round = (c) => (typeof c[0] === "number" ? [+c[0].toFixed(3), +c[1].toFixed(3)] : c.map(round));
const slim = (f, digits = true) => ({
  type: "Feature",
  properties: { iso: f.properties.ADM0_A3, name: f.properties.NAME },
  geometry: { type: f.geometry.type, coordinates: digits ? round(f.geometry.coordinates) : f.geometry.coordinates },
});
const byIso = (iso) => ne.features.find((f) => f.properties.ADM0_A3 === iso);

const countries = { type: "FeatureCollection", features: ne.features.map((f) => slim(f)) };
writeFileSync(path.join(outDir, "countries.json"), JSON.stringify(countries));

const idn = slim(byIso("IDN"));
writeFileSync(path.join(outDir, "indonesia.json"), JSON.stringify(idn));

// Contiguous US: keep polygons whose bounding box lies inside lon -126..-66, lat 24..50
const usa = slim(byIso("USA"));
usa.geometry = {
  type: "MultiPolygon",
  coordinates: usa.geometry.coordinates.filter((poly) => {
    const [[x0, y0], [x1, y1]] = geoBounds({ type: "Polygon", coordinates: poly });
    return x0 > -126 && x1 < -66 && y0 > 24 && y1 < 50;
  }),
};
writeFileSync(path.join(outDir, "usa48.json"), JSON.stringify(usa));

const R = 6371.0088;
const km2 = (f) => Math.round(geoArea(f) * R * R);
console.log(`countries: ${countries.features.length}`);
console.log(`Indonesia polygons: ${idn.geometry.coordinates.length}, area from NE data ≈ ${km2(idn).toLocaleString()} km²`);
console.log(`US-48 polygons: ${usa.geometry.coordinates.length}, area from NE data ≈ ${km2(usa).toLocaleString()} km²`);
console.log(`Indonesia bounds: ${JSON.stringify(geoBounds(idn))}`);
