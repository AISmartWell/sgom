import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../teaser/theme";
import { Backdrop, Kicker, Title, useEnter } from "./Shared";

const NV_GREEN = "#76b900";

/** Animated well-log tracks with an SPT target zone sweeping into place. */
const LogTracks: React.FC = () => {
  const frame = useCurrentFrame();
  const H = 420;
  const curves = [
    { color: "#8bd450", seed: 1.0 },
    { color: "#f0883e", seed: 2.3 },
    { color: "#4cc9f0", seed: 3.7 },
    { color: "#ef4444", seed: 5.1 },
  ];
  const draw = interpolate(frame, [6, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoneY = interpolate(frame, [40, 70], [H * 0.62, H * 0.34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoneOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const path = (seed: number, x: number) => {
    let d = "";
    const pts = 48;
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      const y = t * H;
      const dx =
        Math.sin(t * 14 + seed) * 16 +
        Math.sin(t * 31 + seed * 2) * 8 +
        Math.sin(t * 5 + seed * 3) * 10;
      d += `${i === 0 ? "M" : "L"} ${x + dx} ${y} `;
    }
    return d;
  };

  return (
    <svg width={420} height={H} style={{ overflow: "visible" }}>
      <rect width={420} height={H} rx={14} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" />
      <g opacity={zoneOpacity}>
        <rect x={6} y={zoneY} width={408} height={96} fill={`${NV_GREEN}1f`} />
        <rect x={6} y={zoneY} width={408} height={5} fill={NV_GREEN} />
        <rect x={6} y={zoneY + 91} width={408} height={5} fill={NV_GREEN} />
        <text
          x={210}
          y={zoneY + 54}
          textAnchor="middle"
          fill={NV_GREEN}
          fontFamily={FONT_MONO}
          fontSize={17}
          letterSpacing={2}
        >
          SPT TARGET · 4940–5020 ft
        </text>
      </g>
      {curves.map((c, i) => (
        <path
          key={i}
          d={path(c.seed, 60 + i * 100)}
          stroke={c.color}
          strokeWidth={2.4}
          fill="none"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          opacity={0.9}
        />
      ))}
    </svg>
  );
};

const ModuleCard: React.FC<{
  tag: string;
  name: string;
  desc: string;
  tone: string;
  delay: number;
}> = ({ tag, name, desc, tone, delay }) => {
  const e = useEnter(delay, 22);
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin((frame - delay) * 0.09);
  return (
    <div
      style={{
        opacity: e.opacity,
        transform: `translateY(${e.y}px)`,
        flex: 1,
        borderRadius: 16,
        padding: "22px 24px",
        background: "rgba(255,255,255,0.035)",
        border: `1px solid ${tone}55`,
        boxShadow: `0 0 ${18 + pulse * 16}px ${tone}22`,
      }}
    >
      <div style={{ fontFamily: FONT_MONO, fontSize: 15, letterSpacing: 3, color: tone }}>{tag}</div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: 34,
          color: COLORS.text,
          marginTop: 8,
        }}
      >
        {name}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.mute, marginTop: 8, lineHeight: 1.35 }}>
        {desc}
      </div>
    </div>
  );
};

export const PhysicsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const badge = useEnter(14, 22);
  const footer = interpolate(frame, [230, 260], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop tint={NV_GREEN} />
      <AbsoluteFill style={{ padding: "86px 110px" }}>
        <Kicker text="Physics engine" delay={2} />

        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 16 }}>
          <Title text="Physics Simulator" delay={8} size={62} />
          <div
            style={{
              opacity: badge.opacity,
              transform: `translateY(${badge.y}px)`,
              fontFamily: FONT_MONO,
              fontSize: 17,
              letterSpacing: 2,
              color: NV_GREEN,
              border: `1px solid ${NV_GREEN}77`,
              background: `${NV_GREEN}14`,
              borderRadius: 999,
              padding: "9px 16px",
              whiteSpace: "nowrap",
            }}
          >
            POWERED BY NVIDIA NIM
          </div>
        </div>

        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 27,
            color: COLORS.mute,
            marginTop: 14,
            opacity: badge.opacity,
          }}
        >
          Physics-aware AI for well analysis & SPT optimization
        </div>

        <div style={{ display: "flex", gap: 60, marginTop: 40, alignItems: "flex-start" }}>
          <LogTracks />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            <ModuleCard
              tag="PREDICT"
              name="Post-SPT behavior"
              desc="Simulates how the formation responds after treatment."
              tone={NV_GREEN}
              delay={70}
            />
            <ModuleCard
              tag="TRANSFER"
              name="Synthetic well logs"
              desc="Fills data-scarce regions from calibrated analogues."
              tone={COLORS.accent}
              delay={100}
            />
            <ModuleCard
              tag="REASON"
              name="Explainable decisions"
              desc="Why this well — in words, not just a score."
              tone="#a855f7"
              delay={130}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 34,
            opacity: footer,
            fontFamily: FONT_MONO,
            fontSize: 19,
            letterSpacing: 2,
            color: COLORS.mute,
          }}
        >
          NVIDIA INCEPTION MEMBER · LIVE INFERENCE + DETERMINISTIC PHYSICS FALLBACK
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
