export type IconName =
  | "drop"
  | "marble"
  | "ball"
  | "car"
  | "house"
  | "field"
  | "tower"
  | "mountain"
  | "island"
  | "earth"
  // added for Ep002/Ep003 (new content only; existing icons unchanged)
  | "paper"
  | "monument"
  | "eiffel"
  | "domino"
  | "person"
  | "hoop"
  | "plane"
  | "iss"
  | "moon"
  | "pin"
  | "statue";

export type Rung = {
  // story second at which the comparison is shown
  t: number;
  label: string;
  icon: IconName;
  // size of the compared thing in metres
  size: number;
  // "bigger": the drop must be bigger; "about": within 10%
  relation: "bigger" | "about";
  // story seconds before `t` that the icon starts showing (default 0.5)
  lead?: number;
  // template 2+: counter label once an "about" comparison is clearly passed
  after?: string;
  // "altitude": drawn as a marker up in the sky at `size` metres (plane, space station, Moon)
  // instead of standing on the ground; `marker` is its short label
  placement?: "ground" | "altitude";
  marker?: string;
};

export type Line = {
  // story second the counter reaches when the line starts
  t: number;
  // story second when the line ends (defaults to t)
  to?: number;
  say: string;
  text: string;
  // kit captions (12 Nov 2026): the key phrases of this line, chosen by meaning, exactly as written in `text`
  // (a complete unit: "1 trillion", "15 seconds", "right now", "Swift"). At most one per caption phrase; the
  // caption splitter never cuts one in half. Lines without keys get no highlight.
  keys?: string[];
  // seconds of silence before the line (default 0.35)
  pause?: number;
  beat?: "climax" | "twist" | "cta";
  // special stage moment shown while this line plays
  // caption shows the whole line at once (the title)
  whole?: boolean;
  show?: "city" | "merge" | "dust" | "speck" | "cta" | "topple" | "escape" | "card";
  // with show: "card": a fact card over the stage while this line plays
  card?: { title: string; lines: string[] };
};

export type Episode = {
  id: string;
  title: string;
  counterLabel: string;
  endT: number;
  diameterAt: (t: number) => number;
  rungs: Rung[];
  lines: Line[];
  // look/behaviour version (TEMPLATES in theme.ts). Published episodes pin theirs.
  template?: TemplateId;
  // Episode content options (all optional; defaults = Ep001's raindrop):
  // what grows on the world stage: a sphere ("drop"), a domino chain, or a jump height
  object?: "drop" | "domino" | "jump";
  // the story-clock chip ("SECOND 12", "DOMINO #12", "JUMP #12")
  clockLabel?: string;
  // the end-card question
  ctaTitle?: string;
  // a stage of its own instead of the world stage (shapes other than growth)
  stage?: "tunnel" | "rope" | "crowd" | "moon" | "rings" | "vacuum" | "cash";
  // replaces the clock chip text (default: clockLabel + the story second)
  clockText?: (t: number) => string;
  // per-moment counter: another label, another value, or a hidden "???" before a reveal
  counterAt?: (t: number) => { label?: string; meters?: number; mystery?: boolean; text?: { value: string; unit: string } };
};

export type TemplateId = 1 | 2 | 3;
