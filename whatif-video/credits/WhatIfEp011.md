# Credits: WhatIfEp011 ("What if you drank 100 coffees in one hour?")

Render: `renders/WhatIf_Ep011.mp4` (54.3 s). Template 3.

## Narration
- Generated with the **Google Gemini API**, model `gemini-3.8-flash-tts`, prebuilt voice **Puck**.
  3 API request(s); tempo 1x (pitch kept), pauses inside lines capped at 0.45s.
  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.
  Checked line by line with whisper.cpp (MIT licence, run locally).

## Music
- **"Thumb Piano Man" by Freedom Trail Studio**, from the **YouTube Audio Library**.
  Original: `public/music/Thumb Piano Man - Freedom Trail Studio.mp3`; loudness-normalised copy `public/music/whatif/thumb-piano-man.m4a`.
  Section used: 1:15-2:09 of the track (135s long), ducked about 19 dB under the voice.
  Its build at 1:39 lands on the climax (24.0s into the video).
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
- Caffeine in one 8 oz (237 mL) cup of brewed coffee. APPROXIMATE: FDA gives 80-100 mg per 8 oz cup; real cups vary a lot. (Mayo Clinic, 'Caffeine content for coffee, tea, soda and more' (brewed coffee, 8 oz: 96 mg); FDA, 'Spilling the Beans' (80-100 mg))
- One US cup = 8 US fluid ounces = 236.6 mL. (NIST, US customary units (1 cup = 8 fl oz = 236.59 mL))
- Amount the FDA says is not generally linked to dangerous effects in healthy adults per day. The voice calls it 'a whole day's safe amount'. (FDA Consumer Update, 'Spilling the Beans: How Much Caffeine is Too Much?')
- FDA: toxic effects, like seizures, can be observed with rapid consumption of around 1,200 mg. The voice says 'it can turn toxic' (non-graphic). (FDA Consumer Update, 'Spilling the Beans: How Much Caffeine is Too Much?' (also FDA Spanish version 'Al grano'))
- Too much caffeine can cause insomnia, jitters, anxiousness, a fast heart rate and upset stomach. (FDA Consumer Update, 'Spilling the Beans'; Mayo Clinic, 'Caffeine: How much is too much?')
- Caffeine keeps you alert by blocking adenosine receptors; adenosine is the sleep-pressure chemical that builds up while you're awake. The voice simplifies to 'your brain's tired signal'. (Sleep Foundation, 'Caffeine and Sleep')
- Healthy kidneys can remove only about 0.8-1.0 L of water an hour. APPROXIMATE (National Academies 2005 range is about 0.7-1.0 L/h); the voice says 'about one'. (Healthline, 'How Much Water Can Kill You?' (0.8-1.0 L/h); Wikipedia, Water intoxication)
- Caffeine and related methylxanthines stop insects feeding and kill them at concentrations found in plants: likely a natural pesticide (tobacco hornworms, milkweed bugs, mosquito larvae). The voice says plants make it 'to poison the insects that eat them' and calls coffee 'bug spray'. (J. A. Nathanson, 'Caffeine and related methylxanthines: possible naturally occurring pesticides', Science 226:184-187 (12 Oct 1984), PMID 6207592)

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
