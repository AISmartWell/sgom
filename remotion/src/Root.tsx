import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { PipelineVideo } from "./PipelineVideo";
import { WellLogVideo } from "./WellLogVideo";
import { TeaserVideo } from "./TeaserVideo";
import { WellLogDemoVideo } from "./WellLogDemoVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="teaser"
      component={TeaserVideo}
      durationInFrames={2450}
      fps={30}
      width={1920}
      height={1080}
    />
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
      durationInFrames={600}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="welllog-demo"
      component={WellLogDemoVideo}
      durationInFrames={210}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
