import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { ARMSTRONG_TEXT, BLACK_T, FACTS, HOSE_T, LAST_T, REAL_T, REFILL_T, secondsAt, SWELL_LINEAR } from "../episodes/ep008";
import { COLORS, fontFamily } from "../theme";
import type { LineTiming } from "../timing";
import type { Episode } from "../types";
import { CommentCard } from "./Stage";

// Deadly-place stage. Steps follow the story clock t: 0-9 you, floating in space | 2-4 inside your
// mouth | 7-8 the blackout | 9-13 the real accident in NASA's chamber. Only drawn for Ep008.
// Cartoon on purpose: no wounds, no blood, closed eyes only.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CX = 540;
const CY = 960;
const PERSON_H = 430;
const ICE = "#BDEBFF";

const STARS = Array.from({ length: 120 }, (_, i) => ({ x: random(`vx${i}`) * 1200, y: random(`vy${i}`) * 1300, r: 1 + random(`vr${i}`) * 2.4 }));
const PUFFS = Array.from({ length: 16 }, (_, i) => ({ a: random(`va${i}`), s: 0.5 + random(`vs${i}`) * 0.9, r: 10 + random(`vz${i}`) * 18 }));
const BUBBLES = Array.from({ length: 22 }, (_, i) => ({ x: random(`bx${i}`), v: 2 + random(`bv${i}`) * 3.5, r: 7 + random(`br${i}`) * 17, o: random(`bo${i}`) * 400 }));

const within = (t: number, a: number, b: number, fade = 0.08) => interpolate(t, [a - fade, a, b, b + fade], [0, 1, 1, 0], clamp);

const Tag: React.FC<{ y: number; children: React.ReactNode; opacity?: number; size?: number; color?: string }> = ({ y, children, opacity = 1, size = 44, color = COLORS.text }) =>
  opacity > 0 ? (
    <div style={{ position: "absolute", left: 50, right: 50, top: y, textAlign: "center", fontSize: size, lineHeight: 1.12, fontWeight: 900, letterSpacing: 2, color, opacity, textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}>{children}</div>
  ) : null;

// ---- you: a simple flat figure, arms and legs floating, eyes shut when out cold ----
const Person: React.FC<{ frame: number; asleep: number; cheeks: number }> = ({ frame, asleep, cheeks }) => {
  const sway = 7 * Math.sin(frame / 18);
  return (
    <svg width={PERSON_H / 2} height={PERSON_H} viewBox="0 0 200 400" style={{ overflow: "visible" }}>
      <g stroke="#2B3A55" strokeWidth={34} strokeLinecap="round" fill="none">
        <path d={`M 80 262 L ${52 - sway} 372`} />
        <path d={`M 120 262 L ${148 + sway} 372`} />
      </g>
      <g stroke="#FFD166" strokeWidth={24} strokeLinecap="round" fill="none">
        <path d={`M 56 142 L ${-2 - sway} ${84 + sway}`} />
        <path d={`M 144 142 L ${202 + sway} ${84 - sway}`} />
      </g>
      <rect x={50} y={118} width={100} height={158} rx={34} fill={COLORS.alert} />
      <circle cx={100} cy={62} r={52} fill="#FFD166" />
      <path d="M 50 54 A 52 52 0 0 1 150 54 Q 100 26 50 54 Z" fill="#3A2A1E" />
      {asleep > 0.5 ? (
        <g stroke={COLORS.ink} strokeWidth={6} strokeLinecap="round" fill="none">
          <path d="M 68 64 Q 79 72 90 64" />
          <path d="M 110 64 Q 121 72 132 64" />
        </g>
      ) : (
        <>
          <circle cx={79} cy={62} r={12} fill="#FFFFFF" />
          <circle cx={121} cy={62} r={12} fill="#FFFFFF" />
          <circle cx={79} cy={63} r={6} fill={COLORS.ink} />
          <circle cx={121} cy={63} r={6} fill={COLORS.ink} />
        </>
      )}
      {asleep > 0.5 ? <path d="M 88 92 Q 100 98 112 92" stroke={COLORS.ink} strokeWidth={5} strokeLinecap="round" fill="none" /> : <ellipse cx={100} cy={92} rx={15} ry={12} fill="#7A2E3A" />}
      {cheeks > 0 ? (
        <>
          <circle cx={62} cy={84} r={11 * cheeks} fill="#FF9E6D" opacity={0.7} />
          <circle cx={138} cy={84} r={11 * cheeks} fill="#FF9E6D" opacity={0.7} />
        </>
      ) : null}
    </svg>
  );
};

// ---- the open door you just came through ----
const Ship: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width={520} height={300} viewBox="0 0 520 300" style={{ position: "absolute", left: x, top: y }}>
    <rect x={0} y={20} width={430} height={260} rx={44} fill="#C9D4E5" />
    <rect x={0} y={20} width={430} height={46} rx={23} fill="#9FB0C8" />
    <circle cx={110} cy={150} r={38} fill="#16305C" stroke="#7F91AB" strokeWidth={10} />
    <rect x={320} y={70} width={110} height={170} rx={18} fill="#050814" stroke="#7F91AB" strokeWidth={10} />
    <rect x={432} y={62} width={22} height={186} rx={8} fill="#7F91AB" transform="rotate(14 432 62)" />
  </svg>
);

// ---- space, the planet below, and you ----
const SpaceScene: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const swell = interpolate(t, [5, 5.8], [1, SWELL_LINEAR], clamp);
  const asleep = t >= BLACK_T + 0.2 ? 1 : 0;
  const drift = interpolate(t, [0, 1.3], [-70, 0], clamp);
  const spin = 3.5 * Math.sin(frame / 30) + (asleep ? 11 : 0);
  const shipX = interpolate(t, [0, 1.2], [-130, -560], clamp);
  const puff = interpolate(t, [1, 1.6, 2, 2.1], [0, 0.6, 1, 1], clamp);
  const puffO = within(t, 1, 2);
  const noCards = within(t, 4, 5);
  const o2 = interpolate(t, [6, BLACK_T], [1, 0.04], clamp);
  const o2O = within(t, 5.9, BLACK_T);
  const seconds = secondsAt(t);
  const ringP = interpolate(seconds, [FACTS.consciousS.value + 1, FACTS.recoveryS.value], [0, 1], clamp);
  const ringO = within(t, 8, REAL_T);
  const RING = 280;
  const RING_Y = 975;
  const circ = 2 * Math.PI * RING;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #030612 0%, #081430 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {STARS.map((s, i) => (
          <circle key={i} cx={(s.x + frame * 0.35) % 1200 - 60} cy={s.y} r={s.r} fill="#FFFFFF" opacity={0.45 + 0.4 * Math.sin(frame / 13 + i)} />
        ))}
        <defs>
          <radialGradient id="vac-earth" cx="50%" cy="0%" r="72%">
            <stop offset="0%" stopColor="#2C7FC4" />
            <stop offset="22%" stopColor="#123E7A" />
            <stop offset="100%" stopColor="#081A3C" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={2565} r={1320} fill="url(#vac-earth)" />
        <circle cx={CX} cy={2565} r={1332} fill="none" stroke="#A7DCFF" strokeWidth={10} opacity={0.5} />
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse key={i} cx={((random(`vc${i}`) * 1300 - frame * 0.5) % 1300 + 1300) % 1300 - 100} cy={1262 + i * 46} rx={120 + i * 14} ry={15} fill="#FFFFFF" opacity={0.1} />
        ))}
      </svg>
      {t < 1.5 ? <Ship x={shipX} y={760} /> : null}
      {ringO > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: ringO }}>
          <circle cx={CX} cy={RING_Y} r={RING} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={22} />
          <circle cx={CX} cy={RING_Y} r={RING} fill="none" stroke={ICE} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${circ * ringP} ${circ}`} transform={`rotate(-90 ${CX} ${RING_Y})`} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: CX - PERSON_H / 4 + drift, top: CY - PERSON_H / 2, transform: `rotate(${spin}deg) scale(${swell})` }}>
        <Person frame={frame} asleep={asleep} cheeks={interpolate(t, [5, 5.8], [0, 1], clamp)} />
      </div>
      {/* the size you were, for comparison */}
      {t >= 5 && t < 7.2 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: within(t, 5.15, 7) }}>
          <rect x={CX - 118} y={CY - PERSON_H / 2 - 4} width={236} height={PERSON_H + 8} rx={30} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeDasharray="14 12" />
        </svg>
      ) : null}
      {/* the air leaving */}
      {puffO > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: puffO }}>
          {PUFFS.map((p, i) => {
            const d = ((puff * p.s + i * 0.07) % 1) * 240;
            const a = -Math.PI / 2 + (p.a - 0.5) * 2.6;
            return <circle key={i} cx={CX + Math.cos(a) * d} cy={CY - 120 + Math.sin(a) * d} r={p.r} fill="#E3F4FF" opacity={0.8 * (1 - d / 300)} />;
          })}
        </svg>
      ) : null}
      <Tag y={1200} opacity={within(t, 1.05, 2)}>AIR GONE</Tag>
      {/* neither of these */}
      {noCards > 0 ? (
        <div style={{ position: "absolute", left: 60, right: 60, top: 636, display: "flex", justifyContent: "space-between", opacity: noCards }}>
          {["BLOOD BOILS", "YOU EXPLODE"].map((text, i) => (
            <div key={text} style={{ width: 440, padding: "18px 10px", borderRadius: 28, background: "#FFFFFF", color: COLORS.ink, fontSize: 40, fontWeight: 900, textAlign: "center", opacity: interpolate(t, [4 + i * 0.4, 4.1 + i * 0.4], [0, 1], clamp) }}>
              <span style={{ color: COLORS.alert }}>✗ </span>
              {text}
            </div>
          ))}
        </div>
      ) : null}
      <Tag y={1216} size={46} opacity={within(t, 5.25, 6)}>{`×${FACTS.swellVolume.value} VOLUME, AT MOST`}</Tag>
      {/* oxygen left */}
      {o2O > 0 ? (
        <div style={{ position: "absolute", left: 90, top: 690, width: 74, height: 520, borderRadius: 37, background: "rgba(255,255,255,0.18)", overflow: "hidden", opacity: o2O }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${o2 * 100}%`, background: o2 > 0.35 ? COLORS.water : COLORS.alert }} />
        </div>
      ) : null}
      <Tag y={636} size={40} opacity={o2O}>OXYGEN IN YOUR BLOOD</Tag>
      {ringO > 0 ? (
        <>
          <Tag y={622} size={38} opacity={ringO}>{`ABOUT ${FACTS.recoveryS.value} S TO GET PRESSURE BACK`}</Tag>
          <div style={{ position: "absolute", left: 800, top: 700, fontSize: 64, fontWeight: 900, color: COLORS.text, opacity: ringO * (0.55 + 0.45 * Math.sin(frame / 8)) }}>Zzz</div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ---- inside your mouth ----
const Mouth: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const R = 285;
  const MY = 985;
  const cold = interpolate(t, [3, 3.6], [0, 1], clamp);
  const o = within(t, 2.02, 4);
  const pink = cold < 0.5 ? "#F0788C" : "#B9D8F0";
  return o > 0 ? (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 610, bottom: 0, background: "rgba(3,6,18,0.7)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="vac-mouth">
            <circle cx={CX} cy={MY} r={R} />
          </clipPath>
        </defs>
        <circle cx={CX} cy={MY} r={R} fill={cold > 0.5 ? "#23435F" : "#4A1826"} />
        <g clipPath="url(#vac-mouth)">
          {/* teeth */}
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={CX - 284 + i * 72} y={MY - R - 6} width={64} height={100} rx={18} fill="#FFFFFF" />
          ))}
          {/* tongue */}
          <ellipse cx={CX} cy={MY + 210} rx={280} ry={210} fill={pink} />
          <path d={`M ${CX} ${MY + 30} L ${CX} ${MY + 300}`} stroke="rgba(0,0,0,0.14)" strokeWidth={10} strokeLinecap="round" />
          {/* boiling: bubbles rising off the tongue */}
          {BUBBLES.map((b, i) => {
            const rise = ((frame * b.v + b.o) % 420) / 420;
            return <circle key={i} cx={CX - 240 + b.x * 480} cy={MY + 130 - rise * 330} r={b.r * (0.6 + rise * 0.6)} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={(1 - rise) * (1 - cold * 0.45)} />;
          })}
          {/* frost */}
          <g opacity={cold} stroke={ICE} strokeWidth={8} strokeLinecap="round">
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const x = CX + Math.cos(a) * 262;
              const y = MY + Math.sin(a) * 262;
              return <line key={i} x1={x} y1={y} x2={x + Math.cos(a) * 56} y2={y + Math.sin(a) * 56} />;
            })}
          </g>
        </g>
        <circle cx={CX} cy={MY} r={R} fill="none" stroke={COLORS.text} strokeWidth={8} />
      </svg>
      <Tag y={622} size={38} opacity={1 - cold}>{`BELOW ${ARMSTRONG_TEXT} kPa, WATER BOILS AT ${FACTS.bodyTempC.value} °C`}</Tag>
      <Tag y={622} size={44} opacity={cold} color={ICE}>BOILING TAKES THE HEAT AWAY</Tag>
    </div>
  ) : null;
};

// ---- the real accident: a generic suit in a chamber, not a likeness ----
const Suit: React.FC = () => (
  <svg width={260} height={440} viewBox="0 0 260 440" style={{ overflow: "visible" }}>
    <g stroke="#E8EDF5" strokeWidth={50} strokeLinecap="round" fill="none">
      <path d="M 92 300 L 84 410" />
      <path d="M 168 300 L 176 410" />
      <path d="M 60 170 L 28 268" />
      <path d="M 200 170 L 232 268" />
    </g>
    <rect x={54} y={130} width={152} height={190} rx={50} fill="#F5F7FB" />
    <rect x={92} y={190} width={76} height={54} rx={12} fill="#B6C2D4" />
    <circle cx={106} cy={217} r={9} fill={COLORS.alert} />
    <circle cx={140} cy={217} r={9} fill={COLORS.water} />
    <circle cx={130} cy={78} r={76} fill="#F5F7FB" />
    <ellipse cx={130} cy={80} rx={54} ry={46} fill="#16243D" />
    <ellipse cx={112} cy={64} rx={16} ry={10} fill="#8FB8E8" opacity={0.75} />
  </svg>
);

const SUIT_X = 300;
const SUIT_Y = 800;
const Chamber: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const off = t >= HOSE_T + 0.55;
  const fall = interpolate(t, [HOSE_T + 0.55, HOSE_T + 0.95], [0, 1], clamp);
  const slump = interpolate(t, [LAST_T + 0.55, LAST_T + 0.95], [0, 24], clamp) * interpolate(t, [REFILL_T + 0.7, REFILL_T + 0.9], [1, 0], clamp);
  const needle = t < HOSE_T + 0.55 ? -30 : t < REFILL_T ? interpolate(t, [HOSE_T + 0.55, HOSE_T + 0.9], [-30, -128], clamp) : interpolate(t, [REFILL_T, REFILL_T + 0.9], [-128, -30], clamp);
  const hoseEnd = { x: SUIT_X + 130 + fall * 150, y: SUIT_Y + 217 + fall * 160 };
  const leak = within(t, HOSE_T + 0.55, LAST_T + 0.6);
  const refill = within(t, REFILL_T, REFILL_T + 0.85);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #121C30 0%, #22324D 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {/* chamber wall */}
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={0} y={640 + i * 98} width={1080} height={5} fill="rgba(255,255,255,0.08)" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <circle key={i} cx={100 + i * 176} cy={668} r={7} fill="rgba(255,255,255,0.22)" />
        ))}
        <rect x={0} y={1245} width={1080} height={675} fill="#0D1524" />
        <rect x={0} y={1240} width={1080} height={10} fill="#46597A" />
        {/* porthole, people watching from outside */}
        <circle cx={150} cy={1095} r={92} fill="#6FA8D8" stroke="#7F91AB" strokeWidth={20} />
        <circle cx={125} cy={1100} r={20} fill="#2B3A55" />
        <rect x={103} y={1121} width={44} height={40} rx={12} fill="#2B3A55" />
        <circle cx={182} cy={1107} r={18} fill="#2B3A55" />
        <rect x={162} y={1125} width={40} height={36} rx={12} fill="#2B3A55" />
        {/* the hose */}
        <rect x={1020} y={760} width={60} height={70} rx={10} fill="#7F91AB" />
        <path d={`M 1024 795 C 860 740, ${hoseEnd.x + 170} ${hoseEnd.y - 180}, ${hoseEnd.x} ${hoseEnd.y}`} fill="none" stroke="#FFD166" strokeWidth={20} strokeLinecap="round" />
        {/* the air going, then coming back */}
        {leak > 0
          ? PUFFS.map((p, i) => {
              const d = ((frame * (2 + p.s * 4) + i * 40) % 170) / 170;
              return <circle key={i} cx={SUIT_X + 130 + (p.a - 0.2) * 160 * d * 2} cy={SUIT_Y + 217 + (p.s - 0.9) * 180 * d} r={p.r * 0.7} fill="#E3F4FF" opacity={leak * (1 - d) * 0.9} />;
            })
          : null}
        {refill > 0
          ? Array.from({ length: 9 }, (_, i) => {
              const d = ((frame * 5 + i * 60) % 480) / 480;
              return <path key={i} d={`M ${1040 - d * 460} ${720 + (i % 3) * 170} l 44 -18 v 36 z`} fill={ICE} opacity={refill * 0.75} />;
            })
          : null}
      </svg>
      <div style={{ position: "absolute", left: SUIT_X, top: SUIT_Y, transform: `rotate(${slump}deg)`, transformOrigin: "50% 100%" }}>
        <Suit />
      </div>
      {!off ? null : (
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <circle cx={hoseEnd.x} cy={hoseEnd.y} r={15} fill={COLORS.alert} />
        </svg>
      )}
      {/* pressure gauge */}
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <circle cx={166} cy={790} r={92} fill="#F5F7FB" stroke="#7F91AB" strokeWidth={12} />
        <path d="M 96 790 A 70 70 0 0 1 236 790" fill="none" stroke={COLORS.alert} strokeWidth={10} strokeDasharray="28 200" />
        <line x1={166} y1={790} x2={166 + 64 * Math.sin((needle * Math.PI) / 180)} y2={790 - 64 * Math.cos((needle * Math.PI) / 180)} stroke={COLORS.ink} strokeWidth={9} strokeLinecap="round" />
        <circle cx={166} cy={790} r={12} fill={COLORS.ink} />
      </svg>
      <Tag y={624} size={40} opacity={interpolate(t, [12.9, 13], [1, 0], clamp)}>{`HOUSTON, DEC ${FACTS.leblancDay.value}, ${FACTS.leblancYear.value}`}</Tag>
      {t >= HOSE_T + 0.6 && t < REFILL_T ? (
        <div style={{ position: "absolute", left: 66, top: 900, width: 200, textAlign: "center", fontSize: 40, fontWeight: 900, color: COLORS.alert, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{`${FACTS.leblancPsi.value} psi`}</div>
      ) : null}
      {/* his last memory */}
      {within(t, LAST_T, REFILL_T) > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: within(t, LAST_T, REFILL_T) }}>
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <circle cx={640} cy={900} r={16} fill="#FFFFFF" />
            <circle cx={680} cy={868} r={24} fill="#FFFFFF" />
            <circle cx={820} cy={800} r={112} fill="#FFFFFF" />
            <ellipse cx={820} cy={855} rx={82} ry={46} fill="#F0788C" />
            {BUBBLES.slice(0, 11).map((b, i) => {
              const rise = ((frame * b.v + b.o) % 150) / 150;
              return <circle key={i} cx={752 + b.x * 136} cy={848 - rise * 100} r={b.r * 0.55} fill="none" stroke="#3A6AA6" strokeWidth={4} opacity={1 - rise} />;
            })}
          </svg>
        </div>
      ) : null}
      <Tag y={1252} size={30} opacity={within(t, REFILL_T, 12.95)} color={ICE}>{`GUINNESS: ${FACTS.leblancRefillS.value} S, NO LONG-TERM EFFECTS`}</Tag>
    </AbsoluteFill>
  );
};

export const VacuumStage: React.FC<{ ep: Episode; t: number; lines: LineTiming[] }> = ({ ep, t, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaLine = ep.lines.findIndex((l) => l.show === "cta");
  const cta = interpolate(frame, [lines[ctaLine].start * fps - 4, lines[ctaLine].start * fps + 8], [0, 1], clamp);
  const realO = interpolate(t, [REAL_T - 0.1, REAL_T], [0, 1], clamp);
  // the blackout closes like eyelids, over everything but the counter and the captions
  const lids = interpolate(t, [BLACK_T - 0.1, BLACK_T + 0.25], [0, 1], clamp) * interpolate(t, [8, 8.25], [1, 0], clamp);
  const titleO = interpolate(t, [0.75, 1], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ fontFamily, background: "#030612" }}>
      {t < REAL_T ? <SpaceScene t={t} frame={frame} /> : null}
      {t < REAL_T ? <Mouth t={t} frame={frame} /> : null}
      {lids > 0 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 960 * lids, background: "#010207" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 960 * lids, background: "#010207" }} />
        </>
      ) : null}
      {realO > 0 ? (
        <AbsoluteFill style={{ opacity: realO }}>
          <Chamber t={t} frame={frame} />
        </AbsoluteFill>
      ) : null}
      <Tag y={616} size={46} opacity={titleO}>
        WHAT IF YOU STEPPED INTO SPACE WITHOUT A SUIT?
      </Tag>
      {cta > 0 ? <CommentCard opacity={cta} frame={frame - lines[ctaLine].start * fps} title={ep.ctaTitle} icon="person" /> : null}
    </AbsoluteFill>
  );
};
