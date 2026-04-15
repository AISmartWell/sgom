import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const PipelineTitle = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 18, stiffness: 120 } }),
    [0, 1], [60, 0]
  );
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const subtitleOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = interpolate(
    spring({ frame: frame - 10, fps, config: { damping: 20 } }),
    [0, 1], [40, 0]
  );

  const lineScale = interpolate(
    spring({ frame: frame - 20, fps, config: { damping: 25 } }),
    [0, 1], [0, 1]
  );

  const tagOp = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" });

  // Subtle breathing glow
  const glowOp = interpolate(frame, [0, 75], [0.3, 0.6]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Central glow */}
      <div style={{
        position: "absolute",
        width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, hsla(205,100%,55%,0.15), transparent 70%)",
        opacity: glowOp,
        filter: "blur(60px)",
      }} />

      {/* Tag */}
      <div style={{
        position: "absolute",
        top: 340,
        opacity: tagOp,
        fontSize: 18,
        fontFamily: "sans-serif",
        letterSpacing: 6,
        textTransform: "uppercase",
        color: "hsl(205,100%,65%)",
        fontWeight: 600,
      }}>
        AI Smart Well Platform
      </div>

      {/* Title */}
      <div style={{
        transform: `translateY(${titleY}px)`,
        opacity: titleOp,
        fontSize: 82,
        fontWeight: 800,
        fontFamily: "sans-serif",
        color: "white",
        textAlign: "center",
        lineHeight: 1.1,
        letterSpacing: -2,
      }}>
        Core Analysis
        <br />
        <span style={{ color: "hsl(205,100%,60%)" }}>Engine</span>
      </div>

      {/* Divider line */}
      <div style={{
        position: "absolute",
        top: 610,
        width: 120,
        height: 3,
        borderRadius: 2,
        background: "linear-gradient(90deg, hsl(205,100%,60%), hsl(170,80%,50%))",
        transform: `scaleX(${lineScale})`,
      }} />

      {/* Subtitle */}
      <div style={{
        position: "absolute",
        top: 640,
        transform: `translateY(${subtitleY}px)`,
        opacity: subtitleOp,
        fontSize: 26,
        fontFamily: "sans-serif",
        color: "hsla(220,20%,85%,0.7)",
        textAlign: "center",
        maxWidth: 800,
        lineHeight: 1.5,
      }}>
        End-to-end automated well screening
      </div>
    </AbsoluteFill>
  );
};
