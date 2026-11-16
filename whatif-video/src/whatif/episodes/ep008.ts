// Episode 8 (Round 3, category: Deadly place): "What if you stepped into space without a suit?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep008.ts` to print and check them.
import type { Episode } from "../types";
import { capitalise, numberWords } from "../words.ts";

export const FACTS = {
  consciousS: { value: 15, note: "Time you stay conscious in vacuum. APPROXIMATE, the top of the range: 'ten to fifteen seconds' from 1950s-60s research, and 9-12 s in animal studies. The voice says 'about'.", source: "Aerospaceweb, Human Exposure to the Vacuum of Space (q0291)" },
  animalLowS: { value: 9, note: "Low end of the range in animal studies. Only used by the self-test.", source: "Aerospaceweb, Human Exposure to the Vacuum of Space (q0291)" },
  lungAirS: { value: 0.2, note: "Time for air to leave unobstructed lungs. Backs 'rushes straight out'; the number isn't said.", source: "Wikipedia, Uncontrolled decompression" },
  armstrongKPa: { value: 6.26, note: "Below this pressure water boils at body temperature: saliva and tears do, blood in the vessels doesn't.", source: "Wikipedia, Armstrong limit" },
  bodyTempC: { value: 37, note: "Normal body temperature, the temperature the Armstrong limit refers to.", source: "Wikipedia, Armstrong limit" },
  swellVolume: { value: 2, note: "'Perhaps to as much as twice its normal volume'. APPROXIMATE, an upper bound, and it's VOLUME, so the drawing grows by the cube root.", source: "Aerospaceweb, Human Exposure to the Vacuum of Space (q0291)" },
  recoveryS: { value: 90, note: "Pressure back within 60-90 s usually allows recovery. APPROXIMATE, largely from animal studies. The voice says 'about' and 'could'.", source: "Aerospaceweb q0291; Wikipedia, Armstrong limit" },
  leblancYear: { value: 1966, note: "UNCERTAIN: Guinness gives 14 December 1966; Aerospaceweb and other accounts say 1965. We follow Guinness.", source: "Guinness World Records, Highest equivalent altitude exposure survived" },
  leblancDay: { value: 14, note: "Day in December 1966.", source: "Guinness World Records, Highest equivalent altitude exposure survived" },
  leblancPsi: { value: 0.1, note: "Pressure in the chamber at the time.", source: "Guinness World Records, Highest equivalent altitude exposure survived" },
  leblancAltM: { value: 36_576, note: "Equivalent altitude of that pressure (120,000 ft).", source: "Guinness World Records, Highest equivalent altitude exposure survived" },
  leblancAwakeS: { value: 14, note: "Conscious for about 14 s. On screen only. APPROXIMATE, from accounts of the same accident.", source: "Aerospaceweb, Human Exposure to the Vacuum of Space (q0291)" },
  leblancRefillS: { value: 87, note: "Seconds to repressurise the chamber to 14,000 ft equivalent, when he regained consciousness. UNCERTAIN: Aerospaceweb has him awake after about 30 s. We say only what the chamber took, and the screen credits Guinness.", source: "Guinness World Records, Highest equivalent altitude exposure survived" },
  kPaPerPsi: { value: 6.89476, note: "Unit conversion.", source: "NIST Guide to the SI, Appendix B" },
} as const;

// ---- the numbers ----
export const LEBLANC_KPA = FACTS.leblancPsi.value * FACTS.kPaPerPsi.value;
// twice the volume is this many times bigger across
export const SWELL_LINEAR = Math.cbrt(FACTS.swellVolume.value);
export const ARMSTRONG_TEXT = FACTS.armstrongKPa.value.toFixed(1);

const lerpKeys = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return keys[keys.length - 1][1];
};

// Story steps (one per line): 0-1 out the door | 1-2 lungs | 2-3 spit boils | 3-4 mouth chills |
// 4-5 no boiling blood, no explosion | 5-6 swelling | 6-7 oxygen runs out | 7-8 blackout |
// 8-9 the recovery window | 9-10 the real chamber | 10-11 the hose | 11-12 his last memory | 12-13 refilled.
const END_T = 13;
export const BLACK_T = 7;
export const REAL_T = 9;
export const HOSE_T = 10;
export const LAST_T = 11;
export const REFILL_T = 12;
const C = FACTS.consciousS.value;
export const secondsAt = (t: number) => lerpKeys(t, [[0, 0], [1, 1], [2, 2.5], [3, 5], [4, 6.5], [5, 8], [6, 10], [BLACK_T, C], [8, C + 1], [REAL_T, FACTS.recoveryS.value]]);
export const leblancAt = (t: number) => lerpKeys(t, [[HOSE_T, 0], [LAST_T, 10], [REFILL_T, FACTS.leblancAwakeS.value], [END_T, FACTS.leblancRefillS.value]]);

const secondsText = (s: number) => ({ value: s < C + 0.001 ? s.toFixed(1) : Math.round(s).toString(), unit: "s" });
const yearWords = `${numberWords(Math.floor(FACTS.leblancYear.value / 100))} ${numberWords(FACTS.leblancYear.value % 100)}`;

export const ep008: Episode = {
  id: "ep008",
  template: 3,
  title: "What if you stepped into space without a suit?",
  counterLabel: "Seconds exposed",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  stage: "vacuum",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => {
    if (t < 8) return "SLOWED DOWN";
    if (t < REAL_T) return "SPED UP";
    return "REAL CASE";
  },
  counterAt: (t) => {
    if (t < REAL_T) return { text: secondsText(secondsAt(t)) };
    if (t < HOSE_T) return { label: "Chamber altitude", text: { value: Math.round(lerpKeys(t, [[REAL_T, 0], [9.8, FACTS.leblancAltM.value]])).toLocaleString("en-US"), unit: "m" } };
    return { label: "His seconds", text: secondsText(leblancAt(t)) };
  },
  rungs: [
    { t: 0.1, label: "No suit. No air.", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: "Lungs empty", icon: "drop", size: 1, relation: "about" },
    { t: 2, label: "Your spit boils", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Mouth near freezing", icon: "drop", size: 1, relation: "about" },
    { t: 4, label: "Blood stays liquid", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "Swelling, not bursting", icon: "drop", size: 1, relation: "about" },
    { t: 6, label: "Oxygen running out", icon: "drop", size: 1, relation: "about" },
    { t: BLACK_T, label: "Blackout", icon: "drop", size: 1, relation: "about" },
    { t: 8, label: "Still alive", icon: "drop", size: 1, relation: "about" },
    { t: REAL_T, label: `Pressure: only ${FACTS.leblancPsi.value} psi`, icon: "drop", size: 1, relation: "about" },
    { t: HOSE_T, label: "The hose comes off", icon: "drop", size: 1, relation: "about" },
    { t: LAST_T, label: `Out after about ${FACTS.leblancAwakeS.value} s`, icon: "drop", size: 1, relation: "about" },
    { t: REFILL_T, label: "Chamber refilling", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: `You just stepped into space with no suit. You have about ${numberWords(C)} seconds.`, text: `You just stepped into space with no suit. You have about ${C} seconds.` },
    { t: 1, to: 2, say: "The air in your lungs rushes straight out.", text: "The air in your lungs rushes straight out.", pause: 0.25 },
    { t: 2, to: 3, say: "Your spit starts to boil. Not from heat. From no pressure.", text: "Your spit starts to boil. Not from heat. From no pressure.", pause: 0.25 },
    { t: 3, to: 4, say: "And that boiling chills your mouth to nearly freezing.", text: "And that boiling chills your mouth to nearly freezing.", pause: 0.25 },
    { t: 4, to: 5, say: "But your blood won't boil, and you won't explode.", text: "But your blood won't boil, and you won't explode.", pause: 0.3 },
    { t: 5, to: 6, say: "You just swell, up to twice your normal volume.", text: "You just swell, up to twice your normal volume.", pause: 0.25 },
    { t: 6, to: BLACK_T, say: "Then your blood runs out of oxygen.", text: "Then your blood runs out of oxygen.", pause: 0.25 },
    { t: BLACK_T, to: 8, say: `Second ${numberWords(C)}. Everything goes black.`, text: `Second ${C}. Everything goes black.`, beat: "climax", pause: 0.3 },
    { t: 8, to: REAL_T, say: `But you're alive. Get pressure back within about ${numberWords(FACTS.recoveryS.value)} seconds, and you could wake up.`, text: `But you're alive. Get pressure back within about ${FACTS.recoveryS.value} seconds, and you could wake up.`, pause: 0.4 },
    { t: REAL_T, to: HOSE_T, say: `This really happened. ${capitalise(yearWords)}, inside a NASA vacuum chamber.`, text: `This really happened. ${FACTS.leblancYear.value}, inside a NASA vacuum chamber.`, beat: "twist", pause: 0.4 },
    { t: HOSE_T, to: LAST_T, say: "Jim LeBlanc was testing a space suit when its air hose came off.", text: "Jim LeBlanc was testing a space suit when its air hose came off.", beat: "twist", pause: 0.25 },
    { t: LAST_T, to: REFILL_T, say: "His last memory? Spit boiling on his tongue.", text: "His last memory? Spit boiling on his tongue.", beat: "twist", pause: 0.25 },
    { t: REFILL_T, to: END_T, say: `The chamber refilled in ${numberWords(FACTS.leblancRefillS.value)} seconds. He woke up, no lasting harm.`, text: `The chamber refilled in ${FACTS.leblancRefillS.value} seconds. He woke up, no lasting harm.`, beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep008.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep008.title.length < 50, `title under 50 characters: ${ep008.title.length}`);
  check(C >= FACTS.animalLowS.value && C >= FACTS.leblancAwakeS.value, `"about ${C} seconds" is the top of the range, and LeBlanc's ${FACTS.leblancAwakeS.value} s fits it`);
  check(LEBLANC_KPA < FACTS.armstrongKPa.value, `saliva boils at his pressure: ${LEBLANC_KPA.toFixed(2)} kPa is below the ${FACTS.armstrongKPa.value} kPa limit`);
  check(Math.abs(FACTS.leblancAltM.value / 0.3048 - 120_000) < 1, `${FACTS.leblancAltM.value} m is 120,000 ft`);
  check(Math.abs(SWELL_LINEAR ** 3 - FACTS.swellVolume.value) < 1e-9, `drawn ${SWELL_LINEAR.toFixed(3)}x across = ${FACTS.swellVolume.value}x the volume`);
  check(FACTS.leblancRefillS.value < FACTS.recoveryS.value, `his ${FACTS.leblancRefillS.value} s falls inside the "about ${FACTS.recoveryS.value} seconds" window`);
  check(Math.abs(secondsAt(BLACK_T) - C) < 1e-9, `"Second ${C}" lands on the blackout line`);
  check(leblancAt(END_T) === FACTS.leblancRefillS.value, `his counter ends on ${FACTS.leblancRefillS.value} s`);
  check(yearWords === "nineteen sixty six", `spoken year: ${yearWords}`);
  // both clocks only climb
  for (const [name, f, a, b] of [["seconds", secondsAt, 0, REAL_T], ["his seconds", leblancAt, HOSE_T, END_T]] as const) {
    let last = -1;
    let rising = true;
    for (let t = a; t <= b; t += 0.01) {
      if (f(t) <= last) rising = false;
      last = f(t);
    }
    check(rising, `${name} only climb`);
  }
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep008.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  console.log(`script: ${words} words`);
  if (!ok) process.exit(1);
}
