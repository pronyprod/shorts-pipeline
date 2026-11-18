// Ep016 (style D): "What if lightning hit you 7 times?" (Round 3 #28, real survivor: Roy Sullivan).
// A storm, one continuous camera: a bolt hits Pom at every strike (a truck, a garden, a guardhouse street,
// hair on fire twice, a lake), then the true story in plain sunlight, Pom in the plain test suit as a stand-in
// for the real ranger (never his likeness).
import React from "react";
import { random } from "remotion";
import { ep016 } from "../../whatif/episodes/ep016";
import voices from "../../whatif/episodes/ep016.voices.json";
import { Box, type V3 } from "../core";
import { ANCHORS, originOf, type PlaceId } from "../places";
import type { KitEp } from "../KitEpisode";

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const pomAt = (pl: PlaceId): V3 => add(originOf(pl), ANCHORS[pl].pom);

// a jagged bolt from the sky down to a point, drawn as thin glowing boxes
const Bolt: React.FC<{ to: V3; k: number }> = ({ to, k }) => {
  const n = 9;
  const top = 7;
  const pts: V3[] = Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const j = i === n ? 0 : (random(`bolt${i}`) - 0.5) * 1.1;
    return [to[0] + j + (1 - u) * 0.6, to[1] + (top - to[1]) * (1 - u), to[2] + (i === n ? 0 : (random(`bz${i}`) - 0.5) * 0.3)] as V3;
  });
  const on = k < 0.1 || (k > 0.16 && k < 0.24);
  if (!on) return null;
  return (
    <group>
      {pts.slice(1).map((b, i) => {
        const a = pts[i];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len = Math.hypot(dx, dy);
        return (
          <mesh key={i} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2]]} rotation={[0, 0, Math.atan2(dx, -dy) * -1]}>
            <boxGeometry args={[0.1, len, 0.1]} />
            <meshBasicMaterial color="#FFFBE0" />
          </mesh>
        );
      })}
      <pointLight position={[to[0], to[1] + 2, to[2] + 1]} intensity={60} color="#DDE8FF" distance={14} />
    </group>
  );
};

const Flames: React.FC<{ p: V3; frame: number }> = ({ p, frame }) => (
  <group position={p}>
    {[-0.18, 0, 0.18].map((x, i) => (
      <mesh key={i} position={[x, 0.15 * Math.sin(frame / 3 + i * 2) + 0.18, 0]} scale={[0.13, 0.3 + 0.08 * Math.sin(frame / 2 + i), 0.13]}>
        <coneGeometry args={[1, 1, 5]} />
        <meshBasicMaterial color={i === 1 ? "#FFD166" : "#FF7A2E"} />
      </mesh>
    ))}
  </group>
);

const Truck: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Box s={[2.4, 0.7, 1.2]} p={[0, 0.55, 0]} color="#B8453A" />
    <Box s={[1.1, 0.6, 1.1]} p={[-0.35, 1.15, 0]} color="#B8453A" />
    <Box s={[0.5, 0.4, 1.12]} p={[-0.45, 1.2, 0]} color="#8FC7F0" shadow={false} />
    {[-0.8, 0.8].map((x) => [-0.55, 0.55].map((z) => <Box key={`${x}${z}`} s={[0.4, 0.4, 0.15]} p={[x, 0.2, z]} color="#22262C" />))}
  </group>
);

const Rod: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Box s={[0.04, 1.6, 0.04]} p={[0.5, 1.0, 0.2]} r={[0, 0, -0.9]} color="#7A5A3A" />
    <Box s={[0.01, 1.2, 0.01]} p={[1.15, 0.5, 0.2]} color="#EEEEEE" shadow={false} />
  </group>
);

const POS: Record<number, PlaceId> = { 0: "forest", 1: "street", 2: "forest", 3: "street", 4: "street", 5: "ocean" };

export const k016: KitEp = {
  id: "k016",
  style: "D",
  base: { episode: ep016, voices },
  beats: [
    { line: 0, place: "forest", shot: "medium", move: "push", env: "night", board: false, pom: { expr: "shocked", pose: "armsUp" } },
    { line: 1, place: "street", shot: "medium", move: "orbitL", env: "night", board: false, pom: { expr: "scared", at: [-0.2, 0, 3.4] } },
    { line: 2, place: "forest", shot: "medium", move: "push", board: false, pom: { expr: "shocked" } },
    { line: 3, place: "street", shot: "close", move: "orbitR", board: false, pom: { expr: "scared", pose: "armsUp" } },
    { line: 4, place: "street", shot: "close", move: "push", board: false, pom: { expr: "shocked", pose: "armsUp" } },
    { line: 5, place: "ocean", shot: "medium", move: "pull", board: false, pom: { expr: "scared" } },
    { line: 6, place: "ocean", shot: "wide", move: "crane", env: "day", pom: { expr: "relieved", pose: "armsUp" } },
    { line: 7, place: "forest", shot: "medium", move: "push", env: "day", pom: { expr: "neutral", outfit: "suit" } },
    { line: 8, place: "forest", shot: "board", move: "orbitL", pom: { expr: "relieved", outfit: "suit" } },
    { line: 9, place: "forest", shot: "wide", move: "pull", env: "sunset", pom: { expr: "relieved", pose: "pointUp", outfit: "suit" } },
    { line: 10, place: "forest", shot: "wide", move: "pull", pom: { expr: "relieved", pose: "pointUp", outfit: "suit" } },
  ],
  moon: () => 0,
  extras: (c) => {
    const pl = POS[c.beat];
    const pom = pl ? pomAt(pl) : null;
    const hit = pom && c.beat <= 5;
    // beat 5 holds two strikes (six and seven)
    const k = c.beat === 5 ? (c.p < 0.5 ? c.p * 2 : (c.p - 0.5) * 2) : c.p;
    const pom1 = c.beat === 1 && pom ? ([pom[0] - 0.2, pom[1], pom[2]] as V3) : pom;
    return (
      <>
        {hit && pom1 ? <Bolt to={[pom1[0], pom1[1] + 1.9, pom1[2]]} k={k} /> : null}
        {c.beat === 1 && pom1 ? <group position={[pom1[0] - 0.1, 0, pom1[2] - 1.1]} scale={0.8}><Truck p={[0, 0, 0]} /></group> : null}
        {(c.beat === 3 || c.beat === 4) && pom ? <Flames p={[pom[0], pom[1] + 1.95, pom[2]]} frame={c.frame} /> : null}
        {c.beat === 5 && pom ? <Rod p={[pom[0], pom[1], pom[2]]} /> : null}
      </>
    );
  },
  tags: (c) => (c.beat === 7 ? [{ text: "RANGER ROY SULLIVAN", at: add(originOf("forest"), [0.4, 2.7, 3.0]) as V3, bg: "#FFD166" }] : []),
};
