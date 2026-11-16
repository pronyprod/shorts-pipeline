**TEMPLATE LOCKED 2026-10-31: no template changes until test results, only new episode content**
Optional formats (reverse quiz, size duel, words) live in src/countryballs/formats/, separate from the normal round. They never change existing episodes.

# Channel: Countryballs (English)
## Format
- Vertical Shorts: 1080x1920, 30fps, 15-25 seconds.
- Series "Flag Family": parents (two balls with the same flag) + child (a different country whose flag visibly resembles theirs). Viewer guesses the child before the reveal.
- 4 rounds per episode, ~4.5s each, then end on a near-black frame so the video loops.
- Every video must have motion in the very first frame. No intro, no logo, no "hey guys".
## Round timing (per round)
0.0s mom ball whip-zooms in (scale 3->1, blur 8px->0) + "MY MOM:" flag card top-right
0.6s dad ball slides in from left + "MY DAD:" flag card top-left
1.2s "GUESS!" label + 3-2-1 countdown ring (about 1.2s total)
2.4s child ball pops up front-centre (spring) + "ME:" flag card; background tweens from grey to child's main colour
2.8s expressions change (half-lidded/smug); child says the punchline; caption of the punchline shown
## Visual rules
- Countryball: circle clipped flag SVG, thick black outline (~6px at 300px ball), soft shading (radial highlight top-left, inner shadow bottom-right), two white eyes without pupils, animated eyelids for expressions (open, half-lidded, squint, shocked).
- Flags: use the flag-icons npm package SVGs. Flags must be accurate. Never invent or approximate a flag.
- Background: radial gradient with dark vignette. Neutral start #7F8887; tween to the child flag's dominant colour (darkened) on reveal.
- Labels: bold white caps with dark shadow ("MY MOM:", "MY DAD:", "ME:", "GUESS!"). Font: a heavy free font (e.g. Montserrat ExtraBold via @remotion/google-fonts).
- Captions for spoken punchlines: large, centred lower third, white with black stroke, max 6 words.
- Punchline captions sit on a subtle dark rounded pill (black at ~45% opacity) so they read well over striped flags.
- Captions are big and bold: ~80-90px cap height at 1080 width for one line (Montserrat Black), two lines when needed. The pill padding stays slim so the text gets the space. Captions never overlap the child ball.
- Emblem-safe eyes: when a flag has an important central emblem, its eyes move toward the top of the ball and get a bit smaller so the emblem stays clearly visible ("down" instead for emblems near the top). The per-country list is in src/countryballs/emblems.ts; a round can force it with `parentEyes` / `childEyes`. Always turn it on for any flag whose emblem the punchline is about. Check new entries on the EmblemCheck still in Studio (Tests folder).
- The confused "?" sits beside the parent's head (template 3+), never hidden behind the flag cards.
- Light rays (squint/blinded reaction) are drawn on the background only, behind all balls, so they never cover or fade them.
- Keep the top 10% and bottom 20% of the frame free of key elements (platform UI covers them).
- Each round's parent and child reactions must match the punchline. Never reuse the same reaction in consecutive rounds. Available reactions: shocked, squint, disappointed, confused, proud, smug, defiant, innocent, laughing, crying. Add new ones to the CountryBall component when needed.
## Audio
- Voices generated locally with kokoro-js (free, commercial use OK). Mom = a female English voice, Dad = a male English voice, Child = a different, younger-sounding voice. Spoken lines: "My mom.", "My dad.", "Me." and the punchline.
- No copyrighted music or trending sounds. Music = YouTube Audio Library tracks ("attribution not required") in public/music; the old generated loop (flag-family-loop.wav) is retired. "This Old Man" only as a last resort (nursery-rhyme melody).
- Every track is loudness-normalised to -16.2 LUFS (peaks limited to -1.5 dBFS) into public/music/norm (`npm run normalize-music`; originals untouched). Track list, lively start points and rotation order: src/countryballs/music.ts.
- Each episode sets `music` in its data. Never the same track in two consecutive episodes (checked automatically; versions like Ep002V2 count as the same episode). Music starts at the track's lively point, fades in over 0.3s and fades out to the last frame.
- Every episode's track goes into CREDITS.md (title, artist, "YouTube Audio Library, attribution not required").
- Normalise voice loudness so lines are equally loud.
- Final mix: about -14 LUFS integrated (YouTube's playback level), peaks below -1 dBFS, voices clearly above the music (music ~18-20 LU under the voices). Check every render with `npm run loudness -- renders/<Name>.mp4`.
## Content rules
- Use only original flag pairs and our own punchlines. Never copy another channel's pairs or jokes.
- Punchlines: 3-6 words, deadpan, explain the visual flag difference.
- Episode data lives in src/countryballs/episodes/epXXX.ts. One data row = one round. Changing data must be enough to make a new episode.
## Production rules
- Reusable components in src/countryballs/components/ (CountryBall, FlagCard, Countdown, Caption, Background, Round).
- Keep existing compositions untouched. Before editing an episode, duplicate it (e.g. Ep001 -> Ep001V2).
- Render to renders/ and name files after the composition.
- Template polish goes into the shared components as a new template version (TEMPLATES in src/countryballs/theme.ts). New episodes use the latest automatically; older episodes pin `template` in their data so they keep rendering exactly as they were published.
## Quality checklist before saying a video is done
- Motion in frame 1? Flags accurate? Text readable on a phone? Emblems visible (not covered by eyes)? Captions big and clear of the child? Nothing important in the top 10% / bottom 20%? Audio levels even? About -14 LUFS? Loops cleanly?
