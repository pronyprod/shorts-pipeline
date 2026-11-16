import { AbsoluteFill } from "remotion";
import { CountryBall } from "./components/CountryBall";
import { EMBLEM_SAFE } from "./emblems";
import { fontFamily } from "./theme";

// Test sheet: every emblem-safe flag with the biggest eyes (innocent), to check
// that the emblem stays visible. Not part of any episode.
export const EmblemCheck: React.FC = () => {
  const codes = Object.keys(EMBLEM_SAFE);
  const cols = 6;
  const cell = 1080 / cols;

  return (
    <AbsoluteFill style={{ backgroundColor: "#7F8887" }}>
      {codes.map((code, i) => {
        const x = (i % cols) * cell + cell / 2;
        const y = Math.floor(i / cols) * (cell + 30) + cell / 2 + 10;
        return (
          <div key={code}>
            <CountryBall
              flag={code}
              size={cell * 0.86}
              expression="open"
              reaction="innocent"
              reactionTime={0.4}
              eyePlacement={EMBLEM_SAFE[code]}
              style={{ left: x, top: y }}
            />
            <div
              style={{
                position: "absolute",
                left: x - 60,
                width: 120,
                top: y + cell * 0.45,
                textAlign: "center",
                fontFamily,
                fontWeight: 800,
                fontSize: 22,
                color: "white",
              }}
            >
              {code.toUpperCase()} {EMBLEM_SAFE[code]}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
