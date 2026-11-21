import { formattest } from "../episodes/formattest";
import formattestVoices from "../episodes/formattest.voices.json";
import { ep009 } from "../episodes/ep009";
import ep009Voices from "../episodes/ep009.voices.json";
import { ep011 } from "../episodes/ep011";
import ep011Voices from "../episodes/ep011.voices.json";
import { ep012 } from "../episodes/ep012";
import ep012Voices from "../episodes/ep012.voices.json";
import { ep013 } from "../episodes/ep013";
import ep013Voices from "../episodes/ep013.voices.json";
import { ep015 } from "../episodes/ep015";
import ep015Voices from "../episodes/ep015.voices.json";
import { ep016 } from "../episodes/ep016";
import ep016Voices from "../episodes/ep016.voices.json";
import { ep017 } from "../episodes/ep017";
import ep017Voices from "../episodes/ep017.voices.json";
import { ep018 } from "../episodes/ep018";
import ep018Voices from "../episodes/ep018.voices.json";
import type { FormatEpisodeData, FormatVoices } from "./types";

// Register episodes that use the optional formats here (twins are normal episodes).
export const FORMAT_EPISODES: Record<string, { episode: FormatEpisodeData; voices: FormatVoices }> = {
  formattest: { episode: formattest, voices: formattestVoices },
  ep009: { episode: ep009, voices: ep009Voices },
  ep011: { episode: ep011, voices: ep011Voices },
  ep012: { episode: ep012, voices: ep012Voices },
  ep013: { episode: ep013, voices: ep013Voices },
  ep015: { episode: ep015, voices: ep015Voices },
  ep016: { episode: ep016, voices: ep016Voices },
  ep017: { episode: ep017, voices: ep017Voices },
  ep018: { episode: ep018, voices: ep018Voices },
};
