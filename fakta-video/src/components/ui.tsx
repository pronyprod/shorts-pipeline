// Reusable motion-graphics pieces: pills, chips, stamps, counters, pins, flag rows, captions.
// All timing is in seconds relative to the episode, converted with the composition fps.

import type { Caption } from "@remotion/captions";
import React from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { LonLat } from "../lib/geo";
import { C, CAPTION_Y, FONT, SHADOW, fmt } from "../theme";
import { useXY } from "./MapView";

export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// 0 -> 1 spring pop starting at `at` seconds (0 before)
export const usePop = (at: number, damping = 12) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - Math.round(at * fps), fps, config: { damping, stiffness: 180, mass: 0.7 } });
};

// 1 while inside [from, to), with a quick fade/shrink out at `to`
export const useLife = (from: number, to: number) => {
  const t = useT();
  const pop = usePop(from);
  const out = interpolate(t, [to - 0.2, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return t < from ? 0 : pop * out;
};

export const ramp = (t: number, a: number, b: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

type BoxProps = { x: number; y: number; from: number; to: number; anchor?: "center" | "left"; rotate?: number; children?: React.ReactNode };

const Placed: React.FC<BoxProps & { style?: React.CSSProperties }> = ({ x, y, from, to, anchor = "center", rotate = 0, children, style }) => {
  const k = useLife(from, to);
  if (k <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, fontFamily: FONT,
        transform: `translate(${anchor === "center" ? "-50%" : "0"}, -50%) scale(${k}) rotate(${rotate}deg)`,
        transformOrigin: anchor === "center" ? "center" : "left center",
        opacity: Math.min(1, k * 1.5), ...style,
      }}
    >
      {children}
    </div>
  );
};

// Big headline text (white or turmeric) with a hard ink shadow
export const Headline: React.FC<BoxProps & { size?: number; color?: string; width?: number }> = ({ size = 92, color = C.putih, width = 980, children, ...p }) => (
  <Placed {...p}>
    <div style={{ width, textAlign: "center", fontSize: size, fontWeight: 800, color, lineHeight: 1.02, letterSpacing: -1, textShadow: SHADOW, textTransform: "uppercase" }}>
      {children}
    </div>
  </Placed>
);

// Cream pill with ink text (labels, facts)
export const Pill: React.FC<BoxProps & { size?: number; bg?: string; fg?: string; icon?: React.ReactNode }> = ({ size = 44, bg = C.krim, fg = C.tinta, icon, children, ...p }) => (
  <Placed {...p}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: `${size * 0.32}px ${size * 0.6}px`, borderRadius: 999, background: bg, color: fg, fontSize: size, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 8px 0 rgba(27,16,40,0.85), 0 14px 30px rgba(0,0,0,0.35)", textTransform: "uppercase" }}>
      {icon}
      {children}
    </div>
  </Placed>
);

// Rotated outlined stamp that slams in
export const Stamp: React.FC<BoxProps & { color?: string; size?: number }> = ({ color = C.koral, size = 78, children, ...p }) => {
  const t = useT();
  const slam = interpolate(t, [p.from, p.from + 0.18], [1.6, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  if (t < p.from || t > p.to) return null;
  const out = interpolate(t, [p.to - 0.2, p.to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, transform: `translate(-50%,-50%) rotate(${p.rotate ?? -8}deg) scale(${slam})`, opacity: out, fontFamily: FONT }}>
      <div style={{ border: `9px solid ${color}`, borderRadius: 20, padding: "10px 30px", color, fontSize: size, fontWeight: 800, background: "rgba(27,16,40,0.78)", whiteSpace: "nowrap", textTransform: "uppercase", boxShadow: `0 0 0 4px rgba(27,16,40,0.6)` }}>
        {children}
      </div>
    </div>
  );
};

// Number that counts from `a` to `b` between t0 and t1
export const Counter: React.FC<BoxProps & { a: number; b: number; t0: number; t1: number; unit: string; color?: string; size?: number; decimals?: number }> = ({
  a, b, t0, t1, unit, color = C.kunyit, size = 150, decimals = 0, ...p
}) => {
  const t = useT();
  const v = interpolate(t, [t0, t1], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <Placed {...p}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, color, fontWeight: 800, fontSize: size, letterSpacing: -3, textShadow: SHADOW, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {fmt(v, decimals)}
        <span style={{ fontSize: size * 0.42, color: C.putih, letterSpacing: 0 }}>{unit}</span>
      </div>
    </Placed>
  );
};

export const Flag: React.FC<{ code: string; h?: number }> = ({ code, h = 64 }) => (
  <Img src={staticFile(`flags/${code}.svg`)} style={{ height: h, width: (h * 4) / 3, borderRadius: 8, border: "4px solid white", boxShadow: "0 6px 0 rgba(27,16,40,0.85)", objectFit: "cover" }} />
);

// Flags appear one after another
export const FlagRow: React.FC<{ codes: string[]; x: number; y: number; from: number; to: number; step?: number; h?: number }> = ({ codes, x, y, from, to, step = 0.2, h = 62 }) => (
  <>
    {codes.map((c, i) => {
      const perRow = 6;
      const row = Math.floor(i / perRow), col = i % perRow;
      const n = Math.min(perRow, codes.length - row * perRow);
      const gap = (h * 4) / 3 + 22;
      return (
        <Placed key={c} x={x + (col - (n - 1) / 2) * gap} y={y + row * (h + 26)} from={from + i * step} to={to}>
          <Flag code={c} h={h} />
        </Placed>
      );
    })}
  </>
);

// Map pin (SVG, inside <MapView>) with an optional label pill
export const Pin: React.FC<{ at: LonLat; from: number; to: number; color?: string; r?: number }> = ({ at, from, to, color = C.kunyit, r = 16 }) => {
  const [x, y] = useXY(at);
  const k = useLife(from, to);
  if (k <= 0.001) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${k})`}>
      <circle r={r * 2.4} fill={color} opacity={0.25} />
      <circle r={r + 5} fill={C.tinta} />
      <circle r={r} fill={color} />
      <circle r={r * 0.4} fill={C.tinta} />
    </g>
  );
};

// Rough pill width (Plus Jakarta Sans 800, uppercase): used to keep map labels inside the frame.
export const pillWidth = (text: string, size: number) => size * (0.72 * text.length + 1.2);

// HTML label that follows a map point. `clamp` keeps the whole pill inside the frame and above `maxY`.
export const MapLabel: React.FC<{ at: LonLat; dx?: number; dy?: number; from: number; to: number; size?: number; bg?: string; fg?: string; clamp?: boolean; maxY?: number; children: React.ReactNode }> = ({
  at, dx = 0, dy = -60, clamp = false, maxY = Infinity, ...p
}) => {
  const [x0, y0] = useXY(at);
  let x = x0 + dx, y = y0 + dy;
  if (clamp && typeof p.children === "string") {
    const half = pillWidth(p.children, p.size ?? 44) / 2, M = 28;
    x = Math.min(1080 - M - half, Math.max(M + half, x));
    y = Math.min(maxY - (p.size ?? 44), Math.max(M + (p.size ?? 44), y));
  }
  return <Pill x={x} y={y} {...p} />;
};

// Captions: 1 line, max 3 words / 22 characters, a new line after . , ? !, the spoken word turmeric.
// Ink outline, no box.
const MAX_WORDS = 3;
const MAX_CHARS = 22;
type Page = { startMs: number; durationMs: number; tokens: { text: string; fromMs: number; toMs: number }[] };
const paginate = (captions: Caption[]): Page[] => {
  const pages: Page[] = [];
  let cur: Page | null = null;
  for (const c of captions) {
    const len = cur ? cur.tokens.reduce((a, x) => a + x.text.length, 0) : 0;
    const prev = cur?.tokens[cur.tokens.length - 1]?.text ?? "";
    if (!cur || cur.tokens.length >= MAX_WORDS || len + c.text.length > MAX_CHARS || /[.,?!:]$/.test(prev)) {
      cur = { startMs: c.startMs, durationMs: 0, tokens: [] };
      pages.push(cur);
    }
    cur.tokens.push({ text: cur.tokens.length ? c.text : c.text.trimStart(), fromMs: c.startMs, toMs: c.endMs });
    cur.durationMs = c.endMs - cur.startMs;
  }
  // hold each page until the next one starts (no flicker between lines)
  pages.forEach((p, i) => {
    if (pages[i + 1]) p.durationMs = Math.max(p.durationMs, Math.min(pages[i + 1].startMs - p.startMs, p.durationMs + 400));
  });
  return pages;
};

export const Captions: React.FC<{ captions: Caption[]; top?: number }> = ({ captions, top = CAPTION_Y }) => {
  const t = useT() * 1000;
  const pages = React.useMemo(() => paginate(captions), [captions]);
  const page = pages.find((p) => t >= p.startMs && t < p.startMs + p.durationMs);
  if (!page) return null;
  const k = interpolate(t - page.startMs, [0, 90], [0.85, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  return (
    <div style={{ position: "absolute", top, left: 60, right: 60, display: "flex", justifyContent: "center", transform: `scale(${k})` }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, textAlign: "center", lineHeight: 1.1, textTransform: "uppercase", WebkitTextStroke: `14px ${C.tinta}`, paintOrder: "stroke fill", textShadow: "0 8px 18px rgba(0,0,0,0.5)" }}>
        {page.tokens.map((tk, i) => {
          const on = t >= tk.fromMs && t < tk.toMs;
          return (
            <span key={i} style={{ color: on ? C.kunyit : C.putih, whiteSpace: "pre" }}>
              {tk.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
