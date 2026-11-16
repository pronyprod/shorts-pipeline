// KIT TEST (D): Ep008 "What if you stepped into space without a suit?" in style D.
// Same script, voice, numbers and music as the published Ep008. One continuous camera:
// space, then down to the 1966 vacuum-chamber story. Pom wears a plain test suit as a
// stand-in for the real tester (never draw a real person's likeness).
import { interpolate, random } from "remotion";
import { ep008, SWELL_LINEAR } from "../../whatif/episodes/ep008";
import voices from "../../whatif/episodes/ep008.voices.json";
import { originOf } from "../places";
import type { KitEp } from "../KitEpisode";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SPACE = originOf("space");

export const k008d: KitEp = {
  id: "k008d",
  style: "D",
  base: { episode: ep008, voices },
  beats: [
    { line: 0, place: "space", shot: "medium", move: "push", env: "space", pom: { expr: "scared", pose: "armsUp", float: true } },
    { line: 1, place: "space", shot: "close", move: "push", pom: { expr: "shocked", float: true } },
    { line: 2, place: "space", shot: "close", move: "orbitL", pom: { expr: "scared", float: true } },
    { line: 3, place: "space", shot: "close", move: "orbitR", pom: { expr: "scared", float: true } },
    { line: 4, place: "space", shot: "medium", move: "pull", pom: { expr: "relieved", float: true } },
    { line: 5, place: "space", shot: "medium", move: "hold", pom: { expr: "shocked", pose: "armsUp", float: true } },
    { line: 6, place: "space", shot: "wide", move: "orbitR", pom: { expr: "scared", float: true } },
    { line: 7, place: "space", shot: "wide", move: "pull", pom: { expr: "scared", float: true } },
    { line: 8, place: "space", shot: "medium", move: "push", pom: { expr: "relieved", float: true } },
    { line: 9, place: "lab", shot: "wide", move: "drop", env: "lab", pom: { expr: "neutral", outfit: "suit", at: [-0.6, 0, 1.2] } },
    { line: 10, place: "lab", shot: "medium", move: "push", pom: { expr: "shocked", outfit: "suit", at: [-0.6, 0, 1.2] } },
    { line: 11, place: "lab", shot: "close", move: "orbitL", pom: { expr: "scared", outfit: "suit", at: [-0.6, 0, 1.2] } },
    { line: 12, place: "lab", shot: "board", move: "orbitR", pom: { expr: "relieved", outfit: "suit", at: [0.8, 0, 2.2] } },
    { line: 13, place: "lab", shot: "wide", move: "pull", pom: { expr: "neutral", pose: "pointUp", at: [1.6, 0, 2.4] } },
  ],
  // you swell to twice your volume = about 1.26x as wide (cube root of 2)
  opts: (c) => ({ lab: { chamber: c.beat >= 10 && c.beat <= 11 ? 1 : 0 } }),
  pomScale: (c) => (c.beat === 5 ? 1 + (SWELL_LINEAR - 1) * Math.min(1, c.p * 1.6) : c.beat === 6 || c.beat === 7 ? SWELL_LINEAR : 1),
  dim: (c) => interpolate(c.t, [6.7, 7.0, 8.0, 8.6], [0, 0.92, 0.92, 0], clamp),
  extras: (c) => {
    const pom = [SPACE[0], 1.4, 2] as const;
    const bubbles = c.beat >= 2 && c.beat <= 3;
    return (
      <>
        {/* spit boiling: little bubbles rising from Pom's mouth */}
        {bubbles
          ? Array.from({ length: 12 }, (_, i) => {
              const life = ((c.frame + i * 7) % 40) / 40;
              return (
                <mesh key={i} position={[pom[0] + (random(`bx${i}`) - 0.5) * 0.3, pom[1] + 1.26 + life * 0.7, pom[2] + 0.35]} scale={0.03 + life * 0.05}>
                  <sphereGeometry args={[1, 8, 6]} />
                  <meshStandardMaterial color="#DFF4FF" transparent opacity={0.85 * (1 - life)} emissive="#9FDCFF" emissiveIntensity={0.6} />
                </mesh>
              );
            })
          : null}
      </>
    );
  },
  tags: (c) => (c.beat >= 9 && c.beat <= 11 ? [{ text: "VACUUM CHAMBER", at: [originOf("lab")[0] - 2.0, 4.4, -1.6] as [number, number, number], bg: "#FFD166" }] : []),
};
