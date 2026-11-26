# Credits: WhatIfEp021 ("What if you stood on Venus for one minute?")

Render: `renders/WhatIf_Ep021.mp4` (46.1 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  2 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Just Dance" by Patrick Patrikios**, from the **YouTube Audio Library**.
  Original: `public/music/Just Dance - Patrick Patrikios.mp3`; loudness-normalised copy `public/music/whatif/just-dance.m4a`.
  Section used: 0:33-1:19 of the track (158s long), ducked about 19 dB under the voice.
  Its build at 0:52 lands on the climax (18.9s into the video).
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
- Mean surface temperature of Venus 737 K = 464 C. (NASA NSSDC Venus Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html))
- Surface pressure 92 bars (about 91 Earth atmospheres). (NASA NSSDC Venus Fact Sheet)
- Lead melts at 327.5 C, below Venus's 464 C, so 'hot enough to melt lead' is true. (CRC Handbook of Chemistry and Physics (lead melting point 600.61 K); Wikipedia 'Lead')
- Seawater density ~1025 kg/m3, g = 9.81 m/s2; depth where the water pressure alone reaches 92 bar is computed below (about 915 m); the script says 'about nine hundred metres'. Comparison of pressure only. (NOAA seawater density ~1025 kg/m3; standard gravity (NIST))
- Venus's clouds are made mostly of sulfuric acid droplets, high above the surface. (NASA Science, Venus overview (science.nasa.gov/venus/))
- Venus is the hottest planet in the solar system, hotter than Mercury though farther from the Sun. (NASA Science, Venus facts (science.nasa.gov/venus/venus-facts/))
- Only uncrewed probes have landed on Venus; no human has. (NASA NSSDC, Soviet Venera landers (Venera 7 in 1970 first to transmit from the surface))
- Venera 13 landed on 1 March 1982 and operated on the surface for at least 127 minutes; it was designed for about 32 minutes. (Wikipedia 'Venera 13' (citing NASA NSSDC Venera 13 and Soviet mission records))
- Designed lifetime on the surface about 32 minutes. (Wikipedia 'Venera 13'; NASA NSSDC)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
