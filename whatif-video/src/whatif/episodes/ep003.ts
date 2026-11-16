// Episode 3: "What if you could jump twice as high every jump?"
// Every number on screen or in the voice comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep003.ts` to print and check the ladder.
import type { Episode } from "../types";
import { capitalise, numberWords } from "../words.ts";
import { FACTS as EP1 } from "./ep001.ts";
import { FACTS as EP2 } from "./ep002.ts";

export const FACTS = {
  firstJumpM: { value: 0.5, note: "Premise: your first jump is half a metre (a chosen starting point, not a statistic).", source: "Premise" },
  growth: { value: 2, note: "Premise: each jump goes twice as high as the one before.", source: "Premise" },
  hoopM: { value: 3.05, note: "Basketball rim height, 3.05 m (10 ft).", source: "FIBA / NBA rules, as listed in Wikipedia 'Basketball court'" },
  houseM: EP1.houseM,
  monasM: EP2.monasM,
  skyscraperM: EP1.skyscraperM,
  everestM: EP1.everestM,
  karmanM: {
    value: 100_000,
    note: "Kármán line, 100 km: the FAI's boundary of space (a convention; NASA/US Air Force use 80 km).",
    source: "Encyclopaedia Britannica, 'Kármán line' (CONVENTION)",
  },
  issAltitudeM: EP2.issAltitudeM,
  moonDistanceM: EP2.moonDistanceM,
  hillSphereM: {
    value: 1_500_000_000,
    note: "Earth's Hill sphere, ~1.5 million km: beyond it the Sun's gravity dominates and Earth can't hold on to you.",
    source: "OSIRIS-REx mission site (asteroidmission.org), 'Hill Sphere' (APPROXIMATE)",
  },
  earthGM: { value: 3.986e14, note: "Earth's GM, 398,600 km^3/s^2.", source: "NASA Earth Fact Sheet" },
  earthRadiusM: { value: 6_371_000, note: "Earth's mean radius, 6,371 km.", source: "NASA Earth Fact Sheet" },
  escapeVelocity: { value: 11_186, note: "Earth's escape velocity, 11.186 km/s.", source: "NASA Earth Fact Sheet" },
} as const;

// Jump n (n = 1, 2, 3...) goes 0.5 m x 2^(n-1) high; the counter runs continuously between jumps.
export const jumpHeight = (t: number) => FACTS.firstJumpM.value * FACTS.growth.value ** (t - 1);
export const firstJumpOver = (size: number) => Math.ceil(Math.log(size / FACTS.firstJumpM.value) / Math.log(FACTS.growth.value) + 1 - 1e-9);
// Launch speed needed to reach height h straight up, with Earth's real (weakening) gravity
// and no air: energy conservation, v^2 = 2 GM (1/R - 1/(R+h)).
export const launchSpeed = (h: number) => Math.sqrt(2 * FACTS.earthGM.value * (1 / FACTS.earthRadiusM.value - 1 / (FACTS.earthRadiusM.value + h)));

const N = {
  hoop: firstJumpOver(FACTS.hoopM.value),
  house: firstJumpOver(FACTS.houseM.value),
  monas: firstJumpOver(FACTS.monasM.value),
  burj: firstJumpOver(FACTS.skyscraperM.value),
  everest: firstJumpOver(FACTS.everestM.value),
  space: firstJumpOver(FACTS.karmanM.value),
  iss: firstJumpOver(FACTS.issAltitudeM.value),
  moon: firstJumpOver(FACTS.moonDistanceM.value),
  free: firstJumpOver(FACTS.hillSphereM.value),
};
export const LADDER = N;
const say = (n: number) => capitalise(numberWords(n));
// share of escape velocity needed for the jump that never comes back, rounded DOWN to 0.1 %
export const ESCAPE_SHARE = Math.floor((launchSpeed(jumpHeight(N.free)) / FACTS.escapeVelocity.value) * 1000) / 10;
const [shareWhole, shareTenth] = String(ESCAPE_SHARE).split(".").map(Number);
export const END_T = N.free;

export const ep003: Episode = {
  id: "ep003",
  template: 3,
  title: "What if you could jump twice as high every jump?",
  counterLabel: "Jump height",
  clockLabel: "JUMP #",
  ctaTitle: "WHAT SHOULD WE TRY NEXT?",
  object: "jump",
  endT: END_T,
  diameterAt: jumpHeight,
  rungs: [
    { t: 1, label: "Half a meter", icon: "drop", size: FACTS.firstJumpM.value, relation: "about", after: "Twice as high every jump" },
    { t: N.hoop, label: "Higher than a basketball hoop", icon: "hoop", size: FACTS.hoopM.value, relation: "bigger" },
    { t: N.house, label: "As high as a house", icon: "house", size: FACTS.houseM.value, relation: "about", after: "Higher than a house" },
    { t: N.monas, label: "Higher than Monas", icon: "monument", size: FACTS.monasM.value, relation: "bigger" },
    { t: N.burj, label: "Higher than any skyscraper", icon: "tower", size: FACTS.skyscraperM.value, relation: "bigger" },
    { t: N.everest, label: "Higher than Mount Everest", icon: "mountain", size: FACTS.everestM.value, relation: "bigger" },
    { t: N.iss, label: "Higher than the Space Station", icon: "iss", size: FACTS.issAltitudeM.value, relation: "bigger", placement: "altitude", marker: "ISS ~420 KM" },
    { t: N.moon, label: "Farther than the Moon", icon: "moon", size: FACTS.moonDistanceM.value, relation: "bigger", placement: "altitude", marker: "MOON 384,400 KM", lead: 2 },
    { t: N.free, label: "Beyond Earth's pull", icon: "earth", size: FACTS.hillSphereM.value, relation: "bigger" },
  ],
  lines: [
    { t: 1, to: 1.05, say: "What if you could jump twice as high, every jump?", text: "What if you could jump twice as high every jump?", whole: true },
    { t: 1.06, to: 1.1, say: "Your first jump: about half a meter.", text: "Your first jump: about half a meter.", pause: 0.25 },
    { t: 1.2, to: 2.2, say: "Then every jump goes twice as high.", text: "Then every jump goes twice as high." },
    { t: N.hoop, to: N.hoop + 0.1, say: `Jump ${numberWords(N.hoop)}. Higher than a basketball hoop.`, text: `Jump ${N.hoop}. Higher than a basketball hoop.`, pause: 0.6 },
    { t: N.house, to: N.house + 0.1, say: `${say(N.house)}. As high as a house.`, text: `${N.house}. As high as a house.`, pause: 0.5 },
    { t: N.monas, to: N.monas + 0.3, say: `${say(N.monas)}. Higher than Monas.`, text: `${N.monas}. Higher than Monas.`, pause: 0.7 },
    { t: N.burj, to: N.burj + 0.3, say: `${say(N.burj)}. Higher than any skyscraper.`, text: `${N.burj}. Higher than any skyscraper.`, pause: 0.6 },
    { t: N.everest, to: N.everest + 0.3, say: `${say(N.everest)}. Higher than Mount Everest.`, text: `${N.everest}. Higher than Mount Everest.`, pause: 0.7 },
    { t: N.space, to: N.space + 0.3, say: `${say(N.space)}. You jump into space.`, text: `${N.space}. You jump into space.`, pause: 0.7 },
    { t: N.iss, to: N.iss + 0.3, say: `${say(N.iss)}. Higher than the Space Station.`, text: `${N.iss}. Higher than the Space Station.`, pause: 0.6 },
    { t: N.iss + 0.4, to: N.iss + 1, say: "Ignore the air. In real life, at these speeds, it would burn you up.", text: "Ignore the air. In real life, at these speeds, it would burn you up." },
    { t: N.moon, to: N.moon + 0.4, say: `${say(N.moon)}. You jump farther than the Moon.`, text: `${N.moon}. You jump farther than the Moon.`, pause: 0.8, beat: "climax" },
    { t: N.free, say: `And jump ${numberWords(N.free)}... you don't come back down.`, text: `And jump ${N.free}... you don't come back down.`, pause: 0.7, beat: "climax", show: "escape" },
    { t: N.free, say: "Two million kilometers up, the Sun's gravity wins. You'd orbit the Sun instead.", text: "2 million kilometers up, the Sun's gravity wins. You'd orbit the Sun instead.", beat: "climax" },
    { t: N.free, say: "Here's the twist. Escape velocity is eleven point two kilometers a second.", text: "Here's the twist. Escape velocity is 11.2 kilometers a second.", beat: "twist", pause: 0.6 },
    {
      t: N.free,
      say: `But this jump only needed ${numberWords(shareWhole)} point ${numberWords(shareTenth)} percent of it.`,
      text: `But this jump only needed ${ESCAPE_SHARE} percent of it.`,
      beat: "twist",
      show: "card",
      card: {
        title: "LEFT EARTH WITHOUT ESCAPE VELOCITY",
        lines: [
          `Jump ${N.free} launch speed: ${(launchSpeed(jumpHeight(N.free)) / 1000).toFixed(2)} km/s`,
          `Escape velocity: ${(FACTS.escapeVelocity.value / 1000).toFixed(2)} km/s (NASA)`,
          "Beyond ~1.5 million km the Sun's pull wins (Earth's Hill sphere)",
        ],
      },
    },
    { t: N.free, say: "What should we try next? Comment below!", text: "What should we try next? Comment below!", beat: "cta", pause: 0.5, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep003.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  console.log("ladder:", JSON.stringify(N));
  for (const r of ep003.rungs) {
    const h = jumpHeight(r.t);
    const pass = r.relation === "bigger" ? h > r.size : Math.abs(h / r.size - 1) <= 0.1;
    check(pass, `jump ${r.t}: ${h.toPrecision(4)} m vs ${r.label} ${r.size.toPrecision(4)} m (needs ${launchSpeed(h).toFixed(0)} m/s)`);
  }
  check(jumpHeight(N.space) > FACTS.karmanM.value, `"into space" at jump ${N.space}: ${(jumpHeight(N.space) / 1000).toFixed(0)} km > 100 km`);
  const free = jumpHeight(N.free);
  check(free > FACTS.hillSphereM.value && free / 1e9 >= 2 && free / 1e9 < 2.2, `"two million kilometers": jump ${N.free} = ${(free / 1e9).toFixed(3)} million km (Hill sphere ~1.5)`);
  check(launchSpeed(free) < FACTS.escapeVelocity.value, `jump ${N.free} launch ${launchSpeed(free).toFixed(0)} m/s < escape ${FACTS.escapeVelocity.value} m/s -> ${ESCAPE_SHARE}% (rounded down)`);
  check(jumpHeight(N.free - 1) < FACTS.hillSphereM.value, `jump ${N.free - 1} (${(jumpHeight(N.free - 1) / 1e9).toFixed(2)} million km) stays inside the Hill sphere, so it does come back`);
  check(Math.abs(Math.sqrt((2 * FACTS.earthGM.value) / FACTS.earthRadiusM.value) - FACTS.escapeVelocity.value) < 10, `escape velocity from GM and R: ${Math.sqrt((2 * FACTS.earthGM.value) / FACTS.earthRadiusM.value).toFixed(0)} m/s vs NASA 11,186`);
  check(Math.abs(jumpHeight(1.1) - 0.5) / 0.5 < 0.1, `"about half a meter" line ends at ${jumpHeight(1.1).toFixed(3)} m`);
  if (!ok) process.exit(1);
}
