// Episode 1, version 2: same premise and facts as ep001 (see FACTS there),
// on template 2 (log-zoom world camera). Run `node src/whatif/episodes/ep001v2.ts`
// to check every comparison.
import type { Episode, Rung } from "../types";
import { diameterAt, END_T, ep001, timeForDiameter } from "./ep001.ts";

// "about" comparisons switch to a "bigger than" label once the drop is >10% past them
const AFTER: Record<string, string> = {
  "A real raindrop": "Growing fast",
  "Marble size": "Bigger than a marble",
  "About a car long": "Longer than a car",
  "As tall as a house": "Taller than a house",
};

export const ep001v2: Episode = {
  ...ep001,
  id: "ep001v2",
  template: 2,
  rungs: ep001.rungs.map((r): Rung => (AFTER[r.label] ? { ...r, after: AFTER[r.label] } : r)),
  // The story clock moves during every line (and from frame 0), so the drop is always growing.
  lines: [
    { t: 0, to: 1, say: "What if a raindrop doubled in size, every second?", text: "What if a raindrop doubled in size every second?", whole: true },
    { t: 1.05, to: 1.6, say: "It started as a normal raindrop. Two millimeters wide.", text: "It started as a normal raindrop. 2 millimeters wide.", pause: 0.25 },
    { t: 2, to: 2.6, say: "Two seconds: eight millimeters. Already bigger than almost any real raindrop.", text: "2 seconds: 8 millimeters. Already bigger than almost any real raindrop." },
    { t: 3, to: 3.12, say: "Three seconds. The size of a marble.", text: "3 seconds. The size of a marble.", pause: 0.5 },
    { t: 7, to: 7.5, say: "Seven. Bigger than a football.", text: "7. Bigger than a football.", pause: 0.8 },
    { t: 11, to: 11.1, say: "Eleven. As long as a car.", text: "11. As long as a car.", pause: 0.8 },
    { t: 12, to: 12.1, say: "Twelve. As tall as a house.", text: "12. As tall as a house.", pause: 0.4 },
    { t: 16, to: 16.5, say: "Sixteen. Longer than a football field.", text: "16. Longer than a football field.", pause: 0.8 },
    { t: 19, to: 19.5, say: "Nineteen. Taller than any skyscraper on the planet.", text: "19. Taller than any skyscraper on the planet.", pause: 0.7 },
    { t: 20, to: 20.08, say: "At twenty seconds, it's two kilometers wide. It doesn't rain on the city. It swallows it.", text: "20 seconds: 2 kilometers wide. It doesn't rain on the city. It swallows it.", pause: 0.4, show: "city" },
    { t: 23, to: 23.5, say: "Twenty three. Taller than Mount Everest.", text: "23. Taller than Mount Everest.", pause: 0.7 },
    { t: 29, to: 29.3, say: "Twenty nine. Longer than the whole island of Java.", text: "29. Longer than the whole island of Java.", pause: 0.8 },
    { t: 29.4, to: 29.9, say: "And it holds more water than every ocean on Earth, combined.", text: "And it holds more water than every ocean on Earth, combined." },
    { t: 33, to: 33.3, say: "Thirty three seconds. It's wider than the Earth.", text: "33 seconds. It's wider than the Earth.", pause: 0.7 },
    { t: 33.4, to: 34, say: "Then it gets heavier than the Earth. So the raindrop doesn't fall on Earth.", text: "Then it gets heavier than the Earth. So the raindrop doesn't fall on Earth.", beat: "climax" },
    { t: 34, say: "Earth falls into the raindrop, and sinks to the middle, like a pebble.", text: "Earth falls into the raindrop, and sinks to the middle, like a pebble.", beat: "climax", show: "merge" },
    { t: 34, say: "Here's the twist. Every real raindrop grows around a tiny speck of dust.", text: "Here's the twist. Every real raindrop grows around a tiny speck of dust.", beat: "twist", pause: 0.6, show: "dust" },
    { t: 34, say: "This one just found its speck. Us.", text: "This one just found its speck. Us.", beat: "twist", show: "speck" },
    { t: 34, say: "What should double next? Comment below!", text: "What should double next? Comment below!", beat: "cta", pause: 0.5, show: "cta" },
  ],
};

// Self-test: every comparison must be true for the whole time its label is on screen.
// "about" labels are only shown while within 10% (then `after` takes over), so check
// the line windows that say them.
if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep001v2.ts")) {
  let ok = true;
  const say = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  for (const r of ep001v2.rungs) {
    const d = diameterAt(r.t);
    const pass = r.relation === "bigger" ? d > r.size : Math.abs(d / r.size - 1) <= 0.1;
    say(pass, `t=${r.t} ${r.label}: drop ${d.toPrecision(4)} m vs ${r.size.toPrecision(4)} m (first passes at t=${timeForDiameter(r.size).toFixed(2)})`);
  }
  // spoken "about" lines must still be within 10% when the line ends
  const aboutLines: [string, string][] = [["marble", "Marble size"], ["car", "About a car long"], ["house", "As tall as a house"]];
  for (const [word, label] of aboutLines) {
    const rung = ep001v2.rungs.find((r) => r.label === label)!;
    const line = ep001v2.lines.find((l) => l.say.includes(word))!;
    const dEnd = diameterAt(line.to ?? line.t);
    say(dEnd / rung.size <= 1.1, `line "${line.say}" ends at ${dEnd.toPrecision(4)} m, ${((dEnd / rung.size - 1) * 100).toFixed(1)}% past ${label}`);
  }
  // spoken numbers: "two kilometers" at t=20
  say(Math.abs(diameterAt(20.08) / 2000 - 1) < 0.15, `"two kilometers" line: ${(diameterAt(20) / 1000).toFixed(2)}-${(diameterAt(20.08) / 1000).toFixed(2)} km`);
  console.log(`end story time ${END_T}`);
  if (!ok) process.exit(1);
}
