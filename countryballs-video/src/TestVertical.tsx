import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const TestVertical: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0b0f",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          fontWeight: 900,
          fontSize: 260,
          letterSpacing: 12,
          color: "white",
          scale: interpolate(frame, [0.5 * fps, 1.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [4 * fps, 4.8 * fps], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        TEST
      </Interactive.Div>
    </AbsoluteFill>
  );
};
