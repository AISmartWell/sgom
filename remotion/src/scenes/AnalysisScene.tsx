import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const STEPS = [
  "Loading well metadata · Brawner 10-15…",
  "Parsing LAS 2.0 curves · GR, SP, RT, NPHI, RHOB…",
  "Running petrophysical neural model…",
  "Computing Vshale, porosity & saturation…",
  "Identifying pay zones & confidence intervals…",
];

export const AnalysisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const progress = Math.min(100, Math.round(interpolate(frame, [10, durationInFrames - 5], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const stepIdx = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));

  // Streaming data rows
  const rows = [];
  for (let i = 0; i < 14; i++) {
    const rowFrame = frame - 20 - i * 6;
    if (rowFrame < 0) continue;
    const opacity = interpolate(rowFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
    const depth = 1000 + (i + Math.floor(frame / 4)) * 12;
    rows.push({
      depth,
      gr: (60 + ((depth * 7) % 80)).toFixed(1),
      sp: (-100 + ((depth * 3) % 90)).toFixed(1),
      res: (Math.exp(2 + ((depth * 11) % 100) / 50)).toFixed(1),
      nphi: (0.05 + ((depth * 13) % 35) / 100).toFixed(3),
      rhob: (2.0 + ((depth * 17) % 60) / 100).toFixed(3),
      opacity,
    });
  }

  // Scanline
  const scanY = interpolate(frame % 60, [0, 60], [0, 100]);

  return (
    <AbsoluteFill style={{ background: "#040912", fontFamily: "'Rajdhani', sans-serif", padding: 60 }}>
      {/* Header */}
      <div style={{ opacity: headerOpacity }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ background: "#1A9FFF", color: "#040912", fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 4, letterSpacing: 2 }}>STAGE 8</div>
          <div style={{ color: "#1A9FFF", fontSize: 14, letterSpacing: 3, fontFamily: "'Share Tech Mono', monospace" }}>GEOPHYSICAL EXPERTISE</div>
        </div>
        <div style={{ color: "#fff", fontSize: 40, fontWeight: 700 }}>Analyzing well · Brawner 10-15</div>
        <div style={{ color: "#7a8fa8", fontSize: 16, marginTop: 4, fontFamily: "'Share Tech Mono', monospace" }}>
          API 42-467-30979 · Hunton Group · Oklahoma, USA
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginTop: 32, opacity: headerOpacity }}>
        <div style={{ height: 8, background: "#0c1830", borderRadius: 4, overflow: "hidden", border: "1px solid #162840" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #1A9FFF, #4ade80)", boxShadow: "0 0 20px #1A9FFF" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: "'Share Tech Mono', monospace" }}>
          <div style={{ color: "#1A9FFF", fontSize: 15 }}>▸ {STEPS[stepIdx]}</div>
          <div style={{ color: "#fff", fontSize: 15 }}>{progress}%</div>
        </div>
      </div>

      {/* Data stream panel */}
      <div style={{ marginTop: 28, flex: 1, background: "#060d1c", border: "1px solid #162840", borderRadius: 10, padding: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px repeat(5, 1fr)", gap: 16, paddingBottom: 12, borderBottom: "1px solid #162840", fontFamily: "'Share Tech Mono', monospace", color: "#1A9FFF", fontSize: 14, letterSpacing: 2 }}>
          <div>DEPTH</div><div>GR</div><div>SP</div><div>RT</div><div>NPHI</div><div>RHOB</div>
        </div>
        <div style={{ marginTop: 12, fontFamily: "'Share Tech Mono', monospace", fontSize: 14 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px repeat(5, 1fr)", gap: 16, padding: "6px 0", color: i === rows.length - 1 ? "#4ade80" : "#9fb3cc", opacity: r.opacity }}>
              <div>{r.depth} ft</div>
              <div>{r.gr}</div>
              <div>{r.sp}</div>
              <div>{r.res}</div>
              <div>{r.nphi}</div>
              <div>{r.rhob}</div>
            </div>
          ))}
        </div>

        {/* Scanline */}
        <div style={{ position: "absolute", left: 0, right: 0, top: `${scanY}%`, height: 2, background: "linear-gradient(90deg, transparent, #1A9FFF, transparent)", boxShadow: "0 0 12px #1A9FFF", opacity: 0.7 }} />

        {/* Bottom status */}
        <div style={{ position: "absolute", bottom: 16, left: 24, right: 24, display: "flex", justifyContent: "space-between", fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#7a8fa8", letterSpacing: 1 }}>
          <div>DEPTH RANGE: 1000–2500 ft</div>
          <div>{Math.floor(progress * 1.25)} / 125 POINTS</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
