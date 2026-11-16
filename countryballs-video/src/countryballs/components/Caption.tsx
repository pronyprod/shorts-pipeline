import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../theme";

const MAX_FONT = 96;
const LINE_HEIGHT = 1.08;
// Average uppercase glyph width of Montserrat ExtraBold, as a share of the
// font size (slightly generous so text never overflows)
const CHAR_WIDTH = 0.74;

// Biggest font that fits `lines` inside width x height
const fit = (lines: string[], width: number, height: number) => {
  const longest = Math.max(...lines.map((l) => l.length));
  return Math.min(MAX_FONT, width / (longest * CHAR_WIDTH), height / (lines.length * LINE_HEIGHT));
};

// Split into two lines of similar length
const twoLines = (text: string) => {
  const words = text.split(" ");
  let best = [text, ""];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  return best;
};

// Subtle dark rounded backing so captions read over striped flags
const pillStyle = (fontSize: number, lines: number): React.CSSProperties => ({
  backgroundColor: "rgba(0,0,0,0.45)",
  borderRadius: lines > 1 ? fontSize * 0.55 : 9999,
  padding: `${fontSize * 0.12}px ${fontSize * 0.5}px`,
});

// Big captions (template 3). Measured for Montserrat Black/ExtraBold caps:
// cap height = 0.72 x font size, average glyph width 0.55-0.66 x font size.
const BIG = {
  maxFont: 125, // one line: cap height ~90px
  lineHeight: 0.95, // caps only, so lines can sit close
  charWidth: 0.66,
  stroke: 0.16, // text outline, as a share of the font size
  padY: 0.04, // slim pill padding
  padX: 0.18,
  maxWidth: 1000,
};

const fitBig = (lines: string[], height: number) => {
  const longest = Math.max(...lines.map((l) => l.length));
  const byWidth = BIG.maxWidth / (longest * BIG.charWidth + BIG.stroke + 2 * BIG.padX);
  const byHeight = height / (lines.length * BIG.lineHeight + BIG.stroke + 2 * BIG.padY);
  return Math.min(BIG.maxFont, byWidth, byHeight);
};

// Spoken punchline. Frame 0 of this component is when the line starts.
// - `bottom`: classic layout, centred in the lower third with its bottom edge at `bottom`.
// - `band`: the caption is sized (one or two lines) to fit inside this vertical band.
// - `pill`: put the text on a subtle dark rounded pill.
// - `big`: template 3 sizing (with `band`): as big as the band allows, slim pill.
export const Caption: React.FC<{
  text: string;
  bottom: number;
  band?: { top: number; bottom: number };
  pill?: boolean;
  big?: boolean;
}> = ({ text, bottom, band, pill = false, big = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = interpolate(frame, [0, 0.25 * fps], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 11 }),
    output: "perceptual-scale",
  });

  if (band && big) {
    const height = band.bottom - band.top;
    const upper = text.toUpperCase();
    const one = [upper];
    const two = twoLines(upper).filter(Boolean);
    const lines = fitBig(one, height) >= fitBig(two, height) ? one : two;
    const fontSize = fitBig(lines, height);

    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: band.top,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize,
            lineHeight: BIG.lineHeight,
            textAlign: "center",
            whiteSpace: "nowrap",
            color: "white",
            WebkitTextStroke: `${Math.round(fontSize * BIG.stroke)}px black`,
            paintOrder: "stroke fill",
            scale,
            ...(pill
              ? {
                  backgroundColor: "rgba(0,0,0,0.45)",
                  borderRadius: fontSize * 0.3,
                  padding: `${fontSize * BIG.padY}px ${fontSize * BIG.padX}px`,
                }
              : {}),
          }}
        >
          {lines.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
      </div>
    );
  }

  if (band) {
    // leave room for the pill's padding
    const width = (1080 - 2 * 60) * (pill ? 0.9 : 1);
    const height = (band.bottom - band.top) * (pill ? 0.82 : 1);
    const upper = text.toUpperCase();
    const one = [upper];
    const two = twoLines(upper).filter(Boolean);
    const lines = fit(one, width, height) >= fit(two, width, height) ? one : two;
    const fontSize = fit(lines, width, height);

    return (
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: band.top,
          height: band.bottom - band.top,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize,
            lineHeight: LINE_HEIGHT,
            textAlign: "center",
            whiteSpace: "nowrap",
            color: "white",
            WebkitTextStroke: `${Math.round(fontSize * 0.2)}px black`,
            paintOrder: "stroke fill",
            scale,
            ...(pill ? pillStyle(fontSize, lines.length) : {}),
          }}
        >
          {lines.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 0,
        height: bottom,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 1.08,
          textAlign: "center",
          textTransform: "uppercase",
          color: "white",
          WebkitTextStroke: "16px black",
          paintOrder: "stroke fill",
          scale,
          // classic captions can wrap, so use the rounded-rectangle shape
          ...(pill ? pillStyle(96, 2) : {}),
        }}
      >
        {text}
      </div>
    </div>
  );
};
