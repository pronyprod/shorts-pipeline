**TEMPLATE LOCKED 2026-10-31: no template changes until test results, only new episode content.**
**Exception, owner decision 2026-11-11: new episodes use the style kit (B, D, flat A or pixel P, whichever fits the topic; see
"Visual style" below and `src/kit/`). Published episodes keep rendering exactly as released (their 2D template code is untouched).**

# Channel: What If (English)
Style guide for this project. Derived from `C:\Users\<user>\claude video\breakdowns2.txt`, Format A
(A1 OutwardAnimates, A2 "What would happen?", A3 OddVibe = winners; A4 "What if for 5" = average).
This project is separate from `../my-video` (countryballs). Never edit files there.

## Format
- Vertical Shorts: 1080x1920, 30fps, **40-60 seconds** (owner, 12 Nov 2026; Round 3 in WHATIF_BANK.md overrides older style rules here).
  Scripts are written to about 2.3 words per second. The voice is never sped up past 1.05x: too long = cut words, re-take.
  Voice direction: clear, unhurried, punch on the key line. Every line joins cleanly (scripts/voice-clean.mjs check).
- ONE concrete, absurd, instantly imaginable premise ("What if a raindrop doubled in size every second?").
- The premise is shown in frame 1: title text plus the object, already moving. No intro, no logo, no "hey guys".
- MOTION FROM FRAME 1: background motion (e.g. rain) is already moving and the counter is already ticking in the
  very first frame. The story clock starts moving at frame 0 (no lead-in silence) and never stands still while a line
  is spoken, so the object is always visibly growing.

## Episode shapes (owner, 2026-11-05)
- Every premise has a **shape**: growth, journey, paradox, everyone at once, disappearing or swap (`WHATIF_BANK.md`).
  **No two consecutive episodes share a shape.** Each needs a clear payoff, a "feel smart" twist, and nothing depressing.
- So far: Ep001-Ep003 growth, Ep004 journey, Ep005 paradox, Ep006 everyone at once, Ep007 disappearing.
- The structure below is written for growth. Other shapes keep the frame-1 premise, a number on screen, the twist and the
  ending, but replace the ladder with what suits the shape (a trip with stops, a guess then a reveal...).

## Story structure (every episode)
1. Hook (0-4s): title + object + counter at its start value + the rule ("It doubles every second").
2. Escalation ladder (most of the video): the counter climbs; at each rung, a comparison to a familiar thing
   (marble -> ball -> car -> house -> stadium -> skyscraper -> mountain -> island -> planet...).
   A new rung every 3-6 seconds. Numbers must only go UP (A4's falling numbers are what the average upload did).
3. Climax: the honest physical consequence when it gets that big (keep it real physics, told playfully).
4. Twist: one surprising, true fact that reframes the ending (A1: "Rods from God size"; A2: "it always comes back").
5. Ending, from Ep004 on: "What should we [verb] next? The best comment becomes the next video."
   Hold the comment prompt only about 2 seconds (the spoken question plus ~0.6 s), never a long static end card.
   CLEAN LOOP: the last ~0.4 s cross-fades into frame 0 (same picture as the opening) and the music fades out
   and back in, so the replay starts seamlessly.

## The counter (backbone of every video)
- A big HUD counter near the top-middle (inside the safe area): small-caps label ("DIAMETER"), a huge numeral with unit,
  and a comparison line under it ("BIGGER THAN A HOUSE").
- Under it a progress bar. Default: log scale from the start value to the final value, with tick marks for each ladder rung.
- Units switch automatically when they get big (mm -> cm -> m -> km) and always show a sensible number of digits.
- A small story clock ("SECOND 12") shows story time. If narration needs story time slowed down, say so with a tag chip
  ("SLOWED DOWN") rather than faking the math.
- The counter, the progress bar and the visuals are all driven from the SAME computed data, so they always match.

## Visual style (owner decisions 2026-11-11: styles B, D, A, P; this replaces the old flat-2D-only rule)
New episodes are built with the style kit in `src/kit/` (Remotion + @remotion/three). Every style shares ONE character
design and ONE world. **The topic picks the style** (owner, 12 Nov 2026; no weekday rotation): each Round 3 idea in
WHATIF_BANK.md has a "Best style (2nd)", the episode gets the style that fits it best with a one-line reason in the log, and
there is only a soft target of about 1 D and 1 A-or-P a week (`.claude/commands/next-episode.md`). Pom has no shading shape under his mouth in any version.
A kit file picks the camera with `style` ("B" = a cut per beat, "D" = one continuous camera) and the drawing with
`look` ("shaded" default, "flat", "pixel"):
- **Style B (the default; fits almost anything):** blocky low-poly 3D. "Pom" in his 3D version (`PomBlock`: box body and limbs, a round
  smooth-shaded head, dot eyes, coral beanie with a pom-pom). One scene per beat with a quick cut (soft flash + settle)
  and a slow push-in; the screen counter is always on.
- **Style D (stories, real survivors, journeys):** the same world, with Pom as a flat paper cut-out (`PomPaper`: vector
  shapes on a thin white card with a visible edge and a real shadow, limbs on paper pins, a card flip to turn). ONE
  continuous camera through the places (push / pull / crane / drop / orbit moves, no cuts), light that changes with the
  story, and the counter on a board IN the world (the screen counter only shows while no board is readable).
  Real lighting: coloured light from lamps, windows and the sky, soft shadows, and a cool rim light that grows at night.
- **Style A (flat; big numbers and comparisons):** `style: "B", look: "flat"`. The same world drawn in flat cel colours through
  an orthographic, level side-view camera, with no shadows and a gradient sky; Pom is the paper version in pure flat
  colours. It looks like the original 2D episodes.
- **Style P (pixel; inside your body, tech, games):** `style: "D", look: "pixel"`. The world renders at a quarter of the size,
  then a palette pass cuts it to 20 neon colours with ordered dithering and scales it up with hard pixel edges. The
  counter is a pixel stat box, captions use a pixel font (Silkscreen / Pixelify Sans, free Google fonts), and a location
  trail at the top ("YOU > YOUR LUNGS > ...", the beat's `trail`) updates as the camera goes deeper. Best for "inside
  your body" premises (the `body` place: mouth, lungs, blood, light preset `body`).
- **Voiceless option** (`voice: false`, the old style C): text cards + music only. not used for normal episodes: music alone can't
  reach -14 LUFS with true peak ≤ -1 dBTP on our tracks without a limiter step (measured -15.1 LUFS / -1.1 dB).
- **Pom** is the channel's own recurring "you": round head, dot eyes, coral beanie with a pom-pom, blue jumper.
  Expressions: neutral, shocked, scared, relieved. Poses: idle, armsUp, hold, run, pointUp. Outfits recolour him
  (`suit` = plain white test suit when Pom stands in for a real person in a story; never draw a real person's likeness).
- **World look:** low-poly, flat colours, soft shadows, depth fog; light presets `day`, `sunset`, `night`, `space`, `lab`,
  `body`. Nine reusable places: street, city, ocean, space, desert, lab, forest, nightTown, body (`src/kit/places.tsx`).
  New places or props are fine when a premise needs them; build them from the same boxes and low-poly shapes.
- Blocky, but NOT a game look: no cube heads, no block textures, no Minecraft/Roblox/GTA style, no game UI. (The pixel
  look is a resolution and palette effect over the same world, not a block game.)
- No photos, no copyrighted characters, no other channel's characters, worlds or catchphrases.
- The counter keeps an "≈" comparison under every number (in the overlay pill and on the board), computed from the
  same value as the number, and every comparison is a sourced fact in `FACTS`.
- Original illustrations only. Comparison objects are drawn as simple low-poly objects.
- The rules below for the flat-2D template (palette, log-zoom world, true-scale growth) describe the published
  episodes Ep001-Ep009; keep them for those. In the kit, show growth by changing places or the scale of things.
- Palette: deep navy sky background, white HUD text, one accent colour per episode (raindrop episode: water blue),
  one alert colour (warm red/orange) for tags and climax.
- Font: heavy free font via @remotion/google-fonts (Montserrat ExtraBold/Black for numbers and captions).
- GROWTH MUST BE VISIBLE (most important rule). Use one true-scale world (everything placed in metres) seen through
  a continuous log-scale zoom camera:
  - The camera follows log(size) with a lag, so the object visibly swells on screen (up to ~1.6x) when it grows
    fast, then the camera keeps zooming out and the world shrinks away beneath it.
  - Every comparison object is drawn at its TRUE size relative to the object, standing next to it, entering from
    off-screen and shrinking away as the zoom continues. Never rescale an icon just to make it fit.
  - The ground is the real planet: flat at human scale, curving into the whole Earth as the zoom passes ~1,000 km.
  - Objects fade out when they get smaller than a few pixels or taller than the stage.
- Safe area: keep the top 10% (0-192 px) and bottom 20% (1536-1920 px) free of key elements (platform UI covers them).

## Captions
- Kit episodes (from 12 Nov 2026) use the lively captions in `src/kit/liveCaptions.tsx` (word pop-in, key word bigger in
  an accent colour, numbers bigger and counting, shake on impact words, bounce on twist/climax lines, pixel font in pixel
  mode). Same phrases, timing and safe band as below. The published 2D episodes keep `Captions.tsx`.
- Big, bold, white with a dark stroke/shadow, centred in the lower-middle band (above the bottom 20%).
- Synced to the voice: every narration line is its own audio clip, so caption timing comes from the clip timing.
  The currently spoken word is highlighted in the accent colour (karaoke style, timed proportionally within the line).
- Readable PHRASES of 2-5 words. Split at punctuation; never show a lone fragment like "16." or "Us.": glue it to
  the next (or previous) phrase; split longer runs evenly. Only exception: the title in frame 1 is shown whole.
- The caption text must be exactly what the narrator says (numbers may be written as digits).

## Voice
- English narrator generated locally with kokoro-js (Apache 2.0, free). ONE consistent narrator for the whole channel:
  `af_heart` voice, speed 0.92 (see `NARRATOR` in `scripts/generate-voices.mjs`). Never change it between episodes.
- Tone: playful, curious, second person where it helps ("you"). Moderate pace (about 150-170 words per minute).
- Short sentences, one idea per line.

### Gemini TTS: the channel narrator is **Puck** (owner's pick, 2026-10-30), from Ep001V3 on
- **Quota rule (owner, 2026-10-31): this project uses ONLY `gemini-3.8-flash-tts`.** 3.1 belongs to the fakta project:
  no 3.1 fallback here. If 3.8 runs out, stop and tell the owner. Max 10 requests per day, at least 20 s between calls.
  Note: the countryballs/fakta projects may share the same API key, so Google's real count can be higher than ours.
- Cloud TTS: `scripts/tts-episode.mjs <episodeId> --voice <name>`. The API key is read only from the
  `GEMINI_API_KEY` environment variable (Windows user scope); never print it, pass it as an argument or save it.
- Free tier = **10 requests per day per model** (gemini-3.8-flash-tts, confirmed by Google's 429; 3.1 assumed the same),
  resetting at midnight Pacific time (15:00 WIB in winter, 14:00 WIB in summer time). So the pipeline spends as few requests as possible:
  1. ONE request for the whole episode: per-line direction from `tests/<episodeId>_voice_direction.json`
     (3.8: per-line `style` field + angle-bracket vocal tags; 3.1: style as plain text + [tags]).
  2-3. The take is cut at the silences between lines and each clip is transcribed ON ITS OWN with whisper.cpp
     (`../fakta-video/whisper`); it must say exactly its line. Candidate cuts = silences where the line could end
     (from its word count), tried longest first. Whisper's word TIMES on a whole take drift across long pauses, so
     they are never used for cutting. Run pipelines one at a time or in parallel: temp files are per process.
     Always re-check a suspicious failure offline first (`--max-requests 0` re-uses the cached take for free).
  4. Only failing lines are re-generated, one request each, at most 2 retries. Extra or missing words always fail;
     swapped/merged words (likely mishearings) get a second, script-prompted listen.
  5. Clips are trimmed, normalised to -16.8 LUFS and saved as `lineNN.wav` + `voices.json` (same format as Kokoro),
     plus `preview.wav` with the episode's own pauses.
- Model: 3.8 only (`MODELS` in `scripts/tts/gemini.mjs`). On a daily-limit 429 it stops cleanly (exit 3) and says when
  the quota resets. Temporary overloads (HTTP 5xx) are retried twice with waits, then it stops. Requests per model per day
  are counted in `.tts-quota.json`. Then `scripts/tts-fit.mjs` caps pauses inside lines, sets one tempo (never above 1.05x; too long = cut words), cleans
  every line the same way and runs the line-join check (`scripts/voice-clean.mjs`).
- Every API response is cached in `<out>/raw/`. Re-running the same command never pays for the same audio twice.
- The tagged text must keep the script's exact words (captions depend on them); the tools refuse to run otherwise.
- After changing the pipeline, run `node scripts/tts-selftest.mjs` (offline, no API calls).

## Music and mix
- Continuous music under the voice from start to end, no silent gaps. No copyrighted songs, no vocals, no trending sounds.
- Template 3 (Ep001V3+): **YouTube Audio Library "building" tracks**, in this rotation (one per episode number, all
  versions of an episode share one, never the same twice in a row): New Morning, Spring Field, The World's Fair,
  Thumb Piano Man, Stasis, Wunderkind, Just Dance. Ignore whatif-curious-loop.wav and the other library tracks.
  - `npm run music:prepare` writes loudness-normalised copies (`public/music/whatif/*.m4a`, -16.8 LUFS like the voice)
    and finds each track's builds into `src/whatif/musicLibrary.ts`. Originals stay untouched.
  - `src/whatif/music.ts` starts the track at the offset that puts its biggest build on the episode's climax (the first
    `beat: "climax"` line). Every track's build must land on the climax (owner, 2026-10-31):
    - "track build": a build late enough in the track -> start the track so it lands on the climax (New Morning, Ep001V3).
    - "early build": the track only rises at its start (Spring Field 5.5 s, The World's Fair 8.5 s, Stasis 6.5 s): the
      video opens on a full-level stretch from later in the track, then cross-fades into the track's start at
      (climax - rise time), so the quiet start rises exactly onto the climax (Ep002, Ep003).
    - "mix build" (last resort, no usable rise at all): music held 4 dB lower before the climax, lifted at it.
  - Ducking: 19 dB under the voice while a line plays, -13 dB in gaps, 1 s fade-in, 0.4 s fade-out into the loop.
- Templates 1-2 (Ep001, Ep001V2): original code-generated loop released as CC0 (`scripts/generate-music.mjs`).
- Credits per episode: `node scripts/credits.mjs <episodeId> <CompositionId>` writes `credits/<CompositionId>.md`
  (exact track and section used, narration details, fact sources). Check each Audio Library track's licence note in
  YouTube Studio before publishing; some need an attribution line in the description.
- Final mix: about -14 LUFS integrated, peaks below -1 dBFS. Check every render with `npm run loudness -- renders/<Name>.mp4`.

## Facts (non-negotiable)
- Every number on screen or in the voice is computed in code from a stated formula, or comes from a named source.
  Never invent a number. Never round in a misleading direction ("bigger than X" must really be bigger).
- Each episode has a facts block in its data file: every constant with its value, unit and source.
- When a fact is uncertain or a simplification, say so in the facts block and tell the owner before rendering.
- Physics in the climax must be honest. Playful framing is fine; wrong physics is not.

## Project structure
- Reusable components: `src/whatif/components/` (Counter, ProgressLadder, Captions, Background, TitleCard, CommentCta, icons...).
- Episode data: `src/whatif/episodes/epXXX.ts` (premise, facts, the computed ladder, script lines, visual beats).
  A new episode should mostly be a new data file plus any new icons.
  - `stage: "tunnel" | "rope" | "crowd"`: a stage of its own instead of the world stage. `clockText(t)` replaces the chip text;
    `counterAt(t)` changes the counter's label or value (`text` for non-lengths), or hides it as "???" before a reveal (let viewers guess first).
  Episode content options (all optional, default = Ep001's raindrop; adding new ones must leave locked episodes
  byte-identical, checked against `renders/stills/Ep001V3_f*.png`):
  - `object`: what grows on the world stage: `"drop"` (sphere), `"domino"` (a true-scale chain that grows; `show:
    "topple"` knocks it over), `"jump"` (a jump path with "YOU" at the top; `show: "escape"` flies off).
  - `clockLabel` ("SECOND", "DOMINO #", "JUMP #"), `ctaTitle` (end-card question; its icon follows `object`).
  - Rung `placement: "altitude"` + `marker`: drawn up in the sky at that altitude (plane, ISS, Moon), not on the ground.
    Rungs with `icon: "drop"` only label the counter (nothing drawn).
  - Line `show: "card"` + `card: { title, lines }`: a fact card (sources/numbers for the twist).
  - Spoken numbers are built from the computed ladder with `numberWords` (`src/whatif/words.ts`), so the voice can't
    disagree with the maths. Each episode file has a self-test (`node src/whatif/episodes/epXXX.ts`).
- Voices: `npm run voices -- ep001` writes `public/voices/ep001/*.wav` and `src/whatif/episodes/ep001.voices.json`.
- Compositions are named `WhatIfEp001`, `WhatIfEp002`... Render to `renders/WhatIf_EpXXX.mp4`.
- Keep published episodes untouched. To change one, duplicate it (Ep001 -> Ep001V2).
- Template versions live in `TEMPLATES` in `src/whatif/theme.ts`. New episodes use the latest automatically; published
  episodes pin `template` in their data so they keep rendering exactly as released (Ep001 = 1, Ep001V2 = 2).
  Template 2 = `WorldStage` (log-zoom world), phrase captions, frame-0 motion, short end hold + loop cross-fade.
- After changing shared code, re-render a few stills of every published episode and compare them byte-for-byte
  with the stored stills in `renders/stills/`.
- Each episode data file has a self-test (`node src/whatif/episodes/epXXX.ts`) that fails if any comparison is untrue
  while it is on screen. Run it before rendering.

### The style kit (`src/kit/`, from Ep010 on)
- The script, FACTS, counter, rungs and voice stay exactly as above in `src/whatif/episodes/epNNN.ts` (+ `.voices.json`).
  Leave out `stage`; `diameterAt` and `rungs` are still required by the type (`diameterAt: () => 1` is fine when the
  counter uses `counterAt`). The 2D composition `WhatIfEpNNN` is not registered for kit episodes.
- The visuals are ONE extra file, `src/kit/episodes/kNNN.tsx`, registered in `src/kit/episodes/index.ts`
  (it shows up as the composition `Kit-kNNN`). It lists `beats`: for each beat, the line it starts on, the `place`,
  the `shot` (wide / medium / close / high / low / board / far), for D the `move` (push / pull / crane / drop / orbitL /
  orbitR / hold), the light `env` (day / sunset / night / space / lab), and Pom's `expr`, `pose`, `at`, `to` (run),
  `float`, `outfit`. Optional hooks: `opts` (place knobs: ocean `tide`/`waves`, space `moon`/`orbit`/`earthShift`, lab
  `chamber`, street `sag`/`collapse`), `extras` (episode-only 3D props), `tags` (labels pinned to 3D points),
  `pomScale`, `dim` (fade to black), `moon` (night-sky moon). Examples: `k007b.tsx` (style B), `k008d.tsx` (style D).
- The counter comes from the episode's `counterAt`/`counterLabel`, and the "≈" line from the latest rung label, unless
  the kit file gives `counter`. Captions, voice timing and music are the channel's own (`Captions`, `buildSchedule`,
  `planMusic`), so credits.mjs and the loudness rules work unchanged.
- One beat per narration line is normal; never more than ~6 s on one framing in B. Keep Pom and the board inside the
  narrow 9:16 frame: use the anchor-based shots, and review stills of every beat before rendering.
- Render with WebGL: `npx remotion render src/index.ts Kit-kNNN renders/WhatIf_EpNNN.mp4 --gl=angle`
  (stills: `npx remotion still ... --gl=angle`). Never add `--gl` to the published 2D episodes' renders.
- Measured 11 Nov: a 75 s B episode renders in ~82 s, a 48 s D episode in ~58-60 s (12 threads; the D lighting
  upgrade did not change that). Night scenes with many lit windows cost about 2 s per video second; flat and pixel
  clips about 1.5-1.7 s per video second.
- `untilLine` cuts a kit episode short (test clips); `trail` (pixel), `look`, `voice` are per kit file.
- Sound effects (12 Nov): `src/kit/sfx.tsx` adds them automatically (whoosh on cuts/moves, tick on each new rung, ding
  when a "???" is revealed, impact on the climax line, pop on the twist) plus a quiet ambience per place; a beat can add
  `sfx: ["impact", { name: "pop", at: 1.2 }]` or set `ambience`. All sounds are generated by `scripts/make-sfx.mjs`
  (`public/sfx/`, see CREDITS.md). Measured: the effects alone sit about 12 dB under the mix; loudness rules unchanged.

## Upload files
`uploads/EpNNN.txt` has exactly these five labels, one per line: `Title:` (hook, under 60 characters), `Hook line:`,
`Episode hashtags:` (1-2 only), `Music:` ("Track" by Artist), `Pinned comment:` (a question that makes people comment;
never "like/share/subscribe if"). The spreadsheet builds the full description and the core hashtags.

## Quality checklist before saying a video is done
- Premise visible in frame 1? Rain/background moving and counter ticking in frame 1? Ladder rungs every 3-6s?
- Does the object visibly grow, with the camera zooming out and comparison objects at true relative size?
- Captions in 2-5 word phrases, no lone fragments? Comment prompt held ~2 s? Last frame cross-fades into frame 0?
- Every number traced to code or a source? Uncertain facts flagged?
- Captions readable on a phone and synced? Nothing important in the top 10% / bottom 20%?
- One narrator, music continuous, about -14 LUFS, peaks below -1 dBFS? Length 45-75s?
- Ends with the "comment the next what if" question?
