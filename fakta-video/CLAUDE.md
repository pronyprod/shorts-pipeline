> **TEMPLATE LOCKED 2026-10-31: no template changes until test results, only new episode content.**
> The locked template is Fakta_Ep001V3 (owner-approved, Puck voice). New episodes reuse its components, layout rules, voice, music system and finalize settings unchanged.
>
> **Quota rule:** this project uses ONLY `gemini-3.1-flash-tts` (API id `gemini-3.1-flash-tts-preview`). The what-if project uses 3.8: never call 3.8 from here and never touch the what-if project. At most **10 requests per day** (Pacific day; resets ~14:00 WIB), at least **20 s between calls**. Each request is counted in `.tts-quota.json`.

# Fakta video channel: style guide and working rules

Indonesian "fakta unik" Shorts told with ORIGINAL animated maps and infographics.
Built from two studies in `C:\Users\<user>\claude video\`: `breakdowns.txt` (video 1, Andai Peta, 2.69M views on a 7K-sub
channel with original map animation) and `breakdowns2.txt` (Format B lessons: the winners re-voice other people's footage,
which we never do; we take their story arcs, dense VO and constant music instead).

This project is separate from `my-video` (countryballs) and `whatif-video`. Never edit those from here.

## Owner and working rules
- The owner is not a coder. Explain simply; run commands yourself.
- Free tools only. No paid APIs.
- Every fact is checked and has a source in the episode file. If a number can't be sourced or computed, cut it.
- After each render, report: length, loudness (LUFS + true peak) and every measured number with its source.

## Format (non-negotiable)
| item | rule |
|---|---|
| language | Indonesian, casual register ("nggak", "nyemplung", "ayo"), telegraphic: one fact per clause |
| frame | vertical 1080x1920, 30 fps |
| length | 40-60 s (owner, 12 Nov 2026; was 45-90 s) |
| visuals | ONLY our own: animated maps, infographics, icons, counters, flags. NEVER other people's footage, clips, photos of real people or re-uploaded animation |
| map base | NASA Blue Marble (public domain) and/or Natural Earth (public domain). Every source goes in `CREDITS.md` |
| hook | a number or a question on screen in the FIRST SECOND, no intro, no logo |
| arc | a story, not a list: question -> measure -> test -> result -> twist -> second test -> twist -> local payoff -> question to the viewer |
| twists | a new reveal or setback every 5-8 s ("Tapi tunggu...", "Bahkan...", "Satu lagi...") |
| variety | no two consecutive episodes in the same category (geography, history, animals, language, science, food, records, Kenapa). Topics and the episode log are in `claude video\FAKTA_BANK.md`. "Kenapa…?" = a surprising fact with a payoff, not a how-it-works lesson |
| tebak dulu (Ep004+) | a "Tebak dulu di komentar…" line right before the big number, with "?" on screen, then the reveal |
| identity question (Ep004+) | the ending question is about the viewer ("Kamu dari pulau mana?", "Bahasa daerahmu apa?") with example answers as pills |
| local comparison | always tie the scale to Indonesia (Sabang–Merauke, Jakarta–Surabaya, Jawa, WIB/WITA/WIT…) |
| ending | a question that is easy to answer in one word, + "Tulis di komentar". The question is on screen **2-3 s** in total (spoken line ~2.5 s + 0.3 s end hold); show the answer options as pills instead of reading them out |
| voice | Indonesian VO by **Gemini TTS** (no human recordings: owner's decision, 29 Oct). Model `gemini-3.1-flash-tts-preview` (3.8 is saved for the other channel). Clear and unhurried, punch on the key line (owner, 12 Nov 2026): about 2.3 words per second written, the voice never sped up past 1.05x, 0.3 s between lines. Put "Voiceover: AI" in the description; never remove the SynthID watermark |
| captions | Indonesian, synced with Whisper.cpp word timestamps, max 3 words / 22 characters per line, 70 px, top at y = 1390 (bottom ≈ 1467) |
| music | YouTube Audio Library tracks in `public/music`, **one per episode, rotated** (`pickTrack` in `src/music.ts`: least recently used first; record each episode in `USED` and in CREDITS.md). Never `peta-pulse.wav` (retired). "Sad Eyed Waltz" only once the owner approves it (`APPROVED`). "Good Starts" only for episodes under 58 s. Use the normalised copies (`npm run music`, −16 LUFS). Mix with `<Soundtrack>`: music **19 dB under the voice** while talking (rule 18-20 dB), 9 dB under in gaps over 0.6 s, 0.6 s fade-in, 1.2 s fade-out; never silent |
| loudness | final mix ~ -14 LUFS integrated, true peak <= -1.5 dBTP (`scripts/finalize.mjs`) |
| sources | every fact listed in the episode's `SOURCES` array and in `episodes/EpNNN.md` |
| file size | final MP4 **15-30 MB for ~70 s**: render a near-lossless master (CRF 14), then `finalize.mjs --target-mb=26` (x264 two-pass, preset slow). Check that SSIM vs the master is >= 0.98 (no visible loss) |
| voiceover script | every episode gets a line list with timing (line number, time in video, length, text, pronunciation notes for the TTS direction) in `VOICEOVER_SCRIPT.md` or the episode file |

## Visual vocabulary (learned from Andai Peta; our own design and colours)
Use the same *kinds* of elements, never their look:
- **Route lines**: self-drawing great-circle lines in turmeric `kunyit` (#FFB000) with an ink under-stroke and soft glow (`<Route>`).
  The comparison country's line is `toska`.
- **Pop-in pills / chips**: cream pills with ink text (`<Pill>`), spring pop-in; map labels follow the projection (`<MapLabel>`).
- **Stamps**: rotated outlined boxes that slam in (1.6x -> 1x) for twists ("TANPA TRIK", "TETAP KALAH") (`<Stamp>`).
- **Number counters**: big numbers ticking up with an Indonesian thousands dot: 5.240 KM (`<Counter>`, `fmt()`).
- **Flag rows**: flags appearing one by one (`<FlagRow>`, flag-icons SVGs in `public/flags`).
- **Continuous camera**: ONE map shot per video, no hard cuts. The camera pans/zooms continuously (`camera(t)` in the episode).
- **Infographics**: bars and squares that are TO SCALE (bar length ∝ km, square side ∝ √area).

### Design system (ours, do not copy Andai Peta's navy/yellow/red)
| token | hex | use |
|---|---|---|
| kunyit (turmeric) | #FFB000 | routes, key numbers, the spoken caption word |
| koral | #FF5D73 | Indonesia shape, stamps, warnings |
| toska | #3DDBD9 | the "other" country being compared |
| krim | #FFF4E0 | pill background |
| tinta (ink) | #1B1028 | text on pills, outlines, shadows |
| angkasa | #07060D | space around the globe |
- Font: **Plus Jakarta Sans** 800/600 (OFL; designed in Indonesia), uppercase for labels and captions.
- Captions: white uppercase, 70 px, 14 px ink outline, current word turmeric, no box, top at y = 1390 (V1 used 1470, which reached into the bottom 20%).
### Phone readability (from V2 of Ep001; these override older numbers)
- **Zoom:** the main country (and the shape laid over another country) fills **~85-90% of the frame width**. For Indonesia (5.366 km) that is a camera `widthKm` of ~6.200-6.300. Zoom out only *during* a drag (the "hop"), never for a held shot.
- **Text size:** every pill, label, bar label and caption is **>= 54 px font size** (capital letters ≈ 40 px tall at 1080 width). Headlines 90-116 px, counters 160 px. Shorten the text rather than shrinking it: one fact per pill, about 20 characters max at 54 px.
- **Bottom 20% is empty:** nothing below **y = 1536**, because the YouTube/TikTok UI covers it. Map labels use `<MapLabel clamp maxY={1516}>`, which keeps the whole pill inside the frame (28 px margin) and above that line.
- **Layout:**
  - headline/counters/bars: y 110-560
  - map: centred at y = 900
  - stamps/pills: y ≈ 1150-1300
  - captions: y 1390-1467
- **Labels on the same map at the same time:** put them on opposite sides of their pin (one above with `dy ≈ -80`, one below with `dy ≈ +85`) so they never overlap. Remove a label as soon as its beat is over.
- **Animated rows** (flags etc.) must finish popping in at least 0.5 s before the scene ends. With 12 flags, use a step of about 0.07 s.
- **Check before rendering:** render a contact sheet of ~12 frames with a line drawn at y = 1536, and look for overlaps and clipped text.
- Map grade: Blue Marble slightly darkened and cooled (`grade()` in `MapView.tsx`) so overlays pop.

## Honest maps (important for "true size" topics)
- Moving a country = **rotating it on the sphere** (`moveGeo` in `src/lib/geo.ts`), never shifting it on a flat map.
- Everything in a frame is drawn with ONE projection: Lambert azimuthal equal-area centred on the camera, ONE scale.
  The raster (Blue Marble) and the vectors (Natural Earth) use the same maths (`MapView.tsx`).
- Distances: great-circle (haversine, R = 6371.0088 km) with a WGS84 Vincenty cross-check (`scripts/distances.mjs`).
- Narration about where things land (e.g. "Merauke masuk Laut Kaspia") must come from `scripts/probe-placement.mts`, not from eyeballing.

## Pipeline (per episode)
1. Research facts -> `data/epNNN-facts.json` via a script; list sources in `src/episodes/epNNN-script.ts` (`SOURCES`).
2. Write the script lines (`SEGMENTS`), numbers written out as words for the TTS.
3. `node scripts/make-voice.mts --ep=<version>` -> voice + `<version>-timing.json` (today: edge-tts placeholder `id-ID-ArdiNeural`; Gemini goes here once the owner picks a voice).
   Versions (script line sets) are listed in `VERSIONS` in the episode script file, e.g. `ep001`, `ep001v2`.
   Write `VOICEOVER_SCRIPT.md` from the timing file (per line: number, file name, time, length, text).
   The joined voice is normalised to −16 LUFS (`VOICE_LUFS`), which the music levels assume.
   **Voice = Gemini TTS, narrator Puck** (owner's pick, 30 Oct; edge-tts is retired; owner recordings are cancelled):
   - One command per episode version, e.g. `npm run voice:v3`, which runs:
     1. `scripts/gemini-voice.mts --ep=<version>`: ONE request for the whole episode (persona + one direction per line in the script file, e.g. `VOICE_V3`). Then local Whisper splits the take into lines and checks every word and every number. Only wrong lines are re-generated (1 request each). Responses are cached in `data/tts/<version>/raw/`, so re-runs are free.
     2. `make-voice.mts --own --tts`: trims the lines, speeds them up towards ~138 wpm but never past 1.05× (too long = cut words), cleans every line the same way (scripts/voice-clean.mjs), runs the join check, joins them with 0.3 s gaps, and normalises to −16 LUFS.
     3. `make-captions.mts`.
   - **TTS safety rule:** Gemini blocks some text (`finishReason: SAFETY`) and each block costs a request. In spoken text avoid: war-like wording, imagined explosions in real places, weapon comparisons, numbers of people who died, and comparisons of ethnic groups ("kelompok berkuasa", "dikalahkan"). Keep such facts on screen as text. Neutral directions only.
   - A line with a wrong NUMBER is never accepted. One stray word is tolerated, because Whisper mishears names.
   - Voice test (choosing a voice): `scripts/voice-test-gemini.mjs` writes `tests/id_<Voice>.wav`.
   - API key: only from the `GEMINI_API_KEY` environment variable. Never print it, pass it as an argument, or save it.
   - Free tier: 10 requests per day per model, shared by ALL channels (one Google project); resets ~14:00 WIB. Wait 20 s between requests (3 per minute). Count each request in `.tts-quota.json`; only READ the other projects' counters.
   - Gemini speaks Indonesian slower than edge-tts (~105-115 wpm in the 30 Oct test). Do NOT ask for a fast pace and do not speed up past 1.05× (owner, 12 Nov 2026: fast voices lose scrollers); write fewer words instead.
   Because every beat is keyed to spoken words (`at(segment, word)`), the video re-times itself to a new voice.
4. `node scripts/make-captions.mts --ep=<version>` -> Whisper.cpp (small, multilingual, `language: id`) word timestamps, aligned to the script spelling.
5. Build the timeline in `src/episodes/EpNNN.tsx`; time beats to spoken words with `at(segment, word)`.
6. Render a contact sheet of check frames, then 4 stills for review (`npx remotion still ...`), then render.
   For example, `npm run render:ep001v2` does a CRF 14 master, then x264 two-pass to ~26 MB, then loudness finalize.
7. Report length, loudness, file size, SSIM and the sourced numbers.
8. A new version of an episode is a new composition and file (`EpNNNV2.tsx`). Never change a published version's file, voice or captions.

Studio: `npm run dev` -> http://localhost:3001 (port 3001 so it never clashes with `my-video` on 3000).

## Files
- `src/episodes/ep001-script.ts`: script, numbers, placements, SOURCES (single source of truth)
- `src/episodes/Ep001.tsx`: the V1 video timeline (frozen). `src/episodes/Ep001V2.tsx`: V2 (phone readability). `src/episodes/Ep001V3.tsx`: V3 = V2 picture + Puck voice + Brain Trust music (the version to publish)
- `VOICEOVER_SCRIPT.md`: lines + timing (owner recording cancelled; reference only)
- `src/music.ts`: track list, rotation, mix levels. `src/components/Soundtrack.tsx`: voice + ducked music. `scripts/prepare-music.mjs`: normalised copies
- `tests/`: voice tests and mix previews (not used in renders)
- `PRODUCTION_NOTES.md`: problems, workarounds, improvements, effort
- `src/components/MapView.tsx`: projection, Blue Marble re-projection, `<Geo>`, `<Route>`
- `src/components/ui.tsx`: Pill, Stamp, Counter, FlagRow, Pin, MapLabel, Captions
- `src/lib/geo.ts`: true-size rotation helpers
- `scripts/`: distances, map data, placement probe, voice, captions, music/SFX, finalize
- `episodes/Ep001.md`: human-readable script + sources
- `CREDITS.md`: every external asset and its licence
- `src/voice.ts`: the locked narrator (Puck, 3.1) shared by every episode; `scripts/episode.mts`: loads `src/episodes/epNNN-script.ts` for the voice/caption scripts
- `uploads/EpNNN.txt`: per episode, exactly 5 labelled lines in Indonesian: `Title:` (hook, < 60 chars), `Hook line:` (one short sentence), `Episode hashtags:` (1-2; the spreadsheet adds the core hashtags and builds the description), `Music:` ("Title" by Artist), `Pinned comment:` (a guess or identity question; no begging for likes or shares)
- Episodes: Ep001 (V3), Ep002 coastline, Ep003 Krakatau, Ep004 Run/Manhattan, Ep005 Kenapa bahasa Jawa; facts for 2-3 computed by `scripts/facts-ep002-003.mjs`
