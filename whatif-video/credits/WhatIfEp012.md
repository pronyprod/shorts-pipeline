# Credits: WhatIfEp012 ("What if a whale swallowed you?")

Render: `renders/WhatIf_Ep012.mp4` (52.4 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  1 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Stasis" by TrackTribe**, from the **YouTube Audio Library**.
  Original: `public/music/Stasis - TrackTribe.mp3`; loudness-normalised copy `public/music/whatif/stasis.m4a`.
  Sections used: 0:16-0:37 of the track for the opening, then 0:00-0:31 from 20.6s into the video (cross-faded); 168s long, ducked about 19 dB under the voice.
  Its rise at 0:06 (from the track's quiet start) lands on the climax (27.1s into the video).
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
- Friday 11 June 2021, off Provincetown (Cape Cod), Massachusetts: a humpback whale engulfed commercial lobster diver Michael Packard and spat him out. (CBS News, 'Cape Cod diver survives being trapped in humpback whale's mouth' (June 2021); Cape Cod Times, 11 June 2021; National Geographic, 'Humpback whales can't swallow a human. Here's why.' (M. Hobson, 15 June 2021))
- Packard was about 45 feet (14 m) down when the whale engulfed him. The voice puts 'you' at the same depth. (Live Science, 'Humpback whale swallows lobster diver before spitting him out' (June 2021); NBC Boston (June 2021))
- Packard's own estimate of the time inside the closed mouth: 30 to 40 seconds (NatGeo says 'about 30 seconds'). APPROXIMATE: his estimate. (CBS News / Cape Cod Times (June 2021): 'about 30 to 40 seconds'; National Geographic (15 June 2021))
- Upper end of Packard's 30-40 s estimate. (CBS News / Cape Cod Times (June 2021))
- The whale rose to the surface, shook its head and spat him out; his crewman Josiah Mayo pulled him from the water. (CBS News; KUOW/NPR, 'A lobster diver in Cape Cod says a humpback whale scooped him up and spat him out' (June 2021))
- Treated at Cape Cod Hospital and released the same afternoon: bruises / soft tissue damage, no broken bones. (National Geographic (15 June 2021): 'soft tissue damage but no broken bones'; NBC Boston (June 2021))
- A humpback's throat is roughly the size of a human fist; scientifically impossible for it to swallow a human (Nicola Hodgins, Whale and Dolphin Conservation). (National Geographic, 'Humpback whales can't swallow a human. Here's why.' (15 June 2021))
- The throat can only stretch to about 15 inches (38 cm) across. The voice says 'about fifteen inches'. (National Geographic (15 June 2021), citing Whale and Dolphin Conservation)
- Baleen whales like humpbacks eat tiny prey: plankton, krill and small fish, sieved from a huge gulp of seawater. (National Geographic (15 June 2021); NOAA Fisheries, Humpback Whale species page)
- Humpbacks grow up to about 60 feet long and about 40 tons (used only for the drawing's proportions, not spoken). (NOAA Fisheries, Humpback Whale species page (Quick Facts))
- APPROXIMATE / illustrative: the second-by-second steps (dark at second 1, rising by second 15, out by second 30) are our own telling of Packard's 30-40 s account; only the total and the order of events are from the sources. (Our illustration of the CBS News / Cape Cod Times account)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
