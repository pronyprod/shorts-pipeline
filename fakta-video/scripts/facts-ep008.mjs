// Ep008 facts: no-shadow dates, solar noon, shadow lengths and the Eratosthenes sum done with Indonesian cities.
// Sun position: NOAA / Meeus low-precision formulas. Output: data/ep008-facts.json
import { writeFileSync } from "node:fs";

const rad = Math.PI / 180;
const R = 6371.0088;

const sun = (ms) => {
  const JD = ms / 86400000 + 2440587.5;
  const T = (JD - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * rad) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * rad) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * rad) * 0.000289;
  const om = 125.04 - 1934.136 * T;
  const lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * rad);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(om * rad);
  const dec = Math.asin(Math.sin(eps * rad) * Math.sin(lam * rad)) / rad;
  const y = Math.tan((eps / 2) * rad) ** 2;
  const eot = (4 / rad) * (y * Math.sin(2 * L0 * rad) - 2 * e * Math.sin(M * rad) + 4 * e * y * Math.sin(M * rad) * Math.cos(2 * L0 * rad) - 0.5 * y * y * Math.sin(4 * L0 * rad) - 1.25 * e * e * Math.sin(2 * M * rad));
  return { dec, eot };
};

// UTC ms of solar noon at a longitude on a UTC day
const noonUtc = (day, lon) => {
  let ms = day + 12 * 3600000 - lon * 4 * 60000;
  for (let i = 0; i < 3; i++) ms = day + 12 * 3600000 - (lon * 4 + sun(ms).eot) * 60000;
  return ms;
};

const noShadow = (lat, lon, tzH, year) => {
  // the two days where |declination at solar noon - latitude| is smallest (one per half year)
  const days = [];
  for (let d = Date.UTC(year, 0, 1); d < Date.UTC(year + 1, 0, 1); d += 86400000) {
    const n = noonUtc(d, lon);
    days.push({ d, n, gap: sun(n).dec - lat });
  }
  const pick = (a) => a.reduce((x, y) => (Math.abs(y.gap) < Math.abs(x.gap) ? y : x));
  const split = Date.UTC(year, 5, 21);
  return [days.filter((x) => x.d < split), days.filter((x) => x.d >= split)].map(pick).map((x) => {
    const local = new Date(x.n + tzH * 3600000);
    return { date: local.toISOString().slice(0, 10), localTime: local.toISOString().slice(11, 16), offDeg: +x.gap.toFixed(3) };
  });
};

const hav = (a, b) => {
  const [l1, p1, l2, p2] = [a[0] * rad, a[1] * rad, b[0] * rad, b[1] * rad];
  return 2 * R * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2));
};

const CITY = {
  pontianak: { c: [109.3333, -0.0263], tz: 7 },
  jakarta: { c: [106.8456, -6.2088], tz: 7 },
  sabang: { c: [95.3214, 5.8933], tz: 7 },
  merauke: { c: [140.4, -8.4932], tz: 9 },
  tegal: { c: [109.1403, -6.8694], tz: 7 },
};
const out = { cities: {} };
for (const year of [2026, 2027]) {
  for (const [k, v] of Object.entries(CITY)) (out.cities[k] ??= {})[year] = noShadow(v.c[1], v.c[0], v.tz, year);
}

const TILT = 23.44;
out.tropicsShareOfEarthPct = +(Math.sin(TILT * rad) * 100).toFixed(1);

// highest noon sun for cities outside the tropics: the shadow never disappears
out.minNoonShadowDeg = Object.fromEntries(Object.entries({ tokyo: 35.68, paris: 48.86, newYork: 40.71 }).map(([k, lat]) => [k, +(lat - TILT).toFixed(2)]));

// how long the sun is within 1 degree of the zenith on the day (hour angle 15 deg/hour)
out.minutesWithin1DegOfZenith = +((2 * 1) / 15 * 60).toFixed(1);
out.shadowOf1mAt1DegCm = +(Math.tan(1 * rad) * 100).toFixed(2);

// Eratosthenes with Indonesian cities, on Pontianak's no-shadow day
const P = CITY.pontianak.c, T = CITY.tegal.c;
const dLat = P[1] - T[1];
const km = hav(P, T);
out.eratosthenes = {
  latDiffDeg: +dLat.toFixed(3),
  lonDiffDeg: +(P[0] - T[0]).toFixed(3),
  pontianakTegalKm: +km.toFixed(1),
  shadow1mStickAtTegalCm: +(Math.tan(dLat * rad) * 100).toFixed(1),
  circumferenceKm: +((km * 360) / dLat).toFixed(0),
  originalAngleDeg: 7.2,
  originalFractionOfCircle: 360 / 7.2,
};
const yrs = 2026 + 240;
out.yearsSinceEratosthenes240BC = yrs;

writeFileSync("data/ep008-facts.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
