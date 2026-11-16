# Production notes: Fakta Ep001 (V1 and V2)

This is an honest log: what went wrong, how it was worked around, what I'd do better, and how much effort each part took.
The effort times are wall-clock times taken from the session log. Renders run in the background, so some of that time overlapped with other work.

## Result
| | V1 `renders/Fakta_Ep001.mp4` | V2 `renders/Fakta_Ep001V2.mp4` |
|---|---|---|
| length | 71.9 s | 67.7 s |
| loudness | −14.0 LUFS, true peak −1.9 dBTP | −14.0 LUFS, true peak −2.3 dBTP |
| file size | 112 MB (12.2 Mb/s, video stream copied) | 25.6 MB (2.85 Mb/s video, SSIM 0.988 vs the master) |
| Indonesia's width on screen | ~77% of the frame (camera 7.000 km wide), ~65% over the US and Europe | ~87% (camera 6.200–6.300 km) |
| smallest text | 30 px (map labels) | 54 px (capitals ≈ 40 px) |
| lowest element | captions down to y ≈ 1547 (inside the bottom 20%) | captions end at y ≈ 1467; nothing below 1536 |
| final question on screen | 7.3 s | 3.1 s |

## Problems and workarounds
| # | problem | workaround |
|---|---|---|
| 1 | Windows treats `ep001.ts` and `Ep001.tsx` as the same file name (case-insensitive file system), so the imports clashed. | Renamed the data file to `ep001-script.ts`. |
| 2 | Node needs `with { type: "json" }` to import JSON, and TypeScript refused `.ts` import extensions. | Added the import attribute and `allowImportingTsExtensions` to `tsconfig.json`. |
| 3 | A shell command waiting for input (`cat >` with no input) hung the shell. | Stopped it and wrote files with the editor instead. |
| 4 | Whisper.cpp returns sub-word pieces ("Ser" + "ikat") and writes numbers as digits ("5.240"), so its words don't line up with the script. | Glued the pieces back into words, then aligned them to the script with an edit-distance alignment. Words that couldn't be matched (mostly spoken numbers) get times interpolated between their neighbours: 143/179 matched directly in V1, 140/175 in V2. |
| 5 | Captions in V1 overflowed the frame on long words. | Custom paging: max 3 words / 22 characters, and a new line after punctuation. |
| 6 | V1 showed the WIB/WITA/WIT labels for only ~0.5 s, because of a timing collision with the closing headline. | Re-timed both and re-rendered V1 (9 min). |
| 7 | Remotion Studio: the preview tool started the *other* project (`my-video`, port 3000), because it reads the parent folder's launch file. PowerShell also blocks `npm.ps1`. | Stopped that server and started this project with `npm.cmd run dev` in a terminal tab on port 3001. |
| 8 | Honest true-size comparison: sliding a shape on a flat map distorts it. | Every move is a rotation on the sphere (`moveGeo`). The satellite image and the borders are drawn with ONE equal-area projection and ONE scale. Where the ends land ("Merauke in the Caspian Sea") was measured by a script, not eyeballed. |
| 9 | The CIA World Factbook (source for Indonesia's area) was shut down in Feb 2026. | Cited Wikipedia's figure, which cites the Factbook 2025, and cross-checked it against my own calculation from Natural Earth (within 2%). |
| 10 | V1 readability on a phone: map labels at 30 px, a zoom that left Indonesia at ~65% of the width over the US and Europe, captions inside the bottom 20%. | V2: zoomed in, a 54 px text minimum, shorter pill texts, labels clamped inside the frame and above y = 1536, labels on opposite sides of their pins. |
| 11 | V1 file was 112 MB: it kept Remotion's CRF 18 video untouched. | V2 renders a near-lossless master (CRF 14), then x264 two-pass (preset slow) to a 26 MB budget, and checks the result against the master with SSIM. |
| 12 | V1's final question stayed on screen 7.3 s, because the spoken "WIB, WITA, atau WIT" was slow in TTS ("WIB" alone took 1.6 s). | V2 shortens the spoken question and shows the three options as pills. End hold cut from 1.6 s to 0.3 s. |
| 13 | V2 check frames found two bugs that V1 also has: "Samudra Pasifik/Atlantik" labels stayed on top of the area squares, and only 7 of the 12 European flags popped in before the scene ended. | Labels now end when the squares appear. The flag row starts earlier and pops faster (0.07 s per flag). |
| 14 | The owner's phone takes will differ in level, noise and silence. | `make-voice.mts --own` accepts any common format named `01…12`. It applies an 80 Hz high-pass, light denoise, per-line loudness and a silence trim. Tested with fake "phone" files before generating the real V2 voice. |
| 15 | Rendering is slow (~9 min for 72 s), because the Blue Marble image is re-projected pixel by pixel on the CPU for every frame. | Run renders in the background and check layouts on single stills / contact sheets first. |

## What I'd improve next
- **Faster map:** move the per-pixel re-projection to WebGL (a fragment shader), or cache the frames during held shots where the camera barely moves. This would likely cut render time 3–5×.
- **Higher-resolution base map:** at the V2 zoom, the 5400×2700 Blue Marble image is a little soft. The 21600×10800 version (also public domain) would be sharper, but needs tiling to fit in browser memory.
- **Layout linter:** a script that renders ~20 frames and fails on:
  - text below y = 1536;
  - pills overlapping or leaving the frame;
  - fonts under 54 px.

  I checked this by eye on contact sheets this time.
- **Measured label widths:** labels are kept inside the frame with an estimated width (`pillWidth`). Measuring the real text width would be exact.
- **Caption timing for numbers:** to match spoken numbers directly, I'd need either a word-level forced aligner, or a Whisper prompt that writes numbers as words.
- **Fact-check sheet:** generate `episodes/EpNNN.md` straight from `SOURCES`, so the two can never drift apart.
- **Real voice:** the edge-tts voice is a placeholder (an unofficial use of a Microsoft service). The owner's own recording (`VOICEOVER_SCRIPT.md`) is the real fix, both for quality and for channel identity.
- **Music:** "Peta Pulse" is a simple generated loop. A few variants (intro build, drop at each twist) would help retention.

## Effort per part
| part | approx. time | notes |
|---|---|---|
| Setup (project copy, port 3001, configs) | ~5 min | Copied from `whatif-video`; other projects untouched |
| Research and fact checks (coordinates, areas, time zones, sources) | ~10 min | Plus the scripts `distances.mjs` and `probe-placement.mts` |
| Map data and true-size maths (Natural Earth → JSON, sphere rotation, placement probe) | ~8 min | |
| Voice (edge-tts) + captions (Whisper install, alignment) | ~10 min | First Whisper run downloads the model (~5 min) |
| Music and SFX from code | ~2 min | |
| Map renderer + UI components + V1 timeline | ~10 min | The biggest single piece of code |
| V1 stills, fixes, re-render, loudness | ~25 min | Mostly waiting: two full renders × ~9 min |
| Docs (CLAUDE.md, CREDITS.md, Ep001.md) | ~3 min | |
| V2: voice/caption versions, own-voice mode + test | ~5 min | |
| V2: layout rework + 3 rounds of check frames | ~8 min | |
| V2: render + size-targeted encode + loudness | ~10 min (render 8 min, two-pass encode 1.5 min) | |
| V2: VOICEOVER_SCRIPT.md, CLAUDE.md rules, these notes | ~8 min | |

**Hardest parts:**
- Keeping the comparison honest: one projection, rotation on the sphere, and measured landing points.
- Aligning Whisper's words with the script.

**Most of the time:** waiting for renders.

## V3 (30 Oct): Gemini voice (Puck) + Audio Library music
| # | problem | workaround |
|---|---|---|
| 16 | The owner cancelled his own recording; fakta now uses Gemini TTS. The free tier is 10 requests per day per model, shared by all three channels. | One request for the whole episode. Whisper checks each line, and only wrong lines are re-generated. Responses are cached. Fakta keeps its own request counter and only *reads* the other channels' counters, so it never edits their projects. Ep001 V3 cost 4 requests: 1 empty response, 1 full take, 2 line retries. |
| 17 | Gemini once answered "OK" with no audio, which still used up a request. | The script now saves the response for diagnosis (it holds no key and no audio) and stops cleanly. Re-running retried it. |
| 18 | Whisper given the script as a hint sometimes skips the first sentence of a clip. | Each clip is checked without a hint first; the hint is only a second opinion. |
| 19 | Whisper heard "4409" in line 7, where the script says 4.509. It could have been Whisper's mistake or Puck's, so it was treated as Puck's. | Numbers are compared as values ("lima ribu dua ratus empat puluh" = 5240 = "5.240"), and a wrong number always triggers a re-generation. The retry matched. |
| 20 | Gemini reads Indonesian slowly: ~131 wpm for the full take, even when asked for "fast". | All lines are sped up by the same factor (×1.23 here, capped at ×1.25), giving 159 wpm. |
| 21 | The music tracks range from −9 to −31 LUFS. | Normalised copies at −16 LUFS, a voice at −16 LUFS, and ducking measured at 19 dB while talking (−35 LUFS music under the voice). |

Effort: building the Gemini pipeline and the music system took about 1 h, mostly writing and testing the split/check on a cached take. The ten-minute render ran in the background.

V3 result: `renders/Fakta_Ep001V3.mp4`, 66.1 s, −14.05 LUFS, true peak −1.51 dBTP, LRA 5.3 LU, 25.6 MB (2.93 Mb/s video, SSIM 0.987 vs the master), 1080x1920 30 fps. Render took 7 min 18 s in total.

## Ep002 + Ep003 (31 Oct): first episodes on the locked template
| # | problem | workaround |
|---|---|---|
| 22 | The pipeline scripts were hard-wired to Ep001's script file. | `scripts/episode.mts` loads any `epNNN-script.ts`; the narrator lives in `src/voice.ts`. No template change. |
| 23 | Gemini blocked the Ep003 take twice with `finishReason: SAFETY` (each block still costs a request). | Removed war-like wording ("ledakan di Sabang", "dentuman, kayak meriam", "letusan"); facts unchanged. **Rule: no imagined explosions in real places, no weapon similes, in TTS text.** |
| 24 | A request failed on the network; Google may still count it. | Requests are now counted when sent, not when they succeed. |
| 25 | FAKTA_BANK said Indonesia has the "#2 longest coastline". CIA says #3 and WRI says #4. | Dropped; the VO says "lima besar". |
| 26 | Clipped great-circle rings drew stray edges at the globe's rim. | Rings are drawn as open lines, not filled polygons. |

Requests on 31 Oct (gemini-3.1 only): Ep002 = 3, Ep003 = 3; 6 of 10 used.

## Ep004 + Ep005 (5 Nov): variety, "tebak dulu", identity question
| # | problem | workaround |
|---|---|---|
| 27 | Gemini blocked one take of each episode (SAFETY). Ep004: a spoken population loss. Ep005: wording that compared ethnic groups. | Ep004's numbers moved to on-screen text; Ep005 made neutral. Rule added to CLAUDE.md. Scan new scripts for these before spending a request. |
| 28 | Puck skipped the first sentence of a line in the whole-episode take. | The Whisper check caught it; one line retry. |
| 29 | The number checker doesn't know "juta", so "satu juta tujuh ratus ribu" is flagged. | Checked by ear-transcript, accepted. Worth fixing in `gemini-voice.mts` (pipeline, not template). |
| 30 | Natural Earth 1:50m has no Pulau Run outline and sources disagree on its area. | A pin and the 3 km length only. |

Requests on 5 Nov (gemini-3.1 only): Ep004 = 3, Ep005 = 2; 5 of 10 used.

Results: Ep004 64.9 s, -14.18 LUFS, true peak -1.65 dBTP, 25.2 MB, SSIM 0.992. Ep005 56.3 s, -14.10 LUFS, true peak -2.14 dBTP, 25.2 MB, SSIM 0.996.
| 31 | Both first finalized just over the true-peak limit (-1.49 / -1.46 dBTP). A -0.12 dB trim fixed Ep004, but re-encoding the AAC pushed Ep005 to -0.95. | Ep005 got a light limiter (limit 0.76, 192 kb/s AAC). Always re-measure after any audio re-encode. |
