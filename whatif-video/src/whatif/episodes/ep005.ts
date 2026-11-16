// Episode 5 (shape: paradox): "What if you added one meter of rope around the whole Earth?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep005.ts` to print and check them.
import type { Episode } from "../types";
import { capitalise, numberWords } from "../words.ts";
import { FACTS as EP1 } from "./ep001.ts";

export const FACTS = {
  extraRopeM: { value: 1, note: "Premise: one extra metre of rope.", source: "Premise" },
  earthRadiusM: { value: 6_378_137, note: "Earth's equatorial radius (rope around the equator; a perfect sphere and sea-level ground assumed).", source: "NASA Earth Fact Sheet (SIMPLIFICATION: smooth sphere)" },
  moonRadiusM: { value: 1_737_400, note: "Moon's mean radius.", source: "NASA Moon Fact Sheet" },
  footballM: EP1.footballM,
  tennisBallM: { value: 0.0686, note: "Largest allowed tennis ball, 6.86 cm (limits 6.54-6.86 cm).", source: "ITF Rules of Tennis, Appendix I" },
  statueM: { value: 92.99, note: "Statue of Liberty, ground to tip of torch: 305 ft 1 in, 92.99 m.", source: "US National Park Service, Statue Statistics" },
} as const;

// Lifted evenly: circumference = 2 pi r, so the radius grows by extra / (2 pi), whatever the size.
export const gap = (extra: number) => extra / (2 * Math.PI);
export const GAP_M = gap(FACTS.extraRopeM.value);
// Pulled up from one point: the rope leaves the ground along two tangents. With half-angle
// theta, tan(theta) - theta = extra / (2R), and the peak is R (1/cos(theta) - 1) high.
export const tentHeight = (extra: number, R: number) => {
  let th = Math.cbrt((3 * extra) / (2 * R));
  for (let i = 0; i < 30; i++) {
    const f = Math.tan(th) - th - extra / (2 * R);
    const df = Math.tan(th) ** 2; // d/dth (tan - th) = tan^2
    th -= f / df;
  }
  return R * (1 / Math.cos(th) - 1);
};
export const PEAK_M = tentHeight(FACTS.extraRopeM.value, FACTS.earthRadiusM.value);
export const ROPE_KM = (2 * Math.PI * FACTS.earthRadiusM.value) / 1000;
const peakWhole = Math.floor(PEAK_M);

// Story steps: 0-1 add the rope | 1-2 guess (hidden) | 2-3 reveal on Earth | 3-4 Moon |
// 4-5 football | 5-6 guess again (hidden) | 6-7 pulled up from one point.
const END_T = 7;
export const ropeValue = (t: number) => {
  if (t <= 1) return t * FACTS.extraRopeM.value;
  if (t <= 2) return 0;
  if (t <= 3) return GAP_M * (t - 2);
  if (t <= 6) return GAP_M;
  return GAP_M * (PEAK_M / GAP_M) ** (t - 6); // climbs on a log scale, like every counter
};

export const ep005: Episode = {
  id: "ep005",
  template: 3,
  title: "What if you added one meter of rope around the whole Earth?",
  counterLabel: "Gap under the rope",
  ctaTitle: "WHAT SHOULD WE WRAP NEXT?",
  stage: "rope",
  endT: END_T,
  diameterAt: ropeValue,
  clockText: (t) => (t < 3.05 ? "EARTH" : t < 4.05 ? "MOON" : t < 5 ? "FOOTBALL" : "EARTH"),
  counterAt: (t) => {
    if (t <= 1) return { label: "Extra rope" };
    if (t < 2) return { mystery: true };
    if (t >= 5.2 && t < 6) return { label: "Height at one point", mystery: true };
    if (t >= 6) return { label: "Height at one point" };
    return {};
  },
  rungs: [
    { t: 1, label: "Out of 40,075 km of rope", icon: "drop", size: FACTS.extraRopeM.value, relation: "about" },
    { t: 3, label: "A tennis ball fits under it", icon: "pin", size: FACTS.tennisBallM.value, relation: "bigger" },
    { t: 3.6, label: "Same gap on the Moon", icon: "moon", size: GAP_M, relation: "about" },
    { t: 4.6, label: "Same gap on a football", icon: "ball", size: GAP_M, relation: "about" },
    { t: 5.2, label: "Same rope, same one meter", icon: "drop", size: GAP_M, relation: "about" },
    { t: 7, label: "Taller than the Statue of Liberty", icon: "statue", size: FACTS.statueM.value, relation: "bigger" },
  ],
  lines: [
    { t: 0, to: 0.3, say: "What if you tied a rope around the whole Earth, then added just one meter?", text: "What if you tied a rope around the whole Earth, then added just one meter?", whole: true },
    { t: 0.32, to: 0.75, say: "The rope is forty thousand kilometers long. One more meter is nothing.", text: "The rope is 40 thousand kilometers long. One more meter is nothing.", pause: 0.25 },
    { t: 0.77, to: 1, say: "Now lift it evenly, all the way around the planet.", text: "Now lift it evenly, all the way around the planet." },
    { t: 1.1, to: 1.5, say: "How high does it float? Take a guess.", text: "How high does it float? Take a guess.", pause: 0.4 },
    { t: 1.55, to: 1.95, say: "The width of a hair? A sheet of paper?", text: "The width of a hair? A sheet of paper?", pause: 0.7 },
    { t: 2, to: 3, say: "Nearly sixteen centimeters.", text: "Nearly 16 centimeters.", pause: 1.0 },
    { t: 3, say: "All the way around the Earth. A tennis ball rolls right under it.", text: "All the way around the Earth. A tennis ball rolls right under it." },
    { t: 3.1, to: 3.5, say: "Now try the Moon. Add one meter.", text: "Now try the Moon. Add one meter.", pause: 0.6 },
    { t: 3.6, to: 3.9, say: "Nearly sixteen centimeters. Again.", text: "Nearly 16 centimeters. Again.", pause: 0.5 },
    { t: 4.1, to: 4.5, say: "A football? One meter of rope.", text: "A football? One meter of rope.", pause: 0.6 },
    { t: 4.6, to: 4.9, say: "The same gap.", text: "The same gap.", pause: 0.5 },
    {
      t: 5,
      say: "The size never matters. The gap is always one meter, divided by two pi.",
      text: "The size never matters. The gap is always one meter, divided by two pi.",
      beat: "twist",
      show: "card",
      pause: 0.5,
      card: { title: "WHY IT NEVER CHANGES", lines: ["Rope = 2π × radius", `Add 1 m: radius grows 1 m ÷ 2π = ${(GAP_M * 100).toFixed(1)} cm`, "The planet's size cancels out"] },
    },
    { t: 5.2, to: 5.5, say: "Now the real twist. Same rope, same one meter. But pull it up from a single point.", text: "Now the real twist. Same rope, same one meter. But pull it up from a single point.", beat: "twist", pause: 0.6 },
    { t: 5.6, to: 5.95, say: "How high now?", text: "How high now?", pause: 0.3 },
    { t: 6, to: 7, say: `Over ${numberWords(peakWhole)} meters.`, text: `Over ${peakWhole} meters.`, pause: 1.0, beat: "climax" },
    { t: 7, say: "Taller than the Statue of Liberty. From one meter of rope.", text: "Taller than the Statue of Liberty. From one meter of rope.", beat: "climax" },
    { t: 7, say: "What should we wrap next? The best comment becomes the next video.", text: "What should we wrap next? The best comment becomes the next video.", beat: "cta", pause: 0.5, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep005.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(GAP_M > 0.15 && GAP_M < 0.16, `"nearly sixteen centimeters": gap ${(GAP_M * 100).toFixed(2)} cm`);
  check(GAP_M > FACTS.tennisBallM.value, `tennis ball ${FACTS.tennisBallM.value * 100} cm fits under ${(GAP_M * 100).toFixed(1)} cm`);
  check(ROPE_KM > 40_000 && ROPE_KM < 40_100, `"forty thousand kilometers": ${ROPE_KM.toFixed(0)} km`);
  // the gap really is independent of size: both circles, computed the long way
  for (const [name, r] of [["Earth", FACTS.earthRadiusM.value], ["Moon", FACTS.moonRadiusM.value], ["football", FACTS.footballM.value / 2]] as const) {
    const longWay = (2 * Math.PI * r + 1) / (2 * Math.PI) - r;
    check(Math.abs(longWay - GAP_M) < 1e-6, `${name}: gap computed the long way ${(longWay * 100).toFixed(2)} cm`);
  }
  // check the tent numerically: tangent length + wrapped arc must equal the old rope + 1 m
  const R = FACTS.earthRadiusM.value;
  const th = Math.acos(R / (R + PEAK_M));
  const lengthAdded = 2 * (R * Math.tan(th) - R * th);
  check(Math.abs(lengthAdded - 1) < 1e-3, `tent uses ${lengthAdded.toFixed(4)} m of extra rope; peak ${PEAK_M.toFixed(2)} m, touches down ${((R * th) / 1000).toFixed(1)} km away`);
  check(PEAK_M > peakWhole && PEAK_M > FACTS.statueM.value, `"over ${peakWhole} meters" > Statue of Liberty ${FACTS.statueM.value} m`);
  console.log(capitalise(numberWords(peakWhole)));
  if (!ok) process.exit(1);
}
