// EPISODE 14 (language): "700+ bahasa: Indonesia nomor berapa di dunia?" (FAKTA_BANK V5)
// Every fact: SOURCES and episodes/Ep014.md.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

// 40-60 s, about 90 words, clear and unhurried (owner, 12 Nov 2026).
export const SEGMENTS = [
  { id: "hook", say: "Lebih dari tujuh ratus bahasa daerah, cuma di satu negara: Indonesia!" },
  { id: "name", say: "Dari Sabang sampai Merauke, ada ratusan cara bilang halo." },
  { id: "count", say: "Badan Bahasa mencatat tujuh ratus delapan belas bahasa." },
  { id: "tebak", say: "Tebak dulu di komentar: Indonesia nomor berapa di dunia?" },
  { id: "reveal", say: "Nomor dua! Cuma kalah dari Papua Nugini, dengan delapan ratus empat puluh bahasa." },
  { id: "third", say: "Nomor tiga, Nigeria, cuma lima ratus dua puluh tujuh." },
  { id: "papua", say: "Tapi tunggu... satu daerah saja, Papua, menyimpan empat ratus dua puluh delapan bahasa." },
  { id: "share", say: "Hampir enam puluh persen dari semua bahasa daerah kita!" },
  { id: "question", say: "Bahasa daerahmu apa? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep014: SEGMENTS };

// captions v2: the phrases a person would stress, copied exactly from each segment's text
export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["tujuh ratus bahasa"],
  name: ["Sabang sampai Merauke"],
  count: ["tujuh ratus delapan belas"],
  tebak: ["nomor berapa"],
  reveal: ["Nomor dua", "delapan ratus empat puluh"],
  third: ["lima ratus dua puluh tujuh"],
  papua: ["Papua", "empat ratus dua puluh delapan"],
  share: ["enam puluh persen"],
  question: ["Bahasa daerahmu"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and impressed, light punch on 'tujuh ratus bahasa'",
    name: "warm and playful, clear on 'Sabang' and 'Merauke'",
    count: "clear and steady, a small impressed lift on the number",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a big happy reveal on 'Nomor dua!', then clear and steady on the number",
    third: "light and matter-of-fact",
    papua: "a small dramatic pause after 'Tapi tunggu', then gentle surprise on the number",
    share: "amazed, punch on 'enam puluh persen'",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  sabang: [95.32, 5.89] as LonLat, // Sabang, Weh Island (Wikipedia: 5°53′N 95°19′E)
  merauke: [140.4, -8.49] as LonLat, // Merauke (Wikipedia: 8°29′S 140°24′E)
  papua: [138.0, -4.3] as LonLat, // label position, Papua (island, Indonesian side), approx.
};

export const NUM = { total: 718, png: 840, idn: 715, nga: 527, papua: 428, sharePct: 59.6 };

export const SOURCES = [
  { fact: "Badan Bahasa (Kemendikbud) memetakan 718 bahasa daerah (sampai Oktober 2019)", source: "Antara, 'Kemendikbud petakan 718 bahasa daerah'; Badan Bahasa, petabahasa.kemdikbud.go.id" },
  { fact: "Papua Nugini punya 840 bahasa hidup, Indonesia 715 (nomor dua), Nigeria 527 (nomor tiga)", source: "Ethnologue FAQ, 'Which countries have the most languages' (ethnologue.com/faq/countries-most-languages)" },
  { fact: "Papua (pulau, sisi Indonesia) tercatat 428 bahasa ibu, terbanyak di Indonesia", source: "Data Badan Bahasa via GoodStats, 'Daerah dengan jumlah bahasa ibu terbanyak di Indonesia'; sumber lain: 'sekitar 400-an' (CNN Indonesia, 24 Feb 2020)" },
  { fact: "428 / 718 = 59,6% = 'hampir enam puluh persen'", source: "Dihitung" },
];
