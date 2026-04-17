import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CinematicShot } from "./CinematicShot";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";

// SCENE 2 — PROBLEM (6 sec). Dashboard screenshot, slow zoom.
// Stats counter overlay: 15,000+ stripper wells.
export const TeaserProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Counter for 15,000+
  const counterT = interpolate(frame, [30, 110], [0, 15000], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelO = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const lineO = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });
  const sub1O = interpolate(frame, [90, 115], [0, 1], { extrapolateRight: "clamp" });
  const sub2O = interpolate(frame, [110, 135], [0, 1], { extrapolateRight: "clamp" });

  const cardSpring = spring({ frame: frame - 18, fps, config: { damping: 18, stiffness: 90 } });
  const cardX = interpolate(cardSpring, [0, 1], [-80, 0]);

  return (
    <AbsoluteFill>
      <CinematicShot src="shots/01-dashboard.png" fromScale={1.22} toScale={1.06} edge={COLORS.danger} />
      <AbsoluteFill style={{ padding: 100, alignItems: "flex-start", justifyContent: "flex-end" }}>
        <div
          style={{
            background: `linear-gradient(135deg, rgba(5,7,13,0.85), rgba(5,7,13,0.55))`,
            border: `1px solid ${COLORS.accentBorder}`,
            padding: "40px 56px",
            borderRadius: 8,
            transform: `translateX(${cardX}px)`,
            backdropFilter: "none",
            maxWidth: 1100,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 18,
              letterSpacing: 6,
              color: COLORS.accent,
              textTransform: "uppercase",
              opacity: labelO,
              marginBottom: 18,
            }}
          >
            The Hidden Problem
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              color: COLORS.text,
              fontSize: 110,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            <span style={{ color: COLORS.danger }}>{Math.round(counterT).toLocaleString()}+</span>
          </div>
          <div
            style={{
              height: 2,
              width: 220,
              background: COLORS.danger,
              opacity: lineO,
              margin: "20px 0 22px",
            }}
          />
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              color: COLORS.text,
              fontSize: 38,
              fontWeight: 600,
              opacity: sub1O,
              marginBottom: 8,
            }}
          >
            stripper wells in Oklahoma & Texas
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              color: COLORS.mute,
              fontSize: 26,
              opacity: sub2O,
            }}
          >
            producing under 25 bbl/day · ignored by majors · waiting for AI
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
