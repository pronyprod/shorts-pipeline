// Channel look. Our own palette; see CLAUDE.md "Design system" before changing anything.
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";

export const { fontFamily: FONT } = loadFont("normal", { weights: ["600", "800"], subsets: ["latin"] });

export const C = {
  kunyit: "#FFB000", // turmeric: routes, key numbers, highlighted caption word
  koral: "#FF5D73", // Indonesia shape, warnings, stamps
  toska: "#3DDBD9", // the "other" country (comparison) lines and chips
  krim: "#FFF4E0", // pill / card background
  tinta: "#1B1028", // ink: text on pills, chip background
  putih: "#FFFFFF",
  angkasa: "#07060D", // space behind the map disc
};

export const W = 1080;
export const H = 1920;
export const MAP_CY = 900; // vertical centre of the map view
export const CAPTION_Y = 1470; // top of the caption line

export const SHADOW = "0 6px 0 rgba(27,16,40,0.9), 0 10px 24px rgba(0,0,0,0.45)";

// Indonesian number format: 5.240 / 1,9
export const fmt = (n: number, decimals = 0) => {
  const [i, d] = n.toFixed(decimals).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? "," + d : "");
};
