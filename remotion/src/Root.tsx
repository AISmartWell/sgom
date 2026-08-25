import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { PipelineVideo } from "./PipelineVideo";
import { WellLogVideo } from "./WellLogVideo";
import { TeaserVideo } from "./TeaserVideo";
import { WellLogDemoVideo } from "./WellLogDemoVideo";
import { InvestorVideo, INVESTOR_DURATION, INVESTOR_SCENES } from "./InvestorVideo";
import { HookScene } from "./scenes/investor/HookScene";
import { PipelineScene } from "./scenes/investor/PipelineScene";
import { UIScene } from "./scenes/investor/UIScene";
import { RPSScene } from "./scenes/investor/RPSScene";
import { PhysicsScene } from "./scenes/investor/PhysicsScene";
import { NumbersScene } from "./scenes/investor/NumbersScene";
import { CloseScene } from "./scenes/investor/CloseScene";

import { SgomVideo, SGOM_DURATION, SGOM_SCENES } from "./SgomVideo";

const d = (i: number) => INVESTOR_SCENES[i].duration;

export const RemotionRoot = () => (
  <>
    <Composition
      id="sgom-physics"
      component={SgomVideo}
      durationInFrames={SGOM_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    {SGOM_SCENES.map((s) => (
      <Composition
        key={s.id}
        id={`sgom-${s.id.replace("_", "-")}`}
        component={s.C}
        durationInFrames={s.duration}
        fps={30}
        width={1920}
        height={1080}
      />
    ))}

    <Composition
      id="investor-pitch"
      component={InvestorVideo}
      durationInFrames={INVESTOR_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition id="inv-01-hook" component={HookScene} durationInFrames={d(0)} fps={30} width={1920} height={1080} />
    <Composition id="inv-02-solution" component={PipelineScene} durationInFrames={d(1)} fps={30} width={1920} height={1080} />
    <Composition id="inv-03-ocr" component={() => <UIScene clip="ocr" startAt={9} kicker="Stage 1 · Legacy data" title="Data nobody else can use" badge="PAPER LOGS → STRUCTURED CURVES" bullets={["Scanned logs & reports digitized", "Minutes instead of months", "Every value traceable to its source"]} />} durationInFrames={d(2)} fps={30} width={1920} height={1080} />
    <Composition id="inv-04-solver" component={() => <UIScene clip="solver" startAt={9} kicker="Stage 2 · Petrophysical Solver" title="Rock quality, reconstructed" badge="PAY ZONES · REMAINING OIL IN PLACE" bullets={["Multi-mineral interpretation per well", "Confidence flagged on every answer", "Physics-backed, not a black box"]} />} durationInFrames={d(3)} fps={30} width={1920} height={1080} />
    <Composition id="inv-05-physics" component={PhysicsScene} durationInFrames={d(4)} fps={30} width={1920} height={1080} />
    <Composition id="inv-06-rps" component={RPSScene} durationInFrames={d(5)} fps={30} width={1920} height={1080} />
    <Composition id="inv-07-advisor" component={() => <UIScene clip="advisor" startAt={8} kicker="Stage 3 · Autonomous advisor" title="The agent screens the whole field" badge="SPT · US PATENT 8,863,823" bullets={["Ranks every candidate well", "Matches the right restoration technology", "Slot Perforation Technology first"]} />} durationInFrames={d(6)} fps={30} width={1920} height={1080} />
    <Composition id="inv-08-twin" component={() => <UIScene clip="twin" startAt={8} kicker="Stage 4 · Digital twin" title="The forecast stays honest" badge="AUTO-CALIBRATED" bullets={["Live production vs model", "Self-calibrating after every treatment"]} />} durationInFrames={d(7)} fps={30} width={1920} height={1080} />
    <Composition id="inv-09-econ" component={() => <UIScene clip="econ" startAt={8} kicker="Stage 5 · Economics" title="What investors actually buy" badge="CAPITAL · PAYBACK · CASH FLOW" bullets={["Full economic case per recommendation", "Downside modelled next to upside", "Decision-ready, board-ready output"]} />} durationInFrames={d(8)} fps={30} width={1920} height={1080} />
    <Composition id="inv-10-numbers" component={NumbersScene} durationInFrames={d(9)} fps={30} width={1920} height={1080} />
    <Composition id="inv-11-close" component={CloseScene} durationInFrames={d(10)} fps={30} width={1920} height={1080} />
    <Composition
      id="teaser"
      component={TeaserVideo}
      durationInFrames={2090}
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
