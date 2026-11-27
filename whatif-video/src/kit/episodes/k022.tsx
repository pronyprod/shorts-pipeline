// Ep022 (style D): Story S1, "She fell 3 km and walked home" (Juliane Koepcke, 1971).
// Pom plays Juliane in a plain white suit (never a real likeness). Forest day, a falling row of three seats,
// then the forest, a stream in the ocean place (river), and back to the forest.
import { interpolate } from "remotion";
import { ep022 } from "../../whatif/episodes/ep022";
import voices from "../../whatif/episodes/ep022.voices.json";
import { Box, type V3 } from "../core";
import { originOf } from "../places";
import type { KitEp } from "../KitEpisode";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const F = originOf("forest");

const Seats: React.FC<{ p: V3; tilt: number }> = ({ p, tilt }) => (
  <group position={p} rotation={[0.2, tilt, 0.15]}>
    {[-0.55, 0, 0.55].map((x, i) => (
      <group key={i} position={[x, 0, 0]}>
        <Box s={[0.5, 0.12, 0.5]} p={[0, 0, 0]} color="#3C5C9A" />
        <Box s={[0.5, 0.6, 0.1]} p={[0, 0.36, -0.22]} color="#3C5C9A" />
      </group>
    ))}
  </group>
);

export const k022: KitEp = {
  id: "k022",
  style: "D",
  base: { episode: ep022, voices },
  beats: [
    { line: 0, place: "forest", shot: "high", move: "drop", env: "day", pom: { expr: "shocked", pose: "armsUp", outfit: "suit" } },
    { line: 1, place: "forest", shot: "medium", move: "drop", pom: { expr: "scared", pose: "hold", outfit: "suit", float: true } },
    { line: 2, place: "forest", shot: "close", move: "push", pom: { expr: "scared", pose: "idle", outfit: "suit" } },
    { line: 3, place: "forest", shot: "medium", move: "push", pom: { expr: "neutral", pose: "pointUp", outfit: "suit" } },
    { line: 4, place: "ocean", shot: "wide", move: "pull", env: "day", pom: { expr: "neutral", pose: "run", outfit: "suit" } },
    { line: 5, place: "ocean", shot: "medium", move: "orbitL", pom: { expr: "relieved", pose: "armsUp", outfit: "suit" } },
    { line: 6, place: "forest", shot: "wide", move: "crane", env: "sunset", pom: { expr: "relieved", pose: "idle", outfit: "suit" } },
    { line: 7, place: "forest", shot: "medium", move: "push", pom: { expr: "relieved", pose: "pointUp", outfit: "suit" } },
    { line: 8, place: "forest", shot: "wide", move: "pull", env: "day", pom: { expr: "relieved", pose: "pointUp", outfit: "suit" } },
  ],
  extras: (c) =>
    c.beat === 1
      ? [<Seats key="s" p={[F[0] + 0.2, interpolate(c.p, [0, 1], [6, 2.2], clamp), 2.8]} tilt={c.frame * 0.03} />]
      : null,
};
