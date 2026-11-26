// Ep021 (style B): "What if you stood on Venus for one minute?" (Round 3 #37, Deadly place)
// The desert place in its no-plants mode (mars: true), under a thick orange cloud deck. Extras: glowing hot ground,
// a lead lump melting into a puddle, a pressure gauge board, acid-cloud slabs, a Venera-style lander.
import React from "react";
import * as THREE from "three";
import { ep021 } from "../../whatif/episodes/ep021";
import voices from "../../whatif/episodes/ep021.voices.json";
import { Box, Mat, type V3 } from "../core";
import { ANCHORS, originOf } from "../places";
import type { KitEp } from "../KitEpisode";

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const D = originOf("desert");
const POM_D = add(D, ANCHORS.desert.pom);

const Clouds: React.FC<{ frame: number }> = ({ frame }) => (
  <group position={D}>
    {/* the whole sky is thick orange-yellow cloud: no blue anywhere */}
    <mesh position={[0, -2, 0]}>
      <sphereGeometry args={[70, 24, 16]} />
      <meshBasicMaterial color="#D58A3C" side={THREE.BackSide} fog={false} />
    </mesh>
    {[[-14, 14, -20, 22], [8, 16, -26, 26], [22, 13, -14, 18], [-4, 18, -34, 30]].map(([x, y, z, w], i) => (
      <mesh key={i} position={[x + Math.sin(frame / 160 + i) * 1.2, y, z]} scale={[w, 1.6, 8]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color={i % 2 ? "#E8B24A" : "#F2C964"} transparent opacity={0.8} fog={false} />
      </mesh>
    ))}
  </group>
);

const HotGlow: React.FC<{ frame: number }> = ({ frame }) => (
  <group position={D}>
    {[[-3, 6], [4, 5], [-6, 2], [7, 0], [0, -3]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9 + 0.1 * Math.sin(frame / 12 + i), 16]} />
        <meshBasicMaterial color="#FF7A2E" transparent opacity={0.45} fog={false} />
      </mesh>
    ))}
  </group>
);

const LeadMelt: React.FC<{ p: V3; frame: number }> = ({ p, frame }) => {
  const k = Math.min(1, (frame % 90) / 70);
  return (
    <group position={p}>
      <Box s={[0.3, 0.3 * (1 - 0.8 * k), 0.3]} p={[0, 0.15 * (1 - 0.8 * k), 0]} color="#8C93A0" />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.2 + k * 0.5, 0.2 + k * 0.5, 1]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color="#B7BDC9" />
      </mesh>
    </group>
  );
};

const Lander: React.FC<{ p: V3; frame: number }> = ({ p, frame }) => (
  <group position={p} rotation={[0, 0.5 + Math.sin(frame / 120) * 0.05, 0]}>
    <mesh position={[0, 0.7, 0]}>
      <sphereGeometry args={[0.55, 16, 12]} />
      <Mat color="#B8BEC8" />
    </mesh>
    <Box s={[1.3, 0.12, 1.3]} p={[0, 0.25, 0]} color="#7B8190" />
    {[[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([x, z], i) => (
      <Box key={i} s={[0.1, 0.25, 0.1]} p={[x, 0.12, z]} color="#5A6070" />
    ))}
    <Box s={[0.04, 0.5, 0.04]} p={[0.3, 1.5, 0]} color="#D8DDE6" />
  </group>
);

export const k021: KitEp = {
  id: "k021",
  style: "B",
  base: { episode: ep021, voices },
  beats: [
    { line: 0, place: "desert", shot: "wide", env: "marsDusk", pom: { expr: "shocked", pose: "armsUp", outfit: "suit" } },
    { line: 1, place: "desert", shot: "medium", pom: { expr: "scared", pose: "idle", outfit: "suit" } },
    { line: 2, place: "desert", shot: "close", pom: { expr: "scared", pose: "hold", outfit: "suit" } },
    { line: 3, place: "desert", shot: "low", pom: { expr: "shocked", pose: "pointUp", outfit: "suit" } },
    { line: 4, place: "desert", shot: "wide", pom: { expr: "neutral", pose: "idle", outfit: "suit" } },
    { line: 5, place: "desert", shot: "medium", pom: { expr: "neutral", pose: "idle", outfit: "suit" } },
    { line: 6, place: "desert", shot: "medium", env: "marsDay", pom: { expr: "amazed", pose: "pointUp", outfit: "suit" } },
    { line: 7, place: "desert", shot: "wide", pom: { expr: "relieved", pose: "armsUp", outfit: "suit" } },
    { line: 8, place: "desert", shot: "close", pom: { expr: "relieved", pose: "armsUp", outfit: "suit" } },
  ],
  opts: () => ({ desert: { mars: true } }),
  moon: () => 0, // no moon on Venus
  extras: (c) => {
    const b = c.beat;
    const f = c.frame;
    return (
      <>
        <Clouds frame={f} />
        <HotGlow frame={f} />
        {b === 1 ? <LeadMelt p={add(POM_D, [0.9, 0, 0.5])} frame={f} /> : null}
        {b === 4 || b === 5 ? <Lander p={add(POM_D, [b === 4 ? 1.6 : 2.2, 0, -1.8])} frame={f} /> : null}
        {b === 6 || b === 7 ? <Lander p={add(POM_D, [0.8, 0, -1.2])} frame={f} /> : null}
      </>
    );
  },
  tags: (c) =>
    c.beat === 1
      ? [{ text: "LEAD MELTS AT 328 °C", at: add(POM_D, [0.9, 1.0, 0.5]), bg: "#FFD166" }]
      : c.beat === 3
          ? [{ text: "SULFURIC ACID CLOUDS", at: add(POM_D, [0, 5.5, -4]), bg: "#E4EBA8" }]
          : c.beat === 6
            ? [{ text: "VENERA 13 · 1982", at: add(POM_D, [0.6, 2.3, -1.2]), bg: "#9FE3FF" }]
            : [],
};
