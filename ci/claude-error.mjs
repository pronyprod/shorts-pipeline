// Why did the Claude step stop? (workflow only, after a failed Claude step; 22 Nov 2026)
//
// The Claude action hides its full output in the public log. When it fails ("is_error"), this reads the action's
// execution file and shows ONLY the final error text (at most 300 characters, anything that looks like a key or
// token removed), in the log and the run summary. It also sorts the error:
//   limit = Claude usage / rate limit or an overloaded API: not an episode problem; nothing to fix, the next run
//           makes the episode (ci/deliver.mjs logs "CLAUDE LIMIT", not "CHECK NEEDED")
//   error = anything else (ci/deliver.mjs logs CHECK NEEDED with this text)
// Writes ci-out/claude-error.json { kind, text }. Never fails the job itself.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const files = [...process.argv.slice(2), path.join(process.env.RUNNER_TEMP ?? "/tmp", "claude-execution-output.json")].filter(Boolean);
let text = "";
for (const f of files) {
  if (!existsSync(f)) continue;
  try {
    const raw = JSON.parse(readFileSync(f, "utf8"));
    const msgs = Array.isArray(raw) ? raw : [raw];
    const result = msgs.filter((m) => m?.type === "result").pop();
    text = typeof result?.result === "string" ? result.result : "";
    if (!text) {
      // the last assistant text, when the result carries none (e.g. "API Error: 529 ...")
      const last = msgs.filter((m) => m?.type === "assistant").pop();
      text = (last?.message?.content ?? []).filter((c) => c?.type === "text").map((c) => c.text).join(" ");
    }
    if (text) break;
  } catch (e) {
    text = `execution file unreadable (${String(e.message).slice(0, 80)})`;
  }
}
text = String(text || "no error text in the execution file")
  .replace(/(sk-ant|ghp_|gho_|github_pat_|AIza|ya29\.)[\w.-]+/g, "[removed]")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 300);
const kind = /usage limit|rate.?limit|limit reached|too many requests|\b429\b|overloaded|\b529\b|quota/i.test(text) ? "limit" : "error";
mkdirSync(path.join(repo, "ci-out"), { recursive: true });
writeFileSync(path.join(repo, "ci-out", "claude-error.json"), `${JSON.stringify({ kind, text }, null, 2)}\n`);
const line = `Claude stopped (${kind === "limit" ? "usage/rate limit, not an episode problem" : "error"}): ${text}`;
console.log(line);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `**${line}**\n\n`);
