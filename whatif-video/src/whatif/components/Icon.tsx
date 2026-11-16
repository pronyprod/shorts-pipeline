import React from "react";
import type { IconName } from "../types";

// Each icon is drawn in its own viewBox. `axis` says which side the rung's
// real size refers to (car = length, house = height, earth = diameter...),
// so the icon can be drawn at true scale next to the drop.
type IconDef = { w: number; h: number; axis: "w" | "h"; draw: React.ReactNode };

const Sphere: React.FC<{ id: string; light: string; dark: string }> = ({ id, light, dark }) => (
  <>
    <defs>
      <radialGradient id={id} cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor={light} />
        <stop offset="100%" stopColor={dark} />
      </radialGradient>
    </defs>
    <circle cx={50} cy={50} r={48} fill={`url(#${id})`} />
  </>
);

export const ICONS: Record<IconName | "city" | "dust", IconDef> = {
  drop: {
    w: 100, h: 100, axis: "w",
    draw: (
      <>
        <Sphere id="ic-drop" light="#9AD8FF" dark="#1E88E5" />
        <ellipse cx={34} cy={30} rx={12} ry={8} fill="#FFFFFF" opacity={0.7} />
      </>
    ),
  },
  marble: {
    w: 100, h: 100, axis: "w",
    draw: (
      <>
        <Sphere id="ic-marble" light="#C9F2E3" dark="#2E9C7A" />
        <path d="M18 60 C 35 30, 60 75, 84 40" stroke="#FF6B6B" strokeWidth={9} fill="none" strokeLinecap="round" />
        <ellipse cx={34} cy={28} rx={10} ry={6} fill="#FFFFFF" opacity={0.8} />
      </>
    ),
  },
  ball: {
    w: 100, h: 100, axis: "w",
    draw: (
      <>
        <circle cx={50} cy={50} r={47} fill="#FFFFFF" stroke="#1B1F2A" strokeWidth={3} />
        <polygon points="50,33 66,45 60,64 40,64 34,45" fill="#1B1F2A" />
        <path d="M50 33 L50 6 M66 45 L91 37 M60 64 L75 87 M40 64 L25 87 M34 45 L9 37" stroke="#1B1F2A" strokeWidth={3} />
      </>
    ),
  },
  car: {
    w: 200, h: 80, axis: "w",
    draw: (
      <>
        <path d="M8 52 Q8 38 24 36 L58 32 L82 10 Q88 6 96 6 L140 6 Q150 6 156 14 L174 34 Q194 38 194 52 L194 62 L8 62 Z" fill="#FF5A5F" />
        <path d="M90 14 L124 14 L124 32 L72 32 Z M132 14 L148 14 Q152 14 155 18 L166 32 L132 32 Z" fill="#BFE6FF" />
        <circle cx={50} cy={62} r={16} fill="#1B1F2A" />
        <circle cx={150} cy={62} r={16} fill="#1B1F2A" />
        <circle cx={50} cy={62} r={6} fill="#C7CED9" />
        <circle cx={150} cy={62} r={6} fill="#C7CED9" />
      </>
    ),
  },
  house: {
    w: 100, h: 100, axis: "h",
    draw: (
      <>
        <rect x={14} y={44} width={72} height={56} fill="#FFD166" />
        <polygon points="4,48 50,6 96,48" fill="#EF476F" />
        <rect x={42} y={70} width={16} height={30} fill="#7A4E2D" />
        <rect x={22} y={56} width={14} height={14} fill="#BFE6FF" />
        <rect x={64} y={56} width={14} height={14} fill="#BFE6FF" />
      </>
    ),
  },
  field: {
    w: 160, h: 104, axis: "w",
    draw: (
      <>
        <rect x={0} y={0} width={160} height={104} rx={4} fill="#3BB273" />
        <rect x={6} y={6} width={148} height={92} fill="none" stroke="#FFFFFF" strokeWidth={3} />
        <line x1={80} y1={6} x2={80} y2={98} stroke="#FFFFFF" strokeWidth={3} />
        <circle cx={80} cy={52} r={14} fill="none" stroke="#FFFFFF" strokeWidth={3} />
        <rect x={6} y={30} width={22} height={44} fill="none" stroke="#FFFFFF" strokeWidth={3} />
        <rect x={132} y={30} width={22} height={44} fill="none" stroke="#FFFFFF" strokeWidth={3} />
      </>
    ),
  },
  tower: {
    w: 40, h: 200, axis: "h",
    draw: (
      <>
        <rect x={19} y={0} width={2} height={30} fill="#C7CED9" />
        <polygon points="14,30 26,30 28,70 12,70" fill="#9FB3C8" />
        <polygon points="10,70 30,70 33,130 7,130" fill="#B8C7D9" />
        <polygon points="5,130 35,130 38,200 2,200" fill="#D3DEEA" />
      </>
    ),
  },
  mountain: {
    w: 160, h: 100, axis: "h",
    draw: (
      <>
        <polygon points="0,100 80,0 160,100" fill="#6D7B9C" />
        <polygon points="80,0 104,30 92,26 82,36 70,26 58,30" fill="#FFFFFF" />
        <polygon points="80,0 160,100 120,100" fill="#55617E" />
      </>
    ),
  },
  island: {
    w: 200, h: 44, axis: "w",
    draw: (
      <path
        d="M4 24 C 20 6, 60 12, 80 16 C 110 22, 130 6, 160 12 C 182 16, 198 22, 196 30 C 190 40, 150 36, 120 34 C 90 32, 60 42, 30 38 C 12 36, 0 32, 4 24 Z"
        fill="#5CC46A"
        stroke="#E9D8A6"
        strokeWidth={3}
      />
    ),
  },
  earth: {
    w: 100, h: 100, axis: "w",
    draw: (
      <>
        <Sphere id="ic-earth" light="#4FA3F7" dark="#123E8C" />
        <path d="M22 30 C 30 18, 46 20, 44 32 C 42 42, 30 40, 28 52 C 26 60, 16 56, 14 46 C 13 40, 16 34, 22 30 Z" fill="#4CB963" />
        <path d="M58 22 C 70 18, 82 28, 78 38 C 74 46, 64 42, 62 52 C 60 64, 72 66, 70 78 C 66 88, 54 84, 54 72 C 54 60, 50 50, 54 40 C 56 32, 52 26, 58 22 Z" fill="#4CB963" />
        <circle cx={50} cy={50} r={48} fill="none" stroke="#BFE6FF" strokeWidth={2} opacity={0.6} />
      </>
    ),
  },
  paper: {
    w: 210, h: 297, axis: "h",
    draw: (
      <>
        <polygon points="0,0 170,0 210,40 210,297 0,297" fill="#FFFFFF" />
        <polygon points="170,0 210,40 170,40" fill="#D7DEE8" />
        {[70, 110, 150, 190, 230].map((y) => (
          <rect key={y} x={28} y={y} width={150} height={10} rx={5} fill="#C9D3E0" />
        ))}
      </>
    ),
  },
  monument: {
    // a tall obelisk with a golden flame on top (shape inspired by Monas, simplified)
    w: 40, h: 132, axis: "h",
    draw: (
      <>
        <path d="M20 0 C 26 6, 26 12, 20 16 C 14 12, 14 6, 20 0 Z" fill="#FFC93C" />
        <rect x={16} y={16} width={8} height={6} fill="#C99A2E" />
        <polygon points="16,22 24,22 26,112 14,112" fill="#E9ECEF" />
        <polygon points="2,112 38,112 34,120 6,120" fill="#C4CBD4" />
        <rect x={0} y={120} width={40} height={12} fill="#AEB7C2" />
      </>
    ),
  },
  eiffel: {
    w: 100, h: 330, axis: "h",
    draw: (
      <>
        <rect x={48} y={0} width={4} height={24} fill="#8A6A4F" />
        <polygon points="44,24 56,24 66,120 34,120" fill="#A07A57" />
        <rect x={30} y={116} width={40} height={8} fill="#7D5C42" />
        <polygon points="32,124 68,124 82,210 18,210" fill="#A07A57" />
        <rect x={14} y={206} width={72} height={9} fill="#7D5C42" />
        <path d="M16 215 L84 215 L100 330 L72 330 C 66 280, 34 280, 28 330 L0 330 Z" fill="#A07A57" />
      </>
    ),
  },
  domino: {
    // front view: white tile, dividing line, pips
    w: 50, h: 100, axis: "h",
    draw: (
      <>
        <rect x={1} y={1} width={48} height={98} rx={6} fill="#FAF7F0" stroke="#1B1F2A" strokeWidth={2} />
        <line x1={6} y1={50} x2={44} y2={50} stroke="#1B1F2A" strokeWidth={2} />
        {[[15, 18], [35, 32], [25, 25], [15, 68], [35, 68], [15, 84], [35, 84]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill="#1B1F2A" />
        ))}
      </>
    ),
  },
  person: {
    w: 40, h: 100, axis: "h",
    draw: (
      <>
        <circle cx={20} cy={12} r={11} fill="#FFD166" />
        <rect x={9} y={26} width={22} height={38} rx={8} fill={"#4FC3FF"} />
        <rect x={2} y={28} width={7} height={30} rx={3} fill="#FFD166" transform="rotate(-20 5 28)" />
        <rect x={31} y={28} width={7} height={30} rx={3} fill="#FFD166" transform="rotate(20 35 28)" />
        <rect x={10} y={62} width={8} height={38} rx={4} fill="#2B3A55" />
        <rect x={22} y={62} width={8} height={38} rx={4} fill="#2B3A55" />
      </>
    ),
  },
  hoop: {
    // basketball hoop on a pole; height = rim height
    w: 80, h: 100, axis: "h",
    draw: (
      <>
        <rect x={10} y={0} width={6} height={100} fill="#8E9AAF" />
        <rect x={16} y={0} width={40} height={28} fill="#FFFFFF" stroke="#1B1F2A" strokeWidth={2} />
        <rect x={28} y={10} width={16} height={12} fill="none" stroke="#FF5A5F" strokeWidth={2} />
        <ellipse cx={50} cy={27} rx={14} ry={3} fill="none" stroke="#FF7A45" strokeWidth={3} />
        <path d="M37 27 L42 42 L58 42 L63 27" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
      </>
    ),
  },
  plane: {
    w: 120, h: 40, axis: "w",
    draw: (
      <>
        <path d="M4 20 Q 4 14, 14 14 L100 14 Q 116 16, 118 20 Q 116 24, 100 26 L14 26 Q 4 26, 4 20 Z" fill="#F1F5F9" />
        <polygon points="50,14 70,14 46,0 38,0" fill="#C7CED9" />
        <polygon points="50,26 70,26 46,40 38,40" fill="#C7CED9" />
        <polygon points="8,14 20,14 12,4 6,4" fill="#4FC3FF" />
      </>
    ),
  },
  iss: {
    w: 120, h: 60, axis: "w",
    draw: (
      <>
        <rect x={0} y={4} width={40} height={20} fill="#3B6FB6" />
        <rect x={0} y={36} width={40} height={20} fill="#3B6FB6" />
        <rect x={80} y={4} width={40} height={20} fill="#3B6FB6" />
        <rect x={80} y={36} width={40} height={20} fill="#3B6FB6" />
        <rect x={18} y={27} width={84} height={6} fill="#C7CED9" />
        <rect x={50} y={18} width={20} height={24} rx={4} fill="#E9ECEF" />
      </>
    ),
  },
  moon: {
    w: 100, h: 100, axis: "w",
    draw: (
      <>
        <circle cx={50} cy={50} r={48} fill="#D9D9D9" />
        <circle cx={34} cy={36} r={9} fill="#BDBDBD" />
        <circle cx={62} cy={62} r={13} fill="#C4C4C4" />
        <circle cx={66} cy={28} r={6} fill="#BDBDBD" />
      </>
    ),
  },
  pin: {
    w: 60, h: 80, axis: "h",
    draw: (
      <>
        <path d="M30 80 C 24 58, 4 46, 4 28 A 26 26 0 1 1 56 28 C 56 46, 36 58, 30 80 Z" fill="#FF7A45" />
        <circle cx={30} cy={28} r={10} fill="#FFFFFF" />
      </>
    ),
  },
  statue: {
    // a robed figure holding up a torch on a stepped pedestal (generic, simplified)
    w: 50, h: 100, axis: "h",
    draw: (
      <>
        <rect x={4} y={84} width={42} height={16} fill="#B9A58C" />
        <rect x={10} y={70} width={30} height={14} fill="#C9B79F" />
        <path d="M17 70 L20 40 Q 25 32, 30 40 L33 70 Z" fill="#6FB7A4" />
        <circle cx={25} cy={30} r={6} fill="#6FB7A4" />
        <rect x={30} y={12} width={4} height={28} fill="#6FB7A4" transform="rotate(8 32 26)" />
        <path d="M34 2 C 39 7, 37 12, 34 13 C 31 12, 30 7, 34 2 Z" fill="#FFC93C" />
      </>
    ),
  },
  city: {
    w: 300, h: 40, axis: "w",
    draw: (
      <>
        {[
          [0, 22], [18, 30], [34, 18], [50, 36], [64, 26], [80, 40], [94, 20], [110, 32], [126, 24], [140, 38],
          [156, 28], [170, 22], [186, 34], [200, 18], [216, 30], [232, 26], [248, 36], [262, 20], [278, 28],
        ].map(([x, h]) => (
          <rect key={x} x={x} y={40 - h} width={14} height={h} fill="#2B3A55" />
        ))}
      </>
    ),
  },
  dust: {
    w: 100, h: 100, axis: "w",
    draw: (
      <polygon points="50,8 64,26 92,30 74,52 84,82 54,72 26,90 28,60 8,40 36,30" fill="#8D6E63" />
    ),
  },
};

// Draws an icon so that its compared side is `px` pixels long
export const Icon: React.FC<{ name: IconName | "city" | "dust"; px: number; style?: React.CSSProperties }> = ({
  name,
  px,
  style,
}) => {
  const def = ICONS[name];
  const scale = px / (def.axis === "w" ? def.w : def.h);
  return (
    <svg
      width={def.w * scale}
      height={def.h * scale}
      viewBox={`0 0 ${def.w} ${def.h}`}
      style={{ overflow: "visible", ...style }}
    >
      {def.draw}
    </svg>
  );
};

export const iconBox = (name: IconName | "city" | "dust", px: number) => {
  const def = ICONS[name];
  const scale = px / (def.axis === "w" ? def.w : def.h);
  return { w: def.w * scale, h: def.h * scale };
};
