# Production notes: What If Ep001 and Ep001V2

Renders:
- `renders/WhatIf_Ep001V3.mp4`: V3. 74.18 s, -14.2 LUFS, true peak -2.31 dBTP. Puck (gemini-3.8-flash-tts, 3 requests + 1 overloaded call), New Morning (YouTube Audio Library) with its build on the climax.
- `renders/WhatIf_Ep001.mp4`: V1. 70.3 s, -14.3 LUFS, true peak -2.0 dBTP. Unchanged; its checksum was verified after the V2 work.
- `renders/WhatIf_Ep001V2.mp4`: V2. 67.05 s, -14.3 LUFS, true peak -2.37 dBTP, sample peak -4.6 dBFS.

## Problems I hit and the workarounds

| # | Problem | Workaround |
|---|---------|------------|
| 1 | `create-video` could not make its first git commit (no git identity configured) | Ignored it. The project was created fine; the git repo has no commits. |
| 2 | Node can't import the `.ts` episode files from the voice/check scripts without file extensions, and Windows paths need `file:///` URLs | Episode files import with `.ts` extensions (`allowImportingTsExtensions` in tsconfig); one-off scripts pass `file:///` URLs. |
| 3 | V1 first mix was too loud: -12.1 LUFS with a true peak of **+1.15 dBTP** (clipping after AAC encoding) | Voice target lowered to -16.8 LUFS per line, the voice limiter ceiling to -5.5 dBFS, and music to 0.12. Now -14.3 LUFS and about -2 dBTP. |
| 4 | Remotion's bundled ffmpeg has no `hstack`, and Python has no PIL, so I couldn't build contact sheets | Rendered small QA stills (`--scale=0.25`) and looked at them one by one. |
| 5 | Shell quoting: backticks inside `node -e` / heredoc edits were run as shell commands and mangled two lines of TSX and two comments | Caught by `tsc` and by grepping; fixed with direct file edits. For anything with backticks, write the file directly. |
| 6 | V1 captions split the title so the full premise wasn't visible in frame 1 | Title line is shown whole (`whole: true`). |
| 7 | V1 counter kept saying "MARBLE SIZE" long after the drop was much bigger (stale "about" labels) | V2: an "about" label only shows while the drop is within 10%; then an `after` label takes over ("Bigger than a marble"). |
| 8 | V1's stage rescaled each icon next to a fixed-size drop, so the growth didn't *feel* like anything (the owner's main complaint) | V2 `WorldStage`: one true-scale world in metres plus a log-zoom camera with lag (details below). |
| 9 | First V2 stills were empty: the "lift the Earth above the captions" formula used `min(1180, 1250 - 2R)`, which goes hugely negative when the Earth radius on screen is ~10^11 px at millimetre scale | Replaced it with a bounded curve: `interpolate(Rpx, [50,110,400], [1150,1030,1180])`. |
| 10 | Remotion `interpolate` throws on descending input ranges (`[2600,1600]`) | Rewrote them as ascending ranges with reversed outputs. |
| 11 | Huge numbers in the DOM: the Earth as a CSS circle with a radius of 10^11 px | Below 40,000 px radius it's a real circle; above that it's drawn as flat ground (curvature under 4 px across the frame). |
| 12 | V2 needed shared-component changes without changing V1 | Template versions (`TEMPLATES` in `theme.ts`, `template` pinned in episode data), with all new behaviour opt-in. V1 stills re-rendered **byte-identical** (md5) after the changes. |

## How the V2 fixes work

- **Visible growth:** `timing.ts` computes a camera track per frame: log2(camera size) follows log2(drop diameter) with a 0.9 s lag, clamped so the drop is 1.0-1.6x its base size on screen.
  - When the story races between lines, the drop swells, then the camera keeps zooming out.
  - Objects are placed in metres just outside the drop's edge at the moment of their comparison, alternating right/left. They enter from off-screen, stand at true relative size, then get swallowed or shrink away.
  - The ground is the Earth (radius 6,371 km). It curves into a visible planet from about second 29.
- **Frame 1 motion:** template 2 has no lead-in silence. The story clock moves during every line (`to` on each line), so the counter shows 2.00 mm at frame 0 and 2.02 mm at frame 1, and rain is at 0.6 opacity from frame 0.
- **Captions:** `phraseChunks()` splits at punctuation, glues one-word fragments ("16.", "Us.") to their neighbour, and splits runs longer than 5 words evenly. Caption text equals the spoken words.
- **Ending/loop:** 0.6 s hold after the spoken question (the prompt is on screen about 2.9 s in total, including the 2.3 s question). The last 0.4 s cross-fades to a `<Freeze frame={0}>` copy of the scene. Music fades out over 0.4 s and fades in over 0.2 s.
- **Facts:** `node src/whatif/episodes/ep001v2.ts` checks every rung. It also checks that each spoken "about" line still holds (within 10%) when the line ends, and that "two kilometers" is right during its line (2.10-2.22 km).

## What I'd improve next

1. **Real word timestamps.** Highlighting inside a line is estimated from word length. Running Whisper.cpp (`@remotion/install-whisper-cpp`) on each clip would give exact word timing.
2. **Labels on the world objects** (small "HOUSE", "EVEREST" tags). The comparison text is only in the HUD right now.
3. **The "swallowed" moments.** When the drop passes an object, a small splash or ripple would make it read better. Objects behind the drop are currently only faintly visible.
4. **Sound design.** A soft whoosh on each zoom-out and a low boom at the merge. Synthesise them in code, as with the music.
5. **The 2 mm start** is shown resting on the ground. Honest enough for the premise, but a short fall-and-land in the first second would look more natural.
6. **Loop cross-fade.** Mid-fade (frames 1-11 of 12) the two scenes overlap and look busy. A clean cut on a white or dark flash frame may loop better; A/B it on real uploads.
7. **Studio check.** I verified with rendered stills, not by watching the full video in Studio with sound, so pacing and audio sync still need a human pass.
8. **Contact sheets.** Install a full ffmpeg (or `sharp`) so QA can be one image instead of 20.

## Effort per part (wall-clock, approximate, from file timestamps)

| Part | V1 (14:45-15:11) | V2 (16:47-17:06) |
|------|------------------|------------------|
| Project scaffold + skills + packages | ~3 min | - |
| Reading the breakdown + CLAUDE.md | ~4 min | ~2 min (rule updates) |
| Fact research + sources + self-test | ~5 min | ~3 min (V2 checks, "about" windows) |
| Script + voices (kokoro, ~1 min per run) | ~3 min | ~2 min (ran in background) |
| Music generator | ~2 min | - (reused) |
| Components / stage (the bulk of the work) | ~8 min | ~8 min (WorldStage, camera track, template system) |
| QA stills + fixes | ~3 min | ~4 min (ground-formula bug, interpolate ranges) |
| Final render + loudness passes | ~5 min (3 renders: loudness/peak fixes) | ~1.5 min (one render) |

A full render takes about 1.5 minutes, a still about 5-10 s, and a bundle about 20 s. The heaviest creative part is the stage/camera. The heaviest risk is facts and loudness, and both now have automated checks.

# Ep001V3 (Gemini narrator + library music), 2026-10-30

## Problems and workarounds
| # | Problem | Workaround |
|---|---------|------------|
| 1 | First call: HTTP 503 "high demand" from gemini-3.8-flash-tts; the pipeline treated it as fatal | 5xx now waits 30 s / 60 s and retries, then falls back to 3.1 (same voice). Counted in `.tts-quota.json` to be safe, but not against the per-run cap. |
| 2 | Line 19 flagged "missing *Comment below*" three times, so 2 retries were spent on a false alarm | Whisper drops the last words of short, quiet clips (Gemini output is ~-21 LUFS). Clips are now raised to speech level and padded with 0.5 s of silence before transcription; all takes then read correctly. |
| 3 | Puck's dramatic delivery made the episode 89.7 s (style guide max 75 s) | `scripts/tts-fit.mjs`: pauses inside lines capped at 0.45 s (-5.6 s), then one pitch-preserving tempo for all lines (1.167x) to reach 74 s. Every final clip re-checked with whisper. |
| 4 | Cutting the one-request take into lines: whisper stretches a word over the silence after it, and a dramatic pause inside a line can be longer than the gap between lines | Candidate cuts are tried longest-silence-first and the first one whose clip transcribes as exactly its line wins (local whisper time only, no API calls). |
| 5 | Three of the seven tracks (Spring Field, The World's Fair, Stasis) only build in their first ~25 s, too early for a climax at ~50 s | "Mix build" for those: music held 4 dB lower before the climax and lifted at it. The other four line up their real build with the climax. |
| 6 | Bundled ffmpeg can't write `.m4a` by extension | Forced the container with `-f mp4`. |

## What I'd improve
- Ask Gemini for a brisker pace in the direction ("energetic but quick, short pauses") so less tempo change is needed.
- One more offline self-test case for 5xx retries and the request cap.
- Measure the music level under the voice from a music-only render (now only by design: copies at -16.8 LUFS, ducked 19 dB).

# Ep002 (dominoes) and Ep003 (jumping), 2026-10-31

Renders: `renders/WhatIf_Ep002.mp4` 70.21 s, -14.3 LUFS, true peak -2.29 dBTP · `renders/WhatIf_Ep003.mp4` 63.79 s,
-14.4 LUFS, true peak -2.27 dBTP. TTS requests (3.8 only): Ep002 = 1, Ep003 = 4 (1 take + 3 retries that turned out to be
false alarms, see #2). Ep001V3 re-checked byte-identical after every shared change.

| # | Problem | Workaround |
|---|---------|------------|
| 1 | Two pipelines ran whisper through the same temp files, so each read the other's transcripts (Ep002's fit saw Ep003's whole take; Ep003's line 4 saw Ep002's "domino sixty two") | Temp files are now per process and per call, and deleted after use. Ep003's run was stopped before it could spend more. |
| 2 | Ep003: 6 lines flagged after the per-run cap; whisper's word times on a long take drift across long pauses (it placed words inside a 3.3 s silence), so cuts were searched in the wrong place | Cut candidates now come from each line's word count, not whisper's times. Re-run offline with `--max-requests 0`: all 17 lines matched from the original take. The 3 retries were not needed. |
| 3 | Ep003 line 3 started with a 0.16 s voiced syllable ("your") before "Then" | One-off trim at 0.40 s (inside a quiet gap); re-checked OK. Original kept in the scratchpad. |
| 4 | Spring Field and The World's Fair only rise in their first 5-9 s, too early for a climax at ~35 s | New "early build" music mode: open on a later full-level stretch, cross-fade into the track's start so its rise lands on the climax. |
| 5 | The raindrop's "Earth falls in" timing assumed every episode has that moment (Infinity range) | A missing moment now means zero. |
| 6 | Counter "2,147,484 km" too wide; rung icons drawn as huge ground objects; ISS label off-screen | Long values shrink (only > 7 characters, so Ep001V3 is unchanged); counter-only rungs use `icon: "drop"`; label shortened. |
| 7 | Whisper writes "1.5", "11.2", "99.8%", "(laughing)" | Normaliser handles decimals, percent, "one and a half", and strips non-speech notes. |
| 8 | Request counts in credits came from the last run only (Ep003 showed 0) | Counted from cached API responses on disk (one per answer, across all runs). |

Uncertain facts (flagged in each FACTS block): Monas 132 m (official primary source not found online), ISS ~400-420 km
(varies), Kármán line 100 km (a convention), Earth's Hill sphere ~1.5 million km (mission-site source), the Toronto demo's
domino count (13, derived from its sizes), house 8 m (approximate).
