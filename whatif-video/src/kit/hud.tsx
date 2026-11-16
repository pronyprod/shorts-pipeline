// KIT overlay: the screen counter (label, number, unit, "≈" comparison pill, step dots) and
// tags pinned to 3D points. Captions come from the channel's own Captions component.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { projectTo, type Pose } from "./camera";
import type { V3 } from "./core";
import type { CounterValue } from "./props";

const INK = "#0A1226";
const ACCENT = "#4FC3FF";
const ALERT = "#FF7A45";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const stroke = (px: number) => ({ WebkitTextStroke: `${px}px ${INK}`, paintOrder: "stroke fill" as const });

export const KitCounter: React.FC<{ v: CounterValue; chip?: string; step: number; steps: number; font: string; bumpFrame: number }> = ({ v, chip, step, steps, font, bumpFrame }) => {
  const frame = useCurrentFrame();
  const bump = interpolate(frame, [bumpFrame, bumpFrame + 4, bumpFrame + 12], [1, 1.12, 1], clamp);
  const big = v.value.length > 8 ? 120 : 150;
  return (
    <div style={{ position: "absolute", top: 205, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: font }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {chip ? <div style={{ background: ALERT, color: "#fff", fontWeight: 900, fontSize: 28, letterSpacing: 2, padding: "6px 16px", borderRadius: 10 }}>{chip}</div> : null}
        <div style={{ color: "rgba(255,255,255,0.88)", fontWeight: 800, fontSize: 34, letterSpacing: 4, textTransform: "uppercase", ...stroke(5) }}>{v.label}</div>
      </div>
      <div style={{ color: "#fff", fontWeight: 900, fontSize: big, lineHeight: 1.05, fontVariantNumeric: "tabular-nums", ...stroke(14), textShadow: "0 10px 0 rgba(0,0,0,0.35)" }}>
        {v.value}
        {v.unit ? <span style={{ fontSize: big * 0.53, color: ACCENT, marginLeft: 14 }}>{v.unit}</span> : null}
      </div>
      {v.compare ? (
        <div style={{ marginTop: 6, transform: `scale(${bump})`, display: "flex", alignItems: "center", gap: 12, background: "#FFFFFF", color: INK, fontWeight: 900, fontSize: 40, padding: "10px 26px 10px 12px", borderRadius: 999, boxShadow: "0 8px 0 rgba(0,0,0,0.3)" }}>
          <span style={{ background: ACCENT, color: INK, borderRadius: 999, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>≈</span>
          {v.compare.replace(/^≈ /, "")}
        </div>
      ) : null}
      {steps > 1 ? (
        <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
          {Array.from({ length: steps }, (_, i) => (
            <div key={i} style={{ width: i === step ? 40 : 14, height: 14, borderRadius: 7, background: i <= step ? "#FFFFFF" : "rgba(255,255,255,0.35)", border: `3px solid ${INK}` }} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export type Tag = { text: string; at: V3; bg?: string };
export const Tags: React.FC<{ tags: Tag[]; pose: Pose; font: string }> = ({ tags, pose, font }) => (
  <>
    {tags.map((t, i) => {
      const s = projectTo(t.at, pose);
      if (!s.inFront || s.x < -200 || s.x > 1280) return null;
      return (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, transform: "translate(-50%, -50%)", background: t.bg ?? "#FFFFFF", border: `5px solid ${INK}`, borderRadius: 999, padding: "6px 22px", fontFamily: font, fontWeight: 900, fontSize: 38, color: INK, whiteSpace: "nowrap", boxShadow: "0 6px 0 rgba(0,0,0,0.3)" }}>
          {t.text}
        </div>
      );
    })}
  </>
);
