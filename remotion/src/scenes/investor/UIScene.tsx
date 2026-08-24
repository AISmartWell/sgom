import React from "react";
import { AbsoluteFill, Video, staticFile, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../teaser/theme";
import { Backdrop, Bullet, Kicker, Title, useEnter } from "./Shared";

export type UISceneProps = {
  clip: string;
  startAt?: number; // seconds into the clip
  kicker: string;
  title: string;
  bullets: string[];
  badge?: string;
};

const Frame: React.FC<{ clip: string; startAt: number }> = ({ clip, startAt }) => {
  const e = useEnter(10, 26);
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.02) * 5;
  return (
    <div
      style={{
        position: "absolute",
        right: 90,
        top: 150,
        width: 1080,
        height: 608,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "#05070d",
        boxShadow: `0 50px 120px rgba(0,0,0,0.6), 0 0 0 1px ${COLORS.accent}22`,
        opacity: e.opacity,
        transform: `translateY(${e.y + drift}px) perspective(1800px) rotateY(${interpolate(e.s, [0, 1], [-6, -2])}deg)`,
      }}
    >
      <div
        style={{
          height: 34,
          background: "#0a1018",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 14px",
        }}
      >
        {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
          <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: `${c}aa` }} />
        ))}
        <span
          style={{
            marginLeft: 14,
            fontFamily: FONT_MONO,
            fontSize: 13,
            color: COLORS.mute,
          }}
        >
          app.aismartwell.com
        </span>
      </div>
      <div style={{ width: 1080, height: 574, overflow: "hidden" }}>
        <Video
          src={staticFile(`clips/${clip}.mp4`)}
          startFrom={Math.round(startAt * 30)}
          muted
          style={{ width: 1080, height: 608, objectFit: "cover", objectPosition: "top left" }}
        />
      </div>
    </div>
  );
};

export const UIScene: React.FC<UISceneProps> = ({ clip, startAt = 9, kicker, title, bullets, badge }) => {
  const frame = useCurrentFrame();
  const scan = interpolate(frame % 90, [0, 90], [0, 1]);
  return (
    <AbsoluteFill>
      <Backdrop />
      <Frame clip={clip} startAt={startAt} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 820,
          background: "linear-gradient(90deg, rgba(2,3,10,0.97) 62%, rgba(2,3,10,0))",
        }}
      />
      <div style={{ position: "absolute", left: 100, top: 210, width: 640 }}>
        <Kicker text={kicker} delay={2} />
        <div style={{ marginTop: 20 }}>
          <Title text={title} delay={8} size={58} />
        </div>
        {badge && (
          <div
            style={{
              display: "inline-block",
              marginTop: 22,
              padding: "8px 16px",
              borderRadius: 999,
              border: `1px solid ${COLORS.accent}66`,
              background: `${COLORS.accent}14`,
              fontFamily: FONT_MONO,
              fontSize: 16,
              letterSpacing: 1.6,
              color: COLORS.accent,
              opacity: interpolate(frame, [16, 30], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
            }}
          >
            {badge}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 34 }}>
          {bullets.map((b, i) => (
            <Bullet key={b} text={b} delay={40 + i * 22} />
          ))}
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: FONT_MONO,
            fontSize: 15,
            letterSpacing: 2,
            color: COLORS.mute,
            opacity: 0.5 + scan * 0.5,
          }}
        >
          LIVE PLATFORM · RECORDED IN PRODUCT
        </div>
      </div>
    </AbsoluteFill>
  );
};
