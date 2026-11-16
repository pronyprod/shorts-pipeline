---
description: Make the next What If episode end to end and queue it, unattended, with no questions to the owner
---

Make the NEXT episode end to end and queue it. This runs unattended: do not ask the owner anything. Follow `CLAUDE.md`
(template locked, except the 11 Nov style kit below) throughout.

This channel:

| Project | Drive folder on G: | Drive folder ID | Queue tab | Time (WIB) | Channel name in sheet |
|---|---|---|---|---|---|
| countryballs-video | G:\My Drive\Country Balls | [drive-id] | Queue Countryballs | 07:30 | Countryballs |
| whatif-video | G:\My Drive\What If | [drive-id] | Queue What If | 07:30 | What If |
| fakta-video | G:\My Drive\Fakta | [drive-id] | Queue Fakta | 19:00 | Fakta Unik |

Use the row for this project (whatif-video). Spreadsheet: `[SHEET_ID secret]`.

**Owner pivot, 9 Nov 2026 (overrides older rules here and in CLAUDE.md where they conflict):** premises come ONLY from
Round 3 of the bank, and every script follows Round 3's style rules and monetisation guardrails ("you" + danger or an
absurd amount + a real fact or real person; line 1 is the most extreme moment; 40-60 s, see "Voice and length" below). If `.episode_state.json` has
`"restart": true`, the old premise in that episode number was dropped: pick a Round 3 premise, overwrite
`src/whatif/episodes/epNNN.ts` and the voice direction in place (same episode number, same registration), and use the voice
folder named in `ttsOut` instead of `tts-out/epNNN-Puck`. Remove the `restart` flag once the premise is picked.

**Style: the topic picks it (owner, 12 Nov 2026; replaces the weekday rotation).** Every NEW episode is built with the
style kit (`src/kit/`, see CLAUDE.md "Visual style" and "The style kit"). After picking the premise (step 2), give it the
style that fits it best: start from the bank's "Best style (2nd)" column, then judge the actual script:
| Style | Fits | Kit file settings |
|---|---|---|
| **B** (blocky 3D) | almost anything; the default | `style: "B"` |
| **D** (paper cut-out Pom, one continuous camera) | stories, real survivors, journeys through several places | `style: "D"` |
| **A** (flat) | big numbers and side-by-side comparisons | `style: "B", look: "flat"` |
| **P** (pixel) | inside your body, tech, games | `style: "D", look: "pixel"`, a `trail` on every beat |
Soft target only: about 1 D and about 1 A-or-P per 7 days. Check the styles of the last 7 What If episodes in the log; if
that kind is already over the target AND the premise's second choice also fits well, use the second choice. Fit always wins
over the target. Write ONE line in the log entry: `Style: <X> because <why it fits this premise>`. Save the style
(`"A"`, `"B"`, `"D"` or `"P"`) in the state file. Pom is the same character in every style; A and P keep the narrator
(the voiceless option is not used). An episode resumed from the state file that was already rendered keeps its render and
style. Episodes already queued are never re-rendered.

**Voice and length (owner, 12 Nov 2026, after Ep010 was pulled):** 40-60 s. Write the script to about 2.3 words per second
(about 90-135 words in total). The voice is never sped up past 1.05x: if it is too long, cut words from the script and
re-take. Voice direction: clear, unhurried, with punch on the key line (`tts-episode` refuses directions that ask for speed).

**Stopping:** "CHECK NEEDED" below means: append that exact line to
`C:\Users\<user>\claude video\PROJECT_LOG.md`, keep the state file, report the reason, and stop.

## 0. Resume
- State file: `.episode_state.json` in this project: `{ episode, premise, shape, step, driveFileId, publishAt, stopReason }`.
  Write it when the premise is picked and update it after every step below. Delete it only after step 12.
- If it exists, finish that episode first: go back to its `step`, re-using everything already done (cached voice takes,
  renders, `driveFileId`, `publishAt`). Don't start a new episode in the same run.
- If it stopped on a check or on the quota, redo that step once. Same failure: stop again, without a second log line.

## 1. Bank top-up
- Bank: `C:\Users\<user>\claude video\WHATIF_BANK.md`.
- If fewer than 3 unused items remain, first add 10 new ones that follow the bank's rules (rotation of shapes/categories,
  verifiable facts, a clear payoff, nothing depressing; for countryballs use the sub-formats reverse quiz, twins, size duel,
  and words in different languages with our own puns). Mark them "auto-added, not yet reviewed by owner", then continue.
- Give every new idea a "Best style (2nd)" value (the bank's rule: B fits almost anything; D = stories, journeys, real
  survivors; A = flat, big numbers and comparisons; P = pixel, inside your body, tech, games). Keep the mix close to
  the week: most ideas B, about one in seven D, about one in seven A or P.

## 2. Pick the premise
- Episode number = the highest in `src/whatif/episodes` + 1.
- Take the next unused Round 3 item in its order that keeps the rotation: never the same category as the previous
  episode. Skip anything marked disputed. Add it to the bank's "Used in Round 3" line. Then choose its style (see "Style"
  above) and write the one-line reason.
- **Timely slot:** if the episode number is divisible by 5, follow the bank's "Timely slot" rule instead: a premise tied to
  news with a source from the last 30 days, nothing political or tragic, Round 3 style and guardrails. If nothing passes,
  take the next normal premise and write "no timely topic found" in the log line and the report.
- A timely premise has no bank row: choose its style the same way (what fits it best), with the one-line reason.
- **Done elsewhere:** follow the bank's "Done elsewhere" rule. If a big channel has done this premise, note it in the bank
  row and use a different angle, twist and wording. Never copy their script, visuals, jokes or title.

## 3. Research
- Source every fact from the web and record value, note and source in the `FACTS` block of `src/whatif/episodes/epNNN.ts`.
- Compute every number in code, build spoken numbers from those values (`numberWords`), and add a self-test
  (`node src/whatif/episodes/epNNN.ts`) that must pass.
- Drop anything you can't verify. Flag approximations in `FACTS` as APPROXIMATE or UNCERTAIN.
- Ending line: "What should you survive next? The best comment becomes the next video."
- Caption emphasis (owner, 12 Nov): give every script line a `keys` list with at most one key phrase per caption phrase, always a complete unit a person would stress out loud ("1 trillion", "15 seconds", "right now", "never comes back", a name). Never split a number from its unit. Lines with nothing worth stressing get an empty list. See the kit caption engine for the field format.

## 4. Voice
- Puck on `gemini-3.8-flash-tts` ONLY. No 3.1 fallback. At most 10 requests per day, at least 20 s apart.
- The key is read only from the Windows user environment at launch. Never print or save it:
  `$env:GEMINI_API_KEY = [Environment]::GetEnvironmentVariable('GEMINI_API_KEY','User')`
- Write `tests/epNNN_voice_direction.json`: persona and every line's style clear and unhurried, with punch only on the key
  line (never "fast", "quick", "brisk"...: the script refuses them). Then run
  `node --no-warnings scripts/tts-episode.mjs epNNN --voice Puck --max-requests 3 --out tts-out/epNNN-Puck`.
- If lines are flagged, re-check first with `--max-requests 0` (the cached take is free); most flags are checker gaps.
- If the quota is out (exit code 3, or 3.8 at 10/10 in `.tts-quota.json`), stop cleanly, say so, and say when it resets.
  Keep the state file so the next run resumes here.
- Then `node --no-warnings scripts/tts-fit.mjs epNNN --from tts-out/epNNN-Puck --target 56`. It caps the tempo at 1.05x,
  cleans every line the same way (shared noise floor, end bursts and breaths removed, short fades, same loudness) and runs
  the join check. Exit 4 = TOO LONG: cut words from the script (lines and voice direction), re-take, never speed up.
  Exit 1 with "join line N": if it is a re-taken single line that still doesn't match, re-take the whole episode block
  (one request) instead of splicing; if it persists, `CHECK NEEDED: <episode> line joins`, then stop.

## 5. Render
- Register the episode data in `src/whatif/episodes/index.ts` (not in `src/Root.tsx`: kit episodes have no 2D composition).
- Write the visuals file `src/kit/episodes/kNNN.tsx` with the settings for the state file's style (table above) and add it
  to `src/kit/episodes/index.ts`. Copy the pattern of `k007b.tsx` (B), `k008d.tsx` (D), `tFlatA` (A) or `tPixelP` (P)
  in `src/kit/episodes/tests.tsx` (without `untilLine`): one beat per line, places and
  shots from the kit, Pom's expression and pose per beat. New props or places only when the premise needs them, built from
  the kit's low-poly pieces, and never other channels' characters, worlds or catchphrases.
- Lint (`npx tsc`, `npx eslint src`), review stills of every beat (`npx remotion still src/index.ts Kit-kNNN <png>
  --frame=<n> --gl=angle --scale=0.3`; Pom and the board inside the frame, nothing important under the captions or in the
  top 10% / bottom 20%), and confirm `renders/stills/Ep001V3_f*.png` re-render byte-identical.
- Render `npx remotion render src/index.ts Kit-kNNN renders/WhatIf_EpNNN.mp4 --gl=angle`.
- Captions and sound effects are automatic in the kit (owner, 12 Nov): lively captions (`src/kit/liveCaptions.tsx`: word
  pop-in, key word bigger in an accent colour, counting numbers, shake on impact words, bounce on twist/climax lines; pixel
  font in pixel mode) and effects matched to the words and places (`src/kit/sfx.tsx`: whoosh on moves, splash, crowd,
  sizzle, heartbeat, clock, shake, impact, tick, ding, pop, place ambience; about one every 2-4 s, never stacked, under
  the voice). Add a beat's `sfx` only for something on screen the words don't name (e.g. `sfx: ["splash"]` when Pom
  lands in water). Mark the climax line `beat: "climax"` and twist lines `beat: "twist"` so they get the impact/pop and bounce.
- Captions must match the voice, in phrases of 2-5 words, clear of the top 10% and bottom 20%.
- Run `node --no-warnings scripts/credits.mjs epNNN WhatIfEpNNN`. (Same command for kit episodes: the second argument only names the file; the music plan comes from the episode data, as in the kit.)
- Write `uploads/EpNNN.txt` with exactly: `Title:` (under 60 characters), `Hook line:`, `Episode hashtags:` (1-2),
  `Music:`, `Pinned comment:` (a question; never "like/share/subscribe if").

## 6. Mandatory checks before queueing
All must pass. If any fails: do NOT queue; `CHECK NEEDED: <episode> <reason>`, then stop.
- Voice: every line matches the script (whisper, the final recheck in `tts-fit`), none left flagged.
- Loudness: -14 LUFS ±1 and true peak ≤ -1 dBTP (`npm run loudness -- renders/WhatIf_EpNNN.mp4`, ffmpeg line).
- Length: 40-60 s (owner, 12 Nov).
- Line joins: `node scripts/voice-clean.mjs check public/voices/epNNN` passes (no clicks, bursts, breaths or tone jumps
  at any line edge) and `voices.json` says tempo <= 1.05.
- Sound effects: the kit's SFX layer is on (automatic cues + place ambience); the loudness rule above still applies.
- Silence: none over 1 s. `ffmpeg -hide_banner -i <mp4> -af silencedetect=noise=-50dB:d=1 -f null -` prints no `silence_start`.
- Facts: every entry in `FACTS` has a source, and the episode self-test passes.
- File: the MP4 plays. `ffprobe` exits 0 and reports one h264 video stream at 1080x1920 and one audio stream, and
  `ffmpeg -v error -i <mp4> -f null -` prints no errors.

## 7. Drive
- Search first with the Google Drive `search_files` tool:
  `title = 'WhatIf_EpNNN.mp4' and parentId = '<Drive folder ID>'`. Already there (a resumed run): don't copy again.
- Otherwise copy the MP4 to this channel's Drive folder on G:, then repeat the search every 60 s (`Start-Sleep 60` in
  PowerShell), up to 20 minutes, until the file exists. Never: `CHECK NEEDED: Drive sync`, then stop.
- More than one match: `CHECK NEEDED: <episode> duplicate file in Drive`, then stop.
- Save the file ID in the state file, then confirm with `get_file_permissions` that it has `reader` for `anyone` (it inherits
  this from the folder). If not: `CHECK NEEDED: <episode> Drive file not public`, then stop.

## 8. Publish time
- Skip if `publishAt` is already in the state file.
- Read the "Publish at" column of this channel's queue tab. Use the day after the latest date, or tomorrow (WIB) if that's
  later, at this channel's time. Format, with the leading apostrophe: `'2026-11-12T07:30:00+07:00`

## 9. Queue row
- Method proven with Zapier (do NOT use `append_values`): find the next empty row with `get_values` on column A of the queue
  tab, then write the whole row with `update_formulas`, range `'<Queue tab>'!A<row>:F<row>`. Episode and Publish at each start
  with a leading apostrophe, so Zapier receives exactly `2026-11-12T07:30:00+07:00`.
- If this episode already has a row in column A, skip this step.
- Write exactly ONE row, columns:
  Episode | Title | Description | Video URL | Publish at | Added
  - Episode = `'EpNNN`. Title = from `uploads/EpNNN.txt`. Publish at = step 8's value. Added = `YYYY-MM-DD HH:MM (Claude)` in WIB.
  - Description = Hook line + blank line + `Voiceover: AI` + new line + `Music: "<track>" by <artist> (YouTube Audio Library)`
    + blank line + this channel's core hashtags (Hashtags tab) + the episode hashtags.
  - Video URL = `https://drive.google.com/uc?export=download&id=<Drive file ID>`
- Never edit or delete existing rows, never touch row 2, never change the columns.
- Read the new row back. If Publish at shows a literal apostrophe, or any cell differs from what you wrote:
  `CHECK NEEDED: <episode> queue row`, then stop. Don't fix it yourself.

## 10. Tracking
- Same method: find the next empty row with `get_values` on columns A:B of the Uploads tab. If this channel and episode
  already have a row, skip this step.
- Write one row with `update_formulas`, range `Uploads!A<row>:Q<row>`, 17 cells: Channel | Episode (`'EpNNN`) | Topic | Video
  file (`whatif-video/renders/WhatIf_EpNNN.mp4`) | Title | Hook line | Music | Episode hashtags | Full description (the queue
  Description) | Status `Ready` | Planned date (publish date, `'YYYY-MM-DD`) | five empty cells (L-P) | Pinned comment (Q).
- Read the row back the same way. If any cell differs: `CHECK NEEDED: <episode> Uploads row`, then stop.

## 11. Log
Re-read `C:\Users\<user>\claude video\PROJECT_LOG.md`, then append a 3-line entry: episode, file, anything uncertain.

## 12. Report
Delete `.episode_state.json`. Finish with a report under 80 words: premise, shape, length, loudness, requests used, publish
date, anything uncertain.
