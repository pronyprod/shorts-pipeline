import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random, useCurrentFrame } from "remotion";

// Sky that turns to space as the drop grows. `t` is story time.
// SKY_STOPS: story second -> [top colour, bottom colour]
const SKY_STOPS: [number, string, string][] = [
  [0, "#14365F", "#3D7CC0"],
  [18, "#102C52", "#2F68A8"],
  [23, "#0B1D3A", "#1A3E70"],
  [28, "#050814", "#0E1C3A"],
];

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: random(`sx${i}`) * 1080,
  y: random(`sy${i}`) * 1920,
  r: 1 + random(`sr${i}`) * 2.2,
  tw: random(`st${i}`) * Math.PI * 2,
}));

const STREAKS = Array.from({ length: 40 }, (_, i) => ({
  x: random(`rx${i}`) * 1180 - 50,
  y: random(`ry${i}`) * 1920,
  len: 40 + random(`rl${i}`) * 50,
  speed: 28 + random(`rv${i}`) * 18,
}));

export const Background: React.FC<{ t: number; rain?: number }> = ({ t, rain: rainMax = 0.35 }) => {
  const frame = useCurrentFrame();
  const at = SKY_STOPS.map((s) => s[0]);
  const top = interpolateColors(t, at, SKY_STOPS.map((s) => s[1]));
  const bottom = interpolateColors(t, at, SKY_STOPS.map((s) => s[2]));
  const rain = interpolate(t, [14, 19], [rainMax, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stars = interpolate(t, [23, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)` }}>
      {rain > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: rain }}>
          {STREAKS.map((s, i) => {
            const y = ((s.y + frame * s.speed) % 2100) - 120;
            return (
              <line key={i} x1={s.x} y1={y} x2={s.x - s.len * 0.18} y2={y + s.len} stroke="#CFE9FF" strokeWidth={3} strokeLinecap="round" />
            );
          })}
        </svg>
      ) : null}
      {stars > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: stars }}>
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={0.5 + 0.5 * Math.sin(frame / 12 + s.tw)} />
          ))}
        </svg>
      ) : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};
