import React from "react";
import { Eyebrow, H2, Stage, Sub, useEnter } from "./Shared";
import { C, F_DISPLAY, F_MONO } from "./theme";

const Panel: React.FC<{
  k: string;
  title: string;
  body: string;
  color: string;
  delay: number;
}> = ({ k, title, body, color, delay }) => {
  const e = useEnter(delay, 24);
  return (
    <div
      style={{
        flex: 1,
        background: C.panel2,
        border: `1px solid ${C.hair}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 12,
        padding: "28px 32px",
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
      }}
    >
      <div style={{ fontFamily: F_MONO, fontSize: 18, letterSpacing: 2, color }}>{k}</div>
      <div style={{ fontFamily: F_DISPLAY, fontSize: 32, marginTop: 10 }}>{title}</div>
      <div style={{ fontSize: 22, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
};

export const S6Trust: React.FC = () => (
  <Stage>
    <Eyebrow text="Integration Transparency" color={C.gold} />
    <H2 text="Honest about what's live." size={58} />
    <Sub text="Investors get a straight answer: what's connected today, and what's next." />
    <div style={{ display: "flex", gap: 28, marginTop: 34 }}>
      <Panel
        k="LIVE"
        title="SGOM Predict"
        body="Calls NVIDIA NIM via the AI gateway for real multimodal inference."
        color={C.green}
        delay={18}
      />
      <Panel
        k="SIMULATION"
        title="Transfer & Reason"
        body="Deterministic physics, calibrated against historical SPT data. Full foundation-model integration is on the Phase I roadmap."
        color={C.gold}
        delay={28}
      />
    </div>
  </Stage>
);
