import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { formatLength } from "../format";
import { COLORS, fontFamily, LAYOUT } from "../theme";
import type { Rung } from "../types";
import { Icon } from "./Icon";

const BAR_TOP = 520;

// An "about" comparison is only claimed while it is within 10%; then its `after` label (if any)
const labelFor = (r: Rung, meters: number) =>
  r.after && r.relation === "about" && meters / r.size > 1.1 ? r.after : r.label;
const BAR_W = 1080 - 2 * LAYOUT.side;

// The backbone: label, a huge climbing number, the comparison it just passed,
// and a progress bar whose ticks are the ladder rungs. The bar is linear in
// story time, which is the same as a log scale of the size (it doubles every second).
export const Counter: React.FC<{
  label: string;
  t: number;
  endT: number;
  meters: number;
  rungs: Rung[];
  rungFrames: number[];
  mmDecimals?: number;
  clockLabel?: string;
  clockText?: string;
  mystery?: boolean;
  valueText?: { value: string; unit: string };
}> = ({ label, t, endT, meters, rungs, rungFrames, mmDecimals = 1, clockLabel = "SECOND", clockText, mystery = false, valueText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { value, unit } = mystery ? { value: "???", unit: "" } : (valueText ?? formatLength(meters, mmDecimals));

  // current comparison = last rung reached
  let current = -1;
  rungs.forEach((r, i) => {
    if (t >= r.t) current = i;
  });
  const reachedFrame = current >= 0 ? (rungFrames[current] ?? 0) : 0;
  const pop = current >= 0 ? spring({ frame: frame - reachedFrame, fps, config: { damping: 12 } }) : 1;
  // the number "kicks" a little on each whole second (each doubling)
  const kick = 1 + 0.04 * Math.max(0, 1 - (t % 1) * 6) * (t > 0.5 && t < endT ? 1 : 0);

  return (
    <div style={{ position: "absolute", left: LAYOUT.side, right: LAYOUT.side, top: 206, fontFamily, color: COLORS.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 5, textTransform: "uppercase", color: COLORS.dim }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: 2,
            padding: "8px 18px",
            borderRadius: 999,
            background: COLORS.alert,
            color: COLORS.ink,
          }}
        >
          {clockText ?? (
            <>
              {clockLabel} {Math.floor(t + 1e-6)}
            </>
          )}
        </div>
      </div>
      <div
        style={{
          // values longer than 7 characters ("2,147,484") shrink to fit; shorter ones keep 170 px
          fontSize: value.length > 7 ? Math.round((170 * 6.5) / value.length) : 170,
          fontWeight: 900,
          lineHeight: 1,
          marginTop: 8,
          transform: `scale(${kick})`,
          transformOrigin: "left center",
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 6px 0 rgba(0,0,0,0.25)",
          whiteSpace: "nowrap",
        }}
      >
        {value}
        <span style={{ fontSize: value.length > 7 ? Math.round((90 * 6.5) / value.length) : 90, marginLeft: 18, color: COLORS.accent }}>{unit}</span>
      </div>
      <div
        style={{
          height: 56,
          marginTop: 4,
          fontSize: 44,
          fontWeight: 800,
          textTransform: "uppercase",
          color: COLORS.accent,
          opacity: current >= 0 ? interpolate(pop, [0, 1], [0, 1]) : 0,
          transform: `translateY(${(1 - pop) * 16}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {current >= 0 ? labelFor(rungs[current], meters) : ""}
      </div>
      <div style={{ position: "absolute", top: BAR_TOP - 206, left: 0, width: BAR_W }}>
        <div style={{ height: 18, borderRadius: 9, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
          <div
            style={{
              width: `${(t / endT) * 100}%`,
              height: "100%",
              borderRadius: 9,
              background: `linear-gradient(90deg, ${COLORS.accentDeep}, ${COLORS.accent})`,
            }}
          />
        </div>
        {rungs.map((r, i) => {
          if (r.icon === "drop") return null;
          const reached = t >= r.t;
          // rungs one second apart would overlap: drop the second icon lower
          const prev = rungs[i - 1];
          const close = prev && prev.icon !== "drop" && r.t - prev.t < 1.5;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (r.t / endT) * BAR_W,
                top: -6,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ width: 4, height: close ? 74 : 30, background: reached ? COLORS.text : "rgba(255,255,255,0.4)" }} />
              <div style={{ marginTop: 6, opacity: reached ? 1 : 0.35, transform: `scale(${reached ? 1 : 0.85})` }}>
                <Icon name={r.icon} px={r.icon === "tower" || r.icon === "house" || r.icon === "mountain" ? 38 : 34} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
