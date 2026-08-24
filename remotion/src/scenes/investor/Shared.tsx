import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../teaser/theme";

export const Backdrop: React.FC<{ tint?: string }> = ({ tint = COLORS.accent }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 20% 0%, #0b1526 0%, ${COLORS.bg} 55%, ${COLORS.bgDeep} 100%)`,
      }}
    >
      <AbsoluteFill style={{ opacity: 0.05 }}>
        <svg width="1920" height="1080">
          <defs>
            <pattern id="ig" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M 72 0 L 0 0 0 72" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ig)" />
        </svg>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "55%",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tint}18, transparent 68%)`,
          filter: "blur(70px)",
          transform: `translateY(${Math.sin(frame * 0.02) * 18}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-10%",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, #23d3b014, transparent 70%)",
          filter: "blur(80px)",
          transform: `translateY(${Math.cos(frame * 0.018) * 14}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const useEnter = (delay: number, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping, stiffness: 140 } });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    y: interpolate(s, [0, 1], [26, 0]),
    s,
  };
};

export const Kicker: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const e = useEnter(delay);
  return (
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 20,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: COLORS.accent,
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span style={{ width: 34, height: 2, background: COLORS.accent, display: "inline-block" }} />
      {text}
    </div>
  );
};

export const Title: React.FC<{ text: string; delay?: number; size?: number }> = ({
  text,
  delay = 6,
  size = 76,
}) => {
  const e = useEnter(delay);
  return (
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.04,
        color: COLORS.text,
        letterSpacing: -1.6,
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const Bullet: React.FC<{ text: string; delay: number; tone?: string }> = ({
  text,
  delay,
  tone = COLORS.accent,
}) => {
  const e = useEnter(delay, 22);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: e.opacity,
        transform: `translateX(${(1 - e.s) * -24}px)`,
        background: "rgba(255,255,255,0.035)",
        border: `1px solid ${tone}44`,
        borderLeft: `3px solid ${tone}`,
        borderRadius: 12,
        padding: "14px 18px",
        fontFamily: FONT_DISPLAY,
        fontSize: 26,
        color: COLORS.text,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: tone,
          boxShadow: `0 0 14px ${tone}`,
          flexShrink: 0,
        }}
      />
      {text}
    </div>
  );
};

export const useCount = (to: number, delay: number, dur = 40) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - p, 3);
  return to * eased;
};

export const SceneFade: React.FC<{ children: React.ReactNode; duration: number }> = ({
  children,
  duration,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 8, duration - 10, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
