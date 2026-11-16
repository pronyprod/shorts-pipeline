# Credits: WhatIfEp014 ("What if you stayed awake for 30 days?")

Render: `renders/WhatIf_Ep014.mp4` (44.6 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  1 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Just Dance" by Patrick Patrikios**, from the **YouTube Audio Library**.
  Original: `public/music/Just Dance - Patrick Patrikios.mp3`; loudness-normalised copy `public/music/whatif/just-dance.m4a`.
  Section used: 0:34-1:19 of the track (158s long), ducked about 19 dB under the voice.
  Its build at 0:52 lands on the climax (17.2s into the video).
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
- Randy Gardner, a 17-year-old San Diego student, stayed awake 264.4 hours (11 days 25 minutes) from December 1963 to January 1964. The voice says 'hour two hundred sixty four' and 'eleven days'. (Wikipedia, 'Randy Gardner sleep deprivation experiment'; Guinness World Records, 'What's the limit to how long a human can stay awake?' (Jan 2023: 264 hours, 11 days))
- After the 264 hours Gardner slept 14 hours 46 minutes (14.77 h). The voice says 'almost fifteen hours'. Another source gives 14 h 40 min; either way it is almost 15. (Wikipedia, 'Randy Gardner sleep deprivation experiment')
- During the attempt observers reported moodiness, trouble concentrating, short-term memory problems, paranoia and hallucinations. The day the hallucinations began is not stated, so the script gives no day for them. Dement said staying awake did not cause psychiatric problems; the voice does not claim otherwise. (Wikipedia, 'Randy Gardner sleep deprivation experiment' (reports of Lt. Cmdr. John J. Ross); Guinness World Records (2023))
- Microsleeps are momentary lapses into sleep lasting a few seconds, impossible to monitor without continuous physiological recording; Dement later accepted that Gardner probably had them. The voice says 'your brain naps for seconds, and you never notice'. (Guinness World Records, 'What's the limit to how long a human can stay awake?' (Jan 2023))
- Guinness stopped monitoring the stay-awake record because of the dangers of sleep deprivation and because past attempts can't be measured accurately (microsleeps). The voice says it 'won't track it' because it's 'too risky' and 'microsleeps hide the truth'. (Guinness World Records, 'What's the limit to how long a human can stay awake? And why we don't monitor the record' (Jan 2023))
- UNCERTAIN / STORY RAMP: the hour counts shown at lines 1-3 (24, 72, 168) are illustrative steps on the way to the real 264 h; only 264 h (line 4 and after) is a sourced figure. (Our own story ramp; 264 h from the Gardner sources above)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
