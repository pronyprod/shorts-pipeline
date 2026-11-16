// EPISODE 9 (animals): "Komodo cuma hidup di 5 pulau di seluruh dunia?" (FAKTA_BANK V3)
// Every fact: SOURCES and episodes/Ep009.md.

import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Kadal terbesar di dunia cuma hidup di lima pulau. Dan semuanya di Indonesia!" },
  { id: "islands", say: "Komodo, Rinca, Flores, Gili Motang, dan Gili Dasami. Semuanya di Nusa Tenggara Timur." },
  { id: "find", say: "Ilmuwan Barat baru mencatatnya tahun seribu sembilan ratus sepuluh." },
  { id: "size", say: "Panjangnya bisa sampai tiga meter. Beratnya biasanya sekitar tujuh puluh kilo." },
  { id: "meal", say: "Bahkan, sekali makan, dia bisa menghabiskan delapan puluh persen berat badannya!" },
  { id: "nose", say: "Hidungnya juga jago. Bau makanan dari empat kilometer pun ketahuan." },
  { id: "tebak", say: "Tapi rumahnya kecil. Tebak dulu di komentar: daratan Taman Nasional Komodo berapa kilometer persegi?" },
  { id: "reveal", say: "Cuma enam ratus tiga! Lebih kecil dari Jakarta." },
  { id: "padar", say: "Tapi tunggu. Di Pulau Padar, komodo udah nggak kelihatan sejak tahun tujuh puluhan." },
  { id: "virgin", say: "Satu lagi. Komodo betina bisa punya anak tanpa pejantan! Ini ketahuan di dua kebun binatang di Inggris." },
  { id: "status", say: "Tahun dua ribu dua puluh satu, statusnya naik jadi terancam punah. Air laut yang naik bisa mempersempit rumahnya." },
  { id: "payoff", say: "Kabar baiknya, di dalam taman nasional, jumlahnya stabil. Rumah satu-satunya ya di sini, di Indonesia!" },
  { id: "question", say: "Kamu dari pulau mana? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep009: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "curious and friendly, a surprised proud lift on 'Indonesia'",
    islands: "quick and lively, like a fun list",
    find: "light storytelling, a little amused",
    size: "impressed, punchy on the numbers",
    meal: "big amazed reaction, stress 'delapan puluh persen'",
    nose: "playful and impressed",
    tebak: "playful challenge to the viewer, slowing slightly at the end",
    reveal: "big surprised reveal, short and punchy",
    padar: "a teasing pause feeling, then calm surprise",
    virgin: "amazed, like sharing a wild fact with a friend",
    status: "calm and clear, gentle",
    payoff: "warm, hopeful and proud",
    question: "warm, friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

// approximate island centres (Natural Earth is too coarse for the two gilis; see episodes/Ep009.md)
export const PT = {
  komodo: [119.47, -8.59] as LonLat,
  rinca: [119.68, -8.68] as LonLat,
  flores: [119.97, -8.56] as LonLat,
  giliMotang: [119.79, -8.80] as LonLat,
  giliDasami: [119.80, -8.63] as LonLat,
  padar: [119.59, -8.66] as LonLat,
  jakarta: [106.83, -6.18] as LonLat,
  london: [-0.13, 51.51] as LonLat,
  chester: [-2.89, 53.19] as LonLat,
};

export const NUM = { islands: 5, year: 1910, lengthM: 3, weightKg: 70, mealPct: 80, smellKm: 4, parkLandKm2: 603, jakartaKm2: 661, padarSince: 1970, statusYear: 2021 };

export const SOURCES = [
  { fact: "Kadal terbesar yang masih hidup", source: "Wikipedia, 'Komodo dragon' ('largest extant species of lizard'), diakses 2026-11-10" },
  { fact: "Hanya di Komodo, Rinca, Flores, Gili Dasami, Gili Motang", source: "Wikipedia, 'Komodo dragon' dan 'Komodo National Park', diakses 2026-11-10; IUCN 2021 via NHM London (Komodo NP + Flores)" },
  { fact: "Ilmuwan Barat mencatat pertama 1910", source: "Wikipedia, 'Komodo dragon' ('first recorded ... in 1910'); nama ilmiah Ouwens 1912" },
  { fact: "Panjang maksimum 3 m; biasanya ~70 kg", source: "Wikipedia, 'Komodo dragon'; Smithsonian National Zoo ('about 154 pounds (70 kilograms)')" },
  { fact: "Sekali makan sampai 80% berat badan", source: "Smithsonian National Zoo, 'Komodo dragon' ('up to 80 percent of its own body weight in a single meal')" },
  { fact: "Mencium bau bangkai sampai 4 km", source: "Smithsonian National Zoo ('up to 2.5 miles (4 kilometers) away'); Wikipedia 4-9,5 km" },
  { fact: "Daratan Taman Nasional Komodo 603 km² (total 1.733 km²)", source: "Wikipedia, 'Komodo National Park', diakses 2026-11-10" },
  { fact: "Jakarta ~661 km²", source: "Kepmendagri 100.1.1-6117/2022: 660,982 km²; versi lain 661,5-662,33 km² (BPS DKI); semuanya > 603" },
  { fact: "Tak terlihat lagi di Padar sejak 1970-an", source: "Smithsonian National Zoo ('not been seen on the island of Padar since the 1970s')" },
  { fact: "Partenogenesis, Chester Zoo dan London Zoo", source: "Watts et al. 2006, Nature 444:1021 (doi 10.1038/4441021a); Nature News 20 Des 2006" },
  { fact: "2021: Vulnerable -> Endangered, naiknya air laut; populasi di TN Komodo stabil", source: "IUCN Red List update Sept 2021 via Natural History Museum London news, Sept 2021; NPR 4 Sept 2021" },
];
