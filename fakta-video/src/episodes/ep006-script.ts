// EPISODE 6 (animals): "Bali dan Lombok cuma 35 km, tapi hewannya beda dunia" (FAKTA_BANK #3, the Wallace Line)
// Every fact: SOURCES and episodes/Ep006.md.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Bali dan Lombok cuma terpisah sekitar tiga puluh lima kilometer. Tapi hewannya beda dunia!" },
  { id: "ship", say: "Tahun seribu delapan ratus lima puluh enam, naturalis Alfred Wallace nggak dapat kapal langsung ke Makassar. Terpaksa lewat Bali." },
  { id: "bali", say: "Di Bali ada burung takur dan burung pelatuk." },
  { id: "lombok", say: "Seberang selat, semua itu hilang. Yang muncul malah kakatua!" },
  { id: "bogor", say: "Padahal jaraknya lebih pendek dari Jakarta ke Bogor." },
  { id: "line", say: "Tiga tahun kemudian, Wallace menarik garis di peta. Barat, hewan Asia. Timur, hewan Australia." },
  { id: "animals", say: "Gajah dan orangutan di barat. Kuskus dan kanguru pohon di timur." },
  { id: "tebak", say: "Kenapa bisa? Di zaman es, air laut turun. Tebak dulu di komentar: turun berapa meter?" },
  { id: "reveal", say: "Seratus dua puluh meter!" },
  { id: "land", say: "Sumatra, Jawa, dan Bali nyambung ke daratan Asia. Hewan tinggal jalan kaki sampai Bali." },
  { id: "twist", say: "Tapi tunggu. Selat Lombok dalamnya minimal dua ratus lima puluh meter." },
  { id: "gap", say: "Laut turun seratus dua puluh, selat ini tetap air. Jalan kakinya putus di sini!" },
  { id: "wall", say: "Garis ini bukan tembok, ya. Kelelawar bisa menyeberang, dan Wallace dengar ada sedikit kakatua di Bali barat." },
  { id: "payoff", say: "Tapi hasilnya luar biasa: satu negara, dua dunia hewan." },
  { id: "question", say: "Hewan khas daerahmu apa? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep006: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and friendly, a surprised lift at the end",
    ship: "light storytelling, amused at the bad luck",
    bali: "calm and simple",
    lombok: "growing surprise, big and delighted on 'kakatua'",
    bogor: "amazed aside to a friend",
    line: "clear storytelling, stress 'Asia' and 'Australia'",
    animals: "quick and playful, like a fun list",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "big surprised reveal, short and punchy",
    land: "lively, easy-going",
    twist: "a teasing pause feeling, then stress the number",
    gap: "excited realisation, punchy at the end",
    wall: "friendly correction, relaxed",
    payoff: "warm and proud",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  bali: [115.15, -8.4] as LonLat,
  lombok: [116.3, -8.6] as LonLat,
  strait: [115.75, -8.5] as LonLat,
  makassar: [119.42, -5.14] as LonLat,
  singapore: [103.82, 1.35] as LonLat,
  sumatra: [101.5, -0.5] as LonLat,
  java: [110.4, -7.4] as LonLat,
  asia: [101.5, 13.5] as LonLat,
  borneo: [114, 0.5] as LonLat,
  sulawesi: [121, -2] as LonLat,
  papua: [138, -4] as LonLat,
};

// The Wallace Line, simplified, through the deep channels (Lombok Strait, Makassar Strait, Celebes Sea).
export const LINE: LonLat[] = [[115.75, -10.6], [115.75, -8.45], [116.6, -6], [117.6, -3], [118.9, 0], [119.6, 3], [122, 5.5], [126.5, 6.3]];

export const NUM = { km: 35, jakartaBogorKm: 47, seaDropM: 120, straitMinM: 250 };

export const SOURCES = [
  { fact: "Bali-Lombok sekitar 35 km", source: "Wikipedia, 'Wallace Line' (diakses 2026-11-05); dihitung sendiri ~36 km, ujung timur Bali ke pantai barat Lombok" },
  { fact: "Jakarta-Bogor ~47 km", source: "Dihitung sendiri (haversine, Monas ke pusat Bogor)" },
  { fact: "1856: tak ada kapal langsung ke Makassar, Wallace lewat Bali", source: "Wallace, The Malay Archipelago (1869), bab Bali and Lombock" },
  { fact: "Bali: barbet, pelatuk; Lombok: kakatua; sedikit kakatua di Bali barat", source: "Wallace, The Malay Archipelago (1869), bab Physical Geography" },
  { fact: "Garis ditarik 1859; hewan Asia dan Australia; kelelawar bisa menyeberang", source: "Wikipedia, 'Wallace Line' (diakses 2026-11-05)" },
  { fact: "Gajah Sumatra, orangutan Sumatra/Kalimantan; kuskus Sulawesi/Nugini; kanguru pohon Nugini", source: "Wikipedia, 'Sumatran elephant', 'Orangutan', 'Common spotted cuscus', 'Tree-kangaroo' (diakses 2026-11-05)" },
  { fact: "Zaman es: laut turun sampai ~120 m; Bali, Jawa, Sumatra tersambung ke Asia", source: "Wikipedia, 'Sundaland', 'Wallace Line', 'Lombok Strait' (diakses 2026-11-05)" },
  { fact: "Selat Lombok minimal 250 m", source: "Wikipedia, 'Lombok Strait' (diakses 2026-11-05)" },
];
