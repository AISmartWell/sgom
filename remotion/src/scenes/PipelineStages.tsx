import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const stages = [
  { num: 1, icon: "🛰️", title: "Field Scanning", color: "hsl(205,100%,60%)" },
  { num: 2, icon: "📂", title: "Data Classification", color: "hsl(195,90%,55%)" },
  { num: 3, icon: "📈", title: "Cumulative Analysis", color: "hsl(170,80%,50%)" },
  { num: 4, icon: "🚀", title: "SPT Projection", color: "hsl(150,70%,50%)" },
  { num: 5, icon: "💵", title: "Economic Analysis", color: "hsl(45,90%,55%)" },
  { num: 6, icon: "📊", title: "Geophysical", color: "hsl(30,85%,55%)" },
  { num: 7, icon: "🔬", title: "Core Analysis", color: "hsl(280,70%,60%)" },
  { num: 8, icon: "🧠", title: "EOR Optimization", color: "hsl(340,80%,55%)" },
];

export const PipelineStages = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 }}>
      {/* Header */}
      <div style={{
        position: "absolute",
        top: 100,
        opacity: headerOp,
        fontSize: 20,
        fontFamily: "sans-serif",
        letterSpacing: 5,
        textTransform: "uppercase",
        color: "hsl(205,100%,65%)",
        fontWeight: 600,
      }}>
        8-Stage AI Pipeline
      </div>

      {/* Grid of stages */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 28,
        width: "100%",
        maxWidth: 1500,
        marginTop: 40,
      }}>
        {stages.map((stage, i) => {
          const delay = i * 8;
          const s = spring({ frame: frame - delay - 5, fps, config: { damping: 15, stiffness: 150 } });
          const scale = interpolate(s, [0, 1], [0.7, 1]);
          const op = interpolate(frame, [delay + 5, delay + 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

          // Connector pulse
          const pulseOp = interpolate(
            frame,
            [delay + 20, delay + 35, delay + 50],
            [0, 0.8, 0.3],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );

          return (
            <div key={i} style={{
              opacity: op,
              transform: `scale(${scale})`,
              background: `linear-gradient(135deg, hsla(220,20%,12%,0.9), hsla(220,25%,16%,0.9))`,
              border: `1px solid ${stage.color}33`,
              borderRadius: 18,
              padding: "32px 24px",
              textAlign: "center",
              position: "relative",
              boxShadow: `0 0 ${30 * pulseOp}px ${stage.color}22`,
            }}>
              {/* Stage number badge */}
              <div style={{
                position: "absolute",
                top: -12,
                left: "50%",
                transform: "translateX(-50%)",
                background: stage.color,
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "sans-serif",
                padding: "3px 14px",
                borderRadius: 20,
                letterSpacing: 1,
              }}>
                STAGE {stage.num}
              </div>
              <div style={{ fontSize: 44, marginBottom: 10, marginTop: 8 }}>{stage.icon}</div>
              <div style={{
                fontSize: 19,
                fontWeight: 700,
                fontFamily: "sans-serif",
                color: "white",
                lineHeight: 1.3,
              }}>
                {stage.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flow arrows between rows */}
      <div style={{
        position: "absolute",
        bottom: 120,
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}>
        {[0,1,2,3,4,5,6].map(i => {
          const arrowOp = interpolate(frame, [40 + i*6, 50 + i*6], [0, 0.5], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <div key={i} style={{
              opacity: arrowOp,
              fontSize: 18,
              color: "hsl(205,100%,60%)",
              fontFamily: "sans-serif",
            }}>
              →
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
