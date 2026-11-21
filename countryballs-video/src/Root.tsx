import { Composition, Folder, Still } from "remotion";
import { EmblemCheck } from "./countryballs/EmblemCheck";
import { calculateFormatMetadata, FormatEpisode } from "./countryballs/formats/FormatEpisode";
import { MyComposition } from "./Composition";
import { TestVertical } from "./TestVertical";
import {
  calculateFlagFamilyMetadata,
  FlagFamilyEpisode,
} from "./countryballs/FlagFamilyEpisode";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="TestVertical"
        component={TestVertical}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="FlagFamily">
        <Composition
          id="Ep001"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep001", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep001V2"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep001v2", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep002"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep002", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep002V2"
          component={FlagFamilyEpisode}
          durationInFrames={577}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep002v2", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep003"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep003", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep004"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep004", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep005"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep005", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep006"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep006", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep007"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep007", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep008"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep008", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep009"
          component={FormatEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep009" }}
          calculateMetadata={calculateFormatMetadata}
        />
        <Composition
          id="Ep010"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep010", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep014"
          component={FlagFamilyEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep014", music: "" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="Ep011"
          component={FormatEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep011" }}
          calculateMetadata={calculateFormatMetadata}
        />
        <Composition
          id="Ep012"
          component={FormatEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep012" }}
          calculateMetadata={calculateFormatMetadata}
        />
        <Composition
          id="Ep013"
          component={FormatEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep013" }}
          calculateMetadata={calculateFormatMetadata}
        />
        <Composition
          id="Ep015"
          component={FormatEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep015" }}
          calculateMetadata={calculateFormatMetadata}
        />
        <Composition
          id="Ep016"
          component={FormatEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep016" }}
          calculateMetadata={calculateFormatMetadata}
        />
        <Composition
          id="Ep017"
          component={FormatEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep017" }}
          calculateMetadata={calculateFormatMetadata}
        />
        <Composition
          id="Ep018"
          component={FormatEpisode}
          durationInFrames={570}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "ep018" }}
          calculateMetadata={calculateFormatMetadata}
        />
      </Folder>
      <Folder name="Tests">
        <Still id="EmblemCheck" component={EmblemCheck} width={1080} height={940} />
        <Composition
          id="TemplateTest"
          component={FlagFamilyEpisode}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "templatetest", music: "music/flag-family-loop.wav" }}
          calculateMetadata={calculateFlagFamilyMetadata}
        />
        <Composition
          id="FormatTest"
          component={FormatEpisode}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ episodeId: "formattest" }}
          calculateMetadata={calculateFormatMetadata}
        />
      </Folder>
    </>
  );
};
