import React from "react";
import { Eyebrow, H2, Stage, Sub, useEnter } from "./Shared";
import { C, F_MONO } from "./theme";

const ROWS: [string, string, string, string][] = [
  ["S1", "Field Scanning", "Transfer", C.blue],
  ["S2", "Data Classification", "Reason", C.violet],
  ["S4", "SPT Projection", "Predict", C.green],
  ["S6", "Well Ranking", "Reason", C.violet],
];

const Row: React.FC<{ r: [string, string, string, string]; delay: number }> = ({ r, delay }) => {
  const e = useEnter(delay, 24);
  const [sid, name, tag, color] = r;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        background: C.panel3,
        border: `1px solid ${C.hair}`,
        borderRadius: 10,
        padding: "18px 26px",
        opacity: e.opacity,
        transform: `translateX(${(1 - e.s) * -26}px)`,
      }}
    >
      <span style={{ fontFamily: F_MONO, fontSize: 19, color: C.muted, width: 44 }}>{sid}</span>
      <span style={{ fontSize: 28, flex: 1 }}>{name}</span>
      <span
        style={{
          fontFamily: F_MONO,
          fontSize: 18,
          padding: "7px 16px",
          borderRadius: 20,
          color,
          background: `${color}1F`,
        }}
      >
        {tag}
      </span>
    </div>
  );
};

export const S5Pipeline: React.FC = () => (
  <Stage>
    <Eyebrow text="Architecture" />
    <H2 text="One pipeline, three physics engines." size={58} />
    <Sub text="Every stage, mapped to a module." />
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 30, maxWidth: 1000 }}>
      {ROWS.map((r, i) => (
        <Row key={r[0]} r={r} delay={18 + i * 9} />
      ))}
    </div>
  </Stage>
);
