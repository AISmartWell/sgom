import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
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
        {/* LEFT — real core sample photo with CV overlay */}
        <div
          style={{
            width: 720,
            height: 820,
            position: "relative",
            transform: `translateY(${drift * 0.4}px) scale(${coreScale})`,
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${COLORS.accentBorder}`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.6), inset 0 0 60px ${COLORS.accent}22`,
          }}
        >
          {/* Real core sample photograph */}
          <Img
            src={staticFile("images/core-sample.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(1.1) contrast(1.05)",
            }}
          />

          {/* Dark grade overlay for legibility */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, rgba(5,7,13,0.0) 60%, rgba(5,7,13,0.7) 100%)`,
            }}
          />

          {/* CV: concentric bedding ring detection (cylindrical core face) */}
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            viewBox="0 0 720 820"
          >
            {/* Detected bedding rings */}
            {[
              { r: 60, color: COLORS.accent, delay: 35 },
              { r: 120, color: COLORS.signal, delay: 45 },
              { r: 190, color: COLORS.warn, delay: 55 },
              { r: 270, color: COLORS.accent, delay: 65 },
            ].map((ring, i) => {
              const o = interpolate(frame, [ring.delay, ring.delay + 20], [0, 0.85], {
                extrapolateRight: "clamp",
              });
              const C = 2 * Math.PI * ring.r;
              const p = interpolate(frame, [ring.delay, ring.delay + 35], [0, 1], {
                extrapolateRight: "clamp",
              });
              return (
                <circle
                  key={i}
                  cx={360}
                  cy={410}
                  r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={2}
                  opacity={o}
                  strokeDasharray={C}
                  strokeDashoffset={C - p * C}
                  style={{ filter: `drop-shadow(0 0 6px ${ring.color})` }}
                />
              );
            })}

            {/* Pore detection markers (small circles) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const seed = i * 9301 + 49297;
              const angle = ((seed % 360) * Math.PI) / 180;
              const radius = 70 + ((seed * 7) % 200);
              const cx = 360 + Math.cos(angle) * radius;
              const cy = 410 + Math.sin(angle) * radius;
              const delay = 90 + i * 2;
              const s = spring({
                frame: frame - delay,
                fps,
                config: { damping: 14, stiffness: 220 },
                durationInFrames: 14,
              });
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={4 * s}
                  fill="none"
                  stroke={COLORS.warn}
                  strokeWidth={1.5}
                  opacity={s * 0.9}
                  style={{ filter: `drop-shadow(0 0 3px ${COLORS.warn})` }}
                />
              );
            })}

            {/* Center axis crosshair */}
            {(() => {
              const o = interpolate(frame, [25, 45], [0, 0.7], { extrapolateRight: "clamp" });
              return (
                <g opacity={o}>
                  <line x1={340} y1={410} x2={380} y2={410} stroke={COLORS.accent} strokeWidth={1.5} />
                  <line x1={360} y1={390} x2={360} y2={430} stroke={COLORS.accent} strokeWidth={1.5} />
                  <circle cx={360} cy={410} r={3} fill={COLORS.accent} />
                </g>
              );
            })()}

            {/* Bounding box around core */}
            {(() => {
              const o = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
              const dash = interpolate(frame, [20, 60], [800, 0], { extrapolateRight: "clamp" });
              return (
                <rect
                  x={70}
                  y={170}
                  width={580}
                  height={480}
                  fill="none"
                  stroke={COLORS.accent}
                  strokeWidth={2}
                  opacity={o}
                  strokeDasharray="800"
                  strokeDashoffset={dash}
                />
              );
            })()}
          </svg>

          {/* Scan line */}
          {(() => {
            const scanY = interpolate(frame % 90, [0, 90], [0, 820]);
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
                  mixBlendMode: "screen",
                }}
              />
            );
          })()}

          {/* HUD label */}
          {(() => {
            const o = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div
                style={{
                  position: "absolute",
                  top: 180,
                  left: 80,
                  padding: "4px 10px",
                  background: "rgba(5,7,13,0.85)",
                  border: `1px solid ${COLORS.accent}`,
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.accent,
                  letterSpacing: 2,
                  opacity: o,
                }}
              >
                CORE · 4,847 ft · OBJ_CONF 0.94
              </div>
            );
          })()}

          {/* HUD bottom telemetry */}
          {(() => {
            const o = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });
            const detectedPores = Math.min(
              Math.floor(interpolate(frame, [90, 150], [0, 24], { extrapolateRight: "clamp" })),
              24
            );
            return (
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  right: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.accent,
                  letterSpacing: 2,
                  opacity: o,
                }}
              >
                <span>● NVIDIA NIM · INFER 184 ms</span>
                <span style={{ color: COLORS.warn }}>PORES: {detectedPores}</span>
                <span style={{ color: COLORS.signal }}>RINGS: 4</span>
              </div>
            );
          })()}
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
