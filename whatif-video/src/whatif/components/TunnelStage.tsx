import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { speedAt } from "../episodes/ep004";
import { COLORS, fontFamily } from "../theme";
import type { LineTiming } from "../timing";
import type { Episode } from "../types";
import { Icon } from "./Icon";
import { CommentCard } from "./Stage";
import { cardOpacity, FactCard } from "./WorldStage";

// Journey stage: a true-scale cross-section of the Earth (PREM layer radii) with a straight
// tunnel through the centre. The camera starts close to the surface, pulls out to the whole
// planet as you fall, and zooms back in as you come out at the far end.

const R = 6371; // km
const TOP = 650; // top and bottom of the picture, between the counter and the captions
const BOTTOM = 1275;
const CX = 460;
const VIEW_MIN = 40; // km shown top to bottom at the surface
const VIEW_MAX = 2 * R * 1.05; // km shown when the whole planet fits

// [radius km, colour, label]
const LAYERS: [number, string, string][] = [
  [R, "#7A5A43", "CRUST"],
  [R - 24.4, "#B4532A", "MANTLE"],
  [3480, "#E8852E", "OUTER CORE"],
  [1221.5, "#FFD76E", "INNER CORE"],
];

const SPECKS = Array.from({ length: 26 }, (_, i) => ({ x: random(`tx${i}`) * 160 - 80, y: random(`ty${i}`) * 700, len: 20 + random(`tl${i}`) * 50 }));
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const TunnelStage: React.FC<{ ep: Episode; t: number; lines: LineTiming[] }> = ({ ep, t, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const D = ep.diameterAt(t) / 1000; // km fallen
  const fromSurface = Math.min(D, 2 * R - D);
  const view = Math.min(VIEW_MAX, Math.max(VIEW_MIN, fromSurface * 3));
  const k = (BOTTOM - TOP) / view; // px per km
  const spread = (view / VIEW_MAX) ** 2;
  const camera = D + (R - D) * spread; // km below Jakarta at the middle of the picture
  const midY = (TOP + BOTTOM) / 2;
  const yOf = (depth: number) => midY + (depth - camera) * k;
  const cy = yOf(R);
  const speed = speedAt(t);
  const you = yOf(D);

  const ctaLine = ep.lines.findIndex((l) => l.show === "cta");
  const cta = ctaLine === -1 ? 0 : interpolate(frame, [lines[ctaLine].start * fps - 4, lines[ctaLine].start * fps + 8], [0, 1], clamp);

  // layer names sit beside the tunnel, in the middle of the part of the layer that is on screen
  const labels = LAYERS.map(([r, , name], i) => {
    const inner = LAYERS[i + 1]?.[0] ?? 0;
    const depth = R - (r + inner) / 2; // middle of the layer, top half of the planet
    return { name, y: yOf(depth), h: (r - inner) * k };
  }).filter((l) => l.y > TOP + 130 && l.y < BOTTOM - 20 && l.h > 30); // clear of the speed chip

  return (
    <AbsoluteFill style={{ fontFamily, background: "#0B1226" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {LAYERS.map(([r, colour]) => (
          <circle key={r} cx={CX} cy={cy} r={r * k} fill={colour} />
        ))}
        {/* the tunnel */}
        <rect x={CX - 11} y={yOf(0)} width={22} height={2 * R * k} fill="#0B1226" />
        <rect x={CX - 14} y={yOf(0)} width={3} height={2 * R * k} fill="#FFFFFF" opacity={0.55} />
        <rect x={CX + 11} y={yOf(0)} width={3} height={2 * R * k} fill="#FFFFFF" opacity={0.55} />
        {/* speed lines: the faster you fall, the brighter they get */}
        {SPECKS.map((p, i) => {
          const y = ((p.y - frame * 26) % 700) + 700;
          return (
            <line
              key={i}
              x1={CX + p.x}
              x2={CX + p.x}
              y1={you - 350 + y}
              y2={you - 350 + y + p.len}
              stroke="#FFFFFF"
              strokeWidth={3}
              opacity={Math.min(0.55, speed / 15000)}
            />
          );
        })}
      </svg>

      {labels.map((l) => (
        <div key={l.name} style={{ position: "absolute", left: CX + 44, top: l.y - 20, fontSize: 36, fontWeight: 900, letterSpacing: 2, color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
          {l.name}
        </div>
      ))}

      <div style={{ position: "absolute", left: CX - 23, top: you - 74 }}>
        <Icon name="person" px={74} />
      </div>

      {/* top and bottom of the tunnel */}
      {yOf(0) > TOP - 10 && yOf(0) < BOTTOM ? <PlaceTag name="JAKARTA" y={yOf(0)} /> : null}
      {yOf(2 * R) > TOP && yOf(2 * R) < BOTTOM + 10 ? <PlaceTag name="COLOMBIA" y={yOf(2 * R) - 56} /> : null}

      {/* panels behind the counter and the captions */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: TOP, background: "#0B1226" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: BOTTOM, bottom: 0, background: "#0B1226" }} />

      {/* live speed */}
      <div style={{ position: "absolute", right: 56, top: TOP + 26, padding: "14px 22px", borderRadius: 20, background: "rgba(10,18,38,0.82)", textAlign: "right" }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 3, color: COLORS.dim }}>SPEED</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: COLORS.text, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {speed < 1000 ? `${speed.toFixed(0)} m/s` : `${(speed / 1000).toFixed(1)} km/s`}
        </div>
      </div>

      {ep.lines.map((l, i) => (l.show === "card" && l.card ? <FactCard key={i} card={l.card} opacity={cardOpacity(lines[i], frame, fps)} /> : null))}
      {cta > 0 ? <CommentCard opacity={cta} frame={frame - lines[ctaLine].start * fps} title={ep.ctaTitle} icon="pin" /> : null}
    </AbsoluteFill>
  );
};

const PlaceTag: React.FC<{ name: string; y: number }> = ({ name, y }) => (
  <div style={{ position: "absolute", left: CX + 44, top: y - 54, fontSize: 40, fontWeight: 900, letterSpacing: 3, color: COLORS.text }}>{name}</div>
);
