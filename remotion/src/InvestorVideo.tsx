import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "./scenes/investor/HookScene";
import { PipelineScene } from "./scenes/investor/PipelineScene";
import { UIScene } from "./scenes/investor/UIScene";
import { RPSScene } from "./scenes/investor/RPSScene";
import { NumbersScene } from "./scenes/investor/NumbersScene";
import { CloseScene } from "./scenes/investor/CloseScene";

export const INVESTOR_SCENES = [
  { id: "01_hook", duration: 456 },
  { id: "02_solution", duration: 360 },
  { id: "03_ocr", duration: 369 },
  { id: "04_solver", duration: 354 },
  { id: "05_rps", duration: 375 },
  { id: "06_advisor", duration: 330 },
  { id: "07_twin", duration: 291 },
  { id: "08_econ", duration: 390 },
  { id: "09_numbers", duration: 399 },
  { id: "10_close", duration: 315 },
] as const;

export const TRANSITION = 12;
export const INVESTOR_DURATION =
  INVESTOR_SCENES.reduce((s, x) => s + x.duration, 0) - TRANSITION * (INVESTOR_SCENES.length - 1);

export const InvestorVideo: React.FC = () => {
  const d = (i: number) => INVESTOR_SCENES[i].duration;
  return (
    <AbsoluteFill style={{ background: "#02030a" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={d(0)}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence durationInFrames={d(1)}>
          <PipelineScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence durationInFrames={d(2)}>
          <UIScene
            clip="ocr"
            startAt={9}
            kicker="Stage 1 · Legacy data"
            title="Data nobody else can use"
            badge="PAPER LOGS → STRUCTURED CURVES"
            bullets={["Scanned logs & reports digitized", "Minutes instead of months", "Every value traceable to its source"]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence durationInFrames={d(3)}>
          <UIScene
            clip="solver"
            startAt={9}
            kicker="Stage 2 · Petrophysical Solver"
            title="Rock quality, reconstructed"
            badge="PAY ZONES · REMAINING OIL IN PLACE"
            bullets={["Multi-mineral interpretation per well", "Confidence flagged on every answer", "Physics-backed, not a black box"]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence durationInFrames={d(4)}>
          <RPSScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence durationInFrames={d(5)}>
          <UIScene
            clip="advisor"
            startAt={8}
            kicker="Stage 3 · Autonomous advisor"
            title="The agent screens the whole field"
            badge="SPT · US PATENT 8,863,823"
            bullets={["Ranks every candidate well", "Matches the right restoration technology", "Slot Perforation Technology first"]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence durationInFrames={d(6)}>
          <UIScene
            clip="twin"
            startAt={8}
            kicker="Stage 4 · Digital twin"
            title="The forecast stays honest"
            badge="AUTO-CALIBRATED"
            bullets={["Live production vs model", "Self-calibrating after every treatment"]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence durationInFrames={d(7)}>
          <UIScene
            clip="econ"
            startAt={8}
            kicker="Stage 5 · Economics"
            title="What investors actually buy"
            badge="CAPITAL · PAYBACK · CASH FLOW"
            bullets={["Full economic case per recommendation", "Downside modelled next to upside", "Decision-ready, board-ready output"]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence durationInFrames={d(8)}>
          <NumbersScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />
        <TransitionSeries.Sequence durationInFrames={d(9)}>
          <CloseScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
