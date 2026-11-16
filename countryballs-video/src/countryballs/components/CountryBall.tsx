import { useId } from "react";
import { Img, staticFile } from "remotion";
import type { EyePlacement } from "../emblems";
import { fontFamily } from "../theme";
import type { Expression, Reaction } from "../types";
import { type BrowPose, type EyePose, type Pose, poseAt } from "./reactions";

type EyeShape = { lid: number; scaleX: number; scaleY: number };

// lid = how much of the eye the eyelid covers from the top (0..1)
const EXPRESSIONS: Record<Expression, EyeShape> = {
  open: { lid: 0, scaleX: 1, scaleY: 1 },
  half: { lid: 0.5, scaleX: 1.05, scaleY: 1 },
  squint: { lid: 0.62, scaleX: 1.08, scaleY: 0.72 },
  shocked: { lid: 0, scaleX: 1.15, scaleY: 1.2 },
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const Eye: React.FC<{
  cx: number;
  cy: number;
  shape: EyeShape;
  clipId: string;
}> = ({ cx, cy, shape, clipId }) => {
  const rx = 10.5 * shape.scaleX;
  const ry = 13 * shape.scaleY;
  const lidY = cy - ry + shape.lid * 2 * ry;
  const lidHalf = rx * Math.sqrt(Math.max(0, 1 - ((lidY - cy) / ry) ** 2));

  return (
    <>
      <clipPath id={clipId}>
        <rect x={cx - rx - 3} y={lidY} width={2 * rx + 6} height={2 * ry + 6} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="white" stroke="black" strokeWidth={1.6} />
      </g>
      {shape.lid > 0.01 ? (
        <line
          x1={cx - lidHalf - 0.6}
          x2={cx + lidHalf + 0.6}
          y1={lidY}
          y2={lidY}
          stroke="black"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ) : null}
    </>
  );
};

// Eye for reaction poses: supports tilted lids and happy closed eyes
const PoseEye: React.FC<{
  cx: number;
  cy: number;
  pose: EyePose;
  isLeft: boolean;
  clipId: string;
}> = ({ cx, cy, pose, isLeft, clipId }) => {
  const rx = 10.5 * pose.scaleX;
  const ry = 13 * pose.scaleY;
  if (pose.closed > 0.5) {
    return (
      <path
        d={`M ${cx - rx} ${cy + 3} Q ${cx} ${cy - ry * 1.1} ${cx + rx} ${cy + 3}`}
        fill="none"
        stroke="black"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    );
  }
  const lidY = cy - ry + pose.lid * 2 * ry;
  // inner corner is +x for the left eye, -x for the right eye
  const k = pose.lid > 0.01 ? Math.tan((pose.lidTilt * Math.PI) / 180) * (isLeft ? 1 : -1) : 0;
  const x0 = cx - rx - 3;
  const x1 = cx + rx + 3;
  const yAt = (x: number) => lidY + k * (x - cx);

  return (
    <>
      <clipPath id={`${clipId}p`}>
        <polygon points={`${x0},${yAt(x0)} ${x1},${yAt(x1)} ${x1},${cy + ry + 3} ${x0},${cy + ry + 3}`} />
      </clipPath>
      <clipPath id={`${clipId}e`}>
        <ellipse cx={cx} cy={cy} rx={rx + 1.2} ry={ry + 1.2} />
      </clipPath>
      <g clipPath={`url(#${clipId}p)`}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="white" stroke="black" strokeWidth={1.6} />
      </g>
      {pose.lid > 0.01 ? (
        <g clipPath={`url(#${clipId}e)`}>
          <line x1={x0} x2={x1} y1={yAt(x0)} y2={yAt(x1)} stroke="black" strokeWidth={1.8} />
        </g>
      ) : null}
    </>
  );
};

const Brow: React.FC<{ cx: number; eyeTop: number; brow: BrowPose; isLeft: boolean }> = ({
  cx,
  eyeTop,
  brow,
  isLeft,
}) => {
  const by = eyeTop - 4 - brow.raise;
  return (
    <path
      d={`M ${cx - 8} ${by} Q ${cx} ${by - brow.curve} ${cx + 8} ${by}`}
      fill="none"
      stroke="black"
      strokeWidth={2.4}
      strokeLinecap="round"
      transform={`rotate(${brow.angle * (isLeft ? 1 : -1)} ${cx} ${by})`}
    />
  );
};

const PoseFace: React.FC<{
  pose: Pose;
  side: number;
  id: string;
  eyeTransform?: string; // moves eyes and brows only (emblem-safe eyes)
  questionBeside?: boolean;
}> = ({ pose, side, id, eyeTransform, questionBeside = false }) => {
  const eyes = [
    { cx: 35, pose: pose.left, brow: pose.leftBrow, isLeft: true },
    { cx: 65, pose: pose.right, brow: pose.rightBrow, isLeft: false },
  ];
  const cy = 44;
  // extras sit on the side facing away from the child
  const outer = side >= 0 ? 1 : -1;
  // "?" above the head, or (template 3) beside the head's outer top corner
  const qx = questionBeside ? 50 + outer * 44 : 50 + outer * 22;
  const qy = questionBeside ? 12 : -4;

  return (
    <>
      <g transform={eyeTransform}>
        {eyes.map((e) => (
          <PoseEye key={e.cx} cx={e.cx} cy={cy} pose={e.pose} isLeft={e.isLeft} clipId={`${id}${e.isLeft ? "l" : "r"}`} />
        ))}
        {eyes.map((e) =>
          e.brow ? (
            <g key={`b${e.cx}`} opacity={pose.browOpacity}>
              <Brow cx={e.cx} eyeTop={cy - 13 * e.pose.scaleY} brow={e.brow} isLeft={e.isLeft} />
            </g>
          ) : null,
        )}
      </g>
      {pose.sweat > 0 ? (
        <path
          transform={`translate(${50 + outer * 37} ${18 + pose.sweatSlide})`}
          d="M 0 -6 Q 4.5 1 4.5 3.5 A 4.5 4.5 0 0 1 -4.5 3.5 Q -4.5 1 0 -6 Z"
          fill="#8fd8ff"
          stroke="black"
          strokeWidth={1.2}
          opacity={pose.sweat}
        />
      ) : null}
      {pose.tears > 0
        ? eyes.map((e) => (
            <path
              key={`t${e.cx}`}
              d={`M ${e.cx + (e.isLeft ? -6 : 6)} ${cy + 8} q ${e.isLeft ? -1 : 1} 14 0 26`}
              fill="none"
              stroke="#4fb3ff"
              strokeWidth={3.2}
              strokeLinecap="round"
              opacity={0.85 * pose.tears}
            />
          ))
        : null}
      {pose.question > 0 ? (
        <text
          x={qx}
          y={qy}
          textAnchor="middle"
          fontFamily={fontFamily}
          fontWeight={800}
          fontSize={22}
          fill="white"
          stroke="black"
          strokeWidth={2.4}
          paintOrder="stroke"
          transform={`translate(${qx} ${qy - 6}) scale(${pose.question}) translate(${-qx} ${-(qy - 6)})`}
        >
          ?
        </text>
      ) : null}
    </>
  );
};

export const CountryBall: React.FC<{
  flag: string;
  size: number;
  expression: Expression;
  // Optional blend from a previous expression (0 = previous, 1 = expression)
  previous?: Expression;
  blend?: number;
  // When set, the ball shows this reaction instead of `expression`.
  // reactionTime = seconds since the reaction started (negative = not yet).
  reaction?: Reaction;
  reactionTime?: number;
  // -1 = ball on the left, 1 = on the right, 0 = centre (for "away" motions)
  side?: number;
  // emblem-safe eyes (see emblems.ts); leave out for normal eyes
  eyePlacement?: EyePlacement;
  // put the confused "?" beside the head instead of above it
  questionBeside?: boolean;
  style?: React.CSSProperties;
}> = ({
  flag,
  size,
  expression,
  previous,
  blend = 1,
  reaction,
  reactionTime = -1,
  side = 0,
  eyePlacement,
  questionBeside = false,
  style,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const a = EXPRESSIONS[previous ?? expression];
  const b = EXPRESSIONS[expression];
  const shape: EyeShape = {
    lid: mix(a.lid, b.lid, blend),
    scaleX: mix(a.scaleX, b.scaleX, blend),
    scaleY: mix(a.scaleY, b.scaleY, blend),
  };
  const outline = size * 0.02;
  const pose = reaction ? poseAt(reaction, reactionTime, side) : null;
  // emblem-safe eyes: move the eye line (y=44) up or down and shrink the eyes
  const eyeTransform = eyePlacement
    ? `translate(50 ${eyePlacement === "up" ? 26 : 63}) scale(0.74) translate(-50 -44)`
    : undefined;

  const ball = (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(`flags/1x1/${flag}.svg`)}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
        {/* soft shading: highlight top-left, inner shadow bottom-right */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 24%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.12) 22%, rgba(255,255,255,0) 42%)",
            boxShadow: `inset ${-size * 0.07}px ${-size * 0.09}px ${size * 0.14}px rgba(0,0,0,0.38)`,
          }}
        />
      </div>
      <svg
        viewBox="0 0 100 100"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      >
        {pose ? (
          <PoseFace pose={pose} side={side} id={id} eyeTransform={eyeTransform} questionBeside={questionBeside} />
        ) : (
          <g transform={eyeTransform}>
            <Eye cx={35} cy={44} shape={shape} clipId={`${id}l`} />
            <Eye cx={65} cy={44} shape={shape} clipId={`${id}r`} />
          </g>
        )}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `${outline}px solid black`,
        }}
      />
    </>
  );

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        ...style,
      }}
    >
      {pose ? (
        // body motion of the reaction, pivoting near the bottom of the ball
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 85%",
            translate: `${(pose.x * size) / 100}px ${(pose.y * size) / 100}px`,
            rotate: `${pose.rotate}deg`,
            scale: pose.scale,
          }}
        >
          {ball}
        </div>
      ) : (
        ball
      )}
    </div>
  );
};
