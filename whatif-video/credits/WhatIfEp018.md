# Credits: WhatIfEp018 ("What if you held a teaspoon of neutron star?")

Render: `renders/WhatIf_Ep018.mp4` (45.9 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  1 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Thumb Piano Man" by Freedom Trail Studio**, from the **YouTube Audio Library**.
  Original: `public/music/Thumb Piano Man - Freedom Trail Studio.mp3`; loudness-normalised copy `public/music/whatif/thumb-piano-man.m4a`.
  Section used: 1:19-2:05 of the track (135s long), ducked about 19 dB under the voice.
  Its build at 1:39 lands on the climax (19.5s into the video).
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
- NASA: one sugar cube of neutron star material would weigh about 1 trillion kilograms (1 billion tons) on Earth. APPROXIMATE: National Geographic gives a lower figure (~100 million tons), so sources differ; the script says 'about' and uses NASA's. (NASA Science, 'Neutron Stars Are Weird' (science.nasa.gov/universe/neutron-stars-are-weird); NASA Imagine the Universe, pulsars)
- A sugar cube is about 1 cubic centimetre (1 mL). (NASA's sugar-cube comparison; standard sugar cube ~1 cm3)
- A US teaspoon is 4.92892 mL. (NIST Handbook 44 / US customary unit definition (1 teaspoon = 4.92892 mL))
- Great Pyramid of Giza mass in kg: about 5.9 million tonnes (estimates 5.5-6.75 million). APPROXIMATE; 'over seven hundred' holds across that range. (Great Pyramid of Giza, mass estimates (~5.9 Mt), Wikipedia and ScienceBlog summary of the Egyptological estimate)
- Neutron stars squeeze up to about twice the Sun's mass into a sphere the diameter of a city (radius ~10-13 km for a 1.4-Sun-mass star). (NASA Science, 'Neutron Stars Are Weird'; Chandra X-ray Center blog (radius 10.4-12.9 km for 1.4 solar masses))
- NASA calls neutron stars the densest material we can directly observe. (NASA Science, 'Neutron Stars Are Weird')
- World population passed 8 billion in November 2022. Average adult mass ~62 kg gives ~5e11 kg, under NASA's 1e12 kg per cube, so it fits (self-test). (UN World Population Prospects 2022; Walpole et al. 2012 (average adult human mass ~62 kg))
- Chandra: all of humanity could be squashed down to a sugar cube-sized piece of neutron star. (Chandra X-ray Center blog, chandra.harvard.edu/blog/node/432)
- UNCERTAIN / hypothetical: neutron star matter only holds together under the star's gravity; the video is a what-if and never claims what would physically happen to a released teaspoon beyond 'too heavy for the floor'. (Framing note; claims limited to NASA/Chandra figures above)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
