// EPISODE 13 (geography): "Selat Malaka: jalan tol laut tersibuk di dunia?" (FAKTA_BANK #7)
// Every fact: SOURCES and episodes/Ep013.md. Numbers computed in scripts/facts-ep013.mjs -> data/ep013-facts.json.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

// 40-60 s, about 110 words, clear and unhurried (owner, 12 Nov 2026).
export const SEGMENTS = [
  { id: "hook", say: "Lebih dari seratus ribu kapal setahun, lewat satu selat di samping Sumatra!" },
  { id: "name", say: "Namanya Selat Malaka, dari nama kota Melaka di Malaysia." },
  { id: "long", say: "Panjangnya sekitar sembilan ratus kilometer. Lebih jauh dari Jakarta ke Surabaya!" },
  { id: "why", say: "Kenapa ramai? Ini jalan pintas dari Samudra Hindia ke Laut Cina Selatan." },
  { id: "narrow", say: "Tapi tunggu... dekat Singapura, jalurnya menyempit." },
  { id: "width", say: "Nggak sampai tiga kilometer. Cuma sekitar separuh Jembatan Suramadu!" },
  { id: "tebak", say: "Tebak dulu di komentar: berapa kapal lewat sini, tiap hari?" },
  { id: "reveal", say: "Rata-rata dua ratus delapan puluh kapal. Setiap hari!" },
  { id: "deep", say: "Satu lagi: kapal paling besar nggak muat. Di bagian terdangkal, dalamnya cuma dua puluh lima meter." },
  { id: "lombok", say: "Jadi mereka memutar lewat Selat Lombok. Dalamnya minimal dua ratus lima puluh meter!" },
  { id: "question", say: "Laut terdekat dari rumahmu apa? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep013: SEGMENTS };

// captions v2: the phrases a person would stress, copied exactly from each segment's text
export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["seratus ribu kapal"],
  name: ["Selat Malaka"],
  long: ["sembilan ratus kilometer"],
  why: ["jalan pintas"],
  narrow: ["menyempit"],
  width: ["tiga kilometer", "Suramadu"],
  tebak: ["tiap hari"],
  reveal: ["dua ratus delapan puluh kapal"],
  deep: ["dua puluh lima meter"],
  lombok: ["Selat Lombok", "dua ratus lima puluh meter"],
  question: ["Laut terdekat"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and impressed, light punch on 'seratus ribu kapal'",
    name: "clear and friendly, say 'Malaka' (ma-LA-ka) and 'Melaka' (me-LA-ka) clearly",
    long: "calm, then a small impressed lift on 'Jakarta ke Surabaya'",
    why: "a playful question, then a clear explanation",
    narrow: "a small dramatic pause after 'Tapi tunggu', then gentle surprise on 'menyempit'",
    width: "amazed, clear on 'tiga kilometer', a smile on 'Suramadu' (su-ra-MA-du)",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a big happy reveal, punch on the number, then 'Setiap hari!' with a smile",
    deep: "amused disbelief, clear and steady on 'dua puluh lima meter'",
    lombok: "satisfied, like solving a puzzle, clear on the number",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  melaka: [102.25, 2.19] as LonLat, // Melaka city (Wikipedia, 'Malacca City': 2°12′N 102°15′E)
  singapore: [103.82, 1.29] as LonLat, // Singapore (Wikipedia)
  phillip: [103.75, 1.12] as LonLat, // Phillip Channel, south of Singapore (approx., label position)
  lombok: [115.73, -8.65] as LonLat, // Lombok Strait (Wikipedia, 'Lombok Strait': 8°47′S 115°44′E, approx. centre)
  north: [97.6, 5.8] as LonLat, // northern entrance (between Aceh and the Malay peninsula; approx.)
};
// the shipping lane (approx. waypoints in the water, for the drawing only)
export const LANE: LonLat[] = [[91.5, 6.0], [95.0, 6.3], [97.6, 5.8], [99.6, 4.0], [100.9, 2.8], [102.3, 1.9], [103.4, 1.15], [103.8, 1.13], [104.4, 1.25], [105.3, 2.2], [107.5, 4.8], [110.0, 7.5]];
export const DETOUR: LonLat[] = [[91.5, 4.0], [100.0, -5.5], [110.0, -10.2], [115.3, -9.6], [115.73, -8.7], [116.3, -6.5], [117.8, -3.0], [118.5, 1.5], [119.5, 6.5]];

export const NUM = { ships2025: 102500, ships2024: 94300, perDay: 280, lengthKm: 900, jktSbyKm: 663, phillipsKm: 2.8, suramaduKm: 5.4, minDepth: 25, lombokDepth: 250 };

export const SOURCES = [
  { fact: "Lebih dari 102.500 kapal lewat Selat Malaka pada 2025 (sekitar 94.300 pada 2024)", source: "Malaysia Marine Department, via Reuters / Malay Mail, 'Could the Strait of Malacca be next?…', 23 Apr 2026" },
  { fact: "Rata-rata ±280 kapal per hari (102.500 / 365 = 280,8)", source: "Dihitung: scripts/facts-ep013.mjs" },
  { fact: "Nama selat dari kota Melaka (Malaysia), dinamai Parameswara dari pohon melaka", source: "Wikipedia, 'Strait of Malacca' (etymology)" },
  { fact: "Panjang Selat Malaka sekitar 900 km (infobox: maks. 930 km)", source: "Wikipedia, 'Strait of Malacca'" },
  { fact: "Jakarta-Surabaya garis lurus 663 km (Monas-Tugu Pahlawan); 900 km = 1,36x", source: "Dihitung: scripts/facts-ep013.mjs (haversine; Vincenty 664 km)" },
  { fact: "Jalur utama antara Samudra Hindia dan Laut Cina Selatan / Pasifik", source: "Wikipedia, 'Strait of Malacca'; Reuters / Malay Mail 23 Apr 2026" },
  { fact: "Titik tersempit: Phillip Channel (Selat Singapura) 2,8 km (Reuters: 2,7 km) = nggak sampai 3 km", source: "Wikipedia, 'Strait of Malacca'; Reuters / Malay Mail 23 Apr 2026" },
  { fact: "Jembatan Suramadu 5.438 m; 2,7-2,8 km = 0,50-0,51x = sekitar separuh", source: "Wikipedia, 'Suramadu Bridge'; dihitung: scripts/facts-ep013.mjs" },
  { fact: "Selat sedalam ±25 m di bagian terdangkal; kapal 'Malaccamax' maks. draft 20,5 m; kapal yang lebih dalam nggak bisa lewat", source: "Wikipedia, 'Malaccamax'; 'Strait of Malacca' (minimum depth 25 m)" },
  { fact: "Kapal 'post-Malaccamax' sering lewat Selat Lombok, dalamnya minimal 250 m", source: "Wikipedia, 'Lombok Strait'; 'Malaccamax' (Lombok Strait 250 m)" },
  { fact: "Hampir 22% perdagangan laut dunia lewat Selat Malaka (layar saja, tidak diucapkan)", source: "CSIS, via Reuters / Malay Mail 23 Apr 2026" },
];
