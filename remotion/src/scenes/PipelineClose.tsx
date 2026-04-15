import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const PipelineClose = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const logoOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const textOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const textY = interpolate(
    spring({ frame: frame - 12, fps, config: { damping: 20 } }),
    [0, 1], [30, 0]
  );

  const tagOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

  // Glow ring
  const ringScale = interpolate(frame, [0, 75], [0.8, 1.2]);
  const ringOp = interpolate(frame, [0, 30, 75], [0, 0.3, 0.15], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Glow ring */}
      <div style={{
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: "50%",
        border: "2px solid hsl(205,100%,60%)",
        opacity: ringOp,
        transform: `scale(${ringScale})`,
        filter: "blur(8px)",
      }} />

      {/* Logo icon */}
      <div style={{
        opacity: logoOp,
        transform: `scale(${logoScale})`,
        fontSize: 72,
        marginBottom: 30,
      }}>
        💧
      </div>

      {/* Company name */}
      <div style={{
        opacity: textOp,
        transform: `translateY(${textY}px)`,
        fontSize: 52,
        fontWeight: 800,
        fontFamily: "sans-serif",
        color: "white",
        letterSpacing: -1,
      }}>
        AI Smart Well
      </div>

      {/* Tagline */}
      <div style={{
        opacity: tagOp,
        fontSize: 22,
        fontFamily: "sans-serif",
        color: "hsla(220,20%,80%,0.5)",
        marginTop: 16,
        letterSpacing: 3,
        textTransform: "uppercase",
        fontWeight: 500,
      }}>
        Innovative Solutions for Oil Production
      </div>
    </AbsoluteFill>
  );
};
