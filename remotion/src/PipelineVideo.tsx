import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { PipelineTitle } from "./scenes/PipelineTitle";
import { PipelineStages } from "./scenes/PipelineStages";
import { PipelineStats } from "./scenes/PipelineStats";
import { PipelineClose } from "./scenes/PipelineClose";

export const PipelineVideo = () => {
  const frame = useCurrentFrame();

  // Persistent animated background
  const hueShift = interpolate(frame, [0, 330], [205, 215]);
  const bg1 = `hsl(${hueShift}, 22%, 7%)`;
  const bg2 = `hsl(${hueShift + 15}, 28%, 11%)`;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${bg1}, ${bg2})` }}>
      {/* Grid overlay */}
      <AbsoluteFill style={{ opacity: 0.03 }}>
        <svg width="1920" height="1080">
          <defs>
            <pattern id="pgrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pgrid)" />
        </svg>
      </AbsoluteFill>

      {/* Floating accent orbs */}
      <div style={{
        position: "absolute",
        top: "20%", left: "10%",
        width: 400, height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, hsla(205,100%,50%,0.06), transparent 70%)",
        filter: "blur(60px)",
        transform: `translateY(${Math.sin(frame * 0.03) * 15}px)`,
      }} />
      <div style={{
        position: "absolute",
        bottom: "15%", right: "15%",
        width: 300, height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, hsla(170,80%,50%,0.05), transparent 70%)",
        filter: "blur(50px)",
        transform: `translateY(${Math.cos(frame * 0.025) * 12}px)`,
      }} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={80}>
          <PipelineTitle />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <PipelineStages />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={95}>
          <PipelineStats />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={80}>
          <PipelineClose />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
