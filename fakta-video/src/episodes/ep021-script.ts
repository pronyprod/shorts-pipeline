// EPISODE 21 (history, V12): pelaut Makassar dan teripang ke Arnhem Land (Marege'), sebelum Australia jadi negara.
// Not a timely slot (21), not a series number. Every fact: SOURCES and episodes/Ep021.md.

import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Pelaut Makassar sudah berlayar ke Australia, lebih dari seratus tahun sebelum Australia jadi negara!" },
  { id: "why", say: "Mereka mencari teripang, hewan laut yang laku dijual ke Tiongkok. Perahu mereka berlayar ikut angin muson." },
  { id: "dist", say: "Jaraknya sekitar dua ribu kilometer, dari Makassar ke Arnhem Land. Itu tiga kali Jakarta ke Surabaya!" },
  { id: "fleet", say: "Tapi tunggu... tahun seribu delapan ratus tiga, seorang penjelajah Inggris bertemu sekitar enam puluh perahu mereka sekaligus!" },
  { id: "words", say: "Mereka berdagang dengan orang Yolngu, lalu pulang. Sampai sekarang, kata rupiah masih dipakai di sana untuk uang." },
  { id: "tebak", say: "Tebak dulu di komentar: tahun berapa perahu terakhir datang?" },
  { id: "reveal", say: "Seribu sembilan ratus tujuh!" },
  { id: "question", say: "Kamu keturunan pelaut atau petani? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep021: SEGMENTS };

export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["lebih dari seratus tahun", "Australia"],
  why: ["teripang", "angin muson"],
  dist: ["dua ribu kilometer", "tiga kali"],
  fleet: ["seribu delapan ratus tiga", "enam puluh perahu"],
  words: ["kata rupiah"],
  tebak: ["tahun berapa"],
  reveal: ["Seribu sembilan ratus tujuh"],
  question: ["pelaut atau petani"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and intriguing, light punch on 'lebih dari seratus tahun'",
    why: "explaining, friendly and clear, small lift on 'teripang'",
    dist: "clear and steady, a small punch on 'tiga kali'",
    fleet: "a small pause after 'Tapi tunggu', then amazed, punch on 'enam puluh perahu'",
    words: "warm and storytelling, a gentle lift on 'rupiah'",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a clear happy reveal, punch on 'Seribu sembilan ratus tujuh'",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const NUM = { km: 2000, ratio: 3, year: 1803, boats: 60, last: 1907 };

export const SOURCES = [
  { fact: "Perahu Makassar mencari teripang di pantai Arnhem Land (Marege') sejak sekitar 1700-an sampai 1907; teripang dijual ke Tiongkok", source: "National Museum of Australia, Defining Moments 'Trade with the Makasar'; Macknight (ANU Press, Macassan History and Heritage)" },
  { fact: "Pelayaran mengikuti angin muson barat laut (berangkat Nov-Des) dan pulang dengan angin tenggara", source: "NMA 'Trade with the Makasar'; ANU Press ch.1" },
  { fact: "Makassar ke Arnhem Land: 1.929 km (Pulau Elcho) sampai 2.060 km (Nhulunbuy) garis lurus; Jakarta-Surabaya 662,6 km; rasio 2,9-3,1", source: "computed (haversine R=6371,0088 km)" },
  { fact: "1803: Matthew Flinders bertemu armada sekitar 60 perahu Makassar (kapten Pobassoo) di lepas Arnhem Land", source: "Flinders, A Voyage to Terra Australis (1814); Wikipedia 'Makassan contact with Australia'; Macknight" },
  { fact: "Orang Makassar tidak menetap; mereka berdagang dengan orang Yolngu; kata 'rrupia' (uang) masih dipakai dalam bahasa Yolngu", source: "NMA 'Trade with the Makasar'; Museums Victoria (rupiah)" },
  { fact: "Australia menjadi negara (federasi) 1901 vs. awal perdagangan sekitar 1720 = lebih dari 100 tahun", source: "Macknight (start c.1720, earliest recorded voyage 1751); NMA" },
  { fact: "Perahu Makassar terakhir mengunjungi Arnhem Land tahun 1907 (setelah 1901 pemerintah Australia melarang)", source: "NMA 'Trade with the Makasar'" },
];
