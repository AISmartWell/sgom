import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../teaser/theme";
import { Backdrop, Kicker, Title, useCount, useEnter } from "./Shared";

const Metric: React.FC<{
  value: string;
  label: string;
  sub: string;
  delay: number;
  tone?: string;
}> = ({ value, label, sub, delay, tone = COLORS.accent }) => {
  const e = useEnter(delay, 18);
  return (
    <div
      style={{
        flex: 1,
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
        borderRadius: 18,
        padding: "30px 28px",
        background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
        border: `1px solid ${tone}44`,
      }}
    >
      <div style={{ fontFamily: FONT_MONO, fontSize: 15, letterSpacing: 2, color: tone }}>{label}</div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: 68,
          color: COLORS.text,
          marginTop: 10,
          letterSpacing: -2,
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.mute, marginTop: 8 }}>{sub}</div>
    </div>
  );
};

const Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const years = [
    { y: "2026", s: 12, o: 6 },
    { y: "2027", s: 34, o: 26 },
    { y: "2028", s: 64, o: 52 },
    { y: "2029", s: 96, o: 78 },
    { y: "2030", s: 130, o: 104 },
  ];
  const max = 240;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 40, height: 260, marginTop: 10 }}>
      {years.map((d, i) => {
        const g = interpolate(frame - (120 + i * 10), [0, 26], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={d.y} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 220 }}>
              <div
                style={{
                  width: 44,
                  height: (d.s / max) * 220 * g,
                  background: COLORS.accent,
                  borderRadius: "6px 6px 0 0",
                }}
              />
              <div
                style={{
                  width: 44,
                  height: (d.o / max) * 220 * g,
                  background: "#23d3b0",
                  borderRadius: "6px 6px 0 0",
                }}
              />
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 17, color: COLORS.mute }}>{d.y}</div>
          </div>
        );
      })}
      <div style={{ marginLeft: 30, display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { c: COLORS.accent, t: "Software subscriptions" },
          { c: "#23d3b0", t: "Restored production share" },
        ].map((l) => (
          <div key={l.t} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: l.c }} />
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.text }}>{l.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NumbersScene: React.FC = () => {
  const payback = useCount(9.2, 30, 40);
  const ret = useCount(3.7, 44, 44);
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: "90px 110px", justifyContent: "center" }}>
        <Kicker text="Economic effect · base case" delay={2} />
        <div style={{ marginTop: 16 }}>
          <Title text="Two revenue engines, one restoration cycle" delay={8} size={58} />
        </div>
        <div style={{ display: "flex", gap: 26, marginTop: 40 }}>
          <Metric value="$510K" label="CAPITAL DEPLOYED" sub="6 restoration candidates" delay={24} />
          <Metric
            value={`${payback.toFixed(1)} mo`}
            label="AVERAGE PAYBACK"
            sub="per treated well"
            delay={38}
            tone="#23d3b0"
          />
          <Metric value={`$${ret.toFixed(1)}M`} label="FULL-PERIOD RETURN" sub="modelled with decline" delay={52} />
        </div>
        <Bars />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
