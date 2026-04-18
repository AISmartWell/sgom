import { AbsoluteFill, Audio, Series, staticFile, useVideoConfig } from "remotion";
import { TeaserHook } from "./scenes/teaser/TeaserHook";
import { TeaserProblem } from "./scenes/teaser/TeaserProblem";
import { TeaserBrand } from "./scenes/teaser/TeaserBrand";
import { TeaserFieldScan } from "./scenes/teaser/TeaserFieldScan";
import { TeaserGeophysical } from "./scenes/teaser/TeaserGeophysical";
import { TeaserVshale } from "./scenes/teaser/TeaserVshale";
import { TeaserCoreCV } from "./scenes/teaser/TeaserCoreCV";
import { TeaserScreening } from "./scenes/teaser/TeaserScreening";
import { TeaserResults } from "./scenes/teaser/TeaserResults";
import { ResultsScene } from "./scenes/ResultsScene";
import { TeaserOutro } from "./scenes/teaser/TeaserOutro";
import { TeaserPlatformShowcase } from "./scenes/teaser/TeaserPlatformShowcase";
import { TeaserModulesShowcase } from "./scenes/teaser/TeaserModulesShowcase";
import { TeaserWellLogDemo } from "./scenes/teaser/TeaserWellLogDemo";
import { GrainOverlay } from "./scenes/teaser/GrainOverlay";

// 2450 + 210 (welllog demo) = 2660 frames @ 30fps = ~88.6 sec.
export const TeaserVideo: React.FC = () => {
  useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070d" }}>
      <Series>
        <Series.Sequence durationInFrames={120}>
          <TeaserHook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <TeaserProblem />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <TeaserBrand />
        </Series.Sequence>
        <Series.Sequence durationInFrames={200}>
          <TeaserFieldScan />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <TeaserModulesShowcase />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <TeaserGeophysical />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <TeaserVshale />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <TeaserCoreCV />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <TeaserScreening />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <TeaserPlatformShowcase />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <TeaserResults />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <ResultsScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <TeaserWellLogDemo />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <TeaserOutro />
        </Series.Sequence>
      </Series>
      <GrainOverlay />
      <Audio src={staticFile("audio/teaser-music.mp3")} volume={1} />
    </AbsoluteFill>
  );
};

