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
{ "status": "ready", "episode": "Ep014", "topic": "<the Topic text for the Uploads sheet, as earlier rows of this channel do it>",
  "checks": { ... every mandatory check with its numbers, see "Mandatory checks in the result file" below ... } }
```

  Topic examples: countryballs `JP→BD, NL→LU, IT→MX, PL→ID` or `Size duel: TH vs ES, DZ vs GL, JP vs DE, BR vs AU`;
  What If `What if a whale swallowed you? (Round 3 #24, Real survivor, style D)`;
  Fakta `Kalimantan: satu pulau, tiga negara (geography, bank #5)`.
  The MP4 must be at the usual place: `countryballs-video/renders/EpNNN.mp4`, `whatif-video/renders/WhatIf_EpNNN.mp4`
  or `fakta-video/renders/Fakta_EpNNN.mp4`.
- Finish with the usual report (under 80 words). Say the episode is ready for delivery; never say it is published.

### Mandatory checks in the result file (owner, 18 Nov 2026)

Run every mandatory check of the channel's instructions YOURSELF, in this session, on the final MP4, and write each
into `result.json` under `checks`, with `"pass": true` and the numbers the tool printed (copy them, never estimate).
A part 2 that only reads the log of part 1 is not a check. Voice: run whisper again on every final voice clip (What If: the clips in `public/voices/epNNN`, with the whisper binary and model the scripts use; Countryballs: `check-voices.mjs`) and compare with the script. Required keys (What If and Fakta: all; Countryballs: all
but `lineJoins`):

```json
"checks": {
  "voice":     { "pass": true, "lines": 9, "matched": 9, "tool": "whisper", "detail": "<the tool's summary line>" },
  "loudness":  { "pass": true, "lufs": -14.3 },
  "truePeak":  { "pass": true, "dbtp": -2.2 },
  "length":    { "pass": true, "seconds": 45.2 },
  "silence":   { "pass": true, "longestSeconds": 0, "detail": "silencedetect -50dB d=1: none" },
  "lineJoins": { "pass": true, "detail": "<voice-clean check output>" },
  "facts":     { "pass": true, "sources": 8, "detail": "<self-test summary, or: every row of EpNNN.md has its source>" },
  "file":      { "pass": true, "video": "h264 1080x1920", "audio": "aac", "decodeErrors": 0 },
  "visual":    { "pass": true, "stills": 11, "beats": 9, "issues": [], "fixed": ["<what you fixed before release>"] }
}
```

After you finish, the workflow (`ci/verify.mjs`) measures the MP4 again itself (ffprobe, decode, length, loudness,
true peak, silence), re-runs the What If line-join check and episode self-test and the Countryballs whisper check,
and compares your numbers with its own (loudness within 0.5 LU, true peak 0.6 dB, length 0.5 s). A missing check,
a missing number, a failed check or a mismatch = CHECK NEEDED: nothing is released, the state file is written back
and the next run resumes at the checks (the render is kept). So a check you skip only delays the episode.

**Visual sanity check (every channel, owner 18 Nov 2026, after What If Ep015 showed cactuses on Mars).** Before the
render (stills of every beat or round, as the instructions already ask) AND on the final MP4 (one frame per beat or
round: `ffmpeg -ss <mid-beat seconds> -i <mp4> -frames:v 1 -vf scale=360:-1 $RUNNER_TEMP/v_<n>.png`, then look at each
one), check that nothing on screen is factually wrong for the setting or the script:
- plants, trees, cactuses, grass, water, animals, clouds or a blue Earth sky where they cannot be (space, the Moon,
  Mars, inside a body...); a big Earth-like moon on Mars; Earth landmarks in the wrong place;
- Countryballs: every flag and emblem right for its country, colours in the right order, nothing mirrored;
- Fakta: map shapes, borders, labels and the place names right;
- boards, counters and labels: only sourced values, in a logical order, units right, never a number on screen that
  contradicts the voice (e.g. a "34 km" length board before the "2,000 km" one);
- text: spelling, nothing cut off, nothing under the captions or in the top 10% / bottom 20%.
Fix anything wrong in the episode's own files before release (a kit place may get a new opt only when the default
look stays byte-identical, e.g. the desert's `mars` opt). Write what you checked into `checks.visual` (`stills` >=
`beats`). An issue you cannot fix = CHECK NEEDED; never release with an open visual issue.
For What If, a problem found in part 2 means a new render: follow "Part 2" above (stop with check-needed, the next run
hands off again).

**Resuming at the checks.** A state file with `"status": "check-needed"` and a note from the workflow's verification
means the render already exists in `renders/` (What If: do NOT hand off again while the MP4 is there): run all the
checks, fix only what fails, then write the full result.

**Stock episodes (owner, 21 Nov 2026).** A run may have a second round (`Round 2` in the workflow summary) that makes
one more episode for the 3-day stock. For you it is a normal episode: take `publishAt` from `ci-out/context.json`
as always. The workflow may release it but hold it back from the queue (upload limit); then it is queued later with
a new publish date. So in the log entry write "ready for <publishAt> (may be held as stock)" when `Round: 2`.

## 2b. Redo of an episode that is already queued (owner request)

`ci-out/context.json` has `"redo": "EpNNN"` and `"redoNote"` (what the owner wants fixed). The episode was already
delivered; its old video may be scheduled on YouTube. Then:
- Do not pick a premise, do not mark the bank, do not change the script, the voice text or the voice takes (they
  passed their checks; the voice files come back from the work-in-progress cache). Only if they are missing may you
  re-take the voice, within the quota limits. If you do, say so in the log entry and `redoReason` ("new voice take, N Gemini requests"):
  never write "voice unchanged" or "0 requests" when `.tts-quota.json` or `epNNN.voices.json` changed (18 Nov: that happened).
- Write `.episode_state.json` = `{ "episode": "EpNNN", "redo": true, "step": 5, "publishAt": <context publishAt>,
  "note": "<redoNote>" }` first, so a stop can be resumed.
- Fix what the note says in the episode's own files (the maintainer may already have committed the fix: then check it).
  Run the instructions' lint and stills of every beat, the visual sanity check, credits and `uploads/EpNNN.txt`
  (keep the title unless the note asks otherwise).
- Render as usual (What If: render hand-off, part 1 / part 2), then every mandatory check with numbers.
- `result.json` as usual plus `"redo": true, "redoReason": "<a few words, e.g. Mars look and board order fixed>"`.
  The workflow then makes a NEW release (`<channel>-EpNNN-v2`), marks the old queue row
  `EpNNN (REMOVED <date>, owner: <reason>, new upload)` with Publish at cleared and the old Uploads row
  `Removed (...)` with Planned date cleared (as the owner's earlier removals), and writes new rows with the same
  publish time, so Zapier uploads the fixed video. Log entry: `- **<Channel> EpNNN REDO (<date>):** <what was fixed>`,
  then the usual numbers line, "ready for <publish date>".
- A state file with `"redo": true` (a redo that stopped) is resumed the same way, also in a scheduled run, and its
  result must still say `"redo": true`.

**Automatic rewording of a voice line (owner, 21 Nov 2026; all three channels).** When a voice line still fails the
whisper check after the retries the channel's instructions allow (Countryballs: 2 Kokoro retries; What If / Fakta: the
single-line re-take and the whole-block re-take), do NOT stop yet. Reword that line ONCE, automatically:
- Same meaning, same joke or point, same facts. Use simpler, clearer words that whisper cannot mishear: avoid a leading
  "an"/"a"/"the", homophones (scented/centred, son/sun), numbers that may come back as digits or another word, rare
  words and names that are not in the picture. Keep the length about the same (the line must still fit its beat;
  What If / Fakta: the episode length rule still applies).
- Keep the fact checks: the new wording must still be true as checked in the episode's fact file (`EpNNN.md`, FACTS);
  if it adds or changes a claim, check that claim the normal way and add its source.
- Change the line everywhere it lives: the episode data (spoken text and caption text), the bank row if the line came
  from a bank, the voice direction file, and anything that quotes it (uploads text, title).
- Re-take only that line (Gemini channels: within the per-run request limit and the quota; if there is no quota left,
  stop as `waiting-quota`, not CHECK NEEDED), then run the whisper check and the join check again.
- Log it, always, on its own line in `shared/PROJECT_LOG.md` (right under the episode's entry, or at the end if the run
  stops): `AUTO-REWORD: <Channel> EpNNN <line id>: "<old>" -> "<new>" (whisper heard "<what it heard>"; <passed | failed>)`,
  keep `"rewords": [{ "line", "old", "new", "heard" }]` in the state file, and add the same list to `result.json`.
- Only if the reworded line ALSO fails: CHECK NEEDED with both wordings and what whisper heard each time.
One rewording per line per episode; never reword a line that passed, and never change a line just to make it shorter.

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
