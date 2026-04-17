import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { PipelineVideo } from "./PipelineVideo";
import { WellLogVideo } from "./WellLogVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={450}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="pipeline"
      component={PipelineVideo}
      durationInFrames={319}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="welllog"
      component={WellLogVideo}
      durationInFrames={570}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
