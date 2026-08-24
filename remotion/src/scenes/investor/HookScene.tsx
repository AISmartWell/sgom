import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../teaser/theme";
import { Backdrop, Kicker, useCount, useEnter } from "./Shared";

const Stat: React.FC<{ value: string; label: string; delay: number }> = ({ value, label, delay }) => {
  const e = useEnter(delay, 24);
  return (
    <div
      style={{
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
        borderTop: `2px solid ${COLORS.accent}66`,
        paddingTop: 14,
        minWidth: 300,
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 52, color: COLORS.text }}>
        {value}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: COLORS.mute, letterSpacing: 1.5 }}>
        {label}
      </div>
    </div>
  );
};

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const n = useCount(2.5, 14, 55);
  const lineW = interpolate(frame, [70, 110], [0, 760], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const sub = useEnter(115, 26);

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: "120px 130px", justifyContent: "center" }}>
        <Kicker text="Mature & idle wells · North America" delay={4} />
        <div
          style={{
            marginTop: 26,
            fontFamily: FONT_DISPLAY,
            fontWeight: 900,
            fontSize: 190,
            lineHeight: 0.92,
            letterSpacing: -8,
            color: COLORS.text,
          }}
        >
          {n.toFixed(1)}
          <span style={{ color: COLORS.accent }}>M</span>
        </div>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 600,
            fontSize: 44,
            color: COLORS.mute,
            marginTop: 6,
          }}
        >
          wells that still hold recoverable oil
        </div>
        <div style={{ height: 2, width: lineW, background: `${COLORS.accent}88`, marginTop: 42 }} />
        <div
          style={{
            marginTop: 34,
            opacity: sub.opacity,
            transform: `translateY(${sub.y}px)`,
            fontFamily: FONT_DISPLAY,
            fontSize: 40,
            color: COLORS.text,
            maxWidth: 1100,
          }}
        >
          Abandoned on paper — not on geology. The barrier is{" "}
          <span style={{ color: COLORS.accent, fontWeight: 700 }}>the decision</span>.
        </div>
        <div style={{ display: "flex", gap: 70, marginTop: 60 }}>
          <Stat value="~70%" label="OIL LEFT IN PLACE" delay={135} />
          <Stat value="decades" label="OF DATA ON PAPER" delay={148} />
          <Stat value="weeks" label="TO EVALUATE ONE FIELD" delay={161} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
