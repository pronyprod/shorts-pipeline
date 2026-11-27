// Episode 23 (PomProds Round 3 #30, Food/drink, style P): "What if you ate 100 Carolina Reapers?"
// Hook | heat number | 100 of them | the twist (nothing is burning) | TRPV1 | false alarm | Nobel | "don't" | CTA.
// Every number comes from FACTS (sourced). Run `node src/whatif/episodes/ep023.ts` to check.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  reaperShu: { value: 1641183, note: "Carolina Reaper average 1,641,183 Scoville heat units (Winthrop University test, Guinness record 2013). The voice says 'about one point six million'. It lost the Guinness record to Pepper X (2.69M SHU) in Oct 2023; the voice does not claim it is the hottest.", source: "Guinness World Records / CNN 17 Oct 2023 ('Reaper average 1.64 million SHU'); Winthrop University testing" },
  jalapenoMaxShu: { value: 8000, note: "Jalapeno is roughly 2,500-8,000 SHU (sources differ slightly: 2,000-8,000 or 3,000-8,000). Using the top of the range, 1,641,183 / 8,000 = 205, so 'over two hundred times hotter' is true for every range.", source: "CNN 17 Oct 2023 citing Guinness (3,000-8,000 SHU); common spice references (2,500-8,000)" },
  count: { value: 100, note: "The premise: 100 peppers. Counter only; no total heat is added up (SHU is a concentration, not a sum).", source: "Premise (bank #30)" },
  bodyEffects: { value: 1, note: "Large doses of capsaicin cause sweating, tears and stomach upset (qualitative only; no number on screen).", source: "Wikipedia, Capsaicin (Adverse effects); capsaicin safety reviews" },
  trpv1: { value: 43, note: "The nerve sensor TRPV1 is switched on by capsaicin and by painful heat above about 43 degrees Celsius. APPROXIMATE (some sources say 43-45).", source: "UCSF news 2021 (>110 F, about 43 C); Frontiers for Young Minds 2024 (above 43 C); Nobel Prize press release 2021" },
  nothingBurns: { value: 1, note: "Capsaicin fools the heat sensor; the temperature of the mouth does not rise. The voice says nothing is 'actually burning' meaning no real heat, a false alarm.", source: "Nobel Prize press release 2021 (capsaicin used to identify the heat sensor); UCSF news 2021" },
  nobelYear: { value: 2021, note: "David Julius (with Ardem Patapoutian) won the 2021 Nobel Prize in Physiology or Medicine for receptors for temperature and touch; Julius found the capsaicin/heat sensor, later named TRPV1.", source: "nobelprize.org, Press release 2021 (Physiology or Medicine)" },
} as const;

const END_T = 9;
export const peppersAt = (t: number) => Math.round(Math.min(100, t < 2 ? 1 : t < 3 ? 1 + (t - 2) * 99 : 100));

export const ep023: Episode = {
  id: "ep023",
  template: 3,
  title: "What if you ate 100 Carolina Reapers?",
  counterLabel: "Peppers",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < 4 ? "DON'T TRY THIS" : t < 8 ? "THE SCIENCE" : "ALARM, NOT FIRE"),
  counterAt: (t) => {
    if (t < 4) return { label: "Peppers", text: { value: String(peppersAt(t)), unit: "" } };
    if (t < 6) return { label: "Alarm switches on at", text: { value: String(FACTS.trpv1.value), unit: "°C" } };
    return { label: "Actual flames", text: { value: "0", unit: "" } };
  },
  rungs: [
    { t: 0.05, label: "One Reaper", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: "About 1.6 million Scoville", icon: "drop", size: 1, relation: "about" },
    { t: 2, label: "100 peppers", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Nothing is burning", icon: "drop", size: 1, relation: "about" },
    { t: 4, label: "Heat sensor TRPV1", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "False alarm", icon: "drop", size: 1, relation: "about" },
    { t: 6, label: "Nobel Prize 2021", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "You put one Carolina Reaper in your mouth, and it screams FIRE.", text: "You put one Carolina Reaper in your mouth, and it screams FIRE.", keys: ["Carolina Reaper", "FIRE"], pause: 0.3 },
    { t: 1, to: 2, say: "It rates about one point six million Scoville units, over two hundred times hotter than a jalapeño.", text: "It rates about 1.6 million Scoville units, over 200 times hotter than a jalapeño.", keys: ["1.6 million", "over 200 times"], pause: 0.3 },
    { t: 2, to: 3, say: "Now picture one hundred of them. Sweating, crying, a stomach in knots.", text: "Now picture 100 of them. Sweating, crying, a stomach in knots.", keys: ["100 of them", "stomach in knots"], pause: 0.3 },
    { t: 3, to: 4, say: "But here is the strange part. Nothing in your mouth is actually burning.", text: "But here is the strange part. Nothing in your mouth is actually burning.", keys: ["strange part", "actually burning"], beat: "climax", pause: 0.3 },
    { t: 4, to: 5, say: "The chemical, capsaicin, switches on a nerve sensor that warns you about heat above forty three degrees Celsius.", text: "The chemical, capsaicin, switches on a nerve sensor that warns you about heat above 43 degrees Celsius.", keys: ["capsaicin", "43 degrees Celsius"], pause: 0.3 },
    { t: 5, to: 6, say: "Your brain gets a false alarm, and feels fire that is not there.", text: "Your brain gets a false alarm, and feels fire that is not there.", keys: ["false alarm", "not there"], beat: "twist", pause: 0.3 },
    { t: 6, to: 7, say: "The scientist who found that sensor won a Nobel Prize in twenty twenty one.", text: "The scientist who found that sensor won a Nobel Prize in 2021.", keys: ["Nobel Prize", "2021"], beat: "twist", pause: 0.3 },
    { t: 7, to: END_T, say: "So no, please do not try this at home.", text: "So no, please do not try this at home.", keys: ["do not try this"], pause: 0.35 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep023.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep023.title.length < 50, `title length ${ep023.title.length}`);
  const ratio = FACTS.reaperShu.value / FACTS.jalapenoMaxShu.value;
  check(ratio > 200, `Reaper / jalapeno top = ${ratio.toFixed(0)}x (> 200)`);
  check(Math.abs(FACTS.reaperShu.value / 1e6 - 1.6) < 0.05, "1.64M spoken as about 1.6 million");
  check(FACTS.nobelYear.value === 2021 && numberWords(20) === "twenty" && numberWords(21) === "twenty one", "spoken year: twenty twenty one");
  check(peppersAt(0) === 1 && peppersAt(3) === 100, "counter 1 -> 100");
  for (const l of ep023.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  const wc = ep023.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(wc >= 90 && wc <= 135, `script: ${wc} words`);
  check(!ep023.lines.some((l) => /you see/i.test(l.say)), 'no "You see"');
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  if (!ok) process.exit(1);
}
