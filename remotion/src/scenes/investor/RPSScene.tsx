import React from "react";
import { AbsoluteFill, Video, staticFile, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../teaser/theme";
import { Backdrop, Kicker, Title, useCount, useEnter } from "./Shared";

const Gauge: React.FC<{ value: number }> = ({ value }) => {
  const r = 150;
  const c = 2 * Math.PI * r;
  const pct = value / 100;
  return (
    <svg width={380} height={380} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={190} cy={190} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={18} fill="none" />
      <circle
        cx={190}
        cy={190}
        r={r}
        stroke={COLORS.accent}
        strokeWidth={18}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ filter: `drop-shadow(0 0 18px ${COLORS.accent}88)` }}
      />
    </svg>
  );
};

const Row: React.FC<{ name: string; score: number; delay: number; top?: boolean }> = ({
  name,
  score,
  delay,
  top,
}) => {
  const e = useEnter(delay, 22);
  const frame = useCurrentFrame();
  const w = interpolate(frame - delay - 6, [0, 26], [0, score], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        opacity: e.opacity,
        transform: `translateX(${(1 - e.s) * 30}px)`,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "12px 18px",
        borderRadius: 12,
        background: top ? `${COLORS.accent}18` : "rgba(255,255,255,0.03)",
        border: `1px solid ${top ? COLORS.accent + "77" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.text, width: 250 }}>{name}</div>
      <div style={{ flex: 1, height: 10, borderRadius: 6, background: "rgba(255,255,255,0.07)" }}>
        <div
          style={{
            height: 10,
            width: `${w}%`,
            borderRadius: 6,
            background: top ? COLORS.accent : `${COLORS.accent}77`,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 24,
          color: top ? COLORS.accent : COLORS.mute,
          width: 50,
          textAlign: "right",
        }}
      >
        {Math.round(w)}
      </div>
    </div>
  );
};

export const RPSScene: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useCount(87, 26, 48);
  const clipOpacity = interpolate(frame, [150, 175], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: "100px 110px" }}>
        <Kicker text="Proprietary metric" delay={2} />
        <div style={{ marginTop: 16 }}>
          <Title text="Restoration Potential Score" delay={8} size={62} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 90, marginTop: 44 }}>
          <div style={{ position: "relative", width: 380, height: 380 }}>
            <Gauge value={v} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 110, color: COLORS.text }}>
                {Math.round(v)}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 18, letterSpacing: 3, color: COLORS.accent }}>
                RPS · 0–100
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <Row name="SCHOOL LAND B" score={87} delay={60} top />
            <Row name="JAMES ROSS 1108" score={81} delay={78} />
            <Row name="EILEEN 1406" score={74} delay={94} />
            <Row name="BRAWNER 10-15" score={62} delay={110} />
            <div
              style={{
                marginTop: 8,
                fontFamily: FONT_DISPLAY,
                fontSize: 24,
                color: COLORS.mute,
                opacity: interpolate(frame, [124, 146], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Which wells to restore first — with the reasoning attached to every rank.
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 110,
            bottom: 70,
            width: 520,
            height: 190,
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid ${COLORS.accent}44`,
            opacity: clipOpacity,
            boxShadow: "0 30px 70px rgba(0,0,0,0.6)",
          }}
        >
          <Video
            src={staticFile("clips/rps.mp4")}
            startFrom={Math.round(20 * 30)}
            muted
            style={{ width: 520, height: 292, objectFit: "cover", objectPosition: "bottom left" }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
