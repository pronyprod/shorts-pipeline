// Ep011 "What if you drank 100 coffees in one hour?" in style P (pixel look, D's continuous camera).
// Street (cups raining) -> inside you (mouth, blood, chest, blood) -> back out at cup 100 -> 24 L of water
// (ocean, tide up) -> the twist in a coffee plantation (bugs knocked over) -> home.
import { random } from "remotion";
import { ep011 } from "../../whatif/episodes/ep011";
import voices from "../../whatif/episodes/ep011.voices.json";
import { Box, type V3 } from "../core";
import { BODY, originOf } from "../places";
import { Falling } from "../props";
import type { KitEp } from "../KitEpisode";

const ST = originOf("street");
const BD = originOf("body");
const FO = originOf("forest");
const COFFEE = "#6B3B1E";

// a simple low-poly mug of coffee
const Cup: React.FC<{ p?: V3; s?: number }> = ({ p = [0, 0, 0], s = 1 }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.22, 0]} castShadow>
      <cylinderGeometry args={[0.2, 0.17, 0.44, 10]} />
      <meshStandardMaterial color="#F4F1EA" roughness={0.8} />
    </mesh>
    <mesh position={[0, 0.43, 0]}>
      <cylinderGeometry args={[0.18, 0.18, 0.02, 10]} />
      <meshStandardMaterial color={COFFEE} roughness={0.6} />
    </mesh>
    <mesh position={[0.22, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.09, 0.03, 6, 10]} />
      <meshStandardMaterial color="#F4F1EA" roughness={0.8} />
    </mesh>
  </group>
);

// caffeine bits riding the blood stream (amber, among the red cells)
const BITS = Array.from({ length: 40 }, (_, i) => ({ x: (random(`cx${i}`) - 0.5) * 5, y: 0.6 + random(`cy${i}`) * 3.4, z: random(`cz${i}`) * 30 }));
const Caffeine: React.FC<{ frame: number; amount: number }> = ({ frame, amount }) => (
  <group position={[BD[0] + 28, 0, 0]}>
    {BITS.slice(0, Math.round(BITS.length * amount)).map((b, i) => (
      <mesh key={i} position={[b.x, b.y, 6 - ((b.z + frame * 0.16) % 30)]} rotation={[frame / 20 + i, i, 0]} scale={0.22}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#C9862F" emissive="#8A4A12" emissiveIntensity={0.5} />
      </mesh>
    ))}
  </group>
);

// coffee plants: shrubs with red coffee cherries
const Shrub: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 0.7, 0]} castShadow>
      <icosahedronGeometry args={[0.75, 1]} />
      <meshStandardMaterial color="#2F7D3E" roughness={0.9} />
    </mesh>
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} position={[Math.cos(i * 0.9) * 0.62, 0.5 + (i % 3) * 0.3, Math.sin(i * 0.9) * 0.62]} scale={0.09}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshStandardMaterial color="#D7263D" />
      </mesh>
    ))}
  </group>
);
// a cartoon beetle; `down` flips it onto its back (knocked out, never hurt on screen)
const Bug: React.FC<{ p: V3; down: number; yaw: number }> = ({ p, down, yaw }) => (
  <group position={[p[0], p[1] + 0.24, p[2]]} rotation={[down * Math.PI, yaw, 0]} scale={1.3}>
    <mesh scale={[0.16, 0.1, 0.22]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial color="#3A2A4A" />
    </mesh>
    {[-1, 1].map((s) => [-0.1, 0, 0.1].map((z) => <Box key={`${s}${z}`} s={[0.14, 0.02, 0.02]} p={[s * 0.15, -0.04, z]} color="#2A1E36" shadow={false} />))}
  </group>
);
const BUGS = Array.from({ length: 6 }, (_, i) => ({ p: [FO[0] - 1.6 + i * 0.7, 0, 3.6 + (random(`bz${i}`) - 0.5) * 1.2] as V3, at: 0.15 + i * 0.1 }));

export const k011: KitEp = {
  id: "k011",
  style: "D",
  look: "pixel",
  base: { episode: ep011, voices },
  beats: [
    { line: 0, place: "street", shot: "medium", move: "push", env: "day", pom: { expr: "shocked", pose: "armsUp" }, trail: ["You", "100 cups"] },
    { line: 1, place: "body", shot: "medium", move: "drop", env: "body", pom: { expr: "neutral", at: BODY.mouth }, trail: ["You", "Your mouth"] },
    { line: 2, place: "body", shot: "medium", move: "push", pom: { expr: "shocked", at: BODY.blood }, trail: ["You", "Your mouth", "Your blood"] },
    { line: 3, place: "body", shot: "medium", move: "orbitL", pom: { expr: "scared", pose: "armsUp", at: BODY.lungs }, trail: ["You", "Your blood", "Your chest"] },
    { line: 4, place: "body", shot: "close", move: "orbitR", pom: { expr: "scared", at: BODY.blood }, trail: ["You", "Your blood", "Toxic"] },
    { line: 5, place: "street", shot: "wide", move: "pull", env: "sunset", pom: { expr: "scared", pose: "armsUp" }, trail: ["You", "Cup 100"] },
    { line: 6, place: "ocean", shot: "medium", move: "crane", env: "day", pom: { expr: "shocked", float: true }, trail: ["You", "24 L of water"], sfx: ["splash"] },
    { line: 7, place: "forest", shot: "wide", move: "drop", pom: { expr: "neutral", pose: "pointUp" }, trail: ["Coffee plant"] },
    { line: 8, place: "forest", shot: "medium", move: "orbitL", pom: { expr: "shocked" }, trail: ["Coffee plant", "Its leaves"] },
    { line: 9, place: "forest", shot: "medium", move: "pull", pom: { expr: "relieved", pose: "hold" }, trail: ["You", "Your morning cup"] },
    { line: 10, place: "street", shot: "wide", move: "pull", env: "sunset", pom: { expr: "relieved", pose: "pointUp" }, trail: ["You", "Next?"] },
  ],
  opts: (c) => ({ body: { breath: c.beat === 3 ? 3.5 : 1, boil: 0 }, ocean: { tide: c.beat === 6 ? 0.2 + c.p * 0.5 : 0, waves: 1.6 } }),
  extras: (c) => {
    const cups = c.beat === 0 ? 0.35 + c.p * 0.3 : c.beat === 5 ? 1 : 0;
    return (
      <>
        {cups > 0 ? <Falling frame={c.frame} amount={cups} origin={ST} item={() => <Cup s={1.4} />} /> : null}
        {/* the cups you've already drunk, stacking up on the street */}
        {c.beat === 0 || c.beat === 5 || c.beat === 10
          ? Array.from({ length: c.beat === 0 ? 3 : 14 }, (_, i) => <Cup key={i} p={[ST[0] - 1.6 + (i % 7) * 0.5, Math.floor(i / 7) * 0.46, 4.4 + (i % 2) * 0.3]} s={1} />)
          : null}
        {/* coffee pooling on your tongue */}
        {c.beat === 1 ? (
          <mesh position={[BD[0], 0.55, 1.2]} scale={[1.4 + c.p * 0.6, 0.12, 1.1 + c.p * 0.4]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={COFFEE} roughness={0.4} />
          </mesh>
        ) : null}
        {c.beat >= 1 && c.beat <= 4 ? <Caffeine frame={c.frame} amount={c.beat === 4 ? 1 : c.beat >= 2 ? 0.45 : 0.1} /> : null}
        {c.beat >= 7 && c.beat <= 9 ? (
          <>
            {[-3, -1.6, 2.2, 3.4].map((x, i) => <Shrub key={i} p={[FO[0] + x, 0, 1.2 + (i % 2) * 0.8]} />)}
            {c.beat >= 8 && BUGS.map((b, i) => (
              <Bug key={i} p={b.p} yaw={i} down={c.beat === 8 ? Math.min(1, Math.max(0, (c.p - b.at) * 4)) : c.beat === 9 ? 1 : 0} />
            ))}
          </>
        ) : null}
        {c.beat === 9 ? <Cup p={[FO[0] + 1.3, 0, 3.4]} s={1.6} /> : null}
      </>
    );
  },
};
