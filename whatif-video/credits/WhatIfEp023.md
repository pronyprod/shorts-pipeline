# Credits: WhatIfEp023 ("What if you ate 100 Carolina Reapers?")

Render: `renders/WhatIf_Ep023.mp4` (50.0 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  1 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Spring Field" by Godmode**, from the **YouTube Audio Library**.
  Original: `public/music/Spring Field - Godmode.mp3`; loudness-normalised copy `public/music/whatif/spring-field.m4a`.
  Section used: 0:06-0:56 of the track (102s long), ducked about 19 dB under the voice.
  Its build at 0:25 lands on the climax (18.6s into the video).
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
- Carolina Reaper average 1,641,183 Scoville heat units (Winthrop University test, Guinness record 2013). The voice says 'about one point six million'. It lost the Guinness record to Pepper X (2.69M SHU) in Oct 2023; the voice does not claim it is the hottest. (Guinness World Records / CNN 17 Oct 2023 ('Reaper average 1.64 million SHU'); Winthrop University testing)
- Jalapeno is roughly 2,500-8,000 SHU (sources differ slightly: 2,000-8,000 or 3,000-8,000). Using the top of the range, 1,641,183 / 8,000 = 205, so 'over two hundred times hotter' is true for every range. (CNN 17 Oct 2023 citing Guinness (3,000-8,000 SHU); common spice references (2,500-8,000))
- The premise: 100 peppers. Counter only; no total heat is added up (SHU is a concentration, not a sum). (Premise (bank #30))
- Large doses of capsaicin cause sweating, tears and stomach upset (qualitative only; no number on screen). (Wikipedia, Capsaicin (Adverse effects); capsaicin safety reviews)
- The nerve sensor TRPV1 is switched on by capsaicin and by painful heat above about 43 degrees Celsius. APPROXIMATE (some sources say 43-45). (UCSF news 2021 (>110 F, about 43 C); Frontiers for Young Minds 2024 (above 43 C); Nobel Prize press release 2021)
- Capsaicin fools the heat sensor; the temperature of the mouth does not rise. The voice says nothing is 'actually burning' meaning no real heat, a false alarm. (Nobel Prize press release 2021 (capsaicin used to identify the heat sensor); UCSF news 2021)
- David Julius (with Ardem Patapoutian) won the 2021 Nobel Prize in Physiology or Medicine for receptors for temperature and touch; Julius found the capsaicin/heat sensor, later named TRPV1. (nobelprize.org, Press release 2021 (Physiology or Medicine))

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
