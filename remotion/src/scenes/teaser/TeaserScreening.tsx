import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CinematicShot } from "./CinematicShot";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";

// SCENE 6 — WELL SCREENING (7 sec). Real OK map. Three big counters.
export const TeaserScreening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stageO = interpolate(frame, [10, 28], [0, 1], { extrapolateRight: "clamp" });

  // Three counters animate sequentially
  const c1 = Math.round(interpolate(frame, [30, 80], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const c2 = Math.round(interpolate(frame, [70, 130], [0, 284], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const c3 = Math.round(interpolate(frame, [110, 170], [0, 87], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  const card = (delay: number) => {
    const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 110 } });
    return { o: s, y: interpolate(s, [0, 1], [60, 0]) };
  };
  const a = card(28);
  const b = card(48);
  const c = card(68);

  const headO = interpolate(frame, [10, 32], [0, 1], { extrapolateRight: "clamp" });
  const headY = interpolate(frame, [10, 36], [40, 0], { extrapolateRight: "clamp" });
  const headBlur = interpolate(frame, [10, 40], [16, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <CinematicShot src="shots/04-oklahoma-pilot.png" fromScale={1.1} toScale={1.22} edge={COLORS.signal} />
      <AbsoluteFill style={{ padding: 80, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 18,
              letterSpacing: 6,
              color: COLORS.accent,
              textTransform: "uppercase",
              opacity: stageO,
              marginBottom: 18,
            }}
          >
            Stage 6 · AI Well Selection
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
            Oklahoma. Scanned.
          </div>
        </div>
        <div style={{ display: "flex", gap: 32, width: "100%", justifyContent: "center" }}>
          {[
            { v: c1.toLocaleString(), label: "Wells screened", color: COLORS.text, anim: a },
            { v: c2.toLocaleString(), label: "SPT candidates", color: COLORS.warn, anim: b },
            { v: c3.toLocaleString(), label: "Excellent rated", color: COLORS.signal, anim: c },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                flex: "0 0 auto",
                minWidth: 360,
                background: "linear-gradient(135deg, rgba(5,7,13,0.92), rgba(5,7,13,0.7))",
                border: `1px solid ${COLORS.accentBorder}`,
                borderRadius: 12,
                padding: "32px 40px",
                opacity: s.anim.o,
                transform: `translateY(${s.anim.y}px)`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: s.color,
                  fontSize: 96,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: -2,
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 18,
                  letterSpacing: 4,
                  color: COLORS.mute,
                  textTransform: "uppercase",
                  marginTop: 14,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
