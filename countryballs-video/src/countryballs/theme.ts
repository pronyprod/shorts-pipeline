import { loadFont } from "@remotion/google-fonts/Montserrat";

export const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

export const NEUTRAL_BG = "#7F8887";
export const END_COLOR = "#0a0b0c";

// Positions in the 1080x1920 frame. Top 10% (192px) and bottom 20% (from 1536px)
// stay free of key elements.
export const LAYOUT = {
  dadCard: { x: 290, y: 215 },
  momCard: { x: 790, y: 215 },
  meCard: { x: 540, y: 480 },
  cardWidth: 290,
  meCardWidth: 330,
  parentSize: 640,
  dad: { x: 300, y: 1000 },
  mom: { x: 780, y: 1000 },
  childSize: 500,
  child: { x: 540, y: 1150 },
  captionBottom: 1536,
};

// "low-child" layout (Ep001V2+): child ~9.6% of the frame lower than classic,
// cards unchanged. Parents are a bit smaller and higher so the caption fits in
// the band between the parents' eyes and the child's head.
export const LAYOUT_LOW = {
  ...LAYOUT,
  parentSize: 560,
  dad: { x: 300, y: 930 },
  mom: { x: 780, y: 930 },
  childSize: 390,
  child: { x: 540, y: 1335 },
  captionBand: { top: 998, bottom: 1128 },
};

// "low-child" layout for template 3: room for big two-line captions.
// Parents smaller and higher, child slightly smaller, "ME:" card smaller but in
// the same place so it doesn't cover the parents' inner eyes.
// Caption band: from just below the parents' eyes (incl. shocked/sinking
// reactions) to just above the child's head (incl. bob and proud puff).
export const LAYOUT_LOW_V3 = {
  ...LAYOUT,
  meCardWidth: 260,
  parentSize: 500,
  dad: { x: 290, y: 840 },
  mom: { x: 790, y: 840 },
  childSize: 370,
  child: { x: 540, y: 1340 },
  captionBand: { top: 905, bottom: 1138 },
};

export type Layout = typeof LAYOUT & { captionBand?: { top: number; bottom: number } };

export const labelStyle: React.CSSProperties = {
  fontFamily,
  fontWeight: 800,
  color: "white",
  textTransform: "uppercase",
  textShadow: "0 5px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.45)",
  whiteSpace: "nowrap",
};

// Accepts "#rrggbb", "#rgb" or "rgb(a)(...)" (what interpolateColors returns)
const toRgb = (color: string) => {
  if (color.startsWith("rgb")) {
    return color.replace(/[^\d.,]/g, "").split(",").slice(0, 3).map(Number);
  }
  const h = color.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const toHex = (rgb: number[]) =>
  "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

// amount 0..1: how far to move towards black (negative) or white (positive)
export const shade = (hex: string, amount: number) => {
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  return toHex(toRgb(hex).map((v) => v + (target - v) * t));
};

// Template versions. Each episode uses `template` from its data, or the latest.
// v1: Ep001, Ep001V2 (voices -18 dBFS RMS, no caption pill)
// v2: Ep002. Voices -15.8 LUFS each, final mix about -14 LUFS, caption on a dark pill
// v3: big bold captions (cap height ~80-90px) with a slim pill, emblem-safe eyes,
//     light rays behind all balls
export type TemplateSettings = {
  musicVolume: number;
  captionPill: boolean;
  bigCaptions: boolean;
  emblemSafeEyes: boolean;
  raysBehindBalls: boolean;
  questionBeside: boolean; // confused "?" beside the head (parents sit higher in v3)
  layouts: { classic: Layout; "low-child": Layout };
};

const OLD_LAYOUTS = { classic: LAYOUT, "low-child": LAYOUT_LOW };

export const TEMPLATES: Record<1 | 2 | 3, TemplateSettings> = {
  1: {
    musicVolume: 0.11,
    captionPill: false,
    bigCaptions: false,
    emblemSafeEyes: false,
    raysBehindBalls: false,
    questionBeside: false,
    layouts: OLD_LAYOUTS,
  },
  // music file is -19.7 LUFS; 0.15 keeps it ~18 dB under the voices (measured)
  2: {
    musicVolume: 0.15,
    captionPill: true,
    bigCaptions: false,
    emblemSafeEyes: false,
    raysBehindBalls: false,
    questionBeside: false,
    layouts: OLD_LAYOUTS,
  },
  3: {
    musicVolume: 0.15,
    captionPill: true,
    bigCaptions: true,
    emblemSafeEyes: true,
    raysBehindBalls: true,
    questionBeside: true,
    layouts: { classic: LAYOUT, "low-child": LAYOUT_LOW_V3 },
  },
};
export const LATEST_TEMPLATE = 3;
