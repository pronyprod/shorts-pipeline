// Ep019 (style D): "What if you rode a satellite back to Earth?" (Round 3 #35: NASA's Swift re-entry, 4 Nov 2026, told as a real past event).
// Pom rides a low-poly space telescope (our own simple drawing, not a model of the real craft) as it hits
// the air: speed streaks, then a glowing cap of squeezed air, sparks, the break-up; then a capsule's heat
// shield in the lab, the real fireball over a night town, and the telescope catching cosmic blasts.
import { interpolate, random } from "remotion";
import { BREAK_T, ep019 } from "../../whatif/episodes/ep019";
import voices from "../../whatif/episodes/ep019.voices.json";
import { Box, Mat, type V3 } from "../core";
import { originOf } from "../places";
import type { KitEp } from "../KitEpisode";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SPACE = originOf("space");
const LAB = originOf("lab");
const TOWN = originOf("nightTown");
// the telescope sits under Pom's feet in the space place
const SAT: V3 = [SPACE[0], 0.95, 2];

// how hot the air cap glows (0-1) along the story
const glowAt = (t: number) => interpolate(t, [2, 3, 4, 5], [0.1, 0.5, 0.85, 1], clamp);

const Telescope: React.FC<{ p: V3; apart: number; heat: number }> = ({ p, apart, heat }) => {
  const hot = heat > 0.6 ? "#FF9A4A" : undefined;
  const hei = Math.max(0, heat - 0.5) * 1.2;
  return (
    <group position={p} rotation={[0, 0, 0.08]}>
      {/* main body: a short octagonal drum */}
      <group position={[-apart * 0.6, -apart * 0.3, 0]} rotation={[0, 0, -apart * 0.6]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 1.5, 8]} />
          <Mat color="#E4E8EF" emissive={hot} ei={hei} metal={0.2} rough={0.6} />
        </mesh>
        {/* gold foil band */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.44, 0.44, 0.4, 8]} />
          <Mat color="#D9A93B" emissive={hot} ei={hei} metal={0.4} rough={0.5} />
        </mesh>
      </group>
      {/* the telescope tube on top */}
      <group position={[apart * 0.8, apart * 0.9, 0]} rotation={[0, 0, apart * 1.4]}>
        <mesh position={[0.2, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 1.2, 8]} />
          <Mat color="#B9C1CE" emissive={hot} ei={hei} />
        </mesh>
      </group>
      {/* solar panels, front and back wings */}
      <Box s={[0.9, 0.04, 1.3]} p={[apart * 0.4, apart * 1.6, 1.1 + apart * 2.4]} r={[apart * 2, 0, 0]} color="#2E4E8F" emissive="#3E6BC0" ei={0.3} />
      <Box s={[0.9, 0.04, 1.3]} p={[-apart * 0.5, -apart * 0.4, -1.1 - apart * 2.4]} r={[-apart * 1.6, apart, 0]} color="#2E4E8F" emissive="#3E6BC0" ei={0.3} />
    </group>
  );
};

export const k019: KitEp = {
  id: "k019",
  style: "D",
  base: { episode: ep019, voices },
  beats: [
    { line: 0, place: "space", shot: "medium", move: "push", env: "space", pom: { expr: "shocked", pose: "hold", float: true } },
    { line: 1, place: "space", shot: "close", move: "orbitL", pom: { expr: "scared", pose: "hold", float: true } },
    { line: 2, place: "space", shot: "medium", move: "push", pom: { expr: "scared", pose: "hold", float: true } },
    { line: 3, place: "space", shot: "close", move: "orbitR", env: "sunset", pom: { expr: "shocked", pose: "hold", float: true } },
    { line: 4, place: "space", shot: "high", move: "pull", pom: { expr: "scared", pose: "armsUp", float: true } },
    { line: 5, place: "space", shot: "wide", move: "pull", pom: { expr: "shocked", pose: "armsUp", float: true } },
    { line: 6, place: "lab", shot: "wide", move: "drop", env: "lab", pom: { expr: "relieved", pose: "pointUp", outfit: "suit", at: [1.3, 0, 2.6] } },
    { line: 7, place: "nightTown", shot: "wide", move: "drop", env: "night", pom: { expr: "shocked", pose: "pointUp", outfit: "suit" } },
    { line: 8, place: "nightTown", shot: "medium", move: "push", pom: { expr: "neutral", pose: "pointUp", outfit: "suit" } },
    { line: 9, place: "space", shot: "medium", move: "orbitL", env: "space", pom: { expr: "relieved", pose: "armsUp", float: true } },
    { line: 10, place: "nightTown", shot: "wide", move: "pull", env: "night", pom: { expr: "relieved", pose: "pointUp", outfit: "suit" } },
  ],
  extras: (c) => {
    const riding = c.beat <= 5;
    const glow = riding && c.t >= 2 ? glowAt(c.t) : 0;
    const apart = c.beat === 5 ? interpolate(c.p, [0.1, 0.9], [0, 1], clamp) : 0;
    const speed = c.frame * 0.9;
    return (
      <>
        {riding || c.beat === 9 ? <Telescope p={SAT} apart={c.beat === 9 ? 0 : apart} heat={c.beat === 9 ? 0 : glow} /> : null}
        {/* speed streaks rushing past (you fly towards -x) */}
        {riding
          ? Array.from({ length: 26 }, (_, i) => {
              const x = ((((random(`sx${i}`) * 40 + speed * (0.6 + random(`sv${i}`))) % 40) + 40) % 40) - 20;
              const y = (random(`sy${i}`) - 0.5) * 10 + 1.4;
              const z = -2 - random(`sz${i}`) * 10;
              return <Box key={i} s={[1.6 + random(`sl${i}`) * 2, 0.03, 0.03]} p={[SPACE[0] + x, y, z]} color="#FFFFFF" emissive={glow > 0.3 ? "#FFB070" : "#CFE6FF"} ei={1.2} shadow={false} />;
            })
          : null}
        {/* the cap of squeezed, glowing air in front of (and under) the telescope */}
        {glow > 0.01 ? (
          <>
            <mesh position={[SAT[0] - 0.9, SAT[1] - 0.35, SAT[2] + 0.4]} rotation={[0, 0, Math.PI / 2 + 0.5]} scale={[1.3 + glow * 0.9, 0.9 + glow * 0.9, 1.4 + glow * 0.9]}>
              <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color={glow > 0.7 ? "#FFE2B0" : "#FF8A3D"} transparent opacity={0.35 + glow * 0.45} toneMapped={false} depthWrite={false} />
            </mesh>
            {/* trailing glow behind */}
            <mesh position={[SAT[0] + 2.2, SAT[1] + 0.1, SAT[2] - 0.2]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.9 * glow + 0.2, 4.5, 12, 1, true]} />
              <meshBasicMaterial color="#FF6A2A" transparent opacity={0.18 + glow * 0.3} toneMapped={false} depthWrite={false} />
            </mesh>
            <pointLight position={[SAT[0] - 1.0, SAT[1] + 0.6, SAT[2] + 1.6]} color="#FF8A3D" intensity={glow * 90} distance={10} />
            {/* sparks streaming back */}
            {glow > 0.4
              ? Array.from({ length: 22 }, (_, i) => {
                  const life = ((c.frame * (1 + random(`kv${i}`)) + i * 9) % 30) / 30;
                  return (
                    <mesh key={i} position={[SAT[0] - 0.8 + life * 6, SAT[1] + (random(`ky${i}`) - 0.3) * 1.4 + life * 0.6, SAT[2] + (random(`kz${i}`) - 0.5) * 1.6]} scale={0.06 * (1 - life) + 0.02}>
                      <boxGeometry args={[1, 1, 1]} />
                      <meshBasicMaterial color={i % 3 ? "#FFC46B" : "#FFFFFF"} toneMapped={false} />
                    </mesh>
                  );
                })
              : null}
          </>
        ) : null}
        {/* the break-up flash */}
        {c.beat === 5 ? (
          <mesh position={[SAT[0], SAT[1], SAT[2] - 0.5]} scale={0.5 + apart * 3}>
            <sphereGeometry args={[1, 16, 10]} />
            <meshBasicMaterial color="#FFF1D0" transparent opacity={interpolate(apart, [0, 0.15, 1], [0, 0.55, 0], clamp)} toneMapped={false} depthWrite={false} />
          </mesh>
        ) : null}
        {/* a crew capsule with its heat shield (lab) */}
        {c.beat === 6 ? (
          <group position={[LAB[0] - 0.5, 0, 1.6]}>
            <mesh position={[0, 1.15, 0]} castShadow>
              <coneGeometry args={[1.1, 1.8, 8]} />
              <Mat color="#E9ECF1" />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[1.15, 1.0, 0.4, 8]} />
              <Mat color="#7A4A2E" rough={1} />
            </mesh>
            <mesh position={[0, 1.2, 0.72]} rotation={[0.55, 0, 0]}>
              <circleGeometry args={[0.22, 12]} />
              <meshBasicMaterial color="#9FD2FF" />
            </mesh>
          </group>
        ) : null}
        {/* the real fireball crossing the night sky, breaking into a few trails */}
        {c.beat === 7 || c.beat === 8
          ? Array.from({ length: 5 }, (_, i) => {
              const k = c.beat === 7 ? c.p : 1 + c.p;
              const x = TOWN[0] - 9 + k * 7 + i * 0.5;
              const y = 5.0 - k * 0.8 - i * 0.25;
              return (
                <group key={i}>
                  <mesh position={[x, y, -10 - i * 0.4]} scale={i === 0 ? 0.32 : 0.16}>
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshBasicMaterial color={i === 0 ? "#FFF3D6" : "#FFB45E"} toneMapped={false} />
                  </mesh>
                  <mesh position={[x - 1.4, y + 0.32, -10 - i * 0.4]} rotation={[0, 0, Math.PI / 2 - 0.22]}>
                    <coneGeometry args={[i === 0 ? 0.22 : 0.1, 2.8, 8, 1, true]} />
                    <meshBasicMaterial color="#FF7A35" transparent opacity={0.6} toneMapped={false} depthWrite={false} />
                  </mesh>
                </group>
              );
            })
          : null}
        {/* cosmic blasts popping far away while the telescope watches */}
        {c.beat === 9
          ? Array.from({ length: 9 }, (_, i) => {
              const life = ((c.frame + i * 11) % 36) / 36;
              const p: V3 = [SPACE[0] - 7 + random(`bx${i}`) * 14, 2 + random(`by${i}`) * 7, -10 - random(`bz${i}`) * 8];
              return (
                <mesh key={i} position={p} scale={0.15 + life * 1.0}>
                  <icosahedronGeometry args={[1, 0]} />
                  <meshBasicMaterial color={i % 2 ? "#FFE27A" : "#9FE3FF"} transparent opacity={1 - life} toneMapped={false} depthWrite={false} />
                </mesh>
              );
            })
          : null}
      </>
    );
  },
  tags: (c) =>
    c.beat === 7
      ? [{ text: "NASA'S SWIFT, 4 NOV 2026", at: [TOWN[0] - 1.0, 3.6, -10] as V3, bg: "#FFD166" }]
      : c.beat === 6
        ? [{ text: "HEAT SHIELD", at: [LAB[0] - 0.5, 2.5, 1.6] as V3, bg: "#FFD166" }]
        : [],
  // no moon disc behind the counter in the night-town shots
  moon: () => 0,
  // a quick dip at the break-up
  dim: (c) => (c.t >= BREAK_T && c.t < BREAK_T + 1 ? interpolate(c.t, [BREAK_T + 0.75, BREAK_T + 0.95, BREAK_T + 1], [0, 0.4, 0], clamp) : 0),
};
