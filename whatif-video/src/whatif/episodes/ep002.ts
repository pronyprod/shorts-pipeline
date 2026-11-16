// Episode 2: "What if every domino was 1.5x bigger than the one before?"
// Every number on screen or in the voice comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep002.ts` to print and check the ladder.
import type { Episode } from "../types";
import { capitalise, numberWords } from "../words.ts";
import { FACTS as EP1 } from "./ep001.ts";

const INCH = 0.0254; // m, exact by definition

export const FACTS = {
  firstDominoM: {
    value: 0.32 * INCH,
    note: 'Smallest domino of the University of Toronto chain-reaction demo: 0.04" x 0.16" x 0.32" (0.32" = 8.13 mm tall).',
    source: "U of Toronto Physics lecture demos, 'Domino Chain Reaction' (ugdemos.physics.utoronto.ca)",
  },
  growth: {
    value: 1.5,
    note: '"Each domino is 1.5 times wider, higher and thicker than its predecessor." A domino can topple one about 1.5x its size.',
    source: "U of Toronto demo page, citing L. Whitehead, Am. J. Phys. 51, 182 (1983)",
  },
  labDominoCount: {
    value: 13,
    note: 'Dominoes in the Toronto demo: derived, not stated. Largest is 42" tall; 42/0.32 = 131 = 1.5^12, so 13 dominoes.',
    source: "Computed from the U of Toronto demo sizes (UNCERTAIN: count not stated on the page)",
  },
  labLargestM: {
    value: 42 * INCH,
    note: 'Largest domino of the Toronto demo: 4.5" x 21" x 42" (42" = 1.07 m tall).',
    source: "U of Toronto demo page",
  },
  a4PaperM: { value: 0.297, note: "A4 sheet, 210 x 297 mm.", source: "ISO 216" },
  houseM: EP1.houseM,
  monasM: {
    value: 132,
    note: "Monas (National Monument, Jakarta), 132 m. Widely cited; official primary source not found online (UNCERTAIN).",
    source: "Wikipedia 'National Monument (Indonesia)'; Google Arts & Culture",
  },
  eiffelM: {
    value: 330,
    note: "Eiffel Tower, 330 m since a new antenna on 15 March 2022.",
    source: "toureiffel.paris, 'From 300 to 330 meters: the story of the Tower's height'",
  },
  skyscraperM: EP1.skyscraperM,
  everestM: EP1.everestM,
  issAltitudeM: {
    value: 420_000,
    note: "Space Station altitude, about 400-420 km; it varies with reboosts (we compare with the higher figure).",
    source: "Canadian Space Agency (400 km); TASS May 2025 (418.7 km average) (APPROXIMATE)",
  },
  moonDistanceM: {
    value: 384_400_000,
    note: "Mean Earth-Moon distance, 384,400 km.",
    source: "NASA Moon Fact Sheet",
  },
} as const;

// Domino n (n = 1, 2, 3...) is H1 x 1.5^(n-1) tall. For the counter the story clock t runs
// continuously: between n and n+1 the next domino is "growing" into place.
export const dominoHeight = (t: number) => FACTS.firstDominoM.value * FACTS.growth.value ** (t - 1);
// first domino at least `size` metres tall
export const firstDominoOver = (size: number) => Math.ceil(Math.log(size / FACTS.firstDominoM.value) / Math.log(FACTS.growth.value) + 1 - 1e-9);

const N = {
  paper: firstDominoOver(FACTS.a4PaperM.value),
  lab: FACTS.labDominoCount.value,
  house: firstDominoOver(FACTS.houseM.value),
  monas: firstDominoOver(FACTS.monasM.value),
  eiffel: firstDominoOver(FACTS.eiffelM.value),
  burj: firstDominoOver(FACTS.skyscraperM.value),
  everest: firstDominoOver(FACTS.everestM.value),
  iss: firstDominoOver(FACTS.issAltitudeM.value),
  moon: firstDominoOver(FACTS.moonDistanceM.value),
};
export const LADDER = N;
const say = (n: number) => capitalise(numberWords(n));
export const END_T = N.moon;

export const ep002: Episode = {
  id: "ep002",
  template: 3,
  title: "What if every domino was 1.5x bigger than the one before?",
  counterLabel: "Domino height",
  clockLabel: "DOMINO #",
  ctaTitle: "WHAT SHOULD WE KNOCK OVER NEXT?",
  object: "domino",
  endT: END_T,
  diameterAt: dominoHeight,
  rungs: [
    { t: 1, label: "The smallest lab domino", icon: "drop", size: FACTS.firstDominoM.value, relation: "about", after: "Growing x1.5 each time" },
    { t: N.paper, label: "Taller than a sheet of paper", icon: "paper", size: FACTS.a4PaperM.value, relation: "bigger" },
    { t: N.lab, label: "As tall as the biggest lab domino", icon: "drop", size: FACTS.labLargestM.value, relation: "about", after: "Taller than the biggest lab domino" },
    { t: N.house, label: "As tall as a house", icon: "house", size: FACTS.houseM.value, relation: "about", after: "Taller than a house" },
    { t: N.monas, label: "Taller than Monas", icon: "monument", size: FACTS.monasM.value, relation: "bigger" },
    { t: N.eiffel, label: "Taller than the Eiffel Tower", icon: "eiffel", size: FACTS.eiffelM.value, relation: "bigger" },
    { t: N.burj, label: "Taller than any skyscraper", icon: "tower", size: FACTS.skyscraperM.value, relation: "bigger" },
    { t: N.everest, label: "Taller than Mount Everest", icon: "mountain", size: FACTS.everestM.value, relation: "bigger" },
    { t: N.iss, label: "Higher than the Space Station", icon: "iss", size: FACTS.issAltitudeM.value, relation: "bigger", placement: "altitude", marker: "ISS ~420 KM" },
    { t: N.moon, label: "Taller than the Moon is far", icon: "moon", size: FACTS.moonDistanceM.value, relation: "bigger", placement: "altitude", marker: "MOON 384,400 KM", lead: 3 },
  ],
  lines: [
    { t: 1, to: 1.12, say: "What if every domino was one and a half times bigger than the one before?", text: "What if every domino was 1.5 times bigger than the one before?", whole: true },
    { t: 1.13, to: 1.2, say: "The first one is about eight millimeters tall.", text: "The first one is about 8 millimeters tall.", pause: 0.25 },
    { t: 1.3, to: 2.2, say: "And each one can knock over the next.", text: "And each one can knock over the next." },
    { t: N.paper, to: N.paper + 0.2, say: `Domino ${numberWords(N.paper)}. Taller than a sheet of paper.`, text: `Domino ${N.paper}. Taller than a sheet of paper.`, pause: 0.6 },
    { t: N.lab, to: N.lab + 0.1, say: `${say(N.lab)}. Over a meter tall.`, text: `${N.lab}. Over a meter tall.`, pause: 0.6 },
    { t: N.house, to: N.house + 0.1, say: `${say(N.house)}. As tall as a house.`, text: `${N.house}. As tall as a house.`, pause: 0.7 },
    { t: N.monas, to: N.monas + 0.3, say: `${say(N.monas)}. Taller than Monas.`, text: `${N.monas}. Taller than Monas.`, pause: 0.7 },
    { t: N.eiffel, to: N.eiffel + 0.3, say: `${say(N.eiffel)}. Taller than the Eiffel Tower.`, text: `${N.eiffel}. Taller than the Eiffel Tower.`, pause: 0.5 },
    { t: N.burj, to: N.burj + 0.3, say: `${say(N.burj)}. Taller than any skyscraper on Earth.`, text: `${N.burj}. Taller than any skyscraper on Earth.`, pause: 0.5 },
    { t: N.everest, to: N.everest + 0.3, say: `${say(N.everest)}. Taller than Mount Everest.`, text: `${N.everest}. Taller than Mount Everest.`, pause: 0.7 },
    { t: N.iss, to: N.iss + 0.3, say: `${say(N.iss)}. Higher than the Space Station flies.`, text: `${N.iss}. Higher than the Space Station flies.`, pause: 0.7 },
    { t: N.moon, say: `And domino ${numberWords(N.moon)} is taller than the distance to the Moon.`, text: `And domino ${N.moon} is taller than the distance to the Moon.`, pause: 0.8, beat: "climax" },
    { t: N.moon, say: "Now give the first one a tiny push.", text: "Now give the first one a tiny push.", beat: "climax" },
    { t: N.moon, say: "Click. And they all come down, one after another, bigger and bigger.", text: "Click. And they all come down, one after another, bigger and bigger.", beat: "climax", show: "topple", pause: 0.5 },
    { t: N.moon, say: "Here's the twist. This is real physics.", text: "Here's the twist. This is real physics.", beat: "twist", pause: 0.6 },
    {
      t: N.moon,
      say: "A falling domino can knock over one about one and a half times its size. A physics lab in Toronto does it with thirteen.",
      text: "A falling domino can knock over one about 1.5 times its size. A physics lab in Toronto does it with 13.",
      beat: "twist",
      show: "card",
      card: { title: "REAL PHYSICS", lines: ["A domino can topple one ~1.5× its size.", "Toronto demo: 13 dominoes, 8 mm → 1.07 m.", "(L. Whitehead, Am. J. Phys., 1983)"] },
    },
    { t: N.moon, say: "No domino could ever stand that tall. But the chain reaction is real.", text: "No domino could ever stand that tall. But the chain reaction is real.", beat: "twist" },
    { t: N.moon, say: "What should we knock over next? Comment below!", text: "What should we knock over next? Comment below!", beat: "cta", pause: 0.5, show: "cta" },
  ],
};

// Self-test: every comparison true when shown, spoken numbers match the maths
if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep002.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  console.log("ladder:", JSON.stringify(N));
  for (const r of ep002.rungs) {
    const h = dominoHeight(r.t);
    const pass = r.relation === "bigger" ? h > r.size : Math.abs(h / r.size - 1) <= 0.1;
    check(pass, `domino ${r.t}: ${h.toPrecision(4)} m vs ${r.label} ${r.size.toPrecision(4)} m${r.relation === "bigger" ? ` (domino ${r.t - 1}: ${dominoHeight(r.t - 1).toPrecision(4)} m)` : ""}`);
  }
  // "about" labels only while within 10%: lines that say them must end within 10%
  for (const l of ep002.lines) {
    if (/As tall as a house/.test(l.say)) check(dominoHeight(l.to ?? l.t) / FACTS.houseM.value <= 1.1, `"as tall as a house" line ends at ${dominoHeight(l.to ?? l.t).toFixed(2)} m`);
    if (/about eight millimeters/.test(l.say)) check(Math.abs(dominoHeight(l.to ?? l.t) * 1000 - 8) < 1, `"about eight millimeters" line ends at ${(dominoHeight(l.to ?? l.t) * 1000).toFixed(2)} mm`);
  }
  check(Math.abs(dominoHeight(FACTS.labDominoCount.value) - FACTS.labLargestM.value) / FACTS.labLargestM.value < 0.02, `13th domino ${dominoHeight(13).toFixed(3)} m vs lab's largest ${FACTS.labLargestM.value.toFixed(3)} m`);
  check(dominoHeight(N.lab) > 1, `"over a meter": ${dominoHeight(N.lab).toFixed(3)} m`);
  console.log(`domino ${N.moon}: ${(dominoHeight(N.moon) / 1000).toFixed(0)} km; domino ${N.moon - 1}: ${(dominoHeight(N.moon - 1) / 1000).toFixed(0)} km; Moon ${FACTS.moonDistanceM.value / 1000} km`);
  console.log(`energy: each domino stores 1.5^4 = ${(1.5 ** 4).toFixed(2)}x the potential energy of the one before (mass x height)`);
  if (!ok) process.exit(1);
}
