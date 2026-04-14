import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Scene1Title = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 15, stiffness: 80 } }),
    [0, 1], [60, 0]
  );
  const titleOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });

  const subtitleOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = interpolate(
    spring({ frame: frame - 15, fps, config: { damping: 20 } }),
    [0, 1], [40, 0]
  );

  const lineWidth = interpolate(frame, [10, 50], [0, 400], { extrapolateRight: "clamp" });

  // Floating particles
  const particles = Array.from({ length: 12 }, (_, i) => {
    const x = 200 + (i * 140) % 1600;
    const baseY = 300 + (i * 97) % 500;
    const y = baseY + Math.sin((frame + i * 20) * 0.03) * 15;
    const size = 3 + (i % 3) * 2;
    const opacity = 0.15 + Math.sin((frame + i * 30) * 0.04) * 0.1;
    return { x, y, size, opacity };
  });

  const badgeOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Floating oil/water particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.x, top: p.y,
          width: p.size, height: p.size,
          borderRadius: "50%",
          background: i % 3 === 0 ? "#D4A574" : i % 3 === 1 ? "#4A90D9" : "#7CB342",
          opacity: p.opacity,
        }} />
      ))}

      <div style={{ textAlign: "center", position: "relative" }}>
        {/* Badge */}
        <div style={{
          opacity: badgeOpacity,
          marginBottom: 24,
          display: "flex", justifyContent: "center",
        }}>
          <div style={{
            background: "rgba(212, 165, 116, 0.15)",
            border: "1px solid rgba(212, 165, 116, 0.3)",
            borderRadius: 20, padding: "6px 20px",
            fontSize: 14, color: "#D4A574",
            fontFamily: "sans-serif", letterSpacing: 3,
            textTransform: "uppercase",
          }}>
            Physics-Aware Simulation
          </div>
        </div>

        {/* Title */}
        <div style={{
          transform: `translateY(${titleY}px)`, opacity: titleOpacity,
          fontSize: 72, fontWeight: 700, color: "#E8E0D8",
          fontFamily: "sans-serif", lineHeight: 1.1,
          maxWidth: 1200,
        }}>
          Поведение флюидов
          <br />
          <span style={{ color: "#D4A574" }}>в пласте</span>
        </div>

        {/* Divider line */}
        <div style={{
          margin: "30px auto",
          width: lineWidth, height: 2,
          background: "linear-gradient(90deg, transparent, #D4A574, transparent)",
        }} />

        {/* Subtitle */}
        <div style={{
          transform: `translateY(${subtitleY}px)`, opacity: subtitleOpacity,
          fontSize: 28, color: "rgba(232, 224, 216, 0.6)",
          fontFamily: "sans-serif", fontWeight: 300,
        }}>
          Восстановление скважины методом SPT-обработки
        </div>
      </div>
    </AbsoluteFill>
  );
};
