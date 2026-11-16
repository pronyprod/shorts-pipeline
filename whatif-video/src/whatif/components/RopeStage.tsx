import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { FACTS, GAP_M, PEAK_M } from "../episodes/ep005";
import { COLORS, fontFamily } from "../theme";
import type { LineTiming } from "../timing";
import type { Episode } from "../types";
import { Icon } from "./Icon";
import { CommentCard } from "./Stage";
import { cardOpacity, FactCard } from "./WorldStage";

// Paradox stage. The number that won't move: the same gap on Earth, the Moon and a football.
// Steps follow the story clock t: 0-1 rope around the Earth | 1-2 guess | 2-3 reveal up close |
// 3-4 the Moon | 4-5 a football (true scale) | 5-6 guess again | 6+ pulled up from one point.

const CY = 950;
const ROPE = "#FFD166";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: random(`rs${i}`) * 1080, y: random(`rq${i}`) * 1920, r: 1 + random(`rr${i}`) * 2 }));
const PX_PER_CM = 13.5; // close-up scale of the ground views
const BALL_PX_PER_CM = 9.5; // football view scale

const Question: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: CY - 150, textAlign: "center", fontSize: 260, fontWeight: 900, color: ROPE, transform: `scale(${1 + 0.04 * Math.sin(frame / 7)})` }}>?</div>
);

// Ground close-up with the rope above it and a ruler (true scale between rope, ruler and ball)
const CloseUp: React.FC<{ gapCm: number; ground: string; rock: string; ball: number; frame: number }> = ({ gapCm, ground, rock, ball, frame }) => {
  const groundY = 1150;
  const ropeY = groundY - gapCm * PX_PER_CM;
  const ballPx = FACTS.tennisBallM.value * 100 * PX_PER_CM;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: groundY, bottom: 0, background: `linear-gradient(180deg, ${ground}, ${rock})` }} />
      {[0, 5, 10, 15].map((cm) => (
        <div key={cm} style={{ position: "absolute", left: 90, top: groundY - cm * PX_PER_CM - 3, width: 56, height: 6, background: "#FFFFFF" }}>
          <div style={{ position: "absolute", left: 66, top: -22, fontSize: 36, fontWeight: 800, color: COLORS.text, whiteSpace: "nowrap" }}>{cm}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 90, top: groundY - 15 * PX_PER_CM, width: 6, height: 15 * PX_PER_CM, background: "#FFFFFF" }} />
      <div style={{ position: "absolute", left: 90, top: groundY - 15 * PX_PER_CM - 56, fontSize: 30, fontWeight: 800, letterSpacing: 2, color: COLORS.dim }}>CM</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: ropeY - 7, height: 14, background: ROPE, boxShadow: "0 3px 10px rgba(0,0,0,0.4)" }} />
      {ball > 0 ? (
        <svg width={ballPx} height={ballPx} viewBox="0 0 100 100" style={{ position: "absolute", left: interpolate(ball, [0, 1], [-160, 700]), top: groundY - ballPx, transform: `rotate(${frame * 9}deg)` }}>
          <circle cx={50} cy={50} r={49} fill="#D4E157" />
          <path d="M12 22 C 40 40, 40 60, 12 78 M88 22 C 60 40, 60 60, 88 78" stroke="#FFFFFF" strokeWidth={6} fill="none" />
        </svg>
      ) : null}
    </>
  );
};

export const RopeStage: React.FC<{ ep: Episode; t: number; lines: LineTiming[] }> = ({ ep, t, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const section = (a: number, b: number) => (t >= a && t < b ? interpolate(t, [a, a + 0.08], [0, 1], clamp) : 0);

  const world = section(0, 1);
  const guess = section(1, 2);
  const earthClose = section(2, 3.05);
  const moonClose = section(3.05, 4.05);
  const ballView = section(4.05, 5.05);
  const guess2 = t >= 5.05 && t < 6 ? 1 : 0;
  const tent = t >= 6 ? 1 : 0;

  const gapCm = Math.min(GAP_M, ep.diameterAt(t)) * 100;
  const ctaLine = ep.lines.findIndex((l) => l.show === "cta");
  const cta = ctaLine === -1 ? 0 : interpolate(frame, [lines[ctaLine].start * fps - 4, lines[ctaLine].start * fps + 8], [0, 1], clamp);
  // a tennis ball rolls through once the gap is shown
  const ballRoll = t >= 3 ? interpolate(frame, [(lines[6]?.start ?? 0) * fps, (lines[6]?.end ?? 1) * fps], [0, 1], clamp) : 0;

  // football view, true scale between ball and rope
  const ballR = (FACTS.footballM.value * 100 * BALL_PX_PER_CM) / 2;
  const ringR = ballR + (GAP_M * 100 * BALL_PX_PER_CM);

  // pulled up from one point: heights are true scale; the width is squeezed to fit (the real
  // rope touches down 39 km away either side)
  const groundY = 1200;
  const pxPerM = 500 / PEAK_M;
  const height = t >= 6 ? ep.diameterAt(t) : 0;
  const peakY = groundY - height * pxPerM;

  return (
    <AbsoluteFill style={{ fontFamily, background: "linear-gradient(180deg, #050814 0%, #0E1C3A 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={0.5 + 0.5 * Math.sin(frame / 12 + i)} />
        ))}
      </svg>

      {world > 0 || guess > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: Math.max(world, guess * 0.35) }}>
          <div style={{ position: "absolute", left: 540 - 270, top: CY - 270 }}>
            <Icon name="earth" px={540} />
          </div>
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <circle cx={540} cy={CY} r={278} fill="none" stroke={ROPE} strokeWidth={10} strokeDasharray="46 10" strokeDashoffset={-frame * 3} />
          </svg>
        </div>
      ) : null}
      {guess > 0 || guess2 > 0 ? <Question frame={frame} /> : null}

      {earthClose > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: earthClose }}>
          <CloseUp gapCm={gapCm} ground="#4C9A55" rock="#1F4A2C" ball={ballRoll} frame={frame} />
        </div>
      ) : null}
      {moonClose > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: moonClose }}>
          <CloseUp gapCm={gapCm} ground="#A7A7AD" rock="#4A4A52" ball={0} frame={frame} />
          <div style={{ position: "absolute", right: 70, top: 690 }}>
            <Icon name="moon" px={150} />
          </div>
        </div>
      ) : null}
      {ballView > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: ballView }}>
          <div style={{ position: "absolute", left: 540 - ballR, top: CY - ballR }}>
            <Icon name="ball" px={2 * ballR} />
          </div>
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <circle cx={540} cy={CY} r={ringR} fill="none" stroke={ROPE} strokeWidth={10} />
            <line x1={540 + ballR} y1={CY} x2={540 + ringR} y2={CY} stroke="#FFFFFF" strokeWidth={5} />
          </svg>
          <div style={{ position: "absolute", left: 540 + ballR + 8, top: CY + 12, fontSize: 40, fontWeight: 900, color: COLORS.text, whiteSpace: "nowrap" }}>{(GAP_M * 100).toFixed(1)} cm</div>
        </div>
      ) : null}

      {tent > 0 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: groundY, bottom: 0, background: "linear-gradient(180deg, #4C9A55, #1F4A2C)" }} />
          <div style={{ position: "absolute", left: 312, top: groundY - FACTS.statueM.value * pxPerM }}>
            <Icon name="statue" px={FACTS.statueM.value * pxPerM} />
          </div>
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <polyline points={`0,${groundY - 3} 400,${peakY} 800,${peakY + (groundY - peakY) * 0.5} 1080,${groundY - 3}`} fill="none" stroke={ROPE} strokeWidth={10} />
          </svg>
          <div style={{ position: "absolute", left: 40, top: groundY + 14, fontSize: 26, fontWeight: 800, letterSpacing: 1, color: COLORS.text, whiteSpace: "nowrap" }}>WIDTH SQUEEZED: THE ROPE TOUCHES DOWN 39 KM AWAY</div>
        </>
      ) : null}

      {ep.lines.map((l, i) => (l.show === "card" && l.card ? <FactCard key={i} card={l.card} opacity={cardOpacity(lines[i], frame, fps)} /> : null))}
      {cta > 0 ? <CommentCard opacity={cta} frame={frame - lines[ctaLine].start * fps} title={ep.ctaTitle} icon="earth" /> : null}
    </AbsoluteFill>
  );
};
