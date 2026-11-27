# Credits: WhatIfEp022 ("What if you stacked every LEGO brick ever made?")

Render: `renders/WhatIf_Ep022.mp4` (50.1 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  1 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"New Morning" by TrackTribe**, from the **YouTube Audio Library**.
  Original: `public/music/New Morning - TrackTribe.mp3`; loudness-normalised copy `public/music/whatif/new-morning.m4a`.
  Section used: 0:06-0:56 of the track (212s long), ducked about 19 dB under the voice.
  Its build at 0:27 lands on the climax (21.0s into the video).
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
- About 600 billion LEGO elements produced as of July 2015 (400 billion in 2008 per Time, 28 Jan 2008). APPROXIMATE and a floor: output has continued since. The script treats every piece as one standard brick ('count each piece as one brick'), which is a deliberate simplification: plates and small parts are shorter, so the real stack would be somewhat lower. (UK Intellectual Property Office blog, Dec 2016 (600 billion as of July 2015); Time, Leo Cendrowicz, 28 Jan 2008 (400 billion); both cited on Wikipedia 'Lego')
- A standard LEGO brick is 9.6 mm tall without the stud (studs fit inside the brick above, so a stack adds 9.6 mm per brick). (LEGO brick dimensions: LUGNET FAQ / BrickOwl / BrickLink help (9.6 mm brick, 3.2 mm plate, stud 1.7 mm))
- World population about 8.3 billion in 2026. (UN World Population Prospects 2024 (via PRB 2026 data sheet, Worldometer))
- The International Space Station orbits at roughly 400 km (it varies with reboosts and drag). (NASA ISS facts (nasa.gov/international-space-station))
- Average Earth-Moon distance 384,400 km. (NASA Moon Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html))
- Open University engineers with BBC Radio 4 'More or Less' (2012) crushed a 2x2 brick in a press: it failed at about 4,240 N (about 432 kg); one brick weighs 1.152 g, so about 375,000 bricks stacked would crush the bottom one, a tower about 3.5 km tall. APPROXIMATE (ideal straight tower, 2x2 brick). (BBC Radio 4 More or Less / Open University, Dec 2012; reported by Gizmodo, The Brothers Brick (4 Dec 2012))
- Failure load of a 2x2 brick: about 4,240 N = about 432 kg. The script says 'about four hundred and thirty kilograms'. (Same BBC More or Less / Open University test (2012))

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
