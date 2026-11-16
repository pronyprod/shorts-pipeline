// Episode 13 (Round 3 #25, category: Absurd scale): "What if every ant on Earth came for you?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep013.ts` to print and check them.
import type { Episode } from "../types";
import { capitalise, numberWords } from "../words.ts";

export const FACTS = {
  antCount: { value: 20e15, note: "At least about 20 quadrillion (20 x 10^15) ants alive on Earth at any time; a conservative estimate (ants living underground are mostly not counted).", source: "Schultheiss, Nooten, Wang, Wong, Brassard & Guénard, 'The abundance, biomass, and distribution of ants on Earth', PNAS 119(40), e2201550119 (19 Sept 2022), doi:10.1073/pnas.2201550119" },
  studies: { value: 489, note: "The estimate pools 489 ant-counting studies from every continent and major biome.", source: "Schultheiss et al. 2022, PNAS (abstract); Mongabay, 'How many ants live on Earth? At least 20 quadrillion, scientists say' (Dec 2022)" },
  countYear: { value: 2022, note: "Year the estimate was published.", source: "Schultheiss et al. 2022, PNAS" },
  antCarbonMt: { value: 12, note: "Total ant biomass about 12 megatonnes of dry carbon.", source: "Schultheiss et al. 2022, PNAS (abstract)" },
  wildMammalsMt: { value: 7, note: "Wild mammals about 0.007 Gt carbon (7 Mt C).", source: "Bar-On, Phillips & Milo, 'The biomass distribution on Earth', PNAS 115(25): 6506-6511 (2018)" },
  wildBirdsMt: { value: 2, note: "Wild birds about 0.002 Gt carbon (2 Mt C). Schultheiss et al. 2022 state that ants exceed wild birds and mammals combined.", source: "Bar-On, Phillips & Milo 2018, PNAS; Schultheiss et al. 2022, PNAS" },
  people: { value: 8.2e9, note: "World population about 8.2 billion (2025). With 8.0 billion (the paper's own figure) it is 2.5 million ants per person; with 8.2 billion it is 2.44 million, so the voice says 'almost two and a half million'.", source: "United Nations, World Population Prospects 2024 (Summary of Results)" },
  driverColony: { value: 20e6, note: "UNCERTAIN / upper end: driver ant (Dorylus) colonies are described as reaching about 20 million workers; some sources give lower numbers (e.g. 6 million). The voice says 'up to'.", source: "Hölldobler & Wilson, 'The Ants' (1990), as summarised in Wikipedia 'Dorylus' (accessed 15 Nov 2026); BBC Wildlife / Discover Wildlife, army ant facts" },
  driverSpeed: { value: 20, note: "APPROXIMATE: a driver ant raiding column advances only about 20 metres an hour.", source: "Hölldobler & Wilson, 'The Ants' (1990), as cited in Wikipedia 'Dorylus' (accessed 15 Nov 2026)" },
  walkSpeed: { value: 1.4, note: "Typical comfortable human walking speed about 1.4 m/s (5 km/h).", source: "Mohler, Thompson, Creem-Regehr, Pick & Warren, 'Visual flow influences gait transition speed and preferred walking speed', Exp Brain Res 181 (2007); Browning et al., J Appl Physiol 100 (2006)" },
  supercolonyKm: { value: 6000, note: "The main European supercolony of the Argentine ant (Linepithema humile) stretches about 6,000 km, from Italy to the Atlantic coast of Spain.", source: "Giraud, Pedersen & Keller, 'Evolution of supercolonies: the Argentine ants of southern Europe', PNAS 99(9): 6075-6079 (2002)" },
  arrivals: { value: 1, note: "ILLUSTRATIVE: the counter's in-between values (how many ants have arrived so far) are a story ramp; only 12 ('twelve ants'), 20 million and 20 quadrillion are spoken, and those come from the facts above.", source: "Our illustration of the facts above" },
} as const;

// ---- the numbers ----
export const PER_PERSON = FACTS.antCount.value / FACTS.people.value; // ~2.44 million
export const TIMES_FASTER = (FACTS.walkSpeed.value * 3600) / FACTS.driverSpeed.value; // ~252
export const BIRDS_MAMMALS_MT = FACTS.wildMammalsMt.value + FACTS.wildBirdsMt.value; // 9
const DOZEN = 12;

// Story steps (one per line): 0 hook | 1 a dozen at your shoe | 2 driver army 20 M | 3 supercolony |
// 4 all 20 quadrillion (climax) | 5 per person | 6 army speed | 7 you walk away | 8-9 twist | 10 CTA.
const END_T = 10;
export const CLIMAX_T = 4;
export const TWIST_T = 8;
const logLerp = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return Math.exp(Math.log(va) + ((t - a) / (b - a)) * (Math.log(vb) - Math.log(va)));
  }
  return keys[keys.length - 1][1];
};
// the counter reaches each spoken number about when it is said (twelve ~55% into line 1, twenty million
// ~65% into line 2), creeps on slowly after it, then climbs to the full count at the climax line
export const TWELVE_AT = 1.55;
export const ARMY_AT = 2.65;
export const antsAt = (t: number) => logLerp(t, [[0, 1], [TWELVE_AT, DOZEN], [2, DOZEN + 2], [ARMY_AT, FACTS.driverColony.value], [CLIMAX_T, FACTS.antCount.value]]);

const BIG: [number, string][] = [[1e15, "quadrillion"], [1e12, "trillion"], [1e9, "billion"], [1e6, "million"]];
export const fmtAnts = (n: number): { value: string; unit: string } => {
  const v = Math.floor(n);
  for (const [d, name] of BIG) if (v >= d) return { value: String(Math.floor(v / d)), unit: name };
  return { value: v.toLocaleString("en-US"), unit: "" };
};

const yearWords = `${numberWords(Math.floor(FACTS.countYear.value / 100))} ${numberWords(FACTS.countYear.value % 100)}`;
const quadWords = `${numberWords(FACTS.antCount.value / 1e15)} quadrillion`;

export const ep013: Episode = {
  id: "ep013",
  template: 3,
  title: "What if every ant on Earth came for you?",
  counterLabel: "Ants coming for you",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < TWIST_T ? "ANTS ON THE WAY" : "REAL COUNT"),
  counterAt: (t) => {
    if (t < 6) return { text: fmtAnts(antsAt(t)) };
    if (t < TWIST_T) return { label: "Ant army speed", text: { value: String(FACTS.driverSpeed.value), unit: "m / hour" } };
    return { label: "Ants on Earth", text: fmtAnts(FACTS.antCount.value) };
  },
  rungs: [
    { t: 0.05, label: "One garden ant", icon: "drop", size: 1, relation: "about" },
    { t: TWELVE_AT, label: `${DOZEN} on your shoe`, icon: "drop", size: 1, relation: "about" },
    { t: 2, label: "Driver ants: one column", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: `A colony ${FACTS.supercolonyKm.value.toLocaleString("en-US")} km long`, icon: "drop", size: 1, relation: "about" },
    { t: CLIMAX_T, label: "Every ant on Earth", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: `${(Math.floor(PER_PERSON / 1e4) / 100).toFixed(2)} million per person`, icon: "drop", size: 1, relation: "about" },
    { t: 6, label: `You walk 20 m in ${Math.round(FACTS.driverSpeed.value / FACTS.walkSpeed.value)} s`, icon: "drop", size: 1, relation: "about" },
    { t: 7, label: `You walk ${Math.floor(TIMES_FASTER / 10) * 10}× faster`, icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: `Counted from ${FACTS.studies.value} studies`, icon: "drop", size: 1, relation: "about" },
    { t: 9, label: `Ants ${FACTS.antCarbonMt.value} Mt vs birds + mammals ${BIRDS_MAMMALS_MT} Mt`, icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "Every ant on Earth just turned, and they're all marching at you.", text: "Every ant on Earth just turned, and they're all marching at you.", keys: ["Every ant on Earth", "marching at you"] },
    { t: 1, to: 2, say: `The first few reach your shoe. ${capitalise(numberWords(DOZEN))} ants. Easy.`, text: `The first few reach your shoe. ${DOZEN} ants. Easy.`, keys: ["your shoe", "12 ants"], pause: 0.3 },
    { t: 2, to: 3, say: `Then come the driver ants. Up to ${numberWords(FACTS.driverColony.value / 1e6)} million in one column.`, text: `Then come the driver ants. Up to ${FACTS.driverColony.value / 1e6} million in one column.`, keys: ["driver ants", "20 million"], pause: 0.3 },
    { t: 3, to: CLIMAX_T, say: `Then a colony ${numberWords(FACTS.supercolonyKm.value / 1000)} thousand kilometers long, from Italy to Spain.`, text: `Then a colony ${FACTS.supercolonyKm.value.toLocaleString("en-US")} kilometers long, from Italy to Spain.`, keys: ["6,000 kilometers", "Italy to Spain"], pause: 0.3 },
    { t: CLIMAX_T, to: 5, say: `Now all ${quadWords}. Coming for you.`, text: `Now all ${FACTS.antCount.value / 1e15} quadrillion. Coming for you.`, keys: ["20 quadrillion", "Coming for you"], beat: "climax", pause: 0.35 },
    { t: 5, to: 6, say: "That's almost two and a half million for every person alive.", text: "That's almost 2.5 million for every person alive.", keys: ["2.5 million"], pause: 0.3 },
    { t: 6, to: 7, say: `But a driver ant army marches about ${numberWords(FACTS.driverSpeed.value)} meters an hour.`, text: `But a driver ant army marches about ${FACTS.driverSpeed.value} meters an hour.`, keys: ["20 meters an hour"], pause: 0.35 },
    { t: 7, to: TWIST_T, say: "You walk over two hundred times faster. Just stroll away.", text: "You walk over 200 times faster. Just stroll away.", keys: ["200 times faster", "stroll away"], pause: 0.3 },
    { t: TWIST_T, to: 9, say: `Scientists really counted them in ${yearWords}.`, text: `Scientists really counted them in ${FACTS.countYear.value}.`, keys: ["really counted"], beat: "twist", pause: 0.45 },
    { t: 9, to: END_T, say: "And all those ants outweigh every wild bird and mammal combined.", text: "And all those ants outweigh every wild bird and mammal combined.", keys: ["outweigh", "combined"], beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep013.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep013.title.length < 50, `title under 50 characters: ${ep013.title.length}`);
  check(yearWords === "twenty twenty two", `spoken year: ${yearWords}`);
  check(quadWords === "twenty quadrillion", `spoken total: ${quadWords}`);
  check(PER_PERSON < 2.5e6 && PER_PERSON > 2.3e6, `per person ${PER_PERSON.toFixed(0)}: "almost two and a half million" is true`);
  check(TIMES_FASTER > 200, `you walk ${TIMES_FASTER.toFixed(0)}x faster: "over two hundred times" is true`);
  check(FACTS.antCarbonMt.value > BIRDS_MAMMALS_MT, `ants ${FACTS.antCarbonMt.value} Mt C > wild birds + mammals ${BIRDS_MAMMALS_MT} Mt C`);
  check(Math.round(antsAt(TWELVE_AT)) === DOZEN && Math.round(antsAt(ARMY_AT)) === FACTS.driverColony.value && Math.round(antsAt(CLIMAX_T) / 1e15) === 20, "counter shows each spoken number when it is said");
  check(fmtAnts(20e15).value === "20" && fmtAnts(20e15).unit === "quadrillion" && fmtAnts(2e7).unit === "million", "counter format");
  let last = -Infinity;
  let rising = true;
  for (let t = 0.01; t <= CLIMAX_T; t += 0.01) {
    if (antsAt(t) < last) rising = false;
    last = antsAt(t);
  }
  check(rising, "ant count only climbs");
  for (const l of ep013.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  for (const r of ep013.rungs) console.log(`     rung t=${r.t}: ${r.label}`);
  const words = ep013.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
