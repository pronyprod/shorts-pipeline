// DROPPED 9 Nov (owner pivot), never rendered or registered; kept only because RingStage uses it. Was: "What if Earth had Saturn's rings?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep008.ts` to print and check them.
import type { Episode } from "../types";
import { capitalise, numberWords } from "../words.ts";

export const FACTS = {
  saturnRadiusKm: { value: 60_268, note: "Saturn's equatorial radius (1 bar level).", source: "NASA Saturn Fact Sheet (NSSDCA)" },
  earthRadiusKm: { value: 6_378.1, note: "Earth's equatorial radius. SIMPLIFICATION: the sky geometry treats Earth as a perfect sphere and ignores atmospheric refraction, so edge latitudes are good to a degree or so.", source: "NASA Earth Fact Sheet (NSSDCA)" },
  ringCInnerKm: { value: 74_658, note: "Inner edge of the C ring: where our rings start. SIMPLIFICATION: only the main C, B, A rings are used; the faint D, E, F and G rings are left out.", source: "NASA Saturnian Rings Fact Sheet (NSSDCA)" },
  ringCOuterKm: { value: 91_975, note: "C ring outer edge, B ring inner edge.", source: "NASA Saturnian Rings Fact Sheet (NSSDCA)" },
  ringBOuterKm: { value: 117_507, note: "B ring outer edge; the Cassini Division starts here.", source: "NASA Saturnian Rings Fact Sheet (NSSDCA)" },
  ringAInnerKm: { value: 122_340, note: "A ring inner edge; the Cassini Division ends here.", source: "NASA Saturnian Rings Fact Sheet (NSSDCA)" },
  ringAOuterKm: { value: 136_780, note: "A ring outer edge: where our rings end.", source: "NASA Saturnian Rings Fact Sheet (NSSDCA)" },
  ringThicknessM: { value: 10, note: "'Typically about 30 feet (10 meters) in the main rings'. APPROXIMATE: NSSDCA lists 5 m (C), 5-10 m (B), 10-30 m (A), and other estimates run higher.", source: "NASA Science, Saturn Facts" },
  ringMassKg: { value: 1.54e19, note: "Mass of all the rings, 1.54 +/- 0.49 x 10^19 kg. The test below uses the upper bound.", source: "Iess et al. 2019, Science 364, Cassini Grand Finale" },
  ringMassErrKg: { value: 0.49e19, note: "Uncertainty of the ring mass.", source: "Iess et al. 2019, Science 364" },
  antarcticaKm3: { value: 27_000_000, note: "Antarctic ice sheet volume, 'about 27 million km3'. APPROXIMATE (rounded in the source).", source: "Fretwell et al. 2013, The Cryosphere 7 (Bedmap2)" },
  iceKgM3: { value: 917, note: "Density of ice. APPROXIMATE for glacier ice with some firn; a lower value would still leave Antarctica ahead (see test).", source: "Standard value for ice at 0 C, CRC Handbook" },
  issKm: { value: 400, note: "Space Station's altitude. APPROXIMATE: it ranges roughly 370-460 km.", source: "NASA, International Space Station facts" },
  moonRadiusKm: { value: 1_737.4, note: "Moon's mean radius.", source: "NASA Moon Fact Sheet (NSSDCA)" },
  moonDistKm: { value: 384_400, note: "Mean Earth-Moon distance. The Moon's real apparent size varies a few percent over a month.", source: "NASA Moon Fact Sheet (NSSDCA)" },
  moonAlbedo: { value: 0.12, note: "Moon's geometric albedo. Used only for 'by day, like a pale Moon'.", source: "NASA Moon Fact Sheet (NSSDCA)" },
  ringAlbedo: { value: 0.4, note: "Lower end for the B and A rings (0.4-0.6). APPROXIMATE, and the C ring is darker (0.12-0.30). So the bright rings reflect more per area than the Moon, which is visible by day.", source: "NASA Saturnian Rings Fact Sheet (NSSDCA)" },
  paperMm: { value: 0.1, note: "Thickness of a sheet of office paper. APPROXIMATE, about 0.1 mm for 80 g/m2.", source: "ISO 216 office paper, typical manufacturer caliper" },
  ordovicianMa: { value: 466, note: "When a ring may have formed. UNCERTAIN: this is a hypothesis, still debated (some crater dates are disputed, Eos 2024). The voice says 'may have' and 'some geologists', the screen says 'still debated'.", source: "Tomkins, Martin & Cawood 2024, Earth and Planetary Science Letters 646, 118991" },
  ordovicianCraters: { value: 21, note: "Ordovician impact craters studied, all reconstructed to within 30 degrees of the equator, although about 70% of the continental crust lay outside that band.", source: "Tomkins, Martin & Cawood 2024, EPSL 646, 118991" },
  craterBandDeg: { value: 30, note: "Latitude band of those craters.", source: "Tomkins, Martin & Cawood 2024, EPSL 646, 118991" },
  iceLifetime: { value: 0, note: "UNCERTAIN, no number used, not in the voice: bare water ice in Earth's sunlight would sublimate far faster than it does at Saturn, so real ice rings wouldn't last here. The premise is a swap; we keep the rings as they are.", source: "General physics of ice in vacuum; our own caveat" },
} as const;

// ---- shrink to fit: Saturn's proportions around Earth ----
export const SCALE = FACTS.earthRadiusKm.value / FACTS.saturnRadiusKm.value;
const ratio = (km: number) => km / FACTS.saturnRadiusKm.value;
export const RINGS = {
  cIn: ratio(FACTS.ringCInnerKm.value),
  cOut: ratio(FACTS.ringCOuterKm.value),
  bOut: ratio(FACTS.ringBOuterKm.value),
  aIn: ratio(FACTS.ringAInnerKm.value),
  aOut: ratio(FACTS.ringAOuterKm.value),
};
export const START_KM = (RINGS.cIn - 1) * FACTS.earthRadiusKm.value;
export const END_KM = (RINGS.aOut - 1) * FACTS.earthRadiusKm.value;

// ---- what you see: sphere of radius 1, ring in the equatorial plane, you on the meridian at latitude phi ----
const RAD = Math.PI / 180;
// unit vector to a ring point: s = towards the equator along the ground, e = east, u = straight up
export const ringVector = (r: number, thetaRad: number, latDeg: number) => {
  const c = Math.cos(latDeg * RAD);
  const sn = Math.sin(latDeg * RAD);
  const x = r * Math.cos(thetaRad) - c;
  const y = r * Math.sin(thetaRad);
  const z = -sn;
  const n = Math.hypot(x, y, z);
  return { s: (x * sn - z * c) / n, e: y / n, u: (x * c + z * sn) / n };
};
// stereographic sky, centred where the ground meets the sky towards the equator: the horizon is a
// straight line, a point overhead is at Y = 1, and a ring seen edge on is a half circle.
export const skyXY = (r: number, thetaRad: number, latDeg: number) => {
  const v = ringVector(r, thetaRad, latDeg);
  return { x: v.e / (1 + v.s), y: v.u / (1 + v.s) };
};
// height above the horizon of a ring edge, due towards the equator
export const elevationDeg = (r: number, latDeg: number) => Math.asin(ringVector(r, 0, latDeg).u) / RAD;
export const widthDeg = (latDeg: number) => Math.max(0, elevationDeg(RINGS.aOut, latDeg)) - Math.max(0, elevationDeg(RINGS.cIn, latDeg));
export const MOON_DEG = (2 * Math.atan(FACTS.moonRadiusKm.value / FACTS.moonDistKm.value)) / RAD;
export const moonsAt = (latDeg: number) => widthDeg(latDeg) / MOON_DEG;

const peak = (() => {
  let best = 0;
  for (let l = 0; l <= 60; l += 0.05) if (widthDeg(l) > widthDeg(best)) best = l;
  return best;
})();
export const PEAK_LAT = Math.round(peak);
export const PEAK_DEG = widthDeg(PEAK_LAT);
export const PEAK_MOONS = Math.round(moonsAt(PEAK_LAT));
// the outer edge sinks below the horizon here
export const GONE_LAT = Math.acos(1 / RINGS.aOut) / RAD;

// ---- the thinness ----
export const WIDTH_KM = FACTS.ringAOuterKm.value - FACTS.ringCInnerKm.value;
export const PAPER_M = (WIDTH_KM * 1000 * (FACTS.paperMm.value / 1000)) / FACTS.ringThicknessM.value;
// the picture: 880 px for the whole system, tip to tip, and a 2 px line
export const LINE_TOO_THICK = (((2 * FACTS.ringAOuterKm.value) / 880) * 2 * 1000) / FACTS.ringThicknessM.value;

// ---- the ice ----
export const ANTARCTICA_KG = FACTS.antarcticaKm3.value * 1e9 * FACTS.iceKgM3.value;
export const ICE_PCT = Math.round((FACTS.ringMassKg.value / ANTARCTICA_KG) * 100);

// Story steps: 0-1.5 the rings in space | 1.5-2.5 equator | 2.5-3.5 walking out | 3.5-4 the peak |
// 4-5 day, then midnight | 5-6 the rings sink | 6-7.6 thin | 7.6-8 ice | 8-9 Earth's own ring.
const END_T = 9;
export const SKY_T = 1.5;
export const NIGHT_T = 4.5;
export const THIN_T = 6;
export const ICE_T = 7.6;
export const PAST_T = 8;

const lerpKeys = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return keys[keys.length - 1][1];
};
const FAR_LAT = 70; // northern Norway: Tromso is at 69.6 N
export const latAt = (t: number) => lerpKeys(t, [[2.5, 0], [3.5, PEAK_LAT], [5, PEAK_LAT], [5.65, GONE_LAT + 0.3], [6, FAR_LAT]]);

const reachKm = (t: number) => lerpKeys(t, [[0, 0], [1, END_KM]]);
const kmText = (km: number) => ({ value: Math.round(km).toLocaleString("en-US"), unit: "km" });
const startHundreds = Math.round(START_KM / 100);
const endThousands = Math.floor(END_KM / 1000);
const widthThousands = Math.floor(WIDTH_KM / 1000);
const paperHundreds = Math.floor(PAPER_M / 100) * 100;
const tooThick = Math.floor(LINE_TOO_THICK / 1000) * 1000;
export const TOO_THICK_TEXT = tooThick.toLocaleString("en-US");

export const ep008: Episode = {
  id: "ep008",
  template: 3,
  title: "What if Earth had Saturn's rings?",
  counterLabel: "Rings reach",
  ctaTitle: "WHAT SHOULD WE SWAP NEXT?",
  stage: "rings",
  endT: END_T,
  diameterAt: (t) => Math.max(1, reachKm(t) * 1000),
  clockText: (t) => {
    if (t < SKY_T) return "SHRUNK TO FIT";
    if (t < THIN_T) return `LATITUDE ${Math.round(latAt(t))}°`;
    if (t < PAST_T) return "REAL RINGS";
    return "ORDOVICIAN";
  },
  counterAt: (t) => {
    if (t < SKY_T) return { text: kmText(reachKm(t)) };
    if (t < 5) return { label: "Ring width in sky", text: { value: Math.round(moonsAt(latAt(t))).toString(), unit: "Moons" } };
    if (t < THIN_T) return { label: "Your latitude", text: { value: Math.round(latAt(t)).toString(), unit: "°" } };
    if (t < 7) return { label: "Saturn's ring width", text: kmText(lerpKeys(t, [[THIN_T, 0], [6.4, WIDTH_KM]])) };
    if (t < ICE_T) return { label: "Sheet of paper width", text: { value: Math.round(lerpKeys(t, [[7, 0], [7.4, PAPER_M]])).toString(), unit: "m" } };
    if (t < PAST_T) return { label: "Rings vs Antarctica", text: { value: Math.round(lerpKeys(t, [[ICE_T, 0], [7.9, ICE_PCT]])).toString(), unit: "%" } };
    if (t < 8.35) return { label: "Earth's own ring", mystery: true };
    if (t < 8.55) return { label: "Years ago", text: { value: Math.round(lerpKeys(t, [[8.35, 0], [8.5, FACTS.ordovicianMa.value]])).toString(), unit: "million" } };
    return { label: "Craters near equator", text: { value: Math.round(lerpKeys(t, [[8.55, 0], [8.85, FACTS.ordovicianCraters.value]])).toString(), unit: "" } };
  },
  rungs: [
    { t: 0.3, label: `Start ${Math.round(START_KM).toLocaleString("en-US")} km up`, icon: "drop", size: 1, relation: "about" },
    { t: 0.65, label: "Way past the Space Station", icon: "drop", size: 1, relation: "about" },
    { t: SKY_T, label: "Edge on: one thin line", icon: "drop", size: 1, relation: "about" },
    { t: 2.6, label: "It opens into an arch", icon: "drop", size: 1, relation: "about" },
    { t: 3.5, label: `${PEAK_DEG.toFixed(0)}° wide at its peak`, icon: "moon", size: 1, relation: "about" },
    { t: 4, label: "Visible by day", icon: "drop", size: 1, relation: "about" },
    { t: NIGHT_T, label: "Earth's shadow bites", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "The arch sinks", icon: "drop", size: 1, relation: "about" },
    { t: 5.65, label: "Gone below the horizon", icon: "drop", size: 1, relation: "about" },
    { t: THIN_T, label: "Only about 10 m thick", icon: "drop", size: 1, relation: "about" },
    { t: 7, label: "If 10 m = 1 sheet of paper", icon: "drop", size: 1, relation: "about" },
    { t: ICE_T, label: "Less ice than Antarctica", icon: "drop", size: 1, relation: "about" },
    { t: PAST_T, label: "Maybe it did", icon: "earth", size: 1, relation: "about" },
    { t: 8.35, label: "A long time ago", icon: "drop", size: 1, relation: "about" },
    { t: 8.55, label: `All within ${FACTS.craterBandDeg.value}° of it`, icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 0.3, say: "What if Earth had Saturn's rings?", text: "What if Earth had Saturn's rings?", whole: true },
    { t: 0.3, to: 1, say: `Same shape, shrunk to fit. They'd start about ${numberWords(startHundreds)} hundred kilometers up, and reach past ${numberWords(endThousands)} thousand.`, text: `Same shape, shrunk to fit. They'd start about ${(startHundreds * 100).toLocaleString("en-US")} kilometers up, and reach past ${(endThousands * 1000).toLocaleString("en-US")}.` },
    { t: 1, to: SKY_T, say: "The Space Station flies safely underneath.", text: "The Space Station flies safely underneath.", pause: 0.3 },
    { t: SKY_T, to: 2.5, say: "So what do you see? On the equator, almost nothing. Just one hair thin line, straight overhead.", text: "So what do you see? On the equator, almost nothing. Just one hair thin line, straight overhead.", pause: 0.4 },
    { t: 2.5, to: 3.5, say: "Walk away from the equator, and that line opens into a giant arch.", text: "Walk away from the equator, and that line opens into a giant arch." },
    { t: 3.5, to: 4, say: `${capitalise(numberWords(PEAK_LAT))} degrees out, it peaks. An arch about ${numberWords(PEAK_MOONS)} full Moons wide.`, text: `${PEAK_LAT} degrees out, it peaks. An arch about ${PEAK_MOONS} full Moons wide.`, beat: "climax", pause: 0.4 },
    { t: 4, to: 5, say: "You'd see it by day, like a pale Moon. At night it glows, except where Earth's shadow takes a bite.", text: "You'd see it by day, like a pale Moon. At night it glows, except where Earth's shadow takes a bite.", beat: "climax" },
    { t: 5, to: THIN_T, say: `Keep walking, and it sinks. Past ${numberWords(Math.round(GONE_LAT))} degrees, it drops below the horizon. Northern Norway would never see it.`, text: `Keep walking, and it sinks. Past ${Math.round(GONE_LAT)} degrees, it drops below the horizon. Northern Norway would never see it.`, pause: 0.4 },
    { t: THIN_T, to: 7, say: `Now the crazy part. Saturn's real rings are ${numberWords(widthThousands)} thousand kilometers wide, but typically about ${numberWords(FACTS.ringThicknessM.value)} meters thick.`, text: `Now the crazy part. Saturn's real rings are ${(widthThousands * 1000).toLocaleString("en-US")} kilometers wide, but typically about ${FACTS.ringThicknessM.value} meters thick.`, beat: "twist", pause: 0.5 },
    {
      t: 7,
      to: ICE_T,
      say: `Make that thickness one sheet of paper, and the sheet is over ${numberWords(paperHundreds)} meters wide.`,
      text: `Make that thickness one sheet of paper, and the sheet is over ${paperHundreds} meters wide.`,
      beat: "twist",
      show: "card",
      card: {
        title: "IF 10 M = ONE SHEET OF PAPER",
        lines: [`Rings: ${WIDTH_KM.toLocaleString("en-US")} km wide, about 10 m thick`, `Paper: ${FACTS.paperMm.value} mm thick`, `So the sheet is ${Math.round(PAPER_M)} m wide`],
      },
    },
    { t: ICE_T, to: PAST_T, say: "And all of those rings together hold less ice than Antarctica.", text: "And all of those rings together hold less ice than Antarctica.", beat: "twist" },
    { t: PAST_T, to: 8.35, say: "Here's the kicker. Earth may have really had one.", text: "Here's the kicker. Earth may have really had one.", beat: "twist", pause: 0.5 },
    {
      t: 8.35,
      to: END_T,
      say: `${capitalise(numberWords(FACTS.ordovicianMa.value))} million years ago, ${numberWords(FACTS.ordovicianCraters.value)} craters landed within ${numberWords(FACTS.craterBandDeg.value)} degrees of the equator. Some geologists blame a fallen ring.`,
      text: `${FACTS.ordovicianMa.value} million years ago, ${FACTS.ordovicianCraters.value} craters landed within ${FACTS.craterBandDeg.value} degrees of the equator. Some geologists blame a fallen ring.`,
      beat: "twist",
    },
    { t: END_T, say: "What should we swap next? The best comment becomes the next video.", text: "What should we swap next? The best comment becomes the next video.", beat: "cta", pause: 0.5, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("droppedRings.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(SCALE > 0.1 && SCALE < 0.11, `shrunk to fit: x${SCALE.toFixed(4)}`);
  check(Math.abs(START_KM - startHundreds * 100) < 50, `"about ${startHundreds} hundred kilometers up": ${START_KM.toFixed(0)} km`);
  check(END_KM > endThousands * 1000, `"past ${endThousands} thousand": ${END_KM.toFixed(0)} km`);
  check(FACTS.issKm.value + 60 < START_KM, `Space Station below the inner edge: ${FACTS.issKm.value} km vs ${START_KM.toFixed(0)} km`);
  check(widthDeg(0) < 0.001, `edge on at the equator: ${widthDeg(0).toFixed(5)} deg`);
  check(Math.abs(elevationDeg(RINGS.aOut, 0) - 90) < 0.001, `straight overhead at the equator: ${elevationDeg(RINGS.aOut, 0).toFixed(2)} deg`);
  check(Math.abs(moonsAt(PEAK_LAT) - PEAK_MOONS) < 0.5, `peak at ${peak.toFixed(2)} deg, said ${PEAK_LAT}: ${PEAK_DEG.toFixed(2)} deg, ${moonsAt(PEAK_LAT).toFixed(1)} Moons (Moon ${MOON_DEG.toFixed(3)} deg)`);
  for (const l of [PEAK_LAT - 8, PEAK_LAT + 8]) check(widthDeg(l) < widthDeg(PEAK_LAT), `narrower at ${l} deg: ${widthDeg(l).toFixed(1)}`);
  check(GONE_LAT > 63.5 && GONE_LAT < 64.5, `"past ${Math.round(GONE_LAT)} degrees": ${GONE_LAT.toFixed(2)} deg`);
  check(elevationDeg(RINGS.aOut, FAR_LAT) < -0.57 - 1, `below the horizon at Tromso, even with 0.57 deg of refraction: ${elevationDeg(RINGS.aOut, FAR_LAT).toFixed(2)} deg`);
  check(WIDTH_KM > widthThousands * 1000, `"${widthThousands} thousand kilometers wide": ${WIDTH_KM} km (NASA: 62,120 km)`);
  check(PAPER_M > paperHundreds, `"over ${paperHundreds} meters wide": ${PAPER_M.toFixed(1)} m`);
  check(LINE_TOO_THICK > tooThick, `2 px line over ${TOO_THICK_TEXT}x too thick: ${LINE_TOO_THICK.toFixed(0)}x`);
  check(FACTS.ringMassKg.value + FACTS.ringMassErrKg.value < ANTARCTICA_KG * 0.9, `less ice than Antarctica even at the upper bound and 10% less dense: ${ANTARCTICA_KG.toExponential(2)} kg, rings at most ${(FACTS.ringMassKg.value + FACTS.ringMassErrKg.value).toExponential(2)} kg; ${ICE_PCT}% at the mid value`);
  check(FACTS.ringAlbedo.value > FACTS.moonAlbedo.value, `bright rings reflect more than the Moon: ${FACTS.ringAlbedo.value} vs ${FACTS.moonAlbedo.value}`);
  // latitude only climbs, and the arch only grows up to the peak
  let last = -1;
  for (let t = 2.5; t <= 6; t += 0.01) {
    if (latAt(t) < last - 1e-9) check(false, `latitude fell at ${t}`);
    last = latAt(t);
  }
  last = -1;
  for (let t = 2.5; t <= 3.5; t += 0.01) {
    if (moonsAt(latAt(t)) < last - 1e-9) check(false, `arch shrank at ${t}`);
    last = moonsAt(latAt(t));
  }
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  if (!ok) process.exit(1);
}
