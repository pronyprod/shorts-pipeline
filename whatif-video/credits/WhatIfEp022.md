# Credits: WhatIfEp022 ("She fell 3 km and walked home")

Render: `renders/WhatIf_Ep022.mp4` (52.8 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  2 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"New Morning" by TrackTribe**, from the **YouTube Audio Library**.
  Original: `public/music/New Morning - TrackTribe.mp3`; loudness-normalised copy `public/music/whatif/new-morning.m4a`.
  Section used: 0:05-0:58 of the track (212s long), ducked about 19 dB under the voice.
  Its build at 0:27 lands on the climax (21.4s into the video).
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
- Juliane Koepcke was born 10 Oct 1954, so she was 17 on 24 Dec 1971. (Wikipedia, Juliane Koepcke (born 10 October 1954; crash 24 December 1971))
- She fell about 3 km (3,000 m / 10,000 ft). The voice says 'about three kilometres'. APPROXIMATE. (Wikipedia, Juliane Koepcke ('3,000 m (10,000 ft)'); Wikipedia, LANSA Flight 508 ('about 3 km'))
- Crash of LANSA Flight 508 over the Peruvian rainforest, 24 December 1971. (Wikipedia, Juliane Koepcke; Wikipedia, LANSA Flight 508)
- She fell still strapped into her row of seats and was the only survivor of the 92 people aboard (voice only says she woke up alone). (Wikipedia, LANSA Flight 508; Koepcke, 'When I Fell From the Sky' (2011))
- Broken collarbone, torn knee ligament, deep cut on her arm, concussion. The voice says 'a broken collarbone and a hurt knee'. (Wikipedia, Juliane Koepcke; Wikipedia, LANSA Flight 508)
- Her father taught her: if lost in the jungle, find water and follow it downstream, because it leads to bigger water and people. Wording varies between retellings; the core rule is consistent. (Koepcke, 'When I Fell From the Sky' (2011), as reported by Irish Times, Explorersweb and Amusing Planet retellings of her memoir)
- She spent 11 days in the rainforest, following a stream to a river. (Wikipedia, Juliane Koepcke ('11 days'); Wikipedia, LANSA Flight 508)
- She found a hut of local woodcutters/hunters; they took her by canoe to a more populated place, from where she was flown to hospital. (Wikipedia, Juliane Koepcke; Wikipedia, LANSA Flight 508 ('By following a stream... hut of local hunters and woodcutters'))
- Her parents founded the Panguana research station in the Peruvian Amazon; she became its director in 2000 and is a bat biologist (mammalogist). APPROXIMATE: 'the same rainforest' = the Peruvian Amazon forest. (Wikipedia, Juliane Koepcke; Panguana Foundation (panguana.de))
- Everyday comparison: streams join into rivers like small drains feeding a bigger street drain. Explanatory image, not a measurement. (Explanatory comparison; river-network principle (Wikipedia, Stream order / Drainage basin))

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
