// KIT core: materials, time/light presets (day / sunset / night / space / lab), sky, lights,
// canvas text textures and the smoothed path helper used by every camera move.
import React, { createContext, useContext, useMemo, useState } from "react";
import { interpolate, interpolateColors, random } from "remotion";
import * as THREE from "three";

export type V3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- look: one world, three ways to draw it ----------
// shaded = B and D (lit, soft shadows); flat = style A (cel colours, orthographic camera, no shadows);
// pixel = style P (cel colours, low resolution, neon palette pass; see pixel.tsx)
export type Look = "shaded" | "flat" | "pixel";
export const LookContext = createContext<Look>("shaded");
export const useLook = () => useContext(LookContext);
const toonMap = (levels: number[]) => {
  const data = new Uint8Array(levels);
  const t = new THREE.DataTexture(data, levels.length, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
};
export const TOON_FLAT = toonMap([150, 255]);
export const TOON_PIXEL = toonMap([90, 170, 255]);

// ---------- materials ----------
export const Mat: React.FC<{ color: string; rough?: number; emissive?: string; ei?: number; smooth?: boolean; metal?: number }> = ({ color, rough = 0.9, emissive, ei = 0, smooth = false, metal = 0 }) => {
  const look = useLook();
  if (look !== "shaded") return <meshToonMaterial color={color} gradientMap={look === "flat" ? TOON_FLAT : TOON_PIXEL} emissive={emissive ?? "#000000"} emissiveIntensity={ei} />;
  return <meshStandardMaterial color={color} roughness={rough} metalness={metal} emissive={emissive ?? "#000000"} emissiveIntensity={ei} flatShading={!smooth} />;
};
export const Box: React.FC<{ s: V3; p?: V3; r?: V3; color: string; shadow?: boolean; emissive?: string; ei?: number }> = ({ s, p = [0, 0, 0], r = [0, 0, 0], color, shadow = true, emissive, ei }) => (
  <mesh position={p} rotation={r} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    <Mat color={color} emissive={emissive} ei={ei} />
  </mesh>
);
export const Disc: React.FC<{ r: number; p?: V3; color: string; segs?: number }> = ({ r, p = [0, 0, 0], color, segs = 24 }) => (
  <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <circleGeometry args={[r, segs]} />
    <Mat color={color} rough={1} smooth />
  </mesh>
);

// ---------- light presets ----------
export type EnvName = "day" | "sunset" | "night" | "space" | "lab" | "body";
type Env = {
  skyTop: string; skyMid: string; horizon: string;
  key: string; keyI: number; keyDir: V3;
  hemiSky: string; hemiGround: string; hemiI: number;
  fogNear: number; fogFar: number;
  stars: number; lamps: number; windows: number; sun: number; clouds: number; cloud: string;
  rim: number; // cool back light that outlines Pom and the props (strongest at night)
};
export const ENVS: Record<EnvName, Env> = {
  day: { skyTop: "#4F86D6", skyMid: "#9CC4F0", horizon: "#FFE3B5", key: "#FFE6BE", keyI: 2.5, keyDir: [0.45, 0.8, 0.35], hemiSky: "#EAF1FF", hemiGround: "#7A6A52", hemiI: 1.15, fogNear: 18, fogFar: 55, stars: 0, lamps: 0, windows: 0, sun: 1, clouds: 1, cloud: "#FFFFFF", rim: 0.15 },
  sunset: { skyTop: "#5B4E9C", skyMid: "#C97AA0", horizon: "#FF9C6E", key: "#FF9B5E", keyI: 1.7, keyDir: [0.85, 0.22, -0.45], hemiSky: "#F2C3B8", hemiGround: "#6A4E52", hemiI: 0.9, fogNear: 16, fogFar: 50, stars: 0.1, lamps: 0.6, windows: 0.6, sun: 1, clouds: 1, cloud: "#FFC2A8", rim: 0.55 },
  night: { skyTop: "#0C1534", skyMid: "#1F2B5C", horizon: "#33406E", key: "#A9BDFF", keyI: 0.6, keyDir: [-0.5, 0.75, 0.3], hemiSky: "#6674B4", hemiGround: "#232B4C", hemiI: 0.85, fogNear: 14, fogFar: 46, stars: 1, lamps: 1, windows: 1, sun: 0, clouds: 0.6, cloud: "#3E4A7A", rim: 1.25 },
  space: { skyTop: "#02030A", skyMid: "#050818", horizon: "#0A0F26", key: "#FFFFFF", keyI: 2.8, keyDir: [-0.7, 0.35, 0.6], hemiSky: "#4A5488", hemiGround: "#05060C", hemiI: 0.35, fogNear: 400, fogFar: 900, stars: 1, lamps: 0, windows: 0, sun: 0, clouds: 0, cloud: "#000000", rim: 0.9 },
  lab: { skyTop: "#1A1F2E", skyMid: "#1A1F2E", horizon: "#1A1F2E", key: "#FFE0B8", keyI: 1.4, keyDir: [0.2, 1, 0.5], hemiSky: "#FFF0DD", hemiGround: "#3A3040", hemiI: 0.85, fogNear: 30, fogFar: 90, stars: 0, lamps: 1, windows: 1, sun: 0, clouds: 0, cloud: "#000000", rim: 0.35 },
  body: { skyTop: "#1A0612", skyMid: "#2A0A1E", horizon: "#3A0C26", key: "#FFB0D2", keyI: 1.3, keyDir: [0.2, 1, 0.6], hemiSky: "#FF8FB8", hemiGround: "#3A0A20", hemiI: 0.95, fogNear: 9, fogFar: 34, stars: 0, lamps: 0.5, windows: 0, sun: 0, clouds: 0, cloud: "#000000", rim: 0.9 },
};
const mix = (a: Env, b: Env, k: number): Env => {
  const c = (x: string, y: string) => interpolateColors(k, [0, 1], [x, y]);
  const n = (x: number, y: number) => x + (y - x) * k;
  return {
    skyTop: c(a.skyTop, b.skyTop), skyMid: c(a.skyMid, b.skyMid), horizon: c(a.horizon, b.horizon),
    key: c(a.key, b.key), keyI: n(a.keyI, b.keyI), keyDir: a.keyDir.map((v, i) => n(v, b.keyDir[i])) as V3,
    hemiSky: c(a.hemiSky, b.hemiSky), hemiGround: c(a.hemiGround, b.hemiGround), hemiI: n(a.hemiI, b.hemiI),
    fogNear: n(a.fogNear, b.fogNear), fogFar: n(a.fogFar, b.fogFar),
    stars: n(a.stars, b.stars), lamps: n(a.lamps, b.lamps), windows: n(a.windows, b.windows), sun: n(a.sun, b.sun), clouds: n(a.clouds, b.clouds), cloud: c(a.cloud, b.cloud),
    rim: n(a.rim, b.rim),
  };
};
// env keys: [second, preset]; each change blends over `blend` seconds (0 = hard switch, for cuts)
export const envAt = (sec: number, keys: [number, EnvName][], blend = 1.5): Env => {
  let e = ENVS[keys[0][1]];
  for (let i = 1; i < keys.length; i++) {
    const [t, name] = keys[i];
    if (sec < t) break;
    const k = blend <= 0 ? 1 : interpolate(sec, [t, t + blend], [0, 1], clamp);
    e = mix(e, ENVS[name], k);
  }
  return e;
};
export type EnvState = Env;

// ---------- sky (follows the camera) ----------
const skyMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } },
  vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader:
    "uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y, -0.1, 1.0); vec3 c = h < 0.18 ? mix(horizon, mid, smoothstep(-0.02, 0.18, h)) : mix(mid, top, smoothstep(0.18, 0.75, h)); gl_FragColor = vec4(c, 1.0); }",
});
const STARS = Array.from({ length: 220 }, (_, i) => {
  const a = random(`sa${i}`) * Math.PI * 2;
  const e = -0.4 + random(`se${i}`) * 1.9;
  return [Math.cos(a) * Math.cos(e) * 90, Math.sin(e) * 90, Math.sin(a) * Math.cos(e) * 90] as V3;
});
const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ a: -0.9 + i * 0.22, y: 14 + random(`cy${i}`) * 7, s: 1.6 + random(`cs${i}`) * 1.6 }));

export const Sky: React.FC<{ env: Env; frame: number; center: V3; moon?: number }> = ({ env, frame, center, moon }) => {
  const look = useLook();
  if (look === "flat") return null;
  skyMaterial.uniforms.top.value.set(env.skyTop);
  skyMaterial.uniforms.mid.value.set(env.skyMid);
  skyMaterial.uniforms.horizon.value.set(env.horizon);
  const moonO = moon ?? (env.fogFar > 300 ? 0 : Math.max(0, env.stars - 0.2) / 0.8);
  const d = new THREE.Vector3(...env.keyDir).normalize();
  return (
    <group position={center}>
      <mesh material={skyMaterial} renderOrder={-10}>
        <sphereGeometry args={[100, 32, 16]} />
      </mesh>
      {env.sun > 0.01 ? (
        <mesh position={[d.x * 85, Math.max(2, d.y * 85), d.z * 85 - 40]}>
          <circleGeometry args={[3, 24]} />
          <meshBasicMaterial color={env.key} fog={false} transparent opacity={env.sun} toneMapped={false} />
        </mesh>
      ) : null}
      {moonO > 0.01 ? (
        <mesh position={[-8, 9.5, -50]}>
          <circleGeometry args={[2.6, 24]} />
          <meshBasicMaterial color="#F4F1FF" fog={false} transparent opacity={Math.min(1, moonO)} toneMapped={false} />
        </mesh>
      ) : null}
      {env.stars > 0.02
        ? STARS.map((p, i) => (
            <mesh key={i} position={p}>
              <sphereGeometry args={[0.16 + (i % 3) * 0.07, 4, 2]} />
              <meshBasicMaterial color="#FFFFFF" fog={false} transparent opacity={env.stars * (0.55 + 0.45 * Math.sin(frame / 12 + i))} toneMapped={false} />
            </mesh>
          ))
        : null}
      {env.clouds > 0.02
        ? CLOUDS.map((c, i) => (
            <group key={i} position={[Math.sin(c.a) * 60 + frame * 0.01, c.y, -Math.cos(c.a) * 60]} scale={[c.s * 2.2, c.s * 0.7, c.s]}>
              {[-0.8, 0, 0.8].map((dx, k) => (
                <mesh key={k} position={[dx, k === 1 ? 0.35 : 0, 0]}>
                  <icosahedronGeometry args={[1, 0]} />
                  <meshStandardMaterial color={env.cloud} roughness={1} flatShading emissive={env.cloud} emissiveIntensity={0.35} fog={false} transparent opacity={env.clouds} />
                </mesh>
              ))}
            </group>
          ))
        : null}
    </group>
  );
};

// ---------- key light + fill, with a shadow box around the current place ----------
export const Lights: React.FC<{ env: Env; focus: V3; cam?: V3 }> = ({ env, focus, cam }) => {
  const look = useLook();
  const [target] = useState(() => new THREE.Object3D());
  const d = new THREE.Vector3(...env.keyDir).normalize();
  target.position.set(...focus);
  target.updateMatrixWorld();
  // rim: from behind the subject as seen by the camera, a little above
  const back = cam ? new THREE.Vector3(focus[0] - cam[0], 0, focus[2] - cam[2]).normalize() : new THREE.Vector3(0, 0, -1);
  return (
    <>
      <primitive object={target} />
      <hemisphereLight args={[env.hemiSky, env.hemiGround, look === "shaded" ? env.hemiI : env.hemiI + 0.5]} />
      <directionalLight target={target} position={[focus[0] + back.x * 20, focus[1] + 9, focus[2] + back.z * 20]} color="#9DB2FF" intensity={look === "shaded" ? env.rim * 1.6 : 0} />
      <directionalLight
        target={target}
        position={[focus[0] + d.x * 25, focus[1] + Math.max(0.25, d.y) * 25, focus[2] + d.z * 25]}
        color={env.key}
        intensity={env.keyI}
        castShadow={look !== "flat"}
        shadow-mapSize={[4096, 4096]}
        shadow-radius={6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-far={90}
      />
    </>
  );
};

// ---------- canvas text on a texture (redrawn only when its key changes) ----------
export const useCanvasTexture = (w: number, h: number, key: string, draw: (ctx: CanvasRenderingContext2D) => void) => {
  const [canvas] = useState(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  });
  const [tex] = useState(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
  useMemo(() => {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    draw(ctx);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return tex;
};
// part of a texture key, so text is redrawn once the font has loaded
export const fontsReady = (font: string) => (typeof document !== "undefined" && document.fonts.check(`900 40px ${font}`) ? "ok" : "wait");
export const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// ---------- smoothed paths: keyed points, box-filtered so speed never jumps ----------
export type PathKey = [number, V3];
const linAt = (keys: PathKey[], t: number): V3 => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let k = 1; k < keys.length; k++) {
    if (t <= keys[k][0]) {
      const [t0, a] = keys[k - 1];
      const [t1, b] = keys[k];
      const u = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return a.map((v, j) => v + (b[j] - v) * u) as V3;
    }
  }
  return keys[keys.length - 1][1];
};
export const smoothAt = (keys: PathKey[], t: number, W = 0.75): V3 => {
  if (W <= 0) return linAt(keys, t);
  const out: V3 = [0, 0, 0];
  const n = 15;
  for (let s = 0; s < n; s++) {
    const p = linAt(keys, t - W + (2 * W * s) / (n - 1));
    out[0] += p[0] / n;
    out[1] += p[1] / n;
    out[2] += p[2] / n;
  }
  return out;
};
