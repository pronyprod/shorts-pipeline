# shorts-pipeline

Daily Shorts for three channels (countryballs, PomProds, Fakta), made by Claude Code on GitHub Actions so the
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
| `ci/youtube.mjs` + `.github/workflows/youtube.yml` | Posts the comment on each new video and fills the Tracking numbers (no Claude) |
| `tools/yt-login.mjs`, `tools/yt-local.mjs` | Laptop: one-time YouTube login per channel; run the YouTube jobs locally |

## Secrets (Settings > Secrets and variables > Actions > New repository secret)

| Name | What | Where it comes from |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Lets the run use the Claude Pro subscription | `claude setup-token` in a terminal on the laptop |
| `GEMINI_API_KEY` | Voices for PomProds and Fakta | The same key the laptop uses (Google AI Studio > API keys) |
| `GOOGLE_SA_JSON` | Lets the run write the spreadsheet | The service account key file (whole content) |
| `SHEET_ID` | Which spreadsheet | The long code in the sheet's address, between `/d/` and `/edit` |
| `ASSETS_KEY` | Unlocks the music | The one line in `shorts-pipeline-secrets/ASSETS_KEY.txt` on the laptop |
| `YT_CLIENT_ID`, `YT_CLIENT_SECRET` | The Google Cloud OAuth client (Desktop app) for the YouTube jobs | `node tools/yt-login.mjs paste-file` writes all five values to a file outside the repo |
| `YT_REFRESH_COUNTRYBALLS`, `YT_REFRESH_WHATIF`, `YT_REFRESH_FAKTA` | One long-lived YouTube login per channel (Country Flux, PomProds, FaktaMantra) | `node tools/yt-login.mjs <channel>` once per channel, then `paste-file` |

Never put any of these in a file in this repo or in a chat.

## Running it

- **Test:** Actions > Daily episode > Run workflow > pick a channel, leave "Test mode" ticked. It makes a real
  episode but writes to the `Queue Test` and `Uploads Test` tabs (Zapier does not watch them), marks the release
  as a pre-release and pushes its changes to a `test/...` branch. `main` and the real queue are untouched.
- **Real, by hand:** the same button with "Test mode" unticked.
- **Daily schedule:** off until the repository variable `CLOUD_SCHEDULE` is `on`
  (Settings > Secrets and variables > Actions > Variables). Times: countryballs 19:20, PomProds 20:20, Fakta 21:20 WIB.
  Turn it on only when the laptop's scheduled tasks are turned off, or both will make the same episode.

## YouTube comment and tracking (`youtube.yml`, no Claude)

- **Comment:** 07:35 WIB (Country Flux, PomProds) and 18:05 WIB (FaktaMantra), each with a second try an hour
  later. For every Uploads row of today or yesterday whose publish time has passed, it finds the video on the
  channel (by title, else by publish day) and posts the "Pinned comment" text (column Q) as the channel.
  Never twice: Uploads column R ("Auto comment") is the record, and a video that already has a comment from the
  channel itself is skipped. It also writes the video link into column M. **The API cannot pin a comment**:
  pinning is a manual tap (comment > three dots > Pin).
- **Tracking:** 09:40 WIB. For every YouTube row in the Tracking tab dated 3 or more days ago with an empty
  number, it fills only the empty cells: E views, G average % viewed, H subscribers gained, J average view
  duration in seconds (and a note in I if empty). Typed numbers are never changed and no row is moved. It
  waits a day when YouTube Analytics (2-3 days behind) has not finished processing the video's first days.
  "Views at 48h" is the nearest the API gives: whole Pacific-time days from the publish day to the day that
  holds publish + 36 h (about 55 h for the 07:30 channels, 45 h for the 18:00 one).
  **Column F "Stayed to watch %" is not filled:** the API has no such number (engaged views / views was
  tested against 8 typed rows and does not match). It stays a typed column, read from YouTube Studio.
- **By hand:** Actions > YouTube comment and tracking > Run workflow (dry run is ticked by default).
- **Quota:** a comment costs 50 units, a read 1; a normal day is under 200 of the free 10,000.
- **If a login stops working** (password change, access withdrawn): the run fails and says which channel;
  run `node tools/yt-login.mjs <channel>` on the laptop, then update that one secret.

## Rules the cloud keeps

- Publish date = the day after the latest date in the queue, or the day after the run's START date (WIB) if
  that is later. Decided when the run starts, never when it finishes.
- Queue and Uploads rows: next empty row, whole row in one write, leading apostrophes on Episode / Publish at /
  Planned date, row 2 never touched, read back and compared; any difference stops with `CHECK NEEDED` in the log.
  Log tags: `CHECK NEEDED` = something to look at; `CLAUDE LIMIT` = the Claude usage/rate limit stopped a run before it made anything (nothing to fix, the next run makes the episode); `CLEARED <date>` = an old CHECK NEEDED that turned out harmless.
- A failed delivery is remembered in `ci/pending/` and retried by that channel's next run before anything new.
- Nothing is committed without passing `tools/scan.sh` (keys, tokens, personal details, Drive IDs, music files).

## Master copy

Since 16 Nov 2026 this repo is the master copy: new episodes exist only here, not in the laptop folders.
The file `CLOUD_IS_MASTER` makes `tools/sync-from-laptop.sh` refuse to run, because a sync would wipe them.
