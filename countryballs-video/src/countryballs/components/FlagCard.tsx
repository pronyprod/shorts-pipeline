import { Img, staticFile } from "remotion";
import { labelStyle } from "../theme";

export const FlagCard: React.FC<{
  label: string;
  flag: string;
  width: number;
  x: number;
  y: number;
  style?: React.CSSProperties;
}> = ({ label, flag, width, x, y, style }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y,
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        ...style,
      }}
    >
      <div style={{ ...labelStyle, fontSize: width * 0.22 }}>{label}</div>
      <Img
        src={staticFile(`flags/4x3/${flag}.svg`)}
        style={{
          width,
          height: width * 0.75,
          display: "block",
          outline: "3px solid rgba(0,0,0,0.35)",
          boxShadow: "0 10px 22px rgba(0,0,0,0.45)",
        }}
      />
    </div>
  );
};
