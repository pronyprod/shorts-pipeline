// Guard in front of every Gemini TTS request in a cloud run (owner, 25 Nov 2026). Only active on GitHub Actions.
//
// Fakta Ep020 (run 45510752280) lost its re-take because one of the run's 4 requests went to an accidental
// `npm run voice:ep019` (an episode that was already finished). The per-run cap was only a rule in the instructions;
// now the code enforces it:
//   1. a request is refused (nothing sent, nothing counted) when the episode is not the one in the project's
//      .episode_state.json (the episode this run is making). With no state file yet, any episode is allowed.
//   2. at most MAX_PER_RUN requests per workflow run per project, counted in ci-out/gemini-run.json
//      (default 4; a redo/test can raise it with GEMINI_RUN_CAP).
// Call guardGeminiRequest({ project, episode }) right before sending; it throws a clear error to refuse.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
export const MAX_PER_RUN = Number(process.env.GEMINI_RUN_CAP || 4);
const norm = (e) => String(e ?? "").toLowerCase().replace(/^ep0*/, "ep").replace(/v\d+$/, "");

// A request Google refused with HTTP 400 (bad request, nothing generated) does not use up this run's cap
// (Fakta Ep020, 25 Nov: one 400 cost one of the 4 requests). The daily quota file still counts it, to be safe.
export const refundGeminiRequest = ({ project }) => {
  if (!process.env.GITHUB_ACTIONS) return;
  const file = path.join(repo, "ci-out", "gemini-run.json");
  if (!existsSync(file)) return;
  const c = JSON.parse(readFileSync(file, "utf8"));
  if (c.runId !== (process.env.GITHUB_RUN_ID ?? "local") || !c.projects?.[project]) return;
  c.projects[project] -= 1;
  writeFileSync(file, `${JSON.stringify(c, null, 2)}\n`);
};

export const guardGeminiRequest = ({ project, episode }) => {
  if (!process.env.GITHUB_ACTIONS) return;
  const stateFile = path.join(repo, project, ".episode_state.json");
  if (existsSync(stateFile)) {
    const state = JSON.parse(readFileSync(stateFile, "utf8"));
    if (state.episode && norm(state.episode) !== norm(episode))
      throw new Error(`gemini-guard: this run is making ${state.episode}; a voice request for ${episode} is refused (nothing sent, nothing counted)`);
  }
  const file = path.join(repo, "ci-out", "gemini-run.json");
  mkdirSync(path.dirname(file), { recursive: true });
  const runId = process.env.GITHUB_RUN_ID ?? "local";
  let c = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  if (c.runId !== runId) c = { runId, projects: {} };
  const used = c.projects[project] ?? 0;
  if (used >= MAX_PER_RUN) throw new Error(`gemini-guard: this run's cap of ${MAX_PER_RUN} Gemini requests for ${project} is used up (nothing sent)`);
  c.projects[project] = used + 1;
  writeFileSync(file, `${JSON.stringify(c, null, 2)}\n`);
};
