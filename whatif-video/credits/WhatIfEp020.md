# Credits: WhatIfEp020 ("What if you sent Voyager 1 a message?")

Render: `renders/WhatIf_Ep020.mp4` (48.3 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  1 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Wunderkind" by Freedom Trail Studio**, from the **YouTube Audio Library**.
  Original: `public/music/Wunderkind - Freedom Trail Studio.mp3`; loudness-normalised copy `public/music/whatif/wunderkind.m4a`.
  Section used: 1:11-2:00 of the track (187s long), ducked about 19 dB under the voice.
  Its build at 1:31 lands on the climax (19.1s into the video).
  Licence: YouTube Audio Library. Before publishing, check this track's licence note in YouTube Studio > Audio Library
  (some tracks require an attribution line in the description). Off YouTube, if a platform mutes it, swap to that platform's library.

## Visuals
- Episodes up to Ep009: original flat SVG shapes made for this channel (`src/whatif/components/`). From Ep010: the
  channel's own style kit (`src/kit/`): original low-poly 3D scenes, the channel character Pom, built in code with
  three.js (MIT) via @remotion/three.
- Font: **Montserrat** (Julieta Ulanovsky and contributors), SIL Open Font License 1.1, via `@remotion/google-fonts`.
  Pixel look: **Silkscreen** (Jason Kottke) and **Pixelify Sans** (Stefie Justprince), SIL Open Font License 1.1.

## Sound effects
- Kit episodes: all sound effects (whoosh, impact, tick, pop, ding, splash, crowd, sizzle, heartbeat, clock, shake, wind, rumble, waves, hum) are generated in code by
  `scripts/make-sfx.mjs` for this channel. No third-party audio; nothing to attribute.

## Facts and sources
- Speed of light in vacuum, km/s (exact by definition). (SI definition (BIPM); NIST CODATA)
- One astronomical unit in km (exact by IAU 2012 definition). (IAU 2012 Resolution B2)
- Mean Earth-Moon distance, 384,400 km. Light takes about 1.28 s; the voice says 'just over a second'. (NASA Moon Fact Sheet (mean distance 384,400 km))
- Pluto's average distance from the Sun, about 39 AU. NASA says sunlight takes 5.5 hours to reach Pluto; the voice says 'about five and a half hours'. Radio from Earth travels the Earth-to-Pluto distance, which varies; the voice talks about the Sun-to-Pluto distance only as a size comparison, so the line says 'Pluto is about five and a half hours' away from the Sun: see self-test (computed 39 AU = 5.4 h, NASA 5.5 h). (NASA Science, Pluto Facts ('on average, Pluto is 3.7 billion miles (5.9 billion kilometers) away from the Sun, or 39 AU ... it takes sunlight 5.5 hours'))
- Voyager 1's distance at the one-light-day moment, 18 Nov 2026 10:16:07 UTC: 173.14 AU = about 25.9 billion km (16.1 billion miles). (EarthSky, 'Voyager 1 will be 1 light-day from Earth' (18 Nov 2026); NASA, 'Voyager 1 reaches one light-day' (12 Nov 2026))
- Voyager 1 reached one light-day from Earth on 18 November 2026. TIMELY source dated 12 Nov 2026 (NASA SVS, 'How Far Away Is Voyager 1? One Light-Day, Explained') and 17-18 Nov 2026 (ABC7, EarthSky). Sources differed on the clock time zone; only the date is used. (NASA Scientific Visualization Studio 15120 (12 Nov 2026); EarthSky (18 Nov 2026); ABC7 (17 Nov 2026))
- NASA: at one light-day a command from Earth takes 24 hours to reach Voyager 1, and its answer another 24 hours to return. (NASA SVS 15120 (12 Nov 2026))
- Voyager 1 launched 5 September 1977. (EarthSky (18 Nov 2026); NASA JPL Voyager mission page)
- Voyager 1 is still returning data from interstellar space (a 48-hour contact loss in Oct 2026 was regained). (ABC7 (17 Nov 2026); NASA JPL)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
