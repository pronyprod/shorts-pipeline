// EPISODE 8 (science): "Dua kali setahun, bayanganmu bisa hilang" (FAKTA_BANK V7, hari tanpa bayangan)
// Every fact: SOURCES and episodes/Ep008.md. Computed numbers: scripts/facts-ep008.mjs -> data/ep008-facts.json

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Dua kali setahun, bayanganmu bisa hilang. Serius!" },
  { id: "sun", say: "Tengah hari, matahari tepat di atas kepala. Bayanganmu jatuh persis di bawah kaki." },
  { id: "pontianak", say: "Yang paling terkenal Pontianak, kota di garis khatulistiwa: sekitar dua puluh satu Maret dan dua puluh tiga September." },
  { id: "wait", say: "Tapi tunggu, ini bukan cuma di Pontianak." },
  { id: "dates", say: "Merauke kebagian akhir Februari, Jakarta awal Maret, Sabang awal April." },
  { id: "all", say: "Seluruh Indonesia kebagian, karena kita ada di antara dua garis balik." },
  { id: "tebak", say: "Tebak dulu di komentar: berapa persen permukaan Bumi yang bisa ngalamin ini?" },
  { id: "reveal", say: "Cuma empat puluh persen!" },
  { id: "never", say: "Tokyo, Paris, New York? Nol kali, seumur hidup." },
  { id: "moment", say: "Tapi ini bukan seharian. Cuma beberapa menit, pas tengah hari." },
  { id: "sabang", say: "Dan nggak selalu jam dua belas. Di Sabang, sekitar jam dua belas empat puluh." },
  { id: "erat", say: "Satu lagi. Sekitar dua ribu dua ratus tahun lalu, Eratosthenes di Mesir pakai bayangan buat ngukur Bumi." },
  { id: "erat2", say: "Di satu kota, matahari tepat di atas. Di kota lain, ada bayangan. Dari selisih itu, ketemu ukuran Bumi." },
  { id: "local", say: "Coba versi kita. Pas Pontianak tanpa bayangan, tongkat satu meter di Tegal bayangannya dua belas senti." },
  { id: "result", say: "Jaraknya tujuh ratus enam puluh kilometer. Hitung, dan keliling Bumi ketemu: empat puluh ribu kilometer!" },
  { id: "payoff", say: "Cuma modal tongkat dan bayangan!" },
  { id: "question", say: "Kamu dari kota mana? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep008: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and friendly, a playful stress on 'Serius'",
    sun: "clear, light explaining to a friend",
    pontianak: "brisk and warm storytelling",
    wait: "teasing, leaning in",
    dates: "quick and lively, like a fun list",
    all: "proud and warm",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "big surprised reveal, short and punchy",
    never: "amused, a playful stress on 'Nol kali'",
    moment: "friendly correction, light",
    sabang: "amused surprise",
    erat: "growing excitement, storytelling",
    erat2: "clear and quick, three short steps",
    local: "inviting, like a fun experiment with a friend",
    result: "building up, then amazed on the last number",
    payoff: "warm and impressed",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  pontianak: [109.3333, -0.0263] as LonLat,
  jakarta: [106.8456, -6.2088] as LonLat,
  sabang: [95.3214, 5.8933] as LonLat,
  merauke: [140.4, -8.4932] as LonLat,
  tegal: [109.1403, -6.8694] as LonLat,
  tokyo: [139.69, 35.68] as LonLat,
  paris: [2.35, 48.86] as LonLat,
  syene: [32.9, 24.09] as LonLat,
  alexandria: [29.92, 31.2] as LonLat,
};

export const NUM = {
  tilt: 23.44,
  sharePct: 40, // 39.8 computed: sin(23.44 deg)
  sabangClock: "12.40", // 12:41 in April, 12:36 in September (computed)
  yearsAgo: 2200,
  angleOld: "7,2",
  stickCm: 12,
  distanceKm: 760, // 761.2 computed
  angleLocal: "6,84",
  factor: "52,6", // 360 / 6.84
  earthKm: 40000, // 40,046 computed with haversine
};

export const SOURCES = [
  { fact: "Kulminasi utama dua kali setahun; bayangan tepat di bawah benda tengah hari", source: "BMKG, 'Hari Tanpa Bayangan di Indonesia: Kulminasi Utama I 2026' dan 'Kulminasi Utama 2 Tahun 2026', bmkg.go.id" },
  { fact: "Pontianak ~21 Maret dan ~23 September (20 Mar + 23 Sep 2026; 21 Mar + 23 Sep 2027)", source: "BMKG 2026; dihitung sendiri untuk 2027 (scripts/facts-ep008.mjs, rumus NOAA)" },
  { fact: "Merauke akhir Februari (27 Feb), Jakarta awal Maret (5 Mar), Sabang awal April (5 Apr)", source: "BMKG 2026 lewat detikNews (Merauke) dan BMKG (Sabang); Jakarta dihitung sendiri; rumus cocok dengan BMKG" },
  { fact: "Hanya daerah di antara garis balik yang bisa mengalami ini; seluruh Indonesia di antaranya", source: "Wikipedia 'Subsolar point' dan 'Lahaina Noon'; AccuWeather 'Zero Shadow Day'; lintang Indonesia dari Natural Earth" },
  { fact: "40% permukaan Bumi", source: "Dihitung sendiri: sin(23,44 derajat) = 39,8%" },
  { fact: "Tokyo, Paris, New York tidak pernah", source: "Dihitung sendiri: lintang di atas 23,44; sudut bayangan terkecil 12,2 / 25,4 / 17,3 derajat" },
  { fact: "Hanya beberapa menit", source: "Dihitung sendiri: matahari dalam 1 derajat dari zenit selama sekitar 8 menit (15 derajat per jam)" },
  { fact: "Sabang sekitar 12.40 WIB", source: "Dihitung sendiri: 12.41 WIB April, 12.36 WIB September" },
  { fact: "Eratosthenes, sekitar 240 SM, Syene dan Alexandria, 7,2 derajat = 1/50 lingkaran", source: "Bucknell University Astronomy 101 'Eratosthenes and the Size of the Earth'; Windows to the Universe 'Eratosthenes' Calculation of Earth's Circumference'" },
  { fact: "Tongkat 1 m di Tegal: bayangan 12 cm; Pontianak-Tegal 761 km; hasil 40.046 km", source: "Dihitung sendiri: selisih lintang 6,84 derajat, haversine (scripts/facts-ep008.mjs)" },
];
