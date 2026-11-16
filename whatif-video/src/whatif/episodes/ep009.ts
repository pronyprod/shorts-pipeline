// Episode 9 (Round 3, category: Absurd scale): "What if $1 trillion fell on your house?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep009.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  bills: { value: 1e12, note: "The premise: one trillion $1 bills.", source: "Premise (WHATIF_BANK.md Round 3 #22)" },
  billGrams: { value: 1, note: "A note weighs about one gram, whatever its denomination. APPROXIMATE ('about'); some sites give 0.98 g. The voice says 'about a gram' and 'one million tonnes' rests on it.", source: "US Bureau of Engraving and Printing FAQ (moneyfactory.com, archived)" },
  billWidthIn: { value: 2.61, note: "Width of a current US note.", source: "US Bureau of Engraving and Printing FAQ (moneyfactory.com, archived)" },
  billLengthIn: { value: 6.14, note: "Length of a current US note.", source: "US Bureau of Engraving and Printing FAQ (moneyfactory.com, archived)" },
  billThickIn: { value: 0.0043, note: "Thickness of a current US note.", source: "US Bureau of Engraving and Printing FAQ (moneyfactory.com, archived)" },
  cmPerIn: { value: 2.54, note: "Exact unit conversion.", source: "NIST Guide to the SI, Appendix B" },
  lbToKg: { value: 0.45359237, note: "Exact unit conversion.", source: "NIST Guide to the SI, Appendix B" },
  libertyLb: { value: 450_000, note: "Total weight of the Statue of Liberty (copper + steel), 225 short tons.", source: "National Park Service, Statue of Liberty: Statue Statistics" },
  eiffelT: { value: 10_100, note: "Total weight of the Eiffel Tower (7,300 t metal frame). The site says 'tons'; we treat it as tonnes, the larger reading, so 'heavier than' stays true either way.", source: "toureiffel.paris, Key figures" },
  esbTons: { value: 365_000, note: "Weight of the Empire State Building. UNCERTAIN unit (short or metric tons); we use the larger, metric reading, so 'heavier than two' holds either way.", source: "Empire State Building official fact sheet (esbnyc.com)" },
  esbFt3: { value: 37_000_000, note: "Volume of the Empire State Building.", source: "Empire State Building official fact sheet (esbnyc.com)" },
  gpsKm: { value: 20_200, note: "Orbital altitude of GPS satellites.", source: "GPS.gov, Space Segment" },
  realOnes: { value: 14.9e9, note: "$1 notes in circulation, end of 2024 (latest annual value). APPROXIMATE for today; the voice says 'about fifteen billion'.", source: "Federal Reserve Bank of St. Louis FRED, CURRVOL1 (Volume of Currency in Circulation: $1)" },
} as const;

// ---- the numbers ----
const IN3_TO_CM3 = FACTS.cmPerIn.value ** 3;
export const BILL_CM3 = FACTS.billWidthIn.value * FACTS.billLengthIn.value * FACTS.billThickIn.value * IN3_TO_CM3;
export const TOTAL_T = (FACTS.bills.value * FACTS.billGrams.value) / 1e6;
// packed tight with no air: an idealised lower bound on the pile's volume (APPROXIMATE)
export const PILE_M3 = (FACTS.bills.value * BILL_CM3) / 1e6;
export const ESB_M3 = FACTS.esbFt3.value * (0.3048 ** 3);
export const DEPTH_KM2_M = PILE_M3 / 1e6;
export const STACK_KM = (FACTS.bills.value * FACTS.billThickIn.value * FACTS.cmPerIn.value) / 1e5;
export const LIBERTY_T = Math.round((FACTS.libertyLb.value * FACTS.lbToKg.value) / 1000);
export const SHARE_PCT = (FACTS.realOnes.value / FACTS.bills.value) * 100;
export const TIMES_TOO_MANY = Math.round(FACTS.bills.value / FACTS.realOnes.value);
export const ELEVEN_K = 11_000;
export const CUBE_SIDE_M = Math.cbrt(PILE_M3);

const lerpKeys = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return keys[keys.length - 1][1];
};
// exponential between keys, so the climb looks like an avalanche
const expKeys = (t: number, keys: [number, number][]) => Math.exp(lerpKeys(t, keys.map(([a, v]) => [a, Math.log(v)])));

// Story steps (one per line): 0-1 the bills start falling | 1-2 one gram | 2-3 a Statue of Liberty |
// 3-4 the roof | 4-5 an Eiffel Tower | 5-6 the street | 6-7 one million tonnes | 7-8 volume |
// 8-9 a square kilometre | 9-10 the stack | 10-11 real bills | 11-12 share | 12-13 doesn't exist.
const END_T = 13;
export const LIBERTY_AT = 2.55;
export const EIFFEL_T = 4;
export const MILLION_T = 6;
export const VOLUME_T = 7;
export const DEPTH_T = 8;
export const STACK_T = 9;
export const REAL_T = 10;
export const SHARE_T = 11;
export const NONE_T = 12;

export const tonnesAt = (t: number) =>
  expKeys(t, [[0, 1e-6], [1, 0.002], [2, 0.08], [LIBERTY_AT, LIBERTY_T], [3, 700], [EIFFEL_T, ELEVEN_K], [5, 60_000], [MILLION_T, TOTAL_T]]);
export const volumeAt = (t: number) => lerpKeys(t, [[VOLUME_T, 0], [7.85, PILE_M3]]);
export const depthAt = (t: number) => lerpKeys(t, [[DEPTH_T, 0], [8.7, DEPTH_KM2_M]]);
export const stackAt = (t: number) => lerpKeys(t, [[STACK_T, 0], [9.85, STACK_KM]]);
export const realAt = (t: number) => lerpKeys(t, [[REAL_T, 0], [10.8, FACTS.realOnes.value]]);
export const shareAt = (t: number) => lerpKeys(t, [[SHARE_T, 0], [11.7, SHARE_PCT]]);
export const timesAt = (t: number) => lerpKeys(t, [[NONE_T, 1], [12.6, TIMES_TOO_MANY]]);

const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const massText = (tonnes: number) => {
  if (tonnes < 1) return { value: fmt(tonnes * 1000, tonnes < 0.01 ? 1 : 0), unit: "kg" };
  return { value: fmt(tonnes), unit: "t" };
};

const STACK_WORDS = `over a hundred thousand kilometres`;

export const ep009: Episode = {
  id: "ep009",
  template: 3,
  title: "What if $1 trillion fell on your house?",
  counterLabel: "Cash landed",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  stage: "cash",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => {
    if (t < MILLION_T) return "FALLING";
    if (t < REAL_T) return "ALL LANDED";
    return "REAL BILLS";
  },
  counterAt: (t) => {
    if (t < VOLUME_T) return { text: massText(tonnesAt(t)) };
    if (t < DEPTH_T) return { label: "Pile volume, packed", text: { value: fmt(volumeAt(t)), unit: "m³" } };
    if (t < STACK_T) return { label: "Depth over 1 km²", text: { value: fmt(depthAt(t), 2), unit: "m" } };
    if (t < REAL_T) return { label: "Stack height", text: { value: fmt(stackAt(t)), unit: "km" } };
    if (t < SHARE_T) return { label: "$1 bills that exist", text: { value: fmt(realAt(t) / 1e9, 1), unit: "billion" } };
    if (t < NONE_T) return { label: "Of your pile", text: { value: fmt(shareAt(t), 2), unit: "%" } };
    return { label: "Your pile vs reality", text: { value: `×${fmt(timesAt(t))}`, unit: "" } };
  },
  rungs: [
    { t: 0.1, label: "1 trillion $1 bills", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: "About 1 g each", icon: "drop", size: 1, relation: "about" },
    { t: LIBERTY_AT, label: "Statue of Liberty", icon: "drop", size: 1, relation: "about" },
    { t: 3.2, label: "Roof gives way", icon: "drop", size: 1, relation: "about" },
    { t: EIFFEL_T, label: "Heavier than the Eiffel Tower", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "Street buried", icon: "drop", size: 1, relation: "about" },
    { t: MILLION_T, label: "Over 2 Empire State Buildings", icon: "drop", size: 1, relation: "about" },
    { t: VOLUME_T, label: "Packed with no air", icon: "drop", size: 1, relation: "about" },
    { t: 7.85, label: "Bigger than the building", icon: "drop", size: 1, relation: "about" },
    { t: DEPTH_T, label: "Spread over 1 km²", icon: "drop", size: 1, relation: "about" },
    { t: 8.7, label: "Over a metre deep", icon: "drop", size: 1, relation: "about" },
    { t: STACK_T, label: "Stacked flat", icon: "drop", size: 1, relation: "about" },
    { t: 9.6, label: "Past GPS satellites", icon: "drop", size: 1, relation: "about" },
    { t: REAL_T, label: "In circulation, end of 2024", icon: "drop", size: 1, relation: "about" },
    { t: SHARE_T, label: "Real bills vs your pile", icon: "drop", size: 1, relation: "about" },
    { t: 11.7, label: "Less than 2%", icon: "drop", size: 1, relation: "about" },
    { t: NONE_T, label: "Your bills vs real ones", icon: "drop", size: 1, relation: "about" },
    { t: 12.6, label: "Doesn't exist", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "One trillion dollar bills are falling on your house. Right now.", text: "1 trillion dollar bills are falling on your house. Right now." },
    { t: 1, to: 2, say: "Each one weighs about a gram. Harmless, right?", text: "Each one weighs about a gram. Harmless, right?", pause: 0.25 },
    { t: 2, to: 3, say: "Wrong. Soon a Statue of Liberty's weight sits on your roof.", text: "Wrong. Soon a Statue of Liberty's weight sits on your roof.", pause: 0.25 },
    { t: 3, to: EIFFEL_T, say: "Your roof caves in. Then your walls.", text: "Your roof caves in. Then your walls.", pause: 0.25 },
    { t: EIFFEL_T, to: 5, say: `${numberWords(ELEVEN_K / 1000)} thousand tonnes. More than the whole Eiffel Tower.`.replace(/^./, (c) => c.toUpperCase()), text: `${fmt(ELEVEN_K)} tonnes. More than the whole Eiffel Tower.`, pause: 0.25 },
    { t: 5, to: MILLION_T, say: "Your whole street disappears. And it keeps falling.", text: "Your whole street disappears. And it keeps falling.", pause: 0.25 },
    { t: MILLION_T, to: VOLUME_T, say: "One million tonnes. Heavier than two Empire State Buildings.", text: "1 million tonnes. Heavier than two Empire State Buildings.", beat: "climax", pause: 0.3 },
    { t: VOLUME_T, to: DEPTH_T, say: "Packed tight, your cash is bigger than that whole building.", text: "Packed tight, your cash is bigger than that whole building.", pause: 0.25 },
    { t: DEPTH_T, to: STACK_T, say: "Spread over a square kilometre, it's still over a metre deep.", text: "Spread over a square kilometre, it's still over a metre deep.", pause: 0.25 },
    { t: STACK_T, to: REAL_T, say: `Stacked, it climbs ${STACK_WORDS}. Past every GPS satellite.`, text: `Stacked, it climbs ${STACK_WORDS}. Past every GPS satellite.`, pause: 0.25 },
    { t: REAL_T, to: SHARE_T, say: "Here's the twist. Every real dollar bill in circulation, about fifteen billion...", text: "Here's the twist. Every real dollar bill in circulation, about 15 billion...", beat: "twist", pause: 0.4 },
    { t: SHARE_T, to: NONE_T, say: "would cover less than two percent of your pile.", text: "would cover less than 2% of your pile.", beat: "twist", pause: 0.15 },
    { t: NONE_T, to: END_T, say: "Your trillion dollar bills don't even exist.", text: "Your trillion dollar bills don't even exist.", beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep009.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep009.title.length < 50, `title under 50 characters: ${ep009.title.length}`);
  check(Math.abs(TOTAL_T - 1e6) < 1e-6, `1 trillion x ${FACTS.billGrams.value} g = ${fmt(TOTAL_T)} t`);
  check(Math.abs(tonnesAt(LIBERTY_AT) - LIBERTY_T) < 1e-6, `counter shows the Statue of Liberty's ${LIBERTY_T} t when it's named`);
  check(ELEVEN_K > FACTS.eiffelT.value && Math.abs(tonnesAt(EIFFEL_T) - ELEVEN_K) < 1e-6, `${ELEVEN_K} t > Eiffel Tower ${FACTS.eiffelT.value} t`);
  check(TOTAL_T > 2 * FACTS.esbTons.value && TOTAL_T * 0.98 > 2 * FACTS.esbTons.value, `heavier than two Empire State Buildings: ${fmt(TOTAL_T)} > ${fmt(2 * FACTS.esbTons.value)} t (also at 0.98 g a bill)`);
  check(PILE_M3 > ESB_M3, `packed pile ${fmt(PILE_M3)} m³ > Empire State ${fmt(ESB_M3)} m³ (bill ${BILL_CM3.toFixed(3)} cm³)`);
  check(DEPTH_KM2_M > 1, `over a square kilometre: ${DEPTH_KM2_M.toFixed(2)} m deep`);
  check(STACK_KM > 100_000 && STACK_KM > FACTS.gpsKm.value, `stack ${fmt(STACK_KM)} km: over 100,000 km and past GPS at ${fmt(FACTS.gpsKm.value)} km`);
  check(Math.round(FACTS.realOnes.value / 1e9) === 15, `"about fifteen billion" = ${FACTS.realOnes.value / 1e9} billion`);
  check(SHARE_PCT < 2, `less than 2%: ${SHARE_PCT.toFixed(2)}%`);
  check(Math.abs(stackAt(9.6) - STACK_KM * 0.6 / 0.85) < 1 && stackAt(9.6) > FACTS.gpsKm.value, `the "past GPS" rung shows after the stack passes ${FACTS.gpsKm.value} km`);
  check(volumeAt(7.85) > ESB_M3, `"bigger than the building" rung shows at full volume`);
  console.log(`cube side ${CUBE_SIDE_M.toFixed(1)} m; ${TIMES_TOO_MANY}x more bills than exist`);
  // counters only climb inside each segment
  for (const [name, f, a, b] of [["tonnes", tonnesAt, 0, MILLION_T], ["volume", volumeAt, VOLUME_T, 7.85], ["depth", depthAt, DEPTH_T, 8.7], ["stack", stackAt, STACK_T, 9.85], ["real", realAt, REAL_T, 10.8], ["share", shareAt, SHARE_T, 11.7], ["times", timesAt, NONE_T, 12.6]] as const) {
    let last = -1;
    let rising = true;
    for (let t = a; t <= b; t += 0.01) {
      if (f(t) <= last) rising = false;
      last = f(t);
    }
    check(rising, `${name} only climbs`);
  }
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep009.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  console.log(`script: ${words} words`);
  if (!ok) process.exit(1);
}
