// Episode 1: "What if a raindrop doubled in size every second?"
// Every number on screen or in the voice comes from FACTS (sourced) or from
// the formulas below. Run `node src/whatif/episodes/ep001.ts` to print the
// computed ladder.
import type { Episode } from "../types";

export const FACTS = {
  startDiameterM: {
    value: 0.002,
    note: "A typical raindrop is 1-2 mm across; we start at 2 mm.",
    source: "AMS Glossary of Meteorology, 'Raindrop' (glossary.ametsoc.org/wiki/Raindrop)",
  },
  largestRealDropM: {
    value: 0.008,
    note: "The largest drops seen in heavy thunderstorms are about 5-8 mm (equivalent spherical diameter).",
    source: "AMS Glossary of Meteorology, 'Raindrop'",
  },
  marbleM: {
    value: 0.016,
    note: "Standard playing marble, 5/8 inch = 15.9 mm. Marbles vary in size (UNCERTAIN, typical value).",
    source: "Common toy-marble size; not checked against a formal standard",
  },
  footballM: {
    value: 0.223,
    note: "Size-5 ball circumference 68-70 cm, so diameter 21.6-22.3 cm. We use the largest.",
    source: "IFAB Laws of the Game, Law 2 (The Ball)",
  },
  carM: {
    value: 4.5,
    note: "Length of a typical mid-size car, about 4.5 m (APPROXIMATE).",
    source: "Typical vehicle dimension; approximate",
  },
  houseM: {
    value: 8,
    note: "Height of a typical two-storey house to the roof ridge, about 7-9 m (APPROXIMATE).",
    source: "Typical building dimension; approximate",
  },
  footballFieldM: {
    value: 110,
    note: "International pitch length 100-110 m; we compare with the longest allowed.",
    source: "IFAB Laws of the Game, Law 1 (The Field of Play)",
  },
  skyscraperM: {
    value: 828,
    note: "Burj Khalifa, tallest completed building (Jeddah Tower, planned ~1,000 m, is unfinished as of Oct 2026).",
    source: "Council on Tall Buildings and Urban Habitat (CTBUH)",
  },
  everestM: {
    value: 8848.86,
    note: "Mount Everest height from the 2020 China-Nepal survey.",
    source: "Joint China-Nepal announcement, Dec 2020",
  },
  javaM: {
    value: 1_064_000,
    note: "Java is about 1,064 km long east to west.",
    source: "Encyclopaedia Britannica, 'Java (island, Indonesia)'",
  },
  oceanVolumeM3: {
    value: 1.335e18,
    note: "1,335,000,000 km^3 of water in the ocean.",
    source: "NOAA Ocean Service, 'How much water is in the ocean?'",
  },
  earthDiameterM: {
    value: 12_742_000,
    note: "Earth's mean diameter.",
    source: "NASA Earth Fact Sheet (mean radius 6,371 km)",
  },
  earthMassKg: {
    value: 5.972e24,
    note: "Earth's mass.",
    source: "NASA Earth Fact Sheet",
  },
  earthDensity: {
    value: 5513,
    note: "Earth's mean density in kg/m^3 (water is 1,000), so rock sinks in the drop.",
    source: "NASA Earth Fact Sheet",
  },
  waterDensity: {
    value: 1000,
    note: "Liquid water, kg/m^3 (ignores compression deep inside a planet-sized drop).",
    source: "Standard value; SIMPLIFICATION",
  },
} as const;

// d(t) = d0 * 2^t  (diameter doubles every second)
export const diameterAt = (t: number) => FACTS.startDiameterM.value * 2 ** t;
export const volumeAt = (t: number) => (Math.PI / 6) * diameterAt(t) ** 3;
export const massAt = (t: number) => volumeAt(t) * FACTS.waterDensity.value;
// Story time when the drop first reaches a diameter
export const timeForDiameter = (d: number) => Math.log2(d / FACTS.startDiameterM.value);
// Story time when the drop's volume (or mass) first reaches a value: volume grows 8x per second
export const timeForVolume = (v: number) => Math.log(v / volumeAt(0)) / Math.log(8);
export const timeForMass = (m: number) => timeForVolume(m / FACTS.waterDensity.value);

export const MOMENTS = {
  oceans: timeForVolume(FACTS.oceanVolumeM3.value),
  heavierThanEarth: timeForMass(FACTS.earthMassKg.value),
};

export const END_T = 34;

// Diameter of a water sphere holding all ocean water / weighing as much as Earth
const oceanSphereD = Math.cbrt((6 * FACTS.oceanVolumeM3.value) / Math.PI);
const earthMassSphereD = Math.cbrt((6 * FACTS.earthMassKg.value) / (Math.PI * FACTS.waterDensity.value));

// Ladder rungs: the comparison only appears once the drop really is bigger
// (or, for "about", within 10%). `check` in the self-test enforces that.
export const ep001: Episode = {
  id: "ep001",
  // published: pinned to template 1 so it keeps rendering exactly as released
  template: 1,
  title: "What if a raindrop doubled in size every second?",
  counterLabel: "Raindrop diameter",
  endT: END_T,
  diameterAt,
  rungs: [
    { t: 0, label: "A real raindrop", icon: "drop", size: FACTS.startDiameterM.value, relation: "about" },
    { t: 2, label: "Bigger than real rain gets", icon: "drop", size: FACTS.largestRealDropM.value, relation: "about" },
    { t: 3, label: "Marble size", icon: "marble", size: FACTS.marbleM.value, relation: "about" },
    { t: 7, label: "Bigger than a football", icon: "ball", size: FACTS.footballM.value, relation: "bigger" },
    { t: 11, label: "About a car long", icon: "car", size: FACTS.carM.value, relation: "about" },
    { t: 12, label: "As tall as a house", icon: "house", size: FACTS.houseM.value, relation: "about" },
    { t: 16, label: "Longer than a football field", icon: "field", size: FACTS.footballFieldM.value, relation: "bigger" },
    { t: 19, label: "Taller than any skyscraper", icon: "tower", size: FACTS.skyscraperM.value, relation: "bigger" },
    { t: 23, label: "Taller than Mount Everest", icon: "mountain", size: FACTS.everestM.value, relation: "bigger" },
    { t: 29, label: "Longer than the island of Java", icon: "island", size: FACTS.javaM.value, relation: "bigger" },
    { t: 29.4, label: "More water than all oceans", icon: "drop", size: oceanSphereD, relation: "bigger" },
    { t: 33, label: "Wider than Earth", icon: "earth", size: FACTS.earthDiameterM.value, relation: "bigger", lead: 3.6 },
    { t: 33.4, label: "Heavier than Earth", icon: "drop", size: earthMassSphereD, relation: "bigger" },
  ],
  // `t` = story second the counter reaches when the line starts; the counter
  // races there during the pause before the line. `to` = where it is when the line ends.
  // `say` is what the narrator reads (numbers as words); `text` is the caption.
  lines: [
    { t: 0, say: "What if a raindrop doubled in size, every second?", text: "What if a raindrop doubled in size every second?", pause: 0.15, whole: true },
    { t: 0, say: "It starts as a real raindrop. Two millimeters wide.", text: "It starts as a real raindrop. 2 millimeters wide." },
    { t: 0.05, to: 2, say: "One second: four millimeters. Two seconds: eight.", text: "1 second: 4 millimeters. 2 seconds: 8." },
    { t: 2, to: 2.2, say: "That's already bigger than almost any raindrop on Earth.", text: "Already bigger than almost any raindrop on Earth." },
    { t: 3, say: "Three seconds. The size of a marble.", text: "3 seconds. The size of a marble.", pause: 0.5 },
    { t: 7, say: "Seven. Bigger than a football.", text: "7. Bigger than a football.", pause: 0.7 },
    { t: 11, to: 12, say: "Eleven. As long as a car. Twelve. As tall as a house.", text: "11. As long as a car. 12. As tall as a house.", pause: 0.7 },
    { t: 16, say: "Sixteen. Longer than a football field.", text: "16. Longer than a football field.", pause: 0.7 },
    { t: 19, say: "Nineteen. Taller than any skyscraper on the planet.", text: "19. Taller than any skyscraper on the planet.", pause: 0.6 },
    { t: 20, say: "At twenty seconds, it's two kilometers wide. It doesn't rain on the city. It swallows it.", text: "20 seconds: 2 kilometers wide. It doesn't rain on the city. It swallows it.", pause: 0.4, show: "city" },
    { t: 23, say: "Twenty three. Taller than Mount Everest.", text: "23. Taller than Mount Everest.", pause: 0.6 },
    { t: 29, say: "Twenty nine. Longer than the whole island of Java.", text: "29. Longer than the whole island of Java.", pause: 0.7 },
    { t: 29.4, to: 29.6, say: "And it holds more water than every ocean on Earth, combined.", text: "It holds more water than every ocean on Earth combined." },
    { t: 33, say: "Thirty three seconds. It's wider than the Earth.", text: "33 seconds. It's wider than the Earth.", pause: 0.6 },
    { t: 33.4, to: 34, say: "Then it gets heavier than the Earth. So the raindrop doesn't fall on Earth.", text: "Then it gets heavier than the Earth. So the raindrop doesn't fall on Earth.", beat: "climax" },
    { t: 34, say: "Earth falls into the raindrop, and sinks to the middle, like a pebble.", text: "Earth falls into the raindrop and sinks to the middle, like a pebble.", beat: "climax", show: "merge" },
    { t: 34, say: "Here's the twist. Every real raindrop grows around a tiny speck of dust.", text: "The twist: every real raindrop grows around a tiny speck of dust.", beat: "twist", pause: 0.6, show: "dust" },
    { t: 34, say: "This one just found its speck. Us.", text: "This one just found its speck. Us.", beat: "twist", show: "speck" },
    { t: 34, say: "What should double next? Comment below!", text: "What should double next? Comment below!", beat: "cta", pause: 0.6, show: "cta" },
  ],
};

// Self-test: prints the ladder and fails if a comparison isn't true
if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep001.ts")) {
  for (let t = 0; t <= END_T; t++) console.log(`t=${String(t).padStart(2)}  d=${diameterAt(t).toPrecision(4)} m`);
  let ok = true;
  for (const r of ep001.rungs) {
    const d = diameterAt(r.t);
    const pass = r.relation === "bigger" ? d > r.size : Math.abs(d / r.size - 1) <= 0.1;
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} t=${r.t} ${r.label}: drop ${d.toPrecision(4)} m vs ${r.size} m (first passes at t=${timeForDiameter(r.size).toFixed(2)})`);
  }
  console.log(`More water than all oceans at t=${MOMENTS.oceans.toFixed(2)} (d=${(diameterAt(MOMENTS.oceans) / 1000).toFixed(0)} km)`);
  console.log(`Heavier than Earth at t=${MOMENTS.heavierThanEarth.toFixed(2)} (d=${(diameterAt(MOMENTS.heavierThanEarth) / 1000).toFixed(0)} km)`);
  console.log(`At t=${END_T}: d=${(diameterAt(END_T) / 1000).toFixed(0)} km, mass = ${(massAt(END_T) / FACTS.earthMassKg.value).toFixed(2)} Earths`);
  if (!ok) process.exit(1);
}
