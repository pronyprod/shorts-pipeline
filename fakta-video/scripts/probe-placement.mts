// Shows where Indonesia's end points land when the whole country is rotated (true size) to a target.
// Used to pick the Europe placement for Episode 1 and to write true narration about it.
// Usage: node scripts/probe-placement.mts [lon,lat ...]

import { readFileSync } from "node:fs";
import path from "node:path";
import { geoCentroid, geoContains, geoInterpolate } from "d3-geo";
import { moveFn, moveGeo, type LonLat } from "../src/lib/geo.ts";

const root = path.resolve(import.meta.dirname, "..");
const facts = JSON.parse(readFileSync(path.join(root, "data/ep001-facts.json"), "utf8"));
const countries = JSON.parse(readFileSync(path.join(root, "src/data/countries.json"), "utf8"));
const P = facts.points;
const idMid = geoInterpolate(P.idWest.coord, P.idEast.coord)(0.5) as LonLat;
const usMid = geoInterpolate(P.usWest.coord, P.usEast.coord)(0.5) as LonLat;
console.log("Indonesia midpoint", idMid.map((v) => v.toFixed(2)), "| US-48 midpoint", usMid.map((v) => v.toFixed(2)));

const where = (p: LonLat) => countries.features.find((f: never) => geoContains(f, p))?.properties.name ?? "(laut)";
const show = (to: LonLat) => {
  const f = moveFn(idMid, to);
  const parts = ["idWest", "idEast", "sabang", "merauke"].map((k) => {
    const p = f(P[k].coord);
    return `${k} ${p.map((v) => v.toFixed(1)).join(",")} ${where(p)}`;
  });
  console.log(`-> ${to.map((v) => v.toFixed(1)).join(",")}: ${parts.join(" | ")}`);
};

// --covers lon,lat: lists the countries whose land overlaps the moved Indonesia (west to east).
// Overlap = an Indonesian vertex inside the country, or a country vertex inside Indonesia.
const covers = (to: LonLat) => {
  const idn = JSON.parse(readFileSync(path.join(root, "src/data/indonesia.json"), "utf8"));
  const moved = moveGeo(idn, idMid, to);
  const flat = (c: unknown): LonLat[] => (typeof (c as number[])[0] === "number" ? [c as LonLat] : (c as unknown[]).flatMap(flat));
  const idPts = flat(moved.geometry.coordinates);
  const hits = countries.features
    .map((f: { properties: { iso: string; name: string }; geometry: { coordinates: unknown } }) => {
      const own = flat(f.geometry.coordinates);
      const n = idPts.filter((p) => geoContains(f as never, p)).length + own.filter((p) => geoContains(moved, p)).length;
      return { iso: f.properties.iso, name: f.properties.name, n, lon: geoCentroid(f as never)[0] };
    })
    .filter((h: { n: number }) => h.n > 0)
    .sort((a: { lon: number }, b: { lon: number }) => a.lon - b.lon);
  for (const h of hits) console.log(`${h.iso} ${h.name}: ${h.n} overlapping vertices`);
};

const argv = process.argv.slice(2);
if (argv[0] === "--covers") covers(argv[1].split(",").map(Number) as LonLat);
else {
  const args = argv.map((s) => s.split(",").map(Number) as LonLat);
  for (const t of args.length ? args : [usMid, [10, 50], [12, 48], [15, 50], [5, 48], [20, 50], [16, 46]] as LonLat[]) show(t);
}
