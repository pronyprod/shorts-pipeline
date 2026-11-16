// EPISODE 1: "Indonesia ternyata lebih lebar dari Amerika Serikat?"
// This file is the single source of truth for the script and the facts.
// The voice (scripts/make-voice.mts), the captions and the video all read it.
// Every fact has an entry in SOURCES; every number in the script points to one.

import facts from "../../data/ep001-facts.json" with { type: "json" };
import type { LonLat } from "../lib/geo";

export const EP = {
  id: "ep001",
  title: "Indonesia ternyata lebih lebar dari Amerika Serikat?",
  voice: "id-ID-ArdiNeural", // placeholder until the owner records his own voice
  rate: "+18%",
};

// One entry per voice line. `say` is spoken (numbers written out as words so TTS reads them right).
// `show` is the caption text (numbers as words too, like the format; the graphics show digits).
export const SEGMENTS = [
  { id: "hook", say: "Indonesia lebih lebar dari Amerika Serikat? Kedengarannya mustahil. Tapi ayo kita ukur sendiri." },
  { id: "sabang", say: "Dari Sabang sampai Merauke, garis lurusnya lima ribu dua ratus empat puluh kilometer." },
  { id: "extremes", say: "Dari titik paling ujung, Pulau Benggala sampai Muara Torasi, lima ribu tiga ratus enam puluh enam." },
  { id: "lift", say: "Sekarang kita angkat Indonesia. Ukurannya asli, proyeksinya sama, nggak ada trik. Kita geser ke Amerika." },
  { id: "usWidth", say: "Amerika daratan, dari Cape Alava sampai West Quoddy Head: empat ribu tiga ratus tiga puluh empat kilometer." },
  { id: "overhang", say: "Indonesia kelebihan seribu kilometer! Sabang nyemplung di Samudra Pasifik, Merauke di Samudra Atlantik." },
  { id: "diagonal", say: "Bahkan garis terpanjang di dalam Amerika, dari Florida ke Washington, cuma empat ribu lima ratus sembilan. Tetap kalah." },
  { id: "area", say: "Tapi tunggu. Lebar belum tentu luas. Amerika daratan lebih dari empat kali luas Indonesia. Karena bentangan kita kebanyakan laut." },
  { id: "europe", say: "Sekarang geser ke Eropa. Sabang mendarat di Samudra Atlantik, sebelah barat Irlandia. Merauke? Masuk Laut Kaspia." },
  { id: "timezones", say: "Satu lagi. Amerika daratan punya empat zona waktu. Indonesia yang lebih lebar, cuma tiga." },
  { id: "close", say: "Jadi dari Sabang sampai Merauke itu bukan cuma lagu. Amerika pun nggak muat." },
  { id: "question", say: "Kamu tinggal di zona mana? WIB, WITA, atau WIT? Tulis di komentar!" },
] as const;

export type SegmentId = (typeof SEGMENTS)[number]["id"];

const P = facts.points as Record<string, { name: string; coord: number[]; source: string }>;
export const PT = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, v.coord as LonLat])) as Record<
  "sabang" | "merauke" | "idWest" | "idEast" | "usWest" | "usEast",
  LonLat
>;

export const NUM = {
  sabangMerauke: facts.sabangMerauke.greatCircleKm, // 5240
  idExtremes: facts.indonesiaExtremes.greatCircleKm, // 5366
  usWidth: facts.usContiguous.greatCircleKm, // 4334
  overhang: facts.indonesiaExtremes.greatCircleKm - facts.usContiguous.greatCircleKm, // 1032
  usDiagonal: 4509,
  idArea: facts.areas.indonesiaKm2,
  usArea: facts.areas.usContiguousKm2,
  areaRatio: facts.areas.ratio, // 4.24
};

// Where the moved Indonesia is centred (chosen with scripts/probe-placement.mts).
export const PLACE = {
  usTarget: [-96.5, 39.5] as LonLat, // west end lands in the Pacific off Oregon, east end in the Atlantic
  euTarget: [22, 50] as LonLat, // Sabang lands west of Ireland, Merauke in the Caspian Sea
};

// Countries the moved Indonesia covers over Europe: a subset of the 32 listed by
// `node scripts/probe-placement.mts --covers 22,50` (each has 80+ overlapping vertices), west to east.
export const EU_COVERED = ["gb", "fr", "de", "it", "cz", "pl", "hr", "rs", "ro", "by", "ua", "ru"];

export const SOURCES = [
  { fact: "Sabang–Merauke 5.240 km (garis lurus / great-circle)", source: `Dihitung (haversine, R = 6371,0088 km) dari: ${P.sabang.source}; ${P.merauke.source}. Cek WGS84: ${facts.sabangMerauke.wgs84Km} km.` },
  { fact: "Titik paling barat & timur Indonesia: Pulau Benggala, Muara Torasi; jarak 5.366 km", source: `Dihitung dari: ${P.idWest.source}; ${P.idEast.source}. Cek WGS84: ${facts.indonesiaExtremes.wgs84Km} km.` },
  { fact: "Lebar AS daratan Cape Alava–West Quoddy Head 4.334 km", source: `Dihitung dari: ${P.usWest.source}; ${P.usEast.source}. Cek WGS84: ${facts.usContiguous.wgs84Km} km.` },
  { fact: "Indonesia lebih lebar ±1.032 km (5.366 − 4.334)", source: "Selisih dua angka di atas." },
  { fact: "Posisi ujung Indonesia saat digeser ke AS (Pasifik & Atlantik) dan Eropa (barat Irlandia & Laut Kaspia)", source: "Dihitung: rotasi bola (ukuran asli) + Natural Earth 1:50m admin-0 countries v5.2.0-pre; scripts/probe-placement.mts" },
  { fact: "Garis terpanjang di dalam AS daratan 4.509 km (2.802 mil), Florida–Washington", source: "Wikipedia, 'Contiguous United States' (diakses 2026-10-29)" },
  { fact: "Luas Indonesia 1.904.569 km²", source: facts.areas.indonesiaSource },
  { fact: "Luas AS daratan (48 negara bagian) 8.080.464 km²; rasio 4,24×", source: facts.areas.usContiguousSource },
  { fact: "Bentangan Indonesia kebanyakan laut: wilayah darat + laut ±5 juta km², daratan 1,9 juta km²", source: "Wikipedia, 'Geography of Indonesia' (diakses 2026-10-29)" },
  { fact: "Cek silang luas dari data peta: Indonesia ≈1,87 juta km², AS-48 ≈7,93 juta km²", source: "Dihitung dari Natural Earth 1:50m (scripts/build-map-data.mjs)" },
  { fact: "AS daratan punya 4 zona waktu (Eastern, Central, Mountain, Pacific)", source: "Wikipedia, 'Time in the United States' (diakses 2026-10-29)" },
  { fact: "Indonesia punya 3 zona waktu: WIB (UTC+7), WITA (UTC+8), WIT (UTC+9)", source: "Wikipedia, 'Time in Indonesia', mengutip Keputusan Presiden No. 41 Tahun 1987 (diakses 2026-10-29)" },
  { fact: "'Dari Sabang sampai Merauke' sebagai ungkapan bentang Indonesia", source: "Wikipedia, 'Merauke' (diakses 2026-10-29)" },
];

// V2 (Fakta_Ep001V2): the closing question is shortened so it stays on screen ~2-3 s.
// The choices WIB / WITA / WIT are shown as pills instead of being spoken.
export const SEGMENTS_V2 = [
  ...SEGMENTS.slice(0, -1),
  { id: "question", say: "Kamu tinggal di zona mana? Tulis di komentar!" },
] as const;

// Voice/caption versions: `--ep=<key>` in scripts/make-voice.mts and scripts/make-captions.mts
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = {
  ep001: SEGMENTS,
  ep001v2: SEGMENTS_V2,
  ep001v3: SEGMENTS_V2,
};

// V3 (Fakta_Ep001V3): same lines as V2, voiced by Gemini TTS (Puck), music from the rotation.
// One direction per line (English: the model follows directions better; the spoken text stays Indonesian).
export const VOICE_V3 = {
  voice: "Puck",
  model: "gemini-3.1-flash-tts-preview", // gemini-3.8-flash-tts is kept for the other channel
  persona:
    "Speak in natural, casual Bahasa Indonesia with a Jakarta accent, like an energetic Indonesian educational TikTok creator " +
    "talking to a friend: FAST (about 160 words per minute), clear, smiling, lively changes of pitch and rhythm, punchy on the numbers, " +
    "never like a news reader. Read the lines in order with a clear one-second pause between lines and no long pauses inside a line. " +
    "Read only the Indonesian lines; never read the directions in parentheses.",
  styles: {
    hook: "curious and a bit teasing, voice rising on the question, then playful disbelief, then a confident invitation",
    sabang: "building up, stress the number",
    extremes: "excited and a little faster, land hard on the final number",
    lift: "playful and confident, like a magician showing there is no trick",
    usWidth: "matter-of-fact and quick, stress the number",
    overhang: "triumphant on 'seribu kilometer', then fun and cheeky about where Sabang and Merauke land",
    diagonal: "challenging, building, then a smug punch on 'Tetap kalah'",
    area: "sudden stop on 'Tapi tunggu', then honest and thoughtful, a little slower, ending warm",
    europe: "energetic again, playful; a short teasing question on 'Merauke?' before the answer",
    timezones: "one more surprise: bright and quick, stress 'empat' and 'tiga'",
    close: "proud and warm, smiling",
    question: "friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};
