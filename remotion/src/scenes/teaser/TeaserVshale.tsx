import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CinematicShot } from "./CinematicShot";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";

// SCENE 5 — VSHALE / SCHLUMBERGER WORKFLOW (6 sec).
export const TeaserVshale: React.FC = () => {
  const frame = useCurrentFrame();

  const stageO = interpolate(frame, [8, 24], [0, 1], { extrapolateRight: "clamp" });
  const stageY = interpolate(frame, [8, 24], [16, 0], { extrapolateRight: "clamp" });

  const headO = interpolate(frame, [20, 42], [0, 1], { extrapolateRight: "clamp" });
  const headY = interpolate(frame, [20, 42], [40, 0], { extrapolateRight: "clamp" });
  const headBlur = interpolate(frame, [20, 50], [14, 0], { extrapolateRight: "clamp" });

  const formulaO = interpolate(frame, [60, 82], [0, 1], { extrapolateRight: "clamp" });
  const formulaY = interpolate(frame, [60, 82], [20, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <CinematicShot
        src="shots/03-vshale.png"
        fromScale={1.05}
        toScale={1.18}
        fromY={-30}
        toY={30}
        edge={COLORS.accent}
      />
      <AbsoluteFill style={{ padding: 120, alignItems: "flex-start", justifyContent: "flex-start" }}>
        <div style={{ maxWidth: 1100 }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 18,
              letterSpacing: 6,
              color: COLORS.accent,
              textTransform: "uppercase",
              opacity: stageO,
              transform: `translateY(${stageY}px)`,
              marginBottom: 18,
            }}
          >
            Schlumberger Petrophysical Workflow
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              color: COLORS.text,
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              opacity: headO,
              transform: `translateY(${headY}px)`,
              filter: `blur(${headBlur}px)`,
            }}
          >
            Linear vs Larionov.<br />
            <span style={{ color: COLORS.accent }}>Old rocks, corrected.</span>
          </div>
          <div
            style={{
              marginTop: 36,
              padding: "24px 32px",
              border: `1px solid ${COLORS.accentBorder}`,
              borderRadius: 8,
              background: "rgba(5,7,13,0.7)",
              display: "inline-block",
              fontFamily: FONT_MONO,
              fontSize: 28,
              color: COLORS.text,
              opacity: formulaO,
              transform: `translateY(${formulaY}px)`,
            }}
          >
            <span style={{ color: COLORS.mute }}>Vsh</span>
            <span style={{ color: COLORS.accent }}> = 0.33 × (2</span>
            <sup style={{ color: COLORS.accent }}>2·IGR</sup>
            <span style={{ color: COLORS.accent }}> − 1)</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
