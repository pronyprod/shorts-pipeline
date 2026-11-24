// Ep020 (style A: flat): "What if you sent Voyager 1 a message?" (timely: Voyager 1 one light-day from Earth, 18 Nov 2026)
// Pom sends a glowing radio pulse; the Moon, Sun and Pluto slide in as stops, then a low-poly probe far away
// (our own simple drawing, not a model of the real craft); the answer pulse comes back.
import { interpolate } from "remotion";
import { ep020 } from "../../whatif/episodes/ep020";
import voices from "../../whatif/episodes/ep020.voices.json";
import { Box, type V3 } from "../core";
import { originOf } from "../places";
import type { KitEp } from "../KitEpisode";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SP = originOf("space");
const PX = SP[0] + 0.9; // where the pulse leaves Pom
const Y = 1.5;

const Ball: React.FC<{ p: V3; r: number; color: string; glow?: string }> = ({ p, r, color, glow }) => (
  <group position={p}>
    <mesh>
      <sphereGeometry args={[r, 20, 14]} />
      <meshBasicMaterial color={color} fog={false} />
    </mesh>
    {glow ? (
      <mesh scale={1.35}>
        <sphereGeometry args={[r, 20, 14]} />
        <meshBasicMaterial color={glow} transparent opacity={0.3} fog={false} depthWrite={false} />
      </mesh>
    ) : null}
  </group>
);

// expanding rings + a bright bead: the radio pulse
const Pulse: React.FC<{ x: number; frame: number }> = ({ x, frame }) => (
  <group position={[x, Y, 1.2]}>
    <mesh>
      <sphereGeometry args={[0.16, 12, 10]} />
      <meshBasicMaterial color="#FFFFFF" fog={false} />
    </mesh>
    {[0, 1, 2].map((i) => {
      const k = ((frame / 24 + i / 3) % 1);
      return (
        <mesh key={i} rotation={[0, Math.PI / 2, 0]} scale={0.3 + k * 0.9}>
          <ringGeometry args={[0.9, 1, 28]} />
          <meshBasicMaterial color="#7FD6FF" transparent opacity={1 - k} side={2} fog={false} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

const Probe: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Box s={[0.5, 0.4, 0.4]} p={[0, 0, 0]} color="#D8DCE4" shadow={false} />
    <Box s={[0.08, 0.08, 1.4]} p={[0, 0.3, 0.1]} r={[0, 0, 0]} color="#8A93A6" shadow={false} />
    <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <coneGeometry args={[0.5, 0.25, 12, 1, true]} />
      <meshBasicMaterial color="#F2F4F8" side={2} fog={false} />
    </mesh>
    <Box s={[0.1, 0.1, 0.9]} p={[0.35, -0.2, 0.2]} color="#D9A93B" shadow={false} />
  </group>
);

const slideIn = (p: number, from: number, to: number) => interpolate(p, [0, 0.55], [from, to], clamp);

export const k020: KitEp = {
  id: "k020",
  style: "B",
  look: "flat",
  base: { episode: ep020, voices },
  beats: [
    { line: 0, place: "space", shot: "medium", env: "space", pom: { expr: "neutral", pose: "pointUp", float: true } },
    { line: 1, place: "space", shot: "medium", pom: { expr: "relieved", pose: "pointUp", float: true } },
    { line: 2, place: "space", shot: "wide", pom: { expr: "shocked", pose: "pointUp", float: true } },
    { line: 3, place: "space", shot: "wide", pom: { expr: "scared", pose: "hold", float: true } },
    { line: 4, place: "space", shot: "medium", pom: { expr: "shocked", pose: "armsUp", float: true } },
    { line: 5, place: "space", shot: "medium", pom: { expr: "neutral", pose: "hold", float: true } },
    { line: 6, place: "space", shot: "close", pom: { expr: "relieved", pose: "armsUp", float: true } },
    { line: 7, place: "space", shot: "wide", pom: { expr: "shocked", pose: "pointUp", float: true } },
    { line: 8, place: "space", shot: "medium", pom: { expr: "relieved", pose: "hold", float: true } },
    { line: 9, place: "space", shot: "wide", pom: { expr: "relieved", pose: "pointUp", float: true } },
    { line: 10, place: "space", shot: "wide", pom: { expr: "relieved", pose: "pointUp", float: true } },
  ],
  extras: (c) => {
    const b = c.beat;
    const f = c.frame;
    const far = SP[0] + 4.2;
    if (b === 0) return <Pulse x={interpolate(c.p, [0.3, 1], [PX, PX + 2.4], clamp)} frame={f} />;
    if (b === 1) {
      const mx = slideIn(c.p, SP[0] + 9, far);
      return (
        <>
          <Ball p={[mx, Y + 0.3, -0.5]} r={0.7} color="#C9CCD3" />
          <Pulse x={interpolate(c.p, [0, 0.9], [PX, mx - 0.9], clamp)} frame={f} />
        </>
      );
    }
    if (b === 2) {
      const sunX = interpolate(c.p, [0, 0.4], [SP[0] + 9, far - 0.3], clamp) - interpolate(c.p, [0.45, 0.75], [0, 10], clamp);
      const plX = interpolate(c.p, [0.45, 0.85], [SP[0] + 10, far], clamp);
      return (
        <>
          <Ball p={[sunX, Y + 0.3, -1]} r={1.5} color="#FFC933" glow="#FFAA33" />
          <Ball p={[plX, Y + 0.3, -0.5]} r={0.45} color="#D9B99B" />
          <Pulse x={PX + 0.8} frame={f} />
        </>
      );
    }
    if (b === 3) {
      return (
        <>
          <Pulse x={PX + 0.8} frame={f} />
          {Array.from({ length: 14 }, (_, i) => {
            const x = ((((i * 3.1 - f * 0.45) % 22) + 22) % 22) + SP[0] - 6;
            return <Box key={i} s={[1.4, 0.03, 0.03]} p={[x, 0.2 + ((i * 7) % 11) * 0.3, -1 - (i % 4)]} color="#CFE6FF" emissive="#CFE6FF" ei={1} shadow={false} />;
          })}
        </>
      );
    }
    if (b === 4) {
      const px = slideIn(c.p, SP[0] + 10, far + 0.4);
      return (
        <>
          <Probe p={[px, Y + 0.2, -0.3]} />
          <Pulse x={interpolate(c.p, [0, 0.95], [PX, px - 0.9], clamp)} frame={f} />
        </>
      );
    }
    if (b === 5) {
      const px = far + 0.4;
      return (
        <>
          <Probe p={[px, Y + 0.2, -0.3]} />
          <Pulse x={interpolate(c.p, [0.1, 0.95], [px - 0.9, PX + 0.6], clamp)} frame={f} />
        </>
      );
    }
    if (b === 6) return <Pulse x={PX + 0.5} frame={f} />;
    if (b >= 7 && b <= 9) {
      const px = interpolate(b + c.p, [7, 10], [far + 1.4, far - 0.6], clamp);
      return <Probe p={[px, Y + 0.2, -0.3]} />;
    }
    return <Probe p={[far + 0.4, Y + 0.2, -0.3]} />;
  },
  tags: (c) => (c.beat === 7 ? [{ text: "18 NOV 2026: 1 LIGHT-DAY", at: [SP[0] + 1.2, 3.9, 0] as V3, bg: "#FFD166" }] : []),
};
