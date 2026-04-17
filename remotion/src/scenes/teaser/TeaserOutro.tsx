import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";
import { StageBackdrop } from "./StageBackdrop";

// SCENE 8 — OUTRO (5 sec). Final logo lock-up + URL.
export const TeaserOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markSpring = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const markO = markSpring;
  const markScale = interpolate(markSpring, [0, 1], [0.7, 1]);

  const titleO = interpolate(frame, [12, 32], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [12, 32], [30, 0], { extrapolateRight: "clamp" });

  const taglineO = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

  const urlO = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });
  const urlW = interpolate(frame, [60, 110], [0, 480], { extrapolateRight: "clamp" });

  // Slow pulse on the mark
  const pulse = 1 + 0.04 * Math.sin((frame / 30) * Math.PI * 2);

  return (
    <AbsoluteFill>
      <StageBackdrop tint={COLORS.accent} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: FONT_DISPLAY, color: COLORS.text }}>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 32,
              background: `linear-gradient(135deg, ${COLORS.accent}, #0a4d80)`,
              boxShadow: `0 0 100px ${COLORS.accent}77`,
              margin: "0 auto 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 70,
              fontWeight: 900,
              opacity: markO,
              transform: `scale(${markScale * pulse})`,
            }}
          >
            ▲
          </div>
          <div
            style={{
              fontSize: 116,
              fontWeight: 900,
              letterSpacing: -3,
              opacity: titleO,
              transform: `translateY(${titleY}px)`,
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
              marginTop: 24,
              opacity: taglineO,
              textTransform: "uppercase",
            }}
          >
            Geological intelligence · at machine speed
          </div>
          <div
            style={{
              marginTop: 56,
              opacity: urlO,
              fontFamily: FONT_MONO,
              fontSize: 26,
              color: COLORS.text,
              letterSpacing: 2,
            }}
          >
            aismartwellsgom.com
          </div>
          <div
            style={{
              height: 2,
              width: urlW,
              maxWidth: 480,
              background: COLORS.accent,
              margin: "20px auto 0",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
