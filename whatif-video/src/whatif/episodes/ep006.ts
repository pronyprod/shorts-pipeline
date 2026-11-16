// Episode 6 (shape: everyone at once): "What if every human on Earth jumped at the same moment?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep006.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  people: { value: 8.2e9, note: "World population, 2024.", source: "UN DESA, World Population Prospects 2024" },
  massKg: { value: 62, note: "Global average ADULT body mass (2005). APPROXIMATE: used for everyone, children included, so the total is generous.", source: "Walpole et al. 2012, The weight of nations, BMC Public Health 12:439" },
  jumpM: { value: 0.5, note: "Premise: everyone rises half a metre. APPROXIMATE and generous: median jumps are about 0.32 m (women 20-24) to 0.49 m (men 20-24), lower with age, so the real shift would be smaller.", source: "Premise; norms from the Canadian Health Measures Survey via Hoffmann et al. 2019 (seen through a secondary site, UNCERTAIN)" },
  earthKg: { value: 5.9722e24, note: "Mass of the Earth. Treated as one rigid body: this is the shift of its centre of mass (SIMPLIFICATION).", source: "NASA Earth Fact Sheet" },
  stadium: { value: 77_193, note: "Gelora Bung Karno main stadium. APPROXIMATE: sources give 76,000-78,000.", source: "gbk.id (about 78,000); Wikipedia (77,193); Jakarta Post 2018 (76,152)" },
  jakarta: { value: 10_684_900, note: "DKI Jakarta province, 2024. City proper, not Greater Jakarta.", source: "BPS Statistics Indonesia, via GoodStats 2024" },
  indonesia: { value: 284.67e6, note: "Indonesia, 2025.", source: "BPS Statistics Indonesia, SUPAS 2025" },
  hairM: { value: 90e-6, note: "Human hair, 80,000-100,000 nm wide (middle value).", source: "US National Nanotechnology Initiative, nano.gov" },
  virusM: { value: 100e-9, note: "Typical virus, about 100 nm. APPROXIMATE: flu is about 85 nm.", source: "Scale tables; Thermo Fisher educational sheet" },
  atomM: { value: 2 * 5.29177e-11, note: "Smallest atom: hydrogen, twice the Bohr radius (0.106 nm).", source: "CODATA, Bohr radius" },
  gravity: { value: 9.81, note: "Used only for the time in the air.", source: "Standard gravity (rounded)" },
} as const;

export const ALL_MASS_KG = FACTS.people.value * FACTS.massKg.value;
export const MASS_RATIO = FACTS.earthKg.value / ALL_MASS_KG;
// Nothing pushes on the Earth-plus-people system, so its centre of mass stays put:
// Earth moves by (people's rise) x (people's mass / Earth's mass).
export const SHIFT_M = (FACTS.jumpM.value * ALL_MASS_KG) / FACTS.earthKg.value;
export const ATOM_RATIO = FACTS.atomM.value / SHIFT_M;
export const AIR_SECONDS = 2 * Math.sqrt((2 * FACTS.jumpM.value) / FACTS.gravity.value);

export const ATOM_T = 7.3; // the atom fills the screen and the number is revealed

const logLerp = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return Math.exp(Math.log(va) + ((t - a) / (b - a)) * (Math.log(vb) - Math.log(va)));
  }
  return keys[keys.length - 1][1];
};

// People jumping, by story step (each spoken group lands on its rung)
export const peopleAt = (t: number) =>
  logLerp(t, [
    [1, 1],
    [1.33, FACTS.stadium.value],
    [1.66, FACTS.jakarta.value],
    [2, FACTS.indonesia.value],
    [3, FACTS.people.value],
  ]);

// The zoom of the reveal, in screen pixels per metre, on true scale
const PX_PER_REAL_M = 15_400; // a 7 cm wide phone screen is 1080 px wide
export const pxPerM = (t: number) =>
  logLerp(t, [
    [5.5, PX_PER_REAL_M],
    [6.05, 300 / FACTS.hairM.value],
    [6.7, 300 / FACTS.virusM.value],
    [7, 700 / FACTS.virusM.value],
    [ATOM_T, 860 / FACTS.atomM.value],
  ]);

const big = (n: number) => {
  if (n < 1e6) return { value: Math.round(n).toLocaleString("en-US"), unit: "" };
  const [d, unit] = n < 1e9 ? [1e6, "million"] : n < 1e12 ? [1e9, "billion"] : [1e12, "trillion"];
  return { value: (n / d).toFixed(n / d < 10 ? 1 : 0), unit };
};
const moved = { value: (SHIFT_M * 1e12).toFixed(2), unit: "pm" };

const END_T = 10;
export const JUMP_T = 4.75; // "Jump!"
export const LAND_T = 8.3;

export const ep006: Episode = {
  id: "ep006",
  template: 3,
  title: "What if every human on Earth jumped at the same moment?",
  counterLabel: "People jumping",
  ctaTitle: "WHAT SHOULD WE TRY NEXT?",
  stage: "crowd",
  endT: END_T,
  diameterAt: peopleAt,
  clockText: (t) => (t < 1 ? "JUST YOU" : t < 3.5 ? "WHERE THEY STAND" : t < JUMP_T ? "ONE SPOT" : t < 5.5 ? "IN THE AIR" : t < ATOM_T ? "ZOOMING IN" : t < LAND_T ? "IN THE AIR" : "LANDED"),
  counterAt: (t) => {
    if (t < JUMP_T) return { text: big(peopleAt(t)) };
    if (t < 5.5) return { label: "Earth moved", mystery: true };
    if (t < ATOM_T) return { label: "Zoom", text: { ...big(pxPerM(t) / PX_PER_REAL_M), value: `×${big(pxPerM(t) / PX_PER_REAL_M).value}` } };
    if (t < 8.6) return { label: "Earth moved", text: moved };
    return { label: "Earth moved, in the end", text: { value: "0", unit: "pm" } };
  },
  rungs: [
    { t: 1.33, label: "A full stadium", after: "More than a stadium", icon: "field", size: FACTS.stadium.value, relation: "about" },
    { t: 1.66, label: "All of Jakarta", after: "More than Jakarta", icon: "tower", size: FACTS.jakarta.value, relation: "about" },
    { t: 2, label: "All of Indonesia", after: "More than Indonesia", icon: "island", size: FACTS.indonesia.value, relation: "about" },
    { t: 3, label: "Everyone alive", icon: "earth", size: FACTS.people.value, relation: "about" },
    { t: JUMP_T, label: "Take a guess", icon: "drop", size: 1, relation: "about" },
    { t: 5.5, label: "One centimeter", icon: "drop", size: 0.01, relation: "about" },
    { t: 6.05, label: "A human hair", icon: "drop", size: FACTS.hairM.value, relation: "about" },
    { t: 6.7, label: "A virus", icon: "drop", size: FACTS.virusM.value, relation: "about" },
    { t: ATOM_T, label: `${(Math.floor(ATOM_RATIO / 100) * 100).toLocaleString("en-US")}× smaller than an atom`, icon: "drop", size: SHIFT_M, relation: "about" },
    { t: 8.6, label: "Back where it started", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 0.4, say: "What if every human on Earth jumped at the same moment?", text: "What if every human on Earth jumped at the same moment?", whole: true },
    { t: 0.4, to: 1, say: "Start with just you. You jump up, and the Earth really does move down.", text: "Start with just you. You jump up, and the Earth really does move down.", pause: 0.25 },
    { t: 1, to: 2, say: "Now fill a stadium. Fill all of Jakarta. Fill all of Indonesia.", text: "Now fill a stadium. Fill all of Jakarta. Fill all of Indonesia." },
    { t: 2, to: 3, say: `Now everyone alive. ${numberWords(8)} point ${numberWords(2)} billion people.`, text: "Now everyone alive. 8.2 billion people." },
    { t: 3, to: 3.5, say: "But wait. People on opposite sides push in opposite directions, so a lot of it cancels out.", text: "But wait. People on opposite sides push in opposite directions, so a lot of it cancels out.", pause: 0.4 },
    { t: 3.5, to: 4, say: "So let's cheat. Pack all of us into one spot, all pushing the same way.", text: "So let's cheat. Pack all of us into one spot, all pushing the same way." },
    { t: 4, to: 5, say: "Three. Two. One. Jump!", text: "Three. Two. One. Jump!", pause: 0.4 },
    { t: 5, to: 5.5, say: "We all rise half a meter. How far does the Earth drop? Take a guess.", text: "We all rise half a meter. How far does the Earth drop? Take a guess.", pause: 0.4 },
    { t: 5.5, to: 7, say: "Not a centimeter. Not the width of a hair. Not even a virus.", text: "Not a centimeter. Not the width of a hair. Not even a virus.", pause: 0.6 },
    { t: 7, to: 7.6, say: `Smaller than a single atom. Over ${numberWords(2)} thousand times smaller.`, text: "Smaller than a single atom. Over 2 thousand times smaller.", beat: "climax", pause: 0.3 },
    {
      t: 7.6,
      to: 8,
      say: `Because the Earth outweighs all of us almost ${numberWords(Math.ceil(MASS_RATIO / 1e12))} trillion to one.`,
      text: `Because the Earth outweighs all of us almost ${Math.ceil(MASS_RATIO / 1e12)} trillion to one.`,
      show: "card",
      pause: 0.5,
      card: {
        title: "THE BEST CASE",
        lines: [`All of us: ${(ALL_MASS_KG / 1e9).toFixed(0)} million tonnes`, "Earth: about 6 billion trillion tonnes", `Earth moves 0.5 m ÷ ${(MASS_RATIO / 1e12).toFixed(1)} trillion = ${(SHIFT_M * 1e12).toFixed(2)} pm`],
      },
    },
    { t: 8, to: 8.6, say: "And it doesn't even last. We land, and our landing pushes the Earth straight back.", text: "And it doesn't even last. We land, and our landing pushes the Earth straight back.", beat: "twist", pause: 0.5 },
    { t: 8.6, to: 9, say: "Right back where it started. Everyone alive, and the final score is zero.", text: "Right back where it started. Everyone alive, and the final score is zero.", beat: "twist" },
    { t: 9, to: 10, say: "But every jump you've ever made really did move the planet. Just not for long.", text: "But every jump you've ever made really did move the planet. Just not for long.", beat: "twist", pause: 0.5 },
    { t: 10, say: "What should we try next? The best comment becomes the next video.", text: "What should we try next? The best comment becomes the next video.", beat: "cta", pause: 0.5, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep006.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(SHIFT_M < 0.01, `shift ${SHIFT_M.toExponential(3)} m is under a centimetre`);
  check(SHIFT_M < FACTS.hairM.value && SHIFT_M < FACTS.virusM.value && SHIFT_M < FACTS.atomM.value, "smaller than a hair, a virus and an atom");
  check(ATOM_RATIO > 2000 && ATOM_RATIO < 3000, `"over two thousand times smaller": ${ATOM_RATIO.toFixed(0)}x`);
  check(MASS_RATIO < 12e12 && MASS_RATIO > 11e12, `"almost twelve trillion to one": ${(MASS_RATIO / 1e12).toFixed(2)} trillion`);
  check(AIR_SECONDS < 1, `in the air ${AIR_SECONDS.toFixed(2)} s`);
  // the same answer from momentum: Earth's take-off speed, averaged over the rise (half the flight)
  const v = Math.sqrt(2 * FACTS.gravity.value * FACTS.jumpM.value);
  const earthV = (v * ALL_MASS_KG) / FACTS.earthKg.value;
  const longWay = (earthV * AIR_SECONDS) / 4; // peak separation is reached at half the flight, average speed v/2
  check(Math.abs(longWay - SHIFT_M) / SHIFT_M < 1e-9, `momentum check: ${longWay.toExponential(3)} m`);
  for (const [t, n] of [[1.33, FACTS.stadium.value], [1.66, FACTS.jakarta.value], [2, FACTS.indonesia.value], [3, FACTS.people.value]] as const) {
    check(Math.abs(peopleAt(t) - n) / n < 1e-9, `counter at step ${t} = ${Math.round(peopleAt(t))}`);
  }
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  console.log(`Earth moved ${moved.value} ${moved.unit}; all of us ${(ALL_MASS_KG / 1e12).toFixed(3)} trillion kg; zoom end x${(pxPerM(ATOM_T) / PX_PER_REAL_M).toExponential(2)}`);
  if (!ok) process.exit(1);
}
