// Ep015 (style B): "What if you stood on Mars as a volcano woke?" (timely, Nov 2026)
// The desert place is repainted rust-red (our own flat disc over the sand), with a very wide, very low
// cone behind (Alba Mons's half-degree slope), dark fissures and pale gas puffs near Pom.
import React from "react";
import { random } from "remotion";
import { ep015 } from "../../whatif/episodes/ep015";
import voices from "../../whatif/episodes/ep015.voices.json";
import { Box, Disc, Mat, type V3 } from "../core";
import { ANCHORS, originOf } from "../places";
import type { KitEp } from "../KitEpisode";

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const D = originOf("desert");
const POM_D = add(D, ANCHORS.desert.pom);
const RUST = "#B5532F";

const MarsGround: React.FC = () => (
  <group position={D}>
    <Disc r={44} p={[0, 0.03, 0]} color={RUST} />
    {/* a very wide, very low volcano */}
    <mesh position={[0, 0, -34]} scale={[26, 3.2, 14]} castShadow>
      <sphereGeometry args={[1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Mat color="#9C4426" />
    </mesh>
    <mesh position={[0, 3.0, -34]} scale={[5, 0.5, 3]}>
      <sphereGeometry args={[1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Mat color="#7E361E" />
    </mesh>
    {Array.from({ length: 16 }, (_, i) => (
      <mesh key={i} position={[-14 + random(`mx${i}`) * 28, 0.2, 1 - random(`mz${i}`) * 16]} scale={0.3 + random(`ms${i}`) * 0.5}>
        <icosahedronGeometry args={[0.6, 0]} />
        <Mat color="#8A3C22" />
      </mesh>
    ))}
  </group>
);

// a jagged crack: a few dark boxes end to end
const Crack: React.FC<{ at: V3; yaw: number; len: number }> = ({ at, yaw, len }) => (
  <group position={at} rotation={[0, yaw, 0]}>
    {Array.from({ length: 6 }, (_, i) => (
      <Box key={i} s={[len / 6, 0.03, 0.09 + (i % 2) * 0.05]} p={[-len / 2 + (i + 0.5) * (len / 6), 0.06, (i % 2 ? 0.05 : -0.05)]} r={[0, (i % 2 ? 0.25 : -0.25), 0]} color="#2A130C" shadow={false} />
    ))}
  </group>
);
const Gas: React.FC<{ at: V3; frame: number; n?: number }> = ({ at, frame, n = 9 }) => (
  <group position={at}>
    {Array.from({ length: n }, (_, i) => {
      const u = (((frame * 0.012 + random(`g${i}`)) % 1) + 1) % 1;
      return (
        <mesh key={i} position={[(random(`gx${i}`) - 0.5) * 1.4 + Math.sin(u * 5 + i) * 0.15, 0.1 + u * 2.4, (random(`gz${i}`) - 0.5) * 0.4]} scale={0.12 + u * 0.28}>
          <sphereGeometry args={[1, 8, 6]} />
          <Mat color="#E4EBA8" rough={1} />
        </mesh>
      );
    })}
  </group>
);

export const k015: KitEp = {
  id: "k015",
  style: "B",
  base: { episode: ep015, voices },
  beats: [
    { line: 0, place: "desert", shot: "wide", env: "sunset", pom: { expr: "shocked", pose: "armsUp" } },
    { line: 1, place: "desert", shot: "far", pom: { expr: "amazed", pose: "pointUp" } },
    { line: 2, place: "desert", shot: "low", pom: { expr: "relieved", pose: "run", at: [-0.4, 0, 3.2], to: [1.4, 0, 3.2] } },
    { line: 3, place: "desert", shot: "close", pom: { expr: "scared", pose: "idle" } },
    { line: 4, place: "desert", shot: "medium", pom: { expr: "scared", pose: "armsUp" } },
    { line: 5, place: "desert", shot: "wide", env: "night", pom: { expr: "scared", pose: "hold" } },
    { line: 6, place: "desert", shot: "wide", env: "sunset", pom: { expr: "amazed", pose: "pointUp" } },
    { line: 7, place: "desert", shot: "high", env: "sunset", pom: { expr: "neutral", pose: "idle" } },
    { line: 8, place: "desert", shot: "wide", pom: { expr: "relieved", pose: "armsUp" } },
  ],
  extras: (c) => {
    const f = c.frame;
    const b = c.beat;
    return (
      <>
        <MarsGround />
        {b === 3 || b === 4 || b === 5 || b === 7 ? (
          <>
            <Crack at={add(POM_D, [-1.3, 0, -1.6])} yaw={0.4} len={2.4} />
            <Crack at={add(POM_D, [1.6, 0, -2.4])} yaw={-0.3} len={3} />
            <Crack at={add(POM_D, [-0.2, 0, -3.4])} yaw={0.15} len={2.2} />
          </>
        ) : null}
        {b === 6 ? (
          <group position={add(POM_D, [1.0, 3.4, -1.5])} rotation={[0, 0.5 + f * 0.01, 0]}>
            <Box s={[0.5, 0.3, 0.3]} color="#D8DDE6" />
            <Box s={[1.1, 0.03, 0.35]} color="#3B63B8" />
          </group>
        ) : null}
        {b === 3 || b === 4 ? <Gas at={add(POM_D, [-1.3, 0, -1.6])} frame={f} /> : null}
        {b === 3 || b === 4 ? <Gas at={add(POM_D, [1.6, 0, -2.4])} frame={f + 40} /> : null}
        {b === 5 ? (
          <Box s={[2.6, 0.04, 0.5]} p={add(POM_D, [-1.3, 0.1, -1.6])} r={[0, 0.4, 0]} color="#EAF6FF" shadow={false} />
        ) : null}
      </>
    );
  },
  tags: (c) =>
    c.beat === 1
      ? [{ text: "ALBA MONS ≈ 2,000 KM", at: add(D, [0, 4.2, -30]), bg: "#FFD166" }]
      : c.beat === 3
        ? [{ text: "HCl GAS", at: add(POM_D, [-0.6, 2.6, -1.6]), bg: "#E4EBA8" }]
        : c.beat === 6
          ? [{ text: "EXOMARS ORBITER", at: add(POM_D, [1.0, 4.2, -1.5]), bg: "#9FE3FF" }]
          : [],
};
