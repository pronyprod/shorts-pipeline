// EPISODE 20 (science, TIMELY): hujan meteor Geminid, 13-14 Desember 2026, asalnya asteroid Phaethon.
// Timely source: Medcom, 18 Nov 2026. Every fact: SOURCES and episodes/Ep020.md.

import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Malam tiga belas Desember nanti, ada hujan meteor Geminid. Dan asalnya bukan dari komet!" },
  { id: "rock", say: "Kebanyakan hujan meteor berasal dari komet. Tapi Geminid berasal dari batu: asteroid bernama Phaethon." },
  { id: "size", say: "Ditemukan tahun seribu sembilan ratus delapan puluh tiga, lebarnya cuma sekitar lima kilometer." },
  { id: "speed", say: "Tapi tunggu... serpihannya melesat tiga puluh lima kilometer per detik. Jakarta ke Surabaya, kurang dari dua puluh detik!" },
  { id: "tebak", say: "Tebak dulu di komentar: berapa meteor yang kelihatan tiap jam?" },
  { id: "reveal", say: "Sekitar empat puluh sampai lima puluh meteor per jam, kalau langitnya gelap!" },
  { id: "question", say: "Malam itu kamu begadang atau tidur? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep020: SEGMENTS };

export const KEYS: Partial<Record<SegmentId, string[]>> = {
  hook: ["tiga belas Desember", "bukan dari komet"],
  rock: ["asteroid"],
  size: ["seribu sembilan ratus delapan puluh tiga", "lima kilometer"],
  speed: ["tiga puluh lima kilometer per detik", "dua puluh detik"],
  tebak: ["berapa meteor"],
  reveal: ["empat puluh sampai lima puluh meteor"],
  question: ["begadang atau tidur"],
};

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and intriguing, light punch on 'bukan dari komet'",
    rock: "explaining, friendly and clear, small lift on 'asteroid'",
    size: "clear and steady, matter-of-fact",
    speed: "a small pause after 'Tapi tunggu', then amazed, punch on 'dua puluh detik'",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "the key line: a clear happy reveal, punch on 'empat puluh sampai lima puluh'",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

export const NUM = { year: 1983, km: 5, speed: 35, perHour: [40, 50] };

export const SOURCES = [
  { fact: "Puncak Geminid 2026 malam 13-14 Desember; asal: asteroid 3200 Phaethon; sekitar 40-50 meteor per jam (TIMELY, terbit 18 Nov 2026)", source: "Medcom.id, 'Jadwal Hujan Meteor Desember 2026 hingga Januari 2027', 18 Nov 2026" },
  { fact: "Kebanyakan hujan meteor dari komet; Geminid dari asteroid Phaethon; 40-50 meteor per jam di langit gelap", source: "NASA Science, Geminids page" },
  { fact: "Phaethon ditemukan 11 Okt 1983 oleh satelit IRAS; lebar 5,1 km (NASA; Wikipedia 5,8 km rata-rata)", source: "NASA Science Geminids; Wikipedia '3200 Phaethon'" },
  { fact: "Kecepatan meteor Geminid 35 km/detik (22 mil/detik)", source: "NASA Science Geminids" },
  { fact: "Jakarta-Surabaya garis lurus 662,6 km; 662,6/35 = 18,9 detik", source: "computed (haversine R=6371,0088 km)" },
];
