import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const MODULES = [
  { stage: "1", title: "Field Scanning", emoji: "🛰️", color: "#60a5fa" },
  { stage: "2", title: "Data Classification", emoji: "📂", color: "#a78bfa" },
  { stage: "3", title: "Core Analysis", emoji: "🔬", color: "#f472b6" },
  { stage: "4", title: "Cumulative Analysis", emoji: "📈", color: "#fb923c" },
  { stage: "5", title: "Seismic Reinterpretation", emoji: "🌊", color: "#22d3ee" },
  { stage: "6", title: "SPT Projection", emoji: "🚀", color: "#4ade80" },
  { stage: "7", title: "Economic Analysis", emoji: "💵", color: "#fbbf24" },
  { stage: "8", title: "Geophysical Expertise", emoji: "📊", color: "#1A9FFF", highlight: true },
  { stage: "9", title: "EOR Optimization", emoji: "🧠", color: "#e879f9" },
];

export const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 25], [-20, 0], { extrapolateRight: "clamp" });

  // Cursor: travels from center to the Geophysical Expertise card (Stage 8 = index 7)
  // Grid: 3 cols x 3 rows. Index 7 = col 1, row 2 (0-indexed)
  const cursorProgress = spring({ frame: frame - 60, fps, config: { damping: 18, stiffness: 90 } });
  const cursorX = interpolate(cursorProgress, [0, 1], [960, 760]);
  const cursorY = interpolate(cursorProgress, [0, 1], [540, 720]);

  // Click pulse on highlighted card around frame 110
  const clickPulse = interpolate(frame, [105, 120, 135], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Card highlight glow
  const highlightGlow = interpolate(frame, [95, 115], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#040912", fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Subtle grid background */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(26,159,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,159,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top bar / sidebar mock */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "#060d1c", borderRight: "1px solid #162840", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24, gap: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, #1A9FFF, #0066cc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>AI</div>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ width: 44, height: 44, borderRadius: 8, background: "#0c1830", opacity: 0.6 }} />
        ))}
      </div>

      {/* Header */}
      <div style={{ position: "absolute", left: 120, top: 40, opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
        <div style={{ color: "#1A9FFF", fontSize: 14, letterSpacing: 4, fontFamily: "'Share Tech Mono', monospace", marginBottom: 6 }}>
          ◆ AI SMART WELL · DASHBOARD
        </div>
        <div style={{ color: "#fff", fontSize: 42, fontWeight: 700 }}>
          Welcome back, Edward 👋
        </div>
        <div style={{ color: "#7a8fa8", fontSize: 18, marginTop: 4 }}>
          AI Smart Well — Maxxwell Production · 9-stage analysis pipeline
        </div>
      </div>

      {/* Module grid */}
      <div style={{ position: "absolute", left: 120, top: 220, right: 60, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {MODULES.map((m, i) => {
          const cardDelay = 25 + i * 5;
          const cardSpring = spring({ frame: frame - cardDelay, fps, config: { damping: 20, stiffness: 120 } });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardY = interpolate(cardSpring, [0, 1], [30, 0]);
          const isHighlight = m.highlight;
          const glow = isHighlight ? highlightGlow : 0;

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px) scale(${1 + clickPulse * 0.03 * (isHighlight ? 1 : 0)})`,
                background: isHighlight ? `linear-gradient(135deg, rgba(26,159,255,${0.15 + glow*0.15}), rgba(6,13,28,0.9))` : "#060d1c",
                border: isHighlight ? `2px solid rgba(26,159,255,${0.5 + glow * 0.5})` : "1px solid #162840",
                borderRadius: 14,
                padding: "22px 24px",
                boxShadow: isHighlight ? `0 0 ${30 + glow * 50}px rgba(26,159,255,${0.2 + glow * 0.4})` : "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 32 }}>{m.emoji}</div>
                <div style={{ background: m.color, color: "#040912", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 4, letterSpacing: 1 }}>
                  STAGE {m.stage}
                </div>
              </div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{m.title}</div>
              <div style={{ color: "#7a8fa8", fontSize: 13 }}>
                {isHighlight ? "Well log analysis & formation evaluation" : "Module ready"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Animated cursor */}
      {frame >= 55 && (
        <div style={{ position: "absolute", left: cursorX, top: cursorY, pointerEvents: "none", zIndex: 100 }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <path d="M3 3 L3 22 L9 17 L13 25 L17 23 L13 15 L21 15 Z" fill="#fff" stroke="#040912" strokeWidth="1.5" />
          </svg>
          {clickPulse > 0 && (
            <div style={{ position: "absolute", left: -20, top: -20, width: 60, height: 60, borderRadius: "50%", border: `2px solid rgba(26,159,255,${1 - clickPulse})`, transform: `scale(${1 + clickPulse * 1.5})` }} />
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
