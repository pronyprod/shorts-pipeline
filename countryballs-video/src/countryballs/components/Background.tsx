import { AbsoluteFill } from "remotion";
import { shade } from "../theme";

// Radial gradient in `color`, with a dark vignette on top.
export const Background: React.FC<{ color: string }> = ({ color }) => {
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 55% at 50% 46%, ${shade(color, 0.18)} 0%, ${color} 55%, ${shade(color, -0.45)} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
