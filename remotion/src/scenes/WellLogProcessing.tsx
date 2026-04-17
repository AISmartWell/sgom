import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { BG, ACCENT, AMBER, FONT_DISPLAY, FONT_MONO, STEPS, TRACKS, WELL_DATA } from "./WellLogShared";

const FILE_NAME = "well_brawner_10-15.las";

export const WellLogProcessing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const progress = Math.min(100, Math.round(interpolate(frame, [0, durationInFrames - 10], [0, 100], { extrapolateRight: "clamp" })));
  const stepIdx = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));

  // Streaming data lines (advance every 4 frames)
  const streamCount = 16;
  const streamStart = Math.max(0, Math.floor(frame / 4) - streamCount);
  const streamRows = [];
  for (let i = 0; i < streamCount; i++) {
    const idx = (streamStart + i) % WELL_DATA.length;
    streamRows.push(WELL_DATA[idx]);
  }

  const scanY = (frame % 80) / 80;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, #0a1628 0%, ${BG} 70%)`, fontFamily: FONT_DISPLAY, color: "#dbe7ff", padding: "60px 80px", boxSizing: "border-box" }}>
      <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 30}px)` }}>
        <div style={{ color: ACCENT, fontSize: 26, letterSpacing: 8, fontWeight: 700, textAlign: "center" }}>
          AI SMART WELL · NEURAL ANALYSIS ENGINE
        </div>
        <div style={{ marginTop: 14, textAlign: "center", color: "#7fa3cf", fontSize: 18, fontFamily: FONT_MONO, letterSpacing: 2 }}>
          FILE ▸ <span style={{ color: AMBER }}>{FILE_NAME}</span>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 42, marginLeft: "auto", marginRight: "auto", width: 1500, height: 14, background: "#0a1424", border: `1px solid #1c3556`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${ACCENT}, ${AMBER})`, boxShadow: `0 0 24px ${ACCENT}88` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: 1500, marginLeft: "auto", marginRight: "auto", marginTop: 14, fontFamily: FONT_MONO, fontSize: 16 }}>
          <span style={{ color: "#cfdcef" }}>{STEPS[stepIdx]}</span>
          <span style={{ color: AMBER, fontWeight: 700 }}>{progress}%</span>
        </div>

        {/* Scanner panel */}
        <div style={{ marginTop: 36, marginLeft: "auto", marginRight: "auto", width: 1500, background: "#050b18", border: `1px solid #14253f`, borderRadius: 8, position: "relative", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "180px repeat(5, 1fr)", padding: "16px 24px", background: "#0a1424", borderBottom: `1px solid #14253f`, fontFamily: FONT_MONO, fontSize: 15, letterSpacing: 2, color: "#5d7796" }}>
            <div>DEPTH</div>
            {TRACKS.map((t) => (
              <div key={t.key} style={{ color: t.color }}>{t.label}</div>
            ))}
          </div>

          {/* Stream rows */}
          <div style={{ position: "relative", height: 480 }}>
            {streamRows.map((row, i) => {
              const highlight = i === streamRows.length - 1;
              const rowOpacity = interpolate(i, [0, streamRows.length - 1], [0.25, 1]);
              return (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "180px repeat(5, 1fr)",
                  padding: "8px 24px",
                  fontFamily: FONT_MONO,
                  fontSize: 16,
                  color: highlight ? "#ffffff" : "#7fa3cf",
                  background: highlight ? `${ACCENT}22` : "transparent",
                  opacity: rowOpacity,
                  borderBottom: "1px solid #0c1a2e",
                }}>
                  <div style={{ color: highlight ? AMBER : "#a8c0e0" }}>{row.depth} m</div>
                  <div>{row.gr.toFixed(1)}</div>
                  <div>{row.sp.toFixed(1)}</div>
                  <div>{row.res.toFixed(1)}</div>
                  <div>{row.nphi.toFixed(3)}</div>
                  <div>{row.rhob.toFixed(3)}</div>
                </div>
              );
            })}

            {/* Scanline */}
            <div style={{ position: "absolute", left: 0, right: 0, top: `${scanY * 100}%`, height: 2, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, boxShadow: `0 0 18px ${ACCENT}` }} />
          </div>

          {/* Bottom status */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px", background: "#0a1424", borderTop: `1px solid #14253f`, fontFamily: FONT_MONO, fontSize: 14, color: "#5d7796", letterSpacing: 1 }}>
            <span>DEPTH RANGE: 1000–2500 m</span>
            <span style={{ color: AMBER }}>{Math.floor((progress / 100) * 125)} / 125 POINTS</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
