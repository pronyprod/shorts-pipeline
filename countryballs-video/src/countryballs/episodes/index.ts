import type { Episode, VoiceManifest } from "../types";
import { ep001 } from "./ep001";
import ep001Voices from "./ep001.voices.json";
import { ep001v2 } from "./ep001v2";
import ep001v2Voices from "./ep001v2.voices.json";
import { ep002 } from "./ep002";
import ep002Voices from "./ep002.voices.json";
import { ep002v2 } from "./ep002v2";
import ep002v2Voices from "./ep002v2.voices.json";
import { ep003 } from "./ep003";
import ep003Voices from "./ep003.voices.json";
import { ep004 } from "./ep004";
import ep004Voices from "./ep004.voices.json";
import { ep005 } from "./ep005";
import ep005Voices from "./ep005.voices.json";
import { ep006 } from "./ep006";
import ep006Voices from "./ep006.voices.json";
import { ep007 } from "./ep007";
import ep007Voices from "./ep007.voices.json";
import { ep008 } from "./ep008";
import ep008Voices from "./ep008.voices.json";
import { ep010 } from "./ep010";
import ep010Voices from "./ep010.voices.json";
import { templatetest } from "./templatetest";
import templatetestVoices from "./templatetest.voices.json";

// Register each episode here after running `npm run voices -- epXXX`
export const EPISODES: Record<string, { episode: Episode; voices: VoiceManifest }> = {
  ep001: { episode: ep001, voices: ep001Voices },
  ep001v2: { episode: ep001v2, voices: ep001v2Voices },
  ep002: { episode: ep002, voices: ep002Voices },
  ep002v2: { episode: ep002v2, voices: ep002v2Voices },
  ep003: { episode: ep003, voices: ep003Voices },
  ep004: { episode: ep004, voices: ep004Voices },
  ep005: { episode: ep005, voices: ep005Voices },
  ep006: { episode: ep006, voices: ep006Voices },
  ep007: { episode: ep007, voices: ep007Voices },
  ep008: { episode: ep008, voices: ep008Voices },
  ep010: { episode: ep010, voices: ep010Voices },
  templatetest: { episode: templatetest, voices: templatetestVoices },
};
