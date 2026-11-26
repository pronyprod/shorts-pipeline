// EPISODE 22 (Kenapa, bank K4): kenapa penanak nasi tahu nasinya sudah matang.
// Not a timely slot (22), not a series number. Every fact: SOURCES and episodes/Ep022.md.

import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Penanak nasi nggak punya otak, tapi tahu persis kapan nasinya matang!" },
  { id: "why", say: "Rahasianya ada di air. Selama masih ada air, panci nggak bisa lebih panas dari seratus derajat." },
  { id: "twist", say: "Tapi tunggu... begitu air habis terserap nasi, suhu panci langsung naik di atas seratus derajat!" },
  { id: "magnet", say: "Di bawah panci ada magnet kecil. Saat suhu naik sedikit di atas titik didih, magnet itu kehilangan daya tariknya, dan saklar pun terlepas." },
  { id: "warm", say: "Lalu penanak nasi pindah ke mode hangat, supaya nasi nggak gosong." },
  { id: "tebak", say: "Tebak dulu di komentar: berapa derajat suhu mode hangat?" },
  { id: "reveal", say: "Sekitar enam puluh lima derajat!" },
  { id: "question", say: "Kamu makan nasi berapa kali sehari? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep022: SEGMENTS };

export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["Penanak nasi", "nasinya matang"],
  why: ["seratus derajat"],
  twist: ["air habis", "di atas seratus derajat"],
  magnet: ["magnet kecil", "kehilangan daya tariknya"],
  warm: ["mode hangat"],
  tebak: ["berapa derajat"],
  reveal: ["enam puluh lima derajat"],
  question: ["berapa kali sehari"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and intriguing, light punch on 'nggak punya otak'",
    why: "explaining, friendly and clear, small lift on 'seratus derajat'",
    twist: "a small pause after 'Tapi tunggu', then surprised, punch on 'di atas seratus derajat'",
    magnet: "clear storytelling, a gentle lift on 'magnet kecil', punch on 'kehilangan daya tariknya'",
    warm: "relaxed and reassuring, wrapping up the explanation",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a clear happy reveal, punch on 'enam puluh lima derajat'",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const NUM = { boil: 100, warm: 65 };

export const SOURCES = [
  { fact: "Selama masih ada air, panci berhenti di titik didih (100 °C); setelah air terserap, suhu bisa naik di atas titik didih dan memicu termostat", source: "Wikipedia 'Rice cooker' (simple cookers); kottke.org 'The clever engineering trick...' (Jan 2024)" },
  { fact: "Tombol/magnet suhu: paduan dengan titik Curie sedikit di atas titik didih air; di atasnya magnet melepas, pegas menggeser saklar ke mode hangat", source: "kottke.org (Jan 2024), summarising the explainer on the magnetic thermal switch" },
  { fact: "Mode hangat banyak model: sekitar 65 °C (150 °F)", source: "Wikipedia 'Rice cooker' (keep-warm ~65 °C)" },
];
