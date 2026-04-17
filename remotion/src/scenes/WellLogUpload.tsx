import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { BG, ACCENT, AMBER, FONT_DISPLAY, FONT_MONO } from "./WellLogShared";

export const WellLogUpload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const dropIn = spring({ frame: frame - 14, fps, config: { damping: 16, stiffness: 110 } });
  const cursorX = interpolate(frame, [60, 105], [1100, 760], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(frame, [60, 105], [820, 540], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorOpacity = interpolate(frame, [50, 60, 110, 120], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dropPulse = 0.5 + 0.5 * Math.sin(frame / 6);
  const dragHighlight = frame >= 100 ? 1 : 0;

  const corners = [
    { top: 14, left: 14, borderTop: `3px solid ${AMBER}`, borderLeft: `3px solid ${AMBER}` },
    { top: 14, right: 14, borderTop: `3px solid ${AMBER}`, borderRight: `3px solid ${AMBER}` },
    { bottom: 14, left: 14, borderBottom: `3px solid ${AMBER}`, borderLeft: `3px solid ${AMBER}` },
    { bottom: 14, right: 14, borderBottom: `3px solid ${AMBER}`, borderRight: `3px solid ${AMBER}` },
  ] as const;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, #0a1628 0%, ${BG} 70%)`, fontFamily: FONT_DISPLAY, color: "#dbe7ff" }}>
      {/* Subtle grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#0e1b30 1px, transparent 1px), linear-gradient(90deg, #0e1b30 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.35 }} />

      {/* Brand */}
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center", transform: `translateY(${(1 - titleY) * -40}px)`, opacity: titleY }}>
        <div style={{ color: ACCENT, fontSize: 22, letterSpacing: 8, fontWeight: 700, marginBottom: 18 }}>◆ AI SMART WELL · NEURAL ANALYTICS ◆</div>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: 4, color: "#ffffff" }}>Well Log Analyzer</div>
        <div style={{ color: "#5d7796", fontSize: 20, letterSpacing: 6, marginTop: 16 }}>SELF-LEARNING GEOLOGICAL OBJECT MODEL</div>
      </div>

      {/* Drop zone */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 470,
          transform: `translateX(-50%) scale(${0.85 + dropIn * 0.15})`,
          opacity: dropIn,
          width: 760,
          padding: "70px 50px",
          borderRadius: 12,
          border: `2px dashed ${dragHighlight ? AMBER : `rgba(245,158,11,${0.25 + dropPulse * 0.3})`}`,
          background: dragHighlight ? "#0d1a30" : "#060d1c",
          boxShadow: dragHighlight ? `0 0 80px ${AMBER}33, inset 0 0 60px ${AMBER}11` : "none",
          textAlign: "center",
        }}
      >
        {corners.map((c, i) => (
          <div key={i} style={{ position: "absolute", width: 28, height: 28, ...c }} />
        ))}

        {/* Upload icon */}
        <div style={{ marginBottom: 30 }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.4" style={{ display: "inline-block" }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: 2, color: "#ffffff", marginBottom: 14 }}>
          Drop Well Log File
        </div>
        <div style={{ fontSize: 18, color: "#6f8ab0", marginBottom: 28, letterSpacing: 1 }}>
          — drag &amp; drop or browse —
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {["LAS 2.0", "LAS 3.0", "CSV", "DLIS", "WITSML"].map((f) => (
            <span key={f} style={{ padding: "6px 16px", border: `1px solid #1f3a5e`, color: "#7fa3cf", fontFamily: FONT_MONO, fontSize: 14, borderRadius: 4, letterSpacing: 1 }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Feature pills */}
      <div style={{ position: "absolute", bottom: 130, left: 0, right: 0, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }) }}>
        {[
          { label: "GR · Gamma Ray", color: "#4ade80" },
          { label: "SP · Self-Potential", color: "#60a5fa" },
          { label: "RT · Resistivity", color: "#fb923c" },
          { label: "NPHI · Neutron Porosity", color: "#22d3ee" },
          { label: "RHOB · Bulk Density", color: "#e879f9" },
        ].map((f) => (
          <div key={f.label} style={{ padding: "10px 18px", borderLeft: `3px solid ${f.color}`, background: "#0a1424", color: "#cfdcef", fontSize: 16, letterSpacing: 1 }}>
            ◈ {f.label}
          </div>
        ))}
      </div>

      {/* NVIDIA Inception badge */}
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", color: "#76b900", fontSize: 14, letterSpacing: 4, fontFamily: FONT_MONO }}>
        NVIDIA INCEPTION PROGRAM MEMBER
      </div>

      {/* Animated cursor */}
      <div
        style={{
          position: "absolute",
          left: cursorX,
          top: cursorY,
          width: 28,
          height: 28,
          opacity: cursorOpacity,
          pointerEvents: "none",
        }}
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#ffffff" stroke="#000" strokeWidth="1">
          <path d="M3 2 L3 18 L7 14 L10 21 L13 19.5 L10 12.5 L16 12.5 Z" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
