// KIT props: story items that work in any place. The counter board is the in-world counter.
import React from "react";
import { random } from "remotion";
import { Box, fontsReady, Mat, roundRect, useCanvasTexture, type V3 } from "./core";

export const CASH = "#63C174";

// ---------- the in-world counter board: label, flip-number tiles, the "≈" comparison plank ----------
export type CounterValue = { label: string; value: string; unit: string; compare?: string };
export const CounterBoard: React.FC<{ v: CounterValue; font: string; p: V3; yaw?: number; w?: number; top?: number; lamp?: number; post?: boolean }> = ({ v, font, p, yaw = 0, w = 2.6, top = 2.9, lamp = 0, post = true }) => {
  const h = w * 0.66;
  const tex = useCanvasTexture(1024, 680, `${v.label}|${v.value}|${v.unit}|${v.compare}|${fontsReady(font)}`, (ctx) => {
    ctx.fillStyle = "#6B4429";
    roundRect(ctx, 0, 0, 1024, 680, 40);
    ctx.fill();
    ctx.fillStyle = "#7E5232";
    for (let y = 30; y < 680; y += 64) ctx.fillRect(20, y, 984, 4);
    ctx.fillStyle = "#FF5A5F";
    roundRect(ctx, 40, 34, 944, 120, 26);
    ctx.fill();
    ctx.fillStyle = "#FFF8EC";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lsize = Math.min(76, 1500 / Math.max(10, v.label.length));
    ctx.font = `900 ${lsize}px ${font}`;
    ctx.fillText(v.label.toUpperCase(), 512, 98);
    const chars = v.value.split("");
    const digits = chars.filter((c) => /[0-9×x]/.test(c)).length;
    const tw = Math.min(118, 700 / (digits + (chars.length - digits) * 0.45 + 1.2));
    const unitW = v.unit ? Math.min(240, v.unit.length * 62) : 0;
    const total = chars.reduce((a, c) => a + (/[0-9×x]/.test(c) ? tw : tw * 0.45) + 10, 0) + unitW;
    let x = 512 - total / 2;
    for (const ch of chars) {
      const isDigit = /[0-9×x]/.test(ch);
      if (isDigit) {
        ctx.fillStyle = "#FFF8EC";
        roundRect(ctx, x, 196, tw, 210, 16);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(x, 298, tw, 6);
        ctx.fillStyle = "#141A2E";
        ctx.font = `900 ${Math.round(tw * 1.35)}px ${font}`;
        ctx.textAlign = "center";
        ctx.fillText(ch, x + tw / 2, 306);
      } else {
        ctx.fillStyle = "#FFD166";
        ctx.beginPath();
        ctx.arc(x + tw * 0.22, 384, 14, 0, Math.PI * 2);
        ctx.fill();
        if (ch === ",") ctx.fillRect(x + tw * 0.22 - 5, 384, 10, 26);
      }
      x += (isDigit ? tw : tw * 0.45) + 10;
    }
    if (v.unit) {
      ctx.fillStyle = "#4FC3FF";
      ctx.font = `900 ${v.unit.length > 3 ? 80 : 110}px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(v.unit, x + 14, 306);
    }
    if (v.compare) {
      ctx.fillStyle = "#FFF3DD";
      roundRect(ctx, 40, 470, 944, 160, 28);
      ctx.fill();
      ctx.fillStyle = "#4FC3FF";
      ctx.beginPath();
      ctx.arc(120, 550, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#141A2E";
      ctx.textAlign = "center";
      ctx.font = `900 74px ${font}`;
      ctx.fillText("≈", 120, 548);
      ctx.textAlign = "left";
      const c = v.compare.replace(/^≈ /, "");
      ctx.font = `900 ${Math.min(70, 1500 / Math.max(10, c.length))}px ${font}`;
      ctx.fillText(c, 196, 552);
    }
  });
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      {post ? (
        <>
          <Box s={[0.14, top, 0.14]} p={[-w / 2 + 0.25, top / 2, -0.05]} color="#5A3A24" />
          <Box s={[0.14, top, 0.14]} p={[w / 2 - 0.25, top / 2, -0.05]} color="#5A3A24" />
        </>
      ) : null}
      <Box s={[w + 0.12, h + 0.12, 0.1]} p={[0, top - h / 2 + 0.1, 0.04]} color="#4A2E1C" />
      <mesh position={[0, top - h / 2 + 0.1, 0.1]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.9} emissive="#FFFFFF" emissiveMap={tex} emissiveIntensity={0.25 + lamp * 0.35} />
      </mesh>
      <pointLight position={[0, top + 0.2, 0.9]} color="#FFC27A" intensity={lamp * 5} distance={4} decay={1.5} />
    </group>
  );
};

// ---------- cash ----------
export const Bill: React.FC<{ p?: V3; r?: V3; s?: number }> = ({ p = [0, 0, 0], r = [0, 0, 0], s = 1 }) => (
  <group position={p} rotation={r} scale={s}>
    <Box s={[0.34, 0.012, 0.15]} color={CASH} shadow={false} />
    <Box s={[0.08, 0.016, 0.08]} color="#C6EDBB" shadow={false} />
  </group>
);
export const Pile: React.FC<{ p: V3; w: number; h: number; color?: string; bills?: boolean }> = ({ p, w, h, color = CASH, bills = true }) => {
  if (h <= 0.01) return null;
  return (
    <group position={p}>
      <mesh scale={[w / 2, h, w / 2.6]} castShadow receiveShadow>
        <sphereGeometry args={[1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color={color} />
      </mesh>
      {bills
        ? Array.from({ length: 16 }, (_, i) => {
            const a = random(`pa${i}`) * Math.PI * 2;
            const r = random(`pr${i}`) * 0.85;
            const y = h * Math.sqrt(Math.max(0, 1 - r * r));
            return <Bill key={i} p={[Math.cos(a) * r * (w / 2), y + 0.02, Math.sin(a) * r * (w / 2.6)]} r={[0.2, a, 0.3]} s={Math.max(0.6, w / 3)} />;
          })
        : null}
    </group>
  );
};

// Things falling through the frame (bills by default). `area` = [x0, x1, z0, z1] around `origin`.
const FALL = Array.from({ length: 110 }, (_, i) => ({ x: random(`fx${i}`), z: random(`fz${i}`), y: random(`fy${i}`) * 10, v: 0.035 + random(`fv${i}`) * 0.04, s: random(`fs${i}`) }));
export const Falling: React.FC<{ frame: number; amount: number; origin: V3; area?: [number, number, number, number]; item?: (i: number) => React.ReactNode }> = ({ frame, amount, origin, area = [-8, 8, -4, 5], item }) => (
  <group position={origin}>
    {FALL.slice(0, Math.round(FALL.length * amount)).map((b, i) => {
      const y = 10 - ((b.y + frame * b.v) % 10.5);
      if (y < 0) return null;
      const x = area[0] + b.x * (area[1] - area[0]) + Math.sin(frame / 14 + i) * 0.3;
      const z = area[2] + b.z * (area[3] - area[2]);
      return (
        <group key={i} position={[x, y, z]} rotation={[frame / (9 + b.s * 6) + i, i, Math.sin(frame / 11 + i)]}>
          {item ? item(i) : <Bill s={1.3} />}
        </group>
      );
    })}
  </group>
);

// ---------- a balance: compare two things by weight (labels are projected tags, see hud.tsx) ----------
export const balanceEnds = (tilt: number, arm = 2.4, pivotY = 2.1) => ({
  L: [-arm * Math.cos(tilt), pivotY + arm * Math.sin(tilt), 0] as V3,
  R: [arm * Math.cos(tilt), pivotY - arm * Math.sin(tilt), 0] as V3,
});
export const Balance: React.FC<{ p: V3; tilt: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ p, tilt, left, right }) => {
  const { L, R } = balanceEnds(tilt);
  return (
    <group position={p}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.3, 1.5, 0.12, 8]} />
        <Mat color="#9E9583" />
      </mesh>
      <Box s={[0.34, 2.1, 0.34]} p={[0, 1.05, 0]} color="#7D6A55" />
      <mesh position={[0, 2.2, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <Mat color="#E0B54A" />
      </mesh>
      <group position={[0, 2.1, 0]} rotation={[0, 0, -tilt]}>
        <Box s={[5.2, 0.14, 0.3]} color="#C9A24A" />
      </group>
      {[L, R].map((e, i) => (
        <group key={i} position={e}>
          <Box s={[0.04, 0.6, 0.04]} p={[0, -0.3, 0]} color="#C9A24A" />
          <mesh position={[0, -0.62, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.85, 0.6, 0.16, 10]} />
            <Mat color="#D8B65A" />
          </mesh>
          <group position={[0, -0.55, 0]}>{i === 0 ? left : right}</group>
        </group>
      ))}
    </group>
  );
};

// ---------- small common props ----------
export const Crate: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <Box s={[0.75, 0.6, 0.6]} p={[0, 0.3, 0]} color="#B5834F" />
    <Box s={[0.77, 0.06, 0.62]} p={[0, 0.2, 0]} color="#8E6238" />
    <Box s={[0.77, 0.06, 0.62]} p={[0, 0.45, 0]} color="#8E6238" />
  </group>
);
export const SignPost: React.FC<{ p: V3; yaw?: number; color?: string }> = ({ p, yaw = 0, color = "#FFD166" }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Box s={[0.1, 1.6, 0.1]} p={[0, 0.8, 0]} color="#5A3A24" />
    <Box s={[1.1, 0.5, 0.06]} p={[0, 1.45, 0.05]} color={color} />
  </group>
);
// a light bulb that glows (and lights the scene when `on`)
export const Bulb: React.FC<{ p: V3; on: number; color?: string; power?: number; size?: number }> = ({ p, on, color = "#FFB867", power = 6, size = 0.16 }) => (
  <group position={p}>
    <mesh>
      <icosahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color="#FFE2A6" emissive="#FFC46B" emissiveIntensity={0.2 + on * 3} flatShading />
    </mesh>
    <pointLight color={color} intensity={on * power} distance={7} decay={1.6} />
  </group>
);
