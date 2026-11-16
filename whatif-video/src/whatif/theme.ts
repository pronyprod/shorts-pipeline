import { loadFont } from "@remotion/google-fonts/Montserrat";

export const { fontFamily } = loadFont("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin"],
});

export const COLORS = {
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.72)",
  accent: "#4FC3FF",
  accentDeep: "#1E88E5",
  alert: "#FF7A45",
  water: "#3FA9F5",
  waterDeep: "#1565C0",
  ink: "#0A1226",
};

// Positions in the 1080x1920 frame. Top 10% (0-192 px) and bottom 20%
// (from 1536 px) stay free of key elements.
export const LAYOUT = {
  safeTop: 192,
  safeBottom: 1536,
  side: 80,
  stageCenterY: 940,
  stageMaxWidth: 940,
  dropSize: 380,
  captionTop: 1290,
  captionBottom: 1520,
};

export const MUSIC_VOLUME = 0.12;
// silence before the first line and hold after the last one (seconds)
export const LEAD_IN = 0.15;
export const TAIL = 2.6;

// Template versions. New episodes use the latest; published ones pin theirs
// (`template` in the episode data) so they keep rendering exactly as before.
// 1: Ep001 (fixed-size stage, comparison icons scaled next to the drop)
// 2: Ep001V2+ (log-zoom camera over a true-scale world, phrase captions,
//    story clock moving from frame 0, short end hold + loop crossfade)
// 3: Ep001V3+ (template 2 + rotating library music: loudness-matched copy, build lined
//    up with the climax, ducked under the voice; see src/whatif/music.ts)
export const TEMPLATES = {
  1: { leadIn: LEAD_IN, tail: TAIL, mmDecimals: 1, phraseCaptions: false, worldStage: false, rain: 0.35, loopFade: 0, musicFadeIn: 0, libraryMusic: false },
  2: { leadIn: 0, tail: 0.6, mmDecimals: 2, phraseCaptions: true, worldStage: true, rain: 0.6, loopFade: 0.4, musicFadeIn: 0.2, libraryMusic: false },
  3: { leadIn: 0, tail: 0.6, mmDecimals: 2, phraseCaptions: true, worldStage: true, rain: 0.6, loopFade: 0.4, musicFadeIn: 1.0, libraryMusic: true },
} as const;
export const LATEST_TEMPLATE = 3;
export const templateOf = (ep: { template?: 1 | 2 | 3 }) => TEMPLATES[ep.template ?? LATEST_TEMPLATE];
