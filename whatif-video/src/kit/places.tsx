// KIT places: 8 reusable low-poly places, all in one world, 90 units apart along x.
// Each place has anchors (local coords): where Pom stands, where the counter board goes,
// and the main focus for camera shots. Episodes pick a place and a shot; they rarely need
// to place anything by hand. `opts` holds the few per-episode knobs a place understands.
import React from "react";
import { interpolateColors, random } from "remotion";
import { Box, Disc, Mat, type EnvState, type V3 } from "./core";
import { Bulb } from "./props";

export type PlaceId = "street" | "city" | "ocean" | "space" | "desert" | "lab" | "forest" | "nightTown" | "body";
export const PLACE_IDS: PlaceId[] = ["street", "city", "ocean", "space", "desert", "lab", "forest", "nightTown", "body"];
// inside the body: three zones along x, so a continuous camera "goes deeper" (use them as `at` for Pom)
export const BODY = { mouth: [0, 0.35, 2.2] as V3, lungs: [14, 0, 2.2] as V3, blood: [28, 0.6, 2.2] as V3 };
export const originOf = (id: PlaceId): V3 => [PLACE_IDS.indexOf(id) * 90, 0, 0];
export type Anchors = { pom: V3; board: { p: V3; yaw: number; top?: number; post?: boolean }; focus: V3 };
export const ANCHORS: Record<PlaceId, Anchors> = {
  street: { pom: [1.4, 0, 3.4], board: { p: [3.4, 0, 2.2], yaw: -0.12 }, focus: [1.0, 1.5, 1.5] },
  city: { pom: [0.6, 0, 3.4], board: { p: [3.2, 0, 2.4], yaw: -0.15 }, focus: [0.8, 2.2, 0] },
  ocean: { pom: [0.8, 0, 4.6], board: { p: [3.3, 0, 4.0], yaw: -0.15 }, focus: [0.6, 1.2, 0] },
  space: { pom: [0, 1.4, 2], board: { p: [3.0, -1.4, 1.0], yaw: -0.2 }, focus: [0, 1.4, 0] },
  desert: { pom: [0.8, 0, 3.2], board: { p: [3.2, 0, 2.0], yaw: -0.12 }, focus: [0.6, 1.5, 0] },
  lab: { pom: [1.6, 0, 2.4], board: { p: [3.2, 0, -4.7], yaw: 0, top: 3.8, post: false }, focus: [0, 1.6, 0] },
  forest: { pom: [0.6, 0, 3.0], board: { p: [3.0, 0, 2.0], yaw: -0.12 }, focus: [0.4, 1.5, 0] },
  nightTown: { pom: [0.5, 0, 3.2], board: { p: [3.2, 0, 1.8], yaw: -0.12 }, focus: [0, 1.8, 0] },
  body: { pom: [0, 0.35, 2.2], board: { p: [3.0, 0, 1.4], yaw: -0.15 }, focus: [0, 1.6, 0] },
};
export type PlaceOpts = { tide?: number; waves?: number; moon?: number; orbit?: number; earthShift?: number; chamber?: number; collapse?: number; sag?: number; dark?: number; breath?: number; boil?: number };

const T3 = (env: EnvState, day: string, night: string) => interpolateColors(env.lamps, [0, 1], [day, night]);

// ---------- shared pieces ----------
export const Tree: React.FC<{ p: V3; s?: number; env: EnvState; kind?: "pine" | "round" }> = ({ p, s = 1, env, kind = "pine" }) => {
  const leaf = T3(env, "#4E9A5A", "#24433A");
  return (
    <group position={p} scale={s}>
      <Box s={[0.18, 0.8, 0.18]} p={[0, 0.4, 0]} color="#7A5236" />
      {kind === "pine" ? (
        [0, 1, 2].map((k) => (
          <mesh key={k} position={[0, 1.0 + k * 0.45, 0]} castShadow>
            <coneGeometry args={[0.75 - k * 0.18, 0.9, 6]} />
            <Mat color={leaf} />
          </mesh>
        ))
      ) : (
        <mesh position={[0, 1.4, 0]} castShadow>
          <icosahedronGeometry args={[0.8, 0]} />
          <Mat color={leaf} />
        </mesh>
      )}
    </group>
  );
};
export const StreetLamp: React.FC<{ p: V3; on: number }> = ({ p, on }) => (
  <group position={p}>
    <Box s={[0.1, 2.6, 0.1]} p={[0, 1.3, 0]} color="#2A2F3E" />
    <Box s={[0.5, 0.08, 0.08]} p={[0.2, 2.6, 0]} color="#2A2F3E" />
    <Bulb p={[0.42, 2.48, 0]} on={on} power={9} />
  </group>
);
const HW = 4;
const HH = 2.5;
export const houseRidge = (sag = 0) => HH + Math.tan(0.62 - sag * 0.35) * (HW / 2 + 0.3);
export const House: React.FC<{ p: V3; s?: number; sag?: number; collapse?: number; windows: number; wall?: string; roof?: [string, string] }> = ({ p, s = 1, sag = 0, collapse = 0, windows, wall = "#F4E4C8", roof = ["#D9564B", "#C2463D"] }) => {
  const c = collapse;
  const D = 3;
  const top = HH * (1 - c * 0.75);
  const pitch = 0.62 - sag * 0.35 - c * 0.45;
  const half = (HW / 2 + 0.3) / Math.cos(pitch);
  const glow = windows * (1 - c);
  const Win: React.FC<{ px: number }> = ({ px }) => (
    <group position={[px, HH * 0.6, D / 2 + 0.02]}>
      <Box s={[0.86, 0.76, 0.06]} color="#FFFFFF" shadow={false} />
      <Box s={[0.7, 0.6, 0.07]} color={glow > 0.05 ? "#FFD38A" : "#8FD0F2"} emissive="#FFB65C" ei={glow * 1.6} shadow={false} />
      <Box s={[0.05, 0.6, 0.08]} color="#FFFFFF" shadow={false} />
    </group>
  );
  return (
    <group position={p} scale={s}>
      <group rotation={[0, 0, c * 0.25]} position={[-HW / 2, 0, 0]}>
        <Box s={[HW / 2, HH, D]} p={[HW / 4, HH / 2, 0]} color={wall} />
        <Win px={HW / 4 - 0.2} />
      </group>
      <group rotation={[0, 0, -c * 0.25]} position={[HW / 2, 0, 0]}>
        <Box s={[HW / 2, HH, D]} p={[-HW / 4, HH / 2, 0]} color={wall} />
        <Win px={-HW / 4 + 0.2} />
      </group>
      {c < 0.5 ? (
        <>
          <Box s={[0.78, 1.36, 0.06]} p={[0, 0.68, D / 2 + 0.03]} color="#A0583A" />
          <Box s={[0.08, 0.08, 0.1]} p={[0.25, 0.7, D / 2 + 0.07]} color="#F2C14E" shadow={false} />
          <Bulb p={[0.62, 1.6, D / 2 + 0.14]} on={windows} power={5} size={0.12} />
        </>
      ) : null}
      <group position={[-HW / 2 - 0.3, top, 0]} rotation={[0, 0, pitch]}>
        <Box s={[half, 0.16, D + 0.5]} p={[half / 2, 0, 0]} color={roof[0]} />
      </group>
      <group position={[HW / 2 + 0.3, top, 0]} rotation={[0, 0, -pitch]}>
        <Box s={[half, 0.16, D + 0.5]} p={[-half / 2, 0, 0]} color={roof[1]} />
      </group>
      {c < 0.3 ? <Box s={[0.4, 0.9, 0.4]} p={[0.95, top + 0.95, -0.4]} color="#9E3A33" /> : null}
      {/* window glow spilling onto the yard (coloured light, not just bright pixels) */}
      <pointLight position={[0, HH * 0.6, D / 2 + 1.1]} color="#FFB25E" intensity={glow * 6} distance={6} decay={1.7} />
    </group>
  );
};
const Hills: React.FC<{ env: EnvState; color: string; far?: number; seed: string }> = ({ env, color, far = -30, seed }) => (
  <>
    {Array.from({ length: 9 }, (_, i) => {
      const s = 6 + random(`${seed}s${i}`) * 6;
      return (
        <mesh key={i} position={[-36 + i * 9 + random(`${seed}x${i}`) * 4, -s * 0.45, far - random(`${seed}z${i}`) * 8]} scale={[s * 1.6, s, s]}>
          <icosahedronGeometry args={[1, 1]} />
          <Mat color={T3(env, color, "#253A35")} />
        </mesh>
      );
    })}
  </>
);

// ---------- the 8 places ----------
const Street: React.FC<{ env: EnvState; o: PlaceOpts }> = ({ env, o }) => (
  <>
    <Disc r={45} color={T3(env, "#86B86A", "#2E4A3A")} />
    <Box s={[80, 0.04, 2.8]} p={[0, 0.02, 5.6]} color="#4A5168" shadow={false} />
    <Box s={[80, 0.08, 1.3]} p={[0, 0.04, 3.9]} color="#C9C2B4" shadow={false} />
    {Array.from({ length: 14 }, (_, i) => <Box key={i} s={[1.1, 0.05, 0.1]} p={[-20 + i * 3, 0.05, 5.6]} color="#F2E9D2" shadow={false} />)}
    <House p={[0, 0, 0]} sag={o.sag} collapse={o.collapse} windows={env.windows} />
    <House p={[-6.6, 0, 0]} windows={env.windows} wall="#CFE0F0" roof={["#4E6FA8", "#45629A"]} />
    <House p={[-13, 0, 0]} windows={env.windows} wall="#F0D9DE" roof={["#8E5A9E", "#7E4F8C"]} />
    <House p={[7, 0, -1]} windows={env.windows} wall="#E8E1C9" roof={["#5E8F55", "#527F4A"]} />
    {[[-3.3, -1.4, 1.1], [3.6, -3.4, 1.2], [11.5, -1.2, 0.9], [-9.6, -1.8, 1.2], [-2.6, 2.2, 0.6]].map(([x, z, s], i) => <Tree key={i} p={[x, 0, z]} s={s} env={env} />)}
    {[-3.6, 5.4, 13].map((x) => <StreetLamp key={x} p={[x, 0, 4.55]} on={env.lamps} />)}
    <Hills env={env} color="#6FA060" seed="st" />
  </>
);

const CITY = Array.from({ length: 26 }, (_, i) => ({ x: -16 + (i % 13) * 2.7, z: i < 13 ? -3.2 : -8.5, h: 3 + random(`ch${i}`) * (i < 13 ? 6 : 11), w: 2 + random(`cw${i}`) * 0.5, c: ["#7C8DB5", "#9AA6C4", "#6A7BA3", "#B0A2C8"][i % 4] }));
const City: React.FC<{ env: EnvState; frame: number }> = ({ env, frame }) => (
  <>
    <Disc r={45} color={T3(env, "#8D93A6", "#262B3D")} />
    <Box s={[80, 0.04, 3.4]} p={[0, 0.02, 5.2]} color="#3E4459" shadow={false} />
    <Box s={[80, 0.08, 1.6]} p={[0, 0.04, 2.8]} color="#C9C5BD" shadow={false} />
    {Array.from({ length: 9 }, (_, i) => <Box key={i} s={[0.4, 0.05, 2.6]} p={[-1.6 + i * 0.5, 0.05, 5.2]} color="#F2E9D2" shadow={false} />).slice(0, 7)}
    {CITY.map((b, i) => (
      <group key={i} position={[b.x, 0, b.z]}>
        <Box s={[b.w, b.h, 2.2]} p={[0, b.h / 2, 0]} color={T3(env, b.c, "#3A4466")} />
        {Array.from({ length: Math.floor(b.h / 1.1) }, (_, k) => (
          <Box key={k} s={[b.w * 0.8, 0.3, 0.04]} p={[0, 0.8 + k * 1.1, 1.12]} color="#CFE6FF" emissive="#FFC878" ei={env.windows * (random(`cl${i}${k}`) > 0.35 ? 1.3 : 0)} shadow={false} />
        ))}
      </group>
    ))}
    {[[-6, "#E2434A"], [5, "#FFD166"], [12, "#4FC3FF"]].map(([x, c], i) => (
      <group key={i} position={[(((x as number) + frame * 0.06 * (i % 2 ? 1 : -1) + 40) % 40) - 20, 0, i % 2 ? 4.6 : 5.8]}>
        <Box s={[1.5, 0.45, 0.75]} p={[0, 0.35, 0]} color={c as string} />
        <Box s={[0.8, 0.35, 0.7]} p={[-0.1, 0.75, 0]} color="#DDE8F5" />
      </group>
    ))}
    {[-5, 4, 12].map((x) => <StreetLamp key={x} p={[x, 0, 3.7]} on={env.lamps} />)}
    {[[-2.5, 2.3], [7.5, 2.3]].map(([x, z], i) => <Tree key={i} p={[x, 0, z]} s={0.8} env={env} kind="round" />)}
  </>
);

const Ocean: React.FC<{ env: EnvState; frame: number; o: PlaceOpts }> = ({ env, frame, o }) => {
  const tide = o.tide ?? 0;
  const amp = o.waves ?? 1;
  const water = T3(env, "#3A8FD0", "#16305E");
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05 + tide, -20]} receiveShadow>
        <planeGeometry args={[160, 60]} />
        <meshStandardMaterial color={water} roughness={0.35} metalness={0.1} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const z = -2 - i * 3.2 + ((frame * 0.03) % 3.2);
        return <Box key={i} s={[60, 0.08, 0.35]} p={[0, tide + 0.05 + Math.sin(frame / 12 + i) * 0.12 * amp, z]} color={T3(env, "#BFE3FF", "#3E5E8E")} shadow={false} />;
      })}
      {/* beach */}
      <mesh position={[0, -0.2, 7]} rotation={[-0.06, 0, 0]} receiveShadow>
        <boxGeometry args={[80, 0.5, 10]} />
        <Mat color={T3(env, "#F1D9A6", "#5E5642")} />
      </mesh>
      {/* pier */}
      <Box s={[1.4, 0.12, 12]} p={[-3.5, 0.55, -3]} color="#A07850" />
      {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.14, 1.4, 0.14]} p={[-4.1 + (i % 2) * 1.2, 0, -8 + Math.floor(i / 2) * 4]} color="#7A5A3A" />)}
      {/* lighthouse on a rock */}
      <group position={[7, 0, -9]}>
        <mesh position={[0, 0.2, 0]}>
          <icosahedronGeometry args={[2.2, 0]} />
          <Mat color="#7E8492" />
        </mesh>
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.7, 4, 8]} />
          <Mat color="#F4F1EA" />
        </mesh>
        <Box s={[1.0, 0.5, 1.0]} p={[0, 5.2, 0]} color="#E2434A" />
        <Bulb p={[0, 5.6, 0]} on={Math.max(env.lamps, 0.3)} power={10} size={0.25} />
      </group>
      {[[-8, 4.5], [9, 5.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Box s={[0.18, 2.2, 0.18]} p={[0, 1.1, 0]} r={[0, 0, 0.12]} color="#8B6A44" />
          {[0, 1.2, 2.4, 3.6, 4.8].map((a, k) => <Box key={k} s={[1.3, 0.08, 0.35]} p={[Math.cos(a) * 0.55 + 0.25, 2.2, Math.sin(a) * 0.55]} r={[0, -a, -0.35]} color={T3(env, "#4E9A5A", "#24433A")} />)}
        </group>
      ))}
    </>
  );
};

const SPACE_ROCKS = Array.from({ length: 10 }, (_, i) => [(random(`ax${i}`) - 0.5) * 30, (random(`ay${i}`) - 0.5) * 14, -8 - random(`az${i}`) * 20] as V3);
const Space: React.FC<{ frame: number; o: PlaceOpts }> = ({ frame, o }) => {
  const moon = o.moon ?? 1;
  const orbit = o.orbit ?? 0;
  const shift = o.earthShift ?? 0;
  return (
    <>
      {/* Earth below, slowly turning */}
      <group position={[shift, -9, -12]} rotation={[0.3, frame * 0.003, 0]}>
        <mesh>
          <icosahedronGeometry args={[8, 3]} />
          <Mat color="#2F79C9" smooth />
        </mesh>
        {Array.from({ length: 14 }, (_, i) => {
          const a = random(`ea${i}`) * Math.PI * 2;
          const b = (random(`eb${i}`) - 0.5) * 2.4;
          return (
            <mesh key={i} position={[Math.cos(a) * Math.cos(b) * 7.7, Math.sin(b) * 7.7, Math.sin(a) * Math.cos(b) * 7.7]} scale={[1.6, 0.5, 1.2]}>
              <icosahedronGeometry args={[1, 0]} />
              <Mat color={i % 4 === 0 ? "#F4F1EA" : "#5FAE5F"} />
            </mesh>
          );
        })}
      </group>
      {/* the Moon */}
      {moon > 0.01 ? (
        <mesh position={[9, 4, -20]} scale={moon}>
          <icosahedronGeometry args={[2.2, 1]} />
          <Mat color="#C9CBD3" />
        </mesh>
      ) : null}
      {/* the shared orbit point of Earth and Moon */}
      {orbit > 0.01 ? (
        <>
          <mesh position={[shift, -9, -12]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
            <torusGeometry args={[10.5, 0.05, 4, 64]} />
            <meshBasicMaterial color="#FFD166" transparent opacity={orbit} toneMapped={false} />
          </mesh>
          <mesh position={[0, -9 + 0, -12]}>
            <sphereGeometry args={[0.35, 8, 6]} />
            <meshBasicMaterial color="#FF7A45" transparent opacity={orbit} toneMapped={false} />
          </mesh>
        </>
      ) : null}
      {/* the Sun, far away */}
      <mesh position={[-70, 18, -70]}>
        <sphereGeometry args={[7, 16, 12]} />
        <meshBasicMaterial color="#FFE6A8" toneMapped={false} />
      </mesh>
      {/* a small station */}
      <group position={[-4.2, 3.2, -3]} rotation={[0.2, frame * 0.004, 0.3]}>
        <mesh>
          <cylinderGeometry args={[0.45, 0.45, 2.2, 8]} />
          <Mat color="#DDE3EC" />
        </mesh>
        <Box s={[3.6, 0.04, 0.9]} p={[0, 0.3, 0]} color="#2E4E8F" emissive="#3E6BC0" ei={0.3} />
      </group>
      {SPACE_ROCKS.map((p, i) => (
        <mesh key={i} position={p} rotation={[i, frame * 0.01 + i, 0]}>
          <icosahedronGeometry args={[0.25 + (i % 3) * 0.2, 0]} />
          <Mat color="#8A8E9A" />
        </mesh>
      ))}
    </>
  );
};

const Desert: React.FC<{ env: EnvState }> = ({ env }) => (
  <>
    <Disc r={45} color={T3(env, "#E9C98E", "#5A4C3A")} />
    {Array.from({ length: 8 }, (_, i) => (
      <mesh key={i} position={[-20 + i * 6 + random(`dx${i}`) * 3, -0.6, -6 - random(`dz${i}`) * 14]} scale={[4 + random(`ds${i}`) * 3, 1.4 + random(`dh${i}`), 3]}>
        <sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color={T3(env, "#E2BB7A", "#544634")} />
      </mesh>
    ))}
    {[[-3, 1, 1], [5, -2, 1.3], [-7, -4, 0.9], [2, -7, 1.1]].map(([x, z, s], i) => (
      <group key={i} position={[x, 0, z]} scale={s}>
        <Box s={[0.35, 1.8, 0.35]} p={[0, 0.9, 0]} color="#4E9A5A" />
        <Box s={[0.25, 0.8, 0.25]} p={[0.35, 1.0, 0]} color="#4E9A5A" />
        <Box s={[0.4, 0.2, 0.25]} p={[0.25, 0.6, 0]} color="#4E9A5A" />
      </group>
    ))}
    {[[-12, -18, 6, 4], [14, -22, 8, 5]].map(([x, z, w, h], i) => <Box key={i} s={[w, h, w * 0.8]} p={[x, h / 2, z]} color={T3(env, "#C9774E", "#4A3330")} />)}
    {[[1.5, 1.5], [-5, 3], [6, 2]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.2, z]}>
        <icosahedronGeometry args={[0.45, 0]} />
        <Mat color="#A88A6A" />
      </mesh>
    ))}
  </>
);

const Lab: React.FC<{ env: EnvState; frame: number; o: PlaceOpts }> = ({ env, frame, o }) => {
  const chamber = o.chamber ?? 0;
  return (
    <>
      <Box s={[16, 0.2, 12]} p={[0, -0.1, 0]} color="#C9CFD9" />
      {Array.from({ length: 8 }, (_, i) => <Box key={i} s={[16, 0.02, 0.04]} p={[0, 0.01, -5 + i * 1.5]} color="#AEB6C4" shadow={false} />)}
      <Box s={[16, 6, 0.3]} p={[0, 3, -5.4]} color="#5D6B86" />
      <Box s={[0.3, 6, 12]} p={[-8, 3, 0]} color="#6A7894" />
      <Box s={[0.3, 6, 12]} p={[8, 3, 0]} color="#6A7894" />
      <Box s={[16, 0.3, 0.32]} p={[0, 1.1, -5.2]} color="#E2434A" shadow={false} />
      {/* ceiling lights */}
      {[-3.5, 0, 3.5].map((x) => (
        <group key={x} position={[x, 5.2, -0.5]}>
          <Box s={[2.2, 0.08, 0.5]} color="#FFF6E5" emissive="#FFF0D0" ei={1.6} shadow={false} />
          <pointLight position={[0, -0.4, 0]} color="#FFE7C2" intensity={env.lamps * 14} distance={12} decay={1.4} />
        </group>
      ))}
      {/* the vacuum chamber */}
      <group position={[-3.2, 0, -2.2]}>
        <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.0, 2.0, 3.8, 14]} />
          <Mat color="#B9C2D0" metal={0.3} rough={0.5} />
        </mesh>
        <mesh position={[0, 3.95, 0]}>
          <sphereGeometry args={[2.0, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat color="#AAB3C2" metal={0.3} rough={0.5} />
        </mesh>
        <mesh position={[0, 2.0, 1.97]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.12, 6, 18]} />
          <Mat color="#7C8698" />
        </mesh>
        <mesh position={[0, 2.0, 1.99]}>
          <circleGeometry args={[0.66, 18]} />
          <meshStandardMaterial color="#9FD8FF" emissive="#6EC1FF" emissiveIntensity={0.4 + chamber * 1.4} />
        </mesh>
        {/* pressure lamp: red while empty */}
        <Bulb p={[1.3, 3.6, 1.6]} on={1} color={chamber > 0.5 ? "#FF5A5F" : "#7CFF9A"} power={4} size={0.14} />
      </group>
      {/* consoles and benches */}
      {[[2.2, -3.6], [4.6, -3.6]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Box s={[2.0, 1.0, 0.9]} p={[0, 0.5, 0]} color="#3E4A66" />
          <Box s={[1.6, 0.7, 0.06]} p={[0, 1.45, -0.2]} r={[-0.25, 0, 0]} color="#0F1A2E" emissive="#4FC3FF" ei={0.8 + 0.3 * Math.sin(frame / 7 + i)} shadow={false} />
        </group>
      ))}
      <Box s={[2.6, 0.9, 1.0]} p={[5.6, 0.45, 0.5]} color="#8E99AE" />
      {[-0.6, 0, 0.6].map((x, i) => (
        <mesh key={i} position={[5.6 + x, 1.05, 0.5]}>
          <cylinderGeometry args={[0.12, 0.12, 0.3, 8]} />
          <meshStandardMaterial color={["#4FC3FF", "#7CFF9A", "#FFD166"][i]} emissive={["#4FC3FF", "#7CFF9A", "#FFD166"][i]} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* pipes */}
      <Box s={[0.16, 0.16, 5]} p={[-1.1, 4.6, -2.9]} r={[0, Math.PI / 2, 0]} color="#8C96A8" />
      <Box s={[0.16, 3.0, 0.16]} p={[-1.1, 3.1, -5.1]} color="#8C96A8" />
    </>
  );
};

const FIREFLIES = Array.from({ length: 24 }, (_, i) => [(random(`ff${i}`) - 0.5) * 12, 0.6 + random(`fy${i}`) * 2, (random(`fz${i}`) - 0.5) * 8] as V3);
const Forest: React.FC<{ env: EnvState; frame: number }> = ({ env, frame }) => (
  <>
    <Disc r={45} color={T3(env, "#6FA35A", "#223A2E")} />
    <Box s={[1.6, 0.03, 40]} p={[-1.5, 0.02, 0]} r={[0, 0.2, 0]} color={T3(env, "#C9A877", "#4A4030")} shadow={false} />
    {Array.from({ length: 30 }, (_, i) => {
      const x = (random(`tx${i}`) - 0.5) * 34;
      const z = -3 - random(`tz${i}`) * 20;
      return <Tree key={i} p={[x, 0, z]} s={0.9 + random(`ts${i}`) * 1.2} env={env} kind={i % 3 ? "pine" : "round"} />;
    })}
    {[[-5, 2.2, 1.3], [6.5, 1.0, 1.1]].map(([x, z, s], i) => <Tree key={i} p={[x, 0, z]} s={s} env={env} />)}
    {/* campfire */}
    <group position={[-2.2, 0, 1.6]}>
      {[0, 1, 2, 3].map((k) => <Box key={k} s={[0.7, 0.1, 0.12]} p={[0, 0.06, 0]} r={[0, (k * Math.PI) / 4, 0]} color="#6B4429" />)}
      <mesh position={[0, 0.35, 0]} scale={[1, 1 + 0.15 * Math.sin(frame / 3), 1]}>
        <coneGeometry args={[0.25, 0.6, 5]} />
        <meshStandardMaterial color="#FFB24A" emissive="#FF8A2A" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color="#FF9A4A" intensity={4 + env.lamps * 6 + Math.sin(frame / 2) * 0.8} distance={7} decay={1.5} />
    </group>
    {env.lamps > 0.3
      ? FIREFLIES.map((p, i) => (
          <mesh key={i} position={[p[0] + Math.sin(frame / 20 + i) * 0.4, p[1] + Math.sin(frame / 13 + i) * 0.2, p[2]]}>
            <sphereGeometry args={[0.04, 4, 3]} />
            <meshBasicMaterial color="#FFF29A" transparent opacity={env.lamps * (0.5 + 0.5 * Math.sin(frame / 6 + i))} toneMapped={false} />
          </mesh>
        ))
      : null}
    <Hills env={env} color="#5E8F55" seed="fo" />
  </>
);

const NightTown: React.FC<{ env: EnvState; frame: number }> = ({ env, frame }) => (
  <>
    <Disc r={45} color={T3(env, "#8DAF74", "#25343A")} />
    <mesh position={[0, 0.03, 0]} receiveShadow>
      <cylinderGeometry args={[6, 6, 0.06, 12]} />
      <Mat color={T3(env, "#C9BFAE", "#5A5560")} />
    </mesh>
    {/* fountain */}
    <group position={[-2.6, 0, -1]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.2, 1.3, 0.6, 10]} />
        <Mat color="#B7AE9C" />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[1.05, 1.05, 0.04, 10]} />
        <meshStandardMaterial color="#5FB0E8" emissive="#3E7FC0" emissiveIntensity={0.3} />
      </mesh>
      <Box s={[0.2, 1.4, 0.2]} p={[0, 1.0, 0]} color="#B7AE9C" />
    </group>
    {/* houses around the square */}
    {[[-9, -6, 0.8, "#F0D9DE"], [-3.5, -8, 0.8, "#CFE0F0"], [3, -8, 0.85, "#E8E1C9"], [9, -6, 0.8, "#F4E4C8"]].map(([x, z, s, c], i) => (
      <House key={i} p={[x as number, 0, z as number]} s={s as number} windows={env.windows} wall={c as string} roof={i % 2 ? ["#4E6FA8", "#45629A"] : ["#D9564B", "#C2463D"]} />
    ))}
    {/* bunting and lanterns */}
    {[-1, 1].map((side) => (
      <group key={side}>
        <Box s={[0.08, 3.2, 0.08]} p={[side * 5.2, 1.6, 1.5]} color="#2A2F3E" />
        <Bulb p={[side * 5.2, 3.25, 1.5]} on={env.lamps} power={8} />
      </group>
    ))}
    {Array.from({ length: 14 }, (_, i) => {
      const x = -5 + (i / 13) * 10;
      const sag = Math.sin((i / 13) * Math.PI) * 0.6;
      return (
        <mesh key={i} position={[x, 3.1 - sag, 1.5]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.14, 0.28, 3]} />
          <meshStandardMaterial color={["#FF5A5F", "#FFD166", "#4FC3FF", "#7CFF9A"][i % 4]} emissive={["#FF5A5F", "#FFD166", "#4FC3FF", "#7CFF9A"][i % 4]} emissiveIntensity={0.2 + env.lamps * 0.5 + 0.1 * Math.sin(frame / 9 + i)} />
        </mesh>
      );
    })}
    {[[-7, 1.5], [8, 0.5]].map(([x, z], i) => <Tree key={i} p={[x, 0, z]} s={1} env={env} kind="round" />)}
    <Hills env={env} color="#6FA060" seed="nt" />
  </>
);

const CAVE = Array.from({ length: 16 }, (_, i) => ({ a: (i / 16) * Math.PI * 2, s: 2.2 + random(`cv${i}`) * 1.6 }));
const Cave: React.FC<{ x: number }> = ({ x }) => (
  <group position={[x, 0, 0]}>
    <Disc r={9} color="#6E1A3E" />
    {/* the walls ring the back and sides only, so the camera can look in from the front */}
    {CAVE.filter((c) => Math.sin(c.a) < 0.2).map((c, i) => (
      <mesh key={i} position={[Math.cos(c.a) * 8.5, 1.5 + Math.sin(c.a * 3) * 1.2, Math.sin(c.a) * 7 - 2]} scale={[c.s, c.s * 1.6, c.s]}>
        <icosahedronGeometry args={[1, 1]} />
        <Mat color={i % 2 ? "#C2456E" : "#A83560"} />
      </mesh>
    ))}
  </group>
);
const CELLS = Array.from({ length: 18 }, (_, i) => ({ y: 0.8 + random(`ry${i}`) * 3, x: (random(`rx${i}`) - 0.5) * 4, z: random(`rz${i}`) * 30, r: random(`rr${i}`) * 6 }));
const Body: React.FC<{ frame: number; o: PlaceOpts }> = ({ frame, o }) => {
  const breath = o.breath ?? 1;
  const b = 1 + 0.06 * Math.sin(frame / 14) * breath;
  return (
    <>
      {/* mouth: tongue, teeth, little boiling bubbles */}
      <Cave x={0} />
      <mesh position={[0, 0, 0.5]} scale={[3.2, 0.55, 4.2]}>
        <sphereGeometry args={[1, 12, 8]} />
        <Mat color="#FF7A9C" smooth />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = -0.9 + (i / 7) * 1.8;
        return (
          <group key={i}>
            <Box s={[0.7, 0.9, 0.5]} p={[Math.sin(a) * 4.2, 4.3, Math.cos(a) * 2.6 - 2.4]} color="#F5F0E6" />
            <Box s={[0.7, 0.8, 0.5]} p={[Math.sin(a) * 4.2, 0.4, Math.cos(a) * 2.6 - 3.4]} color="#F5F0E6" />
          </group>
        );
      })}
      {(o.boil ?? 0) > 0
        ? Array.from({ length: 14 }, (_, i) => {
            const life = ((frame + i * 9) % 36) / 36;
            return (
              <mesh key={i} position={[(random(`bb${i}`) - 0.5) * 3, 0.6 + life * 2.4, (random(`bz${i}`) - 0.3) * 2.5]} scale={(0.08 + life * 0.14) * (o.boil ?? 0)}>
                <sphereGeometry args={[1, 8, 6]} />
                <meshStandardMaterial color="#E8F8FF" transparent opacity={0.85 * (1 - life)} />
              </mesh>
            );
          })
        : null}
      {/* lungs: two breathing balloons and the airway between them */}
      <Cave x={14} />
      {[-1, 1].map((side) => (
        <mesh key={side} position={[14 + side * 3, 3.2, -2.6]} scale={[2.4 * b, 3.4 * b, 2 * b]}>
          <icosahedronGeometry args={[1, 2]} />
          <Mat color="#FF8FB0" />
        </mesh>
      ))}
      <Box s={[0.6, 3.4, 0.6]} p={[14, 5.4, -2.6]} color="#F2C2CF" />
      {[-1, 1].map((side) => <Box key={side} s={[0.4, 2.2, 0.4]} p={[14 + side * 1.1, 3.6, -2.6]} r={[0, 0, side * 0.7]} color="#F2C2CF" />)}
      {/* blood: a vessel with red cells streaming past */}
      <group position={[28, 0, 0]}>
        <mesh position={[0, 2.4, -6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.2, 4.2, 40, 16, 1, true]} />
          <meshStandardMaterial color="#9E1F3E" side={1} roughness={0.8} />
        </mesh>
        {CELLS.map((c, i) => {
          const z = 6 - ((c.z + frame * 0.12) % 30);
          return (
            <mesh key={i} position={[c.x, c.y, z]} rotation={[c.r, c.r * 2, 0]}>
              <torusGeometry args={[0.45, 0.22, 6, 12]} />
              <Mat color="#E2334A" smooth />
            </mesh>
          );
        })}
      </group>
    </>
  );
};

export const Place: React.FC<{ id: PlaceId; env: EnvState; frame: number; opts?: PlaceOpts }> = ({ id, env, frame, opts = {} }) => (
  <group position={originOf(id)}>
    {id === "street" ? <Street env={env} o={opts} /> : null}
    {id === "city" ? <City env={env} frame={frame} /> : null}
    {id === "ocean" ? <Ocean env={env} frame={frame} o={opts} /> : null}
    {id === "space" ? <Space frame={frame} o={opts} /> : null}
    {id === "desert" ? <Desert env={env} /> : null}
    {id === "lab" ? <Lab env={env} frame={frame} o={opts} /> : null}
    {id === "forest" ? <Forest env={env} frame={frame} /> : null}
    {id === "nightTown" ? <NightTown env={env} frame={frame} /> : null}
    {id === "body" ? <Body frame={frame} o={opts} /> : null}
  </group>
);
