import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";

// SCENE — PLATFORM SHOWCASE (7 sec). Real screenshots of the AI Smart Well platform:
// Lithology, V-shale, Net Pay tracks from the Brawner well (Geological Expertise / Stage 8).
const SHOTS = [
  {
    src: "shots/05-brawner-litho.png",
    stage: "Stage 3",
    title: "Lithology",
    sub: "GR · DEN · NPHI",
    color: COLORS.warn,
  },
  {
    src: "shots/06-brawner-vshale.png",
    stage: "Stage 8",
    title: "V-shale · Larionov",
    sub: "Clay volume estimate",
    color: COLORS.accent,
  },
  {
    src: "shots/07-brawner-netpay.png",
    stage: "Stage 8",
    title: "Net Pay",
    sub: "Pay zones · cutoffs",
    color: COLORS.signal,
  },
];

export const TeaserPlatformShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stageO = interpolate(frame, [6, 24], [0, 1], { extrapolateRight: "clamp" });
  const headO = interpolate(frame, [10, 32], [0, 1], { extrapolateRight: "clamp" });
  const headY = interpolate(frame, [10, 36], [30, 0], { extrapolateRight: "clamp" });
  const headBlur = interpolate(frame, [10, 40], [12, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep }}>
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(26,159,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(26,159,255,0.05) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.6,
        }}
      />

      <AbsoluteFill style={{ padding: "70px 80px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 18,
              letterSpacing: 6,
              color: COLORS.accent,
              textTransform: "uppercase",
              opacity: stageO,
              marginBottom: 14,
            }}
          >
            ▍ AI Smart Well · Live Platform
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              color: COLORS.text,
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              opacity: headO,
              transform: `translateY(${headY}px)`,
              filter: `blur(${headBlur}px)`,
            }}
          >
            Geological Expertise. <span style={{ color: COLORS.accent }}>Real wells.</span>
          </div>
        </div>

        {/* Three real screenshots */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }}>
          {SHOTS.map((s, i) => {
            const delay = 40 + i * 14;
            const sp = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 110 } });
            const o = sp;
            const y = interpolate(sp, [0, 1], [60, 0]);
            const scale = interpolate(sp, [0, 1], [0.94, 1]);
            return (
              <div
                key={i}
                style={{
                  opacity: o,
                  transform: `translateY(${y}px) scale(${scale})`,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: `1px solid ${s.color}55`,
                  background: "rgba(5,7,13,0.85)",
                  boxShadow: `0 25px 60px rgba(0,0,0,0.55), 0 0 0 1px ${s.color}22 inset`,
                }}
              >
                {/* Window chrome */}
                <div
                  style={{
                    height: 28,
                    background: "rgba(15,20,32,0.95)",
                    borderBottom: `1px solid ${s.color}33`,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    gap: 6,
                  }}
                >
                  {["#ff5f57", "#febc2e", "#28c840"].map((c, k) => (
                    <div key={k} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
                  ))}
                  <div
                    style={{
                      marginLeft: 14,
                      fontFamily: FONT_MONO,
                      fontSize: 11,
                      letterSpacing: 2,
                      color: COLORS.mute,
                      textTransform: "uppercase",
                    }}
                  >
                    aismartwell.com / brawner-10-15
                  </div>
                </div>
                {/* Screenshot */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#000" }}>
                  <Img
                    src={staticFile(s.src)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center top",
                      filter: "saturate(1.05) contrast(1.05)",
                    }}
                  />
                  {/* Bottom gradient for label legibility */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 140,
                      background: "linear-gradient(180deg, transparent, rgba(5,7,13,0.95))",
                    }}
                  />
                  <div style={{ position: "absolute", left: 18, right: 18, bottom: 16 }}>
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 12,
                        letterSpacing: 4,
                        color: s.color,
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      {s.stage}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 30,
                        fontWeight: 800,
                        color: COLORS.text,
                        letterSpacing: -1,
                        lineHeight: 1,
                      }}
                    >
                      {s.title}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        color: COLORS.mute,
                        marginTop: 6,
                        letterSpacing: 1,
                      }}
                    >
                      {s.sub}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer caption */}
        <div
          style={{
            marginTop: 28,
            fontFamily: FONT_MONO,
            fontSize: 16,
            letterSpacing: 4,
            color: COLORS.mute,
            textAlign: "center",
            opacity: interpolate(frame, [110, 140], [0, 1], { extrapolateRight: "clamp" }),
            textTransform: "uppercase",
          }}
        >
          9-stage pipeline · Field Scan → Data → Core → Cumulative → Seismic → SPT → Economics → Geophysics → EOR
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
