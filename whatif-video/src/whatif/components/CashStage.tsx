import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import {
  depthAt,
  DEPTH_KM2_M,
  DEPTH_T,
  EIFFEL_T,
  ESB_M3,
  FACTS,
  LIBERTY_AT,
  LIBERTY_T,
  MILLION_T,
  NONE_T,
  PILE_M3,
  realAt,
  REAL_T,
  SHARE_PCT,
  SHARE_T,
  stackAt,
  STACK_KM,
  STACK_T,
  TIMES_TOO_MANY,
  VOLUME_T,
} from "../episodes/ep009";
import { COLORS, fontFamily } from "../theme";
import type { LineTiming } from "../timing";
import type { Episode } from "../types";
import { Icon } from "./Icon";
import { CommentCard } from "./Stage";

// Absurd-scale stage. Steps follow the story clock t: 0-6 the bills bury your house and street |
// 6-8 the Empire State Building | 8-9 one square kilometre | 9-10 the stack, true scale over Earth |
// 10-13 the real bills, as a grid of 1,000 cells (one per billion). Only drawn for Ep009. Cartoon on purpose.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CX = 540;
const GROUND = 1240;
const CASH = "#5FBF6A";
const CASH_DARK = "#2F7D45";
const CASH_LIGHT = "#BFE8B5";
const GOLD = "#FFD166";

const within = (t: number, a: number, b: number, fade = 0.08) => interpolate(t, [a - fade, a, b, b + fade], [0, 1, 1, 0], clamp);

const Tag: React.FC<{ y: number; children: React.ReactNode; opacity?: number; size?: number; color?: string }> = ({ y, children, opacity = 1, size = 44, color = COLORS.text }) =>
  opacity > 0 ? (
    <div style={{ position: "absolute", left: 50, right: 50, top: y, textAlign: "center", fontSize: size, lineHeight: 1.12, fontWeight: 900, letterSpacing: 2, color, opacity, textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}>{children}</div>
  ) : null;

const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

// ---- one flat bill ----
const Bill: React.FC<{ x: number; y: number; rot: number; w?: number; flip?: number }> = ({ x, y, rot, w = 64, flip = 1 }) => {
  const h = w * (FACTS.billWidthIn.value / FACTS.billLengthIn.value);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1 ${flip})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={CASH} stroke={CASH_DARK} strokeWidth={2} />
      <circle cx={0} cy={0} r={h * 0.3} fill={CASH_LIGHT} />
    </g>
  );
};

const FALLERS = Array.from({ length: 140 }, (_, i) => ({ x: random(`cx${i}`), v: 2.6 + random(`cv${i}`) * 2.6, o: random(`co${i}`) * 1300, s: random(`cs${i}`), w: 46 + random(`cw${i}`) * 30 }));

// ---- a simple house; `crush` 0..1 flattens the roof, then the walls ----
const House: React.FC<{ x: number; crush: number; color?: string }> = ({ x, crush, color = "#F2E3C6" }) => {
  const roof = interpolate(crush, [0, 0.5], [1, 0.15], clamp);
  const wall = interpolate(crush, [0.5, 1], [1, 0.35], clamp);
  const W = 300;
  const H = 210 * wall;
  const top = GROUND - H;
  return (
    <g>
      <rect x={x - W / 2} y={top} width={W} height={H} fill={color} />
      <rect x={x - 40} y={GROUND - Math.min(120, H)} width={80} height={Math.min(120, H)} fill="#8C5A3C" />
      {wall > 0.7 ? (
        <>
          <rect x={x - 120} y={top + 40} width={60} height={56} fill="#9FD3F5" />
          <rect x={x + 60} y={top + 40} width={60} height={56} fill="#9FD3F5" />
        </>
      ) : null}
      <polygon points={`${x - W / 2 - 24},${top} ${x + W / 2 + 24},${top} ${x},${top - 150 * roof}`} fill={COLORS.alert} />
    </g>
  );
};

// ---- 0-6: your house, then your street ----
const Street: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  // the pile, in pixels at the starting zoom; it covers the house by about the Eiffel line
  const pile = interpolate(t, [1.6, 3, EIFFEL_T, 5, MILLION_T], [0, 70, 420, 900, 1500], clamp);
  const zoom = interpolate(t, [4.4, 5.6], [1, 0.42], clamp);
  const crush = interpolate(t, [3.05, 3.4, 3.55, 3.95], [0, 0.5, 0.5, 1], clamp);
  const density = interpolate(t, [0, 1, 2, 4, 6], [18, 30, 60, 110, 140], clamp);
  const shake = t > 3 && t < 4 ? 4 * Math.sin(frame * 2.1) : 0;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0B1A3A 0%, #1C3566 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g transform={`translate(${CX + shake} ${GROUND}) scale(${zoom}) translate(${-CX} ${-GROUND})`}>
          <rect x={-2000} y={GROUND} width={5080} height={1200} fill="#2E4A2A" />
          {[-1680, -1260, -840, -420, 420, 840, 1260, 1680].map((dx) => (
            <House key={dx} x={CX + dx} crush={interpolate(t, [4.6, 5.4], [0, 1], clamp)} color="#D9CBB0" />
          ))}
          <House x={CX} crush={crush} />
          {/* the pile: a wide mound of cash */}
          {pile > 0 ? (
            <>
              <path d={`M ${CX - 260 - pile * 2.2} ${GROUND} Q ${CX} ${GROUND - pile * 2} ${CX + 260 + pile * 2.2} ${GROUND} Z`} fill={CASH} />
              <path d={`M ${CX - 200 - pile * 1.8} ${GROUND} Q ${CX} ${GROUND - pile * 1.6} ${CX + 200 + pile * 1.8} ${GROUND} Z`} fill={CASH_DARK} opacity={0.35} />
            </>
          ) : null}
        </g>
        {/* the bills still falling */}
        {FALLERS.slice(0, Math.round(density)).map((b, i) => {
          const y = ((frame * b.v + b.o) % 1300) + 180;
          const sway = 30 * Math.sin(frame / 14 + i);
          return y < GROUND - pile * 0.9 * zoom ? <Bill key={i} x={b.x * 1080 + sway} y={y} rot={(frame * (1 + b.s * 3) + i * 40) % 360} w={b.w} flip={Math.cos(frame / 9 + i)} /> : null;
        })}
      </svg>
      {/* the weights it passes */}
      {within(t, LIBERTY_AT, 3, 0.1) > 0 ? (
        <div style={{ position: "absolute", left: 770, top: 700, opacity: within(t, LIBERTY_AT, 3, 0.1) }}>
          <Icon name="statue" px={190} />
        </div>
      ) : null}
      <Tag y={636} size={40} opacity={within(t, LIBERTY_AT, 3, 0.1)}>{`STATUE OF LIBERTY: ${LIBERTY_T} t`}</Tag>
      <Tag y={636} size={40} opacity={within(t, 3.15, EIFFEL_T - 0.05)} color={COLORS.alert}>ROOF GIVES WAY</Tag>
      {within(t, EIFFEL_T, 5) > 0 ? (
        <div style={{ position: "absolute", left: 800, top: 690, opacity: within(t, EIFFEL_T, 5) }}>
          <Icon name="eiffel" px={240} />
        </div>
      ) : null}
      <Tag y={636} size={40} opacity={within(t, EIFFEL_T, 5)}>{`EIFFEL TOWER: ${fmt(FACTS.eiffelT.value)} t`}</Tag>
      <Tag y={636} size={44} opacity={within(t, 5.1, MILLION_T)} color={COLORS.alert}>YOUR STREET: GONE</Tag>
    </AbsoluteFill>
  );
};

// ---- the Empire State Building, a flat silhouette ----
const Tower: React.FC<{ x: number; y: number; h: number; color?: string }> = ({ x, y, h, color = "#AFC0DA" }) => {
  const u = h / 100;
  return (
    <g transform={`translate(${x} ${y}) scale(${u})`} fill={color}>
      <rect x={-18} y={-58} width={36} height={58} />
      <rect x={-13} y={-74} width={26} height={16} />
      <rect x={-8} y={-86} width={16} height={12} />
      <rect x={-4} y={-94} width={8} height={8} />
      <rect x={-1} y={-100} width={2} height={6} />
    </g>
  );
};

// ---- 6-8: heavier than two, bigger than one ----
const Empire: React.FC<{ t: number }> = ({ t }) => {
  const scaleO = within(t, MILLION_T, VOLUME_T - 0.1, 0.06);
  const tilt = interpolate(t, [MILLION_T, MILLION_T + 0.4], [0, -9], clamp);
  const volO = within(t, VOLUME_T + 0.06, DEPTH_T, 0.06);
  const BAR = 760;
  const cashBar = (BAR * Math.min(PILE_M3, interpolate(t, [VOLUME_T, 7.85], [0, PILE_M3], clamp))) / PILE_M3;
  const esbBar = (BAR * ESB_M3) / PILE_M3;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0B1A3A 0%, #1C3566 100%)" }}>
      {scaleO > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: scaleO }}>
          <polygon points={`${CX - 50},${GROUND} ${CX + 50},${GROUND} ${CX},${GROUND - 140}`} fill="#7F91AB" />
          <g transform={`rotate(${tilt} ${CX} ${GROUND - 140})`}>
            <rect x={CX - 430} y={GROUND - 150} width={860} height={18} rx={9} fill="#C9D4E5" />
            {/* left: two Empire State Buildings */}
            <Tower x={CX - 330} y={GROUND - 150} h={420} />
            <Tower x={CX - 190} y={GROUND - 150} h={420} />
            {/* right: your cash */}
            <rect x={CX + 160} y={GROUND - 150 - 230} width={250} height={230} rx={14} fill={CASH} stroke={CASH_DARK} strokeWidth={6} />
            <text x={CX + 285} y={GROUND - 245} textAnchor="middle" fontSize={64} fontWeight={900} fill={CASH_DARK} fontFamily={fontFamily}>$</text>
          </g>
        </svg>
      ) : null}
      <Tag y={636} size={40} opacity={scaleO}>{`2 × ${fmt(FACTS.esbTons.value)} t < ${fmt(1e6)} t`}</Tag>
      {volO > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, opacity: volO }}>
          <div style={{ position: "absolute", left: 160, top: 820, width: BAR, fontSize: 34, fontWeight: 900, color: COLORS.text }}>
            <div>EMPIRE STATE BUILDING</div>
            <div style={{ height: 70, width: esbBar, background: "#AFC0DA", borderRadius: 12, margin: "8px 0 26px" }} />
            <div>YOUR CASH, PACKED TIGHT</div>
            <div style={{ height: 70, width: cashBar, background: CASH, borderRadius: 12, marginTop: 8 }} />
          </div>
          <Tag y={636} size={40}>{`${fmt(ESB_M3)} m³ vs ${fmt(PILE_M3)} m³`}</Tag>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---- 8-9: one square kilometre, seen from the side, with you standing in it ----
const PX_PER_M = 330;
const Field: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const depth = depthAt(t) * PX_PER_M;
  const bob = 3 * Math.sin(frame / 10);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0B1A3A 0%, #1C3566 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <rect x={0} y={GROUND} width={1080} height={700} fill="#2E4A2A" />
        {/* you */}
        <g transform={`translate(${CX} ${GROUND + bob * 0})`}>
          <rect x={-46} y={-0.5 * PX_PER_M * 1.7} width={92} height={0.5 * PX_PER_M * 1.7} rx={20} fill="#2B3A55" />
          <rect x={-58} y={-0.82 * PX_PER_M * 1.7} width={116} height={0.36 * PX_PER_M * 1.7} rx={36} fill={COLORS.alert} />
          <circle cx={0} cy={-0.9 * PX_PER_M * 1.7} r={58} fill="#FFD166" />
          <circle cx={-20} cy={-0.92 * PX_PER_M * 1.7} r={8} fill={COLORS.ink} />
          <circle cx={20} cy={-0.92 * PX_PER_M * 1.7} r={8} fill={COLORS.ink} />
          <ellipse cx={0} cy={-0.86 * PX_PER_M * 1.7} rx={12} ry={10} fill="#7A2E3A" />
        </g>
        {/* the layer of cash */}
        <rect x={0} y={GROUND - depth} width={1080} height={depth} fill={CASH} opacity={0.93} />
        {Array.from({ length: 14 }, (_, i) => (
          <Bill key={i} x={40 + i * 78} y={GROUND - depth + 12 + 6 * Math.sin(frame / 8 + i)} rot={(i * 37) % 30 - 15} w={60} />
        ))}
        {/* ruler */}
        <line x1={150} y1={GROUND} x2={150} y2={GROUND - PX_PER_M * 1.5} stroke="#FFFFFF" strokeWidth={6} />
        {[0, 0.5, 1, 1.5].map((m) => (
          <g key={m}>
            <line x1={130} y1={GROUND - m * PX_PER_M} x2={170} y2={GROUND - m * PX_PER_M} stroke="#FFFFFF" strokeWidth={6} />
            <text x={110} y={GROUND - m * PX_PER_M + 12} textAnchor="end" fontSize={34} fontWeight={900} fill="#FFFFFF" fontFamily={fontFamily}>{`${m} m`}</text>
          </g>
        ))}
      </svg>
      <Tag y={636} size={40}>{`1 km × 1 km: ${DEPTH_KM2_M.toFixed(2)} m DEEP`}</Tag>
    </AbsoluteFill>
  );
};

// ---- 9-10: the stack, at true scale over Earth ----
const EARTH_KM = 6_371;
const Stack: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const h = stackAt(t);
  const TOP = 690;
  const BASE = 1230;
  // px per km: the zoom follows the stack, so the Earth shrinks away beneath it
  const s = (BASE - TOP) / Math.max(h, 1500);
  const earthR = EARTH_KM * s;
  const cy = BASE + earthR;
  const gpsR = (EARTH_KM + FACTS.gpsKm.value) * s;
  const past = h > FACTS.gpsKm.value;
  return (
    <AbsoluteFill style={{ background: "#040A1C" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {Array.from({ length: 70 }, (_, i) => (
          <circle key={i} cx={random(`sx${i}`) * 1080} cy={500 + random(`sy${i}`) * 900} r={1 + random(`sr${i}`) * 2} fill="#FFFFFF" opacity={0.4 + 0.3 * Math.sin(frame / 12 + i)} />
        ))}
        {gpsR < 2400 ? (
          <>
            <circle cx={CX} cy={cy} r={gpsR} fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="16 14" opacity={0.85} />
            <circle cx={CX + gpsR * Math.sin(frame / 40)} cy={cy - gpsR * Math.cos(frame / 40)} r={12} fill={GOLD} />
          </>
        ) : null}
        <circle cx={CX} cy={cy} r={earthR} fill="#1E6BB8" />
        <circle cx={CX} cy={cy} r={earthR} fill="none" stroke="#A7DCFF" strokeWidth={4} opacity={0.6} />
        <rect x={CX - 7} y={BASE - h * s} width={14} height={h * s} fill={CASH} />
        <circle cx={CX} cy={BASE - h * s} r={10} fill={CASH_LIGHT} />
      </svg>
      <Tag y={636} size={36} color={past ? GOLD : COLORS.text}>{past ? `PAST GPS SATELLITES (${fmt(FACTS.gpsKm.value)} km)` : "A STACK OF $1 BILLS, TRUE SCALE"}</Tag>
      <Tag y={1252} size={30} opacity={interpolate(h, [STACK_KM * 0.95, STACK_KM], [0, 1], clamp)} color={CASH_LIGHT}>{`${fmt(STACK_KM)} km TALL`}</Tag>
    </AbsoluteFill>
  );
};

// ---- 10-13: one cell per billion bills ----
const COLS = 40;
const ROWS = 25;
const CELL = 20;
const GAP = 1.5;
const Grid: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const real = realAt(t) / 1e9;
  const ghost = interpolate(t, [NONE_T, NONE_T + 0.5], [1, 0.18], clamp);
  const pulse = t >= SHARE_T ? 0.75 + 0.25 * Math.sin(frame / 5) : 1;
  const W = COLS * (CELL + GAP);
  const left = CX - W / 2;
  const top = 720;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0B1A3A 0%, #1C3566 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const x = left + (i % COLS) * (CELL + GAP);
          const y = top + Math.floor(i / COLS) * (CELL + GAP);
          const lit = Math.max(0, Math.min(1, real - i));
          return (
            <g key={i}>
              <rect x={x} y={y} width={CELL} height={CELL} rx={3} fill={CASH} opacity={lit > 0 ? 0.25 : ghost * 0.9} />
              {lit > 0 ? <rect x={x} y={y} width={CELL * lit} height={CELL} rx={3} fill={GOLD} opacity={pulse} /> : null}
            </g>
          );
        })}
      </svg>
      <Tag y={636} size={36} opacity={within(t, REAL_T, SHARE_T)}>ONE SQUARE = 1 BILLION BILLS</Tag>
      <Tag y={636} size={40} opacity={within(t, SHARE_T, NONE_T)} color={GOLD}>{`REAL $1 BILLS: ${SHARE_PCT.toFixed(2)}%`}</Tag>
      <Tag y={636} size={40} opacity={within(t, NONE_T, 13.05)} color={COLORS.alert}>{`${TIMES_TOO_MANY}× MORE THAN EXIST`}</Tag>
      <Tag y={1270} size={26} opacity={interpolate(t, [REAL_T + 0.6, REAL_T + 0.8], [0, 1], clamp)} color={COLORS.dim}>FEDERAL RESERVE, $1 NOTES IN CIRCULATION, END OF 2024</Tag>
    </AbsoluteFill>
  );
};

export const CashStage: React.FC<{ ep: Episode; t: number; lines: LineTiming[] }> = ({ ep, t, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaLine = ep.lines.findIndex((l) => l.show === "cta");
  const cta = interpolate(frame, [lines[ctaLine].start * fps - 4, lines[ctaLine].start * fps + 8], [0, 1], clamp);
  const titleO = interpolate(t, [0.75, 1], [1, 0], clamp);
  const scene = t < MILLION_T ? "street" : t < DEPTH_T ? "empire" : t < STACK_T ? "field" : t < REAL_T ? "stack" : "grid";
  return (
    <AbsoluteFill style={{ fontFamily, background: "#0B1A3A" }}>
      {scene === "street" ? <Street t={t} frame={frame} /> : null}
      {scene === "empire" ? <Empire t={t} /> : null}
      {scene === "field" ? <Field t={t} frame={frame} /> : null}
      {scene === "stack" ? <Stack t={t} frame={frame} /> : null}
      {scene === "grid" ? <Grid t={t} frame={frame} /> : null}
      <Tag y={616} size={46} opacity={titleO}>
        WHAT IF $1 TRILLION FELL ON YOUR HOUSE?
      </Tag>
      {cta > 0 ? <CommentCard opacity={cta} frame={frame - lines[ctaLine].start * fps} title={ep.ctaTitle} icon="house" /> : null}
    </AbsoluteFill>
  );
};
