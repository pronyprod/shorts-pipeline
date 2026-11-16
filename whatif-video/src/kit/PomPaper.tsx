// KIT (style D): "Pom" as a flat paper cut-out standing in the 3D world.
// Every part is a flat vector shape (crisp at any size, no texture, no faceted shading)
// on a thin white card with a real edge. The art is on both faces, so turning the card
// 180 degrees is a "card flip" that shows Pom facing the other way.
// Coordinates are ported from the flat 2D Pom used in the 11 Nov style test (style A, since dropped):
// px with y down, origin between the feet; 245 px = 1 world unit (Pom is about 1.9 tall).
import React from "react";
import { TOON_PIXEL, useLook } from "./core";
import * as THREE from "three";
import { outfitColors, type Expression, type Outfit, type Pose } from "./types";

const S = 1 / 245;
const D = 0.012; // half the card thickness
const PAPER = "#FFF8EC";

const PCbase = {
  skin: "#F6C9A2",
  hat: "#FF5A5F",
  hatBand: "#E2434A",
  pom: "#FFF3DD",
  jumper: "#2E7BE0",
  jumperDark: "#1F5DB3",
  legs: "#22304F",
  ink: "#141A2E",
  blush: "#FF8F8F",
  pin: "#B8C0CC",
};

// ---------- shape helpers (svg px in, world units out) ----------
const circle = (cx: number, cy: number, r: number) => {
  const s = new THREE.Shape();
  s.absarc(cx * S, -cy * S, r * S, 0, Math.PI * 2, false);
  return s;
};
const ellipse = (cx: number, cy: number, rx: number, ry: number, rot = 0) => {
  const s = new THREE.Shape();
  s.absellipse(cx * S, -cy * S, rx * S, ry * S, 0, Math.PI * 2, false, rot);
  return s;
};
// svg rect (top-left x, y, width, height, corner radius)
const rrect = (x: number, y: number, w: number, h: number, r: number) => {
  const x0 = x * S;
  const y0 = -(y + h) * S;
  const W = w * S;
  const H = h * S;
  const R = Math.min(r * S, W / 2, H / 2);
  const s = new THREE.Shape();
  s.moveTo(x0 + R, y0);
  s.lineTo(x0 + W - R, y0);
  s.absarc(x0 + W - R, y0 + R, R, -Math.PI / 2, 0, false);
  s.lineTo(x0 + W, y0 + H - R);
  s.absarc(x0 + W - R, y0 + H - R, R, 0, Math.PI / 2, false);
  s.lineTo(x0 + R, y0 + H);
  s.absarc(x0 + R, y0 + H - R, R, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + R);
  s.absarc(x0 + R, y0 + R, R, Math.PI, Math.PI * 1.5, false);
  return s;
};
const quad = (p0: [number, number], c: [number, number], p1: [number, number], n = 14) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]] as [number, number];
  });
// a thick stroke along a polyline, with round ends
const stroke = (pts: [number, number][], w: number) => {
  const left: THREE.Vector2[] = [];
  const right: THREE.Vector2[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * (w / 2);
    const ny = (dx / len) * (w / 2);
    left.push(new THREE.Vector2((p[0] + nx) * S, -(p[1] + ny) * S));
    right.push(new THREE.Vector2((p[0] - nx) * S, -(p[1] - ny) * S));
  });
  const s = new THREE.Shape([...left, ...right.reverse()]);
  return [s, circle(pts[0][0], pts[0][1], w / 2), circle(pts[pts.length - 1][0], pts[pts.length - 1][1], w / 2)];
};
const geo = (shapes: THREE.Shape | THREE.Shape[]) => new THREE.ShapeGeometry(shapes, 20);
// the paper card behind a part: the outline, thickened, as a thin slab
const card = (shapes: THREE.Shape | THREE.Shape[]) => {
  const g = new THREE.ExtrudeGeometry(shapes, { depth: 2 * D, bevelEnabled: false, curveSegments: 20 });
  g.translate(0, 0, -D);
  return g;
};

// ---------- geometry, built once ----------
const LIMB = (len: number, w: number) => rrect(-w / 2, 0, w, len, w / 2);
const G = {
  leg: geo(LIMB(100, 38)),
  legCard: card(rrect(-27, -8, 54, 116, 27)),
  arm: geo(LIMB(92, 34)),
  armCard: card([rrect(-25, -8, 50, 108, 25), circle(0, 92, 31)]),
  body: geo(rrect(-80, -270, 160, 175, 62)),
  pocket: geo(rrect(-46, -170, 92, 40, 18)),
  bodyCard: card(rrect(-92, -282, 184, 199, 72)),
  head: geo(circle(0, 0, 100)),
  hat: (() => {
    const s = new THREE.Shape();
    s.absarc(0, 12 * S, 98 * S, Math.PI, 0, true);
    s.lineTo(98 * S, 12 * S);
    return geo(s);
  })(),
  band: geo(rrect(-104, -26, 208, 34, 17)),
  pom: geo(circle(0, -108, 28)),
  headCard: card([circle(0, 0, 112), circle(0, -108, 40), rrect(-116, -38, 232, 58, 29)]),
  pin: geo(circle(0, 0, 7)),
  // face
  browShock: geo([rrect(-62, -16, 40, 11, 5.5), rrect(22, -16, 40, 11, 5.5)]),
  browScaredL: geo(rrect(-19, -5, 38, 10, 5)),
  eye: (r: number) => geo(circle(0, 0, r)),
  eyeLight: geo([circle(-33, 32, 5), circle(43, 32, 5)]),
  blink: geo([rrect(-52, 34, 28, 7, 3.5), rrect(24, 34, 28, 7, 3.5)]),
  happyEyes: geo([...stroke(quad([-54, 34], [-38, 18], [-22, 34]), 9), ...stroke(quad([22, 34], [38, 18], [54, 34]), 9)]),
  cheeks: geo([ellipse(-62, 62, 14, 9), ellipse(62, 62, 14, 9)]),
  mouthO: geo(ellipse(0, 70, 16, 21)),
  // amazed: a big open grin (lower half of an ellipse) with a tongue
  mouthGrin: (() => {
    const s = new THREE.Shape();
    s.absellipse(0, -62 * S, 32 * S, 28 * S, Math.PI, Math.PI * 2, false, 0);
    s.lineTo(-32 * S, -62 * S);
    return geo(s);
  })(),
  tongue: geo(ellipse(0, 80, 14, 7)),
  mouthWavy: geo(stroke([...quad([-30, 72], [-21, 62], [-13, 72], 6), ...quad([-13, 72], [-4, 82], [4, 72], 6).slice(1), ...quad([4, 72], [13, 62], [21, 72], 6).slice(1)], 8)),
  mouthSmile: geo(stroke(quad([-24, 60], [0, 86], [24, 60]), 9)),
  mouthLine: geo(stroke(quad([-14, 66], [0, 74], [14, 66]), 8)),
  sweat: (() => {
    const s = new THREE.Shape();
    const p = (x: number, y: number) => new THREE.Vector2(x * S, -y * S);
    s.moveTo(p(92, -6).x, p(92, -6).y);
    s.quadraticCurveTo(p(106, 16).x, p(106, 16).y, p(92, 24).x, p(92, 24).y);
    s.quadraticCurveTo(p(78, 16).x, p(78, 16).y, p(92, -6).x, p(92, -6).y);
    return geo(s);
  })(),
};
const EYES = { 9: G.eye(9), 12: G.eye(12), 17: G.eye(17) };

// One flat coloured part, drawn on both faces of the card (the back copy shows mirrored,
// which is exactly the "turned around" look). `z` lifts it above the parts under it.
// shaded: lit by the scene's lamps, windows and sky (a little self-light so the face never goes muddy);
// flat: pure flat colours like the 2D episodes; pixel: cel steps for the palette pass
const PaperMat: React.FC<{ color: string; glow: number; back?: boolean }> = ({ color, glow, back }) => {
  const look = useLook();
  const side = back ? THREE.BackSide : THREE.FrontSide;
  if (look === "flat") return <meshBasicMaterial color={color} side={side} />;
  if (look === "pixel") return <meshToonMaterial color={color} gradientMap={TOON_PIXEL} emissive={color} emissiveIntensity={0.3} side={side} />;
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow * 0.6} roughness={0.85} side={side} />;
};
const Part: React.FC<{ g: THREE.BufferGeometry; color: string; z?: number; pos?: [number, number] ; rot?: number; glow?: number }> = ({ g, color, z = 0, pos = [0, 0], rot = 0, glow = 0.2 }) => (
  <group position={[pos[0], pos[1], 0]} rotation={[0, 0, rot]}>
    <mesh geometry={g} position={[0, 0, D + 0.0008 + z]} receiveShadow>
      <PaperMat color={color} glow={glow} />
    </mesh>
    <mesh geometry={g} position={[0, 0, -D - 0.0008 - z]} receiveShadow>
      <PaperMat color={color} glow={glow} back />
    </mesh>
  </group>
);
const Card: React.FC<{ g: THREE.BufferGeometry }> = ({ g }) => (
  <mesh geometry={g} castShadow receiveShadow>
    <PaperMat color={PAPER} glow={0.3} />
  </mesh>
);

const deg = (d: number) => (-d * Math.PI) / 180; // svg degrees (clockwise, y down) -> three radians

// a limb on a paper-fastener pin, rotating around it (limb shapes already hang down from the pin)
const Limb: React.FC<{ at: [number, number]; angle: number; g: THREE.BufferGeometry; cardG: THREE.BufferGeometry; color: string; hand?: string; z: number; children?: React.ReactNode }> = ({ at, angle, g, cardG, color, hand, z, children }) => (
  <group position={[at[0] * S, -at[1] * S, z]} rotation={[0, 0, deg(angle)]}>
    <Card g={cardG} />
    <Part g={g} color={color} />
    {hand ? <Part g={HAND} color={hand} z={0.0006} glow={0.55} /> : null}
    <Part g={G.pin} color={PCbase.pin} z={0.0012} />
    {children}
  </group>
);
const HAND = geo(circle(0, 92, 21));

export const PomPaper: React.FC<{
  position: [number, number, number];
  yaw: number; // radians; 0 = front faces +z
  expression: Expression;
  pose?: Pose;
  frame: number;
  hop?: number; // 0-1, a small jump
  held?: React.ReactNode;
  scale?: number;
  outfit?: Outfit;
  float?: boolean;
}> = ({ position, yaw, expression, pose = "idle", frame, hop = 0, held, scale = 1, outfit, float = false }) => {
  const PC = { ...PCbase, ...outfitColors(outfit) };
  const amazed = expression === "amazed";
  const shocked = expression === "shocked" || amazed;
  const scared = expression === "scared";
  const relieved = expression === "relieved";
  const running = pose === "run";
  const bob = float ? Math.sin(frame / 20) * 0.08 : running ? Math.abs(Math.sin(frame / 3)) * 0.09 : scared ? Math.sin(frame * 1.9) * 0.01 : Math.sin(frame / 9) * 0.015;
  const shiver = scared ? Math.sin(frame * 2.3) * 0.012 : 0;
  const blink = !shocked && !relieved && frame % 96 > 90;
  const swing = running ? Math.sin(frame / 3) * 40 : 0;
  const arm = (side: 1 | -1) => {
    let a = -side * 14;
    if (pose === "armsUp") a = -side * 150 + Math.sin(frame / 2 + side) * 8;
    if (pose === "run") a = -side * 20 + swing * side;
    if (pose === "hold" && side === 1) a = -70;
    if (pose === "pointUp" && side === 1) a = -165;
    return a;
  };
  const eyeR = shocked ? 17 : scared ? 9 : 12;
  // a paper card leans back a touch, like it's propped up
  const lean = 0.04;
  const headZ = 0.004;

  return (
    <group position={[position[0] + shiver, position[1] + bob + Math.sin(Math.PI * hop) * 0.35, position[2]]} rotation={[0, yaw, float ? Math.sin(frame / 29) * 0.2 : 0]} scale={scale}>
      <group rotation={[-lean, 0, 0]}>
        {/* legs (behind the body) */}
        <Limb at={[-30, -108]} angle={running ? swing * 0.8 : 0} g={G.leg} cardG={G.legCard} color={PC.legs} z={-0.002} />
        <Limb at={[30, -108]} angle={running ? -swing * 0.8 : 0} g={G.leg} cardG={G.legCard} color={PC.legs} z={-0.002} />
        {/* back arm */}
        <Limb at={[-70, -238]} angle={arm(-1)} g={G.arm} cardG={G.armCard} color={PC.jumperDark} hand={PC.skin} z={-0.004} />
        {/* body */}
        <Card g={G.bodyCard} />
        <Part g={G.body} color={PC.jumper} />
        <Part g={G.pocket} color={PC.jumperDark} z={0.0006} glow={0.1} />
        {/* head */}
        <group position={[0, 350 * S, headZ]}>
          <Card g={G.headCard} />
          <Part g={G.head} color={PC.skin} glow={0.55} />
          <Part g={G.hat} color={PC.hat} z={0.0006} />
          <Part g={G.band} color={PC.hatBand} z={0.0009} />
          <Part g={G.pom} color={PC.pom} z={0.0009} glow={0.3} />
          {shocked && !amazed ? <Part g={G.browShock} color={PC.ink} z={0.0012} glow={0} /> : null}
          {scared ? (
            <>
              <Part g={G.browScaredL} color={PC.ink} z={0.0012} pos={[-41 * S, -15 * S]} rot={deg(-18)} glow={0} />
              <Part g={G.browScaredL} color={PC.ink} z={0.0012} pos={[41 * S, -15 * S]} rot={deg(18)} glow={0} />
            </>
          ) : null}
          {relieved ? (
            <Part g={G.happyEyes} color={PC.ink} z={0.0012} glow={0} />
          ) : blink ? (
            <Part g={G.blink} color={PC.ink} z={0.0012} glow={0} />
          ) : (
            <>
              <Part g={EYES[eyeR as 9 | 12 | 17]} color={PC.ink} z={0.0012} pos={[-38 * S, -38 * S]} glow={0} />
              <Part g={EYES[eyeR as 9 | 12 | 17]} color={PC.ink} z={0.0012} pos={[38 * S, -38 * S]} glow={0} />
              {shocked ? <Part g={G.eyeLight} color="#FFFFFF" z={0.0016} glow={0.6} /> : null}
            </>
          )}
          {relieved || amazed || expression === "neutral" ? <Part g={G.cheeks} color={PC.blush} z={0.0012} /> : null}
          {amazed ? (
            <>
              <Part g={G.mouthGrin} color={PC.ink} z={0.0012} glow={0} />
              <Part g={G.tongue} color="#FF7A8A" z={0.0016} glow={0.3} />
            </>
          ) : shocked ? (
            <Part g={G.mouthO} color={PC.ink} z={0.0012} glow={0} />
          ) : scared ? (
            <Part g={G.mouthWavy} color={PC.ink} z={0.0012} glow={0} />
          ) : relieved ? (
            <Part g={G.mouthSmile} color={PC.ink} z={0.0012} glow={0} />
          ) : (
            <Part g={G.mouthLine} color={PC.ink} z={0.0012} glow={0} />
          )}
          {scared ? <Part g={G.sweat} color="#9FDCFF" z={0.0016} pos={[0, -((frame % 30) * 0.8) * S]} glow={0.4} /> : null}
        </group>
        {/* front arm (in front of the body), with whatever Pom holds */}
        <Limb at={[70, -238]} angle={arm(1)} g={G.arm} cardG={G.armCard} color={PC.jumper} hand={PC.skin} z={0.006}>
          {pose === "hold" && held ? <group position={[0, -100 * S, 0.01]}>{held}</group> : null}
        </Limb>
      </group>
    </group>
  );
};
