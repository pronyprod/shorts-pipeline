// The channel narrator (locked 2026-10-31 with Fakta_Ep001V3): Gemini TTS, Puck, gemini-3.1-flash-tts only.
// Persona changed 12 Nov 2026 (owner: fast voices lose scrollers): clear, unhurried, punch on the key line.
// Each episode script exports VOICE = { ...CHANNEL_VOICE, styles: { <segment id>: "<direction>" } }.
export const CHANNEL_VOICE = {
  voice: "Puck",
  model: "gemini-3.1-flash-tts-preview", // this project uses ONLY 3.1; 3.8 belongs to the what-if channel
  persona:
    "Speak in natural, casual Bahasa Indonesia with a Jakarta accent, like a friendly Indonesian educational creator " +
    "talking to a friend: clear and unhurried (about 130 words per minute), warm, smiling, natural changes of pitch, extra punch " +
    "only on the key line and the big number, never like a news reader. Read the lines in order with a clear one-second pause between lines and no long pauses inside a line. " +
    "Read only the Indonesian lines; never read the directions in parentheses.",
};
export type EpisodeVoice = typeof CHANNEL_VOICE & { styles: Record<string, string> };
