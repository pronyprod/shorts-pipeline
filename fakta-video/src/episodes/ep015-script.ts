// EPISODE 15 (science, TIMELY): supermoon 24 Nov 2026 (detikINET, 2 Nov 2026). Not from the bank (timely slot).
// Every fact: SOURCES and episodes/Ep015.md.

import { CHANNEL_VOICE } from "../voice.ts";

// 40-60 s, about 100 words, clear and unhurried (owner, 12 Nov 2026).
export const SEGMENTS = [
  { id: "hook", say: "Selasa, dua puluh empat November: supermoon di langit Indonesia!" },
  { id: "what", say: "Artinya purnama yang pas lagi dekat Bumi." },
  { id: "orbit", say: "Bulan mengitari Bumi lewat jalur lonjong, jadi jaraknya selalu berubah." },
  { id: "tebak", say: "Tebak dulu di komentar: seberapa dekat, berapa kilometer?" },
  { id: "reveal", say: "Titik terdekat Bulan: sekitar tiga ratus enam puluh tiga ribu kilometer!" },
  { id: "local", say: "Itu enam puluh sembilan kali Sabang sampai Merauke." },
  { id: "far", say: "Titik terjauhnya sekitar empat ratus lima ribu kilometer." },
  { id: "twist", say: "Tapi tunggu... bedanya tipis. Paling banyak cuma empat belas persen lebih besar." },
  { id: "bright", say: "Tapi tiga puluh persen lebih terang!" },
  { id: "question", say: "Kamu lihat dari kota mana? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep015: SEGMENTS };

export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["dua puluh empat November", "supermoon"],
  what: ["dekat Bumi"],
  orbit: ["jalur lonjong"],
  far: ["empat ratus lima ribu kilometer"],
  tebak: ["berapa kilometer"],
  reveal: ["tiga ratus enam puluh tiga ribu kilometer"],
  local: ["enam puluh sembilan kali"],
  twist: ["empat belas persen"],
  bright: ["tiga puluh persen"],
  question: ["kota mana"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "excited and curious, light punch on 'supermoon'",
    what: "warm and clear, matter-of-fact",
    orbit: "curious and clear, light emphasis on 'jalur lonjong'",
    far: "clear and steady, a small contrast with the closest point",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a big impressed reveal, clear and steady on the number",
    local: "amazed, light punch on 'enam puluh sembilan kali'",
    twist: "a small dramatic pause after 'Tapi tunggu', then gentle honest surprise",
    bright: "bright and upbeat, punch on 'tiga puluh persen'",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const NUM = { perigeeKm: 363300, apogeeKm: 405500, sabangMeraukeKm: 5248, times: 69, biggerPct: 14, brighterPct: 30, peakWib: "21.55" };

export const SOURCES = [
  { fact: "Supermoon (purnama dekat perigee) 24 November 2026, puncak purnama 21.55 WIB (14.55 UTC); sedikit lebih besar dan terang dari purnama biasa", source: "detikINET, 'Fenomena Astronomi November 2026: Hujan Meteor hingga Supermoon', 2 Nov 2026 (inet.detik.com/science/d-8733970)" },
  { fact: "Perigee Bulan sekitar 363.300 km, apogee sekitar 405.500 km", source: "NASA Science, 'Supermoons' (science.nasa.gov/moon/supermoons)" },
  { fact: "Supermoon bisa tampak sampai 14% lebih besar dan 30% lebih terang dari purnama terkecil tahun itu (dekat apogee)", source: "NASA Science, 'Supermoons'" },
  { fact: "Sabang-Merauke 5.248 km (haversine, R = 6371,0088 km); 363.300 / 5.248 = 69,2", source: "Dihitung: scripts/facts-ep015.mjs; koordinat Wikipedia" },
  { fact: "24 November 2026 jatuh pada hari Selasa", source: "Kalender (Rabu 18 Nov 2026 = hari ini; +6 hari)" },
];
