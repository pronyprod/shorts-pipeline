// Episode 4 (shape: journey): "What if you jumped into a tunnel straight through the Earth?"
// Every number comes from FACTS (sourced) or from the simulation below, which drops you
// through Earth's real density profile (PREM). Run `node src/whatif/episodes/ep004.ts`.
import type { Episode } from "../types";
import { capitalise, numberWords } from "../words.ts";

export const FACTS = {
  earthRadiusKm: { value: 6371, note: "PREM radius of the Earth.", source: "Dziewonski & Anderson 1981 (PREM)" },
  gravityConstant: { value: 6.6743e-11, note: "Newton's gravitational constant.", source: "CODATA 2018" },
  earthMassKg: { value: 5.972e24, note: "Checks the density model (not used in the fall).", source: "NASA Earth Fact Sheet" },
  publishedFallS: {
    value: 38 * 60 + 11,
    note: "Published fall time through the centre on PREM, 38 min 11 s. Our simulation must reproduce it.",
    source: "A. Klotz, Am. J. Phys. 83, 231 (2015)",
  },
  shortTunnelMin: {
    value: 42,
    note: "Chord tunnels run from 42 min (short trips) to 38 min (through the centre).",
    source: "Klotz 2015; 42 min from P. Cooper, Am. J. Phys. 34, 68 (1966)",
  },
  kolaM: { value: 12_262, note: "Kola Superdeep Borehole, the deepest hole ever dug.", source: "Wikipedia 'Kola Superdeep Borehole'; Scientific American" },
  crustKm: { value: 24.4, note: "Base of the crust in PREM (a global average: real crust is about 5-70 km thick).", source: "PREM (AVERAGE)" },
  issSpeedMs: { value: 7780, note: "Space Station speed, about 28,000 km/h.", source: "Canadian Space Agency / NASA figures (APPROXIMATE)" },
  issAltitudeM: { value: 420_000, note: "Space Station altitude, about 400-420 km; we compare with the higher figure.", source: "Canadian Space Agency; TASS May 2025 (APPROXIMATE)" },
  coreRadiusKm: { value: 3480, note: "Core-mantle boundary radius.", source: "PREM" },
  innerCoreRadiusKm: { value: 1221.5, note: "Inner core radius.", source: "PREM" },
  antipode: {
    value: 0,
    note: "Jakarta (6.2 S, 106.8 E): its antipode is 6.2 N, 73.2 W, in Colombia.",
    source: "Computed from Jakarta's coordinates (lat -> -lat, lon -> lon - 180)",
  },
  simplifications: {
    value: 0,
    note: "Ignores air, heat, Earth's spin and that no tunnel could survive: a straight vacuum shaft through a non-rotating Earth.",
    source: "SIMPLIFICATION (said in the script)",
  },
} as const;

// PREM density (g/cm^3) as a function of x = r/6371 km: [outer radius km, a, b, c, d]
const PREM: [number, number, number, number, number][] = [
  [1221.5, 13.0885, 0, -8.8381, 0],
  [3480, 12.5815, -1.2638, -3.6426, -5.5281],
  [5701, 7.9565, -6.4761, 5.5283, -3.0807],
  [5771, 5.3197, -1.4836, 0, 0],
  [5971, 11.2494, -8.0298, 0, 0],
  [6151, 7.1089, -3.8045, 0, 0],
  [6346.6, 2.691, 0.6924, 0, 0],
  [6356, 2.9, 0, 0, 0],
  [6368, 2.6, 0, 0, 0],
  [6371, 1.02, 0, 0, 0],
];
export const densityAt = (rKm: number) => {
  const x = rKm / FACTS.earthRadiusKm.value;
  const [, a, b, c, d] = PREM.find((l) => rKm <= l[0]) ?? PREM[PREM.length - 1];
  return (a + b * x + c * x * x + d * x * x * x) * 1000; // kg/m^3
};

const R = FACTS.earthRadiusKm.value * 1000;
// enclosed mass, every km
const enclosed: number[] = [0];
for (let km = 1; km <= FACTS.earthRadiusKm.value; km++) {
  const mid = km - 0.5;
  const shell = 4 * Math.PI * (mid * 1000) ** 2 * 1000 * densityAt(mid);
  enclosed.push(enclosed[enclosed.length - 1] + shell);
}
export const MODEL_MASS_KG = enclosed[enclosed.length - 1];
export const gravityAt = (rM: number) => {
  const r = Math.abs(rM);
  if (r < 1) return 0;
  const km = Math.min(r / 1000, FACTS.earthRadiusKm.value);
  const i = Math.floor(km);
  const f = km - i;
  const m = enclosed[i] + (enclosed[Math.min(i + 1, enclosed.length - 1)] - enclosed[i]) * f;
  return (FACTS.gravityConstant.value * m) / (r * r);
};

// Fall from the surface: y = position along the diameter (metres from the centre).
// Velocity Verlet with a 0.25 s step; `track` keeps one point per second.
const DT = 0.25;
const track: { d: number; v: number }[] = [];
{
  let y = R;
  let v = 0;
  let a = -gravityAt(y);
  let crossed = false;
  for (let i = 0; i < 40_000; i++) {
    if (i % 4 === 0) track.push({ d: R - y, v: Math.abs(v) });
    y += v * DT + 0.5 * a * DT * DT;
    const a2 = -Math.sign(y) * gravityAt(y);
    v += 0.5 * (a + a2) * DT;
    a = a2;
    if (y < 0) crossed = true;
    if (crossed && v > 0) {
      track.push({ d: 2 * R, v: 0 });
      break;
    }
  }
}
// length of the whole fall
export const FALL_S = track.length - 1;
export const FALL_MIN = FALL_S / 60;
const at = (minutes: number) => {
  const s = Math.max(0, Math.min(FALL_S, minutes * 60));
  const i = Math.floor(s);
  const f = s - i;
  const p = track[i];
  const q = track[Math.min(i + 1, FALL_S)];
  return { d: p.d + (q.d - p.d) * f, v: p.v + (q.v - p.v) * f };
};
export const distanceAt = (t: number) => at(t).d; // metres fallen after t minutes
export const speedAt = (t: number) => at(t).v; // m/s
const minuteWhen = (test: (p: { d: number; v: number }) => boolean) => track.findIndex(test) / 60;

const T = {
  kola: minuteWhen((p) => p.d >= FACTS.kolaM.value),
  crust: minuteWhen((p) => p.d >= FACTS.crustKm.value * 1000),
  iss: minuteWhen((p) => p.v >= FACTS.issSpeedMs.value),
  deep: minuteWhen((p) => p.d >= FACTS.issAltitudeM.value),
  core: minuteWhen((p) => p.d >= (FACTS.earthRadiusKm.value - FACTS.coreRadiusKm.value) * 1000),
  centre: minuteWhen((p) => p.d >= R),
  end: FALL_MIN,
};
export const TIMES = T;
export const TOP_SPEED = Math.max(...track.map((p) => p.v));
const kolaSeconds = Math.round(T.kola * 60);
const topTenths = Math.round(TOP_SPEED / 100); // km/s x 10
const speedWords = `${numberWords(Math.floor(topTenths / 10))} point ${numberWords(topTenths % 10)}`;
const deepMin = Math.ceil(T.deep);
const coreMin = Math.round(T.core);
const centreMin = Math.round(T.centre);
const endMin = Math.round(T.end);

export const ep004: Episode = {
  id: "ep004",
  template: 3,
  title: "What if you jumped into a tunnel straight through the Earth?",
  counterLabel: "Distance fallen",
  clockLabel: "MINUTE",
  ctaTitle: "WHAT SHOULD WE DIG NEXT?",
  stage: "tunnel",
  endT: T.end,
  diameterAt: distanceAt,
  rungs: [
    { t: T.kola, label: "Deeper than any hole ever dug", icon: "pin", size: FACTS.kolaM.value, relation: "bigger" },
    { t: T.deep, label: "Past the Space Station's height", icon: "iss", size: FACTS.issAltitudeM.value - 1000, relation: "bigger" },
    { t: T.core, label: "Entering the Earth's core", icon: "pin", size: (FACTS.earthRadiusKm.value - FACTS.coreRadiusKm.value) * 1000 - 1000, relation: "bigger" },
    { t: T.centre, label: "The exact center of the Earth", icon: "earth", size: R - 1000, relation: "bigger" },
    { t: T.centre + 0.3, label: "Slowing down, all the way up", icon: "drop", size: R, relation: "bigger" },
    { t: T.end, label: "Out the other side", icon: "pin", size: 2 * R - 1000, relation: "bigger" },
  ],
  lines: [
    { t: 0, to: 0.05, say: "What if you jumped into a tunnel, straight through the Earth?", text: "What if you jumped into a tunnel straight through the Earth?", whole: true },
    { t: 0.06, to: 0.2, say: "You step off in Jakarta. The other end is in Colombia.", text: "You step off in Jakarta. The other end is in Colombia.", pause: 0.25 },
    { t: 0.22, to: 0.4, say: "Ignore the air, the heat, and the fact that this is impossible.", text: "Ignore the air, the heat, and the fact that this is impossible." },
    { t: T.kola, to: T.kola + 0.1, say: `${capitalise(numberWords(kolaSeconds))} seconds in, you pass the deepest hole humans ever dug.`, text: `${kolaSeconds} seconds in, you pass the deepest hole humans ever dug.`, pause: 0.5 },
    { t: T.deep, to: T.deep + 0.2, say: `Minute ${numberWords(deepMin)}. You've fallen farther than the Space Station is high.`, text: `Minute ${deepMin}. You've fallen farther than the Space Station is high.`, pause: 0.6 },
    { t: T.core, to: T.core + 0.1, say: `Minute ${numberWords(coreMin)}. You drop into the core.`, text: `Minute ${coreMin}. You drop into the core.`, pause: 0.6 },
    { t: T.iss + 0.02, to: T.iss + 0.3, say: "And now you're falling faster than the Space Station flies.", text: "And now you're falling faster than the Space Station flies." },
    { t: T.centre, to: T.centre + 0.2, say: `Minute ${numberWords(centreMin)}. The exact center of the Earth. ${capitalise(speedWords)} kilometers a second.`, text: `Minute ${centreMin}. The exact center of the Earth. ${topTenths / 10} kilometers a second.`, pause: 0.7, beat: "climax" },
    { t: T.centre + 0.3, to: T.centre + 7, say: "And now the whole planet is behind you, pulling you back. You slow down, all the way up.", text: "And now the whole planet is behind you, pulling you back. You slow down, all the way up.", beat: "climax" },
    { t: T.end - 0.05, to: T.end, say: `Minute ${numberWords(endMin)}. You float out in Colombia, at exactly zero speed.`, text: `Minute ${endMin}. You float out in Colombia, at exactly zero speed.`, pause: 0.6, beat: "climax" },
    { t: T.end, say: "Grab the edge. Or you fall all the way back.", text: "Grab the edge. Or you fall all the way back." },
    { t: T.end, say: "Here's the twist. Dig a short tunnel instead, Jakarta to Bali, no engine, just gravity.", text: "Here's the twist. Dig a short tunnel instead, Jakarta to Bali, no engine, just gravity.", beat: "twist", pause: 0.6 },
    {
      t: T.end,
      say: "It takes longer. Forty two minutes. Through the whole planet: thirty eight.",
      text: "It takes longer. 42 minutes. Through the whole planet: 38.",
      beat: "twist",
      show: "card",
      card: { title: "SHORTER TUNNEL, LONGER TRIP", lines: ["Short straight tunnel: about 42 min, whatever its length", `Through the center: ${endMin} min`, "(Klotz, Am. J. Phys., 2015)"] },
    },
    { t: T.end, say: "What should we dig next? The best comment becomes the next video.", text: "What should we dig next? The best comment becomes the next video.", beat: "cta", pause: 0.5, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep004.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(Math.abs(MODEL_MASS_KG / FACTS.earthMassKg.value - 1) < 0.01, `PREM total mass ${MODEL_MASS_KG.toExponential(4)} kg vs ${FACTS.earthMassKg.value.toExponential(3)} kg`);
  check(Math.abs(gravityAt(R) - 9.82) < 0.05, `surface gravity ${gravityAt(R).toFixed(3)} m/s^2`);
  const pub = FACTS.publishedFallS.value;
  check(Math.abs(FALL_S - pub) <= 30, `fall time ${Math.floor(FALL_S / 60)} min ${FALL_S % 60} s vs published ${Math.floor(pub / 60)} min ${pub % 60} s`);
  check(Math.abs(distanceAt(T.centre) - R) < 20_000, `centre at minute ${T.centre.toFixed(2)}, half of ${T.end.toFixed(2)}`);
  const short = (Math.PI * Math.sqrt(R / gravityAt(R))) / 60;
  check(Math.abs(short - FACTS.shortTunnelMin.value) < 0.6, `short tunnel pi*sqrt(R/g) = ${short.toFixed(1)} min`);
  check(TOP_SPEED > FACTS.issSpeedMs.value, `top speed ${(TOP_SPEED / 1000).toFixed(2)} km/s > Space Station`);
  check(speedAt(T.iss + 0.3) > FACTS.issSpeedMs.value, `"faster than the Space Station" line ends at ${(speedAt(T.iss + 0.3) / 1000).toFixed(2)} km/s`);
  for (const l of ep004.lines) check(l.t >= 0 && (l.to ?? l.t) <= T.end + 1e-9, `line "${l.say.slice(0, 40)}" t ${l.t.toFixed(2)}-${(l.to ?? l.t).toFixed(2)}`);
  console.log(`kola ${kolaSeconds}s, crust minute ${T.crust.toFixed(2)}, Space Station speed at minute ${T.iss.toFixed(2)}, core minute ${T.core.toFixed(2)} at ${(speedAt(T.core) / 1000).toFixed(2)} km/s`);
  if (!ok) process.exit(1);
}
