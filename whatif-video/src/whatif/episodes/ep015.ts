// Episode 15 (TIMELY slot; Round 3 style, category: Deadly place): "What if you stood on Mars as its biggest volcano woke up?"
// Timely source: Trokhimovskiy et al., Science Advances 12(45), published 4-7 Nov 2026 (ESA release).
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep015.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  studyDate: { value: 2026, note: "TIMELY: the study 'Enigmatic HCl detections as a potential signature of igneous activity on Mars' (Trokhimovskiy, Mege et al.) appeared in Science Advances vol. 12, no. 45 in early November 2026 (ESA release re-published by ScienceDaily 7 Nov 2026; Sky at Night Magazine and others reported it 4-6 Nov 2026). Within 30 days of the 17 Nov 2026 run.", source: "ScienceDaily / ESA, 'Mars may still be volcanically active' (sciencedaily.com/releases/2026/11/261106174525.htm, 7 Nov 2026); Science Advances doi:10.1126/sciadv.aeb9422" },
  hcl: { value: 1, note: "The ExoMars Trace Gas Orbiter's infrared spectrometers saw bursts of hydrogen chloride (HCl) gas in early northern summer, above fresh-looking fissures on the flanks of Alba Mons; the team reads it as a possible sign of magma below. An interpretation, not proof. No eruption or lava flow has ever been directly observed on Mars.", source: "ScienceDaily / ESA, 7 Nov 2026; Sky at Night Magazine (Nov 2026); Science Advances 12(45)" },
  fissures: { value: 100, note: "The fresh fissures are 'hundreds of metres' long (CaSSIS camera); no exact measurement is given, so the voice only says 'hundreds of meters'.", source: "ScienceDaily / ESA, 7 Nov 2026" },
  albaLengthKm: { value: 2000, note: "Alba Mons is about 2,000 km north-south, measured to the outer edge of its flows. It is the biggest volcano on Mars by surface area.", source: "Carr (2006), 'The Surface of Mars', p. 54; Cattermole (2001) and ESA 'Mars upside down', as summarised in Wikipedia 'Alba Mons' (accessed 17 Nov 2026)" },
  albaSlope: { value: 0.5, note: "Average slope of the northern flank about 0.5 degrees (over five times lower than other large Tharsis volcanoes).", source: "Carr (2006), p. 54; Boyce (2008), as summarised in Wikipedia 'Alba Mons' (accessed 17 Nov 2026)" },
  co2: { value: 95.1, note: "Mars's atmosphere is 95.1% carbon dioxide by volume; surface pressure about 6.36 mb (Earth about 1,013 mb).", source: "NASA NSSDC Mars Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html)" },
  winterC: { value: -120, note: "Mars winter temperatures can drop to about -120 degrees C; the authors suggest winter ice seals the fractures until it sublimates in early summer (a hypothesis).", source: "ScienceDaily / ESA, 7 Nov 2026" },
  ramp: { value: 1, note: "ILLUSTRATIVE: the counter's in-between values are a story ramp; only 2,000 km, 0.5 degrees, 95 percent and minus 120 are spoken, and those come from the facts above.", source: "Our illustration of the facts above" },
} as const;

const END_T = 8;
export const CLIMAX_T = 4;
export const TWIST_T = 6;
// the length counter reaches 2,000 km about when it is said (line 1)
export const LEN_AT = 1.65;
export const lenAt = (t: number) => Math.exp(Math.log(10) + Math.min(1, t / LEN_AT) * (Math.log(FACTS.albaLengthKm.value) - Math.log(10)));

const km = `${numberWords(FACTS.albaLengthKm.value / 1000)} thousand`;
const co2 = numberWords(95);

export const ep015: Episode = {
  id: "ep015",
  template: 3,
  title: "What if you stood on Mars as a volcano woke?",
  counterLabel: "Volcano length",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < TWIST_T ? "YOU ARE ON MARS" : "REAL NEWS, NOV 2026"),
  counterAt: (t) => {
    if (t < 2) return { text: { value: Math.round(lenAt(t)).toLocaleString("en-US"), unit: "km" } };
    if (t < 3) return { label: "Slope", text: { value: String(FACTS.albaSlope.value), unit: "°" } };
    if (t < 4) return { label: "Gas from the cracks", text: { value: "HCl", unit: "" } };
    if (t < 5) return { label: "Carbon dioxide in the air", text: { value: String(Math.round(FACTS.co2.value)), unit: "%" } };
    if (t < TWIST_T) return { label: "Winter night", text: { value: String(FACTS.winterC.value), unit: "°C" } };
    return { label: "Study published", text: { value: "Nov", unit: "2026" } };
  },
  rungs: [
    { t: 0.05, label: "Alba Mons, Mars", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: "Biggest Mars volcano by area", icon: "drop", size: 1, relation: "about" },
    { t: 2, label: "Barely a hill underfoot", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Fresh cracks, hundreds of m long", icon: "drop", size: 1, relation: "about" },
    { t: CLIMAX_T, label: "Air: mostly CO₂", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "Ice may seal the cracks", icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: "Seen from orbit (ESA)", icon: "drop", size: 1, relation: "about" },
    { t: 7, label: "No eruption ever seen on Mars", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "You're standing on Mars, and the volcano under your feet may be waking up.", text: "You're standing on Mars, and the volcano under your feet may be waking up.", keys: ["standing on Mars", "waking up"] },
    { t: 1, to: 2, say: `This is Alba Mons, the biggest volcano on Mars by area. About ${km} kilometers long.`, text: `This is Alba Mons, the biggest volcano on Mars by area. About ${FACTS.albaLengthKm.value.toLocaleString("en-US")} kilometers long.`, keys: ["Alba Mons", "2,000 kilometers"], pause: 0.3 },
    { t: 2, to: 3, say: "The slope is half a degree. You'd never notice you're climbing.", text: "The slope is half a degree. You'd never notice you're climbing.", keys: ["half a degree"], pause: 0.3 },
    { t: 3, to: CLIMAX_T, say: "But gas is leaking from fresh cracks, hundreds of meters long.", text: "But gas is leaking from fresh cracks, hundreds of meters long.", keys: ["fresh cracks", "hundreds of meters"], pause: 0.3 },
    { t: CLIMAX_T, to: 5, say: `And you can't breathe here. The air is ${co2} percent carbon dioxide.`, text: `And you can't breathe here. The air is ${Math.round(FACTS.co2.value)} percent carbon dioxide.`, keys: ["can't breathe", "95 percent"], beat: "climax", pause: 0.35 },
    { t: 5, to: TWIST_T, say: `Winter nights fall to minus ${numberWords(-FACTS.winterC.value)} degrees. Ice may seal the cracks shut.`, text: `Winter nights fall to minus ${-FACTS.winterC.value} degrees. Ice may seal the cracks shut.`, keys: ["minus 120 degrees", "seal the cracks"], pause: 0.3 },
    { t: TWIST_T, to: 7, say: "Scientists spotted the gas from orbit, and reported it this month.", text: "Scientists spotted the gas from orbit, and reported it this month.", keys: ["from orbit", "this month"], beat: "twist", pause: 0.4 },
    { t: 7, to: END_T, say: "So far, nobody has ever seen a volcano erupt on Mars.", text: "So far, nobody has ever seen a volcano erupt on Mars.", keys: ["So far", "ever seen"], beat: "twist", pause: 0.35 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep015.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep015.title.length < 50, `title under 50 characters: ${ep015.title.length}`);
  check(km === "two thousand", `spoken length: ${km}`);
  check(co2 === "ninety five" || co2 === "ninety-five", `spoken co2: ${co2}`);
  check(numberWords(120) === "one hundred twenty" || numberWords(120) === "one hundred and twenty", `spoken 120: ${numberWords(120)}`);
  check(Math.round(lenAt(LEN_AT)) === 2000, "counter shows 2,000 km when it is said");
  check(FACTS.co2.value > 95 && FACTS.co2.value < 96, "95.1% CO2: 'ninety five percent' is true");
  check(FACTS.albaSlope.value === 0.5, "0.5 degrees = half a degree");
  let last = -Infinity;
  let rising = true;
  for (let t = 0; t <= 2; t += 0.01) {
    if (lenAt(t) < last) rising = false;
    last = lenAt(t);
  }
  check(rising, "length counter only climbs");
  for (const l of ep015.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep015.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
