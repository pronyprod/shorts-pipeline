// Ep011 facts: Borneo/Kalimantan areas and shares, computed from Natural Earth 1:50m (public domain) with d3 geoArea.
// Output: data/ep011-facts.json.  Usage: node scripts/facts-ep011.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoBounds, geoCentroid } from "d3-geo";
const R = 6371.0088;
const ne = JSON.parse(readFileSync("data/raw/ne_50m_admin_0_countries.geojson", "utf8"));
const by = (iso) => ne.features.find((f) => f.properties.ADM0_A3 === iso);
const polys = (f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);
const km2 = (p) => geoArea({ type: "Polygon", coordinates: p }) * R * R;
const inBox = (p, [x0, y0, x1, y1]) => { const [[a, b], [c, d]] = geoBounds({ type: "Polygon", coordinates: p }); const cx = (a + c) / 2, cy = (b + d) / 2; return cx > x0 && cx < x1 && cy > y0 && cy < y1; };
const BORNEO = [108.5, -4.5, 119.5, 7.5];
// main Borneo polygons only (largest polygon per country inside the box, plus Brunei's two parts)
const part = (iso) => polys(by(iso)).filter((p) => inBox(p, BORNEO)).map((p) => ({ p, a: km2(p) })).sort((x, y) => y.a - x.a);
const idn = part("IDN"), mys = part("MYS"), brn = part("BRN");
const big = (arr) => arr[0].a;
const idnMain = big(idn), mysMain = big(mys), brnAll = brn.reduce((s, x) => s + x.a, 0);
const borneoMain = idnMain + mysMain + brnAll;
// Java: largest IDN polygon inside the Java box
const javaPoly = polys(by("IDN")).filter((p) => inBox(p, [105, -9, 114.7, -5.5])).map((p) => ({ p, a: km2(p) })).sort((x, y) => y.a - x.a)[0];
// metropolitan France: FRA polygons in Europe box (incl. Corsica)
const fra = polys(by("FRA")).filter((p) => inBox(p, [-6, 41, 10, 52])).reduce((s, p) => s + km2(p), 0);
const out = {
  method: "Natural Earth 1:50m admin-0 polygons, d3 geoArea on a sphere R = 6371.0088 km (main Borneo polygon per country; Brunei both parts)",
  ne: { borneoKm2: Math.round(borneoMain), idnKm2: Math.round(idnMain), mysKm2: Math.round(mysMain), brnKm2: Math.round(brnAll), brnParts: brn.length, brnPartsKm2: brn.map((x) => Math.round(x.a)),
    shareIdn: idnMain / borneoMain, shareMys: mysMain / borneoMain, shareBrn: brnAll / borneoMain, javaKm2: Math.round(javaPoly.a), franceMetroKm2: Math.round(fra) },
  sourced: { borneoKm2: 743330, bruneiKm2: 5765, franceMetroKm2: 543940, javaKm2: 128297 },
  ratios: {},
  centroids: { borneo: geoCentroid({ type: "MultiPolygon", coordinates: [idn[0].p, mys[0].p, ...brn.map((x) => x.p)] }), france: geoCentroid({ type: "MultiPolygon", coordinates: polys(by("FRA")).filter((p) => inBox(p, [-6, 41, 10, 52])) }), java: geoCentroid({ type: "Polygon", coordinates: javaPoly.p }) },
};
const s = out.sourced;
out.ratios = { borneoOverFrance: s.borneoKm2 / s.franceMetroKm2, bruneiShare: s.bruneiKm2 / s.borneoKm2, kalimantanOverJava_ne: idnMain / javaPoly.a, kalimantanOverJava_sourced: (s.borneoKm2 * 0.73) / s.javaKm2, borneoOverJava: s.borneoKm2 / s.javaKm2 };
writeFileSync("data/ep011-facts.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
