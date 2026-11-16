// The map: NASA Blue Marble re-projected per frame into a Lambert azimuthal equal-area view,
// with Natural Earth vectors drawn on top using the SAME projection object.
// Camera = { lon, lat, widthKm } where widthKm is the ground distance across the 1080 px frame.

import { geoAzimuthalEqualArea, geoPath, type GeoPermissibleObjects, type GeoProjection } from "d3-geo";
import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { EARTH_R_KM, type LonLat } from "../lib/geo";
import { C, H, MAP_CY, W } from "../theme";

export type Camera = { lon: number; lat: number; widthKm: number };
const CLIP_DEG = 100; // beyond this angle from the centre the globe fades into space

export const makeProjection = (cam: Camera): GeoProjection =>
  geoAzimuthalEqualArea()
    .rotate([-cam.lon, -cam.lat])
    .scale(W / (cam.widthKm / EARTH_R_KM))
    .translate([W / 2, MAP_CY])
    .clipAngle(CLIP_DEG)
    .precision(0.3);

const ProjCtx = createContext<GeoProjection | null>(null);
export const useProjection = () => useContext(ProjCtx)!;

// ---- Blue Marble texture (decoded once per browser tab) ----
type Tex = { w: number; h: number; data: Uint8ClampedArray };
let texPromise: Promise<Tex> | null = null;
const loadTexture = () =>
  (texPromise ??= new Promise<Tex>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve({ w: img.width, h: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data });
    };
    img.onerror = reject;
    img.src = staticFile("maps/bluemarble.jpg");
  }));

// Colour grade: slightly darker and cooler than the raw image, so the coloured overlays pop.
const grade = (r: number, g: number, b: number, out: Uint8ClampedArray, o: number) => {
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  out[o] = (l + (r - l) * 0.8) * 0.72;
  out[o + 1] = (l + (g - l) * 0.85) * 0.78 + 4;
  out[o + 2] = (l + (b - l) * 0.9) * 0.82 + 14;
  out[o + 3] = 255;
};

const drawRaster = (canvas: HTMLCanvasElement, tex: Tex, cam: Camera) => {
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const out = img.data;
  const s = W / (cam.widthKm / EARTH_R_KM);
  const l0 = (cam.lon * Math.PI) / 180, p0 = (cam.lat * Math.PI) / 180;
  const sl = Math.sin(l0), cl = Math.cos(l0), sp = Math.sin(p0), cp = Math.cos(p0);
  // camera frame: e0 = centre, e1 = east, e2 = north
  const e0 = [cp * cl, cp * sl, sp], e1 = [-sl, cl, 0], e2 = [-sp * cl, -sp * sl, cp];
  const clipC = (CLIP_DEG * Math.PI) / 180;
  const { w: tw, h: th, data: td } = tex;
  const space = [7, 6, 13];
  for (let py = 0; py < H; py++) {
    const Y = -(py - MAP_CY) / s;
    for (let px = 0; px < W; px++) {
      const X = (px - W / 2) / s;
      const o = (py * W + px) * 4;
      const rho = Math.sqrt(X * X + Y * Y);
      const c = rho < 2 ? 2 * Math.asin(rho / 2) : 99;
      if (c > clipC) {
        out[o] = space[0]; out[o + 1] = space[1]; out[o + 2] = space[2]; out[o + 3] = 255;
        continue;
      }
      const sc = rho > 1e-9 ? Math.sin(c) / rho : 1, cc = Math.cos(c);
      const x = cc * e0[0] + sc * X * e1[0] + sc * Y * e2[0];
      const y = cc * e0[1] + sc * X * e1[1] + sc * Y * e2[1];
      const z = cc * e0[2] + sc * Y * e2[2];
      const lon = Math.atan2(y, x), lat = Math.asin(Math.max(-1, Math.min(1, z)));
      // bilinear sample of the equirectangular texture
      const u = ((lon / Math.PI + 1) / 2) * tw - 0.5, v = (0.5 - lat / Math.PI) * th - 0.5;
      const u0 = Math.floor(u), v0 = Math.max(0, Math.min(th - 2, Math.floor(v)));
      const fu = u - u0, fv = v - v0;
      const a = (v0 * tw + ((u0 + tw) % tw)) * 4, b = (v0 * tw + ((u0 + 1 + tw) % tw)) * 4;
      const cI = a + tw * 4, dI = b + tw * 4;
      const w00 = (1 - fu) * (1 - fv), w10 = fu * (1 - fv), w01 = (1 - fu) * fv, w11 = fu * fv;
      const r = td[a] * w00 + td[b] * w10 + td[cI] * w01 + td[dI] * w11;
      const g = td[a + 1] * w00 + td[b + 1] * w10 + td[cI + 1] * w01 + td[dI + 1] * w11;
      const bl = td[a + 2] * w00 + td[b + 2] * w10 + td[cI + 2] * w01 + td[dI + 2] * w11;
      grade(r, g, bl, out, o);
      // soft limb darkening towards the clip edge
      const edge = Math.max(0, (c - clipC * 0.75) / (clipC * 0.25));
      if (edge > 0) for (let k = 0; k < 3; k++) out[o + k] = out[o + k] * (1 - edge) + space[k] * edge;
    }
  }
  ctx.putImageData(img, 0, 0);
};

export const MapView: React.FC<{ cam: Camera; children?: React.ReactNode }> = ({ cam, children }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tex, setTex] = useState<Tex | null>(null);
  const [handle] = useState(() => delayRender("Loading Blue Marble texture"));
  useEffect(() => {
    loadTexture().then((t) => {
      setTex(t);
      continueRender(handle);
    });
  }, [handle]);
  useLayoutEffect(() => {
    if (tex && ref.current) drawRaster(ref.current, tex, cam);
  }, [tex, cam.lon, cam.lat, cam.widthKm, cam]);
  const projection = useMemo(() => makeProjection(cam), [cam]);
  return (
    <ProjCtx.Provider value={projection}>
      <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, background: C.angkasa }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {children}
      </svg>
    </ProjCtx.Provider>
  );
};

// Same projection as <MapView>, for HTML layers placed above other overlays.
export const ProjectionOnly: React.FC<{ cam: Camera; children: React.ReactNode }> = ({ cam, children }) => {
  const projection = useMemo(() => makeProjection(cam), [cam]);
  return <ProjCtx.Provider value={projection}>{children}</ProjCtx.Provider>;
};

// ---- vector layers (must be children of <MapView>) ----

export const Geo: React.FC<{ d: GeoPermissibleObjects } & Omit<React.SVGProps<SVGPathElement>, "d">> = ({ d, ...rest }) => {
  const proj = useProjection();
  const path = useMemo(() => geoPath(proj)(d) ?? "", [proj, d]);
  return <path d={path} {...rest} />;
};

// Great-circle line drawn progressively (0..1).
export const Route: React.FC<{ from: LonLat; to: LonLat; progress: number; color: string; width?: number; dash?: string; glow?: boolean }> = ({
  from, to, progress, color, width = 10, dash, glow = true,
}) => {
  const proj = useProjection();
  const d = geoPath(proj)({ type: "LineString", coordinates: [from, to] }) ?? "";
  if (progress <= 0) return null;
  const common = { d, fill: "none", strokeLinecap: "round" as const, pathLength: 1 };
  const reveal = dash ? undefined : { strokeDasharray: "1 1", strokeDashoffset: 1 - progress };
  return (
    <g>
      {glow && <path {...common} stroke={color} strokeWidth={width * 2.6} opacity={0.25} style={reveal} />}
      <path {...common} stroke={C.tinta} strokeWidth={width + 6} opacity={0.6} style={reveal} />
      <path {...common} stroke={color} strokeWidth={width} strokeDasharray={dash} style={reveal} />
    </g>
  );
};

export const useXY = (p: LonLat): [number, number] => {
  const proj = useProjection();
  return (proj(p) ?? [-9999, -9999]) as [number, number];
};
