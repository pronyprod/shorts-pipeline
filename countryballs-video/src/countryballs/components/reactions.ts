import type { Reaction } from "../types";

// A pose is everything a countryball can show without a mouth.
// Eye and brow values are in the ball's 0-100 drawing units; body values are
// percentages of the ball size.

export type EyePose = {
  lid: number; // how much the eyelid covers from the top, 0..1
  scaleX: number;
  scaleY: number;
  lidTilt: number; // degrees; + = inner corner lower (angry/strained), - = outer lower (droopy)
  closed: number; // 0..1, 1 = happy closed "^" eye
};

export type BrowPose = {
  raise: number; // how far above the eye
  angle: number; // degrees; + = inner end lower (frown), - = inner end higher (sad/worried)
  curve: number; // arch height
};

export type Pose = {
  left: EyePose;
  right: EyePose;
  leftBrow: BrowPose | null;
  rightBrow: BrowPose | null;
  browOpacity: number;
  x: number;
  y: number;
  rotate: number; // degrees
  scale: number;
  sweat: number; // 0..1 visibility
  sweatSlide: number;
  question: number; // 0..1 pop-in of a "?" above the head
  tears: number; // 0..1 intensity
};

const eye = (e: Partial<EyePose> = {}): EyePose => ({
  lid: 0,
  scaleX: 1,
  scaleY: 1,
  lidTilt: 0,
  closed: 0,
  ...e,
});

export const NEUTRAL: Pose = {
  left: eye(),
  right: eye(),
  leftBrow: null,
  rightBrow: null,
  browOpacity: 0,
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  sweat: 0,
  sweatSlide: 0,
  question: 0,
  tears: 0,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - clamp01(v)) ** 3;
const wave = (t: number, hz: number, phase = 0) => Math.sin(2 * Math.PI * hz * t + phase);
// overshooting pop 0 -> 1 in `d` seconds
const pop = (t: number, d: number) => {
  const p = clamp01(t / d);
  return 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;
};

// t = seconds since the reaction started. side = -1 for a ball on the left,
// 1 on the right, 0 in the middle; "away" motions use it.
type ReactionFn = (t: number, side: number) => Partial<Pose>;

export const REACTIONS: Record<Reaction, ReactionFn> = {
  shocked: (t, side) => ({
    left: eye({ scaleX: 1.3, scaleY: 1.35 }),
    right: eye({ scaleX: 1.3, scaleY: 1.35 }),
    leftBrow: { raise: 7, angle: -6, curve: 5 },
    rightBrow: { raise: 7, angle: -6, curve: 5 },
    // small jump back: hop up and away from the child, then land
    y: t < 0.35 ? -9 * Math.sin((Math.PI * t) / 0.35) : 0,
    x: side * 7 * easeOut(t / 0.2),
    scale: 1 - 0.04 * easeOut(t / 0.2),
    sweat: clamp01((t - 0.15) / 0.15),
    sweatSlide: Math.min(8, Math.max(0, t - 0.15) * 9),
  }),

  squint: (t, side) => ({
    left: eye({ lid: 0.84, scaleX: 1.12, scaleY: 0.7, lidTilt: 10 }),
    right: eye({ lid: 0.84, scaleX: 1.12, scaleY: 0.7, lidTilt: 10 }),
    leftBrow: { raise: 1, angle: 16, curve: 1 },
    rightBrow: { raise: 1, angle: 16, curve: 1 },
    // lean away from the bright child
    rotate: side * 9 * easeOut(t / 0.2),
    x: side * 4 * easeOut(t / 0.2),
  }),

  disappointed: (t) => ({
    left: eye({ lid: 0.56, lidTilt: -14 }),
    right: eye({ lid: 0.56, lidTilt: -14 }),
    leftBrow: { raise: 2, angle: -16, curve: 2 },
    rightBrow: { raise: 2, angle: -16, curve: 2 },
    // slow head shake and a slight sink
    rotate: 6 * wave(t, 1.3) * easeOut(t / 0.25),
    x: 1.5 * wave(t, 1.3) * easeOut(t / 0.25),
    y: 3 * easeOut(t / 0.45),
  }),

  confused: (t, side) => ({
    left: eye({ scaleX: 1.12, scaleY: 1.15 }),
    right: eye({ lid: 0.5, scaleY: 0.85, lidTilt: 8 }),
    leftBrow: { raise: 7, angle: -8, curve: 5 },
    rightBrow: { raise: 1, angle: 14, curve: 1 },
    // heads tilt left and right; the two parents tilt opposite ways
    rotate: 10 * wave(t, 1.1, side > 0 ? Math.PI : 0) * easeOut(t / 0.15),
    question: pop(t - 0.1, 0.25) * (t > 0.1 ? 1 : 0),
  }),

  proud: (t) => ({
    left: eye({ closed: 1 }),
    right: eye({ closed: 1 }),
    // chin up, puffed out
    y: -2 * easeOut(t / 0.2),
    scale: 1 + 0.05 * easeOut(t / 0.2),
    rotate: 2 * wave(t, 0.6),
  }),

  smug: (t) => ({
    left: eye({ lid: 0.5, scaleX: 1.05, lidTilt: 7 }),
    right: eye({ lid: 0.5, scaleX: 1.05, lidTilt: 7 }),
    rotate: 7 * easeOut(t / 0.2),
    y: t < 0.25 ? -2 * Math.sin((Math.PI * t) / 0.25) : 0,
  }),

  defiant: (t) => ({
    left: eye({ lid: 0.32, lidTilt: 12 }),
    right: eye({ scaleX: 1.08, scaleY: 1.1 }),
    leftBrow: { raise: 0, angle: 18, curve: 1 },
    rightBrow: { raise: 9, angle: -4, curve: 6 }, // the raised eyebrow
    rotate: -5 * easeOut(t / 0.2),
    scale: 1 + 0.03 * easeOut(t / 0.2),
    y: -1.5 * easeOut(t / 0.2),
  }),

  innocent: (t) => {
    // one small blink a little after the reaction starts
    const blink = t > 0.55 && t < 0.7 ? Math.sin((Math.PI * (t - 0.55)) / 0.15) : 0;
    return {
      left: eye({ scaleX: 1.25, scaleY: 1.3, lid: blink }),
      right: eye({ scaleX: 1.25, scaleY: 1.3, lid: blink }),
      leftBrow: { raise: 6, angle: -10, curve: 3 },
      rightBrow: { raise: 6, angle: -10, curve: 3 },
      rotate: 3 * wave(t, 0.8),
    };
  },

  laughing: (t) => ({
    left: eye({ closed: 1 }),
    right: eye({ closed: 1 }),
    y: -3 * Math.abs(wave(t, 3)),
    rotate: 4 * wave(t, 3),
  }),

  crying: (t) => ({
    left: eye({ lid: 0.4, lidTilt: -16 }),
    right: eye({ lid: 0.4, lidTilt: -16 }),
    leftBrow: { raise: 2, angle: -18, curve: 2 },
    rightBrow: { raise: 2, angle: -18, curve: 2 },
    y: 0.8 * wave(t, 4),
    tears: clamp01(t / 0.2),
  }),
};

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const mixEye = (a: EyePose, b: EyePose, k: number): EyePose => ({
  lid: mix(a.lid, b.lid, k),
  scaleX: mix(a.scaleX, b.scaleX, k),
  scaleY: mix(a.scaleY, b.scaleY, k),
  lidTilt: mix(a.lidTilt, b.lidTilt, k),
  closed: mix(a.closed, b.closed, k),
});

// Pose for `reaction` at `t` seconds. Before t=0 the ball looks neutral;
// it snaps into the reaction over 0.1s.
export const poseAt = (reaction: Reaction, t: number, side: number): Pose => {
  if (t < 0) return NEUTRAL;
  const target = { ...NEUTRAL, ...REACTIONS[reaction](t, side) };
  const k = easeOut(t / 0.1);
  return {
    ...target,
    left: mixEye(NEUTRAL.left, target.left, k),
    right: mixEye(NEUTRAL.right, target.right, k),
    browOpacity: target.leftBrow || target.rightBrow ? k : 0,
  };
};
