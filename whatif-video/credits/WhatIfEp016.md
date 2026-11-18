# Credits: WhatIfEp016 ("What if lightning hit you 7 times?")

Render: `renders/WhatIf_Ep016.mp4` (47.2 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  2 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Spring Field" by Godmode**, from the **YouTube Audio Library**.
  Original: `public/music/Spring Field - Godmode.mp3`; loudness-normalised copy `public/music/whatif/spring-field.m4a`.
  Section used: 0:01-0:48 of the track (102s long), ducked about 19 dB under the voice.
  Its build at 0:25 lands on the climax (24.3s into the video).
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
- A typical lightning flash is about 300 million volts and about 30,000 amps (the real range is wider: 100 million to 1 billion volts). (US National Weather Service, 'Lightning Power' (weather.gov/safety/lightning-power): 'A typical lightning flash is about 300 million Volts and about 30,000 Amps.')
- Park ranger Roy C. Sullivan, Shenandoah National Park, Virginia, was struck by lightning seven times and survived every one: the Guinness record for most lightning strikes survived. (Guinness World Records, 'Incredible story of man who survived being struck by lightning SEVEN times' (Jan 2023); Wikipedia, 'Roy Sullivan')
- First strike: April 1942, right leg, while fleeing a watchtower set ablaze by lightning. (Guinness World Records (Jan 2023))
- Seventh strike: June 1977, on a fishing trip (chest and stomach burned). (Guinness World Records (Jan 2023))
- Strike 2: July 1969, driving his truck; knocked out, eyebrows burned, wristwatch destroyed. (Guinness World Records (Jan 2023))
- Strike 3: July 1970, in his garden, left shoulder seared. (Guinness World Records (Jan 2023))
- Strike 4: April 1972, in a guardhouse at work; his hair caught fire. (Guinness World Records (Jan 2023))
- Strike 5: August 1973, in his vehicle; his hair caught fire again. (Guinness World Records (Jan 2023))
- Strike 6: June 1976, during a walk; ankle injured, hair burned again. (Guinness World Records (Jan 2023))
- Never struck again; he died in 1983 at age 71. (Guinness World Records (Jan 2023))
- UNCERTAIN in detail: Wikipedia notes the park superintendent who documented the strikes was not present at them, and Sullivan said an earlier strike may have been first. The script only says what Guinness records: seven strikes survived, 1942 to 1977. (Wikipedia, 'Roy Sullivan'; Guinness World Records (Jan 2023))

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
