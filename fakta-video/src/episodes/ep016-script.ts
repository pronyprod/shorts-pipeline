// EPISODE 16 (food): "Kenapa kopi disebut 'java'?" (FAKTA_BANK V8)
// Every fact: SOURCES and episodes/Ep016.md.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

// 40-60 s, about 95 words, clear and unhurried (owner, 12 Nov 2026).
export const SEGMENTS = [
  { id: "hook", say: "Kenapa kopi di seluruh dunia disebut java?" },
  { id: "plant", say: "Tahun seribu enam ratus sembilan puluh enam, bibit kopi pertama tiba di Batavia." },
  { id: "flood", say: "Tapi tunggu... bibit pertama itu gagal tumbuh." },
  { id: "second", say: "Kiriman kedua datang tahun seribu enam ratus sembilan puluh sembilan, dan kali ini berhasil." },
  { id: "tebak", say: "Tebak dulu di komentar: sudah berapa tahun kopi tumbuh di Jawa sejak itu?" },
  { id: "reveal", say: "Tiga ratus dua puluh tujuh tahun!" },
  { id: "europe", say: "Kopi dari pulau Jawa dikirim sampai Eropa, dan namanya melekat: java jadi sebutan untuk kopi." },
  { id: "code", say: "Bahkan bahasa pemrograman Java dinamai dari kopi itu!" },
  { id: "rank", say: "Sekarang Indonesia masih lima besar produsen kopi dunia." },
  { id: "question", say: "Kopi daerahmu apa? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep016: SEGMENTS };

// captions v2: the phrases a person would stress, copied exactly from each segment's text
export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["java"],
  plant: ["seribu enam ratus sembilan puluh enam", "Batavia"],
  flood: ["gagal tumbuh"],
  second: ["seribu enam ratus sembilan puluh sembilan"],
  tebak: ["berapa tahun"],
  reveal: ["Tiga ratus dua puluh tujuh tahun"],
  europe: ["Eropa"],
  code: ["bahasa pemrograman Java"],
  rank: ["lima besar"],
  question: ["Kopi daerahmu"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and intriguing, light punch on 'java'",
    plant: "clear storytelling, steady, light stress on the year",
    flood: "a small dramatic pause after 'Tapi tunggu', then a mild disappointed tone",
    second: "hopeful and upbeat, a lift on 'berhasil'",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a big happy reveal, clear and steady on the number",
    europe: "warm and impressed, clear on 'java'",
    code: "amused and surprised, punch on 'Java'",
    rank: "proud and matter-of-fact",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  batavia: [106.85, -6.2] as LonLat, // Batavia = today's Jakarta (approx. 6.2 S, 106.85 E)
  amsterdam: [4.9, 52.37] as LonLat, // Amsterdam (Wikipedia)
};

export const NUM = { first: 1696, second: 1699, now: 2026, years: 2026 - 1699 };

export const SOURCES = [
  { fact: "1696: bibit kopi arabika pertama dikirim ke gubernur Belanda di Batavia; gagal karena banjir", source: "Wikipedia, 'Coffee production in Indonesia' (history); Jakarta Post, 'How coffee went from the hands of the Dutch to the world', 19 Jan 2018" },
  { fact: "1699: kiriman bibit kedua (Hendrik Zwaardecroon) berhasil; ekspor pertama ke Eropa lewat VOC", source: "Wikipedia, 'Coffee production in Indonesia'; Jakarta Post 19 Jan 2018 (tahun ekspor pertama berbeda antar sumber: 1706/1711, tidak disebut)" },
  { fact: "2026 - 1699 = 327 tahun", source: "Dihitung: scripts/facts-ep016.mjs" },
  { fact: "'Java' = sebutan umum untuk kopi (Amerika Utara sejak ±1850; Merriam-Webster 1805), dari pulau Jawa", source: "Dictionary.com 'java'; Merriam-Webster 'java'; Quick and Dirty Tips; Snopes" },
  { fact: "Bahasa pemrograman Java 'finally renamed Java, from Java coffee, a type of coffee from Indonesia'", source: "Wikipedia, 'Java (programming language)'" },
  { fact: "Indonesia produsen kopi terbesar ke-4 dunia pada 2025 (USDA FAS); 'lima besar' aman untuk 2024/25 dan 2025/26", source: "USDA FAS via Wikipedia 'Coffee production in Indonesia' (diakses 2 Jun 2026); Vietnamnet / Databoks (outlook 2025/26)" },
];
