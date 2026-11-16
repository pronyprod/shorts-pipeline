// EPISODE 3: "Krakatau 1883: suaranya terdengar sampai 4.800 km!" (FAKTA_BANK #2)
// Hook test from breakdowns3: second-person opening ("Kamu di Pulau Rodrigues...").
// Numbers: data/ep003-facts.json (scripts/facts-ep002-003.mjs). Every fact: SOURCES and episodes/Ep003.md.

import facts from "../../data/ep003-facts.json" with { type: "json" };
import type { LonLat } from "../lib/geo";
import { CHANNEL_VOICE } from "../voice.ts";

export const SEGMENTS = [
  { id: "hook", say: "Kamu di Pulau Rodrigues, tahun seribu delapan ratus delapan puluh tiga. Tiba-tiba terdengar suara gemuruh keras dari arah timur." },
  { id: "source", say: "Masalahnya, sumbernya ada di Selat Sunda. Krakatau. Jaraknya hampir empat ribu delapan ratus kilometer!" },
  { id: "local", say: "Itu hampir sejauh Sabang sampai Merauke. Satu suara, nyeberang hampir satu Indonesia!" },
  { id: "time", say: "Suaranya butuh hampir empat jam buat sampai ke sana." },
  { id: "twist", say: "Tapi suara itu baru permulaan." },
  { id: "wave", say: "Gelombang tekanan udaranya terekam barometer di lebih dari lima puluh stasiun cuaca di seluruh dunia." },
  { id: "cities", say: "Enam jam kemudian, Tokyo. Sepuluh jam, Wina. Lima belas jam, New York." },
  { id: "antipode", say: "Lalu gelombangnya bertemu di sisi lain Bumi, dekat Medellín, Kolombia, dan balik lagi!" },
  { id: "glasgow", say: "Barometer di Glasgow, Skotlandia, mencatat gelombang itu lewat tujuh kali, selama lima hari." },
  { id: "area", say: "Suaranya terdengar di wilayah seluas sepertiga belas permukaan Bumi. Lebih dari dua puluh kali luas Indonesia." },
  { id: "close", say: "Satu gunung di Selat Sunda, dan seluruh planet ikut merasakannya." },
  { id: "question", say: "Dari kotamu kedengaran nggak? Tulis di komentar!" },
] as const;
export type SegmentId = (typeof SEGMENTS)[number]["id"];
export const VERSIONS: Record<string, readonly { id: SegmentId; say: string }[]> = { ep003: SEGMENTS };

export const VOICE = {
  ...CHANNEL_VOICE,
  styles: {
    hook: "storytelling, drawing the listener in, then surprised", // 2026-10-31: war-like words removed after two SAFETY blocks
    source: "the twist: surprised, punchy on the distance",
    local: "vivid and amazed", // 2026-10-31: the first take was blocked (SAFETY); "ledakan di Sabang" was rephrased
    time: "calm and clear",
    twist: "short and dramatic, slower, lowering the voice",
    wave: "building up, getting faster",
    cities: "rhythmic, like a countdown, quick",
    antipode: "amazed, rising, big finish on 'balik lagi'",
    glasgow: "impressed, stress 'tujuh kali' and 'lima hari'",
    area: "big reveal, stress the comparison",
    close: "warm and awed",
    question: "friendly and direct, inviting the viewer to answer",
  } as Record<SegmentId, string>,
};

const P = facts.points as Record<string, { coord: number[]; source: string }>;
export const PT = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, v.coord as LonLat])) as Record<
  "krakatau" | "rodrigues" | "tokyo" | "vienna" | "newYork" | "glasgow" | "medellin",
  LonLat
>;
export const ANTIPODE = facts.antipode as LonLat;

export const NUM = {
  rodriguesKm: facts.distKm.rodrigues, // 4781
  sabangMeraukeKm: facts.sabangMeraukeKm, // 5240
  soundHours: facts.soundHoursToRodrigues, // 3.87
  waveMs: 300,
  reported: facts.reported, // Tokyo 6 h, Vienna 10 h, New York 15 h, Glasgow 7 passages over 121 h
  audibleAreaKm2: facts.audibleAreaKm2, // 39.2 million
  audibleVsIndonesia: facts.audibleVsIndonesia, // 20.6
};

export const SOURCES = [
  { fact: "Letusan Krakatau 27 Agustus 1883; suara seperti meriam/artileri; laporan terjauh yang kredibel dari Pulau Rodrigues (>4.800 km)", source: "Gabrielson, 'Krakatoa and the Royal Society', Acoustics Today, April 2010, hlm. 14-18 (meringkas laporan Royal Society, Symons 1888)" },
  { fact: "Jarak Krakatau–Rodrigues 4.781 km (garis lurus)", source: `Dihitung (haversine) dari: ${P.krakatau.source}; ${P.rodrigues.source}. Wikipedia 'Krakatoa' menyebut 4.780 km` },
  { fact: "≈ 91% Sabang–Merauke (5.240 km)", source: "Dihitung; Sabang–Merauke dari Ep001" },
  { fact: "Suara butuh ≈ 3,9 jam ke Rodrigues", source: "Dihitung: 4.781 km / 343 m/s (kecepatan suara di udara 20 °C). Oregon State 'Volcano World' juga menyebut sekitar 4 jam" },
  { fact: "Gelombang tekanan terekam di lebih dari 50 stasiun cuaca", source: "Gabrielson 2010 (Acoustics Today)" },
  { fact: "Tiba di Tokyo 6 jam, Wina 10 jam, New York 15 jam; bertemu di titik antipoda dekat Medellín, Kolombia; kembali lagi", source: "Gabrielson 2010 (Acoustics Today). Cek: titik antipoda Krakatau 6,1°LU 74,6°BB, 111 km dari Medellín (dihitung)" },
  { fact: "Glasgow mencatat 7 kali lewat: 11, 25, 48, 59, 84, 94, 121 jam (5 hari)", source: "Gabrielson 2010 (Acoustics Today)" },
  { fact: "Kecepatan gelombang 300-325 m/s; animasi pakai 300 m/s (cocok dengan waktu tiba: 5,4 / 9,7 / 15,0 jam)", source: "Gabrielson 2010; waktu dihitung (scripts/facts-ep002-003.mjs)" },
  { fact: "Wilayah yang mendengar ≈ 1/13 permukaan Bumi", source: "Gabrielson 2010, Gbr. 5 (digambar ulang dari Symons 1888)" },
  { fact: "1/13 permukaan Bumi ≈ 39,2 juta km² ≈ 20,6 × luas Indonesia (1.904.569 km²)", source: "Dihitung (R = 6.371 km); luas Indonesia seperti Ep001 (Wikipedia mengutip CIA Factbook 2025)" },
];
