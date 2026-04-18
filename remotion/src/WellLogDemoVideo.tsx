import { AbsoluteFill, Audio, staticFile, useVideoConfig } from "remotion";
import { TeaserWellLogDemo } from "./scenes/teaser/TeaserWellLogDemo";
import { GrainOverlay } from "./scenes/teaser/GrainOverlay";

// Standalone composition: 210 frames @ 30fps = 7 sec
export const WellLogDemoVideo: React.FC = () => {
  useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070d" }}>
      <TeaserWellLogDemo />
      <GrainOverlay />
      {/* Audio будет приходить из основного teaser через ffmpeg, тут без звука */}
    </AbsoluteFill>
  );
};
