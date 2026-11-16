// Ep013 (style B): "What if every ant on Earth came for you?"
// Low-poly ants (our own simple shape: three round segments, thin legs on the close-up ants) as
// instanced swarms: rings closing in on Pom, a driver-ant column, a long river of ants across the
// city, a carpet at the climax; then the slow column Pom strolls away from, a lab, and a balance
// with ants on one pan and wild birds + mammals on the other.
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BIRDS_MAMMALS_MT, ep013, FACTS } from "../../whatif/episodes/ep013";
import voices from "../../whatif/episodes/ep013.voices.json";
import { Box, Mat, type V3 } from "../core";
import { ANCHORS, originOf } from "../places";
import { Balance } from "../props";
import type { KitEp } from "../KitEpisode";

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const STREET = originOf("street");
const FOREST = originOf("forest");
const CITY = originOf("city");
const LAB = originOf("lab");
const POM_STREET = add(STREET, ANCHORS.street.pom);
const BLACK_ANT = "#2E211C";
const DRIVER_ANT = "#7A3420";

// one ant pose: position + heading (radians, 0 = facing +x)
type AntT = { x: number; y?: number; z: number; yaw: number };

// ---------- instanced swarm (three segments per ant) ----------
const SEGS: { off: V3; s: V3 }[] = [
  { off: [-0.1, 0.055, 0], s: [0.075, 0.055, 0.058] }, // abdomen
  { off: [0, 0.05, 0], s: [0.04, 0.03, 0.03] }, // thorax
  { off: [0.075, 0.055, 0], s: [0.042, 0.036, 0.038] }, // head
];
const SegMesh: React.FC<{ ants: AntT[]; seg: (typeof SEGS)[number]; scale: number; color: string }> = ({ ants, seg, scale, color }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const max = useMemo(() => Math.max(1, ants.length), [ants.length]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    ants.forEach((a, i) => {
      const c = Math.cos(a.yaw);
      const s = Math.sin(a.yaw);
      // the segment offset turns with the ant (yaw about y; +x = forward)
      o.position.set(a.x + (seg.off[0] * c) * scale, (a.y ?? 0) + seg.off[1] * scale, a.z - seg.off[0] * s * scale);
      o.rotation.set(0, a.yaw, 0);
      o.scale.set(seg.s[0] * scale, seg.s[1] * scale, seg.s[2] * scale);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.count = ants.length;
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, max]} castShadow={false} receiveShadow={false} frustumCulled={false}>
      <sphereGeometry args={[1, 7, 5]} />
      <Mat color={color} rough={0.6} />
    </instancedMesh>
  );
};
const Swarm: React.FC<{ ants: AntT[]; scale?: number; color?: string }> = ({ ants, scale = 1, color = BLACK_ANT }) => (
  <>
    {SEGS.map((seg, i) => (
      <SegMesh key={`${i}-${ants.length}`} ants={ants} seg={seg} scale={scale} color={color} />
    ))}
  </>
);

// ---------- a detailed ant (close-ups): segments + six legs + antennae ----------
const Ant: React.FC<{ a: AntT; s?: number; frame: number; color?: string }> = ({ a, s = 1, frame, color = BLACK_ANT }) => {
  const step = Math.sin(frame * 0.9 + a.x * 7) * 0.35;
  return (
    <group position={[a.x, a.y ?? 0, a.z]} rotation={[0, a.yaw, 0]} scale={s}>
      {SEGS.map((g, i) => (
        <mesh key={i} position={g.off} scale={g.s}>
          <sphereGeometry args={[1, 10, 7]} />
          <Mat color={color} rough={0.5} smooth />
        </mesh>
      ))}
      {[-0.035, 0, 0.035].map((lx, i) =>
        [1, -1].map((side) => (
          <group key={`${i}${side}`} position={[lx, 0.05, 0]} rotation={[0, (i % 2 ? step : -step) * side, 0]}>
            <Box s={[0.012, 0.012, 0.09]} p={[0, -0.015, 0.045 * side]} r={[0.55 * side, 0, 0]} color={color} shadow={false} />
          </group>
        )),
      )}
      {[1, -1].map((side) => (
        <Box key={side} s={[0.07, 0.008, 0.008]} p={[0.13, 0.085, 0.02 * side]} r={[0, -0.4 * side, 0.5]} color={color} shadow={false} />
      ))}
    </group>
  );
};

// ---------- swarm layouts ----------
// rings closing in on a point; each ant loops from the outer edge to the inner edge
const converge = (key: string, c: V3, n: number, rMin: number, rMax: number, speed: number, frame: number): AntT[] =>
  Array.from({ length: n }, (_, i) => {
    const a = random(`${key}a${i}`) * Math.PI * 2;
    const span = rMax - rMin;
    const r = rMin + ((((random(`${key}r${i}`) * span - frame * speed * (0.7 + random(`${key}v${i}`) * 0.6)) % span) + span) % span);
    const wob = Math.sin(frame * 0.2 + i) * 0.15;
    // heading towards the centre (yaw measured so +x faces the centre)
    return { x: c[0] + Math.cos(a) * r, z: c[2] + Math.sin(a) * r, yaw: Math.atan2(Math.sin(a), -Math.cos(a)) + wob };
  });
// a column marching from `from` to `to`
const column = (key: string, from: V3, to: V3, n: number, width: number, speed: number, frame: number): AntT[] => {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dz, dx);
  return Array.from({ length: n }, (_, i) => {
    const u = (((random(`${key}u${i}`) + (frame * speed) / len) % 1) + 1) % 1;
    const side = (random(`${key}w${i}`) - 0.5) * width + Math.sin(u * 14 + i) * 0.05;
    return { x: from[0] + dx * u - (dz / len) * side, z: from[2] + dz * u + (dx / len) * side, yaw: yaw + Math.sin(frame * 0.3 + i) * 0.2 };
  });
};

// ---------- the twist's balance ----------
const BAL: V3 = add(FOREST, [0.4, 0, 0.4]);
const Bird: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 0.2, 0]} scale={[0.22, 0.17, 0.16]} castShadow>
      <sphereGeometry args={[1, 10, 7]} />
      <Mat color="#4F7FD0" />
    </mesh>
    <mesh position={[0.2, 0.34, 0]} scale={0.1}>
      <sphereGeometry args={[1, 8, 6]} />
      <Mat color="#4F7FD0" />
    </mesh>
    <mesh position={[0.31, 0.34, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <coneGeometry args={[0.035, 0.09, 6]} />
      <Mat color="#F2B33D" />
    </mesh>
  </group>
);
const Deer: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Box s={[0.6, 0.28, 0.24]} p={[0, 0.5, 0]} color="#B5773F" />
    <Box s={[0.18, 0.3, 0.16]} p={[0.32, 0.75, 0]} r={[0, 0, -0.4]} color="#B5773F" />
    {[-0.22, 0.22].map((x) => [-0.08, 0.08].map((z) => <Box key={`${x}${z}`} s={[0.06, 0.36, 0.06]} p={[x, 0.18, z]} color="#8E5A2E" />))}
  </group>
);
const AntMound: React.FC<{ frame: number }> = ({ frame }) => (
  <group>
    <mesh scale={[0.7, 0.45, 0.6]} castShadow>
      <sphereGeometry args={[1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Mat color="#3A2A22" />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 + frame * 0.02;
      return <Ant key={i} a={{ x: Math.cos(a) * 0.55, y: 0.05 + (i % 3) * 0.12, z: Math.sin(a) * 0.45, yaw: -a }} s={1.2} frame={frame} />;
    })}
  </group>
);

export const k013: KitEp = {
  id: "k013",
  style: "B",
  base: { episode: ep013, voices },
  beats: [
    { line: 0, place: "street", shot: "wide", env: "day", pom: { expr: "shocked", pose: "armsUp" } },
    { line: 1, place: "street", shot: "close", pom: { expr: "relieved", pose: "idle" }, nudge: { pos: [0, -0.4, 0], look: [0, -0.5, 0] } },
    { line: 2, place: "forest", shot: "wide", pom: { expr: "scared", pose: "hold" } },
    { line: 3, place: "city", shot: "far", pom: { expr: "shocked", pose: "pointUp" } },
    { line: 4, place: "street", shot: "high", env: "sunset", pom: { expr: "scared", pose: "armsUp" } },
    { line: 5, place: "city", shot: "medium", env: "day", pom: { expr: "amazed", pose: "pointUp" } },
    { line: 6, place: "forest", shot: "low", pom: { expr: "relieved", pose: "pointUp" } },
    { line: 7, place: "street", shot: "wide", pom: { expr: "relieved", pose: "run", at: [-0.6, 0, 3.4], to: [2.6, 0, 3.4] } },
    { line: 8, place: "lab", shot: "wide", env: "lab", pom: { expr: "amazed", pose: "pointUp", outfit: "lab", at: [1.3, 0, 2.6] } },
    { line: 9, place: "forest", shot: "wide", env: "day", pom: { expr: "amazed", pose: "pointUp", at: [2.6, 0, 3.4] } },
    { line: 10, place: "street", shot: "wide", pom: { expr: "relieved", pose: "armsUp" } },
  ],
  extras: (c) => {
    const f = c.frame;
    const b = c.beat;
    return (
      <>
        {/* 0: rings of ants closing in on Pom from every side */}
        {b === 0 ? <Swarm ants={converge("h", POM_STREET, 380, 1.1, 10, 0.03, f)} scale={1.5} /> : null}
        {/* 1: twelve ants at the shoe (close-up detail) */}
        {b === 1
          ? Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 1.6 - 0.3 + random(`d${i}`) * 0.2;
              const r = 0.45 + random(`dr${i}`) * 0.7 - Math.min(0.25, c.p * 0.3);
              return <Ant key={i} a={{ x: POM_STREET[0] + Math.cos(a) * r, z: POM_STREET[2] + Math.sin(a) * r * 0.8, yaw: Math.atan2(Math.sin(a), -Math.cos(a)) }} s={1.6} frame={f} />;
            })
          : null}
        {/* 2 + 6: a driver ant column across the forest floor (fast in 2; at its true crawl in 6) */}
        {b === 2 ? <Swarm ants={column("dc", add(FOREST, [-9, 0, -6]), add(FOREST, [6, 0, 5.5]), 900, 0.9, 0.05, f)} scale={1.4} color={DRIVER_ANT} /> : null}
        {b === 6 ? <Swarm ants={column("dc6", add(FOREST, [-6, 0, 1.0]), add(FOREST, [5, 0, 1.6]), 500, 0.6, 0.004, f)} scale={1.6} color={DRIVER_ANT} /> : null}
        {/* 3: a river of ants through the city, far beyond the frame */}
        {b === 3 ? (
          <>
            <Swarm ants={column("sc", add(CITY, [-16, 0, 6]), add(CITY, [14, 0, -14]), 1400, 2.2, 0.06, f)} scale={2.4} />
            <Swarm ants={column("sc2", add(CITY, [-14, 0, -12]), add(CITY, [16, 0, 4]), 900, 1.6, 0.05, f)} scale={2.4} />
          </>
        ) : null}
        {/* 4: the climax: a carpet of ants all the way to Pom's feet */}
        {b === 4 ? <Swarm ants={converge("c", POM_STREET, 1600, 0.6 + (1 - c.p) * 0.6, 11, 0.04, f)} scale={1.5} /> : null}
        {/* 5: a few ants still around */}
        {b === 5 ? <Swarm ants={converge("p", add(CITY, ANCHORS.city.pom), 160, 1.2, 6, 0.02, f)} scale={1.4} /> : null}
        {/* 7: Pom strolls off; the column far behind */}
        {b === 7 ? <Swarm ants={column("w", add(STREET, [-9, 0, 2.2]), add(STREET, [-1.2, 0, 3.6]), 300, 0.7, 0.004, f)} scale={1.5} color={DRIVER_ANT} /> : null}
        {/* 8: the lab: a few ants on the bench area floor */}
        {b === 8 ? Array.from({ length: 6 }, (_, i) => <Ant key={i} a={{ x: LAB[0] - 0.6 + i * 0.32, z: 2.0 + Math.sin(i) * 0.3, yaw: 0.4 * i }} s={2.2} frame={f} />) : null}
        {/* 9: the balance: ants outweigh wild birds + mammals */}
        {b === 9 ? (
          <Balance
            p={BAL}
            tilt={-0.12 - Math.min(1, c.p * 2) * 0.1}
            left={<AntMound frame={f} />}
            right={
              <>
                <Bird p={[-0.35, 0.05, 0]} />
                <Deer p={[0.2, 0.05, 0]} />
              </>
            }
          />
        ) : null}
        {/* 10: calm ants wandering */}
        {b === 10 ? <Swarm ants={converge("e", POM_STREET, 120, 2.5, 9, 0.01, f)} scale={1.4} /> : null}
      </>
    );
  },
  tags: (c) =>
    c.beat === 3
      ? [{ text: "ITALY → SPAIN: 6,000 KM", at: add(CITY, [0, 3.2, -4]), bg: "#FFD166" }]
      : c.beat === 6
        ? [{ text: `≈ ${FACTS.driverSpeed.value} M AN HOUR`, at: add(FOREST, [0.9, 3.4, 1.2]), bg: "#FFD166" }]
        : c.beat === 8
          ? [{ text: `PNAS ${FACTS.countYear.value}: ${FACTS.studies.value} STUDIES`, at: add(LAB, [0, 3.0, 0]), bg: "#FFD166" }]
          : c.beat === 9
            ? [
                { text: `ANTS ${FACTS.antCarbonMt.value} Mt C`, at: add(BAL, [-1.8, 2.6, 0]), bg: "#FFD166" },
                { text: `BIRDS + MAMMALS ${BIRDS_MAMMALS_MT} Mt C`, at: add(BAL, [1.0, 3.6, 0]), bg: "#9FE3FF" },
              ]
            : [],
};
