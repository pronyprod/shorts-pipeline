// EPISODE 4 (history): "Manhattan pernah 'ditukar' pulau kecil di Maluku?" (FAKTA_BANK V1)
// Every fact: SOURCES and episodes/Ep004.md. Wording avoids war terms (TTS safety rule).

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Manhattan pernah ditukar sama pulau kecil di Maluku? Panjangnya cuma tiga kilometer." },
  { id: "run", say: "Namanya Pulau Run, di Kepulauan Banda. Sampai abad kesembilan belas, Banda satu-satunya sumber pala di dunia." },
  { id: "tebak", say: "Tebak dulu di komentar: pala dari Banda dijual berapa kali lipat di Eropa?" },
  { id: "reveal", say: "Tiga ratus kali lipat! Beli seribu, jual tiga ratus ribu." },
  { id: "english", say: "Belanda mau semua pala itu. Masalahnya, sejak seribu enam ratus enam belas, Pulau Run dipegang Inggris." },
  { id: "newyork", say: "Di sisi lain dunia, Belanda punya kota kecil: New Amsterdam, di Manhattan. Tahun seribu enam ratus enam puluh empat, kota itu pindah ke tangan Inggris." },
  { id: "breda", say: "Seribu enam ratus enam puluh tujuh, Perjanjian Breda. Inggris tetap pegang Manhattan. Belanda dapat Run." },
  { id: "win", say: "Sepintas Belanda yang menang: monopoli pala akhirnya lengkap." },
  { id: "twist", say: "Tapi tunggu. Tahun seribu delapan ratus tujuh belas, pohon pala dibawa ke Ceylon dan Grenada. Monopolinya tamat." },
  { id: "flag", say: "Sekarang, pala malah nempel di bendera Grenada." },
  { id: "banda", say: "Dan siapa yang paling menanggung monopoli itu? Orang Banda sendiri." },
  { id: "today", say: "Hari ini, Manhattan hampir satu juta tujuh ratus ribu orang. Pulau Run? Sekitar seribu lima ratus." },
  { id: "question", say: "Kamu dari pulau mana? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep004: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "teasing, voice rising on the question, then amused at how tiny it is",
    run: "storytelling, quick, stress 'satu-satunya'",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "big reveal, excited on 'Tiga ratus kali lipat', then quick and amused",
    english: "building tension, a little dramatic on 'Masalahnya'",
    newyork: "storytelling, quick and light",
    breda: "clear and punchy, like announcing a deal",
    win: "smug, as if the story is over",
    twist: "sudden stop on 'Tapi tunggu', then quick, a playful punch on 'tamat'",
    flag: "amused and surprised",
    banda: "quiet, serious and respectful, slower",
    today: "thoughtful contrast",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  run: [129.684, -4.557] as LonLat,
  manhattan: [-73.97, 40.78] as LonLat,
  ceylon: [80.7, 7.9] as LonLat,
  grenada: [-61.68, 12.12] as LonLat,
};

export const NUM = { runKm: 3, priceMultiple: 300, manhattanPeople: 1694251, runPeople: 1572 };

export const SOURCES = [
  { fact: "Run: panjang 3 km, lebar 1 km; koordinat 4°33′26″S 129°41′02″E; penduduk 1.572 (2022)", source: "Wikipedia, 'Run (island)' (diakses 2026-11-05)" },
  { fact: "Banda satu-satunya sumber pala dunia sampai pertengahan abad ke-19", source: "Wikipedia, 'Banda Islands' (diakses 2026-11-05)" },
  { fact: "Rempah dijual 300 kali harga beli di Banda", source: "Wikipedia, 'Governorate of the Banda Islands' (diakses 2026-11-05)" },
  { fact: "Inggris di Run sejak 25 Desember 1616 (Courthope)", source: "Wikipedia, 'Run (island)'" },
  { fact: "Inggris mengambil New Amsterdam 1664; Perjanjian Breda 1667: masing-masing mempertahankan yang dikuasai, Run dilepas ke Belanda", source: "Britannica, 'Treaty of Breda'; Wikipedia, 'Run (island)'; katalog Sotheby's 2016" },
  { fact: "Pohon pala dipindah ke Ceylon, Grenada, dll. 1817; dominasi Belanda menurun", source: "Wikipedia, 'Run (island)'" },
  { fact: "Bendera Grenada memuat gambar pala", source: "Wikipedia, 'Flag of Grenada'" },
  { fact: "Penduduk Banda sebelum 1621: 13.000–15.000; sekitar 1.000 orang Banda tersisa", source: "Wikipedia, 'Banda Islands'" },
  { fact: "Manhattan 1.694.251 jiwa (2020)", source: "Wikipedia, 'Manhattan'" },
];
