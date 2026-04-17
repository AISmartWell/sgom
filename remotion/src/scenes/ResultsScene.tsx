import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { generateData } from "./WellLogShared";

const TRACKS = [
  { key: "gr",   label: "GR",   unit: "API",  color: "#4ade80", domain: [0, 150]     as [number, number] },
  { key: "sp",   label: "SP",   unit: "mV",   color: "#60a5fa", domain: [-140, 20]   as [number, number] },
  { key: "res",  label: "RT",   unit: "Ω·m",  color: "#fb923c", domain: [0.5, 300]   as [number, number], log: true },
  { key: "nphi", label: "NPHI", unit: "v/v",  color: "#22d3ee", domain: [0.45, 0]    as [number, number] },
  { key: "rhob", label: "RHOB", unit: "g/cc", color: "#e879f9", domain: [2.95, 1.75] as [number, number] },
];

const DATA = generateData();

const TW = 200;
const CH = 620;

const scale = (v: number, d: [number, number], log = false) => {
  if (log) {
    const lv = Math.log10(Math.max(0.1, v));
    const l0 = Math.log10(d[0]);
    const l1 = Math.log10(d[1]);
    return ((lv - l0) / (l1 - l0)) * TW;
  }
  return ((v - d[0]) / (d[1] - d[0])) * TW;
};

const PAY_ZONES = [
  { from: 1180, to: 1310, color: "#4ade80", label: "PAY 1", net: "130 ft" },
  { from: 1620, to: 1760, color: "#facc15", label: "PAY 2", net: "140 ft" },
  { from: 2080, to: 2240, color: "#fb923c", label: "PAY 3", net: "160 ft" },
];

// Frame at which pay zones start appearing (after all 5 tracks have drawn)
const PAY_ZONE_START = 95;

export const ResultsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const headerY = interpolate(headerSpring, [0, 1], [-30, 0]);
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);

  const minDepth = DATA[0].depth;
  const maxDepth = DATA[DATA.length - 1].depth;
  const depthScale = (d: number) => ((d - minDepth) / (maxDepth - minDepth)) * CH;

  return (
    <AbsoluteFill style={{ background: "#040912", fontFamily: "'Rajdhani', sans-serif", padding: 50 }}>
      {/* Header */}
      <div style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)`, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "#1A9FFF", color: "#040912", fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 4, letterSpacing: 2 }}>STAGE 8</div>
          <div style={{ color: "#fff", fontSize: 30, fontWeight: 700 }}>Brawner 10-15 · Well Log Results</div>
          <div style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 4, border: "1px solid #4ade80", letterSpacing: 1 }}>✓ ANALYSIS COMPLETE</div>
        </div>
        <div style={{ color: "#7a8fa8", fontSize: 14, fontFamily: "'Share Tech Mono', monospace" }}>1000–2500 ft · 125 pts · 5 curves</div>
      </div>

      {/* Tracks */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
        {/* Depth axis */}
        <div style={{ width: 70 }}>
          <div style={{ height: 70, color: "#1A9FFF", fontFamily: "'Share Tech Mono', monospace", fontSize: 13, letterSpacing: 2, textAlign: "center", borderBottom: "1px solid #162840" }}>DEPTH (ft)</div>
          <div style={{ position: "relative", height: CH, marginTop: 8 }}>
            {[1000, 1300, 1600, 1900, 2200, 2500].map(d => (
              <div key={d} style={{ position: "absolute", top: depthScale(d) - 8, right: 4, color: "#7a8fa8", fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }}>{d}</div>
            ))}
            {/* Pay zone labels on depth axis */}
            {PAY_ZONES.map((pz, i) => {
              const local = frame - (PAY_ZONE_START + i * 12);
              const sp = spring({ frame: local, fps, config: { damping: 18, stiffness: 140 } });
              const op = interpolate(sp, [0, 1], [0, 1]);
              const tx = interpolate(sp, [0, 1], [-20, 0]);
              const yTop = depthScale(pz.from);
              const yBot = depthScale(pz.to);
              return (
                <div key={i} style={{ position: "absolute", top: yTop, height: yBot - yTop, left: -38, width: 32, opacity: op, transform: `translateX(${tx}px)`, background: pz.color, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 12px ${pz.color}` }}>
                  <div style={{ color: "#040912", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, fontWeight: 800, transform: "rotate(-90deg)", whiteSpace: "nowrap", letterSpacing: 1 }}>{pz.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {TRACKS.map((cfg, ti) => {
          const trackDelay = 10 + ti * 8;
          const drawProgress = spring({ frame: frame - trackDelay, fps, config: { damping: 28, stiffness: 60 } });

          // Build path
          let path = "";
          DATA.forEach((row, idx) => {
            const v = row[cfg.key as keyof typeof row] as number;
            const x = scale(v, cfg.domain, cfg.log);
            const y = depthScale(row.depth);
            path += (idx === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
          });

          // Stroke dash for reveal
          const totalLen = DATA.length * 5;
          const dashOffset = totalLen * (1 - drawProgress);

          const trackOpacity = interpolate(frame - trackDelay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div key={cfg.key} style={{ width: TW, opacity: trackOpacity }}>
              {/* Header */}
              <div style={{ height: 70, borderBottom: `2px solid ${cfg.color}`, paddingBottom: 6 }}>
                <div style={{ color: cfg.color, fontFamily: "'Share Tech Mono', monospace", fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>{cfg.label}</div>
                <div style={{ color: "#7a8fa8", fontFamily: "'Share Tech Mono', monospace", fontSize: 11 }}>{cfg.unit}</div>
                <div style={{ color: "#9fb3cc", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, marginTop: 2 }}>
                  {cfg.domain[0]} ▸ {cfg.domain[1]}
                </div>
              </div>
              {/* Chart */}
              <svg width={TW} height={CH} style={{ marginTop: 8, background: "#060d1c", border: "1px solid #162840" }}>
                {/* Grid */}
                {[0.25, 0.5, 0.75].map(g => (
                  <line key={g} x1={TW * g} y1={0} x2={TW * g} y2={CH} stroke="#162840" strokeWidth={1} />
                ))}
                {[0.2, 0.4, 0.6, 0.8].map(g => (
                  <line key={g} x1={0} y1={CH * g} x2={TW} y2={CH * g} stroke="#162840" strokeWidth={1} />
                ))}
                <path d={path} fill="none" stroke={cfg.color} strokeWidth={1.8} strokeDasharray={totalLen} strokeDashoffset={dashOffset} style={{ filter: `drop-shadow(0 0 3px ${cfg.color})` }} />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
        {[
          { l: "WELL", v: "BRAWNER 10-15" },
          { l: "FORMATION", v: "HUNTON GROUP" },
          { l: "FIELD", v: "OKLAHOMA, USA" },
          { l: "PAY ZONES", v: "3 IDENTIFIED", c: "#4ade80" },
          { l: "SHALE VOLUME", v: "38% AVG" },
          { l: "AI CONFIDENCE", v: "94.2%", c: "#1A9FFF" },
        ].map((s, i) => {
          const delay = 80 + i * 4;
          const sp = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120 } });
          return (
            <div key={i} style={{ opacity: sp, transform: `translateY(${interpolate(sp, [0, 1], [10, 0])}px)`, background: "#060d1c", border: "1px solid #162840", borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ color: "#7a8fa8", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: 2 }}>{s.l}</div>
              <div style={{ color: s.c || "#fff", fontFamily: "'Share Tech Mono', monospace", fontSize: 15, fontWeight: 700, marginTop: 4 }}>{s.v}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
