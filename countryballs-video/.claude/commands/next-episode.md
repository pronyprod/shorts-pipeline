---
description: Make the next countryballs episode unattended (resume, bank, facts, voices, render, checks, Drive, queue, log) with no questions
---

Make the NEXT "Flag Family" episode from start to finish. Never ask the owner anything: decide, and put anything uncertain in the log entry. Stop only where this file says stop. A stop means: write `CHECK NEEDED: <episode> <reason>` in `PROJECT_LOG.md` (end of section 10g, one line, not twice for the same reason), keep the state file, and report. Read `CLAUDE.md` first and follow it. Run everything from the `countryballs-video` folder.

**Template is locked.** Add only episode content: `src/countryballs/episodes/epNNN.ts` and its voices, one row in `episodes/index.ts` (or `formats/index.ts`), one `<Composition>` in `src/Root.tsx`, `src/countryballs/episodes/EpNNN.md`, `uploads/EpNNN.txt`, `.episode_state.json`, and the `CREDITS.md` rows. Never edit components, `formats/`, `theme.ts`, `music.ts`, `emblems.ts` or any existing episode. Leave out the `template` field so the episode uses the latest. Don't commit to Git.

## 0. Resume
State file: `.episode_state.json` in this folder, holding `episode`, `step` (the last step finished), and once known `driveFileId`, `publishAt`, `reason`. Create it when step 1 chooses NNN, update it after every step, delete it after step 11.
- **Stock first:** if the file has a `stock` list, take its oldest entry, do steps 6-11 for that episode, remove it from the list, and end the run. One episode per run, so one per day; make no new episode until the list is empty. Delete the file when the list is empty and nothing else is in it.
- **Stock mode** runs only when the owner asks: steps 0-5, then add `{"episode": "EpNNN", "step": 5, "status": "rendered, not queued"}` to `stock`, with no Drive copy, sheet row, log or DONE mark.
- If it has an `episode`, finish that episode from the next step instead of starting a new one. Redo any check that failed.
- Before redoing step 6, 8 or 9, look first: if the file or that episode's row is already there, keep it and move on. Never add a second one.

## 1. Pick the rounds
Bank: `C:\Users\<user>\claude video\FLAG_PAIR_BANK.md`.
- NNN = the lowest episode number with no `src/countryballs/episodes/epNNN.ts`.
- Count the unused pairs: no episode file and no row marked DONE has used them, and they are `ready`-tagged or from the original 32 (#32 only if #17 isn't used). If fewer than 4 are left (an episode needs 4), do the bank top-up below first.
- Use that number's row in "Suggested episodes", or its rows in "Next 12 episodes" (Ep009-Ep020). If it has neither, build 4 rounds from unused pairs (start with the "Spare" row, then auto-added `ready` items).
- Twins are normal episodes. Reverse quiz, size duel and words use `src/countryballs/formats/` (data types in `formats/types.ts`, example in `episodes/formattest.ts`): the episode's data has `format` on every round, it's registered in `formats/index.ts`, and its `<Composition>` uses `FormatEpisode` with `calculateFormatMetadata`. Size duel intro = `A or B?`. Words intro = `The word is <word>.`; foreign words go on screen only, never in the voice.
- **Timely slot:** if NNN is divisible by 5, follow the bank's "Timely slot" rule: at least one round about a country or flag in the news or a current date, with a source from the last 30 days, nothing political or tragic. If nothing passes, make a normal episode and write "no timely topic found" in the log line and the report.
- Skip any pair that is politically disputed or fails step 2, and swap in an unused spare.
- Reorder rounds until all of these hold:
  - no parent or child reaction repeats in consecutive rounds
  - no two consecutive rounds share a reveal colour (set `childColor` from the flag's SVG in `public/flags/4x3/`, and use it for ties)
  - the first round differs from the previous episode's first round in both parent flag and reveal colour
- Music: the track after the previous episode's in `ROTATION` (`music.ts`), wrapping round. Never the previous episode's track, never "This Old Man".
- When the episode is finished, add `**(DONE: EpNNN)**` to its row in the bank, or to each spare used, and to any earlier row that has an episode file but no mark. Re-read the bank right before editing.

### Bank top-up (only when step 1 sends you here)
Add 10 new items to the bank, in a new section "Auto-added YYYY-MM-DD", each marked **auto-added, not yet reviewed by owner**. Re-read the bank right before editing.
- Follow the bank's rules: original pairs and jokes (none from Ep001's or GeoTurk's excluded lists, none already in the bank), no disputed pairs, verifiable facts, a clear payoff, nothing depressing. Vary the sub-formats, and don't put two of the same next to each other.
- Sub-formats: **twins** (near-identical flags), **reverse quiz**, **size duel**, **words in different languages** (with our own puns; never offensive or political mishearings).
- Tag each item:
  - `ready`: fits a normal round or a format in `formats/`. Give it the same columns as its section in the bank.
  - `needs template`: needs visuals that don't exist yet. List it as an idea only; never make it, and never add code for it while the template is locked.
- At least 4 of the 10 must be `ready`, with their flags checked as in step 2 before they are added.
- Note a source for each size, population or translation, or drop the item.
- Then continue with step 1. If there still aren't 4 usable pairs, **stop** (reason: bank too small). Say in the log and the report that auto-added items were added or used.

## 2. Check every claim
Write `src/countryballs/episodes/EpNNN.md` with one row per round: pair, punchline, what changed, how it was checked.
- Open both SVGs in `public/flags/` and confirm the difference the punchline describes.
- Any claim about the real world (dates, events, "matched at the Olympics") needs a source found on the web, with its URL.
- If a claim can't be verified, use the bank's alternative punchline, or write a new one (3-6 words, deadpan, about the visual difference). If it still fails, drop the pair and use a spare.

## 3. Voices
This project uses **Kokoro only** (local, no quota): `node --no-warnings scripts/generate-voices.mjs epNNN`. Never call Gemini here and never use `GEMINI_API_KEY`.
If voice generation fails, **stop** (reason: voices).

Check the voices now, so a retry never needs a new render: `node --no-warnings scripts/check-voices.mjs epNNN`. It ignores case and punctuation, allows small differences in proper nouns (country names), treats known homophones as matches (list in `scripts/voice-match.mjs`), and passes a line when at least 90% of its words match.
- For each line in its `Failed:` list, redo only that line with Kokoro: `node --no-warnings scripts/generate-voices.mjs epNNN --line <clip> --attempt 1`, then check again. If it still fails, do the same with `--attempt 2`.
- That's 2 retries per line at most. Keep the count in the state file as `voiceAttempts`, so a resume doesn't start over.
- If a line still fails after that, **stop** (reason: voice line `<clip>`).
If `CLAUDE.md` ever gains a quota rule, it replaces this step: only its model and maximum requests, at least 20 s between calls, key from the environment only, never printed or saved. If that quota is out, stop cleanly and say when it resets.

## 4. Render and check
1. Run `npx tsc --noEmit`.
2. Reaction stills, one per round. Bundle once with `npx remotion bundle --out-dir <scratchpad>/bundle`, then run `npx remotion still <scratchpad>/bundle EpNNN out.jpeg --frame=F --scale=0.5` for each round. Never use `render --frames` with a list: it crashes on audio.
   - `punch = max(2.8, 2.4 + me + 0.12)`; a round lasts `ceil(max(4.5, punch + line + 0.25) × 30)` frames; `F = round start + round(punch × 30) + 9`. Values come from `epNNN.voices.json`. For format episodes, take `punchAt` and `formatRoundFrames` from `formats/timing.ts`.
3. Look at every still. Check the flags are right, the emblem is visible, the caption is big and clear of the child, and nothing important sits in the top 10% or bottom 20%.
   - Caption too small (any line over about 16 characters): shorten the punchline, then redo the voices.
   - Eyes cover an emblem: set `childEyes` or `parentEyes` in the episode data.
4. Render: `npx remotion render EpNNN renders/EpNNN.mp4 --codec=h264`, with output sent to a log file, not a pipe.
5. Add the `CREDITS.md` table row and credit line for the track.
6. Write `uploads/EpNNN.txt` with exactly these five labels, one per line, and nothing else:
   - `Title:` a hook under 60 characters, not used by an earlier episode
   - `Hook line:` one short sentence
   - `Episode hashtags:` 1-2 only (the spreadsheet adds the core ones)
   - `Music:` "Track" by Artist
   - `Pinned comment:` a question that makes people comment; never "like/share/subscribe if", "tag a friend" or vote-bait

## 5. Mandatory checks
All must pass before anything is queued. If any fails, do NOT queue: **stop** with the failed check as the reason. Don't touch the template.
- **Voices:** run `node --no-warnings scripts/check-voices.mjs epNNN` once more on the final clips. It must end with "All N lines match". No new retries here: the 2 retries belong to step 3. Whisper missing counts as a fail.
- **Loudness:** run `node scripts/loudness.mjs renders/EpNNN.mp4`. Pass = -14 LUFS ±1 and ffmpeg true peak ≤ -1 dBTP.
- **Length:** 15-25 s (always under 3 minutes).
- **Silence:** none over 1 s: `ffmpeg -i renders/EpNNN.mp4 -af silencedetect=noise=-45dB:d=1 -f null -` prints no `silence_start`.
- **Facts:** every row of `src/countryballs/episodes/EpNNN.md` has its check, and every real-world claim has a URL.
- **Playable:** `ffprobe` reads the MP4 without errors and shows one video and one audio stream.

## 6. Drive
Copy `renders/EpNNN.mp4` to this channel's Drive folder (table below). Every 60 s, for up to 20 minutes, search with the Google Drive tool: `title = 'EpNNN.mp4' and parentId = '<folder ID>'`. Done when exactly one file appears with the same size as the local one; save its ID. If it never does, or the Drive tool isn't available, **stop** (log `CHECK NEEDED: Drive sync`).

| Project | Drive folder on G: | Drive folder ID | Queue tab | Time (WIB) | Channel name in sheet |
|---|---|---|---|---|---|
| countryballs-video | G:\My Drive\Country Balls | [drive-id] | Queue Countryballs | 07:30 | Countryballs |
| whatif-video | G:\My Drive\What If | [drive-id] | Queue What If | 07:30 | What If |
| fakta-video | G:\My Drive\Fakta | [drive-id] | Queue Fakta | 19:00 | Fakta Unik |

## 7. Publish time
Spreadsheet: `[SHEET_ID secret]`. Read the "Publish at" column of this channel's queue tab. Use the day after the latest date, or tomorrow (WIB) if that's later, at this channel's time. Format: `'2026-11-12T07:30:00+07:00` (with the leading apostrophe).

## 8. Queue row
Write exactly ONE row to this channel's queue tab, with columns Episode | Title | Description | Video URL | Publish at | Added. Never use `append_values`; this is the method proven with Zapier:
1. Find the next empty row with `get_values` on column A (`'<queue tab>'!A:A`): number of rows returned + 1. Confirm that row is empty.
2. Write the whole row with `update_formulas` to `'<queue tab>'!A<row>:F<row>`.

Cells:
- Episode = `'EpNNN` (leading apostrophe). Title = from `uploads/EpNNN.txt`. Added = `YYYY-MM-DD HH:MM (Claude)` in WIB.
- Description = Hook line + blank line + `Voiceover: AI` + new line + `Music: "<track>" by <artist> (YouTube Audio Library)` + blank line + this channel's core hashtags (Hashtags tab) + the episode hashtags.
- Video URL = `https://drive.google.com/uc?export=download&id=<Drive file ID>`
- Never edit or delete existing rows, never touch row 2, never change the columns.
- Publish at = the value from step 7, with its leading apostrophe.
- Read the new row back with `get_values`. Episode and Publish at must come back exact, with no apostrophe (Zapier then gets `2026-11-12T07:30:00+07:00`). If it's wrong, **stop** and leave the row for the owner.

## 9. Tracking
Write one row to the Uploads tab the same way as step 8: next empty row from `get_values` on `Uploads!A:A`, whole row with `update_formulas` to `Uploads!A<row>:Q<row>`, then read it back. Cells A to Q: Channel, Episode (`'EpNNN`), Topic (pairs like `JP→BD, NL→LU`), Video file (`countryballs-video/renders/EpNNN.mp4`), Title, Hook line, Music (`"Track" by Artist`), Episode hashtags, Full description (same as step 8), Status `Ready`, Planned date (publish date, `'YYYY-MM-DD`), five empty strings (L-P), Pinned comment.

## 10. Log
Re-read `C:\Users\<user>\claude video\PROJECT_LOG.md` right before editing. It's also edited from elsewhere, so make one small edit. Add exactly 3 lines at the end of section 10g, just above `## 11. Open questions`:
- episode number, the 4 pairs, music
- file path, length, LUFS
- anything uncertain, or "nothing uncertain"

Then add the DONE mark to the bank (step 1).

## 11. Report
Finish with a report under 80 words: episode, length, loudness, music, publish date, and anything the owner should check. Say it's queued; never call it published.
