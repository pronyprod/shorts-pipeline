// Episode 14 (Round 3 #26, category: Body limit): "What if you stayed awake for 30 days?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep014.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  gardnerHours: { value: 264, note: "Randy Gardner, a 17-year-old San Diego student, stayed awake 264.4 hours (11 days 25 minutes) from December 1963 to January 1964. The voice says 'hour two hundred sixty four' and 'eleven days'.", source: "Wikipedia, 'Randy Gardner sleep deprivation experiment'; Guinness World Records, 'What's the limit to how long a human can stay awake?' (Jan 2023: 264 hours, 11 days)" },
  recoveryHours: { value: 14.77, note: "After the 264 hours Gardner slept 14 hours 46 minutes (14.77 h). The voice says 'almost fifteen hours'. Another source gives 14 h 40 min; either way it is almost 15.", source: "Wikipedia, 'Randy Gardner sleep deprivation experiment'" },
  symptoms: { value: 1, note: "During the attempt observers reported moodiness, trouble concentrating, short-term memory problems, paranoia and hallucinations. The day the hallucinations began is not stated, so the script gives no day for them. Dement said staying awake did not cause psychiatric problems; the voice does not claim otherwise.", source: "Wikipedia, 'Randy Gardner sleep deprivation experiment' (reports of Lt. Cmdr. John J. Ross); Guinness World Records (2023)" },
  microsleeps: { value: 1, note: "Microsleeps are momentary lapses into sleep lasting a few seconds, impossible to monitor without continuous physiological recording; Dement later accepted that Gardner probably had them. The voice says 'your brain naps for seconds, and you never notice'.", source: "Guinness World Records, 'What's the limit to how long a human can stay awake?' (Jan 2023)" },
  guinnessStop: { value: 1997, note: "Guinness stopped monitoring the stay-awake record because of the dangers of sleep deprivation and because past attempts can't be measured accurately (microsleeps). The voice says it 'won't track it' because it's 'too risky' and 'microsleeps hide the truth'.", source: "Guinness World Records, 'What's the limit to how long a human can stay awake? And why we don't monitor the record' (Jan 2023)" },
  ramp: { value: 1, note: "UNCERTAIN / STORY RAMP: the hour counts shown at lines 1-3 (24, 72, 168) are illustrative steps on the way to the real 264 h; only 264 h (line 4 and after) is a sourced figure.", source: "Our own story ramp; 264 h from the Gardner sources above" },
} as const;

// ---- the numbers ----
export const GARDNER_H = FACTS.gardnerHours.value;
export const GARDNER_DAYS = Math.floor(GARDNER_H / 24); // 11
export const GOAL_DAYS = 30;
export const GOAL_H = GOAL_DAYS * 24;
export const RECOVERY_H = FACTS.recoveryHours.value;

const lerpKeys = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return keys[keys.length - 1][1];
};

// Story steps (one per line): 0 hook | 1 hour 24 | 2 memory + hallucinations | 3 microsleeps | 4 hour 264 (climax) |
// 5 Gardner (twist) | 6 his recovery | 7 Guinness stopped | 8 CTA.
const END_T = 8;
export const CLIMAX_T = 4;
export const TWIST_T = 5;
export const hoursAt = (t: number) => lerpKeys(t, [[0, 0], [1, 24], [2, 72], [3, 168], [CLIMAX_T, GARDNER_H]]);

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const H_WORDS = numberWords(GARDNER_H);
const DAYS_WORDS = numberWords(GARDNER_DAYS);

export const ep014: Episode = {
  id: "ep014",
  template: 3,
  title: "What if you stayed awake for 30 days?",
  counterLabel: "Awake",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < TWIST_T ? `HOUR ${Math.max(1, Math.floor(hoursAt(t)))}` : "REAL STORY, 1964"),
  counterAt: (t) => ({ text: { value: fmt(t < TWIST_T ? hoursAt(t) : GARDNER_H), unit: "hours" } }),
  rungs: [
    { t: 0.05, label: `Goal: ${GOAL_DAYS} days, ${fmt(GOAL_H)} hours`, icon: "drop", size: 1, relation: "about" },
    { t: 1, label: "1 day without sleep", icon: "drop", size: 1, relation: "about" },
    { t: 2, label: "Memory slips, things appear", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Microsleeps of a few seconds", icon: "drop", size: 1, relation: "about" },
    { t: CLIMAX_T, label: `${GARDNER_DAYS} days awake`, icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: "Randy Gardner, 1964", icon: "drop", size: 1, relation: "about" },
    { t: 6, label: "Then he slept almost 15 hours", icon: "drop", size: 1, relation: "about" },
    { t: 7, label: "Guinness stopped tracking it", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "Thirty days. No sleep. Your brain will not allow it.", text: "30 days. No sleep. Your brain will not allow it.", keys: ["30 days", "No sleep"] },
    { t: 1, to: 2, say: "Hour twenty four. Your eyes burn. Your focus slips.", text: "Hour 24. Your eyes burn. Your focus slips.", keys: ["Hour 24", "focus slips"], pause: 0.3 },
    { t: 2, to: 3, say: "Your memory fails. Soon you see things that aren't there.", text: "Your memory fails. Soon you see things that aren't there.", keys: ["memory fails", "things that aren't there"], pause: 0.3 },
    { t: 3, to: CLIMAX_T, say: "Then microsleeps hit. Your brain naps for seconds, and you never notice.", text: "Then microsleeps hit. Your brain naps for seconds, and you never notice.", keys: ["microsleeps", "never notice"], pause: 0.3 },
    { t: CLIMAX_T, to: TWIST_T, say: `Hour ${H_WORDS}. ${DAYS_WORDS} days. Your brain is running on fumes.`, text: `Hour ${GARDNER_H}. ${GARDNER_DAYS} days. Your brain is running on fumes.`, keys: [`Hour ${GARDNER_H}`, `${GARDNER_DAYS} days`], beat: "climax", pause: 0.35 },
    { t: TWIST_T, to: 6, say: "That actually happened. In nineteen sixty four, student Randy Gardner stayed awake that long.", text: "That actually happened. In 1964, student Randy Gardner stayed awake that long.", keys: ["Randy Gardner", "1964"], beat: "twist", pause: 0.45 },
    { t: 6, to: 7, say: "Then he slept almost fifteen hours straight.", text: "Then he slept almost 15 hours straight.", keys: ["almost 15 hours"], beat: "twist", pause: 0.3 },
    { t: 7, to: END_T, say: "Today, Guinness won't track it. It's too risky, and microsleeps hide the truth.", text: "Today, Guinness won't track it. It's too risky, and microsleeps hide the truth.", keys: ["too risky", "hide the truth"], beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep014.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep014.title.length < 50, `title under 50 characters: ${ep014.title.length}`);
  check(GARDNER_H === 264 && H_WORDS === "two hundred sixty four", `264 h = "${H_WORDS}"`);
  check(GARDNER_DAYS === 11 && DAYS_WORDS === "eleven" && GARDNER_H / 24 === 11, `264 h = ${GARDNER_H / 24} days = "${DAYS_WORDS}"`);
  check(RECOVERY_H < 15 && RECOVERY_H > 14.5, `"almost fifteen hours": ${RECOVERY_H} h (14 h 46 min)`);
  check(GOAL_H === 720, `30 days = ${GOAL_H} hours, more than Gardner's ${GARDNER_H}`);
  check(Math.round(hoursAt(1)) === 24 && hoursAt(CLIMAX_T) === GARDNER_H, "counter shows the spoken hour at each line start");
  let last = -Infinity;
  let rising = true;
  for (let t = 0.01; t <= CLIMAX_T; t += 0.01) {
    if (hoursAt(t) <= last) rising = false;
    last = hoursAt(t);
  }
  check(rising, "hours only climb");
  for (const l of ep014.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep014.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
