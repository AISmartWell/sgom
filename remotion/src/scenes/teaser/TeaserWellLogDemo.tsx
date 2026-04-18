import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONT_DISPLAY } from "./theme";

// 7-сек полноэкранное демо работы платформы (Stage 8: Geophysical Expertise / Well Log)
export const TeaserWellLogDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const t = frame / durationInFrames;
  const scale = interpolate(t, [0, 1], [1.04, 1.1]);

  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 18, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const badge = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const badgeY = interpolate(badge, [0, 1], [-30, 0]);

  const titleSpring = spring({ frame: frame - 24, fps, config: { damping: 18, stiffness: 110 } });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleO = interpolate(frame, [24, 42], [0, 1], { extrapolateRight: "clamp" });
  const subO = interpolate(frame, [44, 62], [0, 1], { extrapolateRight: "clamp" });

  const recPulse = 0.5 + 0.5 * Math.sin(frame * 0.25);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${scale})`,
            filter: "saturate(1.08) contrast(1.05)",
          }}
        >
          <Img
            src={staticFile(`shots/welllog-frames/frame-${String(Math.min(151, Math.max(1, frame + 1))).padStart(4, "0")}.jpg`)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(5,7,13,0.0) 55%, rgba(5,7,13,0.85) 100%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: `inset 0 0 240px ${COLORS.accent}33`,
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>

      {/* Stage badge */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 80,
          opacity: badge,
          transform: `translateY(${badgeY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 22px",
            borderRadius: 999,
            background: "rgba(26,159,255,0.12)",
            border: `1px solid ${COLORS.accent}66`,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: COLORS.accent,
              boxShadow: `0 0 12px ${COLORS.accent}`,
            }}
          />
          <span
            style={{
              color: COLORS.accent,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: FONT_DISPLAY,
            }}
          >
            Stage 8 · Live Platform Demo
          </span>
        </div>
      </div>

      {/* Заголовок */}
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 90, opacity }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 92,
            lineHeight: 1,
            color: "#ffffff",
            opacity: titleO,
            transform: `translateY(${titleY}px)`,
            letterSpacing: -1,
            textShadow: "0 6px 30px rgba(0,0,0,0.5)",
          }}
        >
          Geophysical Expertise
        </div>
        <div style={{ height: 14 }} />
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 500,
            fontSize: 36,
            color: COLORS.accent,
            opacity: subO,
            letterSpacing: 0.5,
          }}
        >
          AI well-log interpretation in real time
        </div>
      </div>

      {/* LIVE indicator */}
      <div
        style={{
          position: "absolute",
          top: 70,
          right: 90,
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: opacity * recPulse,
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#ff3b3b",
            boxShadow: "0 0 16px #ff3b3b",
          }}
        />
        <span
          style={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            fontFamily: FONT_DISPLAY,
          }}
        >
          LIVE
        </span>
      </div>
    </AbsoluteFill>
  );
};
