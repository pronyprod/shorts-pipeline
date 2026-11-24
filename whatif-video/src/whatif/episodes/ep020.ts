// Episode 20 (TIMELY slot; Round 3 style, category: Absurd scale): "What if you sent Voyager 1 a message?"
// Timely news: on 18 Nov 2026 (10:16 UTC) NASA's Voyager 1 reached one light-day from Earth (NASA, 12 Nov 2026; EarthSky, 18 Nov 2026).
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep020.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  lightSpeed: { value: 299792.458, note: "Speed of light in vacuum, km/s (exact by definition).", source: "SI definition (BIPM); NIST CODATA" },
  au: { value: 149597870.7, note: "One astronomical unit in km (exact by IAU 2012 definition).", source: "IAU 2012 Resolution B2" },
  moonKm: { value: 384400, note: "Mean Earth-Moon distance, 384,400 km. Light takes about 1.28 s; the voice says 'just over a second'.", source: "NASA Moon Fact Sheet (mean distance 384,400 km)" },
  plutoAu: { value: 39, note: "Pluto's average distance from the Sun, about 39 AU. NASA says sunlight takes 5.5 hours to reach Pluto; the voice says 'about five and a half hours'. Radio from Earth travels the Earth-to-Pluto distance, which varies; the voice talks about the Sun-to-Pluto distance only as a size comparison, so the line says 'Pluto is about five and a half hours' away from the Sun: see self-test (computed 39 AU = 5.4 h, NASA 5.5 h).", source: "NASA Science, Pluto Facts ('on average, Pluto is 3.7 billion miles (5.9 billion kilometers) away from the Sun, or 39 AU ... it takes sunlight 5.5 hours')" },
  voyagerAu: { value: 173.14, note: "Voyager 1's distance at the one-light-day moment, 18 Nov 2026 10:16:07 UTC: 173.14 AU = about 25.9 billion km (16.1 billion miles).", source: "EarthSky, 'Voyager 1 will be 1 light-day from Earth' (18 Nov 2026); NASA, 'Voyager 1 reaches one light-day' (12 Nov 2026)" },
  lightDayDate: { value: 1, note: "Voyager 1 reached one light-day from Earth on 18 November 2026. TIMELY source dated 12 Nov 2026 (NASA SVS, 'How Far Away Is Voyager 1? One Light-Day, Explained') and 17-18 Nov 2026 (ABC7, EarthSky). Sources differed on the clock time zone; only the date is used.", source: "NASA Scientific Visualization Studio 15120 (12 Nov 2026); EarthSky (18 Nov 2026); ABC7 (17 Nov 2026)" },
  commandDay: { value: 24, note: "NASA: at one light-day a command from Earth takes 24 hours to reach Voyager 1, and its answer another 24 hours to return.", source: "NASA SVS 15120 (12 Nov 2026)" },
  launch: { value: 1977, note: "Voyager 1 launched 5 September 1977.", source: "EarthSky (18 Nov 2026); NASA JPL Voyager mission page" },
  stillSending: { value: 1, note: "Voyager 1 is still returning data from interstellar space (a 48-hour contact loss in Oct 2026 was regained).", source: "ABC7 (17 Nov 2026); NASA JPL" },
} as const;

// ---- the numbers ----
export const MOON_S = FACTS.moonKm.value / FACTS.lightSpeed.value; // 1.28 s
export const SUN_S = FACTS.au.value / FACTS.lightSpeed.value; // 499 s
export const PLUTO_S = FACTS.plutoAu.value * SUN_S; // ~5.4 h
export const DAY_S = 86_400;
export const VOYAGER_KM = FACTS.voyagerAu.value * FACTS.au.value; // ~25.9e9 km
export const LIGHT_DAY_KM = DAY_S * FACTS.lightSpeed.value; // 25.9e9 km
export const BILLION_KM = VOYAGER_KM / 1e9;
export const YEARS_FLYING = (Date.UTC(2026, 10, 18) - Date.UTC(1977, 8, 5)) / 86_400_000 / 365.25;

const lerpKeys = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return keys[keys.length - 1][1];
};

// Story steps (one per line): 0 hook | 1 Moon | 2 Sun, Pluto | 3 much farther | 4 a whole day (climax) |
// 5 the answer needs another day | 6 two days for one hello | 7 it really happened | 8 since 1977 | 9 distance | 10 CTA.
const END_T = 10;
export const ARRIVE_T = 5;
export const BACK_T = 6;
export const REAL_T = 7;
export const YEARS_T = 8;
export const DIST_T = 9;

// seconds the message has travelled
export const travelAt = (t: number) =>
  lerpKeys(t, [[0.05, 0.2], [1, 0.2], [2, MOON_S], [2.4, SUN_S], [2.55, SUN_S], [2.95, PLUTO_S], [4, 60_000], [ARRIVE_T, DAY_S], [BACK_T, 2 * DAY_S]]);
export const yearsAt = (t: number) => lerpKeys(t, [[YEARS_T, 0], [DIST_T, YEARS_FLYING]]);
export const distAt = (t: number) => lerpKeys(t, [[DIST_T, 0], [END_T, BILLION_KM]]);

const fmtTime = (s: number) => (s < 60 ? { value: s.toFixed(1), unit: "s" } : s < 3600 ? { value: String(Math.round(s / 60)), unit: "min" } : { value: (s / 3600).toFixed(1), unit: "h" });
const BILLION_WORDS = numberWords(Math.round(BILLION_KM));
const YEARS_WORDS = numberWords(Math.floor(YEARS_FLYING));

export const ep020: Episode = {
  id: "ep020",
  template: 3,
  title: "What if you sent Voyager 1 a message?",
  counterLabel: "Message travel time",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < REAL_T ? "RADIO MESSAGE" : "REAL NEWS"),
  counterAt: (t) => {
    if (t < REAL_T) return { text: fmtTime(travelAt(t)) };
    if (t < YEARS_T) return { label: "One way to Voyager 1", text: { value: "24.0", unit: "h" } };
    if (t < DIST_T) return { label: "Voyager 1 flying", text: { value: yearsAt(t).toFixed(1), unit: "yr" } };
    return { label: "Voyager 1 is", text: { value: distAt(t).toFixed(1), unit: "billion km" } };
  },
  rungs: [
    { t: 0.05, label: "Radio flies at light speed", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: `Moon: ${MOON_S.toFixed(1)} seconds`, icon: "drop", size: 1, relation: "about" },
    { t: 2, label: `Sun: ${(SUN_S / 60).toFixed(1)} minutes`, icon: "drop", size: 1, relation: "about" },
    { t: 2.9, label: "Pluto: about 5.5 hours", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Voyager 1 is farther still", icon: "drop", size: 1, relation: "about" },
    { t: ARRIVE_T - 0.5, label: "Message arrives: 24 hours", icon: "drop", size: 1, relation: "about" },
    { t: BACK_T, label: "Answer back: 48 hours", icon: "drop", size: 1, relation: "about" },
    { t: REAL_T, label: "18 Nov 2026: one light-day", icon: "drop", size: 1, relation: "about" },
    { t: YEARS_T, label: `Launched ${FACTS.launch.value}`, icon: "drop", size: 1, relation: "about" },
    { t: DIST_T, label: `${BILLION_KM.toFixed(1)} billion km`, icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "You send a radio message to Voyager 1, and the clock starts.", text: "You send a radio message to Voyager 1, and the clock starts.", keys: ["radio message", "Voyager 1"] },
    { t: 1, to: 2, say: "Radio flies at light speed. It reaches the Moon in just over a second.", text: "Radio flies at light speed. It reaches the Moon in just over a second.", keys: ["light speed", "just over a second"], pause: 0.25 },
    { t: 2, to: 3, say: "The Sun is eight minutes away. Pluto is about five and a half hours.", text: "The Sun is eight minutes away. Pluto is about five and a half hours.", keys: ["eight minutes", "five and a half hours"], pause: 0.25 },
    { t: 3, to: 4, say: "But you're not even close. Voyager 1 is far beyond that.", text: "But you're not even close. Voyager 1 is far beyond that.", keys: ["not even close", "far beyond"], pause: 0.25 },
    { t: 4, to: ARRIVE_T, say: "Your message needs a whole day to arrive.", text: "Your message needs a whole day to arrive.", keys: ["a whole day"], beat: "climax", pause: 0.3 },
    { t: ARRIVE_T, to: BACK_T, say: "Then the answer needs another whole day to return.", text: "Then the answer needs another whole day to return.", keys: ["another whole day"], pause: 0.25 },
    { t: BACK_T, to: REAL_T, say: "Two days of waiting, for one hello.", text: "Two days of waiting, for one hello.", keys: ["Two days", "one hello"], pause: 0.3 },
    { t: REAL_T, to: YEARS_T, say: "This is real. On November eighteenth, Voyager 1 passed one light-day from Earth.", text: "This is real. On November eighteenth, Voyager 1 passed one light-day from Earth.", keys: ["This is real", "one light-day"], beat: "twist", pause: 0.4 },
    { t: YEARS_T, to: DIST_T, say: `It left in nineteen seventy seven, and it has flown for over ${YEARS_WORDS} years.`, text: `It left in 1977, and it has flown for over ${Math.floor(YEARS_FLYING)} years.`, keys: ["1977", `${Math.floor(YEARS_FLYING)} years`], beat: "twist", pause: 0.25 },
    { t: DIST_T, to: END_T, say: `It is about ${BILLION_WORDS} billion kilometres away, and it still sends data home.`, text: `It is about ${Math.round(BILLION_KM)} billion kilometres away, and it still sends data home.`, keys: [`${Math.round(BILLION_KM)} billion kilometres`, "still sends data"], beat: "twist", pause: 0.25 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep020.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep020.title.length < 50, `title under 50 characters: ${ep020.title.length}`);
  check(MOON_S > 1 && MOON_S < 1.5, `"just over a second": Moon ${MOON_S.toFixed(3)} s`);
  check(Math.abs(SUN_S / 60 - 8) < 0.5, `"eight minutes": Sun ${(SUN_S / 60).toFixed(2)} min`);
  check(Math.abs(PLUTO_S / 3600 - 5.5) < 0.2, `"about five and a half hours": 39 AU = ${(PLUTO_S / 3600).toFixed(2)} h (NASA says 5.5 h)`);
  check(Math.abs(VOYAGER_KM / LIGHT_DAY_KM - 1) < 0.001, `173.14 AU = ${(VOYAGER_KM / LIGHT_DAY_KM).toFixed(4)} light-days`);
  check(Math.abs(BILLION_KM - 25.9) < 0.1 && Math.round(BILLION_KM) === 26, `"about twenty six billion km": ${BILLION_KM.toFixed(2)}`);
  check(YEARS_FLYING > 49 && YEARS_FLYING < 50, `"over forty nine years": ${YEARS_FLYING.toFixed(2)}`);
  check(PLUTO_S > MOON_S && DAY_S > PLUTO_S * 3, "Voyager 1 is much farther than Pluto");
  check(YEARS_WORDS === "forty nine" && BILLION_WORDS === "twenty six", `spoken: ${YEARS_WORDS} / ${BILLION_WORDS}`);
  for (const l of ep020.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  const wc = ep020.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(wc >= 90 && wc <= 135, `script: ${wc} words`);
  check(!ep020.lines.some((l) => /you see/i.test(l.say)), 'no "You see"');
  for (const [name, f, a, b] of [["travel", travelAt, 0.05, REAL_T - 0.01], ["years", yearsAt, YEARS_T, DIST_T], ["distance", distAt, DIST_T, END_T]] as const) {
    let last = -Infinity;
    let rising = true;
    for (let t = a + 0.01; t <= b; t += 0.01) {
      if (f(t) < last) rising = false;
      last = f(t);
    }
    check(rising, `${name} never falls`);
  }
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  if (!ok) process.exit(1);
}
