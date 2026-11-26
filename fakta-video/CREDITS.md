# Credits and licences

## Maps
- **NASA Blue Marble: Next Generation** (Dec 2004, topography + bathymetry, 5400x2700), `public/maps/bluemarble.jpg`
  - Source: NASA Earth Observatory / Visible Earth, image record 73909:
    https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg
  - Credit: Reto Stöckli, NASA Earth Observatory. NASA imagery is public domain (no copyright in the US); credit appreciated.
  - Changed by us: re-projected per frame (Lambert azimuthal equal-area) and colour-graded.
- **Natural Earth**, 1:50m Admin 0 – Countries, version 5.2.0-pre (GitHub `nvkelso/natural-earth-vector`), `data/raw/`
  - https://www.naturalearthdata.com/ — public domain. "Made with Natural Earth."
  - Turned into `src/data/*.json` by `scripts/build-map-data.mjs`.

## Music
Tracks from the **YouTube Audio Library**, downloaded on 30 Oct 2026 (320 kbps) into `public/music/`.
- The originals are never changed.
- The videos use loudness-normalised copies (−16 LUFS) in `public/music/norm/`, made by `scripts/prepare-music.mjs`.
- Track list and rotation: `src/music.ts`.
- Licence: the YouTube Audio Library licence. These tracks were picked as "attribution not required". **Before publishing, confirm each track's licence note in YouTube Studio → Audio Library.**
- Off YouTube (TikTok/IG/FB) the Audio Library gives no guarantee. If a post gets muted there, swap in that platform's own library music.
- We add the credit line to every description anyway, as a habit.

### Music per episode
| episode | track | artist | description line |
|---|---|---|---|
| Ep001 V3 (`renders/Fakta_Ep001V3.mp4`, Gemini voice Puck) | Brain Trust | Wayne Jones | Music: "Brain Trust" by Wayne Jones (YouTube Audio Library) |
| Ep002 (`renders/Fakta_Ep002.mp4`, coastline) | Cooper Ave | The Westerlies | Music: "Cooper Ave" by The Westerlies (YouTube Audio Library) |
| Ep003 (`renders/Fakta_Ep003.mp4`, Krakatau) | Dog Park | Silent Partner | Music: "Dog Park" by Silent Partner (YouTube Audio Library) |
| Ep004 (`renders/Fakta_Ep004.mp4`, Run and Manhattan) | Dog and Pony Show | Silent Partner | Music: "Dog and Pony Show" by Silent Partner (YouTube Audio Library) |
| Ep005 (`renders/Fakta_Ep005.mp4`, Kenapa bahasa Jawa) | Good Starts | Jingle Punks | Music: "Good Starts" by Jingle Punks (YouTube Audio Library) |
| Ep006 (`renders/Fakta_Ep006.mp4`, Wallace Line) | Mr. Sunny Face | Wayne Jones | Music: "Mr. Sunny Face" by Wayne Jones (YouTube Audio Library) |
| Ep007 (`renders/Fakta_Ep007.mp4`, Borobudur) | Sneaky Business | Biz Baz Studio | Music: "Sneaky Business" by Biz Baz Studio (YouTube Audio Library) |
| Ep008 (`renders/Fakta_Ep008.mp4`, hari tanpa bayangan) | The Curious Kitten | Aaron Kenny | Music: "The Curious Kitten" by Aaron Kenny (YouTube Audio Library) |
| Ep009 (`renders/Fakta_Ep009.mp4`, Komodo 5 pulau) | Brain Trust | Wayne Jones | Music: "Brain Trust" by Wayne Jones (YouTube Audio Library) |
| Ep010 (`renders/Fakta_Ep010.mp4`, hujan meteor Leonid) | Cooper Ave | The Westerlies | Music: "Cooper Ave" by The Westerlies (YouTube Audio Library) |
| Ep011 (`renders/Fakta_Ep011.mp4`, Kalimantan tiga negara) | Dog Park | Silent Partner | Music: "Dog Park" by Silent Partner (YouTube Audio Library) |
| Ep012 (`renders/Fakta_Ep012.mp4`, cenderawasih tanpa kaki) | Dog and Pony Show | Silent Partner | Music: "Dog and Pony Show" by Silent Partner (YouTube Audio Library) |
| Ep013 (`renders/Fakta_Ep013.mp4`, Selat Malaka) | Good Starts | Jingle Punks | Music: "Good Starts" by Jingle Punks (YouTube Audio Library) |
| Ep014 (`renders/Fakta_Ep014.mp4`, 718 bahasa daerah) | Mr. Sunny Face | Wayne Jones | Music: "Mr. Sunny Face" by Wayne Jones (YouTube Audio Library) |
| Ep015 (`renders/Fakta_Ep015.mp4`, supermoon 24 Nov 2026) | Sneaky Business | Biz Baz Studio | Music: "Sneaky Business" by Biz Baz Studio (YouTube Audio Library) |
| Ep016 (`renders/Fakta_Ep016.mp4`, kopi java) | The Curious Kitten | Aaron Kenny | Music: "The Curious Kitten" by Aaron Kenny (YouTube Audio Library) |
| Ep017 (`renders/Fakta_Ep017.mp4`, rafflesia) | Brain Trust | Wayne Jones | Music: "Brain Trust" by Wayne Jones (YouTube Audio Library) |
| Ep018 (`renders/Fakta_Ep018.mp4`, bendera Monako) | Cooper Ave | The Westerlies | Music: "Cooper Ave" by The Westerlies (YouTube Audio Library) |
| Ep019 (`renders/Fakta_Ep019.mp4`, jumlah pulau Indonesia) | Dog Park | Silent Partner | Music: "Dog Park" by Silent Partner (YouTube Audio Library) |
| Ep020 (`renders/Fakta_Ep020.mp4`, hujan meteor Geminid) | Dog and Pony Show | Silent Partner | Music: "Dog and Pony Show" by Silent Partner (YouTube Audio Library) |
| Ep001 V1 / V2 (published files) | "Peta Pulse" (generated, retired) | channel | none needed |

All tracks:

| track | artist | length | note |
|---|---|---|---|
| Brain Trust | Wayne Jones | 1:46 | |
| Cooper Ave | The Westerlies | 1:36 | |
| Dog Park | Silent Partner | 1:33 | |
| Dog and Pony Show | Silent Partner | 1:33 | |
| Good Starts | Jingle Punks | 1:10 | only for episodes under 58 s (the music ends ~60 s) |
| Mr. Sunny Face | Wayne Jones | 1:44 | |
| Sad Eyed Waltz | Telecasted | 2:09 | **skipped until the owner approves it** |
| Sneaky Business | Biz Baz Studio | 1:38 | |
| The Curious Kitten | Aaron Kenny | 1:39 | very quiet original (−30.6 LUFS), normalised |

`public/music/peta-pulse.wav` (our earlier generated loop) is retired. It is only used by the published V1 and V2.

## Sound effects
- From 12 Nov 2026 (new episodes): `public/sfx/kit/*.wav` (whoosh, impact, tick, pop, ding, splash, crowd, sizzle,
  heartbeat, clock, shake, wind, rumble, waves, hum; added 14 Nov 2026: hit, thud, rustle, crack, gasp, gulp, boing) are generated in code by `scripts/make-sfx.mjs` for this channel
  (the same generator as the What If channel). No third-party audio; nothing to attribute.

- All SFX in `public/sfx/` (whoosh, pop, stamp, tick, rise) are original. They are generated from code by `scripts/make-audio-assets.mjs`, with no samples or third-party audio, and are owned by the channel.

## Voice
- **From Ep001 V3 on: Google Gemini TTS**: `gemini-3.1-flash-tts-preview` (`gemini-3.8-flash-tts` is kept for the other channel). The voice is chosen by the owner from the tests in `tests/`.
  - Commercial use is allowed; Google doesn't claim ownership; users must be 18+.
  - All Gemini audio carries an inaudible **SynthID** watermark. Never remove it.
  - Add **"Voiceover: AI"** to every description.
- V1/V2 (published files): Microsoft Edge neural TTS `id-ID-ArdiNeural` via **edge-tts** 7.3.1. This was an unofficial use of a Microsoft service and is retired.

## Captions
- **whisper.cpp** 1.5.5 (MIT) with the OpenAI Whisper "small" multilingual model (MIT), installed by `@remotion/install-whisper-cpp`.

## Flags
- **flag-icons** by Panayiotis Lipiridis and contributors, MIT Licence. https://github.com/lipis/flag-icons

## Font
- **Plus Jakarta Sans** by Tokotype, SIL Open Font License 1.1. Loaded with `@remotion/google-fonts`.

## Software
- **Remotion**: free for individuals and teams of up to 3 people. https://www.remotion.dev/license
- **d3-geo** (ISC Licence) for projections and great-circle maths.

## Facts
- Per episode, in `episodes/EpNNN.md` and the `SOURCES` array of `src/episodes/epNNN-script.ts`.
