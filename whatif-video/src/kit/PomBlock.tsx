// KIT (style B): "Pom" in blocky low-poly 3D: box body and limbs, a round low-poly head
// (smooth-shaded skin so the face stays clean; not a cube head), dot eyes, coral beanie
// with a pom-pom. Faces +z. Feet at y = 0. Same design as the paper version (PomPaper.tsx).
import React from "react";
import { TOON_PIXEL, useLook } from "./core";
import { outfitColors, type Expression, type Outfit, type Pose } from "./types";

const C3base = {
  skin: "#F6C9A2",
  hat: "#FF5A5F",
  hatBand: "#E2434A",
  pom: "#FFF3DD",
  jumper: "#2E7BE0",
  jumperDark: "#1F5DB3",
  legs: "#22304F",
  ink: "#141A2E",
  blush: "#FF8F8F",
};


const Mat: React.FC<{ color: string; rough?: number; smooth?: boolean; glow?: number }> = ({ color, rough = 0.85, smooth = false, glow = 0 }) => {
  const look = useLook();
  if (look !== "shaded") return <meshToonMaterial color={color} gradientMap={TOON_PIXEL} emissive={color} emissiveIntensity={0.3} />;
  return <meshStandardMaterial color={color} roughness={rough} flatShading={!smooth} emissive={color} emissiveIntensity={glow} />;
};

const Box: React.FC<{ s: [number, number, number]; p?: [number, number, number]; r?: [number, number, number]; color: string }> = ({ s, p = [0, 0, 0], r = [0, 0, 0], color }) => (
  <mesh position={p} rotation={r} castShadow receiveShadow>
    <boxGeometry args={s} />
    <Mat color={color} />
  </mesh>
);

// arm hanging from the shoulder; rz = sideways swing (outwards positive for the right arm), rx = forwards
const Arm: React.FC<{ x: number; rz: number; rx: number; color: string; skin: string; held?: React.ReactNode }> = ({ x, rz, rx, color, skin, held }) => (
  <group position={[x, 1.02, 0]} rotation={[rx, 0, rz]}>
    <Box s={[0.14, 0.46, 0.15]} p={[0, -0.23, 0]} color={color} />
    <mesh position={[0, -0.48, 0]} castShadow>
      <icosahedronGeometry args={[0.085, 0]} />
      <Mat color={skin} smooth glow={0.12} />
    </mesh>
    {held ? <group position={[0, -0.56, 0.02]}>{held}</group> : null}
  </group>
);

const Dot: React.FC<{ p: [number, number, number]; r: number; sy?: number }> = ({ p, r, sy = 1 }) => (
  <mesh position={p} scale={[1, sy, 0.6]}>
    <icosahedronGeometry args={[r, 1]} />
    <Mat color={C3base.ink} rough={0.5} />
  </mesh>
);

const Arc: React.FC<{ p: [number, number, number]; r: number; up: boolean }> = ({ p, r, up }) => (
  <mesh position={p} rotation={[0, 0, up ? 0 : Math.PI]}>
    <torusGeometry args={[r, r * 0.3, 4, 8, Math.PI]} />
    <Mat color={C3base.ink} rough={0.5} />
  </mesh>
);

export const PomBlock: React.FC<{
  position: [number, number, number];
  rotY?: number;
  scale?: number;
  expression: Expression;
  pose?: Pose;
  frame: number;
  held?: React.ReactNode;
  outfit?: Outfit;
  float?: boolean; // drifting in space: slow tumble
}> = ({ position, rotY = 0, scale = 1, expression, pose = "idle", frame, held, outfit, float = false }) => {
  const C3 = { ...C3base, ...outfitColors(outfit) };
  const amazed = expression === "amazed";
  const shocked = expression === "shocked" || amazed;
  const scared = expression === "scared";
  const relieved = expression === "relieved";
  const running = pose === "run";
  const bob = float ? Math.sin(frame / 20) * 0.08 : running ? Math.abs(Math.sin(frame / 3)) * 0.12 : scared ? Math.sin(frame * 1.9) * 0.012 : Math.sin(frame / 9) * 0.02;
  const shiver = scared ? Math.sin(frame * 2.3) * 0.015 : 0;
  const blink = !shocked && !relieved && frame % 96 > 90;
  const swing = running ? Math.sin(frame / 3) * 0.8 : 0;

  const arm = (side: 1 | -1): [number, number] => {
    // [rz, rx]
    if (pose === "armsUp") return [side * (2.6 + Math.sin(frame / 2 + side) * 0.15), 0];
    if (pose === "run") return [side * 0.25, swing * side];
    if (pose === "hold" && side === 1) return [0.15, -1.35];
    if (pose === "pointUp" && side === 1) return [2.9, 0];
    return [side * 0.18, 0];
  };
  const [rzR, rxR] = arm(1);
  const [rzL, rxL] = arm(-1);
  const eyeR = shocked ? 0.062 : scared ? 0.034 : 0.045;

  return (
    <group position={[position[0] + shiver, position[1] + bob, position[2]]} rotation={[float ? Math.sin(frame / 37) * 0.15 : 0, rotY, float ? Math.sin(frame / 29) * 0.2 : 0]} scale={scale}>
      {/* legs */}
      <group position={[-0.13, 0.46, 0]} rotation={[running ? swing : 0, 0, 0]}>
        <Box s={[0.17, 0.46, 0.19]} p={[0, -0.23, 0]} color={C3.legs} />
      </group>
      <group position={[0.13, 0.46, 0]} rotation={[running ? -swing : 0, 0, 0]}>
        <Box s={[0.17, 0.46, 0.19]} p={[0, -0.23, 0]} color={C3.legs} />
      </group>
      {/* body */}
      <Box s={[0.58, 0.62, 0.42]} p={[0, 0.77, 0]} color={C3.jumper} />
      <Box s={[0.34, 0.14, 0.02]} p={[0, 0.62, 0.215]} color={C3.jumperDark} />
      <Arm x={0.37} rz={rzR} rx={rxR} color={C3.jumper} skin={C3.skin} held={pose === "hold" ? held : undefined} />
      <Arm x={-0.37} rz={rzL} rx={rxL} color={C3.jumperDark} skin={C3.skin} />
      {/* head */}
      <group position={[0, 1.42, 0]}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.34, 3]} />
          <Mat color={C3.skin} smooth glow={0.14} />
        </mesh>
        {/* beanie */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <sphereGeometry args={[0.355, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat color={C3.hat} />
        </mesh>
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.37, 0.37, 0.11, 8]} />
          <Mat color={C3.hatBand} />
        </mesh>
        <mesh position={[0, 0.44, 0]} castShadow>
          <icosahedronGeometry args={[0.095, 0]} />
          <Mat color={C3.pom} />
        </mesh>
        {/* eyes */}
        {relieved ? (
          <>
            <Arc p={[-0.12, -0.02, 0.31]} r={0.045} up />
            <Arc p={[0.12, -0.02, 0.31]} r={0.045} up />
          </>
        ) : (
          <>
            <Dot p={[-0.12, -0.03, 0.305]} r={eyeR} sy={blink ? 0.15 : 1} />
            <Dot p={[0.12, -0.03, 0.305]} r={eyeR} sy={blink ? 0.15 : 1} />
          </>
        )}
        {/* brows */}
        {shocked && !amazed ? (
          <>
            <Box s={[0.11, 0.03, 0.03]} p={[-0.12, 0.08, 0.3]} color={C3.ink} />
            <Box s={[0.11, 0.03, 0.03]} p={[0.12, 0.08, 0.3]} color={C3.ink} />
          </>
        ) : scared ? (
          <>
            <Box s={[0.11, 0.03, 0.03]} p={[-0.12, 0.05, 0.3]} r={[0, 0, -0.35]} color={C3.ink} />
            <Box s={[0.11, 0.03, 0.03]} p={[0.12, 0.05, 0.3]} r={[0, 0, 0.35]} color={C3.ink} />
          </>
        ) : null}
        {/* cheeks */}
        {relieved || amazed || expression === "neutral" ? (
          <>
            <mesh position={[-0.2, -0.11, 0.26]} scale={[1, 0.6, 0.4]}>
              <icosahedronGeometry args={[0.045, 1]} />
              <Mat color={C3.blush} />
            </mesh>
            <mesh position={[0.2, -0.11, 0.26]} scale={[1, 0.6, 0.4]}>
              <icosahedronGeometry args={[0.045, 1]} />
              <Mat color={C3.blush} />
            </mesh>
          </>
        ) : null}
        {/* mouth */}
        {amazed ? (
          <group position={[0, -0.15, 0.29]}>
            <mesh rotation={[0, 0, Math.PI]} scale={[1.25, 1, 0.5]}>
              <sphereGeometry args={[0.07, 16, 8, 0, Math.PI]} />
              <Mat color={C3.ink} smooth />
            </mesh>
            <mesh position={[0, -0.045, 0.012]} scale={[1, 0.55, 0.4]}>
              <sphereGeometry args={[0.04, 12, 8]} />
              <Mat color="#FF7A8A" smooth />
            </mesh>
          </group>
        ) : shocked ? (
          <mesh position={[0, -0.17, 0.29]} scale={[0.8, 1.1, 0.5]}>
            <icosahedronGeometry args={[0.055, 1]} />
            <Mat color={C3.ink} />
          </mesh>
        ) : scared ? (
          <>
            {[-0.06, 0, 0.06].map((x, i) => (
              <Box key={i} s={[0.065, 0.022, 0.02]} p={[x, -0.17, 0.3]} r={[0, 0, i % 2 ? 0.5 : -0.5]} color={C3.ink} />
            ))}
          </>
        ) : relieved ? (
          <Arc p={[0, -0.13, 0.3]} r={0.07} up={false} />
        ) : (
          <Box s={[0.09, 0.022, 0.02]} p={[0, -0.16, 0.315]} color={C3.ink} />
        )}
        {scared ? (
          <mesh position={[0.3, 0.05 - ((frame % 30) / 30) * 0.12, 0.12]} scale={[0.7, 1, 0.7]}>
            <icosahedronGeometry args={[0.05, 0]} />
            <Mat color="#9FDCFF" rough={0.3} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
};
