// Ep012 "What if a whale swallowed you?" in style D (paper cut-out Pom, one continuous camera).
// Inside a humpback's closed mouth (dark, baleen above, the tiny throat behind you) -> the whale rises ->
// it surfaces, shakes its head and spits you out -> the real story: a lobster boat off Cape Cod, Pom in the
// plain test suit as a stand-in for the real diver (never his likeness) -> krill and small fish -> the beach.
import * as THREE from "three";
import { interpolate, random } from "remotion";
import { ep012 } from "../../whatif/episodes/ep012";
import voices from "../../whatif/episodes/ep012.voices.json";
import { Box, type V3 } from "../core";
import { originOf } from "../places";
import type { KitEp } from "../KitEpisode";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OC = originOf("ocean");
const IN: V3 = [0.6, 0.6, 0.6]; // where Pom floats inside the mouth (local)
const SKIN = "#3E4A5C";
const BELLY = "#DCE3EA";

// a low-poly humpback: long body, pale pleated throat, long white flippers, flukes
const Whale: React.FC<{ p: V3; yaw?: number; pitch?: number; roll?: number; s?: number; gape?: number }> = ({ p, yaw = 0, pitch = 0, roll = 0, s = 1, gape = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]} scale={s}>
    <group rotation={[0, 0, pitch]}>
      <group rotation={[roll, 0, 0]}>
        {/* body */}
        <mesh scale={[5.2, 1.25, 1.35]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} flatShading />
        </mesh>
        {/* upper jaw / head */}
        <mesh position={[4.2, 0.15, 0]} scale={[1.9, 0.55, 1.05]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} flatShading />
        </mesh>
        {/* lower jaw, opens with `gape` */}
        <group position={[2.6, -0.35, 0]} rotation={[0, 0, -gape * 0.5]}>
          <mesh position={[1.7, -0.15, 0]} scale={[1.9, 0.5, 1.1]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={BELLY} roughness={0.8} flatShading />
          </mesh>
          {/* throat pleats */}
          {Array.from({ length: 6 }, (_, i) => (
            <Box key={i} s={[3.2, 0.05, 0.06]} p={[1.3, -0.55, -0.75 + i * 0.3]} color="#9AA6B4" shadow={false} />
          ))}
          {gape > 0.05 ? (
            <mesh position={[1.7, 0.2, 0]} scale={[1.6, 0.1, 0.85]}>
              <sphereGeometry args={[1, 10, 6]} />
              <meshStandardMaterial color="#C9606E" />
            </mesh>
          ) : null}
        </group>
        {/* bumps on the head */}
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[3.4 + i * 0.6, 0.62, (i % 2 ? 1 : -1) * 0.25]} scale={0.12}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#2E3846" />
          </mesh>
        ))}
        {/* eye */}
        <mesh position={[2.9, 0.05, 1.18]} scale={0.12}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#10141C" />
        </mesh>
        {/* long white flippers */}
        {[-1, 1].map((z) => (
          <Box key={z} s={[0.6, 0.12, 3.2]} p={[1.6, -0.7, z * 2.2]} r={[z * 0.35, z * 0.4, 0]} color={BELLY} />
        ))}
        {/* small dorsal fin */}
        <Box s={[0.6, 0.45, 0.12]} p={[-2.6, 1.15, 0]} r={[0, 0, -0.5]} color={SKIN} />
        {/* tail stock + flukes */}
        <mesh position={[-5.6, 0.1, 0]} scale={[1.4, 0.5, 0.5]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={SKIN} flatShading />
        </mesh>
        <Fluke p={[-6.9, 0.15, 0]} />
      </group>
    </group>
  </group>
);
const Fluke: React.FC<{ p: V3; up?: number }> = ({ p, up = 0 }) => (
  <group position={p} rotation={[0, 0, up]}>
    {[-1, 1].map((z) => (
      <Box key={z} s={[1.0, 0.1, 1.9]} p={[-0.3, 0, z * 0.95]} r={[0, z * 0.45, 0]} color={SKIN} />
    ))}
    {[-1, 1].map((z) => (
      <Box key={`u${z}`} s={[0.9, 0.02, 1.7]} p={[-0.3, -0.06, z * 0.95]} r={[0, z * 0.45, 0]} color={BELLY} shadow={false} />
    ))}
  </group>
);

// the inside of the closed mouth: a dark cave around Pom, baleen hanging from the roof, a tongue below,
// and the tiny throat (about the size of a fist, true to Pom's size) behind
const BALEEN = Array.from({ length: 34 }, (_, i) => ({ x: -3.4 + (i % 17) * 0.42, z: i < 17 ? -1.6 : 2.6, h: 1.2 + random(`bl${i}`) * 0.6 }));
const Mouth: React.FC<{ frame: number; squeeze: number; throat: number }> = ({ frame, squeeze, throat }) => {
  const c: V3 = [OC[0] + IN[0], IN[1], IN[2]];
  const breathe = 1 - squeeze * (0.06 + 0.03 * Math.sin(frame / 9));
  return (
    <group position={c}>
      <mesh scale={[7.5 * breathe, 4.2 * breathe, 7.5 * breathe]} position={[0, 1.2, 0]}>
        <sphereGeometry args={[1, 18, 12]} />
        <meshStandardMaterial color="#7A2E40" roughness={0.9} side={THREE.BackSide} />
      </mesh>
      {/* tongue */}
      <mesh position={[0, -1.1, 0]} scale={[5, 0.9 * breathe, 3.5]}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshStandardMaterial color="#B04A5A" roughness={0.8} />
      </mesh>
      {/* baleen: comb plates hanging from the roof */}
      {BALEEN.map((b, i) => (
        <Box key={i} s={[0.16, b.h, 0.05]} p={[b.x, 3.6 * breathe - b.h / 2, b.z]} color="#3A3A3A" shadow={false} />
      ))}
      {/* throat behind you: a small dark hole, glowing rim so it reads */}
      {throat > 0 ? (
        <group position={[-1.0, 1.1, -2.2]} scale={throat}>
          <mesh>
            <circleGeometry args={[0.24, 16]} />
            <meshBasicMaterial color="#120408" />
          </mesh>
          <mesh>
            <torusGeometry args={[0.26, 0.04, 6, 20]} />
            <meshStandardMaterial color="#FFD166" emissive="#FFB020" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

// a small lobster boat for the true story
const Boat: React.FC<{ p: V3; frame: number }> = ({ p, frame }) => (
  <group position={[p[0], p[1] + Math.sin(frame / 14) * 0.05, p[2]]} rotation={[0, 0, Math.sin(frame / 18) * 0.03]}>
    <Box s={[4.2, 0.6, 1.9]} p={[0, -0.32, 0]} color="#F4F1EA" />
    <Box s={[4.3, 0.12, 2.0]} p={[0, -0.6, 0]} color="#2D5DA8" />
    <Box s={[1.2, 1.2, 1.4]} p={[-1.3, 0.6, 0]} color="#F4F1EA" />
    <Box s={[1.25, 0.35, 1.45]} p={[-1.3, 1.1, 0]} color="#8FC7F0" shadow={false} />
    <Box s={[0.08, 1.6, 0.08]} p={[1.8, 0.8, 0.8]} color="#7A5A3A" />
  </group>
);

// krill and small fish swimming past
const FISH = Array.from({ length: 26 }, (_, i) => ({ y: 0.2 + random(`fy${i}`) * 1.2, z: -1.2 + random(`fz${i}`) * 2.6, x: random(`fx${i}`) * 12, krill: i % 2 === 0 }));
const School: React.FC<{ frame: number }> = ({ frame }) => (
  <group position={[OC[0], 0, 1.7]}>
    {FISH.map((f, i) => (
      <mesh key={i} position={[-1.6 + ((f.x * 0.3 + frame * 0.03) % 3.4), f.y + Math.sin(frame / 8 + i) * 0.08, f.z]} rotation={[0, 0, -Math.PI / 2]} scale={f.krill ? [0.06, 0.16, 0.06] : [0.11, 0.3, 0.09]}>
        <coneGeometry args={[1, 1, 5]} />
        <meshStandardMaterial color={f.krill ? "#F08A6B" : "#C9D6E2"} emissive={f.krill ? "#7A2A1A" : "#203040"} emissiveIntensity={0.3} />
      </mesh>
    ))}
  </group>
);

// spray when the whale surfaces and spits you out
const Splash: React.FC<{ p: V3; k: number }> = ({ p, k }) =>
  k <= 0 || k >= 1 ? null : (
    <group position={p}>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = 0.4 + k * 2.2;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 1.6 * Math.sin(k * Math.PI) * (0.6 + random(`sp${i}`) * 0.6), Math.sin(a) * r]} scale={0.16 * (1 - k * 0.6)}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#EAF6FF" transparent opacity={1 - k} />
          </mesh>
        );
      })}
    </group>
  );

const inside = (b: number) => b <= 4;

export const k012: KitEp = {
  id: "k012",
  style: "D",
  base: { episode: ep012, voices },
  beats: [
    { line: 0, place: "ocean", shot: "medium", move: "push", env: "night", board: false, pom: { expr: "shocked", pose: "armsUp", at: IN, float: true } },
    { line: 1, place: "ocean", shot: "close", move: "orbitL", board: false, pom: { expr: "scared", at: IN, float: true } },
    { line: 2, place: "ocean", shot: "close", move: "orbitR", board: false, pom: { expr: "scared", pose: "armsUp", at: IN, float: true } },
    { line: 3, place: "ocean", shot: "medium", move: "orbitL", board: false, pom: { expr: "relieved", pose: "pointUp", at: IN, float: true } },
    { line: 4, place: "ocean", shot: "medium", move: "pull", board: false, pom: { expr: "relieved", at: IN, float: true } },
    { line: 5, place: "ocean", shot: "wide", move: "crane", env: "day", nudge: { pos: [1.3, 0, 0], look: [1.3, 0, 0] }, pom: { expr: "scared", hide: true } },
    { line: 6, place: "ocean", shot: "wide", move: "hold", nudge: { pos: [1.3, 0, 0], look: [1.3, 0, 0] }, pom: { expr: "shocked", at: [-0.6, 2.6, -1.4], to: [1.6, 0.2, 1.4], float: true }, sfx: ["splash"] },
    { line: 7, place: "ocean", shot: "medium", move: "push", pom: { expr: "neutral", outfit: "suit", at: [0.4, 0, 1.0] } },
    { line: 8, place: "ocean", shot: "board", move: "push", nudge: { pos: [1.0, 0, 0.6], look: [1.0, 0, 0] }, pom: { expr: "relieved", outfit: "suit", at: [0.4, 0, 1.0] } },
    { line: 9, place: "ocean", shot: "medium", move: "pull", pom: { expr: "relieved", pose: "pointUp", at: [0.4, 0, 1.0] } },
    { line: 10, place: "ocean", shot: "wide", move: "pull", env: "sunset", nudge: { pos: [1.5, 0, 0], look: [1.5, 0, 0] }, pom: { expr: "relieved", pose: "pointUp" } },
  ],
  opts: (c) => ({ ocean: { waves: c.beat === 6 ? 2.2 : 1.2 } }),
  dim: (c) => (inside(c.beat) ? 0.12 : 0) + interpolate(c.t, [4.8, 5.0, 5.1, 5.4], [0, 0.65, 0.65, 0], clamp),
  extras: (c) => {
    // the whale outside: rising (beat 5), surfacing + head shake (beat 6), diving away (7-8), feeding (9)
    const rise = c.beat === 5 ? interpolate(c.p, [0, 1], [-1.6, -0.25], clamp) : -0.2;
    const shake = c.beat === 6 ? Math.sin(c.frame / 3) * 0.22 * Math.max(0, 1 - c.p * 1.4) : 0;
    const gape = c.beat === 6 ? interpolate(c.p, [0.05, 0.25, 0.7, 1], [0, 1, 1, 0.2], clamp) : c.beat === 9 ? 0.8 : 0;
    return (
      <>
        {inside(c.beat) ? <Mouth frame={c.frame} squeeze={c.beat === 1 || c.beat === 2 ? 1 : 0.4} throat={c.beat >= 3 ? interpolate(c.p, [0, 0.2], [0, 1], clamp) : 0} /> : null}
        {c.beat === 5 || c.beat === 6 ? <Whale p={[OC[0] - 2.4, rise, -2.6]} pitch={c.beat === 6 ? 0.25 : 0.12} roll={shake} gape={gape} s={0.95} /> : null}
        {c.beat === 6 ? <Splash p={[OC[0] + 1.6, 0, -2.4]} k={interpolate(c.p, [0.05, 0.6], [0, 1], clamp)} /> : null}
        {c.beat >= 7 && c.beat <= 8 ? (
          <>
            <Boat p={[OC[0] + 0.4, 0, 1.0]} frame={c.frame} />
            {/* the whale's flukes going down behind the boat */}
            <group position={[OC[0] - 3.5, interpolate(c.t, [7, 9], [1.4, -1.6], clamp), -6]} scale={1.3}>
              <Fluke p={[0, 0, 0]} up={1.3} />
            </group>
          </>
        ) : null}
        {c.beat === 9 ? (
          <>
            <Boat p={[OC[0] + 0.4, 0, 1.0]} frame={c.frame} />
            <School frame={c.frame} />
          </>
        ) : null}
      </>
    );
  },
  tags: (c) => {
    if (c.beat >= 3 && c.beat <= 4) return [{ text: "THROAT", at: [OC[0] + IN[0] - 1.0, IN[1] + 1.55, IN[2] - 2.2] as V3, bg: "#FFD166" }];
    return [];
  },
};
