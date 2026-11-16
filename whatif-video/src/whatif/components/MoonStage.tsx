import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { BARY_KM, FACTS, MARATHONS, RETURN_T, REVEAL_T, SUN_TIDE, VANISH_T } from "../episodes/ep007";
import { COLORS, fontFamily } from "../theme";
import type { LineTiming } from "../timing";
import type { Episode } from "../types";
import { Icon } from "./Icon";
import { CommentCard } from "./Stage";
import { cardOpacity, FactCard } from "./WorldStage";

// Disappearing stage. Steps follow the story clock t: 0-1 the Moon is gone but its light is still
// arriving | 1-3 dark sky, Milky Way | 3-6 tides, Sun against Moon | 6-9 Earth's circle and the
// drift | 9-10 the Moon is back. Only drawn for Ep007.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CX = 540;
const HORIZON = 1130;
const MOON_Y = 820;
const MOON_PX = 300;
const SWITCH = 0.05; // scenes cross-fade over this many story steps

const FEW = Array.from({ length: 45 }, (_, i) => ({ x: random(`mf${i}`) * 1080, y: random(`mg${i}`) * HORIZON, r: 1 + random(`mh${i}`) * 2 }));
const MANY = Array.from({ length: 230 }, (_, i) => ({ x: random(`mi${i}`) * 1080, y: random(`mj${i}`) * HORIZON, r: 0.8 + random(`mk${i}`) * 2.2 }));
// stars of the Milky Way, packed around a diagonal band
const BAND = Array.from({ length: 320 }, (_, i) => {
  const along = random(`ml${i}`) * 1900 - 500;
  const off = (random(`mm${i}`) + random(`mn${i}`) - 1) * 130;
  return { x: along * 0.72 + off * 0.69 + 200, y: along * 0.69 - off * 0.72 + 130, r: 0.8 + random(`mo${i}`) * 1.8 };
});

const Tag: React.FC<{ y: number; children: React.ReactNode; opacity?: number; size?: number; color?: string }> = ({ y, children, opacity = 1, size = 44, color = COLORS.text }) => (
  <div style={{ position: "absolute", left: 40, right: 40, top: y, textAlign: "center", fontSize: size, fontWeight: 900, letterSpacing: 2, color, opacity, textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>{children}</div>
);

// ---- the sky over the sea ----
const Sky: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const gone = t < VANISH_T + 0.5 ? interpolate(t, [VANISH_T, VANISH_T + 0.04], [0, 1], clamp) : interpolate(t, [RETURN_T, RETURN_T + 0.04], [1, 0], clamp);
  const pop = t >= RETURN_T ? interpolate(t, [RETURN_T, RETURN_T + 0.03, RETURN_T + 0.06], [0, 1.12, 1], clamp) : 1 - gone;
  const dark = t < 2 ? interpolate(t, [VANISH_T, VANISH_T + 0.4], [0, 1], clamp) : interpolate(t, [RETURN_T, RETURN_T + 0.1], [1, 0], clamp);
  const milky = t < 3 ? interpolate(t, [1.7, 2.3], [0, 1], clamp) : interpolate(t, [RETURN_T, RETURN_T + 0.1], [1, 0], clamp);
  const flash = interpolate(t, [VANISH_T, VANISH_T + 0.12], [1, 0], clamp) * (t >= VANISH_T ? 1 : 0);
  const drift = frame * 0.12; // the sky turns slowly, so it is never a still picture
  const ring = t < 0.3 ? 0 : interpolate(t, [0.3, 0.4, 0.92, 1], [0, 1, 1, 0], clamp);
  const photon = interpolate(t, [0.65, 1], [MOON_Y + MOON_PX / 2, HORIZON], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #16305C 0%, #3A6AA6 70%, #5C8CC4 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #03050E 0%, #070D20 70%, #0D1730 100%)", opacity: dark }} />
      <svg width={1080} height={HORIZON} style={{ position: "absolute" }}>
        <defs>
          <filter id="mw-blur" filterUnits="userSpaceOnUse" x={-800} y={-800} width={2800} height={2800}>
            <feGaussianBlur stdDeviation={46} />
          </filter>
        </defs>
        <g opacity={milky}>
          <ellipse cx={560} cy={560} rx={880} ry={120} fill="#8FA6E8" opacity={0.42} filter="url(#mw-blur)" transform="rotate(-46 560 560)" />
          <ellipse cx={560} cy={560} rx={620} ry={46} fill="#FFE8C8" opacity={0.42} filter="url(#mw-blur)" transform="rotate(-46 560 560)" />
          <g transform={`translate(${drift * 0.6} 0)`}>
            {BAND.map((s, i) => (
              <circle key={i} cx={1080 - s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={0.6 + 0.4 * Math.sin(frame / 14 + i)} />
            ))}
          </g>
        </g>
        <g opacity={dark} transform={`translate(${drift * 0.6} 0)`}>
          {MANY.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={0.55 + 0.45 * Math.sin(frame / 11 + i)} />
          ))}
        </g>
        {FEW.map((s, i) => (
          <circle key={i} cx={s.x + drift * 0.6} cy={s.y} r={s.r} fill="#FFFFFF" opacity={(0.45 + 0.35 * Math.sin(frame / 12 + i)) * (1 - dark * 0.3)} />
        ))}
      </svg>
      {/* the Moon, its light on the sea, and the empty spot it leaves */}
      {flash > 0 ? <div style={{ position: "absolute", left: CX - MOON_PX * 1.1, top: MOON_Y - MOON_PX * 1.1, width: MOON_PX * 2.2, height: MOON_PX * 2.2, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)", opacity: flash }} /> : null}
      {pop > 0.01 ? (
        <div style={{ position: "absolute", left: CX - MOON_PX / 2, top: MOON_Y - MOON_PX / 2, transform: `scale(${pop})` }}>
          <Icon name="moon" px={MOON_PX} />
        </div>
      ) : null}
      {t >= VANISH_T && t < 3 ? (
        <div style={{ position: "absolute", left: CX - MOON_PX / 2, top: MOON_Y - MOON_PX / 2, width: MOON_PX, height: MOON_PX, borderRadius: "50%", border: "4px dashed rgba(255,255,255,0.3)", opacity: interpolate(t, [1.1, 1.3, 1.9, 2.2], [0, 1, 1, 0], clamp) }} />
      ) : null}
      {t >= 0.65 && t < VANISH_T ? <div style={{ position: "absolute", left: CX - 7, top: photon - 40, width: 14, height: 80, borderRadius: 7, background: "#FFF6C9", boxShadow: "0 0 24px #FFF6C9" }} /> : null}
      {/* sea */}
      <div style={{ position: "absolute", left: 0, right: 0, top: HORIZON, bottom: 0, background: "linear-gradient(180deg, #123258 0%, #071428 100%)" }} />
      <AbsoluteFill style={{ top: HORIZON, background: "linear-gradient(180deg, #06101F 0%, #03070F 100%)", opacity: dark }} />
      <svg width={1080} height={420} style={{ position: "absolute", top: HORIZON }}>
        {Array.from({ length: 5 }, (_, i) => {
          const y = 14 + i * 34;
          const w = 80 + i * 26;
          const x = CX + 40 * Math.sin(frame / 16 + i * 1.3);
          return <rect key={i} x={x - w / 2} y={y} width={w} height={8} rx={4} fill="#FFF6C9" opacity={(1 - dark) * 0.62 * (0.7 + 0.3 * Math.sin(frame / 9 + i))} />;
        })}
        {Array.from({ length: 16 }, (_, i) => {
          const y = 22 + (i % 8) * 46;
          const x = ((random(`mw${i}`) * 1300 + frame * (2 + (i % 3))) % 1300) - 110;
          return <rect key={i} x={x} y={y} width={110} height={5} rx={2.5} fill="#8FB8E8" opacity={0.28} />;
        })}
      </svg>
      {t >= 0.3 && t < VANISH_T ? (
        <>
          <Tag y={1000} opacity={ring}>ALREADY GONE</Tag>
          <Tag y={1052} opacity={ring} size={32}>YOU'RE SEEING OLD LIGHT</Tag>
        </>
      ) : null}
      {t >= 1.75 && t < 3 ? <Tag y={1040} opacity={milky}>THE MILKY WAY</Tag> : null}
      {t >= RETURN_T + 0.35 ? (
        <Tag y={1010} size={38} opacity={interpolate(t, [9.35, 9.45], [0, 1], clamp)}>
          {FACTS.perigeeKm.value.toLocaleString("en-US")} TO {FACTS.apogeeKm.value.toLocaleString("en-US")} KM
        </Tag>
      ) : null}
    </AbsoluteFill>
  );
};

// ---- the tides: full moon, so Sun and Moon pull along the same line and both bulges stack ----
const TIDE_Y = 900;
const TIDE_R = 170;
const BULGE_PX = 46; // bulge of the Moon's tide in the picture (far too big, and labelled so)
const BAR_W = 720;

const Tides: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const shrink = interpolate(t, [REVEAL_T, 4.25], [0, 1], { ...clamp });
  const amp = (1 - shrink) * (1 + SUN_TIDE) + shrink * SUN_TIDE; // both together, then the Sun alone
  const bulge = BULGE_PX * amp * (1 + 0.05 * Math.sin(frame / 10));
  const bars = interpolate(t, [4.3, 4.45], [0, 1], clamp);
  const sun = interpolate(t, [4.3, 4.8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050814 0%, #0E1C3A 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {FEW.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y + 300} r={s.r} fill="#FFFFFF" opacity={0.4 + 0.4 * Math.sin(frame / 12 + i)} />
        ))}
        <ellipse cx={CX} cy={TIDE_Y} rx={TIDE_R + bulge} ry={TIDE_R + 8 - bulge * 0.12} fill={COLORS.water} opacity={0.75} />
        {/* the Sun, off to the right */}
        <g transform={`translate(1000 ${TIDE_Y})`}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2 + frame / 90;
            return <line key={i} x1={Math.cos(a) * 98} y1={Math.sin(a) * 98} x2={Math.cos(a) * 128} y2={Math.sin(a) * 128} stroke="#FFD166" strokeWidth={9} strokeLinecap="round" />;
          })}
          <circle r={84} fill="#FFD166" />
        </g>
        {/* where the Moon was */}
        <circle cx={100} cy={TIDE_Y} r={56} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={4} strokeDasharray="12 10" />
      </svg>
      <div style={{ position: "absolute", left: CX - TIDE_R, top: TIDE_Y - TIDE_R }}>
        <Icon name="earth" px={2 * TIDE_R} />
      </div>
      <Tag y={TIDE_Y + 76} size={28} opacity={0.9}><span style={{ marginRight: 780 }}>NO MOON</span></Tag>
      <Tag y={TIDE_Y + TIDE_R + 40} size={28}>BULGES NOT TO SCALE</Tag>
      {bars > 0 ? (
        <div style={{ position: "absolute", left: CX - BAR_W / 2, top: 1160, width: BAR_W, opacity: bars, fontSize: 30, fontWeight: 900, letterSpacing: 2, color: COLORS.text }}>
          <div>MOON'S TIDE</div>
          <div style={{ height: 22, marginTop: 4, width: BAR_W, borderRadius: 11, background: "rgba(255,255,255,0.28)" }} />
          <div style={{ marginTop: 10 }}>SUN'S TIDE</div>
          <div style={{ height: 22, marginTop: 4, width: BAR_W * SUN_TIDE * sun, borderRadius: 11, background: "#FFD166" }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---- the circle: the Earth and its true balance point; the Moon's distance is not to scale ----
const BX = 450;
const BY = 930;
const ER = 170;
const OFFSET = (BARY_KM / FACTS.earthRadiusKm.value) * ER; // true position of the point inside the Earth
const MOON_ORBIT = 280;
const SLIP_T = 6.6;
const REVS = 1.5;

const Circle: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const a = -Math.PI / 2 - (2 * Math.PI * REVS * (SLIP_T - Math.min(t, SLIP_T))) / 0.6;
  const slip = interpolate(t, [SLIP_T, 8], [0, 1], clamp);
  const ex = BX + Math.cos(a) * OFFSET + slip * 430;
  const ey = BY + Math.sin(a) * OFFSET;
  const mx = BX - Math.cos(a) * MOON_ORBIT;
  const my = BY - Math.sin(a) * MOON_ORBIT;
  const moonGone = t >= SLIP_T;
  const flash = moonGone ? interpolate(t, [SLIP_T, SLIP_T + 0.1], [1, 0], clamp) : 0;
  const walkers = Math.round(MARATHONS);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050814 0%, #0E1C3A 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {FEW.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y + 300} r={s.r} fill="#FFFFFF" opacity={0.4 + 0.4 * Math.sin(frame / 12 + i)} />
        ))}
        <circle cx={BX} cy={BY} r={MOON_ORBIT} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} strokeDasharray="10 12" opacity={moonGone ? 0.4 : 1} />
      </svg>
      <div style={{ position: "absolute", left: ex - ER, top: ey - ER }}>
        <Icon name="earth" px={2 * ER} />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <circle cx={BX} cy={BY} r={OFFSET} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="8 10" opacity={0.8} />
        {/* the straight line Earth takes */}
        {slip > 0 ? <line x1={BX} y1={BY - OFFSET} x2={ex} y2={ey} stroke={COLORS.alert} strokeWidth={7} strokeLinecap="round" /> : null}
        <g stroke="#FFD166" strokeWidth={8} strokeLinecap="round">
          <line x1={BX - 16} y1={BY - 16} x2={BX + 16} y2={BY + 16} />
          <line x1={BX - 16} y1={BY + 16} x2={BX + 16} y2={BY - 16} />
        </g>
      </svg>
      {!moonGone ? (
        <div style={{ position: "absolute", left: mx - 44, top: my - 44 }}>
          <Icon name="moon" px={88} />
        </div>
      ) : null}
      {flash > 0 ? <div style={{ position: "absolute", left: mx - 110, top: my - 110, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)", opacity: flash }} /> : null}
      {t < SLIP_T ? <Tag y={BY + 30} size={30} color="#FFD166">THE POINT THEY CIRCLE</Tag> : null}
      <Tag y={1248} size={28}>NOT TO SCALE, SPED UP</Tag>
      {t >= 8 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1120, display: "flex", justifyContent: "center", gap: 36 }}>
          {Array.from({ length: walkers }, (_, i) => (
            <div key={i} style={{ opacity: interpolate(t, [8 + i * 0.12, 8.08 + i * 0.12], [0, 1], clamp) }}>
              <Icon name="person" px={100} />
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const MoonStage: React.FC<{ ep: Episode; t: number; lines: LineTiming[] }> = ({ ep, t, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaLine = ep.lines.findIndex((l) => l.show === "cta");
  const cta = interpolate(frame, [lines[ctaLine].start * fps - 4, lines[ctaLine].start * fps + 8], [0, 1], clamp);
  const tideO = interpolate(t, [3 - SWITCH, 3, 6 - SWITCH, 6], [0, 1, 1, 0], clamp);
  const circleO = interpolate(t, [6 - SWITCH, 6, RETURN_T - SWITCH, RETURN_T], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ fontFamily, background: "#050814" }}>
      {t < 3 || t >= RETURN_T - SWITCH ? <Sky t={t} frame={frame} /> : null}
      {tideO > 0 ? (
        <AbsoluteFill style={{ opacity: tideO }}>
          <Tides t={t} frame={frame} />
        </AbsoluteFill>
      ) : null}
      {circleO > 0 ? (
        <AbsoluteFill style={{ opacity: circleO }}>
          <Circle t={t} frame={frame} />
        </AbsoluteFill>
      ) : null}
      {ep.lines.map((l, i) => (l.show === "card" && l.card ? <FactCard key={i} card={l.card} opacity={cardOpacity(lines[i], frame, fps)} /> : null))}
      {cta > 0 ? <CommentCard opacity={cta} frame={frame - lines[ctaLine].start * fps} title={ep.ctaTitle} icon="moon" /> : null}
    </AbsoluteFill>
  );
};
