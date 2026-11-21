// Episode 18 (Round 3 #29, category: Absurd scale): "What if you held a teaspoon of neutron star?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep018.ts` to print and check them.
import type { Episode } from "../types";

export const FACTS = {
  sugarCube: { value: 1e12, note: "NASA: one sugar cube of neutron star material would weigh about 1 trillion kilograms (1 billion tons) on Earth. APPROXIMATE: National Geographic gives a lower figure (~100 million tons), so sources differ; the script says 'about' and uses NASA's.", source: "NASA Science, 'Neutron Stars Are Weird' (science.nasa.gov/universe/neutron-stars-are-weird); NASA Imagine the Universe, pulsars" },
  cubeCm3: { value: 1, note: "A sugar cube is about 1 cubic centimetre (1 mL).", source: "NASA's sugar-cube comparison; standard sugar cube ~1 cm3" },
  teaspoonCm3: { value: 4.93, note: "A US teaspoon is 4.92892 mL.", source: "NIST Handbook 44 / US customary unit definition (1 teaspoon = 4.92892 mL)" },
  pyramid: { value: 5.9e9, note: "Great Pyramid of Giza mass in kg: about 5.9 million tonnes (estimates 5.5-6.75 million). APPROXIMATE; 'over seven hundred' holds across that range.", source: "Great Pyramid of Giza, mass estimates (~5.9 Mt), Wikipedia and ScienceBlog summary of the Egyptological estimate" },
  cityBall: { value: 1, note: "Neutron stars squeeze up to about twice the Sun's mass into a sphere the diameter of a city (radius ~10-13 km for a 1.4-Sun-mass star).", source: "NASA Science, 'Neutron Stars Are Weird'; Chandra X-ray Center blog (radius 10.4-12.9 km for 1.4 solar masses)" },
  densest: { value: 1, note: "NASA calls neutron stars the densest material we can directly observe.", source: "NASA Science, 'Neutron Stars Are Weird'" },
  humans: { value: 8e9, note: "World population passed 8 billion in November 2022. Average adult mass ~62 kg gives ~5e11 kg, under NASA's 1e12 kg per cube, so it fits (self-test).", source: "UN World Population Prospects 2022; Walpole et al. 2012 (average adult human mass ~62 kg)" },
  humanCube: { value: 1, note: "Chandra: all of humanity could be squashed down to a sugar cube-sized piece of neutron star.", source: "Chandra X-ray Center blog, chandra.harvard.edu/blog/node/432" },
  caveat: { value: 1, note: "UNCERTAIN / hypothetical: neutron star matter only holds together under the star's gravity; the video is a what-if and never claims what would physically happen to a released teaspoon beyond 'too heavy for the floor'.", source: "Framing note; claims limited to NASA/Chandra figures above" },
} as const;

const END_T = 9;
export const CLIMAX_T = 4;
export const TWIST_T = 6;

export const teaspoonKg = FACTS.sugarCube.value * (FACTS.teaspoonCm3.value / FACTS.cubeCm3.value);
export const billionTonnes = teaspoonKg / 1e12; // 1 billion tonnes = 1e12 kg
export const pyramids = Math.round(teaspoonKg / FACTS.pyramid.value);

const ramp = (t: number, a: number, b: number, from: number, to: number) => {
  const k = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return from + (to - from) * (k * k * (3 - 2 * k));
};
// counter in billion tonnes; reaches the spoken value while line 1 is spoken
export const weightAt = (t: number) => ramp(t, 0.3, 1.9, 0, billionTonnes);

export const ep018: Episode = {
  id: "ep018",
  template: 3,
  title: "What if you held a teaspoon of neutron star?",
  counterLabel: "Weight",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < TWIST_T ? "ONE TEASPOON" : "SQUASHED TIGHT"),
  counterAt: (t) => {
    if (t < TWIST_T) return { text: { value: weightAt(t).toFixed(1), unit: "billion tonnes" } };
    return { label: "People in a sugar cube", text: { value: "8 billion", unit: "" } };
  },
  rungs: [
    { t: 0.05, label: "≈ a teaspoon of neutron star", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: "≈ 5 billion tonnes in one teaspoon", icon: "drop", size: 1, relation: "about" },
    { t: 2, label: `≈ 700+ Great Pyramids`, icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Too heavy for the floor", icon: "drop", size: 1, relation: "about" },
    { t: CLIMAX_T, label: "A star squeezed to a city-sized ball", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "Densest thing we can observe", icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: "All of humanity ≈ one sugar cube", icon: "drop", size: 1, relation: "about" },
    { t: 7, label: "≈ small enough for your pocket", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "Someone just put a teaspoon of neutron star in your hand.", text: "Someone just put a teaspoon of neutron star in your hand.", keys: ["neutron star", "your hand"] },
    { t: 1, to: 2, say: "It weighs about five billion tonnes. Your hand is going down.", text: "It weighs about 5 billion tonnes. Your hand is going down.", keys: ["5 billion tonnes", "going down"], pause: 0.3 },
    { t: 2, to: 3, say: `That's over seven hundred Great Pyramids, squeezed into one teaspoon.`, text: `That's over 700 Great Pyramids, squeezed into one teaspoon.`, keys: ["700 Great Pyramids", "one teaspoon"], pause: 0.3 },
    { t: 3, to: 4, say: "The floor can't hold it, so it sinks straight into the Earth.", text: "The floor can't hold it, so it sinks straight into the Earth.", keys: ["can't hold it", "sinks straight"], pause: 0.3 },
    { t: CLIMAX_T, to: 5, say: "A star heavier than our Sun, squeezed into a ball the size of a city.", text: "A star heavier than our Sun, squeezed into a ball the size of a city.", keys: ["heavier than our Sun", "size of a city"], beat: "climax", pause: 0.35 },
    { t: 5, to: TWIST_T, say: "That's why nothing we can see is denser.", text: "That's why nothing we can see is denser.", keys: ["nothing we can see"], pause: 0.3 },
    { t: TWIST_T, to: 7, say: "And here's the wild part. All eight billion people on Earth, squashed that tight, would fit in a sugar cube.", text: "And here's the wild part. All 8 billion people on Earth, squashed that tight, would fit in a sugar cube.", keys: ["8 billion people", "sugar cube"], beat: "twist", pause: 0.45 },
    { t: 7, to: END_T, say: "Everyone you know. Small enough to lose in your pocket.", text: "Everyone you know. Small enough to lose in your pocket.", keys: ["Everyone you know", "your pocket"], beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep018.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep018.title.length < 50, `title under 50 characters: ${ep018.title.length}`);
  check(Math.round(billionTonnes) === 5, `teaspoon = ${billionTonnes.toFixed(2)} billion tonnes ("about five")`);
  check(pyramids > 700 && pyramids < 900, `${pyramids} pyramids ("over seven hundred"); low-end mass 6.75 Mt gives ${Math.round(teaspoonKg / 6.75e9)}`);
  check(Math.round(teaspoonKg / 6.75e9) > 700, "still hundreds of pyramids at the highest mass estimate");
  check(FACTS.humans.value * 62 < FACTS.sugarCube.value, `humans ≈ ${(FACTS.humans.value * 62).toExponential(1)} kg < one NASA sugar cube 1e12 kg`);
  let last = -1;
  let rising = true;
  for (let t = 0; t < TWIST_T; t += 0.01) { const w = weightAt(t); if (w < last) rising = false; last = w; }
  check(rising, "weight counter only climbs");
  check(Math.abs(weightAt(2) - billionTonnes) < 1e-9, "counter reaches the spoken value");
  for (const l of ep018.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep018.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
