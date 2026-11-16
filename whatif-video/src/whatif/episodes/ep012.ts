// Episode 12 (Round 3 #24, category: Real survivor): "What if a whale swallowed you?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep012.ts` to print and check them.
import type { Episode } from "../types";
import { numberWords } from "../words.ts";

export const FACTS = {
  packardDate: { value: 2021, note: "Friday 11 June 2021, off Provincetown (Cape Cod), Massachusetts: a humpback whale engulfed commercial lobster diver Michael Packard and spat him out.", source: "CBS News, 'Cape Cod diver survives being trapped in humpback whale's mouth' (June 2021); Cape Cod Times, 11 June 2021; National Geographic, 'Humpback whales can't swallow a human. Here's why.' (M. Hobson, 15 June 2021)" },
  depthFt: { value: 45, note: "Packard was about 45 feet (14 m) down when the whale engulfed him. The voice puts 'you' at the same depth.", source: "Live Science, 'Humpback whale swallows lobster diver before spitting him out' (June 2021); NBC Boston (June 2021)" },
  insideMinS: { value: 30, note: "Packard's own estimate of the time inside the closed mouth: 30 to 40 seconds (NatGeo says 'about 30 seconds'). APPROXIMATE: his estimate.", source: "CBS News / Cape Cod Times (June 2021): 'about 30 to 40 seconds'; National Geographic (15 June 2021)" },
  insideMaxS: { value: 40, note: "Upper end of Packard's 30-40 s estimate.", source: "CBS News / Cape Cod Times (June 2021)" },
  spatOut: { value: 1, note: "The whale rose to the surface, shook its head and spat him out; his crewman Josiah Mayo pulled him from the water.", source: "CBS News; KUOW/NPR, 'A lobster diver in Cape Cod says a humpback whale scooped him up and spat him out' (June 2021)" },
  noBrokenBones: { value: 0, note: "Treated at Cape Cod Hospital and released the same afternoon: bruises / soft tissue damage, no broken bones.", source: "National Geographic (15 June 2021): 'soft tissue damage but no broken bones'; NBC Boston (June 2021)" },
  throatFist: { value: 1, note: "A humpback's throat is roughly the size of a human fist; scientifically impossible for it to swallow a human (Nicola Hodgins, Whale and Dolphin Conservation).", source: "National Geographic, 'Humpback whales can't swallow a human. Here's why.' (15 June 2021)" },
  throatStretchIn: { value: 15, note: "The throat can only stretch to about 15 inches (38 cm) across. The voice says 'about fifteen inches'.", source: "National Geographic (15 June 2021), citing Whale and Dolphin Conservation" },
  diet: { value: 1, note: "Baleen whales like humpbacks eat tiny prey: plankton, krill and small fish, sieved from a huge gulp of seawater.", source: "National Geographic (15 June 2021); NOAA Fisheries, Humpback Whale species page" },
  humpbackSize: { value: 60, note: "Humpbacks grow up to about 60 feet long and about 40 tons (used only for the drawing's proportions, not spoken).", source: "NOAA Fisheries, Humpback Whale species page (Quick Facts)" },
  timeline: { value: 1, note: "APPROXIMATE / illustrative: the second-by-second steps (dark at second 1, rising by second 15, out by second 30) are our own telling of Packard's 30-40 s account; only the total and the order of events are from the sources.", source: "Our illustration of the CBS News / Cape Cod Times account" },
} as const;

// ---- the numbers ----
export const OUT_S = FACTS.insideMinS.value; // spat out at "second thirty"
export const RISE_S = 15;
const lerpKeys = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, va] = keys[i - 1];
    const [b, vb] = keys[i];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return keys[keys.length - 1][1];
};

// Story steps (one per line): 0 hook (mouth closes) | 1 second one | 2 second five | 3-4 throat = fist |
// 5 second fifteen (rising) | 6 second thirty, spat out (climax) | 7-9 twist (Packard 2021) | 10 CTA.
const END_T = 10;
export const CLIMAX_T = 6;
export const TWIST_T = 7;
export const secondsAt = (t: number) => lerpKeys(t, [[0, 0.2], [1, 1], [2, 5], [3, 8], [4, 11], [5, RISE_S], [CLIMAX_T, OUT_S]]);

const yearWords = `${numberWords(Math.floor(FACTS.packardDate.value / 100))} ${numberWords(FACTS.packardDate.value % 100)}`;

export const ep012: Episode = {
  id: "ep012",
  template: 3,
  title: "What if a whale swallowed you?",
  counterLabel: "Inside the whale",
  ctaTitle: "WHAT SHOULD YOU SURVIVE NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < TWIST_T ? `SECOND ${Math.max(0, Math.floor(secondsAt(t)))}` : "REAL STORY"),
  counterAt: (t) => {
    if (t < TWIST_T) return { text: { value: String(Math.floor(secondsAt(t))), unit: "s" } };
    return { label: "Packard: up to", text: { value: String(FACTS.insideMaxS.value), unit: "s" } }; // his 30-40 s estimate (the board draws "-" as a dot, so only the upper end)
  },
  rungs: [
    { t: 0.05, label: "Pitch black", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: `${FACTS.depthFt.value} ft (14 m) underwater`, icon: "drop", size: 1, relation: "about" },
    { t: 2, label: "Squeezed on every side", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "Throat ≈ your fist", icon: "drop", size: 1, relation: "about" },
    { t: 4, label: `Stretches to ~${FACTS.throatStretchIn.value} in (38 cm)`, icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "Rising to the surface", icon: "drop", size: 1, relation: "about" },
    { t: CLIMAX_T, label: "Spat out!", icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: "Cape Cod, June 2021", icon: "drop", size: 1, relation: "about" },
    { t: 8, label: "No broken bones", icon: "drop", size: 1, relation: "about" },
    { t: 9, label: "Diet: krill + small fish", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "A whale just closed its mouth around you. It's pitch black.", text: "A whale just closed its mouth around you. It's pitch black.", keys: ["closed its mouth", "pitch black"] },
    { t: 1, to: 2, say: `Second one. You're ${numberWords(FACTS.depthFt.value)} feet down, squeezed from every side.`, text: `Second 1. You're ${FACTS.depthFt.value} feet down, squeezed from every side.`, keys: ["45 feet", "squeezed"], pause: 0.3 },
    { t: 2, to: 3, say: "Second five. You can't see. You can't push your way out.", text: "Second 5. You can't see. You can't push your way out.", keys: ["can't see", "push your way out"], pause: 0.3 },
    { t: 3, to: 4, say: "Good news. A humpback's throat is about the size of your fist.", text: "Good news. A humpback's throat is about the size of your fist.", keys: ["Good news", "your fist"], pause: 0.35 },
    { t: 4, to: 5, say: `Even stretched, it's about ${numberWords(FACTS.throatStretchIn.value)} inches. It can't swallow you.`, text: `Even stretched, it's about ${FACTS.throatStretchIn.value} inches. It can't swallow you.`, keys: ["15 inches", "can't swallow you"], pause: 0.3 },
    { t: 5, to: CLIMAX_T, say: `Second ${numberWords(RISE_S)}. The whale starts rising to the surface.`, text: `Second ${RISE_S}. The whale starts rising to the surface.`, keys: ["the surface"], pause: 0.3 },
    { t: CLIMAX_T, to: TWIST_T, say: `Second ${numberWords(OUT_S)}. It shakes its head and spits you out.`, text: `Second ${OUT_S}. It shakes its head and spits you out.`, keys: ["Second 30", "spits you out"], beat: "climax", pause: 0.35 },
    { t: TWIST_T, to: 8, say: `This really happened. In June ${yearWords}, a humpback scooped up diver Michael Packard.`, text: `This really happened. In June ${FACTS.packardDate.value}, a humpback scooped up diver Michael Packard.`, keys: ["really happened", "Michael Packard"], beat: "twist", pause: 0.45 },
    { t: 8, to: 9, say: `He was inside for ${numberWords(FACTS.insideMinS.value)} to ${numberWords(FACTS.insideMaxS.value)} seconds, and broke no bones.`, text: `He was inside for ${FACTS.insideMinS.value} to ${FACTS.insideMaxS.value} seconds, and broke no bones.`, keys: ["40 seconds", "no bones"], beat: "twist", pause: 0.3 },
    { t: 9, to: END_T, say: "Humpbacks eat krill and small fish. You were never on the menu.", text: "Humpbacks eat krill and small fish. You were never on the menu.", keys: ["krill", "never on the menu"], beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should you survive next? The best comment becomes the next video.", text: "What should you survive next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep012.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep012.title.length < 50, `title under 50 characters: ${ep012.title.length}`);
  check(yearWords === "twenty twenty one", `spoken year: ${yearWords}`);
  check(OUT_S >= FACTS.insideMinS.value && OUT_S <= FACTS.insideMaxS.value, `spat out at second ${OUT_S}, inside Packard's ${FACTS.insideMinS.value}-${FACTS.insideMaxS.value} s`);
  check(Math.abs(FACTS.depthFt.value * 0.3048 - 14) < 0.5, `45 ft = ${(FACTS.depthFt.value * 0.3048).toFixed(1)} m (board says 14 m)`);
  check(Math.abs(FACTS.throatStretchIn.value * 2.54 - 38) < 0.5, `15 in = ${(FACTS.throatStretchIn.value * 2.54).toFixed(1)} cm (board says 38 cm)`);
  check(Math.round(secondsAt(1)) === 1 && Math.round(secondsAt(2)) === 5 && Math.round(secondsAt(5)) === RISE_S && secondsAt(CLIMAX_T) === OUT_S, "counter shows the spoken second at each line start");
  let last = -Infinity;
  let rising = true;
  for (let t = 0.01; t <= CLIMAX_T; t += 0.01) {
    if (secondsAt(t) <= last) rising = false;
    last = secondsAt(t);
  }
  check(rising, "seconds only climb");
  for (const l of ep012.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep012.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
