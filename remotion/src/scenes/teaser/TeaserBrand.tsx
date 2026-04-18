import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";
import { CinematicShot } from "./CinematicShot";

// SCENE 3 — BRAND REVEAL (4 sec). Logo mark + name explode in.
export const TeaserBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markSpring = spring({ frame, fps, config: { damping: 11, stiffness: 100 } });
  const markScale = interpolate(markSpring, [0, 1], [0.4, 1]);
  const markRot = interpolate(markSpring, [0, 1], [-30, 0]);

  const titleO = interpolate(frame, [18, 38], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [18, 40], [40, 0], { extrapolateRight: "clamp" });
  const titleBlur = interpolate(frame, [18, 44], [16, 0], { extrapolateRight: "clamp" });

  const subO = interpolate(frame, [44, 62], [0, 1], { extrapolateRight: "clamp" });

  // Sweep light bar
  const sweep = interpolate(frame, [50, 90], [-1200, 1800], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <CinematicShot src="shots/01-dashboard.png" fromScale={1.08} toScale={1.18} edge={COLORS.accent} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: FONT_DISPLAY, color: COLORS.text }}>
          <div
            style={{
              transform: `scale(${markScale}) rotate(${markRot}deg)`,
              width: 160,
              height: 160,
              borderRadius: 32,
              background: `linear-gradient(135deg, ${COLORS.accent}, #0a4d80)`,
              boxShadow: `0 0 80px ${COLORS.accent}66`,
              margin: "0 auto 48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 84,
              fontWeight: 900,
            }}
          >
            ▲
          </div>
          <div
            style={{
              fontSize: 144,
              fontWeight: 900,
              letterSpacing: -4,
              opacity: titleO,
              transform: `translateY(${titleY}px)`,
              filter: `blur(${titleBlur}px)`,
              lineHeight: 1,
            }}
          >
            AI Smart Well
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 22,
              letterSpacing: 8,
              color: COLORS.accent,
              marginTop: 28,
              opacity: subO,
              textTransform: "uppercase",
            }}
          >
            From data to decision
          </div>
        </div>
      </AbsoluteFill>
      {/* Light sweep */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(105deg, transparent ${sweep - 200}px, ${COLORS.accent}33 ${sweep}px, transparent ${sweep + 200}px)`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};
