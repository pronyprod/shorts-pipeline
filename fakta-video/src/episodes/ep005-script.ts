// EPISODE 5 (Kenapa + language): "Kenapa bahasa nasional kita bukan bahasa Jawa?" (FAKTA_BANK V6)
// Every fact: SOURCES and episodes/Ep005.md.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Kenapa bahasa nasional kita bukan bahasa Jawa? Padahal penuturnya paling banyak." },
  { id: "java", say: "Saat Indonesia merdeka, hampir separuh penduduknya suku Jawa. Empat puluh tujuh koma delapan persen." },
  { id: "tebak", say: "Terus bahasa Melayu, asal bahasa Indonesia? Tebak dulu di komentar: berapa persen yang bahasa ibunya Melayu?" },
  { id: "reveal", say: "Kurang dari lima persen!" },
  { id: "why", say: "Kecil banget, tapi malah terpilih. Kenapa?" },
  { id: "levels", say: "Pertama, bahasa Jawa punya tingkatan. Mau bilang makan? Ke teman: mangan. Ke orang yang dihormati: dhahar." },
  { id: "easy", say: "Buat orang luar, itu susah. Melayu? Gampang dipelajari, dan sudah lebih dari seribu tahun jadi bahasa pergaulan." },
  { id: "trade", say: "Dari Selat Malaka sampai Ambon, Manado, dan Kupang, pedagang ngobrol pakai Melayu." },
  { id: "fair", say: "Terakhir, Melayu terasa netral. Bisa jadi milik semua orang." },
  { id: "pledge", say: "Dua puluh delapan Oktober seribu sembilan ratus dua puluh delapan, Sumpah Pemuda. Drafnya malah tertulis bahasa Melayu. Tabrani keberatan, jadilah bahasa Indonesia!" },
  { id: "today", say: "Sekarang penuturnya sekitar dua ratus tujuh puluh juta. Yang bahasa ibu? Cuma sekitar delapan puluh juta." },
  { id: "question", say: "Bahasa daerahmu apa? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep005: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and friendly, voice rising on the question",
    java: "building up, stress the number",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "big surprised reveal, short and punchy",
    why: "puzzled, teasing, leaning in",
    levels: "playful teacher: 'mangan' casual and relaxed, 'dhahar' extra polite and refined",
    easy: "friendly and quick, stress 'lebih dari seribu tahun'",
    trade: "lively, like travelling along a route",
    fair: "warm and thoughtful",
    pledge: "proud storytelling, a surprised twist on 'Drafnya', triumphant at the end",
    today: "impressed, then surprised at the contrast",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  malacca: [102.25, 2.19] as LonLat,
  ambon: [128.17, -3.7] as LonLat,
  manado: [124.85, 1.47] as LonLat,
  kupang: [123.6, -10.16] as LonLat,
  jakarta: [106.83, -6.2] as LonLat,
};

export const NUM = { javanesePct: 47.8, malayPct: 5, totalM: 270, nativeM: 80 };

export const SOURCES = [
  { fact: "Saat merdeka: orang Jawa 47,8%; bahasa ibu Melayu <5%", source: "Paauw, 'Analysis of Indonesia's national language policy', Univ. of Rochester Working Papers in the Language Sciences 5(1), 2009" },
  { fact: "Tingkatan bahasa Jawa dengan kosakata berbeda, sulit untuk orang luar", source: "Paauw 2009" },
  { fact: "'makan': mangan (ngoko), dhahar (krama, paling sopan)", source: "Wikipedia, 'Javanese language' (diakses 2026-11-05)" },
  { fact: "Melayu mudah dipelajari; lingua franca lebih dari 1.000 tahun; Selat Malaka; bahasa ibu di Ambon, Manado, Kupang lewat perdagangan", source: "Paauw 2009" },
  { fact: "Melayu terasa netral: tidak dianggap mengancam identitas kelompok lain", source: "Paauw 2009" },
  { fact: "Sumpah Pemuda 28 Oktober 1928; draf 'bahasa Melajoe', Tabrani keberatan, jadi 'bahasa Indonesia'", source: "Wikipedia, 'Youth Pledge' (diakses 2026-11-05)" },
  { fact: "Penutur bahasa Indonesia: L1 80 juta, total 270 juta (2026)", source: "Wikipedia, 'Indonesian language' mengutip Ethnologue (diakses 2026-11-05)" },
];
