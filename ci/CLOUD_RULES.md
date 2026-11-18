# Cloud rules (GitHub Actions, Linux)

You are making the next episode for ONE channel on a GitHub Actions runner (ubuntu, no laptop, nobody to ask).
The workflow tells you the channel and whether this is a TEST run. Work from the repository root.

Do exactly what the channel's own instructions say:

| Channel | Project folder | Instructions | Style guide |
|---|---|---|---|
| countryballs | `countryballs-video` | `countryballs-video/.claude/commands/next-episode.md` | `countryballs-video/CLAUDE.md` |
| whatif | `whatif-video` | `whatif-video/.claude/commands/next-episode.md` | `whatif-video/CLAUDE.md` |
| fakta | `fakta-video` | `fakta-video/.claude/commands/next-episode.md` | `fakta-video/CLAUDE.md` |

Those files were written for the Windows laptop. **Where they and this file disagree, this file wins.**
Everything about content, quality, facts, voice, quota, the locked template and the mandatory checks stays exactly as written there.

## 1. What is different in the cloud

**Paths.** Run commands from inside the project folder (`cd <project folder>`), as the instructions assume.
| The instructions say | Use here |
|---|---|
| `C:\Users\...\claude video\PROJECT_LOG.md` | `shared/PROJECT_LOG.md` (from a project folder: `../shared/PROJECT_LOG.md`) |
| `C:\Users\...\claude video\FLAG_PAIR_BANK.md`, `WHATIF_BANK.md`, `FAKTA_BANK.md` | the same file names in `shared/` |
| "scratchpad" | `$RUNNER_TEMP` |

**Shell.** Bash only. No PowerShell, no Windows paths, no `Start-Sleep`.

**Gemini key.** It is already in the environment as `GEMINI_API_KEY`. Skip the PowerShell line that loads it.
Never print it, echo it, write it to a file or pass it as an argument. Countryballs has no key and needs none (Kokoro only).
First command of a What If or Fakta run: `[ -n "$GEMINI_API_KEY" ] && echo key present || echo key missing`.
If it is missing, stop (section 3, reason `GEMINI_API_KEY missing`).

**Quota counter.** `.tts-quota.json` in this repo only counts cloud requests. While the laptop is still running
its own daily episodes, it uses the same Google quota without this file knowing. Keep to the per-run request limit
in the instructions; if Google answers that the daily limit is reached, that is the normal "quota is out" stop.

**WebGL (What If kit stills).** There is no GPU. Wherever the instructions say `--gl=angle`, use
`--gl=swangle` (software rendering). It is slow. Keep stills to the ones the instructions ask for.

**Background processes.** Anything you start in the background is killed the moment your session ends. Never end
your session while a process you started is still running, and never rely on being "notified" later
(run 44103438051, 17 Nov: a What If render was started in the background, the session ended, no MP4).

**What If full render: hand it to the workflow (render hand-off).** Do NOT run the full
`npx remotion render ... renders/WhatIf_EpNNN.mp4` yourself, in the foreground or the background.
- *Part 1* (your normal run): do step 5 up to the render: register the episode, write `kNNN.tsx`, lint, stills,
  the `git status` template check below, credits, `uploads/EpNNN.txt`. Then set the state file to
  `"step": 5, "note": "render handed to workflow"` and write
  `ci-out/result.json` = `{ "status": "render", "episode": "EpNNN", "composition": "Kit-kNNN" }` (the exact composition
  id you registered) and end your session. The workflow renders with `--gl=swangle` (up to 95 minutes, retried with
  one Chrome tab if it fails) and then starts part 2. A resumed state at step 5 whose MP4 is missing: hand off again.
- *Part 2* (prompt says "Part 2"): `renders/WhatIf_EpNNN.mp4` exists, made by the workflow from the state file's
  episode. Do not render. Continue with step 6 (mandatory checks) and section 2 below, then write the normal final
  `ci-out/result.json`. If a check fails because of the picture and you can fix it in the episode's own files, fix it,
  set the state to `"step": 5, "note": "render handed to workflow"`, delete the MP4 and stop with a `check-needed`
  result ("visual fixed, needs a new render"): the next run hands the render off again.
- If the workflow's render fails, it writes the CHECK NEEDED line and keeps the state; the next run hands off again.

**Tools already installed by the workflow** (do not install or rebuild them): Node, ffmpeg and ffprobe on PATH,
whisper.cpp 1.5.5 with its model in the folder the scripts expect (`main.exe` there is the Linux program under a
Windows name, on purpose), Chrome for Remotion, the project's `node_modules`, the music folder.
If one of them is truly missing, stop (section 3) and name it. Never edit the scripts to work around a missing tool.

**The byte-identical check against old stills** (What If: `renders/stills/Ep001V3_f*.png`): skip it. Those files were
made on Windows and never match Linux pixels. Instead run `git status --short` before you finish and confirm you changed
no template file: only new episode files, the allowed registration lines, uploads, credits, state, quota, banks and log.
If a template file shows as modified, restore it with `git checkout -- <file>` and solve the problem inside the episode's own files.

**Old episodes' audio is not in the repo.** Only new work is. Do not try to render or re-check old episodes.

**Work in progress.** If `.episode_state.json` exists, resume as the instructions say. Voice takes and renders from the
earlier run are restored from a cache when it still exists; if a file the state says is done is missing, redo that step
(this may cost Gemini requests: respect the limits).

**Git.** Do not commit, push, create branches or tags, or touch `.github/`, `ci/` or `tools/`. The workflow commits for you.

## 2. Where your job ends

Do the instructions' steps up to and including the **mandatory checks**, plus the bank mark, the credits, and
`uploads/EpNNN.txt`. Then:

- **Do NOT do** the Drive step, the publish-time step, the queue row or the Uploads/tracking row. There is no Google
  Drive and you have no spreadsheet access. The workflow does all of that after you finish (`ci/deliver.mjs`):
  it uploads the MP4 as a GitHub Release, checks the public download, writes both spreadsheet rows with the same
  read-back rules, and adds its own delivery line to the log.
- **Publish time** is already decided: read `publishAt` from `ci-out/context.json`. Use that date wherever the
  instructions want the publish date (for example the What If style target, or "queued for" in the log entry).
  Never compute it yourself, and never take it from the state file. (The workflow decides it at the start of the run:
  a resumed episode keeps the state's `publishAt` only while it is still ahead; if it has passed it is recomputed
  with the normal rule, day after the latest queued date or run start date + 1, and the state file is updated.)
- **Log entry:** write the normal 3-line entry in `shared/PROJECT_LOG.md` exactly where the channel's instructions say,
  but leave out the Drive ID and the row numbers (the delivery line adds the video link and rows). Write
  "ready for <publish date>" instead of "queued for". In a TEST run start the entry with `TEST RUN (cloud):`.
- Delete `.episode_state.json` (the episode is finished on your side).
- **Write `ci-out/result.json`** (this is how the workflow knows what to deliver):

```json
{ "status": "ready", "episode": "Ep014", "topic": "<the Topic text for the Uploads sheet, as earlier rows of this channel do it>" }
```

  Topic examples: countryballs `JP→BD, NL→LU, IT→MX, PL→ID` or `Size duel: TH vs ES, DZ vs GL, JP vs DE, BR vs AU`;
  What If `What if a whale swallowed you? (Round 3 #24, Real survivor, style D)`;
  Fakta `Kalimantan: satu pulau, tiga negara (geography, bank #5)`.
  The MP4 must be at the usual place: `countryballs-video/renders/EpNNN.mp4`, `whatif-video/renders/WhatIf_EpNNN.mp4`
  or `fakta-video/renders/Fakta_EpNNN.mp4`.
- Finish with the usual report (under 80 words). Say the episode is ready for delivery; never say it is published.

## 3. When you must stop

Follow the instructions' own stop rules (CHECK NEEDED line in `shared/PROJECT_LOG.md`, keep the state file). Then also write:

```json
{ "status": "check-needed", "episode": "Ep014", "reason": "<the same reason as in the log>" }
```

For a clean quota stop use `"status": "waiting-quota"` with the reset time in `reason`.

**Retry after a stop (the workflow handles it, `ci/stop-retry.mjs`).** After a `check-needed` stop the workflow keeps
`cloudStop` in the state file. The next run always tries once more; if that try stops again, later runs do not start
you at all until a new commit (a fix) changes this channel's project folder, `ci/` or `.github/`, and then you try once
more. When `ci-out/context.json` has `"retryAfterStop": true`: the workflow has already reset the attempt counters
(`voiceAttempts`) and removed `cloudStop`; redo the stopped step from its start with the instructions' normal limits
(quota limits still apply), as if it had not been tried. If it fails again, write the CHECK NEEDED line again with
`(retry after stop)` at the end, and the `check-needed` result. Never edit `cloudStop` yourself.

**A `note` in the state file** (written by the owner or the maintainer after a fix) says how to resume: follow it,
as long as it does not break a rule in this file or the instructions.
Always leave a `ci-out/result.json`, whatever happens: the workflow treats a missing file as a crash.

## 4. TEST runs

Everything above is the same: a real episode, real checks, real Gemini requests within the limits.
The differences are handled by the workflow (a "Queue Test" tab that Zapier does not watch, a pre-release, a separate
`test/...` branch instead of `main`). You only add the `TEST RUN (cloud):` prefix to the log entry.
