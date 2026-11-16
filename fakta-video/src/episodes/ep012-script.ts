// EPISODE 12 (animals): "Burung cenderawasih pernah dikira nggak punya kaki?" (FAKTA_BANK V4)
// Every fact: SOURCES and episodes/Ep012.md. Distances computed in scripts/facts-ep012.mjs -> data/ep012-facts.json.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

// 40-60 s, about 110 words, clear and unhurried (owner, 12 Nov 2026).
export const SEGMENTS = [
  { id: "hook", say: "Burung ini pernah dikira nggak punya kaki!" },
  { id: "name", say: "Ini cenderawasih, burung khas Papua dan Maluku." },
  { id: "ship", say: "Tahun seribu lima ratus dua puluh dua, kulitnya dibawa kapal dari Maluku ke Spanyol." },
  { id: "far", say: "Jarak lurusnya lebih dari dua setengah kali Sabang sampai Merauke!" },
  { id: "nofeet", say: "Tapi tunggu... kulit itu sengaja dibuat tanpa kaki." },
  { id: "myth", say: "Orang Eropa percaya, burung ini terbang terus dan nggak pernah hinggap!" },
  { id: "tebak", say: "Tebak dulu di komentar: tahun berapa ilmuwan memberinya nama?" },
  { id: "reveal", say: "Tahun seribu tujuh ratus lima puluh delapan! Nama ilmiahnya apoda, artinya tanpa kaki!" },
  { id: "twist", say: "Padahal, sekitar seratus tahun sebelumnya, kakinya sudah ketahuan!" },
  { id: "species", say: "Sekarang dikenal sekitar empat puluh jenis. Dua puluh tujuh ada di Pulau Papua!" },
  { id: "question", say: "Daerahmu punya hewan khas apa? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep012: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "warm and curious, a little amazed lift on 'nggak punya kaki'",
    name: "clear and proud, say 'cenderawasih' slowly and clearly (chen-de-ra-wa-sih)",
    ship: "calm storytelling, clear on the year",
    far: "impressed, steady on 'dua setengah kali'",
    nofeet: "a small dramatic pause after 'Tapi tunggu', then a gentle surprise",
    myth: "amused, like telling an old legend",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a big happy reveal, punch on the year, then clear on 'apoda' (a-PO-da) and a smile on 'tanpa kaki'",
    twist: "amused disbelief, light punch on 'sudah ketahuan'",
    species: "friendly and impressed, clear on both numbers",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const PT = {
  tidore: [127.4, 0.68] as LonLat, // Tidore island (Wikipedia); the Victoria left Tidore 21 Dec 1521
  seville: [-5.9869, 37.3772] as LonLat, // Seville (Wikipedia); the Victoria arrived 8 Sep 1522 (Sanlúcar 6 Sep)
  papua: [138.5, -4.5] as LonLat, // centre of New Guinea (approx., for the camera/label)
  teluk: [135.5, -2.6] as LonLat, // Teluk Cenderawasih (Wikipedia, 'Cenderawasih Bay')
};

export const NUM = { voyageYear: 1522, linnaeusYear: 1758, routeKm: 13631, routeTimes: 2.6, species: 40, papuaSpecies: 27, feetKnown: 1650 };

export const SOURCES = [
  { fact: "Cenderawasih (Paradisaeidae): burung khas Papua/New Guinea dan Maluku (mis. bidadari Halmahera, Semioptera wallacii)", source: "Cornell Lab of Ornithology, Birds-of-Paradise Project; Wikipedia, 'Bird-of-paradise', 'Standardwing'" },
  { fact: "Kulit cenderawasih pertama tiba di Eropa dengan kapal Victoria (ekspedisi Magellan-Elcano), Sevilla, September 1522; diterima di Maluku (Raja Bacan)", source: "PBS Nature, 'Birds bedazzled early European explorers'; Public Domain Review, 'Fallen Angels: Birds of Paradise in Early Modern Europe'; Swadling via J. Southeast Asian Studies 2017 'Flights of fancy' (doi 10.1017/S0022463417000546)" },
  { fact: "Jarak lurus Tidore-Sevilla 13.631 km = 2,6x Sabang-Merauke (5.240 km). Rute kapal yang sebenarnya lewat Tanjung Harapan, jauh lebih panjang", source: "Dihitung: scripts/facts-ep012.mjs (haversine; Vincenty 13.643 km)" },
  { fact: "Kulit dagang disiapkan tanpa kaki (dan sering tanpa sayap) oleh penduduk setempat", source: "Wikipedia, 'Bird-of-paradise' (History); Public Domain Review, 'Fallen Angels'" },
  { fact: "Mitos di Eropa: burung ini tak berkaki, terbang terus, tak pernah hinggap (Cardano, abad ke-16)", source: "Public Domain Review, 'Fallen Angels'; PBS Nature" },
  { fact: "Linnaeus 1758 (Systema Naturae ed. 10): Paradisaea apoda; apoda = 'tanpa kaki' (Yunani a- + pous)", source: "Wikipedia, 'Greater bird-of-paradise'" },
  { fact: "Pertengahan abad ke-17 sudah dibuktikan burung ini punya kaki (±100 tahun sebelum 1758)", source: "Public Domain Review, 'Fallen Angels' (\"not until the middle of the seventeenth century\")" },
  { fact: "Sekitar 40 jenis cenderawasih (39 + Lophorina niedda, 2018)", source: "Cornell Lab, Birds-of-Paradise Project; Scholes & Laman 2018, PeerJ ('approximately 40 species')" },
  { fact: "27 jenis cenderawasih di Pulau Papua (New Guinea)", source: "Cornell Lab of Ornithology, 'Birds-of-Paradise help inspire conservation of forests in West Papua' (New Guinea: 600+ bird species incl. 27 birds-of-paradise)" },
];
