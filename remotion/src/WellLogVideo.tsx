import { AbsoluteFill, Series } from "remotion";
import { WellLogUpload } from "./scenes/WellLogUpload";
import { WellLogProcessing } from "./scenes/WellLogProcessing";
import { WellLogResults } from "./scenes/WellLogResults";

export const WellLogVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={150}>
          <WellLogUpload />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <WellLogProcessing />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <WellLogResults />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
