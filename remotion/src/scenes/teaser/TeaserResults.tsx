import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";
import { CinematicShot } from "./CinematicShot";

// SCENE 7 — RESULTS (7 sec). Hero stats: 5–10× inflow, 7–8 mo payback, 312% ROI.
export const TeaserResults: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kickerO = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const headO = interpolate(frame, [10, 36], [0, 1], { extrapolateRight: "clamp" });
  const headY = interpolate(frame, [10, 36], [30, 0], { extrapolateRight: "clamp" });
  const headBlur = interpolate(frame, [10, 40], [14, 0], { extrapolateRight: "clamp" });

  const stat = (delay: number) => {
    const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 110 } });
    return { o: s, y: interpolate(s, [0, 1], [80, 0]), scale: interpolate(s, [0, 1], [0.92, 1]) };
  };
  const s1 = stat(50);
  const s2 = stat(70);
  const s3 = stat(90);

  // Animated numeric counters
  const inflow = interpolate(frame, [55, 130], [1, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const payback = Math.round(
    interpolate(frame, [75, 150], [24, 7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );
  const roi = Math.round(
    interpolate(frame, [95, 170], [0, 312], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );

  return (
    <AbsoluteFill>
      <CinematicShot src="shots/07-brawner-netpay.png" fromScale={1.08} toScale={1.18} edge={COLORS.signal} />
      <AbsoluteFill style={{ padding: 100, alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1700, textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 22,
              letterSpacing: 8,
              color: COLORS.signal,
              opacity: kickerO,
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            ▍ The Outcome
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              color: COLORS.text,
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
              opacity: headO,
              transform: `translateY(${headY}px)`,
              filter: `blur(${headBlur}px)`,
              marginBottom: 80,
            }}
          >
            Forgotten wells. <span style={{ color: COLORS.signal }}>Reborn.</span>
          </div>
          <div style={{ display: "flex", gap: 36, justifyContent: "center" }}>
            {[
              { val: `${inflow.toFixed(1)}×`, label: "Inflow increase", color: COLORS.accent, anim: s1 },
              { val: `${payback} mo`, label: "Payback period", color: COLORS.warn, anim: s2 },
              { val: `${roi}%`, label: "Average ROI", color: COLORS.signal, anim: s3 },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  maxWidth: 480,
                  padding: "48px 32px",
                  border: `1px solid ${COLORS.accentBorder}`,
                  borderRadius: 12,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.0))",
                  opacity: s.anim.o,
                  transform: `translateY(${s.anim.y}px) scale(${s.anim.scale})`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    color: s.color,
                    fontSize: 132,
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: -4,
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 20,
                    letterSpacing: 4,
                    color: COLORS.mute,
                    textTransform: "uppercase",
                    marginTop: 18,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 60,
              fontFamily: FONT_MONO,
              fontSize: 18,
              letterSpacing: 4,
              color: COLORS.mute,
              opacity: interpolate(frame, [150, 180], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            Powered by SPT · US Patent 8,863,823
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
