// KIT pixel look (style P): the same world rendered at low resolution, cut down to a neon
// palette with ordered dithering, then scaled up with hard pixel edges. Plus its own HUD:
// a stat box for the counter, a location trail ("YOU > YOUR LUNGS"), pixel captions.
// Technique only (from the owner's neon pixel reference); its topic and character are not used.
import { loadFont as loadPixelFont } from "@remotion/google-fonts/Silkscreen";
import { loadFont as loadPixelText } from "@remotion/google-fonts/PixelifySans";
import { useFrame, useThree } from "@react-three/fiber";
import React, { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { phraseChunks } from "../whatif/components/Captions";
import type { LineTiming } from "../whatif/timing";
import type { CounterValue } from "./props";

export const { fontFamily: PIXEL_FONT } = loadPixelFont("normal", { weights: ["400", "700"], subsets: ["latin"] });
export const { fontFamily: PIXEL_TEXT } = loadPixelText("normal", { weights: ["700"], subsets: ["latin"] });
export const PIXEL_SCALE = 4; // 1080x1920 shown from a 270x480 render

// 20 colours: neon night, a few pinks and mid tones (so flesh and walls keep their shapes), and Pom's own colours
export const NEON = ["#0B0716", "#1A1033", "#2B1B4F", "#4A2A7A", "#6B5B95", "#9C7CFF", "#3A5BFF", "#2E7BE0", "#3EF0FF", "#19B8C9", "#4CFF8A", "#FFE14A", "#FF8A3D", "#FF5A5F", "#FF3EA5", "#FF9AD5", "#7A1F4A", "#C2456E", "#F6C9A2", "#F5F0FF"];
const PAL = NEON.map((h) => new THREE.Color(h));

const frag = `
uniform sampler2D tDiffuse; uniform vec3 pal[20]; uniform vec2 res; varying vec2 vUv;
float bayer(vec2 p){ int x = int(mod(p.x,4.0)); int y = int(mod(p.y,4.0)); int i = x + y*4;
  float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
  for (int k=0;k<16;k++){ if(k==i) return m[k]/16.0 - 0.47; } return 0.0; }
void main(){
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  c = pow(c, vec3(1.0/2.2));
  c += bayer(vUv*res) * 0.09;
  float best = 1e9; vec3 pick = pal[0];
  for (int k=0;k<20;k++){ vec3 d = c - pal[k]; d *= vec3(0.9, 1.25, 0.75); float e = dot(d,d); if(e<best){best=e; pick=pal[k];} }
  gl_FragColor = vec4(pow(pick, vec3(2.2)), 1.0);
}`;

// Renders the scene into a small target, then draws it through the palette shader.
export const PalettePass: React.FC = () => {
  const { gl, scene, camera, size } = useThree();
  const target = useMemo(() => new THREE.WebGLRenderTarget(size.width, size.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }), [size.width, size.height]);
  const quad = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: target.texture }, pal: { value: PAL }, res: { value: new THREE.Vector2(size.width, size.height) } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false,
    });
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    return s;
  }, [target, size.width, size.height]);
  const quadCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  useFrame(() => {
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(quad, quadCam);
  }, 1);
  return null;
};

const INK = "#0B0716";
const box = (border: string) => ({ background: "rgba(11,7,22,0.88)", border: `6px solid ${border}`, boxShadow: `0 0 0 6px ${INK}, 6px 12px 0 6px rgba(0,0,0,0.5)`, imageRendering: "pixelated" as const });

// The counter as a stat box, and the location trail under it
export const PixelHud: React.FC<{ v: CounterValue; trail?: string[]; bumpFrame: number }> = ({ v, trail, bumpFrame }) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 15) % 2 === 0;
  const pop = interpolate(frame, [bumpFrame, bumpFrame + 3, bumpFrame + 8], [1, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ ...box("#3EF0FF"), padding: "14px 28px 16px", transform: `scale(${pop})`, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 520 }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 30, color: "#FF9AD5", letterSpacing: 2, textTransform: "uppercase" }}>
          {blink ? "▶ " : "  "}
          {v.label}
        </div>
        <div style={{ fontFamily: PIXEL_FONT, fontWeight: 700, fontSize: v.value.length > 8 ? 84 : 104, color: "#FFE14A", lineHeight: 1.1, textShadow: `6px 6px 0 ${INK}` }}>
          {v.value}
          {v.unit ? <span style={{ fontSize: 56, color: "#3EF0FF", marginLeft: 12 }}>{v.unit}</span> : null}
        </div>
        {v.compare ? <div style={{ fontFamily: PIXEL_FONT, fontSize: 30, color: "#F5F0FF", marginTop: 4 }}>≈ {v.compare.replace(/^≈ /, "")}</div> : null}
      </div>
      {trail?.length ? (
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 30, letterSpacing: 1, display: "flex", gap: 14, alignItems: "center", textShadow: `4px 4px 0 ${INK}`, flexWrap: "wrap", justifyContent: "center", maxWidth: 980 }}>
          {trail.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <span style={{ color: "#9C7CFF" }}>{">"}</span> : null}
              <span style={{ color: i === trail.length - 1 ? "#FF3EA5" : "#F5F0FF", background: i === trail.length - 1 ? "rgba(255,62,165,0.15)" : "transparent", padding: "2px 8px" }}>{s.toUpperCase()}</span>
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// Pixel captions: the channel's phrase rules, a pixel font, the spoken word lit up
export const PixelCaptions: React.FC<{ texts: string[]; lines: LineTiming[] }> = ({ texts, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  let i = lines.findIndex((l) => sec < l.end);
  if (i === -1) return null;
  if (sec < lines[i].start && i > 0 && sec - lines[i - 1].end < 0.25) i -= 1;
  else if (sec < lines[i].start && i > 0) return null;
  const { start, end } = lines[i];
  const chunks = phraseChunks(texts[i]);
  const weights = chunks.map((c) => c.join(" ").length + 4);
  const total = weights.reduce((a, b) => a + b, 0);
  const p = Math.min(0.999, Math.max(0, (sec - start) / (end - start)));
  let acc = 0;
  let ci = 0;
  for (; ci < chunks.length; ci++) {
    if (p < (acc + weights[ci]) / total) break;
    acc += weights[ci];
  }
  ci = Math.min(ci, chunks.length - 1);
  const words = chunks[ci];
  const inChunk = (p - acc / total) / (weights[ci] / total);
  const active = Math.min(words.length - 1, Math.floor(inChunk * words.length));
  const startF = (start + (acc / total) * (end - start)) * fps;
  const pop = interpolate(frame, [startF - 1, startF + 4], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const size = Math.min(84, 900 / (Math.min(words.join(" ").length, 16) * 0.62));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1290, height: 230, display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center", columnGap: size * 0.35, transform: `scale(${pop})` }}>
      {words.map((w, k) => (
        <span key={k} style={{ fontFamily: PIXEL_TEXT, fontWeight: 700, fontSize: size, textTransform: "uppercase", color: k === active ? "#3EF0FF" : /\d/.test(w) ? "#FFE14A" : "#F5F0FF", textShadow: `5px 0 0 ${INK}, -5px 0 0 ${INK}, 0 5px 0 ${INK}, 0 -5px 0 ${INK}, 6px 9px 0 ${INK}` }}>
          {w}
        </span>
      ))}
    </div>
  );
};

// Voiceless option (flat/A like C): each line shown as a card, word by word, at reading pace
export const TextCards: React.FC<{ texts: string[]; lines: LineTiming[]; font: string }> = ({ texts, lines, font }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  let i = 0;
  lines.forEach((l, k) => {
    if (sec >= l.start - 0.2) i = k;
  });
  const local = frame - Math.round((lines[i].start - 0.2) * fps);
  const words = texts[i].split(" ");
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1300, display: "flex", justifyContent: "center", opacity: interpolate(local, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      <div style={{ background: "rgba(10,18,38,0.88)", border: "5px solid #4FC3FF", borderRadius: 34, padding: "26px 34px", fontFamily: font, fontWeight: 800, fontSize: 58, lineHeight: 1.18, color: "#fff", textAlign: "center", boxShadow: "0 12px 0 rgba(0,0,0,0.35)" }}>
        {words.map((w, k) => (
          <span key={k} style={{ opacity: interpolate(local, [4 + k * 5, 8 + k * 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), color: /\d/.test(w) ? "#4FC3FF" : "#fff" }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};
