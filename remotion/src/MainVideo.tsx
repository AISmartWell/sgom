import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Scene1Title } from "./scenes/Scene1Title";
import { Scene2PreTreatment } from "./scenes/Scene2PreTreatment";
import { Scene3Injection } from "./scenes/Scene3Injection";
import { Scene4FluidResponse } from "./scenes/Scene4FluidResponse";
import { Scene5Results } from "./scenes/Scene5Results";

export const MainVideo = () => {
  const frame = useCurrentFrame();

  // Persistent animated background gradient
  const hueShift = interpolate(frame, [0, 450], [200, 220]);
  const bg1 = `hsl(${hueShift}, 25%, 8%)`;
  const bg2 = `hsl(${hueShift + 20}, 30%, 12%)`;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${bg1}, ${bg2})` }}>
      {/* Subtle grid overlay */}
      <AbsoluteFill style={{ opacity: 0.04 }}>
        <svg width="1920" height="1080">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </AbsoluteFill>

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <Scene1Title />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={100}>
          <Scene2PreTreatment />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={110}>
          <Scene3Injection />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={110}>
          <Scene4FluidResponse />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={105}>
          <Scene5Results />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
