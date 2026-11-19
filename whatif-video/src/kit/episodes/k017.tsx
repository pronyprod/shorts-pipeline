// Ep017 (style B): "What if you sank to the Mariana Trench floor?" (Round 3 #27, Deadly place)
// Beat 0 is the sunlit surface (ocean place). Every deeper beat is the same ocean place but Pom floats far out
// of its scenery, inside a dark-water sphere that gets darker with depth; marine snow drifts up past him.
// No plants, no sky, no sun underwater. Floor, Titanic, Everest and the snailfish are low-poly extras.
import React from "react";
import { interpolateColors, random } from "remotion";
import { ep017 } from "../../whatif/episodes/ep017";
import voices from "../../whatif/episodes/ep017.voices.json";
import { Box, Mat, type V3 } from "../core";
import { originOf } from "../places";
import type { KitEp } from "../KitEpisode";

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const O = originOf("ocean");
const FAR: V3 = [100, 0, 4.6]; // Pom's local spot, well clear of the ocean place's pier, beach and lighthouse
const DEEP = add(O, FAR);
const SURF: V3 = [0.5, -0.45, -2];

const waterColor = (t: number) => interpolateColors(Math.min(Math.max(t, 1), 4), [1, 2, 3, 4], ["#0E5C8E", "#0A3A63", "#04162A", "#020A14"]);

const Snow: React.FC<{ frame: number; n?: number }> = ({ frame, n = 40 }) => (
  <group position={DEEP}>
    {Array.from({ length: n }, (_, i) => {
      const u = (((frame * 0.004 * (0.6 + random(`su${i}`)) + random(`sp${i}`)) % 1) + 1) % 1;
      return (
        <mesh key={i} position={[(random(`sx${i}`) - 0.5) * 12, -3 + u * 8, (random(`sz${i}`) - 0.5) * 8]} scale={0.03 + random(`ss${i}`) * 0.04}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#B9D6E8" transparent opacity={0.5} fog={false} />
        </mesh>
      );
    })}
  </group>
);

const Water: React.FC<{ t: number }> = ({ t }) => (
  <mesh position={DEEP}>
    <sphereGeometry args={[9, 24, 16]} />
    <meshBasicMaterial color={waterColor(t)} side={1} fog={false} />
  </mesh>
);

const Floor: React.FC = () => (
  <group position={DEEP}>
    <Box s={[18, 0.3, 18]} p={[0, -0.17, 0]} color="#5A5648" shadow={false} />
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[-5 + random(`fx${i}`) * 10, 0.05, -4 + random(`fz${i}`) * 3]} scale={0.25 + random(`fs${i}`) * 0.35}>
        <icosahedronGeometry args={[0.6, 0]} />
        <Mat color="#4A473B" />
      </mesh>
    ))}
  </group>
);

const Wreck: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p} rotation={[0, 0.5, 0.12]}>
    <Box s={[5.2, 0.7, 1.1]} p={[0, 0, 0]} color="#6B7E90" shadow={false} />
    <mesh position={[2.9, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <coneGeometry args={[0.55, 0.9, 4]} />
      <Mat color="#6B7E90" />
    </mesh>
    <Box s={[1.4, 0.35, 0.8]} p={[-0.6, 0.5, 0]} color="#7A8EA2" shadow={false} />
    {[-1.4, -0.6].map((x) => <Box key={x} s={[0.25, 0.7, 0.25]} p={[x, 0.95, 0]} color="#7A8EA2" shadow={false} />)}
  </group>
);

const Snailfish: React.FC<{ p: V3; frame: number }> = ({ p, frame }) => (
  <group position={[p[0] + Math.sin(frame / 25) * 0.35, p[1] + Math.sin(frame / 18) * 0.1, p[2]]} rotation={[0, -0.5, Math.sin(frame / 12) * 0.05]}>
    <mesh scale={[0.55, 0.3, 0.3]}>
      <sphereGeometry args={[1, 14, 10]} />
      <meshStandardMaterial color="#F3D9D6" emissive="#8A6F6C" roughness={0.6} transparent opacity={0.92} />
    </mesh>
    <mesh position={[-0.55, 0, 0]} rotation={[0, 0, Math.sin(frame / 6) * 0.35]} scale={[0.4, 0.22, 0.04]}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color="#EBC9C6" roughness={0.6} transparent opacity={0.85} />
    </mesh>
    <mesh position={[0.35, 0.05, 0.2]} scale={0.045}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial color="#1A1A24" />
    </mesh>
    <mesh position={[0.35, 0.05, -0.2]} scale={0.045}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial color="#1A1A24" />
    </mesh>
  </group>
);

// pressure: arrows pointing at Pom from all sides, pulsing in
const Squeeze: React.FC<{ p: V3; frame: number }> = ({ p, frame }) => (
  <group position={p}>
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI * 2;
      const r = 1.9 - 0.35 * (0.5 + 0.5 * Math.sin(frame / 5 + i));
      return (
        <mesh key={i} position={[Math.cos(a) * r, 1.0 + Math.sin(a * 2) * 0.35, Math.sin(a) * r * 0.5 + 0.3]} rotation={[0, 0, a + Math.PI / 2 + Math.PI]}>
          <coneGeometry args={[0.16, 0.45, 4]} />
          <meshBasicMaterial color="#FF9F6B" fog={false} />
        </mesh>
      );
    })}
  </group>
);

const pomPos = (y = 2): V3 => [FAR[0], y, FAR[2]];

export const k017: KitEp = {
  id: "k017",
  style: "B",
  base: { episode: ep017, voices },
  beats: [
    { line: 0, place: "ocean", shot: "medium", env: "day", pom: { expr: "scared", pose: "armsUp", at: SURF, float: true } },
    { line: 1, place: "ocean", shot: "medium", env: "night", pom: { expr: "shocked", pose: "idle", at: pomPos(), float: true } },
    { line: 2, place: "ocean", shot: "medium", pom: { expr: "amazed", pose: "pointUp", at: pomPos(), float: true } },
    { line: 3, place: "ocean", shot: "close", pom: { expr: "scared", pose: "idle", at: pomPos(), float: true } },
    { line: 4, place: "ocean", shot: "medium", pom: { expr: "shocked", pose: "armsUp", at: pomPos(0) } },
    { line: 5, place: "ocean", shot: "close", pom: { expr: "scared", pose: "idle", at: pomPos(0) } },
    { line: 6, place: "ocean", shot: "medium", pom: { expr: "amazed", pose: "pointUp", at: pomPos(0) } },
    { line: 7, place: "ocean", shot: "medium", pom: { expr: "amazed", pose: "pointUp", at: [FAR[0] - 0.5, 0.2, FAR[2]], float: true } },
    { line: 8, place: "ocean", shot: "medium", pom: { expr: "neutral", pose: "idle", at: [FAR[0] - 0.5, 0.2, FAR[2]], float: true } },
    { line: 9, place: "ocean", shot: "close", pom: { expr: "relieved", pose: "armsUp", at: pomPos(), float: true } },
  ],
  opts: () => ({ ocean: { waves: 0.6 } }),
  moon: () => 0,
  extras: (c) => {
    const b = c.beat;
    if (b === 0) return null;
    const deepFloor = b >= 4 && b <= 6;
    return (
      <>
        <Water t={b === 1 ? 1 : b === 2 ? 2 : b === 3 ? 3 : 4} />
        <Snow frame={c.frame} />
        {deepFloor ? <Floor /> : null}
        {b === 2 ? <Wreck p={add(DEEP, [0.9, 0.8, -2.4])} /> : null}
        {b === 3 || b === 5 ? <Squeeze p={add(DEEP, [0, b === 3 ? 2 : 0, 0])} frame={c.frame} /> : null}
        {b === 6 ? (
          <mesh position={add(DEEP, [1.2, 1.8, -3.4])}>
            <coneGeometry args={[1.9, 3.6, 6]} />
            <Mat color="#B4B8C0" />
          </mesh>
        ) : null}
        {b === 7 || b === 8 ? <Snailfish p={add(DEEP, [0.55, 1.5, -0.9])} frame={c.frame} /> : null}
      </>
    );
  },
  tags: (c) =>
    c.beat === 2
      ? [{ text: "TITANIC ≈ 3,800 M", at: add(DEEP, [0.3, 1.9, -2.6]), bg: "#9FE3FF" }]
      : c.beat === 6
        ? [{ text: "EVEREST 8,849 M", at: add(DEEP, [1.3, 2.4, -3.4]), bg: "#FFD166" }]
        : c.beat === 7
          ? [{ text: "SNAILFISH · 8,336 M", at: add(DEEP, [0.2, 2.75, -0.9]), bg: "#F3D9D6" }]
          : [],
};
