# Credits: WhatIfEp017 ("What if you sank to the Mariana Trench floor?")

Render: `renders/WhatIf_Ep017.mp4` (51.6 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  2 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"The World's Fair" by Godmode**, from the **YouTube Audio Library**.
  Original: `public/music/The World's Fair - Godmode.mp3`; loudness-normalised copy `public/music/whatif/the-worlds-fair.m4a`.
  Sections used: 0:18-0:29 of the track for the opening, then 0:00-0:41 from 10.5s into the video (cross-faded); 123s long, ducked about 19 dB under the voice.
  Its rise at 0:08 (from the track's quiet start) lands on the climax (19.0s into the video).
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
- Deepest observed point of Challenger Deep, 10,935 m (+/- 6 m at 95% confidence) below mean sea level, from the 2021 crewed-sub survey. (Deep-Sea Research Part I (2021) Challenger Deep survey, NOAA-affiliated; summarised by Live Science 'How deep is the Mariana Trench?')
- Mean seawater density in kg/m3 and g = 9.80665 m/s2 used for hydrostatic pressure P = 1 atm + rho*g*h. APPROXIMATE: ignores that deep water is slightly denser (real value is a little higher), so 'over a thousand' is safe. (Standard oceanography value (UNESCO/TEOS-10 mean surface seawater ~1025 kg/m3))
- At the Challenger Deep the pressure is more than 1,000 times standard sea-level atmospheric pressure (roughly 1,100 by other estimates). (Guinness World Records, 'Deepest point in the ocean'; Live Science (~1,100x))
- Maximum depth for recreational scuba diving: 40 m (130 ft). (PADI / recreational diving standards (Open Water 18 m, Advanced 30 m, Deep specialty 40 m))
- The Titanic wreck lies about 3,800 m (12,500 ft) deep, south of Newfoundland. (NOAA Ocean Exploration, RMS Titanic; Britannica)
- Mount Everest height above sea level 8,849 m. (Nepal/China joint survey, 2020)
- A juvenile Pseudoliparis snailfish was filmed at 8,336 m in the Izu-Ogasawara Trench (filmed 2022, announced April 2023): the deepest fish ever filmed. (University of Western Australia news, April 2023; Guinness World Records (Apr 2023); Natural History Museum (Apr 2023))
- Filmed in 2022 (Guinness gives 15 August 2022; Live Science says September 2022). (Guinness World Records (Apr 2023))
- A chemical (TMAO) that keeps fish proteins working under pressure is predicted to stop being enough near 8,200 m. This is a prediction by extrapolation, not an observation; the 2022 fish was filmed deeper than it. (Yancey et al., PNAS 111(12), 2014, 'Marine fish may be biochemically constrained from inhabiting the deepest ocean depths')
- UNCERTAIN: the Natural History Museum notes another fish was once reported deeper, but that record's reliability is questioned. The script only says this snailfish was 'filmed alive' at 8,336 m, which the sources support. (Natural History Museum, April 2023)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
