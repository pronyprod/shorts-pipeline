# Credits: WhatIfEp015 ("What if you stood on Mars as a volcano woke?")

Render: `renders/WhatIf_Ep015.mp4` (47.5 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  3 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"New Morning" by TrackTribe**, from the **YouTube Audio Library**.
  Original: `public/music/New Morning - TrackTribe.mp3`; loudness-normalised copy `public/music/whatif/new-morning.m4a`.
  Section used: 0:05-0:53 of the track (212s long), ducked about 19 dB under the voice.
  Its build at 0:27 lands on the climax (21.1s into the video).
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
- TIMELY: the study 'Enigmatic HCl detections as a potential signature of igneous activity on Mars' (Trokhimovskiy, Mege et al.) appeared in Science Advances vol. 12, no. 45 in early November 2026 (ESA release re-published by ScienceDaily 7 Nov 2026; Sky at Night Magazine and others reported it 4-6 Nov 2026). Within 30 days of the 17 Nov 2026 run. (ScienceDaily / ESA, 'Mars may still be volcanically active' (sciencedaily.com/releases/2026/11/261106174525.htm, 7 Nov 2026); Science Advances doi:10.1126/sciadv.aeb9422)
- The ExoMars Trace Gas Orbiter's infrared spectrometers saw bursts of hydrogen chloride (HCl) gas in early northern summer, above fresh-looking fissures on the flanks of Alba Mons; the team reads it as a possible sign of magma below. An interpretation, not proof. No eruption or lava flow has ever been directly observed on Mars. (ScienceDaily / ESA, 7 Nov 2026; Sky at Night Magazine (Nov 2026); Science Advances 12(45))
- The fresh fissures are 'hundreds of metres' long (CaSSIS camera); no exact measurement is given, so the voice only says 'hundreds of meters'. (ScienceDaily / ESA, 7 Nov 2026)
- Alba Mons is about 2,000 km north-south, measured to the outer edge of its flows. It is the biggest volcano on Mars by surface area. (Carr (2006), 'The Surface of Mars', p. 54; Cattermole (2001) and ESA 'Mars upside down', as summarised in Wikipedia 'Alba Mons' (accessed 17 Nov 2026))
- Average slope of the northern flank about 0.5 degrees (over five times lower than other large Tharsis volcanoes). (Carr (2006), p. 54; Boyce (2008), as summarised in Wikipedia 'Alba Mons' (accessed 17 Nov 2026))
- Mars's atmosphere is 95.1% carbon dioxide by volume; surface pressure about 6.36 mb (Earth about 1,013 mb). (NASA NSSDC Mars Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html))
- Mars winter temperatures can drop to about -120 degrees C; the authors suggest winter ice seals the fractures until it sublimates in early summer (a hypothesis). (ScienceDaily / ESA, 7 Nov 2026)
- ILLUSTRATIVE: the counter's in-between values are a story ramp; only 2,000 km, 0.5 degrees, 95 percent and minus 120 are spoken, and those come from the facts above. (Our illustration of the facts above)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
