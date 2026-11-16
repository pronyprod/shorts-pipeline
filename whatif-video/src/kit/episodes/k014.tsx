// Ep014 "What if you stayed awake for 30 days?" in style P (pixel look, D's continuous camera).
// Night town with a fast alarm clock (day 1) -> glowing things that aren't there -> microsleep blinks ->
// eleven day-blocks light up (hour 264) -> a sleep lab (Pom in the plain suit stands in for the real student,
// never his likeness): a bed, then a trophy with a red cross -> the town at sunset.
import { Box, Disc, type V3 } from "../core";
import { ANCHORS, originOf } from "../places";
import type { KitEp } from "../KitEpisode";
import { ep014 } from "../../whatif/episodes/ep014";
import voices from "../../whatif/episodes/ep014.voices.json";

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const NT = originOf("nightTown");
const LAB = originOf("lab");
const smooth = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));

// a chunky alarm clock whose minute hand spins
const Clock: React.FC<{ p: V3; frame: number; speed: number; s?: number }> = ({ p, frame, speed, s = 1 }) => (
  <group position={p} scale={s}>
    <Disc r={0.6} p={[0, 0.7, 0]} color="#F4F1EA" segs={16} />
    <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.62, 0.62, 0.12, 16]} />
      <meshToonMaterial color="#D7263D" />
    </mesh>
    <Box s={[0.1, 0.1, 0.1]} p={[0, 0.7, 0.1]} color="#222" shadow={false} />
    <group position={[0, 0.7, 0.1]} rotation={[0, 0, -frame * speed]}>
      <Box s={[0.07, 0.45, 0.04]} p={[0, 0.22, 0]} color="#222" shadow={false} />
    </group>
    <group position={[0, 0.7, 0.1]} rotation={[0, 0, -frame * speed / 12]}>
      <Box s={[0.08, 0.3, 0.04]} p={[0, 0.15, 0]} color="#222" shadow={false} />
    </group>
    <Box s={[0.12, 0.12, 0.12]} p={[-0.4, 1.4, 0]} color="#FFD166" shadow={false} />
    <Box s={[0.12, 0.12, 0.12]} p={[0.4, 1.4, 0]} color="#FFD166" shadow={false} />
  </group>
);

// glowing shapes that aren't really there
const GHOSTS = Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2, r: 1.1 + (i % 3) * 0.5, y: 0.6 + (i % 4) * 0.5 }));
const Ghosts: React.FC<{ p: V3; frame: number; amount: number }> = ({ p, frame, amount }) => (
  <group position={p}>
    {GHOSTS.slice(0, Math.round(GHOSTS.length * amount)).map((g, i) => (
      <mesh key={i} position={[Math.cos(g.a + frame / 40) * g.r, g.y + Math.sin(frame / 18 + i) * 0.15, Math.sin(g.a + frame / 40) * g.r]} rotation={[frame / 25 + i, frame / 30, 0]} scale={0.2}>
        <octahedronGeometry args={[1, 0]} />
        <meshToonMaterial color={i % 2 ? "#B388FF" : "#4DD0E1"} emissive={i % 2 ? "#7C4DFF" : "#00ACC1"} emissiveIntensity={0.9} />
      </mesh>
    ))}
  </group>
);

// eleven day-blocks in a row; they light up one by one
const Days: React.FC<{ p: V3; lit: number }> = ({ p, lit }) => (
  <group position={p}>
    {Array.from({ length: 11 }, (_, i) => (
      <Box key={i} s={[0.34, 0.34, 0.12]} p={[(i - 5) * 0.42, 0.2 + (i % 2) * 0.0, 0]} color={i < lit ? "#FFD166" : "#3A3F5C"} emissive={i < lit ? "#FFB300" : undefined} ei={i < lit ? 0.7 : 0} shadow={false} />
    ))}
  </group>
);

const Bed: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Box s={[1.8, 0.3, 1.0]} p={[0, 0.2, 0]} color="#6D4C41" />
    <Box s={[1.7, 0.22, 0.92]} p={[0, 0.46, 0]} color="#F4F1EA" />
    <Box s={[0.5, 0.16, 0.7]} p={[-0.55, 0.66, 0]} color="#BBDEFB" />
    <Box s={[1.0, 0.1, 0.94]} p={[0.35, 0.62, 0]} color="#5C7CFA" />
  </group>
);

const Trophy: React.FC<{ p: V3; cross: number }> = ({ p, cross }) => (
  <group position={p}>
    <Box s={[0.7, 0.2, 0.5]} p={[0, 0.1, 0]} color="#5D4037" />
    <mesh position={[0, 0.7, 0]} castShadow>
      <cylinderGeometry args={[0.38, 0.14, 0.7, 10]} />
      <meshToonMaterial color="#FFC107" emissive="#B8860B" emissiveIntensity={0.4} />
    </mesh>
    <Box s={[0.12, 0.4, 0.12]} p={[0, 0.3, 0]} color="#FFC107" />
    {cross > 0 ? (
      <group position={[0, 0.7, 0.5]} scale={cross}>
        <Box s={[1.5, 0.16, 0.08]} r={[0, 0, Math.PI / 4]} color="#D7263D" emissive="#D7263D" ei={0.6} shadow={false} />
        <Box s={[1.5, 0.16, 0.08]} r={[0, 0, -Math.PI / 4]} color="#D7263D" emissive="#D7263D" ei={0.6} shadow={false} />
      </group>
    ) : null}
  </group>
);

export const k014: KitEp = {
  id: "k014",
  style: "D",
  look: "pixel",
  base: { episode: ep014, voices },
  beats: [
    { line: 0, place: "nightTown", shot: "medium", move: "push", env: "night", pom: { expr: "shocked", pose: "armsUp" }, trail: ["You", "30 days"] },
    { line: 1, place: "nightTown", shot: "close", move: "orbitL", pom: { expr: "scared" }, trail: ["You", "Hour 24"] },
    { line: 2, place: "nightTown", shot: "medium", move: "orbitR", pom: { expr: "shocked", pose: "pointUp" }, trail: ["You", "Your memory"] },
    { line: 3, place: "nightTown", shot: "close", move: "push", pom: { expr: "scared" }, trail: ["You", "Microsleeps"] },
    { line: 4, place: "nightTown", shot: "wide", move: "pull", env: "sunset", pom: { expr: "scared", pose: "armsUp" }, trail: ["You", "Hour 264"] },
    { line: 5, place: "lab", shot: "medium", move: "drop", env: "lab", pom: { expr: "neutral", pose: "pointUp", outfit: "suit" }, trail: ["Randy Gardner", "1964"] },
    { line: 6, place: "lab", shot: "medium", move: "orbitL", pom: { expr: "relieved", outfit: "suit" }, trail: ["Randy Gardner", "After"], sfx: ["pop"] },
    { line: 7, place: "lab", shot: "medium", move: "push", pom: { expr: "neutral", pose: "hold", outfit: "suit" }, trail: ["Guinness", "No tracking"] },
    { line: 8, place: "street", shot: "wide", move: "pull", env: "sunset", pom: { expr: "relieved", pose: "pointUp" }, trail: ["You", "Next?"] },
  ],
  dim: (c) => {
    if (c.beat !== 3) return 0;
    // three short blink-outs: your brain napping for a moment
    return Math.max(0, ...[0.22, 0.52, 0.78].map((a) => 0.85 * Math.min(smooth(c.p, a, a + 0.04), 1 - smooth(c.p, a + 0.07, a + 0.11))));
  },
  extras: (c) => {
    const nt = add(NT, ANCHORS.nightTown.pom);
    const lab = add(LAB, ANCHORS.lab.pom);
    return (
      <>
        {c.beat <= 4 ? <Clock p={add(nt, [-0.95, 0, 0.9])} frame={c.frame} speed={c.beat === 0 ? 0.25 : c.beat === 4 ? 0.9 : 0.5} s={0.8} /> : null}
        {c.beat === 2 ? <Ghosts p={add(nt, [0, 0, 0])} frame={c.frame} amount={smooth(c.p, 0.3, 0.9)} /> : null}
        {c.beat === 4 ? <Days p={add(nt, [0.4, 2.4, -0.4])} lit={Math.round(smooth(c.p, 0.05, 0.85) * 11)} /> : null}
        {c.beat === 6 ? <Bed p={add(lab, [-1.6, 0, 0.4])} /> : null}
        {c.beat === 7 ? <Trophy p={add(lab, [-1.4, 0, 0.6])} cross={smooth(c.p, 0.4, 0.55)} /> : null}
      </>
    );
  },
};

