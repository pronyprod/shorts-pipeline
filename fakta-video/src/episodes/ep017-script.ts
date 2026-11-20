// EPISODE 17 (records): "Bunga terbesar di dunia tumbuh di Indonesia" (FAKTA_BANK V9, Rafflesia arnoldii)
// Every fact: SOURCES and episodes/Ep017.md.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Bunga terbesar di dunia tumbuh di hutan Sumatra!" },
  { id: "find", say: "Tahun seribu delapan ratus delapan belas, Joseph Arnold menemukannya, saat ikut ekspedisi Raffles." },
  { id: "twist", say: "Tapi tunggu... bunga ini tidak punya daun, batang, atau akar yang terlihat." },
  { id: "vine", say: "Dia numpang hidup di tanaman rambat." },
  { id: "tebak", say: "Tebak dulu di komentar: selebar apa?" },
  { id: "reveal", say: "Sekitar satu meter!" },
  { id: "smell", say: "Bahkan baunya seperti daging busuk!" },
  { id: "short", say: "Kuncupnya tumbuh berbulan-bulan, tapi mekarnya cuma beberapa hari." },
  { id: "status", say: "Sejak seribu sembilan ratus sembilan puluh tiga, rafflesia jadi puspa langka." },
  { id: "question", say: "Kamu pernah lihat langsung? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep017: SEGMENTS };

export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["Bunga terbesar", "Sumatra"],
  find: ["seribu delapan ratus delapan belas"],
  twist: ["tidak punya daun"],
  vine: ["numpang hidup"],
  tebak: ["selebar apa"],
  reveal: ["satu meter"],
  smell: ["daging busuk"],
  short: ["berbulan-bulan", "beberapa hari"],
  status: ["puspa langka"],
  question: ["pernah lihat"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and intriguing, light punch on 'terbesar'",
    find: "clear storytelling, steady, light stress on the year",
    twist: "a small pause after 'Tapi tunggu', then surprised",
    vine: "matter-of-fact with a hint of amusement",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a big happy reveal, clear and steady",
    smell: "amused and surprised, punch on 'busuk'",
    short: "gentle, a touch of wonder, contrast between 'berbulan-bulan' and 'beberapa hari'",
    status: "proud and matter-of-fact",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  bengkulu: [102.26, -3.79] as LonLat, // Bengkulu (Bencoolen), Sumatra (approx.)
};

export const NUM = { year: 1818, decree: 1993, meters: 1 };

export const SOURCES = [
  { fact: "Rafflesia arnoldii = bunga tunggal terbesar yang dikenal; hutan hujan Sumatra (dan Kalimantan)", source: "Kew POWO / Plants & Fungi blog; Wikipedia 'Rafflesia arnoldii'" },
  { fact: "1818: Joseph Arnold mengumpulkan spesimen di Sumatra dalam ekspedisi yang dipimpin Stamford Raffles", source: "Wikipedia 'Rafflesia arnoldii' (IPNI: nama R. arnoldii oleh Robert Brown, 1821)" },
  { fact: "Holoparasit: tanpa daun, batang, atau akar yang terlihat, tanpa klorofil; menumpang pada tanaman rambat Tetrastigma", source: "Wikipedia 'Rafflesia arnoldii'; Britannica 'Rafflesia'" },
  { fact: "Diameter sekitar 1 m (terukur terbesar 1,14 m, Mongabay)", source: "Kew Plants & Fungi blog; Wikipedia. Bobot berbeda antar sumber (6,8-11 kg): tidak disebut" },
  { fact: "Bau daging busuk", source: "Kew; Wikipedia 'Rafflesia arnoldii'" },
  { fact: "Kuncup berkembang berbulan-bulan (sekitar setahun); bunga mekar hanya beberapa hari (maksimal seminggu)", source: "Wikipedia 'Rafflesia arnoldii'; Discover Magazine ('open for a week at most')" },
  { fact: "1993: puspa langka nasional (Keppres No. 4 Tahun 1993)", source: "Wikipedia 'Rafflesia arnoldii' (national flower section)" },
];
