// KIT mode tests (11 Nov): 10-15 s clips from already-voiced scripts (0 Gemini requests).
import { ep007, VANISH_T } from "../../whatif/episodes/ep007";
import v007 from "../../whatif/episodes/ep007.voices.json";
import { ep008 } from "../../whatif/episodes/ep008";
import v008 from "../../whatif/episodes/ep008.voices.json";
import { ep009 } from "../../whatif/episodes/ep009";
import v009 from "../../whatif/episodes/ep009.voices.json";
import { BODY, houseRidge, originOf } from "../places";
import { Pile } from "../props";
import type { KitEp } from "../KitEpisode";

// D with the new shading: a night town (lamps, lit windows, rim light), then space, then back
export const tShadeD: KitEp = {
  id: "tShadeD",
  style: "D",
  untilLine: 2,
  base: { episode: ep007, voices: v007 },
  beats: [
    { line: 0, place: "nightTown", shot: "board", move: "push", env: "night", pom: { expr: "neutral", pose: "pointUp" } },
    { line: 1, place: "nightTown", shot: "medium", move: "orbitL", pom: { expr: "shocked" } },
    { line: 2, place: "street", shot: "wide", move: "crane", pom: { expr: "scared" } },
    { line: 3, place: "street", shot: "board", move: "pull", pom: { expr: "scared", pose: "armsUp" } },
  ],
  moon: (c) => (c.t < VANISH_T ? 1 : 0),
};

// Style A: the flat look (cel colours, orthographic camera), B's cuts, with the voice
const ST = originOf("street");
export const tFlatA: KitEp = {
  id: "tFlatA",
  style: "B",
  look: "flat",
  untilLine: 3,
  base: { episode: ep009, voices: v009 },
  beats: [
    { line: 0, place: "street", shot: "board", env: "day", pom: { expr: "neutral", pose: "pointUp" }, falling: 0.5 },
    { line: 1, place: "street", shot: "close", pom: { expr: "relieved", pose: "hold" }, falling: 0.4 },
    { line: 2, place: "street", shot: "wide", env: "sunset", pom: { expr: "shocked", at: [2.4, 0, 3.8] }, falling: 0.9 },
    { line: 3, place: "street", shot: "wide", pom: { expr: "scared", pose: "armsUp", at: [2.4, 0, 3.8] }, falling: 1 },
  ],
  opts: (c) => ({ street: { sag: c.beat === 2 ? c.p * 0.7 : c.beat === 3 ? 0.7 : 0, collapse: c.beat === 3 ? Math.min(1, Math.max(0, (c.p - 0.15) * 2.5)) : 0 } }),
  extras: (c) => (c.beat === 2 ? <Pile p={[ST[0], houseRidge(c.p * 0.7) - 0.35, 0]} w={2.2 + c.p * 2} h={0.15 + c.p * 1.35} /> : c.beat === 3 ? <Pile p={[ST[0], 0, 0]} w={4 + c.p * 3} h={1.5 + c.p} /> : null),
};

// Style P: the pixel look; the continuous camera goes deeper, and the trail follows it
export const tPixelP: KitEp = {
  id: "tPixelP",
  style: "D",
  look: "pixel",
  untilLine: 3,
  base: { episode: ep008, voices: v008 },
  beats: [
    { line: 0, place: "space", shot: "medium", move: "push", env: "space", pom: { expr: "scared", pose: "armsUp", float: true }, trail: ["You", "Space"] },
    { line: 1, place: "body", shot: "medium", move: "drop", env: "body", pom: { expr: "shocked", at: BODY.lungs }, trail: ["You", "Your lungs"] },
    { line: 2, place: "body", shot: "medium", move: "push", pom: { expr: "scared", at: BODY.mouth }, trail: ["You", "Your mouth", "Your spit"] },
    { line: 3, place: "body", shot: "close", move: "orbitL", pom: { expr: "scared", at: BODY.mouth }, trail: ["You", "Your mouth", "Your tongue"] },
  ],
  opts: (c) => ({ body: { breath: c.beat === 1 ? 3 : 1, boil: c.beat >= 2 ? 1 : 0 } }),
};

// Style A without the narrator (the old style C option): text cards + music only
export const tFlatC: KitEp = { ...tFlatA, id: "tFlatC", voice: false };

// 12 Nov: lively captions + matched sound effects, style B, Ep009 lines 1-5 (counting numbers, a cave-in, the climax)
export const tLiveB: KitEp = {
  id: "tLiveB",
  style: "B",
  untilLine: 4,
  // key phrases by meaning (normally they sit on the episode's lines as `keys`)
  keys: { 0: ["1 trillion", "Right now"], 1: ["about a gram"], 2: ["Statue of Liberty's"], 3: ["caves in"], 4: ["11,000 tonnes", "Eiffel Tower"] },
  base: { episode: ep009, voices: v009 },
  beats: [
    { line: 0, place: "street", shot: "board", env: "day", pom: { expr: "shocked", pose: "pointUp" }, falling: 0.6 },
    { line: 1, place: "street", shot: "close", pom: { expr: "relieved", pose: "hold" }, falling: 0.4 },
    { line: 2, place: "street", shot: "wide", env: "sunset", pom: { expr: "shocked", at: [2.4, 0, 3.8] }, falling: 0.9 },
    { line: 3, place: "street", shot: "wide", pom: { expr: "scared", pose: "armsUp", at: [2.4, 0, 3.8] }, falling: 1 },
    { line: 4, place: "nightTown", shot: "wide", env: "night", pom: { expr: "shocked", pose: "armsUp" }, falling: 0.5 },
  ],
  opts: (c) => ({ street: { sag: c.beat === 2 ? c.p * 0.7 : c.beat === 3 ? 0.7 : 0, collapse: c.beat === 3 ? Math.min(1, Math.max(0, (c.p - 0.15) * 2.5)) : 0 } }),
  extras: (c) => (c.beat === 2 ? <Pile p={[ST[0], houseRidge(c.p * 0.7) - 0.35, 0]} w={2.2 + c.p * 2} h={0.15 + c.p * 1.35} /> : c.beat === 3 ? <Pile p={[ST[0], 0, 0]} w={4 + c.p * 3} h={1.5 + c.p} /> : null),
};
export const tLiveBdry: KitEp = { ...tLiveB, id: "tLiveBdry", sfx: false };
// level check: voice alone / music + effects alone
export const tLiveBvoice: KitEp = { ...tLiveB, id: "tLiveBvoice", mute: "bed" };
export const tLiveBbed: KitEp = { ...tLiveB, id: "tLiveBbed", mute: "voice" };
