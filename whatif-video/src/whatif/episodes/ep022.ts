// Episode 22 (Round 3 #36, category: Absurd scale): "What if you stacked every LEGO brick ever made?"
// Every number comes from FACTS (sourced) or the formulas below.
// Run `node src/whatif/episodes/ep022.ts` to print and check them.
import type { Episode } from "../types";

export const FACTS = {
  totalPieces: { value: 600e9, note: "About 600 billion LEGO elements produced as of July 2015 (400 billion in 2008 per Time, 28 Jan 2008). APPROXIMATE and a floor: output has continued since. The script treats every piece as one standard brick ('count each piece as one brick'), which is a deliberate simplification: plates and small parts are shorter, so the real stack would be somewhat lower.", source: "UK Intellectual Property Office blog, Dec 2016 (600 billion as of July 2015); Time, Leo Cendrowicz, 28 Jan 2008 (400 billion); both cited on Wikipedia 'Lego'" },
  brickHeightMm: { value: 9.6, note: "A standard LEGO brick is 9.6 mm tall without the stud (studs fit inside the brick above, so a stack adds 9.6 mm per brick).", source: "LEGO brick dimensions: LUGNET FAQ / BrickOwl / BrickLink help (9.6 mm brick, 3.2 mm plate, stud 1.7 mm)" },
  people: { value: 8.3e9, note: "World population about 8.3 billion in 2026.", source: "UN World Population Prospects 2024 (via PRB 2026 data sheet, Worldometer)" },
  issKm: { value: 400, note: "The International Space Station orbits at roughly 400 km (it varies with reboosts and drag).", source: "NASA ISS facts (nasa.gov/international-space-station)" },
  moonKm: { value: 384400, note: "Average Earth-Moon distance 384,400 km.", source: "NASA Moon Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)" },
  crushBricks: { value: 375000, note: "Open University engineers with BBC Radio 4 'More or Less' (2012) crushed a 2x2 brick in a press: it failed at about 4,240 N (about 432 kg); one brick weighs 1.152 g, so about 375,000 bricks stacked would crush the bottom one, a tower about 3.5 km tall. APPROXIMATE (ideal straight tower, 2x2 brick).", source: "BBC Radio 4 More or Less / Open University, Dec 2012; reported by Gizmodo, The Brothers Brick (4 Dec 2012)" },
  crushKg: { value: 432, note: "Failure load of a 2x2 brick: about 4,240 N = about 432 kg. The script says 'about four hundred and thirty kilograms'.", source: "Same BBC More or Less / Open University test (2012)" },
} as const;

const END_T = 9;
export const CLIMAX_T = 4;
export const TWIST_T = 6;

const mmToKm = 1e-6;
export const towerKm = (FACTS.totalPieces.value * FACTS.brickHeightMm.value) * mmToKm;
export const piecesPerPerson = FACTS.totalPieces.value / FACTS.people.value;
export const bricksToIss = (FACTS.issKm.value / mmToKm) / FACTS.brickHeightMm.value;
export const moonTrips = towerKm / FACTS.moonKm.value;
export const crushKm = (FACTS.crushBricks.value * FACTS.brickHeightMm.value) * mmToKm;

// height counter (km): log-interpolated between knots that match what the voice says
const KNOTS: [number, number][] = [[0.2, 0.01], [3, FACTS.issKm.value], [3.7, FACTS.moonKm.value], [4.4, towerKm]];
export const heightAt = (t: number) => {
  if (t <= KNOTS[0][0]) return KNOTS[0][1];
  for (let i = 1; i < KNOTS.length; i++) {
    const [t0, v0] = KNOTS[i - 1];
    const [t1, v1] = KNOTS[i];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      const e = k * k * (3 - 2 * k);
      return Math.exp(Math.log(v0) + (Math.log(v1) - Math.log(v0)) * e);
    }
  }
  return towerKm;
};
const fmtKm = (v: number) => {
  if (v >= 1e6) return (v / 1e6).toFixed(1) + " million";
  if (v >= 1000) return Math.round(v).toLocaleString("en-US");
  if (v >= 10) return String(Math.round(v));
  return v.toFixed(1);
};

export const ep022: Episode = {
  id: "ep022",
  template: 3,
  title: "What if you stacked every LEGO brick ever made?",
  counterLabel: "Tower height",
  ctaTitle: "WHAT SHOULD WE STACK NEXT?",
  endT: END_T,
  diameterAt: () => 1,
  clockText: (t) => (t < TWIST_T ? "600 BILLION BRICKS" : "ON EARTH"),
  counterAt: (t) => {
    if (t < TWIST_T) return { text: { value: fmtKm(heightAt(t)), unit: "km" } };
    return { label: "Tower before the bottom brick cracks", text: { value: "3.5", unit: "km" } };
  },
  rungs: [
    { t: 0.05, label: "≈ 600 billion bricks", icon: "drop", size: 1, relation: "about" },
    { t: 1, label: "≈ 70 bricks for every person", icon: "drop", size: 1, relation: "about" },
    { t: 2, label: "≈ 42 million bricks to the space station", icon: "drop", size: 1, relation: "about" },
    { t: 3, label: "≈ heading for the Moon", icon: "drop", size: 1, relation: "about" },
    { t: 4.45, label: "≈ 5.8 million km, the Moon trip 15 times", icon: "drop", size: 1, relation: "about" },
    { t: 5, label: "≈ not on Earth", icon: "drop", size: 1, relation: "about" },
    { t: TWIST_T, label: "≈ 375,000 bricks crush the bottom one", icon: "drop", size: 1, relation: "about" },
    { t: 7, label: "≈ one brick holds about 430 kg", icon: "drop", size: 1, relation: "about" },
  ],
  lines: [
    { t: 0, to: 1, say: "You stack every LEGO piece ever made. Six hundred billion of them.", text: "You stack every LEGO piece ever made. 600 billion of them.", keys: ["every LEGO piece", "600 billion"] },
    { t: 1, to: 2, say: "Count each piece as one brick, under a centimetre tall. That's seventy for every person alive.", text: "Count each piece as one brick, under a centimetre tall. That's 70 for every person alive.", keys: ["under a centimetre", "70 for every person"], pause: 0.3 },
    { t: 2, to: 3, say: "Forty-two million bricks reach the space station, four hundred kilometres up.", text: "42 million bricks reach the space station, 400 kilometres up.", keys: ["42 million bricks", "space station"], pause: 0.3 },
    { t: 3, to: 4, say: "Keep going, and your tower sails right past the Moon.", text: "Keep going, and your tower sails right past the Moon.", keys: ["right past the Moon"], pause: 0.3 },
    { t: CLIMAX_T, to: 5, say: "All six hundred billion would stretch five point eight million kilometres. That's the trip to the Moon, fifteen times over.", text: "All 600 billion would stretch 5.8 million kilometres. That's the trip to the Moon, 15 times over.", keys: ["5.8 million kilometres", "15 times over"], beat: "climax", pause: 0.35 },
    { t: 5, to: TWIST_T, say: "But on Earth, it would never get that far.", text: "But on Earth, it would never get that far.", keys: ["never get that far"], pause: 0.3 },
    { t: TWIST_T, to: 7, say: "Just three hundred and seventy-five thousand bricks, about three and a half kilometres, would crush the one at the bottom.", text: "Just 375,000 bricks, about 3.5 kilometres, would crush the one at the bottom.", keys: ["375,000 bricks", "crush", "3.5 kilometres"], beat: "twist", pause: 0.45 },
    { t: 7, to: END_T, say: "One little brick holds about four hundred and thirty kilograms, and then it cracks.", text: "One little brick holds about 430 kilograms, and then it cracks.", keys: ["430 kilograms", "then it cracks"], beat: "twist", pause: 0.3 },
    { t: END_T, say: "What should we stack next? The best comment becomes the next video.", text: "What should we stack next? The best comment becomes the next video.", beat: "cta", pause: 0.4, show: "cta" },
  ],
};

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("ep022.ts")) {
  let ok = true;
  const check = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    console.log(`${pass ? "OK  " : "FAIL"} ${msg}`);
  };
  check(ep022.title.length < 50, `title under 50 characters: ${ep022.title.length}`);
  check(Math.round(piecesPerPerson) === 72, `${piecesPerPerson.toFixed(1)} pieces per person ("seventy")`);
  check(Math.round(bricksToIss / 1e6) === 42, `${(bricksToIss / 1e6).toFixed(1)} million bricks to 400 km ("forty-two million")`);
  check(Math.abs(towerKm / 1e6 - 5.8) < 0.05, `tower ${(towerKm / 1e6).toFixed(2)} million km ("five point eight")`);
  check(Math.round(moonTrips) === 15, `${moonTrips.toFixed(2)} Moon distances ("fifteen")`);
  check(Math.abs(crushKm - 3.5) < 0.15, `375,000 bricks = ${crushKm.toFixed(2)} km ("about three and a half")`);
  check(Math.abs(FACTS.crushKg.value - 4240 / 9.81) < 1, `4240 N = ${(4240 / 9.81).toFixed(0)} kg ("about four hundred and thirty")`);
  check(crushKm < FACTS.issKm.value, "the crush height is far below the space station");
  let last = -1;
  let rising = true;
  for (let t = 0; t < TWIST_T; t += 0.01) { const h = heightAt(t); if (h < last - 1e-6) rising = false; last = h; }
  check(rising && Math.abs(heightAt(4.4) - towerKm) < 1, "height counter only climbs and ends at the tower height");
  check(Math.abs(heightAt(3) - 400) < 1 && Math.abs(heightAt(3.7) - 384400) < 1, "counter is at 400 km (space station line) and at the Moon distance (Moon line)");
  for (const l of ep022.lines) for (const k of l.keys ?? []) check(l.text.includes(k), `key "${k}" is in its line`);
  for (const l of ep022.lines) check(!/you see/i.test(l.say), "no 'You see'");
  for (const [name, f] of Object.entries(FACTS)) check(!!f.source, `${name} has a source`);
  const words = ep022.lines.map((l) => l.say).join(" ").split(/\s+/).length;
  check(words >= 90 && words <= 135, `script: ${words} words`);
  if (!ok) process.exit(1);
}
