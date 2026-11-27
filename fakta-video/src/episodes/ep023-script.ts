// EPISODE 23 (geography, bank V14): Sabang ditaruh di London, Merauke mendarat di Arab Saudi (true size).
// Not a timely slot (23), not a series number (newFormats on, but 23 does not end in 7/8).
// Every fact: SOURCES and episodes/Ep023.md. Numbers computed in scripts/facts-ep023.mts -> data/ep023-facts.json.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Taruh Sabang di London. Merauke sampai di mana?" },
  { id: "measure", say: "Dari Sabang sampai Merauke, garis lurusnya lima ribu dua ratus empat puluh kilometer." },
  { id: "move", say: "Kita geser Indonesia ke Eropa, ukurannya asli. Sabang mendarat di London!" },
  { id: "cross", say: "Garisnya melintasi Prancis, Jerman, dan Austria. Lalu Turki. Belum sampai juga!" },
  { id: "moscow", say: "Tapi tunggu... ini dua kali jarak London ke Moskow!" },
  { id: "tebak", say: "Tebak dulu di komentar: Merauke mendarat di negara apa?" },
  { id: "reveal", say: "Arab Saudi!" },
  { id: "payoff", say: "Satu negara, selebar dari London sampai Arab Saudi." },
  { id: "question", say: "Rumahmu lebih dekat ke Sabang atau Merauke? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep023: SEGMENTS };

export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["Sabang", "London"],
  measure: ["lima ribu dua ratus empat puluh kilometer"],
  move: ["ukurannya asli"],
  cross: ["Prancis", "Turki"],
  moscow: ["dua kali"],
  tebak: ["negara apa"],
  reveal: ["Arab Saudi"],
  payoff: ["selebar"],
  question: ["Sabang atau Merauke"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and intriguing, a small lift on 'Merauke sampai di mana'",
    measure: "clear and steady, a light punch on 'lima ribu dua ratus empat puluh'",
    move: "playful, like sliding a puzzle piece across the map, a bright lift on 'London'",
    cross: "building curiosity, a short beat after 'Austria', then a teasing 'Belum sampai juga'",
    moscow: "a small pause after 'Tapi tunggu', then amazed, punch on 'dua kali'",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a clear happy reveal, punch on 'Arab Saudi'",
    payoff: "warm and impressed, unhurried, a little pride in 'satu negara'",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  sabang: [95.3192, 5.8942] as LonLat,
  merauke: [140.3333, -8.4667] as LonLat,
  london: [-0.1278, 51.5074] as LonLat,
  moscow: [37.6173, 55.7558] as LonLat,
};

export const NUM = { km: 5240, ratioMoscow: 2.1, moscowKm: 2501 };

export const SOURCES = [
  { fact: "Sabang-Merauke 5.240 km (garis lurus, great-circle; WGS84 5.243 km); koordinat kota Sabang dan Merauke", source: "computed (haversine R=6371,0088 km; scripts/distances.mjs, data/ep001-facts.json); Wikipedia 'Sabang, Aceh', 'Merauke' infobox" },
  { fact: "Indonesia digeser (diputar di bola bumi, ukuran asli): Sabang di London -> Merauke jatuh di Arab Saudi (49,5 BT, 23,4 LU)", source: "computed: scripts/facts-ep023.mts (sphere rotation moveFn + Natural Earth 1:50m countries, public domain)" },
  { fact: "Garis London -> Merauke melintasi Prancis, Jerman, Austria dan Turki (juga Belgia, Luksemburg, Hongaria, Slovenia, Kroasia, Serbia, Bulgaria, Rumania, Suriah, Irak)", source: "computed: data/ep023-facts.json countriesOnLine (Natural Earth 1:50m)" },
  { fact: "London-Moskow 2.501 km; 5.240 / 2.501 = 2,1x ('dua kali')", source: "computed (haversine); London 51,5074 LU -0,1278 BT, Moskow 55,7558 LU 37,6173 BT (Wikipedia)" },
];
