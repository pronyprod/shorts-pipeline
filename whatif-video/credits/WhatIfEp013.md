# Credits: WhatIfEp013 ("What if every ant on Earth came for you?")

Render: `renders/WhatIf_Ep013.mp4` (51.2 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  4 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.6s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Wunderkind" by Freedom Trail Studio**, from the **YouTube Audio Library**.
  Original: `public/music/Wunderkind - Freedom Trail Studio.mp3`; loudness-normalised copy `public/music/whatif/wunderkind.m4a`.
  Section used: 1:10-2:01 of the track (187s long), ducked about 19 dB under the voice.
  Its build at 1:31 lands on the climax (20.3s into the video).
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
- At least about 20 quadrillion (20 x 10^15) ants alive on Earth at any time; a conservative estimate (ants living underground are mostly not counted). (Schultheiss, Nooten, Wang, Wong, Brassard & Guénard, 'The abundance, biomass, and distribution of ants on Earth', PNAS 119(40), e2201550119 (19 Sept 2022), doi:10.1073/pnas.2201550119)
- The estimate pools 489 ant-counting studies from every continent and major biome. (Schultheiss et al. 2022, PNAS (abstract); Mongabay, 'How many ants live on Earth? At least 20 quadrillion, scientists say' (Dec 2022))
- Year the estimate was published. (Schultheiss et al. 2022, PNAS)
- Total ant biomass about 12 megatonnes of dry carbon. (Schultheiss et al. 2022, PNAS (abstract))
- Wild mammals about 0.007 Gt carbon (7 Mt C). (Bar-On, Phillips & Milo, 'The biomass distribution on Earth', PNAS 115(25): 6506-6511 (2018))
- Wild birds about 0.002 Gt carbon (2 Mt C). Schultheiss et al. 2022 state that ants exceed wild birds and mammals combined. (Bar-On, Phillips & Milo 2018, PNAS; Schultheiss et al. 2022, PNAS)
- World population about 8.2 billion (2025). With 8.0 billion (the paper's own figure) it is 2.5 million ants per person; with 8.2 billion it is 2.44 million, so the voice says 'almost two and a half million'. (United Nations, World Population Prospects 2024 (Summary of Results))
- UNCERTAIN / upper end: driver ant (Dorylus) colonies are described as reaching about 20 million workers; some sources give lower numbers (e.g. 6 million). The voice says 'up to'. (Hölldobler & Wilson, 'The Ants' (1990), as summarised in Wikipedia 'Dorylus' (accessed 15 Nov 2026); BBC Wildlife / Discover Wildlife, army ant facts)
- APPROXIMATE: a driver ant raiding column advances only about 20 metres an hour. (Hölldobler & Wilson, 'The Ants' (1990), as cited in Wikipedia 'Dorylus' (accessed 15 Nov 2026))
- Typical comfortable human walking speed about 1.4 m/s (5 km/h). (Mohler, Thompson, Creem-Regehr, Pick & Warren, 'Visual flow influences gait transition speed and preferred walking speed', Exp Brain Res 181 (2007); Browning et al., J Appl Physiol 100 (2006))
- The main European supercolony of the Argentine ant (Linepithema humile) stretches about 6,000 km, from Italy to the Atlantic coast of Spain. (Giraud, Pedersen & Keller, 'Evolution of supercolonies: the Argentine ants of southern Europe', PNAS 99(9): 6075-6079 (2002))
- ILLUSTRATIVE: the counter's in-between values (how many ants have arrived so far) are a story ramp; only 12 ('twelve ants'), 20 million and 20 quadrillion are spoken, and those come from the facts above. (Our illustration of the facts above)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
