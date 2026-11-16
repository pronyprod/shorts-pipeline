// PomProds branding (12 Nov 2026): channel banners (2560x1440) and profile pictures (800x800), built from the
// style kit: paper cut-out Pom (style D look) in lit low-poly places, an in-world painted name board, pixel accents.
// Banner rule: name, tagline and Pom stay inside YouTube's all-devices box (x 507-2053, y 508-931) with a margin;
// outside it (desktop/TV only) there is scenery only.
import { loadFont as loadPixelFont } from "@remotion/google-fonts/Silkscreen";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React from "react";
import { AbsoluteFill } from "remotion";
import * as THREE from "three";
import { fontFamily } from "../whatif/theme";
import { Box, envAt, fontsReady, Lights, roundRect, Sky, useCanvasTexture, type EnvName, type EnvState, type V3 } from "./core";
import { originOf, Place, type PlaceId, type PlaceOpts } from "./places";
import { PomBlock } from "./PomBlock";
import { PomPaper } from "./PomPaper";
import type { Expression } from "./types";

const { fontFamily: PIXEL } = loadPixelFont("normal", { weights: ["400", "700"], subsets: ["latin"] });
export const SAFE = { x: 507, y: 508, w: 1546, h: 423 };
const FRAME = 40; // a fixed moment for the animated bits (waves, flames)

// golden hour: between day and sunset
const golden = (k = 0.55) => envAt(k, [[0, "day"], [0, "sunset"]], 1);
const envOf = (name: EnvName | "golden") => (name === "golden" ? golden() : envAt(0, [[0, name]], 0));

const Rig: React.FC<{ pos: V3; look: V3 }> = ({ pos, look }) => {
  const { camera } = useThree();
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...look));
  return null;
};

// One lit view of a kit place (coordinates local to the place), placed at `left` and blended into its neighbours
const PlaceShot: React.FC<{
  id: PlaceId;
  env: EnvName | "golden";
  pos: V3;
  look: V3;
  left: number;
  width: number;
  height?: number;
  fade?: [number, number]; // soft edge widths (px) on the left / right
  opts?: PlaceOpts;
  fov?: number;
  children?: (o: V3, env: EnvState) => React.ReactNode;
}> = ({ id, env: envName, pos, look, left, width, height = 1440, fade = [70, 70], opts, fov = 50, children }) => {
  const o = originOf(id);
  const env = envOf(envName);
  const P: V3 = [o[0] + pos[0], pos[1], pos[2]];
  const L: V3 = [o[0] + look[0], look[1], look[2]];
  const mask = `linear-gradient(to right, transparent 0px, black ${fade[0]}px, black ${width - fade[1]}px, transparent ${width}px)`;
  return (
    <div style={{ position: "absolute", left, top: 0, width, height, WebkitMaskImage: mask, maskImage: mask }}>
      <ThreeCanvas width={width} height={height} shadows="soft" camera={{ fov, position: P, near: 0.1, far: 400 }}>
        <Rig pos={P} look={L} />
        <fog attach="fog" args={[env.horizon, env.fogNear, env.fogFar]} />
        <Sky env={env} frame={FRAME} center={P} />
        <Lights env={env} focus={L} cam={P} />
        <Place id={id} env={env} frame={FRAME} opts={opts} />
        {children?.(o, env)}
      </ThreeCanvas>
    </div>
  );
};

// The name board: painted wood, "PomProds" big, the tagline on a cream plank (an in-world sign like the counter boards)
const NameBoard: React.FC<{ p: V3; yaw?: number; w: number; top: number; lamp?: number }> = ({ p, yaw = 0, w, top, lamp = 0 }) => {
  const h = w * 0.5;
  const tex = useCanvasTexture(2048, 1024, `brand|${fontsReady(fontFamily)}`, (ctx) => {
    ctx.fillStyle = "#6B4429";
    roundRect(ctx, 0, 0, 2048, 1024, 70);
    ctx.fill();
    ctx.fillStyle = "#7E5232";
    for (let y = 40; y < 1024; y += 90) ctx.fillRect(30, y, 1988, 8);
    // name
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 380;
    ctx.font = `900 ${size}px ${fontFamily}`;
    while (ctx.measureText("PomProds").width > 1760 && size > 120) {
      size -= 10;
      ctx.font = `900 ${size}px ${fontFamily}`;
    }
    ctx.lineJoin = "round";
    ctx.lineWidth = 46;
    ctx.strokeStyle = "#2A170C";
    ctx.strokeText("PomProds", 1024, 400);
    ctx.fillStyle = "#FFD166";
    ctx.fillText("PomProds", 1024, 400);
    // a pom-pom dot over the first "o" like a little beanie
    ctx.fillStyle = "#FF5A5F";
    ctx.beginPath();
    const nameW = ctx.measureText("PomProds").width;
    ctx.arc(1024 - nameW / 2 + nameW * 0.2, 400 - size * 0.62, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#2A170C";
    ctx.stroke();
    // tagline plank
    ctx.fillStyle = "#FFF3DD";
    roundRect(ctx, 260, 700, 1528, 220, 50);
    ctx.fill();
    ctx.fillStyle = "#141A2E";
    ctx.font = `900 150px ${fontFamily}`;
    ctx.fillText("Insane. But real.", 1024, 812);
  });
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <Box s={[0.18, top, 0.18]} p={[-w / 2 + 0.35, top / 2, -0.06]} color="#5A3A24" />
      <Box s={[0.18, top, 0.18]} p={[w / 2 - 0.35, top / 2, -0.06]} color="#5A3A24" />
      <Box s={[w + 0.16, h + 0.16, 0.12]} p={[0, top - h / 2 + 0.1, 0.04]} color="#4A2E1C" />
      <mesh position={[0, top - h / 2 + 0.1, 0.11]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.85} emissive="#FFFFFF" emissiveMap={tex} emissiveIntensity={0.32 + lamp * 0.2} />
      </mesh>
      <pointLight position={[0, top + 0.4, 1.4]} color="#FFC27A" intensity={4 + lamp * 4} distance={6} decay={1.4} />
    </group>
  );
};

// small overlay pieces (crisp 2D text on top of the render)
const DailyTag: React.FC<{ x: number; y: number; rot?: number; size?: number }> = ({ x, y, rot = -4, size = 40 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg)`, background: "#FF7A45", color: "#FFFFFF", fontFamily, fontWeight: 900, fontSize: size, letterSpacing: 3, padding: "10px 26px", borderRadius: 14, border: "6px solid #2A170C", boxShadow: "0 8px 0 rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
    NEW SHORTS DAILY
  </div>
);
const neonBox = { background: "rgba(11,7,22,0.9)", border: "6px solid #3EF0FF", boxShadow: "0 0 0 6px #0B0716, 0 0 26px rgba(62,240,255,0.6)", imageRendering: "pixelated" as const };
// the location trail from the pixel look, as a neon strip
const PixelTrail: React.FC<{ x: number; y: number; items: string[]; here: number; size?: number }> = ({ x, y, items, here, size = 30 }) => (
  <div style={{ position: "absolute", left: x, top: y, ...neonBox, padding: "6px 20px", display: "flex", gap: 12, alignItems: "center", fontFamily: PIXEL, fontSize: size, whiteSpace: "nowrap" }}>
    {items.map((s, i) => (
      <React.Fragment key={i}>
        {i > 0 ? <span style={{ color: "#9C7CFF" }}>{">"}</span> : null}
        <span style={{ color: i === here ? "#FF3EA5" : "#F5F0FF", background: i === here ? "rgba(255,62,165,0.18)" : "transparent", padding: "0 6px" }}>{s}</span>
      </React.Fragment>
    ))}
  </div>
);
// the pixel stat box (option B)
const PixelStats: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, ...neonBox, padding: "14px 22px", fontFamily: PIXEL, color: "#F5F0FF" }}>
    {[["INSANE", "#FF3EA5"], ["REAL", "#4CFF8A"], ["SOURCED", "#FFE14A"]].map(([k, c]) => (
      <div key={k} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, lineHeight: 1.5 }}>
        <span style={{ width: 150 }}>{k}</span>
        <span style={{ display: "flex", gap: 5 }}>
          {Array.from({ length: 6 }, (_, i) => <span key={i} style={{ width: 18, height: 22, background: c }} />)}
        </span>
      </div>
    ))}
  </div>
);

// ---------- banners ----------
// The journey, left to right (TV width): city, ocean, [the centre], desert, inside the body, space
// every camera is level (looks straight ahead) so the horizon sits at the same height across the whole banner
const SideSlices: React.FC = () => (
  <>
    <PlaceShot id="city" env="golden" left={0} width={360} fade={[0, 150]} pos={[-2, 1.3, 13]} look={[-2, 1.3, 0]} />
    <PlaceShot id="ocean" env="golden" left={220} width={430} fade={[150, 150]} pos={[1, 1.3, 12]} look={[1, 1.3, 0]} opts={{ waves: 1 }} />
    <PlaceShot id="desert" env="golden" left={1930} width={360} fade={[150, 130]} pos={[0, 1.3, 11]} look={[0, 1.3, 0]} />
    <PlaceShot id="body" env="body" left={2160} width={280} fade={[130, 120]} pos={[14, 1.6, 9]} look={[14, 1.6, 0]} opts={{ breath: 0 }} />
    <PlaceShot id="space" env="space" left={2320} width={240} fade={[120, 0]} pos={[3, 1.3, 13]} look={[3, 1.3, 0]} />
  </>
);

export const BannerA: React.FC = () => (
  <AbsoluteFill style={{ background: "#1B2440" }}>
    <SideSlices />
    {/* the centre: a golden-hour street; Pom and the name board stand in it */}
    <PlaceShot
      id="street"
      env="golden"
      left={460}
      width={1640}
      fade={[150, 150]}
      fov={34}
      pos={[2.1, 0.93, 14.4]}
      look={[2.1, 0.93, 2.3]}
      children={(o) => (
        <>
          <NameBoard p={[o[0] + 1.75, 0, 2.3]} w={2.9} top={1.7} />
          <PomPaper position={[o[0] - 0.4, 0, 2.6]} yaw={0.12} expression="amazed" pose="pointUp" frame={FRAME} scale={0.9} />
        </>
      )}
    />
    <DailyTag x={1560} y={650} size={32} />
    <PixelTrail x={770} y={842} size={26} items={["CITY", "OCEAN", "YOU", "DESERT", "INSIDE YOU", "SPACE"]} here={2} />
  </AbsoluteFill>
);

export const BannerB: React.FC = () => (
  <AbsoluteFill style={{ background: "#2A1A3A" }}>
    <SideSlices />
    {/* the centre: the town square at dusk, lanterns and bunting on; Pom to the right of the board */}
    <PlaceShot
      id="nightTown"
      env="sunset"
      left={460}
      width={1640}
      fade={[150, 150]}
      fov={34}
      pos={[0.6, 0.93, 14.4]}
      look={[0.6, 0.93, 2.2]}
      children={(o, env) => (
        <>
          <NameBoard p={[o[0] + 0.55, 0, 2.2]} w={2.9} top={1.7} lamp={env.lamps} />
          <PomPaper position={[o[0] + 3.05, 0, 2.6]} yaw={-0.12} expression="amazed" pose="armsUp" frame={FRAME} scale={0.9} />
        </>
      )}
    />
    <PixelStats x={590} y={660} />
    <DailyTag x={600} y={560} rot={-3} size={30} />
  </AbsoluteFill>
);

// ---------- profile pictures (800x800, no text) ----------
const ProfileShot: React.FC<{ bg: string; rays?: string; paper: boolean; expression?: Expression; env?: EnvName | "golden" }> = ({ bg, rays, paper, expression = "amazed", env: envName = "golden" }) => {
  const env = envOf(envName);
  return (
    <AbsoluteFill style={{ background: bg }}>
      {rays ? <AbsoluteFill style={{ background: `repeating-conic-gradient(from 0deg at 50% 52%, ${rays} 0deg 10deg, transparent 10deg 20deg)` }} /> : null}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.28) 0%, transparent 55%)" }} />
      <ThreeCanvas width={800} height={800} gl={{ alpha: true }} camera={{ fov: 30, position: [0, 1.5, 2.6], near: 0.1, far: 50 }}>
        {/* centred on the head so the beanie and pom-pom stay inside YouTube's round crop */}
        <Rig pos={[0, 1.5, 2.6]} look={[0, 1.5, 0]} />
        <hemisphereLight args={[env.hemiSky, env.hemiGround, 1.3]} />
        <directionalLight position={[2.5, 4, 4]} color={env.key} intensity={2.2} />
        <directionalLight position={[-3, 2, -3]} color="#9DB2FF" intensity={1.4} />
        {paper ? (
          <PomPaper position={[0, 0, 0]} yaw={0} expression={expression} pose="idle" frame={FRAME} />
        ) : (
          <PomBlock position={[0, 0, 0]} rotY={0.12} expression={expression} pose="idle" frame={FRAME} />
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
export const Profile1: React.FC = () => <ProfileShot bg="radial-gradient(circle at 50% 50%, #FFD166 0%, #FF8A3D 70%, #E2434A 100%)" rays="rgba(255,255,255,0.16)" paper={false} />;
export const Profile2: React.FC = () => <ProfileShot bg="radial-gradient(circle at 50% 45%, #3EF0FF 0%, #19B8C9 55%, #2B1B4F 100%)" paper />;
export const Profile3: React.FC = () => <ProfileShot bg="radial-gradient(circle at 50% 45%, #FF9AD5 0%, #FF3EA5 50%, #4A2A7A 100%)" rays="rgba(255,225,74,0.14)" paper />;
