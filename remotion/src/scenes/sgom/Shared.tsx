import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F_DISPLAY, F_MONO, F_SANS } from "./theme";

export const useEnter = (delay: number, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping, stiffness: 130 } });
  return { s, opacity: s, y: interpolate(s, [0, 1], [22, 0]) };
};

const curve = (seed: number, w: number, h: number, wiggle: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const x =
      w / 2 +
      Math.sin(t * 18 + seed) * wiggle +
      Math.sin(t * 41 + seed * 2.3) * wiggle * 0.45 +
      Math.sin(t * 7.5 + seed * 0.7) * wiggle * 0.7;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${(t * h).toFixed(1)}`);
  }
  return pts.join(" ");
};

/** Signature left rail: scrolling well-log with scanline + pay band. */
export const LogRail: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = ((frame * 1.6) % 540);
  const scan = 40 + (Math.sin(frame * 0.035) * 0.5 + 0.5) * 960;
  const bandPulse = 0.35 + (Math.sin(frame * 0.09) * 0.5 + 0.5) * 0.55;
  return (
    <div
      style={{
        position: "relative",
        width: 190,
        height: "100%",
        background: "linear-gradient(180deg,#0D1526,#0A0F1A)",
        borderRight: `1px solid ${C.hair}`,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {[0, 1, 2].map((k) => (
        <svg
          key={k}
          width={190}
          height={540}
          style={{ position: "absolute", top: k * 540 - shift, left: 0 }}
        >
          <path d={curve(1.2, 62, 540, 18)} stroke={C.teal} strokeWidth={1.4} fill="none" opacity={0.75} />
          <path d={curve(3.4, 128, 540, 22)} stroke={C.gold} strokeWidth={1.4} fill="none" opacity={0.6} />
          <path d={curve(5.9, 95, 540, 30)} stroke={C.violet} strokeWidth={1.1} fill="none" opacity={0.4} />
        </svg>
      ))}
      <div
        style={{
          position: "absolute",
          left: "6%",
          width: "88%",
          top: 470,
          height: 54,
          background: C.goldDim,
          borderTop: `1px solid ${C.gold}`,
          borderBottom: `1px solid ${C.gold}`,
          opacity: bandPulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: "100%",
          top: scan,
          height: 2,
          background: `linear-gradient(90deg,transparent,${C.gold},transparent)`,
          boxShadow: `0 0 18px 3px ${C.goldDim}`,
        }}
      />
    </div>
  );
};

export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 20% -10%, #14203a 0%, ${C.bg} 55%)`,
      display: "flex",
      flexDirection: "row",
      color: C.ink,
      fontFamily: F_SANS,
    }}
  >
    <LogRail />
    <div
      style={{
        flex: 1,
        height: "100%",
        padding: "0 96px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

export const Eyebrow: React.FC<{ text: string; delay?: number; color?: string }> = ({
  text,
  delay = 0,
  color = C.teal,
}) => {
  const e = useEnter(delay);
  return (
    <div
      style={{
        fontFamily: F_MONO,
        fontSize: 21,
        letterSpacing: 3.4,
        textTransform: "uppercase",
        color,
        marginBottom: 18,
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const H2: React.FC<{ text: string; delay?: number; size?: number }> = ({
  text,
  delay = 5,
  size = 64,
}) => {
  const e = useEnter(delay);
  return (
    <div
      style={{
        fontFamily: F_DISPLAY,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: -0.8,
        color: C.ink,
        whiteSpace: "pre-line",
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const Sub: React.FC<{ text: string; delay?: number; width?: number }> = ({
  text,
  delay = 12,
  width = 900,
}) => {
  const e = useEnter(delay);
  return (
    <div
      style={{
        fontSize: 26,
        lineHeight: 1.5,
        color: C.muted,
        maxWidth: width,
        marginTop: 18,
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const Pill: React.FC<{ text: string; tone: string; delay?: number }> = ({
  text,
  tone,
  delay = 0,
}) => {
  const e = useEnter(delay, 22);
  return (
    <span
      style={{
        fontFamily: F_MONO,
        fontSize: 18,
        letterSpacing: 1,
        padding: "8px 18px",
        borderRadius: 30,
        color: tone,
        border: `1px solid ${tone}66`,
        background: `${tone}14`,
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
      }}
    >
      {text}
    </span>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  delay?: number;
  active?: boolean;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, active = false, accent = C.blue, style }) => {
  const e = useEnter(delay, 24);
  return (
    <div
      style={{
        background: active ? `${accent}1A` : C.panel2,
        border: `1px solid ${active ? accent : C.hair}`,
        borderRadius: 12,
        padding: "20px 24px",
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const useCount = (to: number, delay: number, dur = 40) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return to * (1 - Math.pow(1 - p, 3));
};
