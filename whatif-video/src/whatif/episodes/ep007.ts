// Episode 7 (shape: disappearing): "What if the Moon vanished for exactly one day?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep007.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  moonDistKm: { value: 384_400, note: "Mean Earth-Moon distance (semimajor axis).", source: "NASA Moon Fact Sheet (NSSDCA)" },
  perigeeKm: { value: 363_300, note: "Mean closest distance of the Moon.", source: "NASA Moon Fact Sheet (NSSDCA)" },
  apogeeKm: { value: 405_500, note: "Mean farthest distance of the Moon.", source: "NASA Moon Fact Sheet (NSSDCA)" },
  moonKg: { value: 7.346e22, note: "Mass of the Moon.", source: "NASA Moon Fact Sheet (NSSDCA)" },
  monthDays: { value: 27.3217, note: "Sidereal month: one lap of the Moon.", source: "NASA Moon Fact Sheet (NSSDCA)" },
  earthKg: { value: 5.9722e24, note: "Mass of the Earth.", source: "NASA Earth Fact Sheet" },
  earthRadiusKm: { value: 6_371, note: "Earth's mean radius.", source: "NASA Earth Fact Sheet" },
  earthOrbitKmS: { value: 29.78, note: "Earth's mean speed around the Sun.", source: "NASA Earth Fact Sheet" },
  sunKg: { value: 1.9884e30, note: "Mass of the Sun.", source: "NASA Sun Fact Sheet" },
  sunDistKm: { value: 149_600_000, note: "Mean Earth-Sun distance (1 AU, rounded).", source: "NASA Earth Fact Sheet" },
  noaaTide: { value: 27 / 59, note: "Check on our sum: NOAA gives 27 million / 59 million, 'about half'. This is tide-raising FORCE. APPROXIMATE for real coasts: actual tides also depend on the shape of each ocean basin.", source: "NOAA Ocean Service, Tides tutorial: Tidal variations / changing angles" },
  lightKmS: { value: 299_792.458, note: "Speed of light. Gravity travels at the same speed: GW170817 tested this to a few parts in 10^15.", source: "SI definition; LIGO/Virgo/Fermi/INTEGRAL 2017, ApJL 848 L13" },
  fullMoonLux: { value: 0.25, note: "Full Moon on a clear night. APPROXIMATE: tables give 0.05-0.3 lux.", source: "Wikipedia, Daylight and Orders of magnitude (illuminance)" },
  darkSkyLux: { value: 0.002, note: "Clear moonless night, starlight plus airglow. APPROXIMATE, and only true far from city lights.", source: "Wikipedia, Daylight and Orders of magnitude (illuminance)" },
  marathonKm: { value: 42.195, note: "Marathon distance.", source: "World Athletics" },
  tideSettle: { value: 2, note: "Days for ocean tides to die down. UNCERTAIN, our own estimate from Q of about 23 for semidiurnal tides (Q / omega is about 2 days). Only used for 'one day is too short to calm it'.", source: "Kantha et al. 1998 (Q values); estimate is ours" },
} as const;

// ---- the delay ----
export const DELAY_S = FACTS.moonDistKm.value / FACTS.lightKmS.value;

// ---- the sky ----
export const DARKER = FACTS.fullMoonLux.value / FACTS.darkSkyLux.value;

// ---- the tides: tide-raising force = mass / distance cubed. NOAA states the same sum (27 million / 59 million, "about half").
export const MASS_RATIO = FACTS.sunKg.value / FACTS.moonKg.value;
export const DIST_RATIO = FACTS.sunDistKm.value / FACTS.moonDistKm.value;
export const SUN_TIDE = MASS_RATIO / DIST_RATIO ** 3;
export const SUN_TIDE_PCT = Math.round(SUN_TIDE * 100);

// ---- Earth's circle ----
// Earth and Moon both circle their shared centre of mass. If the Moon goes, Earth carries on in a
// straight line instead (SIMPLIFICATION: circular orbit, Sun's pull treated as the same for both paths).
export const BARY_KM = (FACTS.moonDistKm.value * FACTS.moonKg.value) / (FACTS.earthKg.value + FACTS.moonKg.value);
const OMEGA_PER_H = (2 * Math.PI) / (FACTS.monthDays.value * 24);
const WOBBLE_KM_H = BARY_KM * OMEGA_PER_H;
export const offCourseKm = (hours: number) => {
  const a = OMEGA_PER_H * hours;
  const along = WOBBLE_KM_H * hours - BARY_KM * Math.sin(a);
  const side = BARY_KM * (1 - Math.cos(a));
  return Math.hypot(along, side);
};
export const OFF_KM = offCourseKm(24);
export const FLOWN_KM = FACTS.earthOrbitKmS.value * 86_400;
export const MARATHONS = OFF_KM / FACTS.marathonKm.value;
export const SWING_KM = FACTS.apogeeKm.value - FACTS.perigeeKm.value;

// Story steps: 0-1 the delay | 1-3 dark sky | 3-4 tide question | 4-6 Sun's tide | 6-8 Earth's
// circle and the drift | 8-9 three marathons | 9-10 the Moon returns.
const END_T = 10;
export const VANISH_T = 1;
export const REVEAL_T = 4;
export const RETURN_T = 9;

const lerpKeys = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return keys[keys.length - 1][1];
};
// Hours without the Moon, from the moment it can be seen to be gone
export const hoursAt = (t: number) => lerpKeys(t, [[VANISH_T, 0], [3, 6], [6, 14], [8, 24]]);
export const delayAt = (t: number) => Math.min(1, Math.max(0, t / VANISH_T)) * DELAY_S;
export const tidePctAt = (t: number) => Math.min(1, Math.max(0, (t - 4.3) / 0.5)) * SUN_TIDE * 100;
export const swingAt = (t: number) => OFF_KM + Math.min(1, Math.max(0, (t - 9.35) / 0.55)) * (SWING_KM - OFF_KM);

const offWhole = Math.floor(OFF_KM / 10) * 10; // "over 120"
const massMillions = Math.floor(MASS_RATIO / 1e6);
const distWhole = Math.round(DIST_RATIO);
const swingThousands = Math.floor(SWING_KM / 1000);
const kmText = (km: number) => ({ value: Math.round(km).toLocaleString("en-US"), unit: "km" });

export const ep007: Episode = {
  id: "ep007",
  template: 3,
  title: "What if the Moon vanished for exactly one day?",
  counterLabel: "Moon gone for",
  ctaTitle: "WHAT SHOULD WE ERASE NEXT?",
  stage: "moon",
  endT: END_T,
  diameterAt: (t) => Math.max(1, hoursAt(t)),
  clockText: (t) => (t < VANISH_T ? "SLOWED DOWN" : `HOUR ${Math.floor(hoursAt(t) + 1e-6)}`),
  counterAt: (t) => {
    if (t < VANISH_T) return { text: { value: delayAt(t).toFixed(1), unit: "s" } };
    if (t < 3.6) return { label: "Hours without Moon", text: { value: hoursAt(t).toFixed(1), unit: "h" } };
    if (t < REVEAL_T) return { label: "Tides left", mystery: true };
    if (t < 4.3) return { label: "Sun's tide vs Moon's", text: { value: "0", unit: "%" } };
    if (t < 6) return { label: "Sun's tide vs Moon's", text: { value: tidePctAt(t).toFixed(0), unit: "%" } };
    if (t < 6.6) return { label: "Earth off course", mystery: true };
    if (t < 9.35) return { label: "Earth off course", text: kmText(offCourseKm(hoursAt(t))) };
    return { label: "Moon's monthly swing", text: kmText(swingAt(t)) };
  },
  rungs: [
    { t: VANISH_T, label: "The light runs out", icon: "moon", size: 1, relation: "about" },
    { t: 1.5, label: `About ${Math.round(DARKER / 100) * 100}× darker`, icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "What about the tides?", icon: "drop", size: 1, relation: "about" },
    { t: 3.6, label: "Take a guess", icon: "drop", size: 1, relation: "about" },
    { t: REVEAL_T, label: "They don't stop", icon: "drop", size: 1, relation: "about" },
    { t: 4.8, label: "Still almost half", icon: "earth", size: 1, relation: "about" },
    { t: 6, label: "A point inside the Earth", icon: "drop", size: 1, relation: "about" },
    { t: 6.6, label: "Slipping off the circle", icon: "drop", size: 1, relation: "about" },
    { t: 8.2, label: `About ${Math.round(MARATHONS)} marathons`, icon: "person", size: 1, relation: "about" },
    { t: RETURN_T, label: "The Moon is back", icon: "moon", size: 1, relation: "about" },
    { t: 9.45, label: `Way more than our ${Math.round(OFF_KM)} km`, icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 0.3, say: "What if the Moon vanished for exactly one day?", text: "What if the Moon vanished for exactly one day?", whole: true },
    { t: 0.3, to: 0.65, say: `It's gone. But for about ${numberWords(1)} point ${numberWords(3)} seconds, nobody on Earth can tell.`, text: "It's gone. But for about 1.3 seconds, nobody on Earth can tell.", pause: 0.25 },
    { t: 0.65, to: 1, say: "That's how long its light takes to reach us. Its gravity travels just as fast.", text: "That's how long its light takes to reach us. Its gravity travels just as fast." },
    { t: 1, to: 1.7, say: "Then the full moon sky goes about a hundred times darker.", text: "Then the full moon sky goes about 100 times darker.", pause: 0.3 },
    { t: 1.7, to: 3, say: "And far from city lights, the Milky Way takes over.", text: "And far from city lights, the Milky Way takes over." },
    { t: 3, to: 3.95, say: "The Moon makes the tides. So with no Moon, do they stop? Take a guess.", text: "The Moon makes the tides. So with no Moon, do they stop? Take a guess.", pause: 0.5 },
    { t: REVEAL_T, to: 4.3, say: "They don't stop. They shrink.", text: "They don't stop. They shrink.", pause: 0.5, beat: "climax" },
    { t: 4.3, to: 5, say: `Because the Sun makes tides too. ${numberWords(SUN_TIDE_PCT)} percent as strong as the Moon's.`, text: `Because the Sun makes tides too. ${SUN_TIDE_PCT} percent as strong as the Moon's.`, beat: "climax" },
    {
      t: 5,
      to: 5.6,
      say: `It's ${numberWords(massMillions)} million times heavier, but ${numberWords(distWhole)} times farther, and tides fade with distance cubed.`,
      text: `It's ${massMillions} million times heavier, but ${distWhole} times farther, and tides fade with distance cubed.`,
      show: "card",
      pause: 0.4,
      card: {
        title: "SUN VS MOON",
        lines: [`${massMillions} million × heavier`, `${distWhole}³ = ${Math.round(DIST_RATIO ** 3 / 1e6)} million × weaker`, `${massMillions} ÷ ${Math.round(DIST_RATIO ** 3 / 1e6)} = ${SUN_TIDE_PCT}% of the Moon's tide`],
      },
    },
    { t: 5.6, to: 6, say: "The sea still moves, just less. One day can't calm it anyway.", text: "The sea still moves, just less. One day can't calm it anyway.", pause: 0.5 },
    { t: 6, to: 6.6, say: "Now the strange part. Earth and Moon both circle one point, deep inside the Earth.", text: "Now the strange part. Earth and Moon both circle one point, deep inside the Earth.", beat: "twist", pause: 0.4 },
    { t: 6.6, to: 7, say: "Delete the Moon, and Earth slips off that circle.", text: "Delete the Moon, and Earth slips off that circle.", beat: "twist" },
    { t: 7, to: 8, say: `By hour ${numberWords(24)}, we're over ${numberWords(offWhole)} kilometers off course.`, text: `By hour 24, we're over ${offWhole} kilometers off course.`, beat: "twist" },
    { t: 8, to: 9, say: `That's about ${numberWords(Math.round(MARATHONS))} marathons, out of over two and a half million kilometers flown.`, text: `That's about ${Math.round(MARATHONS)} marathons, out of over 2.5 million kilometers flown.`, beat: "twist" },
    { t: RETURN_T, to: 10, say: `Then the Moon pops back. Its distance swings over ${numberWords(swingThousands)} thousand kilometers a month anyway.`, text: `Then the Moon pops back. Its distance swings over ${swingThousands} thousand kilometers a month anyway.`, pause: 0.35 },
    { t: END_T, say: "What should we erase next? The best comment becomes the next video.", text: "What should we erase next? The best comment becomes the next video.", beat: "cta", pause: 0.5, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep007.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(Math.abs(DELAY_S - 1.3) < 0.05, `"about 1.3 seconds": ${DELAY_S.toFixed(3)} s`);
  check(DARKER > 80 && DARKER < 130, `"about a hundred times darker": ${DARKER.toFixed(0)}x`);
  check(SUN_TIDE_PCT === 46, `Sun's tide ${(SUN_TIDE * 100).toFixed(1)}% (NOAA sum 27/59 = ${((27 / 59) * 100).toFixed(1)}%)`);
  check(massMillions === 27, `"27 million times heavier": ${(MASS_RATIO / 1e6).toFixed(2)} million`);
  check(distWhole >= 389 && distWhole <= 390, `"${distWhole} times farther": ${DIST_RATIO.toFixed(1)}`);
  check(BARY_KM < FACTS.earthRadiusKm.value, `the point is inside Earth: ${BARY_KM.toFixed(0)} km from the centre, ${(FACTS.earthRadiusKm.value - BARY_KM).toFixed(0)} km deep`);
  check(OFF_KM > offWhole && OFF_KM < offWhole + 10, `"over ${offWhole} kilometers": ${OFF_KM.toFixed(1)} km`);
  check(Math.abs(MARATHONS - 3) < 0.1, `"about 3 marathons": ${MARATHONS.toFixed(2)}`);
  check(FLOWN_KM > 2.5e6 && FLOWN_KM < 2.6e6, `"over two and a half million kilometers": ${FLOWN_KM.toFixed(0)} km`);
  check(SWING_KM > swingThousands * 1000 && SWING_KM > OFF_KM, `"over ${swingThousands} thousand kilometers": ${SWING_KM} km`);
  // the same drift from the Moon's pull: half a t squared, for a short day
  const pull = (6.6743e-20 * FACTS.moonKg.value) / FACTS.moonDistKm.value ** 2; // km/s^2
  const roughKm = 0.5 * pull * 86_400 ** 2;
  check(Math.abs(roughKm - OFF_KM) / OFF_KM < 0.03, `second route (0.5 a t^2): ${roughKm.toFixed(1)} km`);
  // numbers only climb
  let last = 0;
  for (let t = VANISH_T; t <= 8; t += 0.01) {
    const h = hoursAt(t);
    if (h < last) check(false, `hours fell at step ${t}`);
    last = h;
  }
  check(hoursAt(8) === 24, "hour 24 lands at step 8");
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  if (!ok) process.exit(1);
}
