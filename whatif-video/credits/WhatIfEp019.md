# Credits: WhatIfEp019 ("What if you rode a satellite back to Earth?")

Render: `renders/WhatIf_Ep019.mp4` (54.3 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  1 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Stasis" by TrackTribe**, from the **YouTube Audio Library**.
  Original: `public/music/Stasis - TrackTribe.mp3`; loudness-normalised copy `public/music/whatif/stasis.m4a`.
  Sections used: 0:16-0:34 of the track for the opening, then 0:00-0:35 from 18.5s into the video (cross-faded); 168s long, ducked about 19 dB under the voice.
  Its rise at 0:06 (from the track's quiet start) lands on the climax (25.0s into the video).
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
- Earth's gravitational parameter GM, m^3/s^2. (NASA Earth Fact Sheet (GM 0.39860 x 10^6 km^3/s^2))
- Earth's volumetric mean radius. (NASA Earth Fact Sheet)
- Entry interface, where re-entry is counted from: 400,000 ft = 122 km. The voice says 'about a hundred and twenty'. APPROXIMATE: the air thickens gradually, there is no sharp edge. (NASA, Space Shuttle entry (entry interface 400,000 ft); Wikipedia, Atmospheric entry)
- Height of Mount Everest (2020 survey). (Nepal/China joint survey, Dec 2020 (Wikipedia, Mount Everest))
- Re-entry heat comes mainly from air compressed in the shock in front of the craft; skin friction adds a smaller share. The voice says 'way more than friction'. (NASA History, H. Julian Allen and the blunt-body concept; Mars Society of Canada, 'Re-entry: it's not friction')
- Melting point of aluminium, the usual spacecraft structure metal. The heat counter ramp before it is ILLUSTRATIVE (the real temperature curve depends on the path); only 660 is a stated fact. (Wikipedia, Aluminium (CRC Handbook value))
- Typical main break-up altitude of satellites re-entering from low orbit. APPROXIMATE, a typical value (roughly 70-80 km); the voice says 'around'. Swift's own break-up altitude was not published. (ESA, Cluster 'Salsa' re-entry 2024 (main break-up predicted at 78 km); ESA SDC9 airborne observation paper ('main break-up ... at 78 km'))
- Swift re-entered on 4 November 2026 at 12:39 UTC (7:39 a.m. EST). TIMELY source, published 2 Nov 2026, updated 4 Nov 2026. (NASA Science, Swift blog: 'NASA's Swift Observatory Re-Entered Atmosphere' (2 Nov 2026, updated 4 Nov 2026); Sky & Telescope (2 Nov 2026, update))
- Over the North Sumatra region of Indonesia, about 3.4 N, 98.6 E. Sky & Telescope says 'centered over southeast Asia'; one outlet said the Pacific (outweighed by NASA and Space Force). (NASA Science, Swift blog (updated 4 Nov 2026))
- Launched 20 November 2004 (Delta II, Cape Canaveral). (Sky & Telescope (2 Nov 2026); Wikipedia, Neil Gehrels Swift Observatory)
- 20 Nov 2004 to 4 Nov 2026 = 8,019 days = 21.96 years. Computed and checked below; the voice says 'almost twenty two'. (Computed from the launch and re-entry dates above)
- 'Over 1,750 bursts' (gamma-ray bursts, the biggest explosions in the universe), quoted from Lynn Cominsky. The voice says 'over'. (Sky & Telescope, 'Swift Observatory Ends Mission, Reenters Earth's Atmosphere' (2 Nov 2026))
- Every crewed craft that comes home from orbit uses a heat shield or thermal protection system (capsules, Space Shuttle tiles). (Wikipedia, Atmospheric entry (Thermal protection system); NASA, Orion heat shield)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
