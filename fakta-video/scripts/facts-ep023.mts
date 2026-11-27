// Ep023 facts: Sabang-Merauke laid over Europe with Sabang at London (true size, sphere rotation).
// Usage: node scripts/facts-ep023.mts  -> data/ep023-facts.json
import { readFileSync, writeFileSync } from "node:fs";
import { geoContains, geoDistance, geoInterpolate } from "d3-geo";
import { moveFn, type LonLat } from "../src/lib/geo.ts";
const R = 6371.0088;
const pts = JSON.parse(readFileSync("data/ep001-facts.json", "utf8")).points;
const countries = JSON.parse(readFileSync("src/data/countries.json", "utf8"));
const sabang = pts.sabang.coord as LonLat, merauke = pts.merauke.coord as LonLat;
const London: LonLat = [-0.1278, 51.5074]; // Wikipedia 'London'
const Moscow: LonLat = [37.6173, 55.7558]; // Wikipedia 'Moscow'
const where = (p: LonLat) => countries.features.find((x: never) => geoContains(x, p))?.properties.name ?? "(laut)";
const km = (a: LonLat, b: LonLat) => geoDistance(a, b) * R;
const landing = moveFn(sabang, London)(merauke);
const line = geoInterpolate(London, landing);
const crossed: string[] = [];
for (let i = 0; i <= 4000; i++) { const w = where(line(i / 4000) as LonLat); if (w !== "(laut)" && !crossed.includes(w)) crossed.push(w); }
const out = {
  method: "haversine R=6371.0088 km; Indonesia rotated on the sphere (moveFn) so Sabang lands on London",
  sabangMeraukeKm: km(sabang, merauke), londonMoscowKm: km(London, Moscow),
  ratio: km(sabang, merauke) / km(London, Moscow),
  merauke: { lonlat: landing, country: where(landing), distLondonKm: km(London, landing) },
  countriesOnLine: crossed, London, Moscow,
};
writeFileSync("data/ep023-facts.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
