# Voice test: Gemini 3.1 Flash TTS vs Kokoro (2026-10-29)

Model: `gemini-3.1-flash-tts-preview`. Google now labels it a legacy preview and recommends `gemini-3.8-flash-tts`.
Direction for all 19 lines is in `ep001v2_voice_direction.json`. Each line has a per-line style plus inline [tags] and CAPITALS for emphasis.
The exact prompts sent are in `voice_test_prompt_*.txt`.

| File | Voice | Lines | Length | Speech only | Loudness (raw) |
|------|-------|-------|--------|-------------|----------------|
| voice_test_A.wav | Puck ("Upbeat", male) | 1-7 | 38.0 s | 19.7 s | -20.7 LUFS |
| voice_test_B.wav | Fenrir ("Excitable", male) | 1-7 | 32.8 s | 19.0 s | -16.7 LUFS |
| voice_test_C.wav | Zephyr ("Bright", female) | 1-7 | 35.1 s | 19.3 s | -20.3 LUFS |
| voice_test_kokoro.wav | Kokoro af_heart (current) | 1-7 | 21.3 s | 15.6 s | -17.3 LUFS |
| voice_test_full_A.wav | Puck, whole episode in one request | 1-19 | 116.2 s | 54.6 s | -21.5 LUFS |

## Checks (whisper.cpp small transcription; nobody listened)
- No directions or [tags] were read aloud in any take.
- Square-bracket and angle-bracket tags were both silent in a probe. Whether 3.1 actually *acts* on them (laugh, whisper) needs a listen.
- B (Fenrir) improvised one line: "12? That's as tall as a house!" (an extra word, so the caption would no longer match).
- In the full take, the last two lines transcribed as "Awesome! Who wants you to double next?" instead of "Us. What should double next?".
  This could be a whisper mishearing or the model ad-libbing. **Listen to the end of voice_test_full_A.wav.**
- Every take has 1-1.5 s gaps between lines. That's why 20 s of script became 33-38 s.

## Requests used
7 in total: 1 format probe, 2 tag-syntax probes, 3 voice tests, 1 full episode. 0 errors and no 429s.
About 6,000 audio output tokens (25 tokens = 1 s of audio).

# Round 2: gemini-3.8-flash-tts, one request per line (2026-10-29 evening)

- voice38_A.wav: **Puck** on 3.8. 27.77 s, -16.9 LUFS (normalised per line to -16.8). All 7 lines matched the script
  on the first try. Lines joined with 0.3 s pauses (0.4 s after the hook). Details: voice38_A.json.
- voice38_B (Fenrir), voice38_C (Laomedeia) and the 3.1 per-line take were NOT made: **the free tier allows only
  10 requests per day for gemini-3.8-flash-tts** (Google's 429 message: "limit: 10 requests per day on Free Tier").
  The quota resets about 19 h 20 min after it ran out, around 14:00 WIB on 30 Oct.
- The 3.1 model has probably got a similar daily cap (unconfirmed). 7 of its requests were used in round 1.
- What used the 10: 1 format probe, 1 line from a run that hung on a bug in my script (since fixed), 1 debug line, 7 for take A.

Consequence: per-line generation needs 19 requests per episode, which is more than one day of free quota on one model.
A full episode either takes 2 days of free quota, or uses the paid tier (about $0.06 per episode at $20 per 1M audio tokens),
or is generated in a single request (1 per episode, but one bad word means redoing the whole take).

# Round 3: low-request pipeline (built offline, 2026-10-29 night)

`scripts/tts-episode.mjs`: one request per episode, then only the failing lines (see CLAUDE.md, "Gemini TTS").
Tested offline with `scripts/tts-selftest.mjs`; outputs to listen to are in `tests/offline_run/`.
- On the 19-line 3.1 take, 4 requests in total would give a fully matching episode: 1 for the episode + 3 lines.
- Bug found and fixed: a cut between lines 5 and 6 left "eleven" in line 5's clip. Whisper stretches each word's end time
  over the silence after it, so the cut search missed the real gap. Now the search runs from the start of a line's last word
  to the end of the next line's first word, and every clip is re-checked on its own.
- Still unverified until the first real call: whether 3.8 accepts one text item per line in a single request.
  If it refuses (HTTP 400), the script retries once with all lines in one item, which costs 1 extra request.
