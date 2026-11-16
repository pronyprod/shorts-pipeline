import React from "react";
import type { IconName } from "../types";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, fontFamily, LAYOUT } from "../theme";
import type { LineTiming } from "../timing";
import type { Episode } from "../types";
import { Icon, iconBox } from "./Icon";

const GAP = 40;
const MAX_H = 560;
const CITY_WIDTH_M = 3000; // illustrative skyline strip; not a measured city
const FADE = 8;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Sphere of water. Real raindrops are round (not tear-shaped), so is ours.
export const Drop: React.FC<{ size: number; wobble: number }> = ({ size, wobble }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", transform: `scale(${1 + wobble}, ${1 - wobble})` }}>
    <defs>
      <radialGradient id="drop-body" cx="38%" cy="32%" r="78%">
        <stop offset="0%" stopColor="#B5E4FF" />
        <stop offset="55%" stopColor={COLORS.water} />
        <stop offset="100%" stopColor={COLORS.waterDeep} />
      </radialGradient>
    </defs>
    <circle cx={50} cy={50} r={49} fill="url(#drop-body)" />
    <circle cx={50} cy={50} r={49} fill="none" stroke="#E3F4FF" strokeWidth={1.2} opacity={0.7} />
    <ellipse cx={33} cy={28} rx={13} ry={8} fill="#FFFFFF" opacity={0.75} transform="rotate(-25 33 28)" />
    <circle cx={70} cy={74} r={4} fill="#FFFFFF" opacity={0.35} />
  </svg>
);

export const Stage: React.FC<{
  ep: Episode;
  t: number;
  lines: LineTiming[];
  rungFrames: number[];
}> = ({ ep, t, lines, rungFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = ep.diameterAt(t);
  const Dd = LAYOUT.dropSize;

  // frame window of the line with a given stage moment
  const windowOf = (show: string) => {
    const i = ep.lines.findIndex((l) => l.show === show);
    return i === -1 ? null : { from: lines[i].start * fps, to: lines[i].end * fps };
  };
  const progress = (show: string, fadeOut = true) => {
    const w = windowOf(show);
    if (!w) return 0;
    const fadeIn = interpolate(frame, [w.from - 4, w.from + FADE], [0, 1], clamp);
    return fadeOut ? fadeIn * interpolate(frame, [w.to + 6, w.to + 6 + FADE], [1, 0], clamp) : fadeIn;
  };

  // comparison icons: the active one fades in, the one before fades out
  const visible = ep.rungs
    .map((r, i) => {
      if (r.icon === "drop") return null;
      const from = rungFrames[i];
      const next = rungFrames.slice(i + 1).find((f, k) => ep.rungs[i + 1 + k].icon !== "drop");
      const op =
        interpolate(frame, [from, from + FADE], [0, 1], clamp) *
        (next === undefined ? 1 : interpolate(frame, [next, next + FADE], [1, 0], clamp));
      return op > 0 ? { r, op, px: (Dd * r.size) / d } : null;
    })
    .filter((v) => v !== null);

  // the newest icon decides the layout; zoom out smoothly as it fades in
  const main = visible[visible.length - 1];
  const mainBox = main ? iconBox(main.r.icon, Math.min(main.px, Dd * 12)) : { w: 0, h: 0 };
  const merge = interpolate(
    frame,
    [(windowOf("merge")?.from ?? Infinity), (windowOf("merge")?.from ?? Infinity) + 1.6 * fps],
    [0, 1],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
  const sideW = main ? main.op * (GAP + mainBox.w) * (1 - merge) : 0;
  const W = Dd + sideW;
  const f = Math.min(1, LAYOUT.stageMaxWidth / W, MAX_H / Math.max(Dd, main ? mainBox.h * main.op : 0));
  const left = 540 - (W * f) / 2;
  const dropSize = Dd * f;
  const dropCx = left + dropSize / 2;
  const cy = LAYOUT.stageCenterY;
  const baseline = cy + dropSize / 2;

  // small bounce on each doubling and a gentle wobble
  const wobble = 0.015 * Math.sin(frame / 5) + 0.05 * Math.max(0, 1 - (t % 1) * 5) * (t > 0.5 && t < ep.endT ? 1 : 0);

  const city = progress("city");
  const dust = progress("dust");
  const speck = progress("speck", false) * (1 - progress("cta", false));
  const cta = progress("cta", false);

  const iconStyle = (box: { w: number; h: number }, space: boolean, x: number): React.CSSProperties => ({
    position: "absolute",
    left: x,
    top: space ? cy - box.h / 2 : baseline - box.h,
  });

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily }}>
      {/* city under the drop (it gets swallowed) */}
      {city > 0 ? (
        <div style={{ opacity: city }}>
          <Icon
            name="city"
            px={(dropSize * CITY_WIDTH_M) / d}
            style={{
              position: "absolute",
              left: dropCx - (dropSize * CITY_WIDTH_M) / d / 2,
              top: baseline - iconBox("city", (dropSize * CITY_WIDTH_M) / d).h,
            }}
          />
        </div>
      ) : null}

      {/* the drop */}
      <div style={{ position: "absolute", left: dropCx - dropSize / 2, top: cy - dropSize / 2, opacity: city > 0 ? 1 - 0.25 * city : 1 }}>
        <Drop size={dropSize} wobble={wobble} />
      </div>

      {/* comparison icons */}
      {visible.map(({ r, op, px }) => {
        const space = r.icon === "earth" || r.icon === "island";
        const p = r.icon === "earth" ? merge : 0;
        const sizePx = Math.min(px, Dd * 12) * f;
        const box = iconBox(r.icon, sizePx);
        const sideX = left + (Dd + GAP) * f;
        const x = interpolate(p, [0, 1], [sideX, dropCx - box.w / 2]);
        return (
          <div key={r.t} style={{ opacity: op }}>
            <Icon name={r.icon} px={sizePx} style={iconStyle(box, space, x)} />
          </div>
        );
      })}

      {/* once Earth is inside, water over it */}
      {merge > 0 ? (
        <div
          style={{
            position: "absolute",
            left: dropCx - dropSize / 2,
            top: cy - dropSize / 2,
            width: dropSize,
            height: dropSize,
            borderRadius: "50%",
            background: `radial-gradient(circle at 40% 35%, rgba(181,228,255,0.25), rgba(30,136,229,0.45))`,
            opacity: merge,
          }}
        />
      ) : null}

      {/* "the speck": ring around Earth in the middle of the drop */}
      {speck > 0 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: dropCx - dropSize * 0.27,
              top: cy - dropSize * 0.27,
              width: dropSize * 0.54,
              height: dropSize * 0.54,
              borderRadius: "50%",
              border: `8px solid ${COLORS.alert}`,
              opacity: speck,
              transform: `scale(${1 + 0.06 * Math.sin(frame / 4)})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: cy + dropSize / 2 + 24,
              textAlign: "center",
              fontSize: 54,
              fontWeight: 900,
              color: COLORS.alert,
              opacity: speck,
              letterSpacing: 3,
            }}
          >
            THE SPECK = EARTH
          </div>
        </>
      ) : null}

      {/* twist inset: a real raindrop around a dust speck */}
      {dust > 0 ? <DustInset opacity={dust} frame={frame} /> : null}

      {/* comment call to action */}
      {cta > 0 ? <CommentCard opacity={cta} frame={frame - (windowOf("cta")?.from ?? 0)} /> : null}
    </div>
  );
};

export const DustInset: React.FC<{ opacity: number; frame: number }> = ({ opacity, frame }) => {
  const cy = LAYOUT.stageCenterY;
  const R = 280;
  const label: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: 2,
  };
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, bottom: 0, background: "rgba(5,8,20,0.7)" }} />
      <div
        style={{
          position: "absolute",
          left: 540 - R,
          top: cy - R,
          width: 2 * R,
          height: 2 * R,
          borderRadius: "50%",
          background: "#0F2547",
          border: `8px solid ${COLORS.text}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div style={{ ...label, top: 70, padding: "0 90px", color: COLORS.dim }}>REAL RAINDROP, ZOOMED IN</div>
        <div style={{ position: "absolute", left: R - 130, top: R - 120, transform: `scale(${1 + 0.01 * Math.sin(frame / 6)})` }}>
          <Icon name="drop" px={260} />
        </div>
        <div style={{ position: "absolute", left: R - 28, top: R - 18 }}>
          <Icon name="dust" px={56} />
        </div>
        <div style={{ ...label, top: 2 * R - 140, color: COLORS.alert }}>↑ DUST SPECK</div>
      </div>
    </div>
  );
};

export const CommentCard: React.FC<{ opacity: number; frame: number; title?: string; icon?: IconName }> = ({
  opacity,
  frame,
  title = "WHAT SHOULD DOUBLE NEXT?",
  icon = "drop",
}) => {
  const cy = LAYOUT.stageCenterY;
  const pop = interpolate(frame, [0, 10], [0.85, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, bottom: 0, background: "rgba(5,8,20,0.8)" }} />
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: cy - 260,
          padding: "48px 44px",
          borderRadius: 48,
          background: "#FFFFFF",
          color: COLORS.ink,
          transform: `scale(${pop})`,
          boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Icon name={icon} px={96} />
          <div style={{ fontSize: 66, fontWeight: 900, lineHeight: 1.05 }}>{title}</div>
        </div>
        <div
          style={{
            marginTop: 36,
            padding: "26px 30px",
            borderRadius: 24,
            background: "#EEF3FA",
            fontSize: 42,
            fontWeight: 700,
            color: "#5B6B85",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Add a comment
            <span style={{ opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0 }}>|</span>
          </span>
          <span style={{ color: COLORS.accentDeep, fontWeight: 900 }}>↓</span>
        </div>
      </div>
    </div>
  );
};
