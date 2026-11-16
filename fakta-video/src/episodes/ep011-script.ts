// EPISODE 11 (geography): "Kalimantan: satu pulau, tiga negara" (FAKTA_BANK #5)
// Every fact: SOURCES and episodes/Ep011.md. Areas computed in scripts/facts-ep011.mjs -> data/ep011-facts.json.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

// 40-60 s, about 100 words, clear and unhurried (owner, 12 Nov 2026).
export const SEGMENTS = [
  { id: "hook", say: "Satu pulau, tapi dibagi tiga negara!" },
  { id: "name", say: "Ini Kalimantan. Pulau terbesar ketiga di dunia." },
  { id: "europe", say: "Kita geser ke Eropa, ukurannya asli. Lebih luas dari Prancis!" },
  { id: "three", say: "Di dunia, cuma pulau ini yang dibagi tiga negara: Indonesia, Malaysia, dan Brunei." },
  { id: "tebak", say: "Tebak dulu di komentar: berapa persen yang punya Indonesia?" },
  { id: "reveal", say: "Sekitar tujuh puluh tiga persen! Malaysia kira-kira seperempat." },
  { id: "brunei", say: "Brunei? Kurang dari satu persen. Dan negaranya terbelah dua!" },
  { id: "java", say: "Bagian Indonesia saja, lebih dari empat kali luas Pulau Jawa." },
  { id: "prov", say: "Isinya lima provinsi. Yang paling muda, Kalimantan Utara, lahir tahun dua ribu dua belas." },
  { id: "question", say: "Kamu tinggal di pulau mana? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep011: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "warm and curious, a little lift on 'tiga negara'",
    name: "clear and proud, calm on 'terbesar ketiga'",
    europe: "playful, like moving a puzzle piece, a bright surprise on 'Prancis'",
    three: "calm storytelling, clear on each country name",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a big happy reveal, punch on the number, then relaxed on 'seperempat'",
    brunei: "amused, a small smile, then a gentle surprise on 'terbelah dua'",
    java: "impressed and clear, steady on 'empat kali'",
    prov: "friendly and informative, clear on the year",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

// Borneo centroid (Natural Earth, scripts/facts-ep011.mjs) and metropolitan France centroid
export const PT = {
  borneo: [114.2066, 0.8614] as LonLat,
  france: [2.5729, 46.5056] as LonLat,
  java: [109.9213, -7.3017] as LonLat,
  bsb: [114.9398, 4.8903] as LonLat, // Bandar Seri Begawan (Wikipedia)
  tanjungSelor: [117.3667, 2.85] as LonLat, // Tanjung Selor, capital of Kalimantan Utara (Wikipedia)
};

export const NUM = { rank: 3, idnPct: 73, mysPct: 26, brnPct: 1, javaTimes: 4, provinces: 5, kaltaraYear: 2012, borneoKm2: 743330, borneoOverFrance: 1.37 };

export const SOURCES = [
  { fact: "Borneo/Kalimantan pulau terbesar ke-3 di dunia (setelah Greenland dan Papua/New Guinea); luas ±743.330 km² (Britannica: 748.168 km²)", source: "Britannica, 'The largest islands in the world'; Wikipedia, 'Borneo'" },
  { fact: "Satu-satunya pulau di dunia yang dibagi tiga negara (Indonesia, Malaysia, Brunei)", source: "Wikipedia, 'Borneo'; New World Encyclopedia, 'Borneo'" },
  { fact: "Bagian Indonesia ±73% luas pulau; Malaysia ±26%; Brunei ±1%", source: "Wikipedia, 'Kalimantan' (73%); dihitung ulang dari Natural Earth 1:50m: Indonesia 72,5%, Malaysia 26,7%, Brunei 0,77% (scripts/facts-ep011.mjs)" },
  { fact: "Brunei 5.765 km² (<1% dari 743.330 km² = 0,78%); terbelah dua oleh distrik Limbang (Sarawak, Malaysia); Temburong terpisah", source: "Wikipedia, 'Brunei', 'Temburong District', 'Limbang Division'; Natural Earth: 2 bagian (4.363 + 1.309 km²)" },
  { fact: "Lebih luas dari Prancis metropolitan (543.940 km²; Borneo 1,37x)", source: "INSEE / Wikipedia 'Metropolitan France'; Natural Earth cross-check 545.729 km² (scripts/facts-ep011.mjs)" },
  { fact: "Bagian Indonesia > 4x Pulau Jawa (NE: 531.136 / 126.410 = 4,2x; Wikipedia: 0,73 x 743.330 / 132.644 = 4,1x)", source: "Dihitung: scripts/facts-ep011.mjs; Wikipedia, 'Java'" },
  { fact: "Lima provinsi; Kalimantan Utara dibentuk UU No. 20 Tahun 2012 (ditandatangani 16 Nov 2012)", source: "peraturan.bpk.go.id, UU No. 20 Tahun 2012; Kontan, 'Presiden teken UU Provinsi Kalimantan Utara'; Wikipedia, 'Kalimantan'" },
];
