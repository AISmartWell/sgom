import { AbsoluteFill, Series } from "remotion";
import { DashboardScene } from "./scenes/DashboardScene";
import { AnalysisScene } from "./scenes/AnalysisScene";
import { ResultsScene } from "./scenes/ResultsScene";

export const WellLogVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={150}>
          <DashboardScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <AnalysisScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <ResultsScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
