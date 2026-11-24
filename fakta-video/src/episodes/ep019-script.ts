// EPISODE 19 (geography): "Indonesia punya berapa pulau, dan berapa yang berpenghuni?" (FAKTA_BANK V13)
// Every fact: SOURCES and episodes/Ep019.md.

import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Indonesia punya berapa pulau? Jawabannya ternyata nggak cuma satu!" },
  { id: "survey", say: "Survei tahun dua ribu tujuh sampai dua ribu sepuluh menghitung tiga belas ribu empat ratus enam puluh enam pulau." },
  { id: "law", say: "Tapi tunggu... daftar resmi dari undang-undang tahun seribu sembilan ratus sembilan puluh enam menulis tujuh belas ribu lima ratus delapan!" },
  { id: "why", say: "Salah satu sebabnya: karang dan pulau pasir yang cuma muncul waktu air surut ikut dihitung." },
  { id: "tebak", say: "Tebak dulu di komentar: dari semua itu, berapa pulau yang ada penghuninya?" },
  { id: "reveal", say: "Cuma sekitar enam ribu pulau. Kira-kira sepertiganya!" },
  { id: "java", say: "Dan lebih dari separuh orang Indonesia tinggal di satu pulau saja: Jawa!" },
  { id: "question", say: "Kamu tinggal di pulau yang mana? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep019: SEGMENTS };

export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["berapa pulau"],
  survey: ["tiga belas ribu empat ratus enam puluh enam"],
  law: ["tujuh belas ribu lima ratus delapan"],
  why: ["air surut"],
  tebak: ["penghuninya"],
  reveal: ["enam ribu pulau", "sepertiganya"],
  java: ["Jawa"],
  question: ["pulau yang mana"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and intriguing, light punch on 'berapa pulau'",
    survey: "clear and steady, matter-of-fact, steady on the big number",
    law: "a small pause after 'Tapi tunggu', then surprised, steady on the big number",
    why: "explaining, friendly and clear",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a clear happy reveal, punch on 'sepertiganya'",
    java: "amused and surprised, light punch on 'Jawa'",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const NUM = { survey: 13466, law: 17508, inhabited: 6000 };

export const SOURCES = [
  { fact: "Survei geospasial Bakorsurtanal 2007-2010: 13.466 pulau", source: "Wikipedia 'List of islands of Indonesia' (History)" },
  { fact: "UU No. 9/1996 tentang Perairan Indonesia: 17.508 pulau resmi (angka sama di CIA World Factbook)", source: "Wikipedia 'List of islands of Indonesia'" },
  { fact: "Selisih karena survei lama memasukkan pulau pasang-surut: karang dan gosong pasir yang muncul saat air surut", source: "Wikipedia 'List of islands of Indonesia'" },
  { fact: "Sekitar 6.000 dari 17.508 pulau berpenghuni (6000/17508 = 34%)", source: "Wikipedia 'Indonesia' (Geography); computed" },
  { fact: "Lebih dari separuh orang Indonesia tinggal di Jawa", source: "Wikipedia 'Indonesia'" },
];
