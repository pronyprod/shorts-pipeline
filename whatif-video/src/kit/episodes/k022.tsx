// Ep022 (style B): "What if you stacked every LEGO brick ever made?" (Round 3 #36, Absurd scale)
// A colourful brick tower beside Pom on the street; in space the tower reaches the space station and the Moon;
// back on the street a cracked bottom brick.
import React from "react";
import { random } from "remotion";
import { ep022 } from "../../whatif/episodes/ep022";
import voices from "../../whatif/episodes/ep022.voices.json";
import { Box, type V3 } from "../core";
import { ANCHORS, originOf, type PlaceId } from "../places";
import type { KitEp } from "../KitEpisode";

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const pomAt = (pl: PlaceId): V3 => add(originOf(pl), ANCHORS[pl].pom);
const COLS = ["#E3000B", "#0055BF", "#FFD500", "#237841", "#FF7A2E", "#FFFFFF"];

const Brick: React.FC<{ p: V3; color: string; cracked?: boolean }> = ({ p, color, cracked }) => (
  <group position={p}>
    <Box s={[0.5, 0.3, 0.3]} p={[0, 0.15, 0]} color={color} />
    {[-0.15, 0.15].map((x, i) => <Box key={i} s={[0.12, 0.06, 0.12]} p={[x, 0.33, 0]} color={color} shadow={false} />)}
    {cracked ? <Box s={[0.5, 0.02, 0.02]} p={[0, 0.2, 0.16]} r={[0, 0, 0.5]} color="#1A1A22" shadow={false} /> : null}
  </group>
);

// a tower of n bricks, each one 0.3 high, alternating colours and a small offset like a real stack
const Tower: React.FC<{ p: V3; n: number; sway?: number }> = ({ p, n, sway = 0 }) => (
  <group position={p}>
    {Array.from({ length: n }, (_, i) => (
      <Brick key={i} p={[Math.sin(i * 1.7) * 0.02 + sway * (i / n) * (i / n), i * 0.3, 0]} color={COLS[i % COLS.length]} cracked={false} />
    ))}
  </group>
);

const Pile: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    {Array.from({ length: 40 }, (_, i) => (
      <Box key={i} s={[0.28, 0.16, 0.16]} p={[(random(`bx${i}`) - 0.5) * 2.2, 0.08 + (i % 4) * 0.16, (random(`bz${i}`) - 0.5) * 1.2]} r={[0, random(`br${i}`) * 3, 0]} color={COLS[i % COLS.length]} />
    ))}
  </group>
);

const Moon: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <mesh position={p} scale={s}>
    <sphereGeometry args={[1, 20, 14]} />
    <meshBasicMaterial color="#C9CCD3" fog={false} />
  </mesh>
);

const Station: React.FC<{ p: V3; frame: number }> = ({ p, frame }) => (
  <group position={p} rotation={[0, Math.sin(frame / 90) * 0.15, 0]}>
    <Box s={[0.5, 0.2, 0.2]} p={[0, 0, 0]} color="#D8DDE6" />
    <Box s={[0.08, 0.7, 0.02]} p={[-0.4, 0, 0]} color="#2F5BB8" shadow={false} />
    <Box s={[0.08, 0.7, 0.02]} p={[0.4, 0, 0]} color="#2F5BB8" shadow={false} />
  </group>
);

export const k022: KitEp = {
  id: "k022",
  style: "B",
  base: { episode: ep022, voices },
  beats: [
    { line: 0, place: "street", shot: "wide", env: "day", pom: { expr: "amazed", pose: "armsUp" } },
    { line: 1, place: "street", shot: "medium", pom: { expr: "neutral", pose: "pointUp" } },
    { line: 2, place: "space", shot: "wide", env: "space", pom: { expr: "amazed", pose: "pointUp" } },
    { line: 3, place: "space", shot: "medium", pom: { expr: "shocked", pose: "pointUp" } },
    { line: 4, place: "space", shot: "wide", pom: { expr: "shocked", pose: "armsUp" }, },
    { line: 5, place: "street", shot: "medium", env: "day", pom: { expr: "neutral", pose: "idle" } },
    { line: 6, place: "street", shot: "low", pom: { expr: "scared", pose: "pointUp" } },
    { line: 7, place: "street", shot: "close", pom: { expr: "relieved", pose: "hold" } },
    { line: 8, place: "street", shot: "close", pom: { expr: "relieved", pose: "armsUp" } },
  ],
  moon: () => 0,
  extras: (c) => {
    const b = c.beat;
    const st = pomAt("street");
    const sp = pomAt("space");
    return (
      <>
        {b === 0 ? <><Pile p={add(st, [-1.2, 0, -0.8])} /><Tower p={add(st, [1.0, 0, -0.6])} n={8} /></> : null}
        {b === 1 ? <><Pile p={add(st, [-1.4, 0, -1.0])} /><Tower p={add(st, [1.1, 0, -0.5])} n={12} /></> : null}
        {b === 2 ? <><Station p={add(sp, [1.3, 2.2, -2.6])} frame={c.frame} /><Tower p={add(sp, [-1.2, -0.6, -1.6])} n={14} /></> : null}
        {b === 3 ? <><Tower p={add(sp, [-1.0, -0.6, -1.6])} n={18} /><Moon p={add(sp, [1.6, 2.0, -4])} s={1.1} /></> : null}
        {b === 4 ? (
          <>
            <Tower p={add(sp, [-1.6, -0.6, -1.6])} n={18} />
            {Array.from({ length: 15 }, (_, i) => <Moon key={i} p={add(sp, [-0.6 + i * 0.5, 0.3 + i * 0.22, -4])} s={0.22} />)}
          </>
        ) : null}
        {b === 5 ? <Tower p={add(st, [1.0, 0, -0.6])} n={10} sway={0.15} /> : null}
        {b === 6 ? <><Tower p={add(st, [0.9, 0, -0.6])} n={16} sway={0.35} /><Brick p={add(st, [1.9, 0, -0.2])} color="#E3000B" cracked /></> : null}
        {b === 7 ? <Brick p={add(st, [0.55, 0.9, 0.35])} color="#FFD500" cracked /> : null}
      </>
    );
  },
  tags: (c) => {
    const st = pomAt("street");
    const sp = pomAt("space");
    return c.beat === 1
      ? [{ text: "≈ 70 BRICKS PER PERSON", at: add(st, [0, 2.2, -0.6]), bg: "#FFD166" }]
      : c.beat === 2
        ? [{ text: "SPACE STATION ≈ 400 KM", at: add(sp, [1.3, 3.0, -2.6]), bg: "#9FE3FF" }]
        : c.beat === 3
          ? [{ text: "MOON ≈ 384,400 KM", at: add(sp, [1.2, 2.5, -4]), bg: "#E5E7EB" }]
          : c.beat === 4
            ? [{ text: "15 × TO THE MOON", at: add(sp, [0.6, 2.9, -4]), bg: "#FFD166" }]
            : c.beat === 6
              ? [{ text: "375,000 BRICKS ≈ 3.5 KM", at: add(st, [0.1, 2.6, -0.6]), bg: "#FF9A8B" }]
              : [];
  },
};
