import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
  ReferenceLine, Legend,
} from "recharts";

const C = {
  panel:   "#0d1117",
  border:  "#1c2530",
  nvidia:  "#76b900",
  orange:  "#f28c00",
  blue:    "#38bdf8",
  red:     "#ef4444",
  teal:    "#2dd4bf",
  muted:   "#4a6070",
  text:    "#d4dde6",
  dimText: "#6b8899",
};

interface Props {
  upliftFactor: number;
  preBblDay: number;
  postBblDay: number;
  initialWaterCut: number; // %
  sptTop: number;
  sptBottom: number;
  permeability: number;
}

// ── Drainage area expansion: radial pre vs post ──
function DrainageRadial({ pre, post }: { pre: number; post: number }) {
  // Radii in ft (display-scaled)
  const SCALE = 1.6;
  const rPre = pre * SCALE;
  const rPost = post * SCALE;
  const W = 320, H = 220, cx = W / 2, cy = H / 2;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Post-SPT drainage */}
      <ellipse cx={cx} cy={cy} rx={rPost} ry={rPost * 0.55} fill={`${C.nvidia}18`} stroke={C.nvidia} strokeWidth={1.5} strokeDasharray="3 2" />
      {/* Pre-SPT drainage */}
      <ellipse cx={cx} cy={cy} rx={rPre} ry={rPre * 0.55} fill={`${C.muted}25`} stroke={C.muted} strokeWidth={1} />
      {/* Wellbore */}
      <line x1={cx} y1={20} x2={cx} y2={H - 20} stroke={C.text} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={3} fill={C.orange} />
      {/* Fractures (radiating slot perforations) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x2 = cx + Math.cos(a) * rPost * 0.92;
        const y2 = cy + Math.sin(a) * rPost * 0.55 * 0.92;
        return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={C.nvidia} strokeWidth={0.6} opacity={0.7} />;
      })}
      {/* Labels */}
      <text x={8} y={16} fill={C.muted} fontSize={9} fontFamily="monospace" letterSpacing="0.1em">
        DRAINAGE AREA · ft radius
      </text>
      <text x={cx + rPost + 6} y={cy + 4} fill={C.nvidia} fontSize={10} fontFamily="monospace" fontWeight={700}>
        {Math.round(post)} ft
      </text>
      <text x={cx + rPre + 4} y={cy - 8} fill={C.muted} fontSize={9} fontFamily="monospace">
        {Math.round(pre)} ft
      </text>
    </svg>
  );
}

const CosmosPredictExtras = ({
  upliftFactor, preBblDay, postBblDay, initialWaterCut, sptTop, sptBottom, permeability,
}: Props) => {

  // ── Drainage area: pre vs post (Darcy-radius proxy) ──
  // r_post ≈ r_pre × √(uplift), simplified
  const drainagePre = 80; // baseline ft
  const drainagePost = drainagePre * Math.sqrt(Math.max(1, upliftFactor));

  // ── Fracture propagation length (slot perforation tunnels) ──
  // Empirically ~ 12–25 ft from wellbore for SPT
  const fractureLength = Math.round(8 + Math.min(20, upliftFactor * 1.8));

  // ── Water cut evolution (365 days) ──
  // SPT typically *reduces* WC short-term (clean fluid drainage), then slow re-encroachment
  const waterCutData = useMemo(() => {
    const days = [0, 15, 30, 60, 90, 120, 180, 240, 300, 365];
    return days.map(d => {
      // Dip at ~30 days, recover to ~80% of original by 365d
      const dip = Math.exp(-Math.pow((d - 30) / 60, 2)) * (initialWaterCut * 0.35);
      const drift = (d / 365) * (initialWaterCut * 0.15);
      const wc = Math.max(5, initialWaterCut - dip + drift);
      return { day: d, wc: parseFloat(wc.toFixed(1)), baseline: initialWaterCut };
    });
  }, [initialWaterCut]);

  // ── Production uplift timeline (30/90/180/365) ──
  const timeline = useMemo(() => {
    // Ramp-up curve: peak at ~60d, slow decline after
    const ramp = (d: number) => {
      const peak = Math.min(1, d / 60);
      const decline = Math.exp(-0.0015 * Math.max(0, d - 60));
      return preBblDay + (postBblDay - preBblDay) * peak * decline;
    };
    return [30, 90, 180, 365].map(d => ({
      day: `${d}d`,
      rate: parseFloat(ramp(d).toFixed(1)),
      gain: parseFloat((ramp(d) - preBblDay).toFixed(1)),
    }));
  }, [preBblDay, postBblDay]);

  // ── Fracture propagation chart (radial extension over time) ──
  const fracPropagation = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const t = i; // hours
      const r = fractureLength * (1 - Math.exp(-t / 3));
      return { hour: t, radius: parseFloat(r.toFixed(2)) };
    });
  }, [fractureLength]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>

      {/* Fracture Propagation */}
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "16px 18px", gridColumn: "span 2",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}>
            FRACTURE PROPAGATION & DRAINAGE EXPANSION
          </div>
          <div style={{ fontSize: 9, color: C.dimText }}>
            zone {Math.round(sptTop)}–{Math.round(sptBottom)} ft · k = {permeability} mD
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
          {/* Drainage radial */}
          <div>
            <DrainageRadial pre={drainagePre} post={drainagePost} />
            <div style={{ display: "flex", gap: 14, fontSize: 9, color: C.muted, marginTop: 6, paddingLeft: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: `${C.muted}40`, border: `1px solid ${C.muted}` }} />
                Pre-SPT · {Math.round(drainagePre)} ft
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: `${C.nvidia}30`, border: `1px solid ${C.nvidia}` }} />
                Post-SPT · {Math.round(drainagePost)} ft
              </div>
            </div>
          </div>

          {/* Fracture length over time */}
          <div>
            <div style={{ fontSize: 9, color: C.dimText, marginBottom: 4, letterSpacing: "0.08em" }}>
              SLOT PERFORATION TUNNEL LENGTH · ft vs hours
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={fracPropagation} margin={{ top: 6, right: 8, bottom: 4, left: -10 }}>
                <XAxis dataKey="hour" stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} label={{ value: "hours", position: "insideBottom", offset: -2, fontSize: 9, fill: C.muted }} />
                <YAxis stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} domain={[0, fractureLength * 1.1]} />
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: `1px solid ${C.border}`, fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  formatter={(v: number) => [`${v} ft`, "tunnel"]}
                />
                <Line type="monotone" dataKey="radius" stroke={C.orange} strokeWidth={2} dot={false} />
                <ReferenceLine y={fractureLength} stroke={C.nvidia} strokeDasharray="3 3" label={{ value: `final ${fractureLength} ft`, fontSize: 9, fill: C.nvidia, position: "right" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Water Cut Evolution */}
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "16px 18px",
      }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 10 }}>
          WATER CUT EVOLUTION · 365 DAYS POST-SPT
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={waterCutData} margin={{ top: 6, right: 10, bottom: 4, left: -10 }}>
            <XAxis dataKey="day" stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} label={{ value: "days", position: "insideBottom", offset: -2, fontSize: 9, fill: C.muted }} />
            <YAxis stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} unit="%" domain={[0, Math.max(100, initialWaterCut + 10)]} />
            <Tooltip
              contentStyle={{ background: "#0d1117", border: `1px solid ${C.border}`, fontSize: 11, fontFamily: "IBM Plex Mono" }}
              formatter={(v: number, n: string) => [`${v}%`, n === "wc" ? "Predicted WC" : "Baseline"]}
            />
            <Line type="monotone" dataKey="baseline" stroke={C.muted} strokeWidth={1.2} strokeDasharray="4 3" dot={false} name="baseline" />
            <Line type="monotone" dataKey="wc" stroke={C.red} strokeWidth={2} dot={{ r: 2.5, fill: C.red }} name="wc" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 9, color: C.dimText, marginTop: 4, lineHeight: 1.5 }}>
          SPT clears near-wellbore damage → temporary WC dip ~30 d, then slow re-encroachment as drainage radius expands.
        </div>
      </div>

      {/* Production Uplift Timeline */}
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "16px 18px",
      }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 12 }}>
          PRODUCTION UPLIFT TIMELINE · 30 / 90 / 180 / 365 DAYS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {timeline.map(t => (
            <div key={t.day} style={{
              background: "#0a1205",
              border: `1px solid ${C.nvidia}30`,
              borderRadius: 5,
              padding: "10px 8px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>
                T+{t.day}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.nvidia, fontFamily: "monospace" }}>
                {t.rate}
              </div>
              <div style={{ fontSize: 8, color: C.dimText, marginTop: 2 }}>bbl/day</div>
              <div style={{
                fontSize: 9, color: C.orange, marginTop: 6, fontWeight: 600,
                borderTop: `1px solid ${C.border}`, paddingTop: 5,
              }}>
                +{t.gain} bbl/d
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: C.dimText, marginTop: 10, lineHeight: 1.5 }}>
          Cosmos temporal model treats depth as time axis — physics-aware ramp peaks at ~60 d, then natural decline.
        </div>
      </div>

    </div>
  );
};

export default CosmosPredictExtras;
