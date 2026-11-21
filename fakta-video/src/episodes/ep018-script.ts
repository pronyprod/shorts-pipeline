// EPISODE 18 (Kenapa / flags): "Bendera kita hampir sama dengan Monako" (FAKTA_BANK V10)
// Every fact: SOURCES and episodes/Ep018.md.

import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Bendera Indonesia hampir sama persis dengan bendera Monako!" },
  { id: "same", say: "Merah di atas, putih di bawah. Bedanya cuma bentuk: dua banding tiga, lawan empat banding lima." },
  { id: "tebak", say: "Tebak dulu di komentar: bendera siapa yang lebih tua?" },
  { id: "reveal", say: "Monako resmi memakainya sejak tahun seribu delapan ratus delapan puluh satu!" },
  { id: "ours", say: "Merah putih kita pertama dikibarkan tahun seribu sembilan ratus empat puluh lima. Selisihnya enam puluh empat tahun." },
  { id: "twist", say: "Tapi tunggu... warna merah putih sudah dipakai sejak zaman Majapahit, abad ketiga belas!" },
  { id: "poland", say: "Dan kalau dibalik, putih di atas, jadi bendera Polandia. Satu desain, tiga negara!" },
  { id: "question", say: "Kamu pilih yang mana? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep018: SEGMENTS };

export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["Indonesia", "Monako"],
  same: ["dua banding tiga", "empat banding lima"],
  tebak: ["lebih tua"],
  reveal: ["seribu delapan ratus delapan puluh satu"],
  ours: ["seribu sembilan ratus empat puluh lima", "enam puluh empat tahun"],
  twist: ["Majapahit"],
  poland: ["Polandia"],
  question: ["pilih yang mana"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and intriguing, light punch on 'hampir sama persis'",
    same: "clear and steady, a small contrast between the two ratios",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a clear happy reveal, steady on the year",
    ours: "proud and matter-of-fact, steady on the year",
    twist: "a small pause after 'Tapi tunggu', then surprised and delighted",
    poland: "amused, light punch on 'Polandia'",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const NUM = { monaco: 1881, indonesia: 1945 };

export const SOURCES = [
  { fact: "Bendera Monako: merah di atas, putih di bawah, rasio 4:5, diadopsi 4 April 1881 (warna Grimaldi sejak sekurangnya 1339)", source: "Wikipedia 'Flag of Monaco'" },
  { fact: "Bendera Indonesia: rasio 2:3; pertama dikibarkan di depan umum 17 Agustus 1945 di Jakarta; warna dari panji Majapahit (Pararaton, abad ke-13)", source: "Wikipedia 'Flag of Indonesia'" },
  { fact: "Bendera Polandia: warna dibalik (putih di atas, merah di bawah)", source: "Wikipedia 'Flag of Monaco' (comparison section); Flag of Poland" },
];
