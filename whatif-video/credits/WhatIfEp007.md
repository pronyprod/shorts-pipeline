# Credits: WhatIfEp007 ("What if the Moon vanished for exactly one day?")

Render: `renders/WhatIf_Ep007.mp4` (74.6 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  1 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Just Dance" by Patrick Patrikios**, from the **YouTube Audio Library**.
  Original: `public/music/Just Dance - Patrick Patrikios.mp3`; loudness-normalised copy `public/music/whatif/just-dance.m4a`.
  Section used: 0:25-1:40 of the track (158s long), ducked about 19 dB under the voice.
  Its build at 0:52 lands on the climax (26.5s into the video).
  Licence: YouTube Audio Library. Before publishing, check this track's licence note in YouTube Studio > Audio Library
  (some tracks require an attribution line in the description). Off YouTube, if a platform mutes it, swap to that platform's library.

## Visuals
- All drawings are original flat SVG shapes made for this channel (`src/whatif/components/`).
- Font: **Montserrat** (Julieta Ulanovsky and contributors), SIL Open Font License 1.1, via `@remotion/google-fonts`.

## Facts and sources
- Mean Earth-Moon distance (semimajor axis). (NASA Moon Fact Sheet (NSSDCA))
- Mean closest distance of the Moon. (NASA Moon Fact Sheet (NSSDCA))
- Mean farthest distance of the Moon. (NASA Moon Fact Sheet (NSSDCA))
- Mass of the Moon. (NASA Moon Fact Sheet (NSSDCA))
- Sidereal month: one lap of the Moon. (NASA Moon Fact Sheet (NSSDCA))
- Mass of the Earth. (NASA Earth Fact Sheet)
- Earth's mean radius. (NASA Earth Fact Sheet)
- Earth's mean speed around the Sun. (NASA Earth Fact Sheet)
- Mass of the Sun. (NASA Sun Fact Sheet)
- Mean Earth-Sun distance (1 AU, rounded). (NASA Earth Fact Sheet)
- Check on our sum: NOAA gives 27 million / 59 million, 'about half'. This is tide-raising FORCE. APPROXIMATE for real coasts: actual tides also depend on the shape of each ocean basin. (NOAA Ocean Service, Tides tutorial: Tidal variations / changing angles)
- Speed of light. Gravity travels at the same speed: GW170817 tested this to a few parts in 10^15. (SI definition; LIGO/Virgo/Fermi/INTEGRAL 2017, ApJL 848 L13)
- Full Moon on a clear night. APPROXIMATE: tables give 0.05-0.3 lux. (Wikipedia, Daylight and Orders of magnitude (illuminance))
- Clear moonless night, starlight plus airglow. APPROXIMATE, and only true far from city lights. (Wikipedia, Daylight and Orders of magnitude (illuminance))
- Marathon distance. (World Athletics)
- Days for ocean tides to die down. UNCERTAIN, our own estimate from Q of about 23 for semidiurnal tides (Q / omega is about 2 days). Only used for 'one day is too short to calm it'. (Kantha et al. 1998 (Q values); estimate is ours)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
