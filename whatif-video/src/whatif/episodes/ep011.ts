// Episode 11 (Round 3 #23, category: Food/drink): "What if you drank 100 coffees in one hour?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep011.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  mgPerCup: { value: 96, note: "Caffeine in one 8 oz (237 mL) cup of brewed coffee. APPROXIMATE: FDA gives 80-100 mg per 8 oz cup; real cups vary a lot.", source: "Mayo Clinic, 'Caffeine content for coffee, tea, soda and more' (brewed coffee, 8 oz: 96 mg); FDA, 'Spilling the Beans' (80-100 mg)" },
  cupMl: { value: 236.6, note: "One US cup = 8 US fluid ounces = 236.6 mL.", source: "NIST, US customary units (1 cup = 8 fl oz = 236.59 mL)" },
  dailyMg: { value: 400, note: "Amount the FDA says is not generally linked to dangerous effects in healthy adults per day. The voice calls it 'a whole day's safe amount'.", source: "FDA Consumer Update, 'Spilling the Beans: How Much Caffeine is Too Much?'" },
  toxicMg: { value: 1200, note: "FDA: toxic effects, like seizures, can be observed with rapid consumption of around 1,200 mg. The voice says 'it can turn toxic' (non-graphic).", source: "FDA Consumer Update, 'Spilling the Beans: How Much Caffeine is Too Much?' (also FDA Spanish version 'Al grano')" },
  effects: { value: 1, note: "Too much caffeine can cause insomnia, jitters, anxiousness, a fast heart rate and upset stomach.", source: "FDA Consumer Update, 'Spilling the Beans'; Mayo Clinic, 'Caffeine: How much is too much?'" },
  adenosine: { value: 1, note: "Caffeine keeps you alert by blocking adenosine receptors; adenosine is the sleep-pressure chemical that builds up while you're awake. The voice simplifies to 'your brain's tired signal'.", source: "Sleep Foundation, 'Caffeine and Sleep'" },
  kidneyLph: { value: 1, note: "Healthy kidneys can remove only about 0.8-1.0 L of water an hour. APPROXIMATE (National Academies 2005 range is about 0.7-1.0 L/h); the voice says 'about one'.", source: "Healthline, 'How Much Water Can Kill You?' (0.8-1.0 L/h); Wikipedia, Water intoxication" },
  pesticide: { value: 1984, note: "Caffeine and related methylxanthines stop insects feeding and kill them at concentrations found in plants: likely a natural pesticide (tobacco hornworms, milkweed bugs, mosquito larvae). The voice says plants make it 'to poison the insects that eat them' and calls coffee 'bug spray'.", source: "J. A. Nathanson, 'Caffeine and related methylxanthines: possible naturally occurring pesticides', Science 226:184-187 (12 Oct 1984), PMID 6207592" },
} as const;

// ---- the numbers ----
export const CUPS = 100;
export const MG_PER_CUP = FACTS.mgPerCup.value;
export const TOTAL_MG = CUPS * MG_PER_CUP;
export const TOTAL_L = (CUPS * FACTS.cupMl.value) / 1000;
export const DAILY_CUP = 5;
export const TOXIC_CUP = 13;

const lerpKeys = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return keys[keys.length - 1][1];
};

// Story steps (one per line): 0 hook | 1 cup one | 2 cup five | 3 heart | 4 cup thirteen | 5 cup 100 (climax) |
// 6 the water | 7-9 twist (plants, bug poison, bug spray) | 10 CTA.
const END_T = 10;
export const CLIMAX_T = 5;
export const WATER_T = 6;
export const TWIST_T = 7;
export const cupsAt = (t: number) => lerpKeys(t, [[0, 0.2], [1, 1], [2, DAILY_CUP], [3, 8], [4, TOXIC_CUP], [CLIMAX_T, CUPS]]);
export const mgAt = (t: number) => cupsAt(t) * MG_PER_CUP;
export const litresAt = (t: number) => lerpKeys(t, [[WATER_T, 0.2], [TWIST_T, TOTAL_L]]);

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const TOXIC_WORDS = `${numberWords(FACTS.toxicMg.value / 100)} hundred`; // "twelve hundred"
const TOTAL_WORDS = `${numberWords(Math.floor(TOTAL_MG / 1000))} thousand ${numberWords(TOTAL_MG % 1000)}`;
const LITRES_UP = Math.ceil(TOTAL_L); // "almost 24"

export const ep011: Episode = {
  id: "ep011",
  template: 3,
  title: "What if you drank 100 coffees in one hour?",
  counterLabel: "Caffeine",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < WATER_T ? `CUP ${Math.max(1, Math.floor(cupsAt(t)))}` : t < TWIST_T ? "CUP 100" : "REAL SCIENCE"),
  counterAt: (t) => {
    if (t < WATER_T) return { text: { value: fmt(mgAt(t)), unit: "mg" } };
    if (t < TWIST_T) return { label: "Water drunk", text: { value: litresAt(t).toFixed(1), unit: "L" } };
    return { label: "Caffeine", text: { value: fmt(TOTAL_MG), unit: "mg" } };
  },
  rungs: [
    { t: 0.05, label: `${CUPS} cups in 1 hour`, icon: "drop", size: 1, relation: "about" },
    { t: 1, label: `1 cup ≈ ${MG_PER_CUP} mg`, icon: "drop", size: 1, relation: "about" },
    { t: 2, label: `Past the FDA's ${FACTS.dailyMg.value} mg a day`, icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Heart racing, hands shaking", icon: "drop", size: 1, relation: "about" },
    { t: 4, label: `FDA: toxic near ${fmt(FACTS.toxicMg.value)} mg`, icon: "drop", size: 1, relation: "about" },
    { t: CLIMAX_T, label: `${Math.round(TOTAL_MG / FACTS.toxicMg.value)}x the toxic amount`, icon: "drop", size: 1, relation: "about" },
    { t: WATER_T, label: "Kidneys: about 1 L an hour", icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: "Made by plants", icon: "drop", size: 1, relation: "about" },
    { t: 8, label: "Bug poison (Science, 1984)", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "One hundred cups of coffee. One hour. You drink every one.", text: "100 cups of coffee. One hour. You drink every one.", keys: ["100 cups", "One hour"] },
    { t: 1, to: 2, say: "Cup one. Caffeine blocks your brain's tired signal.", text: "Cup 1. Caffeine blocks your brain's tired signal.", keys: ["tired signal"], pause: 0.3 },
    { t: 2, to: 3, say: "By cup five, you've passed a whole day's safe amount.", text: "By cup 5, you've passed a whole day's safe amount.", keys: ["cup 5", "whole day's"], pause: 0.3 },
    { t: 3, to: 4, say: "Your heart races. Your hands shake. Sleep is gone.", text: "Your heart races. Your hands shake. Sleep is gone.", keys: ["heart races", "hands shake", "Sleep is gone"], pause: 0.3 },
    { t: 4, to: CLIMAX_T, say: `Cup thirteen. Over ${TOXIC_WORDS} milligrams. Now it can turn toxic.`, text: `Cup 13. Over ${fmt(FACTS.toxicMg.value)} milligrams. Now it can turn toxic.`, keys: ["1,200 milligrams", "toxic"], pause: 0.3 },
    { t: CLIMAX_T, to: WATER_T, say: `Cup one hundred. ${TOTAL_WORDS} milligrams. Your body gives up way before this.`, text: `Cup 100. ${fmt(TOTAL_MG)} milligrams. Your body gives up way before this.`, keys: ["Cup 100", "9,600 milligrams", "gives up"], beat: "climax", pause: 0.35 },
    { t: WATER_T, to: TWIST_T, say: `It's also almost ${numberWords(LITRES_UP)} litres of water. Your kidneys clear about one an hour.`, text: `It's also almost ${LITRES_UP} litres of water. Your kidneys clear about one an hour.`, keys: ["24 litres", "one an hour"], pause: 0.3 },
    { t: TWIST_T, to: 8, say: "Here's the twist. Coffee plants don't make caffeine for you.", text: "Here's the twist. Coffee plants don't make caffeine for you.", keys: ["the twist", "for you"], beat: "twist", pause: 0.45 },
    { t: 8, to: 9, say: "They make it to poison the insects that eat them.", text: "They make it to poison the insects that eat them.", keys: ["poison"], beat: "twist", pause: 0.3 },
    { t: 9, to: END_T, say: "Your morning coffee is bug spray. You just get a tiny dose.", text: "Your morning coffee is bug spray. You just get a tiny dose.", keys: ["bug spray", "tiny dose"], beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep011.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep011.title.length < 50, `title under 50 characters: ${ep011.title.length}`);
  check(DAILY_CUP * MG_PER_CUP > FACTS.dailyMg.value && (DAILY_CUP - 1) * MG_PER_CUP < FACTS.dailyMg.value, `cup ${DAILY_CUP} is the first past ${FACTS.dailyMg.value} mg: ${DAILY_CUP * MG_PER_CUP} mg`);
  check(TOXIC_CUP * MG_PER_CUP > FACTS.toxicMg.value && (TOXIC_CUP - 1) * MG_PER_CUP < FACTS.toxicMg.value, `cup ${TOXIC_CUP} is the first over ${FACTS.toxicMg.value} mg: ${TOXIC_CUP * MG_PER_CUP} mg`);
  check(TOTAL_MG === 9600 && TOTAL_WORDS === "nine thousand six hundred", `100 cups = ${TOTAL_MG} mg = "${TOTAL_WORDS}"`);
  check(TOXIC_WORDS === "twelve hundred", `spoken toxic amount: ${TOXIC_WORDS}`);
  check(TOTAL_L < LITRES_UP && TOTAL_L > LITRES_UP - 0.5, `"almost ${LITRES_UP} litres": ${TOTAL_L.toFixed(2)} L`);
  check(TOTAL_L / FACTS.kidneyLph.value > 20, `water is over 20x what kidneys clear in that hour: ${(TOTAL_L / FACTS.kidneyLph.value).toFixed(1)}x`);
  check(Math.round(cupsAt(1)) === 1 && Math.round(cupsAt(2)) === DAILY_CUP && Math.round(cupsAt(4)) === TOXIC_CUP && cupsAt(CLIMAX_T) === CUPS, "counter shows the spoken cup at each line start");
  for (const [name, f, a, b] of [["caffeine", mgAt, 0, CLIMAX_T], ["water", litresAt, WATER_T, TWIST_T]] as const) {
    let last = -Infinity;
    let rising = true;
    for (let t = a + 0.01; t <= b; t += 0.01) {
      if (f(t) <= last) rising = false;
      last = f(t);
    }
    check(rising, `${name} only climbs`);
  }
  for (const l of ep011.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep011.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
