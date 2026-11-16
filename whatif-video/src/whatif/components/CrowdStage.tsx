import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { ATOM_T, FACTS, JUMP_T, LAND_T, peopleAt, pxPerM, SHIFT_M } from "../episodes/ep006";
import { COLORS, fontFamily } from "../theme";
import type { LineTiming } from "../timing";
import type { Episode } from "../types";
import { Icon } from "./Icon";
import { CommentCard } from "./Stage";
import { cardOpacity, FactCard } from "./WorldStage";

// Everyone-at-once stage. Steps follow the story clock t: 0-1 you on the Earth | 1-3 people fill
// the planet | 3-3.5 opposite pushes cancel | 3.5-4 everyone moves to one spot | 4-5 countdown and
// jump | 5-5.5 guess | 5.5-8 true-scale zoom down to one atom | 8+ landing, then you again.

const CX = 540;
const CY = 1000;
const R = 260;
const LIFT = 50; // height of the jump in the picture (not to scale, and labelled so)
const STAR = "#FFFFFF";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const DOTS = Array.from({ length: 340 }, (_, i) => ({
  a: random(`ca${i}`) * Math.PI * 2,
  spot: (random(`cs${i}`) - 0.5) * 0.62,
  h: 8 + random(`ch${i}`) * 24,
  order: random(`co${i}`),
}));
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: random(`sx${i}`) * 1080, y: random(`sy${i}`) * 1920, r: 1 + random(`sr${i}`) * 2 }));

const fade = (px: number, inA: number, inB: number, outA = Infinity, outB = Infinity) =>
  interpolate(px, [inA, inB], [0, 1], clamp) * (outA === Infinity ? 1 : interpolate(px, [outA, outB], [1, 0], clamp));

const Tag: React.FC<{ y: number; children: React.ReactNode; opacity?: number }> = ({ y, children, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 40, right: 40, top: y, textAlign: "center", fontSize: 46, fontWeight: 900, letterSpacing: 2, color: COLORS.text, opacity, textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>{children}</div>
);

// The planet with its people. Dots stand on the rim, then walk to the top; `lift` raises those at the top.
const Planet: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const share = t < 1 ? 0 : Math.log(peopleAt(t)) / Math.log(FACTS.people.value);
  const walk = interpolate(t, [3.5, 4], [0, 1], clamp);
  const jump = interpolate(t, [JUMP_T, JUMP_T + 0.1], [0, 1], clamp) * interpolate(t, [LAND_T - 0.08, LAND_T], [1, 0], clamp);
  const shake = t >= LAND_T && t < LAND_T + 0.25 ? 7 * Math.sin(frame * 2.4) * (1 - (t - LAND_T) / 0.25) : 0;
  const showDots = t >= 1 && t < 8.9;
  const you = t < 1 || t >= 9;
  const bob = you ? Math.max(0, Math.sin(frame / 7)) * 46 : 0;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${shake}px)` }}>
      <div style={{ position: "absolute", left: CX - R, top: CY - R }}>
        <Icon name="earth" px={2 * R} />
      </div>
      {showDots ? (
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {DOTS.map((d, i) => {
            if (d.order > share) return null;
            // the shortest way round to the spot at the top
            const target = -Math.PI / 2 + d.spot;
            const delta = ((target - d.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            const a = d.a + delta * walk;
            const r = R + 8 + (walk > 0 ? d.h * walk : 0) + jump * LIFT;
            return <circle key={i} cx={CX + Math.cos(a) * r} cy={CY + Math.sin(a) * r} r={7} fill={i % 3 === 0 ? COLORS.accent : "#FFD166"} />;
          })}
        </svg>
      ) : null}
      {you ? (
        <div style={{ position: "absolute", left: CX - 55, top: CY - R - 104 - bob }}>
          <Icon name="person" px={110} />
        </div>
      ) : null}
    </div>
  );
};

// Pushes on opposite sides of the planet, in opposite directions
const Cancel: React.FC<{ t: number }> = ({ t }) => {
  const o = interpolate(t, [3, 3.08, 3.42, 3.5], [0, 1, 1, 0], clamp);
  if (o === 0) return null;
  const arrows = [0, 60, 120, 180, 240, 300].map((deg) => (deg * Math.PI) / 180);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", opacity: o }}>
      {arrows.map((a, i) => {
        const [c, s] = [Math.cos(a), Math.sin(a)];
        const [x1, y1, x2, y2] = [CX + c * (R + 90), CY + s * (R + 90), CX + c * (R - 66), CY + s * (R - 66)];
        const [hx, hy] = [-c * 30, -s * 30];
        return (
          <g key={i} stroke="#FF6B4A" strokeWidth={14} strokeLinecap="round" fill="none">
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <polyline points={`${x2 - hx - s * 24},${y2 - hy + c * 24} ${x2},${y2} ${x2 - hx + s * 24},${y2 - hy - c * 24}`} />
          </g>
        );
      })}
    </svg>
  );
};

// True scale: everything below is drawn at pxPerM(t)
const Zoom: React.FC<{ t: number }> = ({ t }) => {
  const z = pxPerM(t);
  const cm = 0.01 * z;
  const hair = FACTS.hairM.value * z;
  const virus = FACTS.virusM.value * z;
  const atom = FACTS.atomM.value * z;
  const shift = SHIFT_M * z;
  const hairO = fade(hair, 2, 12, 800, 1500);
  const virusO = fade(virus, 2, 12, 620, 1100);
  const atomO = fade(atom, 2, 14);
  const spikes = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2);
  return (
    <>
      <div style={{ position: "absolute", left: CX - hair / 2, width: hair, top: 0, bottom: 0, opacity: hairO, background: "linear-gradient(90deg, #8A5A2B, #C98B4A 45%, #8A5A2B)" }} />
      {cm < 1500 ? (
        <div style={{ position: "absolute", left: CX - cm / 2, width: cm, top: 1080, height: 12, background: "#FFFFFF", opacity: fade(cm, 0, 1, 900, 1400) }} />
      ) : null}
      {cm < 900 ? <Tag y={1100}>1 CM</Tag> : null}
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: virusO }}>
        <g transform={`translate(${CX} ${CY}) scale(${virus / 100})`}>
          {spikes.map((a, i) => (
            <line key={i} x1={Math.cos(a) * 40} y1={Math.sin(a) * 40} x2={Math.cos(a) * 50} y2={Math.sin(a) * 50} stroke="#E0555A" strokeWidth={4} />
          ))}
          <circle r={40} fill="#7BC67E" />
        </g>
      </svg>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: atomO }}>
        <defs>
          <radialGradient id="cloud">
            <stop offset="0%" stopColor="#8FD3FF" stopOpacity={0.95} />
            <stop offset="70%" stopColor="#3D8BFF" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#3D8BFF" stopOpacity={0.08} />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={atom / 2} fill="url(#cloud)" />
      </svg>
      {t >= 6.02 && t < 6.5 ? <Tag y={700}>HUMAN HAIR</Tag> : null}
      {virus > 60 && virus < 640 ? <Tag y={700}>VIRUS</Tag> : null}
      {atom > 90 && t < 7.6 ? <Tag y={660}>SMALLEST ATOM</Tag> : null}
      {t >= ATOM_T && t < 7.6 ? (
        <>
          {/* true size is well under 1 px: this mark is drawn far too big, and says so */}
          <div style={{ position: "absolute", left: CX - 1 - Math.max(shift, 2) / 2, top: CY - 1, width: Math.max(shift, 3), height: 3, background: "#FFFFFF", boxShadow: "0 0 10px #FFFFFF" }} />
          <Tag y={CY + 26}>EARTH'S MOVE</Tag>
          <Tag y={CY + 80}>
            <span style={{ fontSize: 30, fontWeight: 800 }}>(STILL DRAWN TOO BIG)</span>
          </Tag>
        </>
      ) : null}
    </>
  );
};

export const CrowdStage: React.FC<{ ep: Episode; t: number; lines: LineTiming[] }> = ({ ep, t, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaLine = ep.lines.findIndex((l) => l.show === "cta");
  const cta = ctaLine === -1 ? 0 : interpolate(frame, [lines[ctaLine].start * fps - 4, lines[ctaLine].start * fps + 8], [0, 1], clamp);
  const zooming = t >= 5.5 && t < 8;
  const count = t >= 4 && t < JUMP_T ? ["3", "2", "1"][Math.min(2, Math.floor((t - 4) / 0.25))] : t >= JUMP_T && t < 5 ? "JUMP!" : null;

  return (
    <AbsoluteFill style={{ fontFamily, background: "linear-gradient(180deg, #050814 0%, #0E1C3A 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={STAR} opacity={0.5 + 0.5 * Math.sin(frame / 12 + i)} />
        ))}
      </svg>
      {zooming ? <Zoom t={t} /> : <Planet t={t} frame={frame} />}
      {!zooming ? <Cancel t={t} /> : null}
      {t >= 3 && t < 3.5 ? <Tag y={CY - 30}>A LOT OF IT CANCELS</Tag> : null}
      {count ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: CY - 110, textAlign: "center", fontSize: count === "JUMP!" ? 130 : 220, fontWeight: 900, color: "#FFFFFF", textShadow: "0 8px 0 rgba(0,0,0,0.35)" }}>{count}</div>
      ) : null}
      {t >= 5 && t < 5.5 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: CY - 150, textAlign: "center", fontSize: 260, fontWeight: 900, color: "#FFD166", transform: `scale(${1 + 0.04 * Math.sin(frame / 7)})` }}>?</div>
      ) : null}
      {t >= JUMP_T && t < LAND_T && !zooming ? <Tag y={CY + 150}><span style={{ fontSize: 30, fontWeight: 800 }}>JUMP NOT TO SCALE</span></Tag> : null}
      {ep.lines.map((l, i) => (l.show === "card" && l.card ? <FactCard key={i} card={l.card} opacity={cardOpacity(lines[i], frame, fps)} /> : null))}
      {cta > 0 ? <CommentCard opacity={cta} frame={frame - lines[ctaLine].start * fps} title={ep.ctaTitle} icon="person" /> : null}
    </AbsoluteFill>
  );
};
