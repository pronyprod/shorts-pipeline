import { Composition } from "remotion";
import { Ep001, EP001_SECONDS } from "./episodes/Ep001";
import { Ep001V2, EP001V2_SECONDS } from "./episodes/Ep001V2";
import { Ep001V3, EP001V3_SECONDS } from "./episodes/Ep001V3";
import { Ep002, EP002_SECONDS } from "./episodes/Ep002";
import { Ep003, EP003_SECONDS } from "./episodes/Ep003";
import { Ep004, EP004_SECONDS } from "./episodes/Ep004";
import { Ep005, EP005_SECONDS } from "./episodes/Ep005";
import { Ep006, EP006_SECONDS } from "./episodes/Ep006";
import { Ep007, EP007_SECONDS } from "./episodes/Ep007";
import { Ep008, EP008_SECONDS } from "./episodes/Ep008";
import { Ep009, EP009_SECONDS } from "./episodes/Ep009";
import { Ep010, EP010_SECONDS } from "./episodes/Ep010";
import { Ep011, EP011_SECONDS } from "./episodes/Ep011";
import { Ep012, EP012_SECONDS } from "./episodes/Ep012";
import { Ep013, EP013_SECONDS } from "./episodes/Ep013";
import { Ep014, EP014_SECONDS } from "./episodes/Ep014";
import { Ep015, EP015_SECONDS } from "./episodes/Ep015";
import { Ep016, EP016_SECONDS } from "./episodes/Ep016";
import { Ep017, EP017_SECONDS } from "./episodes/Ep017";
import { Ep018, EP018_SECONDS } from "./episodes/Ep018";
import { Ep019, EP019_SECONDS } from "./episodes/Ep019";
import { Ep020, EP020_SECONDS } from "./episodes/Ep020";
import { Ep021, EP021_SECONDS } from "./episodes/Ep021";
import { Ep022, EP022_SECONDS } from "./episodes/Ep022";
import { Ep023, EP023_SECONDS } from "./episodes/Ep023";
import { MixTest, MIXTEST_SECONDS } from "./episodes/MixTest";
import { LiveTest, LIVETEST_SECONDS } from "./episodes/LiveTest";
import { LiveTest2, LIVETEST2_SECONDS } from "./episodes/LiveTest2";
import { H, W } from "./theme";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* TEST ONLY (12 Nov 2026): lively captions + SFX layer */}
      <Composition id="LiveTest" component={LiveTest} durationInFrames={Math.ceil(LIVETEST_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      {/* TEST ONLY (14 Nov 2026): captions v2 + SfxLayer2 + v2 mix; Voice/Bed = level-check stems */}
      <Composition id="LiveTest2" component={LiveTest2} durationInFrames={Math.ceil(LIVETEST2_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="LiveTest2Voice" component={LiveTest2} durationInFrames={Math.ceil(LIVETEST2_SECONDS * FPS)} fps={FPS} width={W} height={H} defaultProps={{ mute: "bed" as const }} />
      <Composition id="LiveTest2Bed" component={LiveTest2} durationInFrames={Math.ceil(LIVETEST2_SECONDS * FPS)} fps={FPS} width={W} height={H} defaultProps={{ mute: "voice" as const }} />
      <Composition id="LiveTestDry" component={LiveTest} durationInFrames={Math.ceil(LIVETEST_SECONDS * FPS)} fps={FPS} width={W} height={H} defaultProps={{ sfx: false }} />
      <Composition id="Fakta-Ep001" component={Ep001} durationInFrames={Math.ceil(EP001_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep001V2" component={Ep001V2} durationInFrames={Math.ceil(EP001V2_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep001V3" component={Ep001V3} durationInFrames={Math.ceil(EP001V3_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep002" component={Ep002} durationInFrames={Math.ceil(EP002_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep003" component={Ep003} durationInFrames={Math.ceil(EP003_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep004" component={Ep004} durationInFrames={Math.ceil(EP004_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep005" component={Ep005} durationInFrames={Math.ceil(EP005_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep006" component={Ep006} durationInFrames={Math.ceil(EP006_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep007" component={Ep007} durationInFrames={Math.ceil(EP007_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep008" component={Ep008} durationInFrames={Math.ceil(EP008_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep009" component={Ep009} durationInFrames={Math.ceil(EP009_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep010" component={Ep010} durationInFrames={Math.ceil(EP010_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep011" component={Ep011} durationInFrames={Math.ceil(EP011_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep012" component={Ep012} durationInFrames={Math.ceil(EP012_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep013" component={Ep013} durationInFrames={Math.ceil(EP013_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep014" component={Ep014} durationInFrames={Math.ceil(EP014_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep015" component={Ep015} durationInFrames={Math.ceil(EP015_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep016" component={Ep016} durationInFrames={Math.ceil(EP016_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep017" component={Ep017} durationInFrames={Math.ceil(EP017_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep018" component={Ep018} durationInFrames={Math.ceil(EP018_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep019" component={Ep019} durationInFrames={Math.ceil(EP019_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep020" component={Ep020} durationInFrames={Math.ceil(EP020_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep021" component={Ep021} durationInFrames={Math.ceil(EP021_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep022" component={Ep022} durationInFrames={Math.ceil(EP022_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-Ep023" component={Ep023} durationInFrames={Math.ceil(EP023_SECONDS * FPS)} fps={FPS} width={W} height={H} />
      <Composition id="Fakta-MixTest" component={MixTest} durationInFrames={MIXTEST_SECONDS * FPS} fps={FPS} width={W} height={H} defaultProps={{}} />
    </>
  );
};
