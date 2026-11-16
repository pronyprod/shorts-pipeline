# shorts-pipeline

Daily Shorts for three channels (countryballs, What If, Fakta), made by Claude Code on GitHub Actions so the
laptop can be off. One run = one episode for one channel: Claude writes, voices, renders and checks it; the
workflow then publishes the MP4 as a GitHub Release, puts its download link in the spreadsheet queue (Zapier
uploads from there) and commits the state back here.

## What is where

| Path | What |
|---|---|
| `countryballs-video/`, `whatif-video/`, `fakta-video/` | The three Remotion projects, identical to the laptop copies (minus renders, voices, music, node_modules) |
| `shared/` | `PROJECT_LOG.md` and the three topic banks |
| `ci/CLOUD_RULES.md` | What Claude does differently in the cloud (read first by every run) |
| `ci/setup.sh` | Installs ffmpeg, whisper.cpp, Chrome, fonts and unpacks the music on the Linux runner |
| `ci/sheet.mjs` | Spreadsheet: publish time, queue row, Uploads row, with read-back checks |
| `ci/deliver.mjs` | Release upload, public download check, spreadsheet rows, log line |
| `assets/*.enc` | The music, encrypted (the YouTube Audio Library licence does not allow sharing the files) |
| `tools/` | Laptop-side helpers: sync from the laptop folders, redaction, secrets scan, music packing |
| `.github/workflows/episode.yml` | The daily workflow + the manual "Run workflow" button |
| `.github/workflows/env-check.yml` | Manual check of the Linux setup, without Claude |

## Secrets (Settings > Secrets and variables > Actions > New repository secret)

| Name | What | Where it comes from |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Lets the run use the Claude Pro subscription | `claude setup-token` in a terminal on the laptop |
| `GEMINI_API_KEY` | Voices for What If and Fakta | The same key the laptop uses (Google AI Studio > API keys) |
| `GOOGLE_SA_JSON` | Lets the run write the spreadsheet | The service account key file (whole content) |
| `SHEET_ID` | Which spreadsheet | The long code in the sheet's address, between `/d/` and `/edit` |
| `ASSETS_KEY` | Unlocks the music | The one line in `shorts-pipeline-secrets/ASSETS_KEY.txt` on the laptop |

Never put any of these in a file in this repo or in a chat.

## Running it

- **Test:** Actions > Daily episode > Run workflow > pick a channel, leave "Test mode" ticked. It makes a real
  episode but writes to the `Queue Test` and `Uploads Test` tabs (Zapier does not watch them), marks the release
  as a pre-release and pushes its changes to a `test/...` branch. `main` and the real queue are untouched.
- **Real, by hand:** the same button with "Test mode" unticked.
- **Daily schedule:** off until the repository variable `CLOUD_SCHEDULE` is `on`
  (Settings > Secrets and variables > Actions > Variables). Times: countryballs 19:20, What If 20:20, Fakta 21:20 WIB.
  Turn it on only when the laptop's scheduled tasks are turned off, or both will make the same episode.

## Rules the cloud keeps

- Publish date = the day after the latest date in the queue, or the day after the run's START date (WIB) if
  that is later. Decided when the run starts, never when it finishes.
- Queue and Uploads rows: next empty row, whole row in one write, leading apostrophes on Episode / Publish at /
  Planned date, row 2 never touched, read back and compared; any difference stops with `CHECK NEEDED` in the log.
- A failed delivery is remembered in `ci/pending/` and retried by that channel's next run before anything new.
- Nothing is committed without passing `tools/scan.sh` (keys, tokens, personal details, Drive IDs, music files).

## Master copy

Since 16 Nov 2026 this repo is the master copy: new episodes exist only here, not in the laptop folders.
The file `CLOUD_IS_MASTER` makes `tools/sync-from-laptop.sh` refuse to run, because a sync would wipe them.
