// Text-to-speech with Google's Gemini TTS (cloud; needs GEMINI_API_KEY in the environment).
// The key is only read from the environment: never pass it on the command line or save it.
//
// Usage: node scripts/gemini-tts.mjs <prompt.txt> <out.wav> [voice] [model]
//   prompt.txt: the full prompt (style direction + transcript with inline tags)
//   voice:      a prebuilt voice name (default Puck)
//   model:      default gemini-3.1-flash-tts-preview
// Prints duration, token usage and any rate-limit info. Exit code 2 = rate limited (429).

import { readFileSync, writeFileSync } from "node:fs";

const [promptFile, outFile, voice = "Puck", model = "gemini-3.1-flash-tts-preview"] = process.argv.slice(2);
if (!promptFile || !outFile) {
  console.error("Usage: node scripts/gemini-tts.mjs <prompt.txt> <out.wav> [voice] [model]");
  process.exit(1);
}
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("GEMINI_API_KEY is not set");
  process.exit(1);
}

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
  method: "POST",
  headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ text: readFileSync(promptFile, "utf8") }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  }),
});
const json = await res.json();
if (!res.ok || json.error) {
  // error bodies describe quotas; they never contain the key
  console.error(`HTTP ${res.status}: ${json.error?.status ?? ""} ${json.error?.message ?? ""}`);
  for (const d of json.error?.details ?? []) {
    if (d.violations) for (const v of d.violations) console.error(`  quota: ${v.quotaMetric} / ${v.quotaId} = ${v.quotaValue ?? "?"}`);
    if (d.retryDelay) console.error(`  retry after ${d.retryDelay}`);
  }
  process.exit(res.status === 429 ? 2 : 1);
}

const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
if (!part) {
  console.error("No audio in response:", JSON.stringify(json).slice(0, 500));
  process.exit(1);
}
// The legacy 3.1 model returns headerless 16-bit PCM (audio/l16; rate=24000; channels=1)
const mime = part.inlineData.mimeType;
const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
let pcm = Buffer.from(part.inlineData.data, "base64");
if (pcm.subarray(0, 4).toString() === "RIFF") pcm = pcm.subarray(pcm.indexOf("data") + 8);
// l16 is big-endian by spec; detect by checking which byte order looks like quiet speech
const be = mime.includes("l16") && looksBigEndian(pcm);
if (be) for (let i = 0; i + 1 < pcm.length; i += 2) [pcm[i], pcm[i + 1]] = [pcm[i + 1], pcm[i]];

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);
writeFileSync(outFile, Buffer.concat([header, pcm]));

const u = json.usageMetadata ?? {};
console.log(
  `${outFile}: ${(pcm.length / 2 / rate).toFixed(2)}s (${mime}${be ? ", byte-swapped" : ""}), tokens in ${u.promptTokenCount} out ${u.candidatesTokenCount}`,
);

// Smooth audio has small differences between neighbouring samples; the wrong
// byte order turns that into noise. Compare both readings.
function looksBigEndian(buf) {
  let le = 0;
  let bigE = 0;
  for (let i = 2; i + 1 < Math.min(buf.length, 200000); i += 2) {
    le += Math.abs(buf.readInt16LE(i) - buf.readInt16LE(i - 2));
    bigE += Math.abs(buf.readInt16BE(i) - buf.readInt16BE(i - 2));
  }
  return bigE < le;
}
