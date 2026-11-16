import { formattest } from "../episodes/formattest";
import formattestVoices from "../episodes/formattest.voices.json";
import { ep009 } from "../episodes/ep009";
import ep009Voices from "../episodes/ep009.voices.json";
import { ep011 } from "../episodes/ep011";
import ep011Voices from "../episodes/ep011.voices.json";
import { ep012 } from "../episodes/ep012";
import ep012Voices from "../episodes/ep012.voices.json";
import type { FormatEpisodeData, FormatVoices } from "./types";

// Register episodes that use the optional formats here (twins are normal episodes).
export const FORMAT_EPISODES: Record<string, { episode: FormatEpisodeData; voices: FormatVoices }> = {
  formattest: { episode: formattest, voices: formattestVoices },
  ep009: { episode: ep009, voices: ep009Voices },
  ep011: { episode: ep011, voices: ep011Voices },
  ep012: { episode: ep012, voices: ep012Voices },
};
