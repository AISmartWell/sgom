import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const stats = [
  { value: "15,000+", label: "Wells Analyzed", color: "hsl(205,100%,60%)" },
  { value: "94%", label: "AI Accuracy", color: "hsl(170,80%,50%)" },
  { value: "5-10×", label: "Production Boost", color: "hsl(45,90%,55%)" },
];

export const PipelineStats = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Label */}
      <div style={{
        position: "absolute",
        top: 280,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        fontSize: 20,
        fontFamily: "sans-serif",
        letterSpacing: 5,
        textTransform: "uppercase",
        color: "hsl(205,100%,65%)",
        fontWeight: 600,
      }}>
        Proven Results
      </div>

      <div style={{ display: "flex", gap: 80, marginTop: 20 }}>
        {stats.map((stat, i) => {
          const delay = i * 12;
          const s = spring({ frame: frame - delay - 5, fps, config: { damping: 14, stiffness: 100 } });
          const y = interpolate(s, [0, 1], [50, 0]);
          const op = interpolate(frame, [delay + 5, delay + 25], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

          // Counter animation for numbers
          const counterProgress = interpolate(frame, [delay + 10, delay + 40], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

          return (
            <div key={i} style={{
              opacity: op,
              transform: `translateY(${y}px)`,
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 86,
                fontWeight: 800,
                fontFamily: "sans-serif",
                color: stat.color,
                lineHeight: 1,
                marginBottom: 12,
                filter: `brightness(${0.8 + counterProgress * 0.2})`,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 20,
                fontFamily: "sans-serif",
                color: "hsla(220,20%,80%,0.6)",
                fontWeight: 500,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decorative line */}
      <div style={{
        position: "absolute",
        bottom: 280,
        width: interpolate(spring({ frame: frame - 30, fps, config: { damping: 25 } }), [0, 1], [0, 600]),
        height: 2,
        background: "linear-gradient(90deg, transparent, hsl(205,100%,60%,0.4), transparent)",
      }} />
    </AbsoluteFill>
  );
};
