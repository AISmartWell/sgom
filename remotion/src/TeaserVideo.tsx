import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { TeaserHook } from "./scenes/teaser/TeaserHook";
import { TeaserProblem } from "./scenes/teaser/TeaserProblem";
import { TeaserBrand } from "./scenes/teaser/TeaserBrand";
import { TeaserGeophysical } from "./scenes/teaser/TeaserGeophysical";
import { TeaserVshale } from "./scenes/teaser/TeaserVshale";
import { TeaserScreening } from "./scenes/teaser/TeaserScreening";
import { TeaserResults } from "./scenes/teaser/TeaserResults";
import { TeaserBrawnerReport } from "./scenes/teaser/TeaserBrawnerReport";
import { TeaserOutro } from "./scenes/teaser/TeaserOutro";
import { GrainOverlay } from "./scenes/teaser/GrainOverlay";

// 53 sec @ 30fps = 1590 frames. Sum below = 1590.
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
        <Series.Sequence durationInFrames={180}>
          <TeaserGeophysical />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <TeaserVshale />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <TeaserScreening />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <TeaserResults />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <TeaserBrawnerReport />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <TeaserOutro />
        </Series.Sequence>
      </Series>
      <GrainOverlay />
    </AbsoluteFill>
  );
};

