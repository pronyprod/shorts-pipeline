// Episode 21 (Round 3 #37, category: Deadly place): "What if you stood on Venus for one minute?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep021.ts` to print and check them.
import type { Episode } from "../types";

export const FACTS = {
  surfaceTempC: { value: 464, note: "Mean surface temperature of Venus 737 K = 464 C.", source: "NASA NSSDC Venus Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html)" },
  surfaceBar: { value: 92, note: "Surface pressure 92 bars (about 91 Earth atmospheres).", source: "NASA NSSDC Venus Fact Sheet" },
  leadMeltC: { value: 327.5, note: "Lead melts at 327.5 C, below Venus's 464 C, so 'hot enough to melt lead' is true.", source: "CRC Handbook of Chemistry and Physics (lead melting point 600.61 K); Wikipedia 'Lead'" },
  seawaterDensity: { value: 1025, note: "Seawater density ~1025 kg/m3, g = 9.81 m/s2; depth where the water pressure alone reaches 92 bar is computed below (about 915 m); the script says 'about nine hundred metres'. Comparison of pressure only.", source: "NOAA seawater density ~1025 kg/m3; standard gravity (NIST)" },
  acidClouds: { value: 1, note: "Venus's clouds are made mostly of sulfuric acid droplets, high above the surface.", source: "NASA Science, Venus overview (science.nasa.gov/venus/)" },
  hottest: { value: 1, note: "Venus is the hottest planet in the solar system, hotter than Mercury though farther from the Sun.", source: "NASA Science, Venus facts (science.nasa.gov/venus/venus-facts/)" },
  noHumans: { value: 1, note: "Only uncrewed probes have landed on Venus; no human has.", source: "NASA NSSDC, Soviet Venera landers (Venera 7 in 1970 first to transmit from the surface)" },
  venera13: { value: 127, note: "Venera 13 landed on 1 March 1982 and operated on the surface for at least 127 minutes; it was designed for about 32 minutes.", source: "Wikipedia 'Venera 13' (citing NASA NSSDC Venera 13 and Soviet mission records)" },
  designMin: { value: 32, note: "Designed lifetime on the surface about 32 minutes.", source: "Wikipedia 'Venera 13'; NASA NSSDC" },
} as const;

const END_T = 9;
export const CLIMAX_T = 4;
export const TWIST_T = 6;

export const seaDepthM = (FACTS.surfaceBar.value * 1e5) / (FACTS.seawaterDensity.value * 9.81);
export const lifetimeRatio = FACTS.venera13.value / FACTS.designMin.value;

const ramp = (t: number, a: number, b: number, from: number, to: number) => {
  const k = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return from + (to - from) * (k * k * (3 - 2 * k));
};
export const secondsAt = (t: number) => Math.round(ramp(t, 0.2, 5, 0, 60));

export const ep021: Episode = {
  id: "ep021",
  template: 3,
  title: "What if you stood on Venus for one minute?",
  counterLabel: "Seconds on Venus",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < TWIST_T ? "VENUS SURFACE" : "VENERA 13, 1982"),
  counterAt: (t) => {
    if (t < TWIST_T) return { text: { value: String(secondsAt(t)), unit: "s" } };
    return { label: "Venera 13 lasted", text: { value: String(FACTS.venera13.value), unit: "min" } };
  },
  rungs: [
    { t: 0.05, label: "≈ the hottest planet", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: "≈ 464 °C, hotter than melting lead", icon: "drop", size: 1, relation: "about" },
    { t: 2, label: "≈ 92 bar, like 900 m under the sea", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "≈ clouds of sulfuric acid above", icon: "drop", size: 1, relation: "about" },
    { t: CLIMAX_T, label: "≈ only robots have landed", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "≈ robots give up fast", icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: "≈ built for 32 minutes", icon: "drop", size: 1, relation: "about" },
    { t: 7, label: "≈ 4 times its design life", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "You step onto Venus. You have sixty seconds.", text: "You step onto Venus. You have 60 seconds.", keys: ["Venus", "60 seconds"] },
    { t: 1, to: 2, say: "It's four hundred and sixty-four degrees. Hot enough to melt lead.", text: "It's 464 degrees. Hot enough to melt lead.", keys: ["464 degrees", "melt lead"], pause: 0.3 },
    { t: 2, to: 3, say: "The air is so heavy, it feels like standing nine hundred metres under the sea.", text: "The air is so heavy, it feels like standing 900 metres under the sea.", keys: ["so heavy", "900 metres under the sea"], pause: 0.3 },
    { t: 3, to: 4, say: "Above you, the clouds are made of sulfuric acid.", text: "Above you, the clouds are made of sulfuric acid.", keys: ["sulfuric acid"], pause: 0.3 },
    { t: CLIMAX_T, to: 5, say: "That's why every visitor so far has been a robot, never a person.", text: "That's why every visitor so far has been a robot, never a person.", keys: ["a robot", "never a person"], beat: "climax", pause: 0.35 },
    { t: 5, to: TWIST_T, say: "And even robots give up fast.", text: "And even robots give up fast.", keys: ["give up fast"], pause: 0.3 },
    { t: TWIST_T, to: 7, say: "In nineteen eighty-two, the Soviet probe Venera 13 was built to last thirty-two minutes. It kept working for one hundred and twenty-seven.", text: "In 1982, the Soviet probe Venera 13 was built to last 32 minutes. It kept working for 127.", keys: ["Venera 13", "32 minutes", "127"], beat: "twist", pause: 0.45 },
    { t: 7, to: END_T, say: "Nearly four times longer, on the hottest planet there is.", text: "Nearly 4 times longer, on the hottest planet there is.", keys: ["Nearly 4 times longer", "hottest planet"], beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep021.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep021.title.length < 50, `title under 50 characters: ${ep021.title.length}`);
  check(FACTS.surfaceTempC.value > FACTS.leadMeltC.value, `Venus ${FACTS.surfaceTempC.value} C > lead melts ${FACTS.leadMeltC.value} C`);
  check(seaDepthM > 850 && seaDepthM < 950, `92 bar = ${seaDepthM.toFixed(0)} m of seawater ("about 900 m")`);
  check(lifetimeRatio > 3.5 && lifetimeRatio < 4, `127/32 = ${lifetimeRatio.toFixed(2)} ("nearly four times")`);
  let last = -1;
  let rising = true;
  for (let t = 0; t < TWIST_T; t += 0.01) { const w = secondsAt(t); if (w < last) rising = false; last = w; }
  check(rising && secondsAt(5) === 60, "seconds counter only climbs and reaches 60");
  for (const l of ep021.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const l of ep021.lines) check(!/you see/i.test(l.say), "no 'You see'");
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep021.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
