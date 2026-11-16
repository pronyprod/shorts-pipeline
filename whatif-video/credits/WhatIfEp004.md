# Credits: WhatIfEp004 ("What if you jumped into a tunnel straight through the Earth?")

Render: `renders/WhatIf_Ep004.mp4` (69.8 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  3 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Thumb Piano Man" by Freedom Trail Studio**, from the **YouTube Audio Library**.
  Original: `public/music/Thumb Piano Man - Freedom Trail Studio.mp3`; loudness-normalised copy `public/music/whatif/thumb-piano-man.m4a`.
  Section used: 0:51-2:01 of the track (135s long), ducked about 19 dB under the voice.
  Its build at 1:20 lands on the climax (29.2s into the video).
  Licence: YouTube Audio Library. Before publishing, check this track's licence note in YouTube Studio > Audio Library
  (some tracks require an attribution line in the description). Off YouTube, if a platform mutes it, swap to that platform's library.

## Visuals
- All drawings are original flat SVG shapes made for this channel (`src/whatif/components/`).
- Font: **Montserrat** (Julieta Ulanovsky and contributors), SIL Open Font License 1.1, via `@remotion/google-fonts`.

## Facts and sources
- PREM radius of the Earth. (Dziewonski & Anderson 1981 (PREM))
- Newton's gravitational constant. (CODATA 2018)
- Checks the density model (not used in the fall). (NASA Earth Fact Sheet)
- Published fall time through the centre on PREM, 38 min 11 s. Our simulation must reproduce it. (A. Klotz, Am. J. Phys. 83, 231 (2015))
- Chord tunnels run from 42 min (short trips) to 38 min (through the centre). (Klotz 2015; 42 min from P. Cooper, Am. J. Phys. 34, 68 (1966))
- Kola Superdeep Borehole, the deepest hole ever dug. (Wikipedia 'Kola Superdeep Borehole'; Scientific American)
- Base of the crust in PREM (a global average: real crust is about 5-70 km thick). (PREM (AVERAGE))
- Space Station speed, about 28,000 km/h. (Canadian Space Agency / NASA figures (APPROXIMATE))
- Space Station altitude, about 400-420 km; we compare with the higher figure. (Canadian Space Agency; TASS May 2025 (APPROXIMATE))
- Core-mantle boundary radius. (PREM)
- Inner core radius. (PREM)
- Jakarta (6.2 S, 106.8 E): its antipode is 6.2 N, 73.2 W, in Colombia. (Computed from Jakarta's coordinates (lat -> -lat, lon -> lon - 180))
- Ignores air, heat, Earth's spin and that no tunnel could survive: a straight vacuum shaft through a non-rotating Earth. (SIMPLIFICATION (said in the script))

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
