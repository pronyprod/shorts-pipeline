// Gemini TTS requests with per-day quota tracking and automatic model fallback.
// The API key is read from the environment only (GEMINI_API_KEY) and never logged.
import { pcm16ToFloat } from "./audio.mjs";
import { guardGeminiRequest } from "../../../ci/gemini-guard.mjs";

// This project uses ONLY 3.8 (owner rule 2026-10-31: 3.1 is reserved for the fakta project).
// The 3.1 request format stays below for reference and for the offline self-test.
export const MODELS = ["gemini-3.8-flash-tts"];
export const ALL_MODELS = ["gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview"];
const is38 = (model) => model.startsWith("gemini-3.8");

export class QuotaExhaustedError extends Error {}

// ---- direction -> request text ------------------------------------------------
// 3.8: sustained delivery goes in the per-line style field; only point-in-time
// vocal events stay inline, in angle brackets. Mood tags ([excited]) move into the style.
const VOCAL = { "short pause": "short pause", "long pause": "long pause", laughs: "laugh", chuckles: "chuckle" };
// Owner rule 12 Nov 2026: clear, unhurried delivery, punch only on the key line. Directions that ask for speed are refused.
export const HURRY = /\b(fast|faster|quick|quicker|quickly|brisk|briskly|rapid|rapidly|hurried|rushed|racing|speedy|cepat|buru-buru)\b/i;
export const PERSONA_38 = "Clear, unhurried YouTube science narrator talking to one friend: conversational, human, warm, an easy pace with short natural pauses, extra punch only on the key line, no audible breaths";
export const to38 = (line) => {
  const moods = [];
  const text = line.tagged
    .replace(/\[([^\]]+)\]\s*/g, (_, tag) => {
      if (VOCAL[tag]) return `<${VOCAL[tag]}> `;
      moods.push(tag === "whispers" ? "starts in a whisper" : tag);
      return "";
    })
    .trim();
  return { text, style: `${PERSONA_38}. ${line.style}${moods.length ? `; ${moods.join(", ")}` : ""}` };
};
// 3.1: style as plain text in the prompt, square-bracket tags inline (tested 2026-10-29: never read aloud)
export const prompt31 = (persona, lines) => `${persona}\n\n${lines.map((l) => `(${l.style}) ${l.tagged}`).join("\n")}\n`;

// One request for many lines. 3.8 gets one text item per line, each with its own
// style; a <long pause> after each line is the separator. `format: "single"` is the
// fallback if the API refuses several items: one text with the directions in the style.
export const episodeBody = (model, voice, persona, lines, format = "items") => {
  if (!is38(model)) return gen31Body(voice, prompt31(persona, lines));
  const parts = lines.map((l, i) => {
    const r = to38(l);
    return { ...r, text: i < lines.length - 1 ? `${r.text} <long pause>` : r.text };
  });
  const content =
    format === "items"
      ? parts.map((p) => ({ type: "text", text: p.text, annotations: [{ type: "speech_metadata", style: p.style }] }))
      : [
          {
            type: "text",
            text: parts.map((p) => p.text).join(" "),
            annotations: [{ type: "speech_metadata", style: `${PERSONA_38}. Line by line: ${lines.map((l, i) => `${i + 1}) ${l.style}`).join("; ")}` }],
          },
        ];
  return gen38Body(voice, content);
};
export const lineBody = (model, voice, persona, line) => {
  if (!is38(model)) return gen31Body(voice, prompt31(persona, [line]));
  const r = to38(line);
  return gen38Body(voice, [{ type: "text", text: r.text, annotations: [{ type: "speech_metadata", style: r.style }] }]);
};
const gen38Body = (voice, content) => ({
  model: "gemini-3.8-flash-tts",
  input: [{ type: "user_input", content }],
  response_format: { type: "audio" },
  generation_config: { speech_config: [{ voice }] },
});
const gen31Body = (voice, text) => ({
  contents: [{ parts: [{ text }] }],
  generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
});

// ---- transport ------------------------------------------------------------------
// Real HTTP. Returns { status, json }.
export const httpTransport = async (model, body) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const url = is38(model)
    ? "https://generativelanguage.googleapis.com/v1beta/interactions"
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180_000),
      });
      return { status: res.status, json: await res.json() };
    } catch (e) {
      // dropped connections happen after long idle gaps; retry the same request
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
};

const audioOf = (model, json) => {
  const b64 = is38(model)
    ? json.steps?.flatMap((s) => s.content ?? []).find((c) => c.type === "audio")?.data
    : json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
  if (!b64) throw new Error(`no audio in response: ${JSON.stringify(json).slice(0, 300)}`);
  return pcm16ToFloat(Buffer.from(b64, "base64"));
};

// "Please retry in 19h21m35s" -> ms
const retryMs = (msg) => {
  const m = /retry in (?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)?/i.exec(msg ?? "");
  return m ? ((+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0)) * 1000 : null;
};

// ---- client ----------------------------------------------------------------------
// Free tier is 3 requests per minute per model, so calls are spaced out; `maxRequests`
// is a hard cap per run (RequestBudgetError when reached).
export class RequestBudgetError extends Error {}
export class TtsClient {
  constructor({
    quota,
    voice,
    persona,
    models = MODELS,
    transport = httpTransport,
    log = console.log,
    now = () => new Date(),
    minGapMs = transport === httpTransport ? 20_000 : 0,
    maxRequests = Infinity,
  }) {
    Object.assign(this, { quota, voice, persona, models, transport, log, now, minGapMs, maxRequests });
    this.sent = []; // requests that returned an answer (count against maxRequests)
    this.failed = []; // server errors (5xx) that returned nothing
    this.lastCall = 0;
  }

  async #call(model, body, label) {
    if (this.sent.length >= this.maxRequests) throw new RequestBudgetError(`request cap of ${this.maxRequests} reached`);
    if (this.episodeId && this.transport === httpTransport) {
      // real requests only: the offline self-test (test audio) is never limited
      try {
        guardGeminiRequest({ project: "whatif-video", episode: this.episodeId }); // cloud: right episode, max 4 per run
      } catch (e) {
        throw new RequestBudgetError(e.message);
      }
    }
    const wait = this.lastCall + this.minGapMs - Date.now();
    if (wait > 0) {
      this.log(`  waiting ${Math.ceil(wait / 1000)}s between requests (free tier: 3 per minute)`);
      await new Promise((r) => setTimeout(r, wait));
    }
    this.lastCall = Date.now();
    return this.transport(model, body, label);
  }

  // Sends one request, trying models in order (3.8 first unless `prefer` says otherwise).
  // build(model) -> request body. Returns { audio, model }.
  async send(label, build, prefer) {
    const order = prefer ? [prefer, ...this.models.filter((m) => m !== prefer)] : this.models;
    let anyOverloaded = false;
    for (const model of order) {
      if (this.quota.left(model) <= 0) {
        this.log(`  ${model}: no quota left today, skipping`);
        continue;
      }
      let overloaded = 0;
      for (let wait = 15; ; wait *= 2) {
        const { status, json } = await this.#call(model, build(model), label);
        if (status >= 500) {
          // "currently experiencing high demand": temporary, no audio. Counted in the
          // quota file to be safe, but not against this run's request cap.
          this.quota.record(model);
          this.failed.push({ label, model, status });
          if (++overloaded > 2) {
            this.log(`  ${model}: still overloaded (HTTP ${status}), falling back`);
            anyOverloaded = true;
            break;
          }
          this.log(`  ${model}: HTTP ${status} (${(json.error?.message ?? "").slice(0, 60)}...), retrying in ${30 * overloaded}s`);
          await new Promise((r) => setTimeout(r, 30_000 * overloaded));
          continue;
        }
        if (status === 429) {
          const msg = json.error?.message ?? "";
          if (/per day/i.test(msg)) {
            const ms = retryMs(msg) ?? 24 * 3600 * 1000;
            const limitSeen = Number(/limit: (\d+)/.exec(msg)?.[1]) || undefined;
            this.quota.markExhausted(model, new Date(this.now().getTime() + ms), limitSeen);
            this.log(`  ${model}: daily limit reached (${msg.slice(0, 90)}...), falling back`);
            break;
          }
          if (wait > 240) throw new Error(`${model}: still rate limited after retries: ${msg}`);
          const s = (retryMs(msg) ?? wait * 1000) / 1000 + 1;
          this.log(`  ${model}: per-minute limit, waiting ${s.toFixed(0)}s`);
          await new Promise((r) => setTimeout(r, s * 1000));
          continue;
        }
        this.quota.record(model); // count every request that wasn't a 429
        this.sent.push({ label, model, status });
        if (status !== 200 || json.error) {
          const err = new Error(`${model} HTTP ${status}: ${json.error?.message ?? ""}`);
          err.status = status;
          throw err;
        }
        return { audio: audioOf(model, json), model };
      }
    }
    if (anyOverloaded) throw new Error("Gemini TTS is overloaded (HTTP 5xx) on every model with quota left; nothing was generated. Try again later.");
    throw new QuotaExhaustedError(
      `All TTS models are out of free requests for today.\n${this.quota.summary(this.models)}\nNext reset: ${this.quota.nextReset(this.models).toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })} WIB`,
    );
  }

  async episode(lines) {
    try {
      return await this.send("episode", (m) => episodeBody(m, this.voice, this.persona, lines, "items"));
    } catch (e) {
      if (e.status !== 400) throw e;
      this.log("  the API refused one-item-per-line; retrying with all lines in one item");
      return this.send("episode (single item)", (m) => episodeBody(m, this.voice, this.persona, lines, "single"));
    }
  }

  line(line, prefer) {
    return this.send(`line ${line.n}`, (m) => lineBody(m, this.voice, this.persona, line), prefer);
  }
}
