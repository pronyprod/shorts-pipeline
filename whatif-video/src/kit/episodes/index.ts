// KIT episodes: B and D versions of What If episodes. Each file only says which place, shot,
// light and Pom pose each beat uses (plus any episode-only bits); the kit does the rest.
import type { KitEp } from "../KitEpisode";
import { k007b } from "./k007b";
import { k008d } from "./k008d";
import { k010 } from "./k010";
import { k011 } from "./k011";
import { k012 } from "./k012";
import { k013 } from "./k013";
import { k014 } from "./k014";
import { k015 } from "./k015";
import { k016 } from "./k016";
import { k017 } from "./k017";
import { showcase } from "./showcase";
import { tFlatA, tFlatC, tLiveB, tLiveBbed, tLiveBdry, tLiveBvoice, tPixelP, tShadeD } from "./tests";

export const KIT_EPISODES: Record<string, KitEp> = {
  showcase,
  k007b,
  k008d,
  k010,
  k011,
  k012,
  k013,
  k014,
  k015,
  k016,
  k017,
  tShadeD,
  tFlatA,
  tPixelP,
  tFlatC,
  tLiveB,
  tLiveBdry,
  tLiveBvoice,
  tLiveBbed,
};
