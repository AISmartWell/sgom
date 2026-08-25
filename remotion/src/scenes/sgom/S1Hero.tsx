import React from "react";
import { Eyebrow, H2, Pill, Stage, Sub } from "./Shared";
import { C } from "./theme";

export const S1Hero: React.FC = () => (
  <Stage>
    <Eyebrow text="World Foundation Model · NVIDIA NIM" />
    <H2 text={"Trained on 20 million hours of physics.\nApplied to what's under your feet."} size={70} />
    <Sub
      text="SGOM Physics Simulator turns raw well logs into ranked SPT candidates — with an explainable reasoning chain behind every call."
      width={1000}
    />
    <div style={{ display: "flex", gap: 14, marginTop: 34 }}>
      <Pill text="NVIDIA Inception Member" tone={C.teal} delay={22} />
      <Pill text="Physics-Aware AI" tone={C.gold} delay={28} />
    </div>
  </Stage>
);
