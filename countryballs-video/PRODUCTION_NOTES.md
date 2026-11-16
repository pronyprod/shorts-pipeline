# Production notes: Countryballs "Flag Family"

Written 2026-10-29, after Ep001, Ep001V2, Ep002 and Ep002V2.

## How an episode is made today
1. Pick 4 rounds (e.g. from `FLAG_PAIR_BANK.md`) and write `src/countryballs/episodes/epXXX.ts`.
2. `npm run voices -- epXXX` makes the voice lines (kokoro-js, local, ~30 s).
3. Register the episode in `src/countryballs/episodes/index.ts` and add a `<Composition>` in `src/Root.tsx`.
4. Check 4 stills (one per round, ~0.3 s into the reaction) and the `EmblemCheck` still if a new emblem flag is used.
5. `npx remotion render EpXXX renders/EpXXX.mp4`, then `npm run loudness -- renders/EpXXX.mp4`.
6. Go through the quality checklist in `CLAUDE.md`.

## Template versions
Template changes go into a new version in `TEMPLATES` (`src/countryballs/theme.ts`). New episodes use the latest automatically; older episodes pin theirs, so re-rendering them gives exactly the published video (checked pixel by pixel after every template change).

| Version | Episodes | What it adds |
|---|---|---|
| 1 | Ep001, Ep001V2 | Original look; voices -18 dBFS RMS; no caption pill |
| 2 | Ep002 | Voices by loudness (-15.8 LUFS each), mix ~-14 LUFS, dark caption pill |
| 3 | Ep002V2 onward | Big bold captions (~78 px cap height for two lines, 90 px for one), slim pill, emblem-safe eyes, light rays behind all balls, "?" beside the head |

The request was to put the latest fixes "in template 2". Ep002 was already on template 2, so to keep Ep002 untouched the fixes became template 3, and Ep002 is pinned to 2.

## Problems hit and workarounds
| Problem | Workaround |
|---|---|
| `create-video` couldn't make its first Git commit (no Git name/email set) | Harmless; the project was created anyway. The project is **not under Git**, see improvements. |
| Remotion's bundled ffmpeg is a cut-down build: no raw audio/video output | Pipe audio through WAV instead. It does have `loudnorm`, used to cross-check loudness. |
| kokoro-js's phonemizer swallows errors (the process just exits with code 7) | Test failing steps on their own to see the real error. |
| A WAV writer bug (missing `data` marker) made voice files unreadable | Fixed in `scripts/generate-voices.mjs`. |
| `interpolateColors` returns `rgba(...)`, which the colour helper didn't read, so backgrounds went black | The helper (`shade`) accepts both formats now. |
| Rendering scattered frames (`--frames=0,40,...`) of a video with audio crashes Remotion (EINVAL in its audio mixer), even with `--muted` | Bundle once, then render each frame with `npx remotion still`. |
| PowerShell turns npm/npx progress output into fake errors, and piping it can crash the render | Send render output to a log file and read the log. |
| A render landed in `src/renders/` because the terminal had drifted into `src/` | Always `Set-Location` into `countryballs-video` before rendering. |
| freesound.org needs a signed-in account to download | Generated an original music loop from code (`npm run music`); licence in `CREDITS.md`. |
| No room for large captions without covering the child | Template 3 layout: smaller parents placed higher, smaller "ME:" card in the same spot, smaller child; caption band between them. |
| Eyes covered central emblems (Tunisia's circle, Croatia's shield) | Emblem-safe eyes (`src/countryballs/emblems.ts`), checked on the `EmblemCheck` still. Slovenia and Liechtenstein needed "down" (emblem in the top-left). |
| After the layout change, the confused "?" hid behind the flag cards | Template 3 puts it beside the head. |
| Light rays washed out the parents | Template 3 draws them on the background only. |
| I can't hear audio | Every render is measured instead: integrated loudness, peak, and the voice-to-music gap per round. A human still needs to listen. |

## Known weaknesses (not fixed yet)
- **Voices:** the child is an adult voice pitched up, so it may sound artificial. Nobody has listened to it yet.
- **Music:** one simple synthesised loop. Every episode sounds the same, and it may sound like a basic ringtone.
- **Flag card shape:** flag-icons only ships 4:3 and 1:1 versions, so cards aren't in each country's official ratio (Japan is really 3:2, Mexico 4:7). Colours and designs are accurate.
- **Big emblems:** Ecuador's condor and Croatia's crown are still partly behind the smaller eyes, because those emblems nearly fill the ball.
- **Eye/card overlap:** with "up" eyes on the parents (e.g. Turkey), the dad's inner eye slightly tucks under the "ME:" card.
- **Caption sizing** uses measured average letter widths, not exact text measurement. An unusually wide line (lots of W/M) could come out slightly too wide.
- **Polish:** hard cuts between rounds, no motion blur on the dad's slide-in, and balls are perfect circles (the reference style is slightly squashed).
- **Repetition:** every round has the same timing, which may feel samey over many episodes.

## What I'd improve next (in order)
1. **One command per episode:** `npm run episode -- ep003` that makes the voices, renders the 4 check stills, renders the MP4, measures loudness and prints the checklist. Episodes would also be found automatically, so `index.ts` and `Root.tsx` no longer need hand edits.
2. **Put the project under Git**, so every published version can be recovered and changes are reviewable.
3. **Listen-test the audio** with a human, especially the child voice, and try a few other kokoro voices.
4. **More music:** 3–5 generated loops in different keys and tempos, or licensed tracks, rotated per episode.
5. **Exact caption measurement** with the loaded font instead of average letter widths.
6. **Art polish:** round transitions (a quick whip or flash), motion blur, a slight squash on landing, blinking during idle.
7. **Thumbnail and title helper** for uploads.

## Effort per episode (with the current setup)
| Step | Machine time | Hands-on time |
|---|---|---|
| Write the episode data (4 rows from the pair bank) | – | 5 min |
| Voices | ~30 s | – |
| Register and add the composition | – | 2 min (0 once automated) |
| 4 check stills | ~1.5 min | 2 min to look |
| Render (19 s video, 577 frames) | ~1 min | – |
| Loudness and checklist | ~10 s | 2 min |
| **Total** | **~3 min** | **~10–15 min** |

Add 15–45 min when an episode needs something new: a new reaction, a new emblem flag that has to be checked, or a layout fix. Add time for a human to watch and listen before uploading.
