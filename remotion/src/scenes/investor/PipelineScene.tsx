import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../teaser/theme";
import { Backdrop, Kicker, Title } from "./Shared";

const BLOCKS = [
  { t: "Legacy data", s: "paper · scans · CSV" },
  { t: "Petrophysical Solver", s: "rock quality · pay zones" },
  { t: "RPS scoring", s: "rank every well 0–100" },
  { t: "Restoration plan", s: "SPT-first design" },
  { t: "Economics", s: "capex · payback · cash" },
];

const Block: React.FC<{ i: number; t: string; s: string }> = ({ i, t, s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 22 + i * 17;
  const sp = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 180 } });
  const active = interpolate(frame - delay, [0, 12, 42, 70], [0, 1, 1, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width: 300,
        height: 230,
        borderRadius: 20,
        background: `linear-gradient(160deg, rgba(26,159,255,${0.05 + active * 0.09}), rgba(255,255,255,0.02))`,
        border: `1px solid ${COLORS.accent}${active > 0.8 ? "99" : "33"}`,
        boxShadow: `0 0 ${active * 46}px ${COLORS.accent}22`,
        opacity: interpolate(sp, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(sp, [0, 1], [40, 0])}px) scale(${0.94 + sp * 0.06})`,
        padding: 26,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 16,
          color: COLORS.accent,
          letterSpacing: 2,
        }}
      >
        0{i + 1}
      </div>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 30, color: COLORS.text, lineHeight: 1.15 }}>
          {t}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 17, color: COLORS.mute, marginTop: 10 }}>{s}</div>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
        <div
          style={{
            height: 4,
            borderRadius: 4,
            width: `${interpolate(frame - delay, [4, 34], [0, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}%`,
            background: COLORS.accent,
          }}
        />
      </div>
    </div>
  );
};

const Connector: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const delay = 34 + i * 17;
  const w = interpolate(frame - delay, [0, 14], [0, 46], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ width: 46, display: "flex", alignItems: "center" }}>
      <div style={{ height: 2, width: w, background: `${COLORS.accent}aa` }} />
    </div>
  );
};

export const PipelineScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: "110px 100px", justifyContent: "center" }}>
        <Kicker text="One platform · end to end" delay={2} />
        <div style={{ marginTop: 18 }}>
          <Title text="From forgotten wells to funded projects" delay={8} size={64} />
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 70 }}>
          {BLOCKS.map((b, i) => (
            <React.Fragment key={b.t}>
              <Block i={i} t={b.t} s={b.s} />
              {i < BLOCKS.length - 1 && <Connector i={i} />}
            </React.Fragment>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
