// EPISODE 10 (science, TIMELY): "Hujan meteor Leonid: 71 km per detik!" (timely slot, peak night 17-18 Nov 2026)
// Every fact: SOURCES and episodes/Ep010.md. Numbers computed in scripts/facts-ep010.mjs -> data/ep010-facts.json.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

// 12 Nov 2026 rewrite for the new rules (owner: 40-60 s, about 100-120 words, unhurried, never sped up past 1.05x).
// Keeps the third rewrite's safety-friendly wording (no city-speed lines spoken, no impact/explosion words).
// Cut from the spoken script: the 1966 storm and the 2031 return (both still sourced; usable on screen).
export const SEGMENTS = [
  { id: "hook", say: "Tujuh belas November nanti, langit kita hujan bintang jatuh!" },
  { id: "name", say: "Namanya hujan meteor Leonid, dari arah rasi Leo." },
  { id: "comet", say: "Asalnya debu komet Tempel-Tuttle, yang mengitari Matahari tiga puluh tiga tahun sekali." },
  { id: "grain", say: "Butirannya kecil, kebanyakan sebesar pasir sampai kacang polong." },
  { id: "tebak", say: "Tapi lajunya luar biasa. Tebak dulu di komentar: berapa kilometer per detik?" },
  { id: "reveal", say: "Sekitar tujuh puluh satu kilometer per detik! Lebih dari dua ratus kali kecepatan suara." },
  { id: "burn", say: "Debunya langsung bersinar, jadi garis cahaya." },
  { id: "storm", say: "Tahun seribu delapan ratus tiga puluh tiga, diperkirakan seratus lima puluh ribu per jam!" },
  { id: "now", say: "Tahun ini sekitar sepuluh sampai lima belas per jam, di langit gelap." },
  { id: "tips", say: "Lihat lewat tengah malam sampai subuh. Cukup pakai mata." },
  { id: "question", say: "Kamu nonton dari kota mana? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep010: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "warm and friendly, like sharing good news, a lift on 'bintang jatuh'",
    name: "light and clear, explaining to a friend; say 'Leonid' as LEH-o-nid",
    comet: "calm storytelling, clear on 'tiga puluh tiga tahun'; say 'Tempel-Tuttle' as TEM-pel TAT-tel",
    grain: "amused, a little surprised at how small",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a big surprised reveal, punch on the number, then clear on 'dua ratus kali'",
    burn: "calm and clear, a bit of wonder",
    storm: "a gentle turn, then amazement on the number",
    now: "honest and friendly, a small shrug",
    tips: "helpful and warm, like a friend giving a tip",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  jakarta: [106.8272, -6.1754] as LonLat,
  surabaya: [112.7378, -7.2458] as LonLat,
};

export const NUM = { peakDay: 17, speedKmS: 71, jkSbKm: 663, jkSbSec: 9, sabangMeraukeSec: 74, cometKm: 3.6, orbitYears: 33, storm1833: 150000, storm1966PerSec: 70, rateLo: 10, rateHi: 15, nextReturn: 2031 };

export const SOURCES = [
  { fact: "Puncak Leonid 2026: malam 17 Nov s/d dini hari 18 Nov; hingga 15 meteor/jam (TIMELY)", source: "detikINET, 'Fenomena Astronomi November 2026: Hujan Meteor hingga Supermoon', terbit Senin 2 Nov 2026 05:45 WIB" },
  { fact: "Puncak 0 UTC 18 Nov 2026 (AMS); terbaik tengah malam s/d subuh; 10-15 per jam di langit gelap; badai 1833 ~150.000/jam; 1966 hingga 70/detik; tahun ini tidak diprediksi badai; komet kembali awal 2031", source: "EarthSky, 'Everything you need to know: Leonid meteor shower' (posted 13 Jan 2026)" },
  { fact: "Asal komet 55P/Tempel-Tuttle; orbit 33 tahun; inti ~3,6 km; radian di rasi Leo; kecepatan 71 km/s; aktif 6-30 Nov 2026", source: "NASA Science, 'Leonids' (updated 13 Aug 2026)" },
  { fact: "Kecepatan ~71 km/s; komet 55P/Tempel-Tuttle (TIMELY)", source: "Akurat.co, 'Hujan Meteor Leonid 2026 Mencapai Puncak November', 6 Nov 2026 (mengutip Space.com)" },
  { fact: "Butiran debu kebanyakan sebesar pasir sampai kacang polong; terbakar di atmosfer jadi garis cahaya", source: "NASA Science, 'Meteors & Meteorites: Facts'" },
  { fact: "Lebih dari 200x kecepatan suara (71 / 0,343 km/s = 207x). ON SCREEN ONLY: Jakarta-Surabaya 663 km -> 9,3 detik; Sabang-Merauke 5.240 km -> 73,8 detik (pada 71 km/s)", source: "Dihitung: scripts/facts-ep010.mjs (haversine, R = 6371,0088 km; Monas dan Tugu Pahlawan); Sabang-Merauke dari data/ep001-facts.json" },
];
