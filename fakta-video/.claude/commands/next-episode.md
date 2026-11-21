---
description: Make the next fakta episode unattended, end to end (resume, topic, sources, voice, render, checks, Drive, queue, tracking, log)
---

Make the NEXT fakta episode from start to finish, unattended. Do not ask the owner anything: decide, and record anything uncertain in the log entry. Read `CLAUDE.md` first; its rules apply in full. The template is LOCKED: new episode content only, no changes to components, layout, voice, music system or finalize settings. Never edit `my-video` or `whatif-video`.

"NNN" = the next number after the highest `src/episodes/epNNN-script.ts`, unless step 0 resumes one.

| Project | Drive folder on G: | Drive folder ID | Queue tab | Time (WIB) | Channel name in sheet |
|---|---|---|---|---|---|
| countryballs-video | G:\My Drive\Country Balls | [drive-id] | Queue Countryballs | 07:30 | Countryballs |
| whatif-video | G:\My Drive\What If | [drive-id] | Queue What If | 07:30 | What If |
| fakta-video | G:\My Drive\Fakta | [drive-id] | Queue Fakta | 18:00 | Fakta Unik |

This project is `fakta-video`: use only its row. Spreadsheet: `[SHEET_ID secret]`.

## 0. Resume
Check `.episode_state.json` in this folder. If it exists, finish that episode first, from its saved step, instead of starting a new one. Finish means through step 12, then stop; never start a second episode in the same run.
- Fields: `episode`, `topic`, `step`, `status` (`running`, `waiting-quota`, `check-needed`), `reason`, `driveFileId`, `publishAt`, `queueDone`, `uploadsDone`. Never put a key in it.
- Create it when step 1 picks the topic. Update it after every step, and delete it after step 12.
- `waiting-quota`: continue from step 3 if quota is back; otherwise stop cleanly and report.
- `check-needed`: redo the failed step once. If it still fails, stop without a new log line and report the reason. Never skip past it.

## 1. Pick the topic
Bank: `C:\Users\<user>\claude video\FAKTA_BANK.md` (all its tables).

**Top up first:** if fewer than 3 unused items remain (not DONE/USED, not ⚠ or disputed), first add 10 new ones to the bank, then continue. They must follow the bank's rules: a rotation of categories and shapes, facts that look verifiable (with anchors to check), a clear payoff, nothing depressing, and a map or infographic idea plus a "tebak dulu" and an identity question. Put them in a new table headed with the date and marked "auto-added, not yet reviewed by owner", and keep that mark on each row.

Take the first unused item that passes:
- Not marked DONE or USED, and not listed in the episode log.
- Not the same category or the same shape as the previous episode (shape = the kind of story and main visual, e.g. true-size map, wrap around the globe, ranked bars, Kenapa chain).
- Skip anything marked ⚠ or disputed, and anything that repeats an earlier episode.
- "Kenapa…?" items are written as surprising facts with a payoff, not how-it-works lessons.
- **Timely slot:** if NNN is divisible by 5, follow the bank's "Timely slot" rule instead: a topic tied to news or a current date, with a source from the last 30 days, nothing political or tragic, and the category rotation still kept. If nothing passes, take the normal next item and write "no timely topic found" in the log line and the report.
- **Series slot (owner, 22 Nov 2026):** if NNN ends in 7, this episode is **Part 1** of a 2-part story; if NNN ends in 8
  and EpNNN-1 was a Part 1, this episode is its **Part 2** (it must continue that story; nothing else). Follow
  `ci/CLOUD_RULES.md` "Series (2-part)" and the bank's "Series" rules. A timely slot never falls on these numbers.

Mark it in the bank (`**(DONE: EpNNN)**` plus the episode log line) only after step 6 passes.

## 2. Research and source
- Check every fact against a real source; prefer primary or academic sources. Compute distances, ratios and times in a script.
- Drop or rephrase anything you can't verify. Never print a number you can't source or compute. If too little survives for 40 s, take the next topic.
- **Length and pace (owner, 12 Nov 2026):** 40-60 s. Write to about 2.3 words per second, and remember Gemini reads Indonesian slower (about 105-115 words per minute), while the voice may be sped up at most 1.05x: so about 100-120 spoken words for a 60 s episode. Too long = cut words, never speed up.
- Write `src/episodes/epNNN-script.ts` (SEGMENTS, VERSIONS, VOICE, NUM, SOURCES) and `episodes/EpNNN.md` (script, sources for every fact, "Checked and dropped / changed", voice notes).
- Every script needs: a hook on screen in the first second, a twist every 5-8 s, a "Tebak dulu di komentar…" line right before the big number, and an identity question at the end.
- Before spending a request, scan the spoken text against the TTS safety rule in `CLAUDE.md`. Facts that break it go on screen as text.

## 3. Voice
- ONLY `gemini-3.1-flash-tts-preview`, narrator Puck. Never call 3.8.
- At most 10 requests per Pacific day across all runs (`.tts-quota.json` plus the other channels' counters, read only), at least 20 s apart, at most 4 requests in this run.
- The key comes only from `GEMINI_API_KEY`. Never print it, pass it as an argument or save it.
- `node scripts/gemini-voice.mts --ep=epNNN --max-requests=4`. Transcribe any DIFF line before retrying: retry only real errors, and never accept a wrong number.
- On a SAFETY block, rewrite the likely line once or twice. Don't retry the same text.
- **If the quota is out, or under 2 requests are left: stop cleanly.** Don't render or mark anything; keep the script files; set the state to `waiting-quota`, say what's done, what's left and when the quota resets (~14:00 WIB). Log it (one line, section 10).
- Voice direction (`VOICE` persona and styles): clear, unhurried, with punch on the key line. Never "cepat", "fast", "quick"... (`gemini-voice` refuses them).
- Then `node scripts/make-voice.mts --ep=epNNN --own --tts --from=data/tts/epNNN/lines` (tempo at most 1.05x; every line cleaned the same way: shared noise floor, end bursts and breaths removed, short fades, same level; then the join check). Exit 4 = TOO LONG: cut words and re-take. Exit 1 = JOIN CHECK FAILED: re-take the whole block (one request) instead of splicing a single line; if it persists, CHECK NEEDED: <episode> line joins, then stop. After it passes, then `node scripts/make-captions.mts --ep=epNNN`. Measure the voice LUFS for the `voiceLufs` prop.

## 4. Build and render
- Build `src/episodes/EpNNN.tsx` from the closest existing episode, same components, beats on `at(segment, word)`. Register it in `src/Root.tsx`.
- **Captions and sound effects v2 (owner, 14 Nov 2026; new episodes):**
  - **Key phrases by meaning:** in `epNNN-script.ts` export `KEYS: Partial<Record<segmentId, string[]>>`, the words a
    person would stress, copied exactly as written in that segment's text. Whole units only (`"lima pulau"`, not `"lima"`;
    `"seribu sembilan ratus sepuluh"`, `"Nusa Tenggara Timur"`), at most one key per caption phrase, usually 1-2 per
    segment, none for filler. Numbers written as words show as digits automatically (years stay 1910, others 1.500).
  - Captions: `const plan = planCaptions2(captions, segments, KEYS, bounce)` (bounce = [start, end] of the reveal/twist
    segments), then `<LiveCaptions2 plan={plan} />` (`src/components/LiveCaptions2.tsx`; varied entrances never repeated,
    sticker with overshoot, idle float, numbers count up). Wrap the picture (not the captions) in `<PunchIn plan={plan}>`.
  - Effects: `<SfxLayer2 captions segments seconds extra actions={{ moments: captionMoments2(plan), zooms, icons, counts,
    lands }} />` (`src/components/SfxLayer2.tsx`): whoosh per segment and the word sounds as before, plus action sounds
    -- `zooms` = seconds a map zoom/camera move starts, `icons` = seconds an icon/pill/pin appears, `counts` = [start,
    end] of each Counter, `lands` = something landing. Hand-placed hits still go in `extra`.
  - Mix: `<Soundtrack ... mix="v2" />` (music ducks less). The voice must stay about 8 dB on top: the loudness check
    still applies, and listen to the busiest 5 s.
  - Published episodes (Ep011 and older) keep `LiveCaptions`/`SfxLayer` and the old mix; don't change them.
- Music: `pickTrack(NNN, seconds)`; add it to `USED` in `src/music.ts` and to the table in `CREDITS.md`. Never Sad Eyed Waltz (until approved); Good Starts only under 58 s. Add any new flags to `public/flags`.
- Add `render:epNNN` to `package.json`, like `render:ep005`.
- Render ~13 check frames into a contact sheet with a line at y = 1536. Look at it. Fix overlaps, clipped text, text under 54 px, and anything below the line.
- `npm run render:epNNN` in the background, then delete the raw master.

## 5. Check the result
All of these must pass, or fix and re-render:
- Length 40-60 s; line joins clean (`node scripts/voice-clean.mjs check public/voice/epNNN --pattern "[a-z]*.wav"`); loudness -14 LUFS (±0.5); true peak <= -1.5 dBTP; 15-30 MB; SSIM >= 0.98.
- Captions: compare `epNNN-captions.json` with the script (same words, in order, no gap over ~1 s while speaking) and check them on the frames.
- Final question on screen 2-3 s.
- Write `uploads/EpNNN.txt`, in Indonesian, exactly these 5 labels, one per line:
```
Title: (a hook title, under 60 characters)
Hook line: (one short sentence)
Episode hashtags: (1-2 only)
Music: "Title" by Artist
Pinned comment: (a guess or identity question; no begging for likes or shares)
```

## 6. Mandatory checks (the gate before queueing)
Measure these on the final `renders/Fakta_EpNNN.mp4`. All must pass:
- **Voice:** every voice line matches the script (Whisper). A Whisper spelling or number-format quirk counts only if it's listed in `episodes/EpNNN.md`; a wrong number never passes.
- **Loudness:** -14 LUFS ±1, and true peak <= -1 dBTP.
- **Length:** 40-60 s (owner, 12 Nov 2026), so also under 3 minutes.
- **Silence:** no gap over 1 s between the first and last spoken word (from the voice timing), and no `silencedetect` stretch over 1 s anywhere in the MP4 (music runs under the voice, so the MP4 alone isn't enough).
- **Facts:** every fact in the script has a source in `episodes/EpNNN.md`.
- **File:** `ffprobe` reads it, with one video stream, one audio stream and the expected duration.

If any check fails: do NOT queue. Write `CHECK NEEDED: EpNNN <reason>` in `PROJECT_LOG.md` (section 10), set the state to `check-needed`, and stop.

If all pass, mark the bank (step 1).

## 7. Drive
1. Copy the MP4 to `G:\My Drive\Fakta` (skip if the same name and size is already there).
2. Every 60 s, for up to 20 minutes, search with the Google Drive `search_files` tool: `title = 'Fakta_EpNNN.mp4' and parentId = '[drive-id]'`. Save the file ID in the state.
3. If it never appears: write `CHECK NEEDED: Drive sync` in `PROJECT_LOG.md`, set the state to `check-needed`, and stop.

## 8. Publish time
Read the "Publish at" column of `Queue Fakta`. Use the day after the latest date, or tomorrow (WIB) if that's later, at 18:00. Format, with the leading apostrophe: `'2026-11-12T18:00:00+07:00`. Save it in the state.

## 9. Queue row
Before writing, read `Queue Fakta`. If this episode already has a row, or `queueDone` is true, skip this step (so a resume can't add a second row).

Write exactly ONE row, using the method already proven with Zapier (not `append_values`):
1. Find the next empty row with `get_values` on `'Queue Fakta'!A:F`. If that row isn't empty, treat it as a failed read-back (below).
2. Write the whole row at once with the Google Sheets `update_formulas` tool to `'Queue Fakta'!A<row>:F<row>`:

Episode | Title | Description | Video URL | Publish at | Added

- Episode = `'EpNNN`, with a leading apostrophe. Publish at = the value from step 8, with its leading apostrophe. Title = from `uploads/EpNNN.txt`. Added = `YYYY-MM-DD HH:MM (Claude)`.
- Description = Hook line + blank line + `Voiceover: AI` + new line + `Music: "<track>" by <artist> (YouTube Audio Library)` + blank line + this channel's core hashtags (Hashtags tab, row "Fakta Unik") + the episode hashtags.
- Video URL = `https://drive.google.com/uc?export=download&id=<Drive file ID>`
- Never edit or delete existing rows, never touch row 2, never change the columns.

Read the tab back and confirm exactly one new row, with Episode reading `EpNNN` and Publish at reading `2026-11-12T18:00:00+07:00` in shape: no visible apostrophe. If not: write `CHECK NEEDED: EpNNN queue row` in `PROJECT_LOG.md`, set the state to `check-needed`, stop, and don't try to repair it.

## 10. Tracking
Before writing, read the Uploads tab. If this channel and episode already have a row, or `uploadsDone` is true, skip this step.

Use the same method as step 9: find the next empty row with `get_values` on `'Uploads'!A:Q`, then write the whole row with `update_formulas` to `'Uploads'!A<row>:Q<row>`:
Channel `Fakta Unik` | Episode `'EpNNN` | Topic | Video file `fakta-video/renders/Fakta_EpNNN.mp4` | Title | Hook line | Music | Episode hashtags | Full description (same as step 9) | Status `Ready` | Planned date (publish date, `'YYYY-MM-DD`) | columns L-P empty | Pinned comment in column Q.

Read the tab back and confirm exactly one new row, with no visible apostrophes. If not: write `CHECK NEEDED: EpNNN Uploads row` in `PROJECT_LOG.md`, set the state to `check-needed`, stop, and don't try to repair it.

## 11. Log
Append exactly 3 lines to section 10 of `C:\Users\<user>\claude video\PROJECT_LOG.md`, and update its "Last updated" line:
```
- **Fakta EpNNN (YYYY-MM-DD):** topic, category, length, loudness, requests used, queued for <publish date>.
  File: fakta-video\renders\Fakta_EpNNN.mp4, uploads\EpNNN.txt.
  Uncertain: anything dropped, simplified or weakly sourced (or "nothing").
```

## 12. Report
Finish with a report under 80 words: topic, category, length, loudness, requests used, publish date, anything uncertain. Then delete `.episode_state.json`.
