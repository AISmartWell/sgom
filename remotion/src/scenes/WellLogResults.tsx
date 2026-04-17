import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { BG, ACCENT, AMBER, FONT_DISPLAY, FONT_MONO, TRACKS, WELL_DATA, TrackCfg } from "./WellLogShared";

const TRACK_W = 220;
const CHART_H = 720;
const FILE_NAME = "well_brawner_10-15.las";

const Track: React.FC<{ cfg: TrackCfg; revealFrame: number; showDepth: boolean }> = ({ cfg, revealFrame, showDepth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ frame: frame - revealFrame, fps, config: { damping: 22, stiffness: 100 } });
  const drawProgress = interpolate(frame - revealFrame, [0, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const depths = WELL_DATA.map((d) => d.depth);
  const minD = Math.min(...depths);
  const maxD = Math.max(...depths);

  const [d0, d1] = cfg.domain;
  const reversed = d0 > d1;
  const valToX = (v: number) => {
    const frac = reversed ? (d0 - v) / (d0 - d1) : (v - d0) / (d1 - d0);
    return Math.max(0, Math.min(1, frac)) * TRACK_W;
  };
  const depthToY = (d: number) => ((d - minD) / (maxD - minD)) * CHART_H;

  const points = WELL_DATA.map((d) => {
    const value = d[cfg.key];
    return `${valToX(value)},${depthToY(d.depth)}`;
  }).join(" ");

  // For log curve, scale resistivity logarithmically
  const points2 = cfg.key === "res"
    ? WELL_DATA.map((d) => {
        const v = d.res;
        const lv = Math.log10(Math.max(0.5, v));
        const lmin = Math.log10(d0);
        const lmax = Math.log10(d1);
        const x = ((lv - lmin) / (lmax - lmin)) * TRACK_W;
        return `${Math.max(0, Math.min(TRACK_W, x))},${depthToY(d.depth)}`;
      }).join(" ")
    : points;

  return (
    <div style={{ width: showDepth ? TRACK_W + 70 : TRACK_W, opacity: reveal, transform: `translateY(${(1 - reveal) * 20}px)` }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid #1c3556`, paddingBottom: 8, marginBottom: 6, marginLeft: showDepth ? 70 : 0 }}>
        <div style={{ color: cfg.color, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>
          {cfg.label}
        </div>
        <div style={{ color: "#6f8ab0", fontFamily: FONT_MONO, fontSize: 12, letterSpacing: 1 }}>{cfg.unit}</div>
        <div style={{ color: "#3d5778", fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1 }}>
          {cfg.domain[0]} ▸ {cfg.domain[1]}
        </div>
      </div>

      {/* Chart */}
      <svg width={showDepth ? TRACK_W + 70 : TRACK_W} height={CHART_H} style={{ background: "#050b18", border: `1px solid #14253f` }}>
        {/* Grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={(showDepth ? 70 : 0) + f * TRACK_W} y1={0} x2={(showDepth ? 70 : 0) + f * TRACK_W} y2={CHART_H} stroke="#0e1b30" />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i} x1={showDepth ? 70 : 0} y1={(i / 10) * CHART_H} x2={(showDepth ? 70 : 0) + TRACK_W} y2={(i / 10) * CHART_H} stroke="#0e1b30" />
        ))}

        {/* Depth axis */}
        {showDepth && Array.from({ length: 11 }, (_, i) => {
          const d = minD + (i / 10) * (maxD - minD);
          return (
            <text key={i} x={64} y={(i / 10) * CHART_H + 4} textAnchor="end" fill="#5d7796" fontSize="11" fontFamily="monospace">
              {Math.round(d)}
            </text>
          );
        })}

        {/* Curve with stroke-dasharray reveal */}
        <g transform={`translate(${showDepth ? 70 : 0}, 0)`}>
          <polyline
            points={points2}
            fill="none"
            stroke={cfg.color}
            strokeWidth="1.6"
            strokeDasharray="4000"
            strokeDashoffset={4000 * (1 - drawProgress)}
            style={{ filter: `drop-shadow(0 0 4px ${cfg.color}88)` }}
          />
        </g>
      </svg>
    </div>
  );
};

export const WellLogResults: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerIn = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const footerIn = spring({ frame: frame - 80, fps, config: { damping: 18, stiffness: 80 } });

  const stats = [
    { l: "WELL", v: "BRAWNER 10-15" },
    { l: "FORMATION", v: "HUNTON GROUP" },
    { l: "FIELD", v: "OKLAHOMA, USA" },
    { l: "PAY ZONES", v: "3 IDENTIFIED", c: "#4ade80" },
    { l: "SHALE VOLUME", v: "38% AVG" },
    { l: "AI CONFIDENCE", v: "94.2%", c: AMBER },
  ];

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, #0a1628 0%, ${BG} 70%)`, fontFamily: FONT_DISPLAY, color: "#dbe7ff", padding: "40px 60px", boxSizing: "border-box" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: headerIn, transform: `translateY(${(1 - headerIn) * -20}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: FONT_MONO, letterSpacing: 2 }}>
          <span style={{ color: ACCENT, fontWeight: 700, fontSize: 22 }}>AI SMART WELL</span>
          <span style={{ color: "#3d5778" }}>│</span>
          <span style={{ color: "#a8c0e0", fontSize: 18 }}>{FILE_NAME}</span>
          <span style={{ marginLeft: 12, padding: "4px 12px", border: `1px solid #4ade80`, color: "#4ade80", fontSize: 14, borderRadius: 4 }}>✓ PROCESSED</span>
        </div>
        <div style={{ fontFamily: FONT_MONO, color: "#7fa3cf", fontSize: 16, letterSpacing: 2 }}>
          1000–2500 m · 125 pts · 5 curves
        </div>
      </div>

      {/* Tracks */}
      <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 18 }}>
        {TRACKS.map((cfg, i) => (
          <Track key={cfg.key} cfg={cfg} revealFrame={20 + i * 14} showDepth={i === 0} />
        ))}
      </div>

      {/* Footer stats */}
      <div style={{ position: "absolute", bottom: 32, left: 60, right: 60, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, opacity: footerIn, transform: `translateY(${(1 - footerIn) * 20}px)` }}>
        {stats.map((s) => (
          <div key={s.l} style={{ background: "#0a1424", border: `1px solid #14253f`, borderLeft: `3px solid ${s.c || ACCENT}`, padding: "12px 16px" }}>
            <div style={{ fontFamily: FONT_MONO, color: "#5d7796", fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>{s.l}</div>
            <div style={{ color: s.c || "#ffffff", fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>{s.v}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
