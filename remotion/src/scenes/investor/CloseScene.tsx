import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../teaser/theme";
import { Backdrop, Kicker, useEnter } from "./Shared";

const Pill: React.FC<{ t: string; delay: number }> = ({ t, delay }) => {
  const e = useEnter(delay, 20);
  return (
    <div
      style={{
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
        padding: "12px 22px",
        borderRadius: 999,
        border: `1px solid ${COLORS.accent}55`,
        background: `${COLORS.accent}12`,
        fontFamily: FONT_MONO,
        fontSize: 19,
        letterSpacing: 1.4,
        color: COLORS.text,
      }}
    >
      {t}
    </div>
  );
};

export const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useEnter(10, 200);
  const line = interpolate(frame, [40, 70], [0, 640], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glow = 0.5 + Math.sin(frame * 0.06) * 0.25;
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <Kicker text="AI Smart Well" delay={2} />
        <div
          style={{
            marginTop: 26,
            fontFamily: FONT_DISPLAY,
            fontWeight: 900,
            fontSize: 96,
            letterSpacing: -3,
            lineHeight: 1.05,
            color: COLORS.text,
            opacity: title.opacity,
            transform: `translateY(${title.y}px)`,
            maxWidth: 1400,
          }}
        >
          Turning idle wells into
          <br />
          <span style={{ color: COLORS.accent, textShadow: `0 0 ${40 * glow}px ${COLORS.accent}66` }}>
            bankable production
          </span>
        </div>
        <div style={{ height: 2, width: line, background: `${COLORS.accent}77`, marginTop: 44 }} />
        <div style={{ display: "flex", gap: 18, marginTop: 46 }}>
          <Pill t="SPT · US PATENT 8,863,823" delay={70} />
          <Pill t="NVIDIA INCEPTION" delay={84} />
          <Pill t="SOFTWARE + PRODUCTION UPSIDE" delay={98} />
        </div>
        <div
          style={{
            marginTop: 56,
            fontFamily: FONT_DISPLAY,
            fontSize: 30,
            color: COLORS.mute,
            opacity: interpolate(frame, [110, 135], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          aismartwell.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
