// EPISODE 7 (history): "Candi Buddha terbesar di dunia pernah tertutup ratusan tahun" (FAKTA_BANK V2, Borobudur)
// Every fact: SOURCES and episodes/Ep007.md.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Candi Buddha terbesar di dunia pernah tertutup ratusan tahun. Kok bisa?" },
  { id: "build", say: "Borobudur dibangun sekitar seribu dua ratus tahun lalu di Jawa Tengah, dekat Yogyakarta." },
  { id: "cover", say: "Lalu ditinggalkan, dan nggak ada yang tahu kenapa. Abu gunung api dan hutan pelan-pelan menutupnya." },
  { id: "raffles", say: "Tahun seribu delapan ratus empat belas, Raffles, gubernur jenderal Inggris di Jawa, lagi di Semarang. Tujuh puluh lima kilometer dari candi." },
  { id: "locals", say: "Warga cerita: ada monumen besar di tengah hutan. Jadi warga sudah tahu duluan!" },
  { id: "cornelius", say: "Insinyur Cornelius dikirim dengan dua ratus orang. Dua bulan tebang pohon, bakar semak, gali tanah." },
  { id: "notyet", say: "Tapi tunggu. Raffles sendiri nggak pernah ke sana, dan candinya baru terbuka semua tahun seribu delapan ratus tiga puluh lima." },
  { id: "tebak", say: "Tebak dulu di komentar: ada berapa patung Buddha di candi ini?" },
  { id: "reveal", say: "Awalnya, lima ratus empat!" },
  { id: "stupa", say: "Tujuh puluh dua di antaranya duduk di dalam stupa berlubang." },
  { id: "siam", say: "Bahkan tahun seribu delapan ratus sembilan puluh enam, Raja Siam diizinkan bawa pulang delapan gerobak patung dan relief." },
  { id: "million", say: "Lalu bersama UNESCO, lebih dari satu juta batu dibongkar, dibersihkan, dan dipasang lagi." },
  { id: "hidden", say: "Satu lagi. Tahun seribu delapan ratus delapan puluh lima, ditemukan kaki candi tersembunyi, dengan seratus enam puluh panel relief." },
  { id: "still", say: "Kaki itu ditutup lagi. Sekarang cuma pojok tenggara yang kelihatan." },
  { id: "payoff", say: "Jadi sebagian Borobudur masih tertutup sampai hari ini!" },
  { id: "question", say: "Kamu pernah ke Borobudur? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep007: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and friendly, a surprised lift on 'Kok bisa'",
    build: "light storytelling",
    cover: "calm and a little mysterious",
    raffles: "clear storytelling, brisk",
    locals: "amused, a playful stress on 'duluan'",
    cornelius: "quick and lively, like a fun list",
    notyet: "a teasing pause feeling, then amused surprise",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "big surprised reveal, short and punchy",
    stupa: "friendly and light",
    siam: "amazed aside to a friend",
    million: "impressed, lively",
    hidden: "growing surprise, leaning in",
    still: "quiet amazement",
    payoff: "warm and proud",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  borobudur: [110.2038, -7.6079] as LonLat,
  semarang: [110.42, -6.97] as LonLat,
  yogyakarta: [110.3647, -7.7829] as LonLat,
  bangkok: [100.5, 13.75] as LonLat,
};

// Schematic side view of the temple. Proportions from the published sizes: base 123 m, top of the dome 35 m,
// terraces set back 7 m then 2 m. The circular terraces are drawn by eye (no figure printed).
export const TEMPLE_M = { base: 123, height: 35 };

export const NUM = { semarangKm: 75, men: 200, buddhas: 504, stupas: 72, carts: 8, hiddenPanels: 160 };

export const SOURCES = [
  { fact: "Candi Buddha terbesar di dunia", source: "Wikipedia, 'Borobudur' (mengutip UNESCO World Heritage Centre 2024; Guinness World Records, Antara 5 Juli 2012), diakses 2026-11-08" },
  { fact: "Tertutup berabad-abad oleh abu gunung api dan hutan; sebab ditinggalkan tidak diketahui", source: "Wikipedia, 'Borobudur', bagian Abandonment" },
  { fact: "Dibangun sekitar 1.200 tahun lalu, dekat Yogyakarta", source: "Wikipedia, 'Borobudur' (Dumarçay: mulai ~780, tahap kelima ~833; Munoz: selesai 825)" },
  { fact: "1814: Raffles di Semarang diberi tahu warga; gubernur jenderal Inggris di Jawa", source: "Wikipedia, 'Borobudur', bagian Rediscovery" },
  { fact: "Semarang-Borobudur ~75 km", source: "Dihitung sendiri: 74,8 km (haversine, pusat Semarang ke candi)" },
  { fact: "Cornelius, 200 orang, dua bulan; tebang pohon, bakar tanaman, gali tanah", source: "Wikipedia, 'Borobudur', bagian Rediscovery" },
  { fact: "Raffles tidak pernah mengunjungi situs; terbuka semua 1835 (Hartmann)", source: "Wikipedia, 'Borobudur', bagian Rediscovery (Soekmono 1976)" },
  { fact: "Awalnya 504 patung Buddha; 72 di dalam stupa berlubang", source: "Wikipedia, 'Borobudur', lead" },
  { fact: "1896: Raja Chulalongkorn dari Siam diizinkan membawa delapan gerobak patung", source: "Wikipedia, 'Borobudur' (Kempers 1976)" },
  { fact: "Pemugaran UNESCO: lebih dari satu juta batu dibongkar, dibersihkan, dipasang lagi", source: "Wikipedia, 'Borobudur' (PBS); UNESCO: pemugaran besar 1973-1982/83" },
  { fact: "1885: kaki tersembunyi ditemukan; 160 panel; ditutup lagi; hanya sudut tenggara terlihat", source: "Wikipedia, 'Borobudur' (Anom 2005; Soekmono 1976; Santiko 2016)" },
];
