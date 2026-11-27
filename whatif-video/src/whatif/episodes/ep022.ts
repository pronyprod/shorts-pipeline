// Episode 22 (PomProds Story S1, style D): "She fell 3 km and walked home" - Juliane Koepcke, LANSA Flight 508, 24 Dec 1971.
// Six beats: paradox hook | who and what is at stake | setback | the choice | plain explanation | ironic payoff, then the CTA.
// Every number comes from FACTS (sourced). Run `node src/whatif/episodes/ep022.ts` to check.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  age: { value: 17, note: "Juliane Koepcke was born 10 Oct 1954, so she was 17 on 24 Dec 1971.", source: "Wikipedia, Juliane Koepcke (born 10 October 1954; crash 24 December 1971)" },
  fallM: { value: 3000, note: "She fell about 3 km (3,000 m / 10,000 ft). The voice says 'about three kilometres'. APPROXIMATE.", source: "Wikipedia, Juliane Koepcke ('3,000 m (10,000 ft)'); Wikipedia, LANSA Flight 508 ('about 3 km')" },
  year: { value: 1971, note: "Crash of LANSA Flight 508 over the Peruvian rainforest, 24 December 1971.", source: "Wikipedia, Juliane Koepcke; Wikipedia, LANSA Flight 508" },
  strapped: { value: 1, note: "She fell still strapped into her row of seats and was the only survivor of the 92 people aboard (voice only says she woke up alone).", source: "Wikipedia, LANSA Flight 508; Koepcke, 'When I Fell From the Sky' (2011)" },
  injuries: { value: 1, note: "Broken collarbone, torn knee ligament, deep cut on her arm, concussion. The voice says 'a broken collarbone and a hurt knee'.", source: "Wikipedia, Juliane Koepcke; Wikipedia, LANSA Flight 508" },
  fatherRule: { value: 1, note: "Her father taught her: if lost in the jungle, find water and follow it downstream, because it leads to bigger water and people. Wording varies between retellings; the core rule is consistent.", source: "Koepcke, 'When I Fell From the Sky' (2011), as reported by Irish Times, Explorersweb and Amusing Planet retellings of her memoir" },
  days: { value: 11, note: "She spent 11 days in the rainforest, following a stream to a river.", source: "Wikipedia, Juliane Koepcke ('11 days'); Wikipedia, LANSA Flight 508" },
  rescue: { value: 1, note: "She found a hut of local woodcutters/hunters; they took her by canoe to a more populated place, from where she was flown to hospital.", source: "Wikipedia, Juliane Koepcke; Wikipedia, LANSA Flight 508 ('By following a stream... hut of local hunters and woodcutters')" },
  panguana: { value: 1, note: "Her parents founded the Panguana research station in the Peruvian Amazon; she became its director in 2000 and is a bat biologist (mammalogist). APPROXIMATE: 'the same rainforest' = the Peruvian Amazon forest.", source: "Wikipedia, Juliane Koepcke; Panguana Foundation (panguana.de)" },
  stream: { value: 1, note: "Everyday comparison: streams join into rivers like small drains feeding a bigger street drain. Explanatory image, not a measurement.", source: "Explanatory comparison; river-network principle (Wikipedia, Stream order / Drainage basin)" },
} as const;

const END_T = 8;
export const DAYS_T = 4;
export const FALL_T = 2;
export const days = FACTS.days.value;
const km = FACTS.fallM.value / 1000;

export const fallAt = (t: number) => Math.min(km, (t / FALL_T) * km); // km fallen, 0 -> 3
export const dayAt = (t: number) => Math.max(1, Math.min(days, 1 + ((t - DAYS_T) / 2) * (days - 1))); // day 1 -> 11 over lines 4-5

export const ep022: Episode = {
  id: "ep022",
  template: 3,
  title: "She fell 3 km and walked home",
  counterLabel: "Fallen",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < DAYS_T ? "DEC 24, 1971" : t < 7 ? `DAY ${Math.round(dayAt(t))}` : "TRUE STORY"),
  counterAt: (t) => {
    if (t < 3) return { label: "Fallen", text: { value: fallAt(t).toFixed(1), unit: "km" } };
    if (t < 7) return { label: "Days alone", text: { value: String(Math.round(dayAt(t))), unit: "" } };
    return { label: "Survived", text: { value: String(days), unit: "days" } };
  },
  rungs: [
    { t: 0.05, label: "17 years old", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: "Peru, 1971", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Broken collarbone", icon: "drop", size: 1, relation: "about" },
    { t: 4, label: "Follow the water", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "Streams join rivers", icon: "drop", size: 1, relation: "about" },
    { t: 6, label: "Woodcutters, canoe", icon: "drop", size: 1, relation: "about" },
    { t: 7, label: "Biologist, same forest", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "A seventeen year old fell three kilometres out of the sky, and walked away.", text: "A 17 year old fell 3 kilometres out of the sky, and walked away.", keys: ["fell 3 kilometres", "walked away"], pause: 0.3 },
    { t: 1, to: FALL_T, say: "In nineteen seventy one, she was flying over Peru when her plane broke apart. She fell, still strapped to her seat.", text: "In 1971, she was flying over Peru when her plane broke apart. She fell, still strapped to her seat.", keys: ["1971", "strapped to her seat"], pause: 0.3 },
    { t: FALL_T, to: 3, say: "She woke up alone in the rainforest, with a broken collarbone and a hurt knee.", text: "She woke up alone in the rainforest, with a broken collarbone and a hurt knee.", keys: ["alone", "broken collarbone"], pause: 0.3 },
    { t: 3, to: DAYS_T, say: "Then she remembered her father's rule: find water, and follow it downhill.", text: "Then she remembered her father's rule: find water, and follow it downhill.", keys: ["father's rule", "follow it downhill"], beat: "climax", pause: 0.3 },
    { t: DAYS_T, to: 5, say: "Small streams join bigger ones, like drains feeding a street. And rivers lead to people.", text: "Small streams join bigger ones, like drains feeding a street. And rivers lead to people.", keys: ["bigger ones", "rivers lead to people"], pause: 0.3 },
    { t: 5, to: 6, say: "After eleven days, woodcutters found her and took her out by canoe.", text: `After ${days} days, woodcutters found her and took her out by canoe.`, keys: [`${days} days`, "canoe"], pause: 0.3 },
    { t: 6, to: 7, say: "Her parents ran a research station in that forest, and she grew up learning its rules.", text: "Her parents ran a research station in that forest, and she grew up learning its rules.", keys: ["research station", "its rules"], beat: "twist", pause: 0.3 },
    { t: 7, to: END_T, say: "Today, she is a biologist, and she runs that station herself.", text: "Today, she is a biologist, and she runs that station herself.", keys: ["biologist", "runs that station"], beat: "twist", pause: 0.35 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep022.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep022.title.length < 60, `title length ${ep022.title.length}`);
  check(FACTS.age.value === 17, `age 17`);
  check(FACTS.fallM.value / 1000 === 3, `fall ${FACTS.fallM.value} m = 3 km`);
  check(numberWords(days) === "eleven", `spoken days: ${numberWords(days)}`);
  check(Math.round(dayAt(DAYS_T + 2)) === days && Math.round(dayAt(DAYS_T)) === 1, "day counter 1 -> 11");
  check(fallAt(FALL_T) === km, "fall counter ends on 3.0 km");
  for (const l of ep022.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  const wc = ep022.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(wc >= 90 && wc <= 135, `script: ${wc} words`);
  check(!ep022.lines.some((l) => /you see/i.test(l.say)), 'no "You see"');
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  if (!ok) process.exit(1);
}
