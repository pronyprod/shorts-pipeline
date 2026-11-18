// Episode 16 (Round 3 #28, category: Real survivor): "What if lightning hit you 7 times?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep016.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  voltsMillion: { value: 300, note: "A typical lightning flash is about 300 million volts and about 30,000 amps (the real range is wider: 100 million to 1 billion volts).", source: "US National Weather Service, 'Lightning Power' (weather.gov/safety/lightning-power): 'A typical lightning flash is about 300 million Volts and about 30,000 Amps.'" },
  strikes: { value: 7, note: "Park ranger Roy C. Sullivan, Shenandoah National Park, Virginia, was struck by lightning seven times and survived every one: the Guinness record for most lightning strikes survived.", source: "Guinness World Records, 'Incredible story of man who survived being struck by lightning SEVEN times' (Jan 2023); Wikipedia, 'Roy Sullivan'" },
  firstYear: { value: 1942, note: "First strike: April 1942, right leg, while fleeing a watchtower set ablaze by lightning.", source: "Guinness World Records (Jan 2023)" },
  lastYear: { value: 1977, note: "Seventh strike: June 1977, on a fishing trip (chest and stomach burned).", source: "Guinness World Records (Jan 2023)" },
  truck: { value: 1969, note: "Strike 2: July 1969, driving his truck; knocked out, eyebrows burned, wristwatch destroyed.", source: "Guinness World Records (Jan 2023)" },
  garden: { value: 1970, note: "Strike 3: July 1970, in his garden, left shoulder seared.", source: "Guinness World Records (Jan 2023)" },
  hair1: { value: 1972, note: "Strike 4: April 1972, in a guardhouse at work; his hair caught fire.", source: "Guinness World Records (Jan 2023)" },
  hair2: { value: 1973, note: "Strike 5: August 1973, in his vehicle; his hair caught fire again.", source: "Guinness World Records (Jan 2023)" },
  walk: { value: 1976, note: "Strike 6: June 1976, during a walk; ankle injured, hair burned again.", source: "Guinness World Records (Jan 2023)" },
  neverAgain: { value: 71, note: "Never struck again; he died in 1983 at age 71.", source: "Guinness World Records (Jan 2023)" },
  caveat: { value: 1, note: "UNCERTAIN in detail: Wikipedia notes the park superintendent who documented the strikes was not present at them, and Sullivan said an earlier strike may have been first. The script only says what Guinness records: seven strikes survived, 1942 to 1977.", source: "Wikipedia, 'Roy Sullivan'; Guinness World Records (Jan 2023)" },
} as const;

const END_T = 10;
export const CLIMAX_T = 6;
export const TWIST_T = 7;
// strikes counter: one per line, lines 0-4 = strikes 1-5, line 5 = strikes 6 then 7
export const strikesAt = (t: number) => (t < 5 ? Math.floor(t) + 1 : t < 5.5 ? 6 : 7);

const y = (n: number) => `${numberWords(Math.floor(n / 100))} ${numberWords(n % 100)}`;
export const firstWords = y(FACTS.firstYear.value);
export const lastWords = y(FACTS.lastYear.value);

export const ep016: Episode = {
  id: "ep016",
  template: 3,
  title: "What if lightning hit you 7 times?",
  counterLabel: "Lightning strikes",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < TWIST_T ? `STRIKE ${strikesAt(t)}` : "REAL STORY"),
  counterAt: (t) => {
    if (t < TWIST_T) return { text: { value: String(strikesAt(t)), unit: "" } };
    return { label: "Roy Sullivan survived", text: { value: String(FACTS.strikes.value), unit: "strikes" } };
  },
  rungs: [
    { t: 0.05, label: `≈ ${FACTS.voltsMillion.value} million volts`, icon: "drop", size: 1, relation: "about" },
    { t: 1, label: `Strike 2: ${FACTS.truck.value}, in a truck`, icon: "drop", size: 1, relation: "about" },
    { t: 2, label: `Strike 3: ${FACTS.garden.value}, in a garden`, icon: "drop", size: 1, relation: "about" },
    { t: 3, label: `Strike 4: ${FACTS.hair1.value}, hair on fire`, icon: "drop", size: 1, relation: "about" },
    { t: 4, label: `Strike 5: ${FACTS.hair2.value}, hair on fire again`, icon: "drop", size: 1, relation: "about" },
    { t: 5, label: `Strike 6: ${FACTS.walk.value}, on a walk`, icon: "drop", size: 1, relation: "about" },
    { t: CLIMAX_T, label: "Seven strikes, still alive", icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: `Shenandoah, ${FACTS.firstYear.value} to ${FACTS.lastYear.value}`, icon: "drop", size: 1, relation: "about" },
    { t: 8, label: "Guinness World Records", icon: "drop", size: 1, relation: "about" },
    { t: 9, label: `Lived to ${FACTS.neverAgain.value}`, icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: `Lightning just hit you. That's about ${numberWords(FACTS.voltsMillion.value)} million volts.`, text: `Lightning just hit you. That's about ${FACTS.voltsMillion.value} million volts.`, keys: ["Lightning", "300 million volts"] },
    { t: 1, to: 2, say: "Strike two. It finds you in your truck and wrecks your watch.", text: "Strike two. It finds you in your truck and wrecks your watch.", keys: ["Strike two", "wrecks your watch"], pause: 0.3 },
    { t: 2, to: 3, say: "Strike three. It finds you in your garden.", text: "Strike three. It finds you in your garden.", keys: ["Strike three", "your garden"], pause: 0.3 },
    { t: 3, to: 4, say: "Strike four. It sets your hair on fire.", text: "Strike four. It sets your hair on fire.", keys: ["Strike four", "hair on fire"], pause: 0.3 },
    { t: 4, to: 5, say: "Strike five. Your hair catches fire again.", text: "Strike five. Your hair catches fire again.", keys: ["Strike five", "again"], pause: 0.3 },
    { t: 5, to: CLIMAX_T, say: "Strike six, on a walk. Strike seven, fishing.", text: "Strike six, on a walk. Strike seven, fishing.", keys: ["Strike six", "Strike seven"], pause: 0.3 },
    { t: CLIMAX_T, to: TWIST_T, say: "Seven strikes. You survive every single one.", text: "Seven strikes. You survive every single one.", keys: ["Seven strikes", "every single one"], beat: "climax", pause: 0.35 },
    { t: TWIST_T, to: 8, say: `This really happened. Park ranger Roy Sullivan, Virginia, ${firstWords} to ${lastWords}.`, text: `This really happened. Park ranger Roy Sullivan, Virginia, ${FACTS.firstYear.value} to ${FACTS.lastYear.value}.`, keys: ["really happened", "Roy Sullivan"], beat: "twist", pause: 0.45 },
    { t: 8, to: 9, say: "Guinness still lists him for the most lightning strikes survived.", text: "Guinness still lists him for the most lightning strikes survived.", keys: ["Guinness", "most lightning strikes survived"], beat: "twist", pause: 0.3 },
    { t: 9, to: END_T, say: `He lived to ${numberWords(FACTS.neverAgain.value)} and was never struck again.`, text: `He lived to ${FACTS.neverAgain.value} and was never struck again.`, keys: ["71", "never struck again"], beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep016.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep016.title.length < 50, `title under 50 characters: ${ep016.title.length}`);
  check(firstWords === "nineteen forty two" && lastWords === "nineteen seventy seven", `spoken years: ${firstWords} / ${lastWords}`);
  check(numberWords(71) === "seventy one", `spoken age: ${numberWords(71)}`);
  check(strikesAt(CLIMAX_T) === FACTS.strikes.value, `counter reaches ${strikesAt(CLIMAX_T)} = FACTS strikes`);
  const years = [FACTS.firstYear, FACTS.truck, FACTS.garden, FACTS.hair1, FACTS.hair2, FACTS.walk, FACTS.lastYear].map((f) => f.value);
  check(years.length === FACTS.strikes.value && years.every((v, i) => i === 0 || v > years[i - 1]), "seven strike years, in order");
  let last = 0;
  let rising = true;
  for (let t = 0; t <= CLIMAX_T; t += 0.01) { if (strikesAt(t) < last) rising = false; last = strikesAt(t); }
  check(rising, "strike counter only climbs");
  for (const l of ep016.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep016.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
