import { Composition, Folder, Still } from "remotion";
import { calculateWhatIfMetadata, WhatIfEpisode } from "./whatif/WhatIfEpisode";
import { KIT_EPISODES } from "./kit/episodes";
import { kitDuration, KitEpisodeView } from "./kit/KitEpisode";
import { BannerA, BannerB, Profile1, Profile2, Profile3 } from "./kit/branding";

const KitComp: React.FC<{ kitId: string }> = ({ kitId }) => <KitEpisodeView k={KIT_EPISODES[kitId]} />;

export const RemotionRoot: React.FC = () => {
  return (
    <>
    {/* style kit (B = blocky 3D, D = paper cut-out in 3D); see src/kit */}
    {/* PomProds branding (12 Nov 2026): stills, render with --gl=angle */}
    <Folder name="Branding">
      <Still id="PomBannerA" component={BannerA} width={2560} height={1440} />
      <Still id="PomBannerB" component={BannerB} width={2560} height={1440} />
      <Still id="PomProfile1" component={Profile1} width={800} height={800} />
      <Still id="PomProfile2" component={Profile2} width={800} height={800} />
      <Still id="PomProfile3" component={Profile3} width={800} height={800} />
    </Folder>
    <Folder name="Kit">
      {Object.entries(KIT_EPISODES).map(([id, k]) => (<Composition key={id} id={`Kit-${id}`} component={KitComp} durationInFrames={kitDuration(k)} fps={30} width={1080} height={1920} defaultProps={{ kitId: id }} />))}
    </Folder>
    <Folder name="WhatIf">
      <Composition
        id="WhatIfEp001"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep001" as const, music: "music/whatif-curious-loop.wav" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp001V2"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep001v2" as const, music: "music/whatif-curious-loop.wav" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp001V3"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep001v3" as const, music: "" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp002"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep002" as const, music: "" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp003"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep003" as const, music: "" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp004"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep004" as const, music: "" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp005"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep005" as const, music: "" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp006"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep006" as const, music: "" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp007"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep007" as const, music: "" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp008"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep008" as const, music: "" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
      <Composition
        id="WhatIfEp009"
        component={WhatIfEpisode}
        durationInFrames={2000}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ episodeId: "ep009" as const, music: "" }}
        calculateMetadata={calculateWhatIfMetadata}
      />
    </Folder>
    </>
  );
};
