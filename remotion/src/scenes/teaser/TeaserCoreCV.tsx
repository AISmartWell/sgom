import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";

// SCENE — CORE COMPUTER VISION (NVIDIA NIM Nemotron Nano 12B v2 VL).
// Three CV modes: Segmentation, Fractures, Mineralogy.
export const TeaserCoreCV: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const stageO = interpolate(frame, [6, 22], [0, 1], { extrapolateRight: "clamp" });
  const stageY = interpolate(frame, [6, 22], [16, 0], { extrapolateRight: "clamp" });

  const headO = interpolate(frame, [16, 38], [0, 1], { extrapolateRight: "clamp" });
  const headY = interpolate(frame, [16, 38], [40, 0], { extrapolateRight: "clamp" });
  const headBlur = interpolate(frame, [16, 46], [14, 0], { extrapolateRight: "clamp" });

  // Subtle camera drift on the core column
  const drift = interpolate(frame, [0, durationInFrames], [0, -40]);
  const coreScale = interpolate(frame, [0, durationInFrames], [1.02, 1.08]);

  // Three CV modes — staggered cards
  const modes = [
    {
      label: "Segmentation",
      stat: "7 zones",
      sub: "rock_type · porosity",
      color: COLORS.accent,
      delay: 50,
    },
    {
      label: "Fractures",
      stat: "12 detected",
      sub: "aperture 0.4 mm · NE-SW",
      color: COLORS.warn,
      delay: 70,
    },
    {
      label: "Mineralogy",
      stat: "Quartz 62%",
      sub: "Feldspar 18 · Clay 12",
      color: COLORS.signal,
      delay: 90,
    },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep }}>
      {/* Soft radial glow background */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${COLORS.accent}1A 0%, transparent 55%)`,
        }}
      />

      <AbsoluteFill style={{ padding: 100, flexDirection: "row", gap: 80, alignItems: "center" }}>
        {/* LEFT — synthetic core column */}
        <div
          style={{
            width: 380,
            height: 820,
            position: "relative",
            transform: `translateY(${drift}px) scale(${coreScale})`,
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${COLORS.accentBorder}`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.6), inset 0 0 60px ${COLORS.accent}22`,
          }}
        >
          {/* Stratified rock layers */}
          {Array.from({ length: 24 }).map((_, i) => {
            const hue = i % 3 === 0 ? "#8b6f47" : i % 3 === 1 ? "#a88a5c" : "#5d4a32";
            const h = 30 + ((i * 13) % 20);
            return (
              <div
                key={i}
                style={{
                  height: h,
                  background: `linear-gradient(180deg, ${hue} 0%, ${hue}cc 100%)`,
                  borderBottom: "1px solid rgba(0,0,0,0.4)",
                }}
              />
            );
          })}

          {/* Segmentation overlay zones */}
          {[
            { top: 90, h: 80, color: COLORS.accent },
            { top: 280, h: 120, color: COLORS.signal },
            { top: 480, h: 90, color: COLORS.warn },
            { top: 650, h: 70, color: COLORS.accent },
          ].map((z, i) => {
            const o = interpolate(frame, [40 + i * 6, 65 + i * 6], [0, 0.55], {
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: z.top,
                  height: z.h,
                  background: z.color,
                  opacity: o,
                  mixBlendMode: "screen",
                  borderTop: `2px solid ${z.color}`,
                  borderBottom: `2px solid ${z.color}`,
                }}
              />
            );
          })}

          {/* Fracture lines (animated stroke) */}
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            viewBox="0 0 380 820"
          >
            {[
              "M 40 120 L 340 180",
              "M 60 320 L 320 360",
              "M 80 500 L 300 560",
              "M 50 680 L 330 740",
            ].map((d, i) => {
              const start = 70 + i * 8;
              const p = interpolate(frame, [start, start + 28], [0, 1], {
                extrapolateRight: "clamp",
              });
              return (
                <path
                  key={i}
                  d={d}
                  stroke={COLORS.warn}
                  strokeWidth={2.5}
                  fill="none"
                  strokeDasharray={400}
                  strokeDashoffset={400 - p * 400}
                  style={{ filter: `drop-shadow(0 0 4px ${COLORS.warn})` }}
                />
              );
            })}
          </svg>

          {/* Scan line */}
          {(() => {
            const scanY = interpolate(
              frame % 90,
              [0, 90],
              [0, 820]
            );
            return (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: scanY,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)`,
                  boxShadow: `0 0 12px ${COLORS.accent}`,
                }}
              />
            );
          })()}

          {/* Depth ticks */}
          <div
            style={{
              position: "absolute",
              right: 8,
              top: 12,
              bottom: 12,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: "rgba(255,255,255,0.7)",
              textShadow: "0 0 4px rgba(0,0,0,0.9)",
            }}
          >
            <span>4,820 ft</span>
            <span>4,840 ft</span>
            <span>4,860 ft</span>
            <span>4,880 ft</span>
          </div>
        </div>

        {/* RIGHT — text + CV mode cards */}
        <div style={{ flex: 1, maxWidth: 1100 }}>
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
            Stage 3 · Core Computer Vision
          </div>

          <div
            style={{
              fontFamily: FONT_DISPLAY,
              color: COLORS.text,
              fontSize: 86,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              opacity: headO,
              transform: `translateY(${headY}px)`,
              filter: `blur(${headBlur}px)`,
              marginBottom: 14,
            }}
          >
            NVIDIA Nemotron<br />
            <span style={{ color: COLORS.accent }}>sees what geologists miss.</span>
          </div>

          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 20,
              color: COLORS.mute,
              opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" }),
              marginBottom: 40,
            }}
          >
            nvidia/nemotron-nano-12b-v2-vl · 3 vision modes
          </div>

          {/* Mode cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {modes.map((m, i) => {
              const s = spring({
                frame: frame - m.delay,
                fps,
                config: { damping: 18, stiffness: 140 },
                durationInFrames: 30,
              });
              const x = interpolate(s, [0, 1], [60, 0]);
              const o = interpolate(frame, [m.delay, m.delay + 18], [0, 1], {
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={m.label}
                  style={{
                    transform: `translateX(${x}px)`,
                    opacity: o,
                    padding: "20px 26px",
                    border: `1px solid ${m.color}55`,
                    borderLeft: `4px solid ${m.color}`,
                    borderRadius: 8,
                    background: "rgba(5,7,13,0.75)",
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 13,
                      color: m.color,
                      letterSpacing: 3,
                      textTransform: "uppercase",
                      width: 180,
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 36,
                      fontWeight: 800,
                      color: COLORS.text,
                      width: 240,
                    }}
                  >
                    {m.stat}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 16,
                      color: COLORS.mute,
                      flex: 1,
                    }}
                  >
                    {m.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
