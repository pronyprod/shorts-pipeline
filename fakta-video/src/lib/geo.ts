// Map math shared by the video and the Node scripts.
//
// Honest "true size" comparison: a shape is moved by ROTATING it on the sphere (no stretching),
// then every layer is drawn with ONE projection (Lambert azimuthal equal-area centred on the camera)
// at ONE scale. Distances and areas of a moved shape stay exactly as they were.

import { geoInterpolate, geoRotation } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";

export type LonLat = [number, number];
export const EARTH_R_KM = 6371.0088;

// Rotation that carries `from` to `to` while keeping "north up" at the shape's centre:
// first `from` is taken to (0°, 0°), then (0°, 0°) is taken to `to`.
export const moveFn = (from: LonLat, to: LonLat) => {
  const a = geoRotation([-from[0], -from[1]]);
  const b = geoRotation([-to[0], -to[1]]);
  return (p: LonLat): LonLat => b.invert(a(p) as LonLat) as LonLat;
};

const mapCoords = (c: unknown, f: (p: LonLat) => LonLat): unknown =>
  typeof (c as number[])[0] === "number" ? f(c as LonLat) : (c as unknown[]).map((x) => mapCoords(x, f));

// Moves any GeoJSON Feature / geometry with the rotation above.
export const moveGeo = <T extends GeoPermissibleObjects>(g: T, from: LonLat, to: LonLat): T => {
  const f = moveFn(from, to);
  const geom = (x: { type: string; coordinates?: unknown }) => ({ ...x, coordinates: mapCoords(x.coordinates, f) });
  const obj = g as unknown as { type: string; geometry?: { type: string; coordinates: unknown } };
  if (obj.type === "Feature" && obj.geometry) return { ...obj, geometry: geom(obj.geometry) } as unknown as T;
  return geom(obj) as unknown as T;
};

// Point part-way along the great circle from a to b (t = 0..1).
export const along = (a: LonLat, b: LonLat, t: number): LonLat => geoInterpolate(a, b)(t) as LonLat;
