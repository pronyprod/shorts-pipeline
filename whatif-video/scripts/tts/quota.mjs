// Local request counter per model per day, so we always know what's left.
// Google's free-tier daily limits reset at midnight Pacific time (the 429 on
// 2026-10-29 said "retry in 19h21m" at 18:42 WIB = 00:03 PDT).
// File: .tts-quota.json in the project root (not secret; no key in it).

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const DEFAULT_QUOTA_FILE = path.resolve(import.meta.dirname, "..", "..", ".tts-quota.json");

// Known free-tier requests per day. `verified` = seen in Google's own 429 message.
const DEFAULT_LIMITS = {
  "gemini-3.8-flash-tts": { perDay: 10, verified: true },
  "gemini-3.1-flash-tts-preview": { perDay: 10, verified: true }, // AI Studio rate-limit page, 29 Oct
};

export const quotaDay = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now); // YYYY-MM-DD

export class Quota {
  constructor(file = DEFAULT_QUOTA_FILE, now = () => new Date()) {
    this.file = file;
    this.now = now;
    this.data = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { limits: DEFAULT_LIMITS, days: {} };
    for (const [m, l] of Object.entries(DEFAULT_LIMITS)) this.data.limits[m] ??= l;
  }

  #today(model) {
    const day = (this.data.days[quotaDay(this.now())] ??= {});
    return (day[model] ??= { used: 0 });
  }

  save() {
    this.data.note = "Requests per model per Pacific-time day. Written by scripts/tts/quota.mjs.";
    writeFileSync(this.file, JSON.stringify(this.data, null, 2) + "\n");
  }

  limit(model) {
    return this.data.limits[model]?.perDay ?? 10;
  }

  left(model) {
    const t = this.#today(model);
    if (t.exhaustedUntil && new Date(t.exhaustedUntil) > this.now()) return 0;
    return Math.max(0, this.limit(model) - t.used);
  }

  record(model) {
    this.#today(model).used++;
    this.save();
  }

  // Called on a "per day" 429. `limitSeen` comes from Google's message when present.
  markExhausted(model, until, limitSeen) {
    const t = this.#today(model);
    if (limitSeen) this.data.limits[model] = { perDay: limitSeen, verified: true };
    t.used = Math.max(t.used, this.limit(model));
    t.exhaustedUntil = until.toISOString();
    this.save();
  }

  summary(models) {
    return models.map((m) => `${m}: ${this.left(m)}/${this.limit(m)} left today${this.data.limits[m]?.verified ? "" : " (limit assumed)"}`).join("\n");
  }

  // when the earliest exhausted model becomes usable again
  nextReset(models) {
    const times = models.map((m) => this.#today(m).exhaustedUntil).filter(Boolean).map((s) => new Date(s));
    if (times.length) return new Date(Math.min(...times));
    // next Pacific midnight
    const d = new Date(this.now());
    for (let i = 0; i < 26 * 60; i++) {
      d.setMinutes(d.getMinutes() + 1);
      if (quotaDay(d) !== quotaDay(this.now())) return d;
    }
    return d;
  }
}
