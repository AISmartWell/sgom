import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

// SPT treatment injection — fluid penetrating damaged zone
export const Scene3Injection = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wellX = 960;

  // Injection fluid wave expanding outward
  const waveRadius = interpolate(frame, [10, 90], [15, 250], { extrapolateRight: "clamp" });
  const waveOpacity = interpolate(frame, [10, 40, 70, 90], [0, 0.7, 0.5, 0.2], { extrapolateRight: "clamp" });

  // Second wave
  const wave2Radius = interpolate(frame, [30, 100], [15, 200], { extrapolateRight: "clamp" });
  const wave2Opacity = interpolate(frame, [30, 55, 85, 100], [0, 0.5, 0.3, 0.1], { extrapolateRight: "clamp" });

  // Dissolution of damage
  const damageOpacity = interpolate(frame, [40, 80], [0.6, 0], { extrapolateRight: "clamp" });

  // Fluid particles flowing into pores
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const speed = 1.5 + (i % 4) * 0.5;
    const maxR = 100 + (i % 5) * 40;
    const startFrame = 15 + (i % 8) * 4;
    const r = interpolate(frame, [startFrame, startFrame + 50], [20, maxR], { extrapolateRight: "clamp" });
    const x = wellX + Math.cos(angle) * r;
    const y = 430 + Math.sin(angle) * r * 0.5;
    const op = interpolate(frame, [startFrame, startFrame + 10, startFrame + 45, startFrame + 50], [0, 0.8, 0.6, 0], { extrapolateRight: "clamp" });
    const size = 4 + (i % 3) * 2;
    return { x, y, op, size };
  });

  // Pressure gauge animation
  const pressure = interpolate(frame, [0, 60], [800, 2200], { extrapolateRight: "clamp" });
  const gaugeOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" });

  const progressWidth = interpolate(frame, [0, 90], [0, 300], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Rock layers (simplified) */}
      <div style={{ position: "absolute", left: 200, top: 100, width: 1520, height: 180, background: "#5C4033" }} />
      <div style={{ position: "absolute", left: 200, top: 280, width: 1520, height: 300, background: "#8B7355" }} />
      <div style={{ position: "absolute", left: 200, top: 580, width: 1520, height: 180, background: "#4A3728" }} />

      {/* Wellbore */}
      <div style={{
        position: "absolute", left: wellX - 12, top: 60, width: 24, height: 700,
        background: "linear-gradient(90deg, #333, #555, #333)",
        borderLeft: "2px solid #666", borderRight: "2px solid #666",
      }} />

      {/* Remaining damage zone (fading) */}
      <div style={{
        position: "absolute", left: wellX - 72, top: 280, width: 144, height: 300,
        background: "radial-gradient(ellipse, rgba(180,60,60,0.4), transparent 70%)",
        opacity: damageOpacity,
      }} />

      {/* Treatment wave 1 */}
      <div style={{
        position: "absolute",
        left: wellX - waveRadius, top: 430 - waveRadius * 0.5,
        width: waveRadius * 2, height: waveRadius,
        border: "2px solid rgba(74, 144, 217, 0.6)",
        borderRadius: "50%", opacity: waveOpacity,
        boxShadow: "0 0 20px rgba(74, 144, 217, 0.3)",
      }} />

      {/* Treatment wave 2 */}
      <div style={{
        position: "absolute",
        left: wellX - wave2Radius, top: 430 - wave2Radius * 0.5,
        width: wave2Radius * 2, height: wave2Radius,
        border: "1.5px solid rgba(100, 200, 255, 0.4)",
        borderRadius: "50%", opacity: wave2Opacity,
      }} />

      {/* Fluid particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.x - p.size / 2, top: p.y - p.size / 2,
          width: p.size, height: p.size, borderRadius: "50%",
          background: i % 2 === 0 ? "#4A90D9" : "#64C8FF",
          opacity: p.op,
          boxShadow: `0 0 ${p.size * 2}px rgba(74, 144, 217, 0.5)`,
        }} />
      ))}

      {/* Injection label */}
      <div style={{
        position: "absolute", left: wellX - 80, top: 200,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <svg width="20" height="60">
          <line x1="10" y1="0" x2="10" y2="50" stroke="#4A90D9" strokeWidth="3" />
          <polygon points="4,45 16,45 10,58" fill="#4A90D9" />
        </svg>
        <span style={{ color: "#4A90D9", fontSize: 12, fontFamily: "sans-serif", marginTop: 4 }}>
          SPT-раствор
        </span>
      </div>

      {/* Pressure gauge */}
      <div style={{
        position: "absolute", right: 100, top: 100, opacity: gaugeOpacity,
        background: "rgba(0,0,0,0.5)", borderRadius: 12, padding: "20px 30px",
        border: "1px solid rgba(74, 144, 217, 0.3)",
      }}>
        <div style={{ color: "rgba(232,224,216,0.5)", fontSize: 14, fontFamily: "sans-serif", marginBottom: 8 }}>
          Давление закачки
        </div>
        <div style={{ color: "#4A90D9", fontSize: 36, fontFamily: "sans-serif", fontWeight: 700 }}>
          {Math.round(pressure)} PSI
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: "absolute", left: 240, bottom: 120,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <span style={{ color: "rgba(232,224,216,0.6)", fontSize: 16, fontFamily: "sans-serif" }}>
          Проникновение раствора в пласт
        </span>
        <div style={{ width: 300, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
          <div style={{
            width: progressWidth, height: 6, borderRadius: 3,
            background: "linear-gradient(90deg, #4A90D9, #64C8FF)",
          }} />
        </div>
      </div>

      {/* Title */}
      <div style={{
        position: "absolute", left: 240, top: 30,
        fontSize: 28, fontWeight: 600, color: "#E8E0D8", fontFamily: "sans-serif",
      }}>
        SPT-обработка — закачка раствора
      </div>
    </AbsoluteFill>
  );
};
