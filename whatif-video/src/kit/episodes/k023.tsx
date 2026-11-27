// Ep023 "What if you ate 100 Carolina Reapers?" in style P (pixel look, D's continuous camera).
// Street with one pepper -> your mouth -> a pile of 100 peppers -> a calm thermometer (nothing burns) ->
// the heat sensor wakes up -> a false alarm flashes -> lab, a Nobel medal -> "don't" -> street.
import { Box, type V3 } from "../core";
import { ANCHORS, BODY, originOf } from "../places";
import type { KitEp } from "../KitEpisode";
import { ep023 } from "../../whatif/episodes/ep023";
import voices from "../../whatif/episodes/ep023.voices.json";

const ST = originOf("street");
const BD = originOf("body");
const LAB = originOf("lab");
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const smooth = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));

// a bumpy red Carolina Reaper with a green stem and a little tail
const Pepper: React.FC<{ p?: V3; s?: number; yaw?: number }> = ({ p = [0, 0, 0], s = 1, yaw = 0 }) => (
  <group position={p} scale={s} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.22, 0]} scale={[0.2, 0.2, 0.2]} castShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshToonMaterial color="#D7263D" emissive="#8E1022" emissiveIntensity={0.35} />
    </mesh>
    <mesh position={[0.05, 0.05, 0]} rotation={[0, 0, 0.5]} scale={[0.06, 0.16, 0.06]}>
      <coneGeometry args={[1, 1, 6]} />
      <meshToonMaterial color="#B71C2E" />
    </mesh>
    <Box s={[0.06, 0.14, 0.06]} p={[-0.02, 0.46, 0]} r={[0, 0, 0.3]} color="#2F7D3E" shadow={false} />
  </group>
);

const PILE = Array.from({ length: 40 }, (_, i) => ({ p: [((i % 8) - 3.5) * 0.28 + (Math.floor(i / 8) % 2) * 0.1, Math.floor(i / 8) * 0.17, ((i * 37) % 5) * 0.08] as V3, yaw: i * 1.3 }));
const PepperPile: React.FC<{ p: V3; amount: number }> = ({ p, amount }) => (
  <group position={p}>
    {PILE.slice(0, Math.max(1, Math.round(PILE.length * amount))).map((x, i) => (
      <Pepper key={i} p={x.p} yaw={x.yaw} s={1.1} />
    ))}
  </group>
);

// a thermometer whose liquid stays low: the mouth is not hot
const Thermometer: React.FC<{ p: V3; level: number }> = ({ p, level }) => (
  <group position={p}>
    <Box s={[0.28, 2.0, 0.12]} p={[0, 1.0, 0]} color="#F4F1EA" />
    <Box s={[0.12, 1.8 * level, 0.14]} p={[0, 0.2 + 0.9 * level, 0]} color="#4DD0E1" emissive="#00ACC1" ei={0.6} shadow={false} />
    <mesh position={[0, 0.1, 0]}>
      <sphereGeometry args={[0.3, 10, 8]} />
      <meshToonMaterial color="#4DD0E1" emissive="#00ACC1" emissiveIntensity={0.6} />
    </mesh>
  </group>
);

// a ring of flashing alarm blocks (the false alarm)
const Alarm: React.FC<{ p: V3; frame: number; amount: number }> = ({ p, frame, amount }) => (
  <group position={p}>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + frame / 50;
      const on = (Math.floor(frame / 6) + i) % 2 === 0;
      return <Box key={i} s={[0.34, 0.34, 0.34]} p={[Math.cos(a) * 1.25 * amount, 1.9 + Math.sin(a) * 1.1 * amount, 0]} color={on ? "#FFEB3B" : "#FFFFFF"} emissive="#FFD600" ei={on ? 1.2 : 0.5} shadow={false} />;
    })}
  </group>
);

const Medal: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <Box s={[0.12, 0.7, 0.05]} p={[0, 1.3, 0]} color="#5C7CFA" shadow={false} />
    <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.38, 0.38, 0.08, 14]} />
      <meshToonMaterial color="#FFC107" emissive="#B8860B" emissiveIntensity={0.45} />
    </mesh>
  </group>
);

export const k023: KitEp = {
  id: "k023",
  style: "B",
  look: "pixel",
  base: { episode: ep023, voices },
  beats: [
    { line: 0, place: "street", shot: "medium", move: "push", env: "day", pom: { expr: "shocked", pose: "armsUp" }, trail: ["You", "1 Reaper"] },
    { line: 1, place: "body", shot: "medium", move: "drop", env: "body", pom: { expr: "scared", at: BODY.mouth }, trail: ["You", "Your mouth"] },
    { line: 2, place: "street", shot: "wide", move: "pull", env: "sunset", pom: { expr: "scared", pose: "armsUp" }, trail: ["You", "100 Reapers"] },
    { line: 3, place: "body", shot: "close", move: "push", env: "body", pom: { expr: "shocked", pose: "pointUp", at: BODY.mouth }, trail: ["You", "Your mouth", "Temperature"] },
    { line: 4, place: "body", shot: "medium", move: "orbitL", pom: { expr: "neutral", at: BODY.lungs }, trail: ["You", "Your nerves", "Sensor"] },
    { line: 5, place: "body", shot: "close", move: "orbitR", pom: { expr: "scared", pose: "armsUp", at: BODY.lungs }, trail: ["Your nerves", "Your brain", "Alarm"] },
    { line: 6, place: "lab", shot: "medium", move: "drop", env: "lab", pom: { expr: "neutral", pose: "pointUp", outfit: "suit" }, trail: ["Nobel Prize", "2021"], sfx: ["ding"] },
    { line: 7, place: "street", shot: "medium", move: "push", env: "day", pom: { expr: "relieved", pose: "hold" }, trail: ["You", "Don't"] },
    { line: 8, place: "street", shot: "wide", move: "pull", env: "sunset", pom: { expr: "relieved", pose: "pointUp" }, trail: ["You", "Next?"] },
  ],
  opts: () => ({ body: { breath: 1, boil: 0 } }),
  extras: (c) => {
    const st = add(ST, ANCHORS.street.pom);
    const mouth = add(BD, BODY.mouth);
    const lungs = add(BD, BODY.lungs);
    const lab = add(LAB, ANCHORS.lab.pom);
    return (
      <>
        {c.beat === 0 ? <Pepper p={add(st, [0.8, 0, 0.5])} s={2.2} yaw={c.frame / 40} /> : null}
        {c.beat === 1 ? <Pepper p={add(mouth, [0.4, 0.6, 1.0])} s={1.8} yaw={c.frame / 30} /> : null}
        {c.beat === 2 ? <PepperPile p={add(st, [-1.7, 0, -0.9])} amount={smooth(c.p, 0.05, 0.95)} /> : null}
        {c.beat === 3 ? <Thermometer p={add(mouth, [0.9, 0, 0.3])} level={0.3} /> : null}
        {c.beat === 5 ? <Alarm p={add(lungs, [0, 0.4, -0.1])} frame={c.frame} amount={smooth(c.p, 0.05, 0.4)} /> : null}
        {c.beat === 6 ? <Medal p={add(lab, [1.1, 0, 0.8])} s={0.9} /> : null}
      </>
    );
  },
};
