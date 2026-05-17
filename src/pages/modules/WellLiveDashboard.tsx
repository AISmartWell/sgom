import { useState, useEffect, useRef, useMemo } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// Deterministic PRNG (mulberry32) — project rule: no Math.random in demos
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_RATE = 105;
const DECLINE_B = 0.00015;

const WELLS = [
  { id: "W-001", name: "Brawner 10-15", field: "Oklahoma Basin", depth: 6840 },
  { id: "W-002", name: "Bysener 10-15", field: "Oklahoma Basin", depth: 7120 },
  { id: "W-003", name: "Martinez 4-7", field: "Permian Basin", depth: 8450 },
];

type Point = {
  oil: number;
  water: number;
  gas: number;
  pressure: number;
};

function generatePoint(t: number, wellIndex: number, rand: () => number, anomaly = false): Point {
  const baseDecline = BASE_RATE * Math.pow(1 + 0.5 * DECLINE_B * t, -1 / 0.5);
  const noise = (rand() - 0.5) * 3.2;
  const wellOffset = wellIndex * 8;
  const oil = Math.max(0, baseDecline + wellOffset + noise + (anomaly ? -22 : 0));
  const water = oil * (0.28 + rand() * 0.04);
  const gas = oil * (1.8 + rand() * 0.2);
  const pressure = 1820 - t * 0.08 + (rand() - 0.5) * 12 + (anomaly ? -60 : 0);
  return {
    oil: +oil.toFixed(1),
    water: +water.toFixed(1),
    gas: +gas.toFixed(1),
    pressure: +pressure.toFixed(0),
  };
}

function fmt(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#c8d8f0" }}>
      <p style={{ color: "#4a9eff", marginBottom: 6, fontFamily: "monospace" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
};

const KPI = ({ label, value, unit, delta, color, icon }: any) => (
  <div style={{ background: "linear-gradient(135deg,#0d1f3c,#091628)", border: `1px solid ${color}30`, borderRadius: 12, padding: "14px 16px", position: "relative", overflow: "hidden", flex: 1, minWidth: 140 }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 70, height: 70, background: `radial-gradient(circle,${color}18 0%,transparent 70%)` }} />
    <div style={{ fontSize: 10, color: "#4a7aa0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "monospace" }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "monospace", lineHeight: 1 }}>
      {value}
      <span style={{ fontSize: 11, color: "#4a7aa0", marginLeft: 4 }}>{unit}</span>
    </div>
    {delta !== undefined && (
      <div style={{ marginTop: 5, fontSize: 10, color: delta >= 0 ? "#22c55e" : "#ef4444", fontFamily: "monospace" }}>
        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs AI forecast
      </div>
    )}
  </div>
);

type Sample = Point & { time: string; forecast: number; wor?: number };

export default function WellLiveDashboard() {
  const [well, setWell] = useState(0);
  const [history, setHistory] = useState<Sample[]>([]);
  const [live, setLive] = useState<Sample | null>(null);
  const [alerts, setAlerts] = useState<{ time: string; hi: boolean; msg: string }[]>([]);
  const [paused, setPaused] = useState(false);
  const [anomaly, setAnomaly] = useState(false);
  const [tab, setTab] = useState<"production" | "pressure" | "wor">("production");
  const [iv, setIv] = useState(2);
  const tick = useRef(0);
  const rand = useRef(mulberry32(1));

  useEffect(() => {
    tick.current = 0;
    rand.current = mulberry32((well + 1) * 7919);
    const seed: Sample[] = [];
    for (let i = 60; i >= 0; i--) {
      const d = generatePoint(Math.max(0, -i), well, rand.current);
      seed.push({ time: fmt(new Date(Date.now() - i * 5000)), ...d, forecast: +(BASE_RATE + well * 8).toFixed(1) });
    }
    setHistory(seed);
    setLive(seed[seed.length - 1]);
    setAlerts([]);
  }, [well]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      tick.current += 1;
      const t = tick.current;
      const isAnomaly = anomaly && t % 30 > 20;
      const d = generatePoint(t, well, rand.current, isAnomaly);
      const now = new Date();
      const forecast = +(BASE_RATE + well * 8 - t * 0.01).toFixed(1);
      const pt: Sample = { time: fmt(now), ...d, forecast };
      setHistory((prev) => [...prev.slice(-120), pt]);
      setLive(pt);
      if (isAnomaly && t % 5 === 0) {
        setAlerts((prev) => [
          ...prev.slice(-4),
          {
            time: fmt(now),
            hi: d.oil < forecast * 0.85,
            msg: `${WELLS[well].name}: rate ${d.oil} bbl/d (plan ${forecast})`,
          },
        ]);
      }
    }, iv * 1000);
    return () => clearInterval(id);
  }, [paused, well, anomaly, iv]);

  const forecast = live?.forecast ?? BASE_RATE;
  const delta = live ? ((live.oil - forecast) / forecast) * 100 : 0;
  const cumul = (history.reduce((s, p) => s + (p.oil || 0), 0) / 12).toFixed(0);
  const wor = live ? ((live.water / (live.oil + live.water)) * 100).toFixed(1) : "—";
  const acc = Math.max(85, 100 - Math.abs(delta)).toFixed(1);
  const chartData = useMemo(
    () => (tab === "wor" ? history.map((p) => ({ ...p, wor: p.oil > 0 ? +(p.water / p.oil).toFixed(3) : 0 })) : history),
    [tab, history]
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050d1a", color: "#c8d8f0", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes slideIn{from{transform:translateY(-6px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes glowBtn{0%,100%{box-shadow:0 0 6px #4a9eff30}50%{box-shadow:0 0 18px #4a9eff70}}
        .wb:hover{background:#1e3a5f!important}
        .tb:hover{color:#4a9eff!important}
      `}</style>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(90deg,#050d1a,#0a1a35,#050d1a)", borderBottom: "1px solid #1e3a5f", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#4a9eff", background: "#0a2040", padding: "3px 9px", borderRadius: 4, border: "1px solid #1e4080" }}>AI SMART WELL</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#e8f0ff" }}>Well Production Monitor</div>
            <div style={{ fontSize: 10, color: "#3a6080", fontFamily: "'DM Mono',monospace" }}>AI Smart Well, Inc. — Real-Time Analytics</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: paused ? "#6b7280" : "#22c55e", animation: paused ? "none" : "pulseDot 1.5s infinite" }} />
            <span style={{ color: paused ? "#6b7280" : "#22c55e", fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{paused ? "PAUSED" : "LIVE"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4a7aa0", fontFamily: "'DM Mono',monospace" }}>
            ⏱
            <input type="range" min={1} max={10} value={iv} onChange={(e) => setIv(+e.target.value)} style={{ width: 64, accentColor: "#4a9eff" }} />
            <span style={{ color: "#4a9eff", minWidth: 28 }}>{iv}s</span>
          </div>
          <button onClick={() => setPaused((p) => !p)} style={{ background: paused ? "#1e3a5f" : "#0a2040", border: "1px solid #1e4080", color: "#4a9eff", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: "pointer" }}>
            {paused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
          <button onClick={() => setAnomaly((a) => !a)} style={{ background: anomaly ? "#2d1a00" : "#0a2040", border: `1px solid ${anomaly ? "#f59e0b" : "#1e4080"}`, color: anomaly ? "#f59e0b" : "#4a7aa0", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: "pointer" }}>
            {anomaly ? "⚡ ANOMALY ON" : "⚡ SIM ANOMALY"}
          </button>
        </div>
      </div>

      <div style={{ padding: "18px 24px" }}>
        {/* WELL SELECTOR */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {WELLS.map((w, i) => (
            <button
              key={w.id}
              className="wb"
              onClick={() => setWell(i)}
              style={{
                background: i === well ? "#0f2848" : "#080f1e",
                border: `1px solid ${i === well ? "#4a9eff" : "#1e3a5f"}`,
                borderRadius: 10,
                padding: "9px 16px",
                color: i === well ? "#4a9eff" : "#4a7aa0",
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                transition: "all 0.2s",
                animation: i === well ? "glowBtn 2s infinite" : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600 }}>{w.id}</div>
              <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{w.name}</div>
            </button>
          ))}
          <div style={{ marginLeft: "auto", background: "#080f1e", border: "1px solid #1e3a5f", borderRadius: 10, padding: "9px 16px", fontSize: 10, color: "#3a6080", fontFamily: "'DM Mono',monospace" }}>
            <div>📍 {WELLS[well].field}</div>
            <div>⬇ {WELLS[well].depth.toLocaleString()} ft</div>
          </div>
        </div>

        {/* ALERTS */}
        {alerts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {alerts.slice(-3).map((a, i) => (
              <div
                key={i}
                style={{
                  background: a.hi ? "#2d0b0b" : "#1a2200",
                  border: `1px solid ${a.hi ? "#ef4444" : "#eab308"}`,
                  borderRadius: 7,
                  padding: "7px 12px",
                  fontSize: 11,
                  color: a.hi ? "#fca5a5" : "#fde047",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  animation: "slideIn 0.3s ease",
                }}
              >
                <span>{a.hi ? "🚨" : "⚠️"}</span>
                <span style={{ fontFamily: "monospace" }}>[{a.time}]</span>
                <span>{a.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <KPI label="Oil Rate" value={live?.oil ?? "—"} unit="bbl/d" delta={delta} color="#4a9eff" icon="🛢" />
          <KPI label="AI Forecast" value={forecast} unit="bbl/d" color="#a78bfa" icon="🤖" />
          <KPI label="Water Cut" value={wor} unit="%" color="#34d399" icon="💧" />
          <KPI label="Gas (GOR)" value={live?.gas ?? "—"} unit="Mscf/d" color="#fb923c" icon="🔥" />
          <KPI label="Pressure" value={live?.pressure ?? "—"} unit="psi" color="#f472b6" icon="📊" />
          <KPI label="Cumulative" value={cumul} unit="bbl" color="#facc15" icon="📈" />
        </div>

        {/* TABS */}
        <div style={{ display: "flex", marginBottom: 14, borderBottom: "1px solid #1e3a5f" }}>
          {[
            { id: "production", label: "Rate + Forecast" },
            { id: "pressure", label: "Pressure" },
            { id: "wor", label: "WOR" },
          ].map((t) => (
            <button
              key={t.id}
              className="tb"
              onClick={() => setTab(t.id as any)}
              style={{
                background: "none",
                border: "none",
                padding: "9px 18px",
                fontSize: 12,
                color: tab === t.id ? "#4a9eff" : "#4a7aa0",
                borderBottom: `2px solid ${tab === t.id ? "#4a9eff" : "transparent"}`,
                fontFamily: "'DM Sans',sans-serif",
                transition: "all 0.2s",
                marginBottom: -1,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* CHART */}
        <div style={{ background: "linear-gradient(135deg,#080f1e,#050d1a)", border: "1px solid #1e3a5f", borderRadius: 14, padding: "18px", marginBottom: 14, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height={260} minHeight={260}>
            {tab === "production" ? (
              <AreaChart data={history} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a9eff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4a9eff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f2040" />
                <XAxis dataKey="time" stroke="#2a4a6a" tick={{ fill: "#3a6080", fontSize: 9, fontFamily: "monospace" }} interval={19} />
                <YAxis stroke="#2a4a6a" tick={{ fill: "#3a6080", fontSize: 9, fontFamily: "monospace" }} unit=" bbl" />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#4a7aa0", fontFamily: "monospace" }} />
                <ReferenceLine y={forecast} stroke="#a78bfa" strokeDasharray="6 3" label={{ value: "AI forecast", fill: "#a78bfa", fontSize: 9 }} />
                <Area type="monotone" dataKey="oil" name="Oil" stroke="#4a9eff" fill="url(#g1)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="water" name="Water" stroke="#34d399" fill="url(#g2)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="gas" name="Gas" stroke="#fb923c" fill="url(#g3)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="forecast" name="AI Forecast" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
              </AreaChart>
            ) : tab === "pressure" ? (
              <AreaChart data={history} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f2040" />
                <XAxis dataKey="time" stroke="#2a4a6a" tick={{ fill: "#3a6080", fontSize: 9, fontFamily: "monospace" }} interval={19} />
                <YAxis stroke="#2a4a6a" tick={{ fill: "#3a6080", fontSize: 9, fontFamily: "monospace" }} unit=" psi" domain={["auto", "auto"]} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#4a7aa0", fontFamily: "monospace" }} />
                <Area type="monotone" dataKey="pressure" name="Wellhead Pressure" stroke="#f472b6" fill="url(#gp)" strokeWidth={2} dot={false} />
              </AreaChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f2040" />
                <XAxis dataKey="time" stroke="#2a4a6a" tick={{ fill: "#3a6080", fontSize: 9, fontFamily: "monospace" }} interval={19} />
                <YAxis stroke="#2a4a6a" tick={{ fill: "#3a6080", fontSize: 9, fontFamily: "monospace" }} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#4a7aa0", fontFamily: "monospace" }} />
                <ReferenceLine y={0.35} stroke="#facc15" strokeDasharray="4 4" label={{ value: "WOR threshold", fill: "#facc15", fontSize: 9 }} />
                <Area type="monotone" dataKey="wor" name="Water-Oil Ratio" stroke="#fb923c" fill="url(#gw)" strokeWidth={2} dot={false} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* BOTTOM STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "AI Accuracy", value: `${acc}%`, color: "#22c55e" },
            { label: "Update Interval", value: paused ? "PAUSED" : `${iv} s`, color: "#4a9eff" },
            { label: "Data Buffer", value: `${history.length}/120`, color: "#a78bfa" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#080f1e", border: "1px solid #1e3a5f", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#3a6080", fontFamily: "monospace", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 9, color: "#1e3a5f", fontFamily: "monospace" }}>
          AI Smart Well, Inc. — Platform © 2026 · Demo mode (simulated data)
        </div>
      </div>
    </div>
  );
}
