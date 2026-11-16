import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { END_KM, FACTS, ICE_PCT, ICE_T, latAt, MOON_DEG, NIGHT_T, PAST_T, PEAK_DEG, RINGS, SKY_T, skyXY, START_KM, THIN_T, TOO_THICK_TEXT, WIDTH_KM } from "../episodes/droppedRings";
import { COLORS, fontFamily } from "../theme";
import type { LineTiming } from "../timing";
import type { Episode } from "../types";
import { Icon } from "./Icon";
import { CommentCard } from "./Stage";
import { cardOpacity, FactCard } from "./WorldStage";

// Swap stage. Steps follow the story clock t: 0-1.5 Earth with the rings in space | 1.5-6 your sky,
// computed from your latitude | 6-8 Saturn's real rings, edge on, then the ice | 8-9 Earth's own
// ring. Only drawn for Ep008. Ring radii are true to the fact sheet in every picture.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CX = 540;
const SWITCH = 0.05;
const RING_COLOR = "#F3E7CF";
// the three main rings: [inner, outer, how solid they look (their albedo and optical depth)]
const BANDS: [number, number, number][] = [
  [RINGS.cIn, RINGS.cOut, 0.32],
  [RINGS.cOut, RINGS.bOut, 0.98],
  [RINGS.aIn, RINGS.aOut, 0.74],
];

const STARS = Array.from({ length: 90 }, (_, i) => ({ x: random(`rf${i}`) * 1080, y: 560 + random(`rg${i}`) * 760, r: 1 + random(`rh${i}`) * 2 }));
const SPECKS = Array.from({ length: 70 }, (_, i) => ({ r: RINGS.cIn + random(`ri${i}`) * (RINGS.aOut - RINGS.cIn), a: random(`rj${i}`) * Math.PI * 2 }));
const SKY_STARS = Array.from({ length: 130 }, (_, i) => ({ x: random(`rk${i}`) * 1080, y: 600 + random(`rl${i}`) * 520, r: 0.9 + random(`rm${i}`) * 2 }));
const CLOUDS = Array.from({ length: 4 }, (_, i) => ({ x: random(`rn${i}`) * 1300, y: 930 + i * 44, w: 150 + random(`ro${i}`) * 110, v: 0.5 + random(`rp${i}`) * 0.5 }));
const CRATERS = Array.from({ length: FACTS.ordovicianCraters.value }, (_, i) => ({ lat: (random(`rq${i}`) * 2 - 1) * 0.47, side: random(`rr${i}`) * 2 - 1 }));

const Tag: React.FC<{ y: number; children: React.ReactNode; opacity?: number; size?: number; color?: string }> = ({ y, children, opacity = 1, size = 40, color = COLORS.text }) => (
  <div style={{ position: "absolute", left: 40, right: 40, top: y, textAlign: "center", fontSize: size, fontWeight: 900, letterSpacing: 2, color, opacity, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{children}</div>
);

const ellipsePath = (cy: number, rx: number, ry: number) => `M ${CX - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const StarField: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={1080} height={1920} style={{ position: "absolute" }}>
    {STARS.map((s, i) => (
      <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={0.45 + 0.4 * Math.sin(frame / 12 + i)} />
    ))}
  </svg>
);

// ---- Earth wearing the rings, true radii ----
const SPACE_Y = 930;
const ER = 190;
const TILT = -16;
const FLAT = 0.3;

const Space: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const half = (front: boolean) => (
    <g transform={`rotate(${TILT} ${CX} ${SPACE_Y})`}>
      <g clipPath={front ? "url(#ring-front)" : "url(#ring-back)"}>
        {BANDS.map(([a, b, o], i) => (
          <path key={i} d={`${ellipsePath(SPACE_Y, b * ER, b * ER * FLAT)} ${ellipsePath(SPACE_Y, a * ER, a * ER * FLAT)}`} fillRule="evenodd" fill={RING_COLOR} opacity={o} />
        ))}
      </g>
      {SPECKS.map((p, i) => {
        // inner particles go round faster, as in a real ring (Kepler's third law)
        const a = p.a + (frame * 0.05) / p.r ** 1.5;
        if (Math.sin(a) > 0 !== front) return null;
        return <circle key={i} cx={CX + Math.cos(a) * p.r * ER} cy={SPACE_Y + Math.sin(a) * p.r * ER * FLAT} r={2.6} fill="#8A7A5C" opacity={0.75} />;
      })}
    </g>
  );
  const issR = ER * (1 + FACTS.issKm.value / FACTS.earthRadiusKm.value);
  const issO = interpolate(t, [0.98, 1.05], [0, 1], clamp);
  const issA = frame / 26;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050814 0%, #0E1C3A 100%)" }}>
      <StarField frame={frame} />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="ring-back">
            <rect x={-400} y={SPACE_Y - 600} width={1900} height={600} />
          </clipPath>
          <clipPath id="ring-front">
            <rect x={-400} y={SPACE_Y} width={1900} height={600} />
          </clipPath>
        </defs>
        {half(false)}
      </svg>
      <div style={{ position: "absolute", left: CX - ER, top: SPACE_Y - ER }}>
        <Icon name="earth" px={2 * ER} />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {half(true)}
        {issO > 0 ? (
          <g opacity={issO}>
            <circle cx={CX} cy={SPACE_Y} r={issR} fill="none" stroke={COLORS.alert} strokeWidth={4} strokeDasharray="10 9" />
            <circle cx={CX + Math.cos(issA) * issR} cy={SPACE_Y + Math.sin(issA) * issR} r={9} fill={COLORS.alert} />
          </g>
        ) : null}
      </svg>
      <Tag y={1200} size={36} opacity={interpolate(t, [0.3, 0.38, 0.95, 1], [0, 1, 1, 0], clamp)}>
        {Math.round(START_KM).toLocaleString("en-US")} TO {Math.round(END_KM).toLocaleString("en-US")} KM UP
      </Tag>
      <Tag y={1200} size={36} color={COLORS.alert} opacity={issO}>
        SPACE STATION: {FACTS.issKm.value} KM UP
      </Tag>
    </AbsoluteFill>
  );
};

// ---- your sky: a stereographic view towards the equator, from your latitude ----
const HORIZON = 1120;
const SKY_R = 470;
const SAMPLES = 120;
const px = (p: { x: number; y: number }) => `${(CX + p.x * SKY_R).toFixed(1)},${(HORIZON - p.y * SKY_R).toFixed(1)}`;

const bandPoints = (a: number, b: number, lat: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) pts.push(px(skyXY(b, -Math.PI / 2 + (i / SAMPLES) * Math.PI, lat)));
  for (let i = SAMPLES; i >= 0; i--) pts.push(px(skyXY(a, -Math.PI / 2 + (i / SAMPLES) * Math.PI, lat)));
  return pts.join(" ");
};

// Earth's shadow at midnight at equinox: the part of the ring plane with x > 0 and |y| < 1
// (Earth radii), the Sun straight behind the planet.
const shadowPoints = (a: number, b: number, lat: number) => {
  const pts: string[] = [];
  const thetaFor = (r: number, y: number) => Math.asin(y / r);
  for (let i = 0; i <= 40; i++) pts.push(px(skyXY(b, thetaFor(b, -1 + i / 20), lat)));
  for (let i = 0; i <= 20; i++) {
    const r = b + (a - b) * (i / 20);
    pts.push(px(skyXY(r, thetaFor(r, 1), lat)));
  }
  for (let i = 40; i >= 0; i--) pts.push(px(skyXY(a, thetaFor(a, -1 + i / 20), lat)));
  for (let i = 0; i <= 20; i++) {
    const r = a + (b - a) * (i / 20);
    pts.push(px(skyXY(r, thetaFor(r, -1), lat)));
  }
  return pts.join(" ");
};

const Sky: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const lat = latAt(t);
  const night = interpolate(t, [NIGHT_T - 0.06, NIGHT_T + 0.04, 4.95, 5.05], [0, 1, 1, 0], clamp);
  const walking = t >= 2.5 && t < 3.5 ? 1 : t >= 5 && t < THIN_T ? 1 : 0;
  const gone = t >= 5.6;
  const bracket = interpolate(t, [3.5, 3.58, 4.3, 4.4], [0, 1, 1, 0], clamp);
  const yIn = skyXY(RINGS.cIn, 0, lat).y;
  const yOut = skyXY(RINGS.aOut, 0, lat).y;
  const moonR = Math.tan(((MOON_DEG / 2) * Math.PI) / 360) * SKY_R;
  const dot = { x: 156, y: 730, r: 60 };
  const latRad = (lat * Math.PI) / 180;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #1D5494 0%, #4C8FCB 60%, #A5D2F0 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #03050E 0%, #070D20 70%, #101C38 100%)", opacity: night }} />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="above-horizon">
            <rect x={0} y={0} width={1080} height={HORIZON} />
          </clipPath>
        </defs>
        <g opacity={night}>
          {SKY_STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={0.55 + 0.4 * Math.sin(frame / 11 + i)} />
          ))}
        </g>
        <g opacity={1 - night}>
          {CLOUDS.map((c, i) => (
            <rect key={i} x={((c.x + frame * c.v) % 1400) - 200} y={c.y} width={c.w} height={30} rx={15} fill="#FFFFFF" opacity={0.45} />
          ))}
        </g>
        <g clipPath="url(#above-horizon)">
          {lat < 0.3 ? (
            // edge on: a true half circle, straight overhead
            <path d={`M ${CX - SKY_R} ${HORIZON} A ${SKY_R} ${SKY_R} 0 0 1 ${CX + SKY_R} ${HORIZON}`} fill="none" stroke="#FFFFFF" strokeWidth={3} />
          ) : (
            BANDS.map(([a, b, o], i) => <polygon key={i} points={bandPoints(a, b, lat)} fill={RING_COLOR} opacity={o * (0.72 + 0.28 * night)} />)
          )}
          {night > 0 && lat >= 0.3
            ? BANDS.map(([a, b], i) => <polygon key={i} points={shadowPoints(a, b, lat)} fill="#060A18" opacity={night * 0.96} />)
            : null}
        </g>
        {bracket > 0 ? (
          <g opacity={bracket} stroke="#FFD166" strokeWidth={6} strokeLinecap="round">
            <line x1={CX} y1={HORIZON - yIn * SKY_R} x2={CX} y2={HORIZON - yOut * SKY_R} />
            <line x1={CX - 18} y1={HORIZON - yIn * SKY_R} x2={CX + 18} y2={HORIZON - yIn * SKY_R} />
            <line x1={CX - 18} y1={HORIZON - yOut * SKY_R} x2={CX + 18} y2={HORIZON - yOut * SKY_R} />
          </g>
        ) : null}
        {bracket > 0 ? (
          <g opacity={bracket}>
            <circle cx={CX} cy={HORIZON - yOut * SKY_R - 56} r={moonR} fill="#FFFFFF" />
            <circle cx={CX} cy={HORIZON - yOut * SKY_R - 56} r={22} fill="none" stroke="#FFFFFF" strokeWidth={3} />
          </g>
        ) : null}
      </svg>
      {bracket > 0 ? (
        <>
          <Tag y={HORIZON - yOut * SKY_R - 146} size={32} opacity={bracket}>THE MOON, SAME SCALE</Tag>
          <div style={{ position: "absolute", left: CX + 30, top: HORIZON - ((yIn + yOut) / 2) * SKY_R - 30, fontSize: 52, fontWeight: 900, color: "#10203F", opacity: bracket }}>{PEAK_DEG.toFixed(0)}°</div>
        </>
      ) : null}
      {/* the ground */}
      <div style={{ position: "absolute", left: 0, right: 0, top: HORIZON, bottom: 0, background: "linear-gradient(180deg, #2C7350 0%, #123A2B 100%)" }} />
      <AbsoluteFill style={{ top: HORIZON, background: "#040A10", opacity: night * 0.8 }} />
      <svg width={1080} height={200} style={{ position: "absolute", top: HORIZON }}>
        {Array.from({ length: 12 }, (_, i) => {
          const speed = walking ? 7 : 0.4;
          const x = ((i * 120 - frame * speed) % 1440) + 1320;
          return <rect key={i} x={(x % 1440) - 180} y={22 + (i % 3) * 34} width={70} height={7} rx={3.5} fill="#FFFFFF" opacity={0.2} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: CX - 50, top: HORIZON - 44 }}>
        <Icon name="person" px={100} />
      </div>
      {/* where you are on the globe */}
      <div style={{ position: "absolute", left: dot.x - dot.r, top: dot.y - dot.r }}>
        <Icon name="earth" px={2 * dot.r} />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <line x1={dot.x - dot.r * RINGS.aOut} y1={dot.y} x2={dot.x + dot.r * RINGS.aOut} y2={dot.y} stroke={RING_COLOR} strokeWidth={5} strokeLinecap="round" />
        <circle cx={dot.x + Math.cos(latRad) * dot.r} cy={dot.y - Math.sin(latRad) * dot.r} r={11} fill={COLORS.alert} stroke="#FFFFFF" strokeWidth={3} />
      </svg>
      {t < 2.5 ? <Tag y={920} opacity={interpolate(t, [SKY_T + 0.05, SKY_T + 0.15], [0, 1], clamp)}>EDGE ON, RIGHT ABOVE YOU</Tag> : null}
      {t >= 4 && t < NIGHT_T ? <Tag y={1250} size={36}>NOON</Tag> : null}
      {night > 0 ? <Tag y={1250} size={36} opacity={night}>MIDNIGHT: EARTH'S SHADOW</Tag> : null}
      {gone ? <Tag y={900} opacity={interpolate(t, [5.6, 5.7], [0, 1], clamp)}>NO RINGS UP HERE</Tag> : null}
    </AbsoluteFill>
  );
};

// ---- Saturn's real rings: edge on, true radii. The line is far thicker than the rings ----
const THIN_Y = 930;
const THIN_HALF = 440;
const THIN_R = THIN_HALF / RINGS.aOut;

const Thin: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const grow = interpolate(t, [THIN_T, 6.4], [0, 1], clamp);
  const iceO = interpolate(t, [ICE_T - 0.03, ICE_T + 0.05], [0, 1], clamp);
  const bar = interpolate(t, [ICE_T, 7.9], [0, 1], clamp);
  const barW = 800;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050814 0%, #0E1C3A 100%)" }}>
      <StarField frame={frame} />
      {iceO < 1 ? (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", opacity: 1 - iceO }}>
            <defs>
              <linearGradient id="saturn-bands" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#C9A66B" />
                <stop offset="0.45" stopColor="#E8CF9B" />
                <stop offset="0.7" stopColor="#CFAE75" />
                <stop offset="1" stopColor="#A9854E" />
              </linearGradient>
            </defs>
            <ellipse cx={CX} cy={THIN_Y} rx={THIN_R} ry={THIN_R * 0.9} fill="url(#saturn-bands)" />
            {/* the line: 2 px, grows out from the planet with the counter */}
            <line x1={CX - THIN_R - (THIN_HALF - THIN_R) * grow} y1={THIN_Y} x2={CX + THIN_R + (THIN_HALF - THIN_R) * grow} y2={THIN_Y} stroke="#FFFFFF" strokeWidth={2} />
          </svg>
          <Tag y={700} size={40} opacity={grow * (1 - iceO)}>SATURN, RINGS EDGE ON</Tag>
          <Tag y={1160} size={36} color={COLORS.alert} opacity={interpolate(t, [6.45, 6.55], [0, 1], clamp) * (1 - iceO)}>THIS LINE IS {TOO_THICK_TEXT}× TOO THICK</Tag>
        </>
      ) : null}
      {iceO > 0 ? (
        <div style={{ position: "absolute", left: CX - barW / 2, top: 780, width: barW, opacity: iceO, fontSize: 38, fontWeight: 900, letterSpacing: 2, color: COLORS.text }}>
          <div>ALL OF SATURN'S RINGS</div>
          <div style={{ height: 70, marginTop: 10, width: (barW * bar * ICE_PCT) / 100, borderRadius: 18, background: RING_COLOR }} />
          <div style={{ marginTop: 50 }}>ANTARCTICA'S ICE</div>
          <div style={{ height: 70, marginTop: 10, width: barW * bar, borderRadius: 18, background: COLORS.water }} />
          <div style={{ marginTop: 40, fontSize: 28, opacity: 0.85 }}>BY MASS, MID ESTIMATES</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---- Earth's own ring, maybe: a rocky ring and the craters in their band ----
const PAST_Y = 900;
const PAST_R = 215;
const BAND_DY = PAST_R * Math.sin((FACTS.craterBandDeg.value * Math.PI) / 180);

const Past: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const craters = interpolate(t, [8.55, 8.85], [0, CRATERS.length], clamp);
  const band = interpolate(t, [8.5, 8.6], [0, 1], clamp);
  const half = (front: boolean) => (
    <g clipPath={front ? "url(#past-front)" : "url(#past-back)"}>
      <path d={`${ellipsePath(PAST_Y, 450, 44)} ${ellipsePath(PAST_Y, 290, 28)}`} fillRule="evenodd" fill="#B6A58D" opacity={0.8} />
      {Array.from({ length: 34 }, (_, i) => {
        const a = random(`rs${i}`) * Math.PI * 2 + frame * 0.012;
        const r = 290 + random(`rt${i}`) * 160;
        if (Math.sin(a) > 0 !== front) return null;
        return <circle key={i} cx={CX + Math.cos(a) * r} cy={PAST_Y + Math.sin(a) * r * 0.098} r={4} fill="#5E5345" />;
      })}
    </g>
  );
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050814 0%, #0E1C3A 100%)" }}>
      <StarField frame={frame} />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="past-back">
            <rect x={0} y={PAST_Y - 100} width={1080} height={100} />
          </clipPath>
          <clipPath id="past-front">
            <rect x={0} y={PAST_Y} width={1080} height={100} />
          </clipPath>
          <clipPath id="past-disc">
            <circle cx={CX} cy={PAST_Y} r={PAST_R} />
          </clipPath>
        </defs>
        {half(false)}
      </svg>
      <div style={{ position: "absolute", left: CX - PAST_R, top: PAST_Y - PAST_R }}>
        <Icon name="earth" px={2 * PAST_R} />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g clipPath="url(#past-disc)" opacity={band}>
          <rect x={CX - PAST_R} y={PAST_Y - BAND_DY} width={2 * PAST_R} height={2 * BAND_DY} fill="#FFD166" opacity={0.28} />
          <line x1={CX - PAST_R} y1={PAST_Y - BAND_DY} x2={CX + PAST_R} y2={PAST_Y - BAND_DY} stroke="#FFD166" strokeWidth={4} strokeDasharray="10 8" />
          <line x1={CX - PAST_R} y1={PAST_Y + BAND_DY} x2={CX + PAST_R} y2={PAST_Y + BAND_DY} stroke="#FFD166" strokeWidth={4} strokeDasharray="10 8" />
        </g>
        {CRATERS.map((c, i) => {
          if (i >= craters) return null;
          const y = c.lat * PAST_R;
          const x = c.side * Math.sqrt(PAST_R ** 2 - y ** 2) * 0.9;
          return <circle key={i} cx={CX + x} cy={PAST_Y + y} r={12} fill={COLORS.alert} stroke="#FFFFFF" strokeWidth={3} />;
        })}
        {half(true)}
      </svg>
      <Tag y={PAST_Y - PAST_R - 62} size={32} color="#FFD166" opacity={band}>WITHIN {FACTS.craterBandDeg.value}° OF THE EQUATOR</Tag>
      <Tag y={PAST_Y + PAST_R + 26} size={30}>STILL DEBATED. ILLUSTRATION, DOTS NOT A MAP</Tag>
    </AbsoluteFill>
  );
};

export const RingStage: React.FC<{ ep: Episode; t: number; lines: LineTiming[] }> = ({ ep, t, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaLine = ep.lines.findIndex((l) => l.show === "cta");
  const cta = interpolate(frame, [lines[ctaLine].start * fps - 4, lines[ctaLine].start * fps + 8], [0, 1], clamp);
  const skyO = interpolate(t, [SKY_T - SWITCH, SKY_T, THIN_T - SWITCH, THIN_T], [0, 1, 1, 0], clamp);
  const thinO = interpolate(t, [THIN_T - SWITCH, THIN_T, PAST_T - SWITCH, PAST_T], [0, 1, 1, 0], clamp);
  const pastO = interpolate(t, [PAST_T - SWITCH, PAST_T], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ fontFamily, background: "#050814" }}>
      {t < SKY_T ? <Space t={t} frame={frame} /> : null}
      {skyO > 0 ? (
        <AbsoluteFill style={{ opacity: skyO }}>
          <Sky t={t} frame={frame} />
        </AbsoluteFill>
      ) : null}
      {thinO > 0 ? (
        <AbsoluteFill style={{ opacity: thinO }}>
          <Thin t={t} frame={frame} />
        </AbsoluteFill>
      ) : null}
      {pastO > 0 ? (
        <AbsoluteFill style={{ opacity: pastO }}>
          <Past t={t} frame={frame} />
        </AbsoluteFill>
      ) : null}
      {ep.lines.map((l, i) => (l.show === "card" && l.card ? <FactCard key={i} card={l.card} opacity={cardOpacity(lines[i], frame, fps)} /> : null))}
      {cta > 0 ? <CommentCard opacity={cta} frame={frame - lines[ctaLine].start * fps} title={ep.ctaTitle} icon="earth" /> : null}
    </AbsoluteFill>
  );
};

export { WIDTH_KM };
