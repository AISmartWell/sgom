import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S1Hero } from "./scenes/sgom/S1Hero";
import { S2Predict } from "./scenes/sgom/S2Predict";
import { S3Transfer } from "./scenes/sgom/S3Transfer";
import { S4Reason } from "./scenes/sgom/S4Reason";
import { S5Pipeline } from "./scenes/sgom/S5Pipeline";
import { S6Trust } from "./scenes/sgom/S6Trust";
import { S7Close } from "./scenes/sgom/S7Close";

export const SGOM_SCENES = [
  { id: "01_hero", duration: 330, C: S1Hero },
  { id: "02_predict", duration: 360, C: S2Predict },
  { id: "03_transfer", duration: 345, C: S3Transfer },
  { id: "04_reason", duration: 360, C: S4Reason },
  { id: "05_pipeline", duration: 300, C: S5Pipeline },
  { id: "06_trust", duration: 330, C: S6Trust },
  { id: "07_close", duration: 255, C: S7Close },
] as const;

export const SGOM_TRANSITION = 12;
export const SGOM_DURATION =
  SGOM_SCENES.reduce((s, x) => s + x.duration, 0) - SGOM_TRANSITION * (SGOM_SCENES.length - 1);

export const SgomVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#0A0F1A" }}>
    <TransitionSeries>
      {SGOM_SCENES.map((s, i) => (
        <React.Fragment key={s.id}>
          {i > 0 ? (
            <TransitionSeries.Transition
              presentation={fade()}
              timing={linearTiming({ durationInFrames: SGOM_TRANSITION })}
            />
          ) : null}
          <TransitionSeries.Sequence durationInFrames={s.duration}>
            <s.C />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
    </TransitionSeries>
  </AbsoluteFill>
);
