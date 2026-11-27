// Every episode run leaves ci-out/result.json with a reason (owner, 27 Nov 2026). Workflow step after Deliver.
// When Claude wrote none (it stopped, hit a limit, or ended without writing it), this writes one from
// ci-out/claude-error.json (made by ci/claude-error.mjs):
//   Claude usage/rate limit -> { status: "claude-limit" }  : not an episode problem, never counted as a stop;
//                                                            the next catch-up run simply tries again
//   anything else           -> { status: "check-needed" }  : counted by ci/stop-retry.mjs (retry once, then park)
// Only when there is an unfinished episode (state file); with none there is nothing to retry or park.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const RESULT = path.join(repo, "ci-out", "result.json");
const ERR = path.join(repo, "ci-out", "claude-error.json");
const STATE = path.join(repo, process.env.PROJECT ?? "", ".episode_state.json");
if (existsSync(RESULT)) process.exit(0);
const err = existsSync(ERR) ? JSON.parse(readFileSync(ERR, "utf8")) : { kind: "unknown", text: "no Claude error text" };
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : null;
if (!state) {
  console.log(`result-fallback: no result file and no unfinished episode (${err.kind}: ${String(err.text).slice(0, 160)})`);
  process.exit(0);
}
const status = err.kind === "limit" ? "claude-limit" : "check-needed";
writeFileSync(RESULT, `${JSON.stringify({ status, episode: state.episode, reason: `Claude left no result file (${err.kind}): ${String(err.text).slice(0, 240)}` }, null, 2)}\n`);
console.log(`result-fallback: wrote ${status} for ${state.episode}`);
