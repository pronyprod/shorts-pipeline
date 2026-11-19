// Episode 17 (Round 3 #27, category: Deadly place): "What if you sank to the Mariana Trench floor?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep017.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  bottom: { value: 10935, note: "Deepest observed point of Challenger Deep, 10,935 m (+/- 6 m at 95% confidence) below mean sea level, from the 2021 crewed-sub survey.", source: "Deep-Sea Research Part I (2021) Challenger Deep survey, NOAA-affiliated; summarised by Live Science 'How deep is the Mariana Trench?'" },
  seawater: { value: 1025, note: "Mean seawater density in kg/m3 and g = 9.80665 m/s2 used for hydrostatic pressure P = 1 atm + rho*g*h. APPROXIMATE: ignores that deep water is slightly denser (real value is a little higher), so 'over a thousand' is safe.", source: "Standard oceanography value (UNESCO/TEOS-10 mean surface seawater ~1025 kg/m3)" },
  pressureRatio: { value: 1000, note: "At the Challenger Deep the pressure is more than 1,000 times standard sea-level atmospheric pressure (roughly 1,100 by other estimates).", source: "Guinness World Records, 'Deepest point in the ocean'; Live Science (~1,100x)" },
  diveLimit: { value: 40, note: "Maximum depth for recreational scuba diving: 40 m (130 ft).", source: "PADI / recreational diving standards (Open Water 18 m, Advanced 30 m, Deep specialty 40 m)" },
  titanic: { value: 3800, note: "The Titanic wreck lies about 3,800 m (12,500 ft) deep, south of Newfoundland.", source: "NOAA Ocean Exploration, RMS Titanic; Britannica" },
  everest: { value: 8849, note: "Mount Everest height above sea level 8,849 m.", source: "Nepal/China joint survey, 2020" },
  snailfish: { value: 8336, note: "A juvenile Pseudoliparis snailfish was filmed at 8,336 m in the Izu-Ogasawara Trench (filmed 2022, announced April 2023): the deepest fish ever filmed.", source: "University of Western Australia news, April 2023; Guinness World Records (Apr 2023); Natural History Museum (Apr 2023)" },
  year: { value: 2022, note: "Filmed in 2022 (Guinness gives 15 August 2022; Live Science says September 2022).", source: "Guinness World Records (Apr 2023)" },
  tmaoLimit: { value: 8200, note: "A chemical (TMAO) that keeps fish proteins working under pressure is predicted to stop being enough near 8,200 m. This is a prediction by extrapolation, not an observation; the 2022 fish was filmed deeper than it.", source: "Yancey et al., PNAS 111(12), 2014, 'Marine fish may be biochemically constrained from inhabiting the deepest ocean depths'" },
  caveat: { value: 1, note: "UNCERTAIN: the Natural History Museum notes another fish was once reported deeper, but that record's reliability is questioned. The script only says this snailfish was 'filmed alive' at 8,336 m, which the sources support.", source: "Natural History Museum, April 2023" },
} as const;

const END_T = 9;
export const CLIMAX_T = 4;
export const TWIST_T = 7;

const atm = (m: number) => 1 + (FACTS.seawater.value * 9.80665 * m) / 101325;
export const pressureAt = (m: number) => Math.round(atm(m));
export const clearance = FACTS.bottom.value - FACTS.everest.value; // metres of water above Everest's summit if it stood on the floor

// depth (m) shown by the counter; it matches the spoken depth during each line
const ramp = (t: number, a: number, b: number, from: number, to: number) => {
  const k = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return from + (to - from) * (k * k * (3 - 2 * k));
};
export const depthAt = (t: number) => {
  if (t < 1) return ramp(t, 0, 1, 0, 25);
  if (t < 2) return t < 1.8 ? FACTS.diveLimit.value : ramp(t, 1.8, 2, FACTS.diveLimit.value, FACTS.titanic.value);
  if (t < 3) return FACTS.titanic.value;
  if (t < 4) return ramp(t, 3, 3.9, FACTS.titanic.value, FACTS.bottom.value);
  return FACTS.bottom.value;
};
const fmt = (n: number) => n.toLocaleString("en-US");
// spoken depth, e.g. 10935 -> "ten thousand nine hundred thirty five"
export const say = (n: number) => {
  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (th) parts.push(`${numberWords(th)} thousand`);
  if (rest) parts.push(numberWords(rest));
  return parts.join(" ");
};

export const ep017: Episode = {
  id: "ep017",
  template: 3,
  title: "What if you sank to the Mariana Trench floor?",
  counterLabel: "Depth",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < TWIST_T ? "SINKING" : "REAL RECORD"),
  counterAt: (t) => {
    if (t < TWIST_T) return { text: { value: fmt(Math.round(depthAt(t))), unit: "m" } };
    return { label: "Deepest fish filmed", text: { value: fmt(FACTS.snailfish.value), unit: "m" } };
  },
  rungs: [
    { t: 0.05, label: "≈ 1 atm: air pressure at the surface", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: `≈ ${pressureAt(FACTS.diveLimit.value)} atm: the recreational dive limit`, icon: "drop", size: 1, relation: "about" },
    { t: 2, label: `≈ ${pressureAt(FACTS.titanic.value)} atm: the Titanic wreck`, icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Sunlight is long gone", icon: "drop", size: 1, relation: "about" },
    { t: CLIMAX_T, label: `≈ ${fmt(pressureAt(FACTS.bottom.value))} atm: Challenger Deep`, icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "≈ 1,100 times surface air pressure", icon: "drop", size: 1, relation: "about" },
    { t: 6, label: `Everest stands ${fmt(FACTS.everest.value)} m tall`, icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: `Snailfish film, ${FACTS.year.value}`, icon: "drop", size: 1, relation: "about" },
    { t: 8, label: `Predicted limit ≈ ${fmt(FACTS.tmaoLimit.value)} m`, icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "You just slipped off a boat above the Mariana Trench. You're sinking.", text: "You just slipped off a boat above the Mariana Trench. You're sinking.", keys: ["Mariana Trench", "sinking"] },
    { t: 1, to: 2, say: `${say(FACTS.diveLimit.value)} metres. That's the deepest recreational divers go.`, text: `${FACTS.diveLimit.value} metres. That's the deepest recreational divers go.`, keys: ["40 metres", "deepest recreational divers"], pause: 0.3 },
    { t: 2, to: 3, say: `${say(FACTS.titanic.value)} metres. You're level with the Titanic.`, text: `${fmt(FACTS.titanic.value)} metres. You're level with the Titanic.`, keys: ["3,800 metres", "Titanic"], pause: 0.3 },
    { t: 3, to: 4, say: "Pitch black, and the water squeezes you harder every second.", text: "Pitch black, and the water squeezes you harder every second.", keys: ["Pitch black", "squeezes you harder"], pause: 0.3 },
    { t: CLIMAX_T, to: 5, say: `${say(FACTS.bottom.value)} metres. The bottom.`, text: `${fmt(FACTS.bottom.value)} metres. The bottom.`, keys: ["10,935 metres", "The bottom"], beat: "climax", pause: 0.35 },
    { t: 5, to: 6, say: "That's about eleven hundred times the air pressure you breathe.", text: "That's about eleven hundred times the air pressure you breathe.", keys: ["eleven hundred times"], pause: 0.3 },
    { t: 6, to: TWIST_T, say: "Mount Everest would fit down here, with over two kilometres to spare.", text: "Mount Everest would fit down here, with over two kilometres to spare.", keys: ["Mount Everest", "two kilometres"], pause: 0.3 },
    { t: TWIST_T, to: 8, say: `But in twenty twenty two, a snailfish was filmed alive at ${say(FACTS.snailfish.value)} metres.`, text: `But in ${FACTS.year.value}, a snailfish was filmed alive at ${fmt(FACTS.snailfish.value)} metres.`, keys: ["snailfish", "8,336 metres"], beat: "twist", pause: 0.45 },
    { t: 8, to: END_T, say: `A chemical in fish cells should fail near ${say(FACTS.tmaoLimit.value)} metres. This one swam past it.`, text: `A chemical in fish cells should fail near ${fmt(FACTS.tmaoLimit.value)} metres. This one swam past it.`, keys: ["should fail", "swam past it"], beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep017.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep017.title.length < 50, `title under 50 characters: ${ep017.title.length}`);
  check(say(10935) === "ten thousand nine hundred thirty five", `spoken bottom: ${say(10935)}`);
  check(say(8336) === "eight thousand three hundred thirty six", `spoken snailfish: ${say(8336)}`);
  check(say(3800) === "three thousand eight hundred", `spoken Titanic: ${say(3800)}`);
  check(Math.round(pressureAt(FACTS.bottom.value) / 100) * 100 === 1100, `pressure at the bottom ≈ ${pressureAt(FACTS.bottom.value)} atm (≈ 1,100, as the voice says)`);
  check(clearance > 2000 && clearance < 3000, `Everest clearance ${clearance} m = "over two kilometres to spare"`);
  check(FACTS.snailfish.value > FACTS.tmaoLimit.value && FACTS.snailfish.value < FACTS.bottom.value, "snailfish deeper than the predicted limit, above the floor");
  let last = -1;
  let rising = true;
  for (let t = 0; t < TWIST_T; t += 0.01) { const d = depthAt(t); if (d < last) rising = false; last = d; }
  check(rising, "depth counter only deepens");
  check(depthAt(CLIMAX_T) === FACTS.bottom.value && depthAt(1.5) === FACTS.diveLimit.value && depthAt(2.5) === FACTS.titanic.value, "counter matches the spoken depth in each line");
  for (const l of ep017.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep017.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
