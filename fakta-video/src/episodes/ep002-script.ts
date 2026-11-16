// EPISODE 2: "Garis pantai Indonesia bisa melilit Bumi 2,5 kali?" (FAKTA_BANK #1)
// Single source of truth for the script and the facts. Numbers: data/ep002-facts.json (scripts/facts-ep002-003.mjs).
// Every fact has an entry in SOURCES and in episodes/Ep002.md.

import facts from "../../data/ep002-facts.json" with { type: "json" };
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Garis pantai Indonesia bisa melilit Bumi hampir dua setengah kali? Kita buktikan." },
  { id: "equator", say: "Keliling Bumi di garis khatulistiwa: empat puluh ribu tujuh puluh lima kilometer." },
  { id: "big", say: "Garis pantai Indonesia, menurut Badan Informasi Geospasial: sembilan puluh sembilan ribu sembilan puluh tiga kilometer." },
  { id: "wrap", say: "Kita lilitkan. Satu putaran. Dua putaran. Masih sisa hampir setengah lagi!" },
  { id: "local", say: "Itu hampir sembilan belas kali Sabang sampai Merauke. Jalan kaki nonstop, siang malam, butuh lebih dari dua tahun." },
  { id: "cia", say: "Tapi tunggu. Buku fakta CIA bilang cuma lima puluh empat ribu tujuh ratus enam belas kilometer. Hampir setengahnya!" },
  { id: "paradox", say: "Siapa yang salah? Dua-duanya bisa benar. Namanya paradoks garis pantai." },
  { id: "ruler", say: "Makin pendek penggarisnya, makin banyak lekukan yang ikut terukur." },
  { id: "sulawesi", say: "Kita ukur Sulawesi di peta yang sama. Penggaris dua ratus kilometer: sekitar dua ribu sembilan ratus. Penggaris dua puluh lima kilometer: hampir empat ribu tiga ratus!" },
  { id: "bignew", say: "Makanya angka BIG yang lebih baru malah seratus delapan ribu kilometer. Hampir dua koma tujuh kali keliling Bumi." },
  { id: "rank", say: "Pakai ukuran mana pun, Indonesia selalu masuk lima besar garis pantai terpanjang di dunia." },
  { id: "question", say: "Pantai favoritmu di mana? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep002: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and a bit teasing, voice rising on the question, then a confident challenge",
    equator: "clear and matter-of-fact, stress the number",
    big: "building up, slower on the big number, amazed",
    wrap: "playful and counting, getting more excited with each lap, laughing a little at the end",
    local: "friendly and vivid, painting a picture",
    cia: "sudden stop on 'Tapi tunggu', then surprised and a bit indignant",
    paradox: "puzzled question, then a smug reveal of the name",
    ruler: "explaining simply to a friend, quick",
    sulawesi: "like a live experiment: first number calm, second number excited",
    bignew: "triumphant, a big reveal",
    rank: "proud and warm",
    question: "friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const NUM = {
  equatorKm: facts.equatorKm, // 40075
  big2013: facts.coast.big2013, // 99093
  bigNew: facts.coast.bigNew, // 108000
  cia: facts.coast.cia, // 54716
  wri: facts.coast.wri, // 95181
  lapsBig: facts.laps.big2013, // 2.473
  lapsBigNew: facts.laps.bigNew, // 2.695
  timesSabangMerauke: facts.timesSabangMerauke, // 18.9
  walkYears: facts.walk.years, // 2.26
  sulawesi200: facts.sulawesi.rulers.find((r) => r.ruler === 200)!,
  sulawesi25: facts.sulawesi.rulers.find((r) => r.ruler === 25)!,
};

export const SOURCES = [
  { fact: "Keliling khatulistiwa 40.075 km", source: "Dihitung: 2π × 6.378,137 km (jari-jari khatulistiwa WGS84)" },
  { fact: "Garis pantai Indonesia 99.093 km (BIG, 2013)", source: "Badan Informasi Geospasial 2013, dikutip di Jurnal Geodesi Undip (ejournal3.undip.ac.id/index.php/geodesi/article/viewFile/22467/20602) dan repository.upnjatim.ac.id/28941" },
  { fact: "Angka BIG yang lebih baru: 108.000 km", source: "BIG, e-book 'Jelajah Pantai Indonesia' (big.go.id/uploads/ebook/EBookGeospasial/26/FAIsi_JelajahPantaiIndonesia.pdf); juga dikutip sebagai BIG 2018 di jurnal Geomatika (jurnal.big.go.id)" },
  { fact: "99.093 / 40.075 = 2,47 putaran; 108.000 / 40.075 = 2,69", source: "Dihitung (scripts/facts-ep002-003.mjs)" },
  { fact: "≈ 18,9 × Sabang–Merauke (5.240 km)", source: "Dihitung; Sabang–Merauke dari Ep001" },
  { fact: "Jalan kaki 5 km/jam nonstop: 19.819 jam = 2,26 tahun", source: "Dihitung (asumsi kecepatan jalan 5 km/jam)" },
  { fact: "CIA World Factbook: 54.716 km (Indonesia #3 setelah Kanada 202.080 dan Norwegia 83.281)", source: "Wikipedia, 'List of countries and dependencies by length of coastline' (kolom CIA; diakses 2026-10-31). Factbook ditutup Feb 2026" },
  { fact: "WRI (World Vector Shoreline 1:250.000): 95.181 km, Indonesia #4", source: "Wikipedia, 'List of countries and dependencies by length of coastline' (kolom WRI; diakses 2026-10-31)" },
  { fact: "Paradoks garis pantai (Richardson; Mandelbrot 1967, Science 156:636)", source: "Wikipedia, 'Coastline paradox' (diakses 2026-10-31)" },
  { fact: "Sulawesi: penggaris 200 km → 2.859 km; 25 km → 4.276 km", source: "Dihitung dengan metode jangka (divider) pada Natural Earth 1:50m (scripts/facts-ep002-003.mjs)" },
];
