// Ep018 (style B): "What if you held a teaspoon of neutron star?" (Round 3 #29, Absurd scale)
// A tiny glowing blue-white bead in Pom's hand; a stack of low-poly pyramids; the bead sinking through a
// cracked floor; a small neutron star (city on a glowing ball); a sugar cube with tiny people.
import React from "react";
import { random } from "remotion";
import { ep018 } from "../../whatif/episodes/ep018";
import voices from "../../whatif/episodes/ep018.voices.json";
import { Box, Mat, type V3 } from "../core";
import { ANCHORS, originOf, type PlaceId } from "../places";
import type { KitEp } from "../KitEpisode";

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const pomAt = (pl: PlaceId): V3 => add(originOf(pl), ANCHORS[pl].pom);

const Bead: React.FC<{ p: V3; frame: number; s?: number }> = ({ p, frame, s = 0.09 }) => (
  <group position={p}>
    <mesh scale={s * (1 + Math.sin(frame / 4) * 0.08)}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshBasicMaterial color="#DDF4FF" fog={false} />
    </mesh>
    <mesh scale={s * 2.4}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshBasicMaterial color="#6CC4FF" transparent opacity={0.35} fog={false} />
    </mesh>
  </group>
);

const Pyramid: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <mesh position={[p[0], p[1] + 0.5 * s, p[2]]} rotation={[0, Math.PI / 4, 0]} scale={s}>
    <coneGeometry args={[0.9, 1, 4]} />
    <Mat color="#E3C27A" />
  </mesh>
);

const Cracks: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={[p[0], 0.02, p[2]]}>
    {Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + random(`ca${i}`);
      const L = 0.8 + random(`cl${i}`) * 0.7;
      return <Box key={i} s={[L, 0.02, 0.05]} p={[Math.cos(a) * L * 0.5, 0, Math.sin(a) * L * 0.5]} r={[0, -a, 0]} color="#1A1A22" shadow={false} />;
    })}
  </group>
);

const NeutronStar: React.FC<{ p: V3; frame: number }> = ({ p, frame }) => (
  <group position={p} rotation={[0, frame / 90, 0]}>
    <mesh>
      <sphereGeometry args={[1.5, 24, 16]} />
      <meshBasicMaterial color="#BFE6FF" fog={false} />
    </mesh>
    <mesh scale={1.35}>
      <sphereGeometry args={[1.5, 24, 16]} />
      <meshBasicMaterial color="#5BB8FF" transparent opacity={0.25} fog={false} />
    </mesh>
    {/* city blocks on top: the star is the size of a city */}
    {[[-0.35, 0.8], [0, 1.0], [0.35, 0.85], [-0.15, 0.7], [0.2, 0.7]].map(([x, h], i) => (
      <Box key={i} s={[0.2, h * 0.5, 0.2]} p={[x, 1.5 + h * 0.2, 0.1 * i - 0.2]} color="#2A3A66" shadow={false} />
    ))}
  </group>
);

const SugarCube: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Box s={[0.9, 0.9, 0.9]} p={[0, 0.45, 0]} color="#F2F7FF" />
    <Box s={[0.94, 0.04, 0.94]} p={[0, 0.9, 0]} color="#CFE3FF" shadow={false} />
  </group>
);

const Crowd: React.FC<{ p: V3; frame: number }> = ({ p, frame }) => (
  <group position={p}>
    {Array.from({ length: 36 }, (_, i) => (
      <mesh key={i} position={[(random(`px${i}`) - 0.5) * 0.7, 0.05 + ((i * 7) % 6) * 0.14 + Math.sin(frame / 8 + i) * 0.01, (random(`pz${i}`) - 0.5) * 0.7]} scale={0.05}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial color={["#FF7A59", "#FFD166", "#6CC4FF", "#9BE564"][i % 4]} fog={false} />
      </mesh>
    ))}
  </group>
);

export const k018: KitEp = {
  id: "k018",
  style: "B",
  base: { episode: ep018, voices },
  beats: [
    { line: 0, place: "lab", shot: "close", env: "lab", pom: { expr: "shocked", pose: "hold" } },
    { line: 1, place: "lab", shot: "close", pom: { expr: "scared", pose: "hold" } },
    { line: 2, place: "lab", shot: "medium", pom: { expr: "amazed", pose: "pointUp" } },
    { line: 3, place: "street", shot: "medium", env: "day", pom: { expr: "scared", pose: "idle" } },
    { line: 4, place: "space", shot: "wide", env: "space", pom: { expr: "amazed", pose: "pointUp" } },
    { line: 5, place: "space", shot: "medium", pom: { expr: "neutral", pose: "idle" } },
    { line: 6, place: "lab", shot: "medium", env: "lab", pom: { expr: "amazed", pose: "pointUp" } },
    { line: 7, place: "lab", shot: "medium", pom: { expr: "relieved", pose: "hold" } },
    { line: 8, place: "lab", shot: "close", pom: { expr: "relieved", pose: "armsUp" } },
  ],
  moon: () => 0,
  extras: (c) => {
    const b = c.beat;
    const lab = pomAt("lab");
    const hand = add(lab, [0.3, 0.95, 0.45]);
    const st = pomAt("street");
    const sp = pomAt("space");
    return (
      <>
        {b <= 1 ? <Bead p={hand} frame={c.frame} s={b === 0 ? 0.08 : 0.1} /> : null}
        {b === 2 ? (
          <>
            <Bead p={hand} frame={c.frame} />
            {[[-1.2, -2.6], [0, -3.0], [1.2, -2.6], [-0.6, -3.4], [0.6, -3.4]].map(([x, z], i) => (
              <Pyramid key={i} p={add(lab, [x, 0, z])} s={0.55} />
            ))}
          </>
        ) : null}
        {b === 3 ? (
          <>
            <Cracks p={add(st, [0.3, 0, 0.45])} />
            <Bead p={add(st, [0.3, Math.max(0.05, 0.9 - ((c.frame % 60) / 60) * 0.85), 0.45])} frame={c.frame} />
          </>
        ) : null}
        {b === 4 || b === 5 ? <NeutronStar p={add(sp, [b === 4 ? 0.6 : 1.2, b === 4 ? 0.8 : 0.6, -3.2])} frame={c.frame} /> : null}
        {b === 6 ? (
          <>
            <SugarCube p={add(lab, [-0.4, 0, -1.2])} />
            <Crowd p={add(lab, [-0.4, 1.0, -1.2])} frame={c.frame} />
          </>
        ) : null}
        {b === 7 ? <SugarCube p={add(lab, [0.75, 0.5, 0.2])} /> : null}
      </>
    );
  },
  tags: (c) => {
    const lab = pomAt("lab");
    return c.beat === 2
      ? [{ text: "GREAT PYRAMID ≈ 5.9 MILLION T", at: add(lab, [0, 2.0, -3.0]), bg: "#FFD166" }]
      : c.beat === 6
        ? [{ text: "8 BILLION PEOPLE", at: add(lab, [-0.4, 2.1, -1.2]), bg: "#9FE3FF" }]
        : [];
  },
};
