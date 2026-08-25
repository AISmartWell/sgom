import React from "react";
import { useCurrentFrame } from "remotion";
import { Card, Eyebrow, H2, Stage, useCount, useEnter } from "./Shared";
import { C, F_DISPLAY, F_MONO } from "./theme";

const REGIONS = [
  { name: "East Texas Basin", wells: 6, acc: 61 },
  { name: "Anadarko Basin", wells: 12, acc: 72 },
  { name: "Permian Basin", wells: 8, acc: 65 },
  { name: "Mid-Continent", wells: 5, acc: 58 },
];

const STATS: [number, string, string][] = [
  [6, "Real wells", ""],
  [39, "To generate", ""],
  [45, "Target volume", ""],
  [15.2, "Avg. porosity", "%"],
];

const Stat: React.FC<{ to: number; label: string; suffix: string; delay: number }> = ({
  to,
  label,
  suffix,
  delay,
}) => {
  const v = useCount(to, delay, 34);
  const e = useEnter(delay, 24);
  return (
    <div style={{ opacity: e.opacity, transform: `translateY(${e.y}px)` }}>
      <div style={{ fontFamily: F_MONO, fontSize: 46, color: C.blue }}>
        {suffix === "%" ? v.toFixed(1) : Math.round(v)}
        {suffix}
      </div>
      <div style={{ fontSize: 19, color: C.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
};

export const S3Transfer: React.FC = () => {
  const frame = useCurrentFrame();
  const active = Math.floor(Math.max(0, frame - 40) / 26) % REGIONS.length;
  return (
    <Stage>
      <Eyebrow text="SGOM Physics Transfer" color={C.blue} />
      <H2 text="Data-scarce region? Generate physics-consistent synthetic logs." size={54} />
      <div style={{ display: "flex", gap: 18, marginTop: 34, flexWrap: "wrap" }}>
        {REGIONS.map((r, i) => (
          <Card key={r.name} delay={14 + i * 6} active={frame > 40 && active === i} accent={C.blue} style={{ minWidth: 300 }}>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 27 }}>{r.name}</div>
            <div style={{ fontFamily: F_MONO, fontSize: 18, color: C.muted, marginTop: 8 }}>
              {r.wells} real wells · <b style={{ color: C.blue }}>{r.acc}% accuracy</b>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", gap: 66, marginTop: 44 }}>
        {STATS.map(([to, label, suffix], i) => (
          <Stat key={label} to={to} label={label} suffix={suffix} delay={54 + i * 8} />
        ))}
      </div>
    </Stage>
  );
};
