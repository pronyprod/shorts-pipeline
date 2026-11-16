// Episode 10 (Round 3, TIMELY slot, category: Deadly place): "What if you rode a satellite back to Earth?"
// Timely hook: NASA's Swift observatory re-entered over North Sumatra on 4 November 2026 (NASA, 2-4 Nov 2026).
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep010.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  gm: { value: 3.986004418e14, note: "Earth's gravitational parameter GM, m^3/s^2.", source: "NASA Earth Fact Sheet (GM 0.39860 x 10^6 km^3/s^2)" },
  earthRadiusKm: { value: 6371, note: "Earth's volumetric mean radius.", source: "NASA Earth Fact Sheet" },
  entryKm: { value: 122, note: "Entry interface, where re-entry is counted from: 400,000 ft = 122 km. The voice says 'about a hundred and twenty'. APPROXIMATE: the air thickens gradually, there is no sharp edge.", source: "NASA, Space Shuttle entry (entry interface 400,000 ft); Wikipedia, Atmospheric entry" },
  everestM: { value: 8848.86, note: "Height of Mount Everest (2020 survey).", source: "Nepal/China joint survey, Dec 2020 (Wikipedia, Mount Everest)" },
  compression: { value: 1, note: "Re-entry heat comes mainly from air compressed in the shock in front of the craft; skin friction adds a smaller share. The voice says 'way more than friction'.", source: "NASA History, H. Julian Allen and the blunt-body concept; Mars Society of Canada, 'Re-entry: it's not friction'" },
  aluminiumMeltC: { value: 660.32, note: "Melting point of aluminium, the usual spacecraft structure metal. The heat counter ramp before it is ILLUSTRATIVE (the real temperature curve depends on the path); only 660 is a stated fact.", source: "Wikipedia, Aluminium (CRC Handbook value)" },
  breakupKm: { value: 78, note: "Typical main break-up altitude of satellites re-entering from low orbit. APPROXIMATE, a typical value (roughly 70-80 km); the voice says 'around'. Swift's own break-up altitude was not published.", source: "ESA, Cluster 'Salsa' re-entry 2024 (main break-up predicted at 78 km); ESA SDC9 airborne observation paper ('main break-up ... at 78 km')" },
  reentryDay: { value: 4, note: "Swift re-entered on 4 November 2026 at 12:39 UTC (7:39 a.m. EST). TIMELY source, published 2 Nov 2026, updated 4 Nov 2026.", source: "NASA Science, Swift blog: 'NASA's Swift Observatory Re-Entered Atmosphere' (2 Nov 2026, updated 4 Nov 2026); Sky & Telescope (2 Nov 2026, update)" },
  reentryPlace: { value: 1, note: "Over the North Sumatra region of Indonesia, about 3.4 N, 98.6 E. Sky & Telescope says 'centered over southeast Asia'; one outlet said the Pacific (outweighed by NASA and Space Force).", source: "NASA Science, Swift blog (updated 4 Nov 2026)" },
  launchYear: { value: 2004, note: "Launched 20 November 2004 (Delta II, Cape Canaveral).", source: "Sky & Telescope (2 Nov 2026); Wikipedia, Neil Gehrels Swift Observatory" },
  yearsInSpace: { value: 21.96, note: "20 Nov 2004 to 4 Nov 2026 = 8,019 days = 21.96 years. Computed and checked below; the voice says 'almost twenty two'.", source: "Computed from the launch and re-entry dates above" },
  bursts: { value: 1750, note: "'Over 1,750 bursts' (gamma-ray bursts, the biggest explosions in the universe), quoted from Lynn Cominsky. The voice says 'over'.", source: "Sky & Telescope, 'Swift Observatory Ends Mission, Reenters Earth's Atmosphere' (2 Nov 2026)" },
  heatShield: { value: 1, note: "Every crewed craft that comes home from orbit uses a heat shield or thermal protection system (capsules, Space Shuttle tiles).", source: "Wikipedia, Atmospheric entry (Thermal protection system); NASA, Orion heat shield" },
} as const;

// ---- the numbers ----
// circular orbit speed at the entry interface: v = sqrt(GM / r)
export const SPEED_MS = Math.sqrt(FACTS.gm.value / ((FACTS.earthRadiusKm.value + FACTS.entryKm.value) * 1000));
export const SPEED_KMH = (SPEED_MS * 3600) / 1000;
export const SPEED_KMS = SPEED_MS / 1000;
export const KMH_ROUND = Math.floor(SPEED_KMH / 1000) * 1000; // "over 28,000"
export const DAYS_IN_SPACE = (Date.UTC(2026, 10, 4) - Date.UTC(2004, 10, 20)) / 86_400_000;
export const YEARS_IN_SPACE = DAYS_IN_SPACE / 365.25;

const lerpKeys = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return keys[keys.length - 1][1];
};

// Story steps (one per line): 0-1 hook | 1-2 every second | 2-3 Everest sideways | 3-4 first air |
// 4-5 air piles up | 5-6 squeezed air is the heat | 6-7 aluminium melts | 7-8 break-up (climax) |
// 8-9 heat shields | 9-10 it really happened | 10-11 over Sumatra | 11-12 the bursts | 12 CTA.
const END_T = 12;
export const AIR_T = 3;
export const MELT_T = 7;
export const BREAK_T = 7;
export const REAL_T = 9;
export const SUMATRA_T = 10;
export const BURSTS_T = 11;
const MELT = Math.round(FACTS.aluminiumMeltC.value);

// phase 1: distance flown at orbit speed, one story second per step
export const distanceAt = (t: number) => SPEED_KMS * Math.min(t, AIR_T);
// phase 2: heat (ILLUSTRATIVE ramp up to aluminium's melting point)
export const heatAt = (t: number) => lerpKeys(t, [[AIR_T, 20], [6, 480], [MELT_T, MELT]]);
// phase 3: Swift's years in space, then its bursts
export const yearsAt = (t: number) => lerpKeys(t, [[REAL_T, 0], [BURSTS_T, FACTS.yearsInSpace.value]]);
export const burstsAt = (t: number) => lerpKeys(t, [[BURSTS_T, 0], [END_T, FACTS.bursts.value]]);

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const KMH_WORDS = `${numberWords(KMH_ROUND / 1000)} thousand`;
const BURST_WORDS = `${numberWords(Math.floor(FACTS.bursts.value / 1000))} thousand ${numberWords(FACTS.bursts.value % 1000)}`;
const YEARS_WORDS = numberWords(Math.ceil(FACTS.yearsInSpace.value));

export const ep010: Episode = {
  id: "ep010",
  template: 3,
  title: "What if you rode a satellite back to Earth?",
  counterLabel: "Distance flown",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => {
    if (t < AIR_T) return `SECOND ${Math.floor(Math.min(t, AIR_T)) + 1}`;
    if (t < REAL_T) return "SPED UP";
    return "REAL CASE";
  },
  counterAt: (t) => {
    if (t < AIR_T) return { text: { value: distanceAt(t).toFixed(1), unit: "km" } };
    if (t < BREAK_T) return { label: "Heat", text: { value: fmt(heatAt(t)), unit: "°C" } };
    if (t < REAL_T) return { label: "Break-up height", text: { value: `≈${FACTS.breakupKm.value}`, unit: "km" } };
    if (t < BURSTS_T) return { label: "Swift's years in space", text: { value: yearsAt(t).toFixed(1), unit: "yr" } };
    return { label: "Cosmic blasts caught", text: { value: fmt(burstsAt(t)), unit: "" } };
  },
  rungs: [
    { t: 0.05, label: `Over ${fmt(KMH_ROUND)} km/h`, icon: "drop", size: 1, relation: "about" },
    { t: 1, label: `${SPEED_KMS.toFixed(1)} km every second`, icon: "drop", size: 1, relation: "about" },
    { t: 2, label: "Nearly an Everest, sideways", icon: "drop", size: 1, relation: "about" },
    { t: AIR_T, label: `First air, ${FACTS.entryKm.value} km up`, icon: "drop", size: 1, relation: "about" },
    { t: 4, label: "Air piling up in front", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "Squeezed air glows", icon: "drop", size: 1, relation: "about" },
    { t: 6, label: `Aluminium melts at ${MELT} °C`, icon: "drop", size: 1, relation: "about" },
    { t: BREAK_T, label: "Breaking apart", icon: "drop", size: 1, relation: "about" },
    { t: 8, label: "Astronauts: heat shield", icon: "drop", size: 1, relation: "about" },
    { t: REAL_T, label: "4 Nov 2026: NASA's Swift", icon: "drop", size: 1, relation: "about" },
    { t: SUMATRA_T, label: "Over Sumatra, Indonesia", icon: "drop", size: 1, relation: "about" },
    { t: BURSTS_T, label: `Over ${fmt(FACTS.bursts.value)} bursts`, icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: `You're riding a dying space telescope, falling at over ${KMH_WORDS} kilometres an hour.`, text: `You're riding a dying space telescope, falling at over ${fmt(KMH_ROUND)} kilometres an hour.` },
    { t: 1, to: 2, say: "Every second, you fly almost eight kilometres.", text: "Every second, you fly almost 8 kilometres.", pause: 0.25 },
    { t: 2, to: AIR_T, say: "That's nearly Mount Everest, sideways, every second.", text: "That's nearly Mount Everest, sideways, every second.", pause: 0.25 },
    { t: AIR_T, to: 4, say: "About a hundred and twenty kilometres up, you hit the first air.", text: "About a hundred and twenty kilometres up, you hit the first air.", pause: 0.3 },
    { t: 4, to: 5, say: "It can't move away fast enough, so it piles up in front of you.", text: "It can't move away fast enough, so it piles up in front of you.", pause: 0.25 },
    { t: 5, to: 6, say: "Squeezed air gets hot. That's the real heat, way more than friction.", text: "Squeezed air gets hot. That's the real heat, way more than friction.", pause: 0.25 },
    { t: 6, to: MELT_T, say: `At ${numberWords(MELT)} degrees, aluminium melts. Your telescope starts to fall apart.`, text: `At ${MELT} degrees, aluminium melts. Your telescope starts to fall apart.`, pause: 0.25 },
    { t: BREAK_T, to: 8, say: `Around ${numberWords(FACTS.breakupKm.value)} kilometres up, it breaks into pieces.`, text: `Around ${FACTS.breakupKm.value} kilometres up, it breaks into pieces.`, beat: "climax", pause: 0.3 },
    { t: 8, to: REAL_T, say: "That's why every astronaut rides home behind a heat shield.", text: "That's why every astronaut rides home behind a heat shield.", pause: 0.3 },
    { t: REAL_T, to: SUMATRA_T, say: "This really happened. On November fourth, NASA's Swift telescope came down.", text: "This really happened. On November fourth, NASA's Swift telescope came down.", beat: "twist", pause: 0.4 },
    { t: SUMATRA_T, to: BURSTS_T, say: `It burned up over Sumatra, in Indonesia, after almost ${YEARS_WORDS} years in space.`, text: `It burned up over Sumatra, in Indonesia, after almost ${Math.ceil(FACTS.yearsInSpace.value)} years in space.`, beat: "twist", pause: 0.25 },
    { t: BURSTS_T, to: END_T, say: `Along the way, it caught over ${BURST_WORDS} cosmic explosions.`, text: `Along the way, it caught over ${fmt(FACTS.bursts.value)} cosmic explosions.`, beat: "twist", pause: 0.25 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep010.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep010.title.length < 50, `title under 50 characters: ${ep010.title.length}`);
  check(SPEED_KMH > KMH_ROUND && SPEED_KMH < KMH_ROUND + 1000, `"over ${KMH_ROUND}": orbit speed at ${FACTS.entryKm.value} km is ${SPEED_KMH.toFixed(0)} km/h`);
  check(SPEED_KMS < 8 && SPEED_KMS > 7.5, `"almost eight kilometres" a second: ${SPEED_KMS.toFixed(3)} km/s`);
  const everest = SPEED_KMS * 1000 / FACTS.everestM.value;
  check(everest > 0.85 && everest < 1, `"nearly Mount Everest": one second = ${(everest * 100).toFixed(1)}% of Everest`);
  check(Math.abs(FACTS.entryKm.value - 120) <= 5, `"about a hundred and twenty" for ${FACTS.entryKm.value} km`);
  check(Math.abs(DAYS_IN_SPACE - 8019) < 0.5, `days in space: ${DAYS_IN_SPACE}`);
  check(Math.abs(YEARS_IN_SPACE - FACTS.yearsInSpace.value) < 0.01, `years in space ${YEARS_IN_SPACE.toFixed(3)} = FACTS ${FACTS.yearsInSpace.value}`);
  check(YEARS_IN_SPACE < 22 && YEARS_IN_SPACE > 21.5, `"almost twenty two years"`);
  check(Math.round(heatAt(MELT_T)) === MELT, `heat counter ends on ${MELT} °C at the melt line's end`);
  check(BURST_WORDS === "one thousand seven hundred fifty", `spoken bursts: ${BURST_WORDS}`);
  check(KMH_WORDS === "twenty eight thousand", `spoken speed: ${KMH_WORDS}`);
  for (const [name, f, a, b] of [["distance", distanceAt, 0, AIR_T], ["heat", heatAt, AIR_T, MELT_T], ["years", yearsAt, REAL_T, BURSTS_T], ["bursts", burstsAt, BURSTS_T, END_T]] as const) {
    let last = -Infinity;
    let rising = true;
    for (let t = a + 0.01; t <= b; t += 0.01) {
      if (f(t) <= last) rising = false;
      last = f(t);
    }
    check(rising, `${name} only climbs`);
  }
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep010.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  console.log(`script: ${words} words`);
  if (!ok) process.exit(1);
}
