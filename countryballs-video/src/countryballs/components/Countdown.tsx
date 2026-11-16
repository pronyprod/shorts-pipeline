import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../theme";

// A ring that drains over `seconds` while counting 3-2-1.
// Frame 0 of this component is the start of the countdown.
export const Countdown: React.FC<{
  x: number;
  y: number;
  radius: number;
  seconds: number;
}> = ({ x, y, radius, seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = seconds * fps;
  const step = total / 3;
  const number = 3 - Math.min(2, Math.floor(frame / step));
  const stepFrame = frame % step;
  const circumference = 2 * Math.PI * radius;
  const stroke = radius * 0.16;
  const size = (radius + stroke) * 2;

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        scale: interpolate(frame, [0, 0.2 * fps], [0.4, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 12 }),
          output: "perceptual-scale",
        }),
      }}
    >
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgba(0,0,0,0.55)"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={interpolate(frame, [0, total], [0, circumference], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily,
          fontWeight: 800,
          fontSize: radius * 1.1,
          color: "white",
          textShadow: "0 5px 0 rgba(0,0,0,0.5)",
          scale: interpolate(stepFrame, [0, 0.15 * fps], [1.5, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {number}
      </div>
    </div>
  );
};
