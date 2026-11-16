# Credits and licences

Per-episode credits (exact music track and section, narration, fact sources) are in `credits/<Composition>.md`,
written by `node scripts/credits.mjs <episodeId> <CompositionId>`. This file lists everything the project uses.

## Music
- **YouTube Audio Library** (Ep001V3 onwards), rotated one per episode: "New Morning" (TrackTribe), "Spring Field" (Godmode),
  "The World's Fair" (Godmode), "Thumb Piano Man" (Freedom Trail Studio), "Stasis" (TrackTribe), "Wunderkind"
  (Freedom Trail Studio), "Just Dance" (Patrick Patrikios). Originals in `public/music/`, loudness-normalised copies in
  `public/music/whatif/`. Licence: YouTube Audio Library terms; check each track's licence note in YouTube Studio.
- **"What If Curious Loop"** (`public/music/whatif-curious-loop.wav`), used by Ep001 and Ep001V2
  - Original track generated from code by `scripts/generate-music.mjs` (`npm run music`). No samples or third-party audio.
  - Released by the channel under **CC0 1.0** (public domain dedication). Free for any use, including YouTube monetisation.

## Voice
- Ep001V3 onwards: **Google Gemini API** TTS (`gemini-3.8-flash-tts`, fallback `gemini-3.1-flash-tts-preview`), prebuilt
  voice **Puck**. AI-generated; subject to the Gemini API Terms of Service. Pipeline: `scripts/tts-episode.mjs` + `scripts/tts-fit.mjs`.
  Lines checked with **whisper.cpp** (MIT licence), run locally.
- Ep001 and Ep001V2: generated locally with **kokoro-js** (Apache License 2.0) using the **Kokoro-82M** model (Apache License 2.0).
  - Narrator: `af_heart`, speed 0.92. Script: `scripts/generate-voices.mjs`.

## Font
- **Montserrat** by Julieta Ulanovsky and contributors, SIL Open Font License 1.1. Loaded with `@remotion/google-fonts`.

## Illustrations
- All drawings (drop, marble, ball, car, house, field, tower, mountain, island, Earth, city, dust) are original flat SVG shapes in `src/whatif/components/Icon.tsx`.

## Style kit (from Ep010)
- 3D scenes, the character Pom and all props are original, built in code with **three.js** (MIT License) through
  **@remotion/three** and **@react-three/fiber** (MIT License). `src/kit/`.
- Pixel look fonts: **Silkscreen** (Jason Kottke) and **Pixelify Sans** (Stefie Justprince), SIL Open Font License 1.1,
  via `@remotion/google-fonts`.

## Sound effects (from 12 Nov 2026)
- All sound effects are generated in code by `scripts/make-sfx.mjs` (whoosh, impact, tick, pop, ding, splash, crowd,
  sizzle, heartbeat, clock, shake, and the loops wind, rumble, waves, hum) and saved in `public/sfx/`. No third-party audio, so nothing to attribute. If a YouTube
  Audio Library effect is ever added, list it here with its name and "YouTube Audio Library, attribution not required".

## Software
- **Remotion**. Free for individuals and teams of up to 3 people; larger companies need a company licence. https://www.remotion.dev/license

## Fact sources (Episode 1)
See the `FACTS` block in `src/whatif/episodes/ep001.ts`: AMS Glossary of Meteorology, IFAB Laws of the Game, CTBUH,
China-Nepal 2020 Everest survey, Encyclopaedia Britannica (Java), NOAA Ocean Service, NASA Earth Fact Sheet.
