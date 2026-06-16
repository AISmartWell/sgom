import { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
  AreaChart, Area, ReferenceLine, ComposedChart, Bar,
} from "recharts";
import {
  Play, Pause, RotateCcw, Cpu, Zap, Activity, Gauge,
  Eye, Database, MessageSquare, Sparkles, ChevronRight,
} from "lucide-react";

// ── Cosmos color palette (consistent with other Cosmos demos) ──
const C = {
  bg:      "#07080a",
  panel:   "#0d1117",
  panel2:  "#11161d",
  border:  "#1c2530",
  border2: "#243040",
  nvidia:  "#76b900",
  orange:  "#f28c00",
  blue:    "#38bdf8",
  red:     "#ef4444",
  teal:    "#2dd4bf",
  purple:  "#a78bfa",
  muted:   "#4a6070",
  text:    "#d4dde6",
  dimText: "#6b8899",
};

// ── Stable hash (no Math.random in physics core) ──
function hash(seed: number, salt = 0): number {
  let x = Math.sin(seed * 9301 + salt * 49297 + 12345) * 233280;
  return x - Math.floor(x);
}

interface SimParams {
  porosity: number;          // %
  permeability: number;      // mD
  netPay: number;            // ft
  initialWC: number;         // % water cut
  reservoirPressure: number; // psi
  sptSlots: number;          // count
  sptDepth: number;          // ft (slot tunnel depth)
  oilPrice: number;          // $/bbl
}

const DEFAULT_PARAMS: SimParams = {
  porosity: 14,
  permeability: 35,
  netPay: 60,
  initialWC: 62,
  reservoirPressure: 1850,
  sptSlots: 6,
  sptDepth: 4,
  oilPrice: 72,
};

// ── Physics core (Cosmos-style temporal forecast, deterministic) ──
function simulatePhysics(p: SimParams, day: number, seed: number) {
  // Pre-SPT baseline rate from Darcy-like proxy
  const k_phi = (p.permeability * p.porosity) / 100;
  const preRate = 2.5 + k_phi * 0.18 + p.netPay * 0.04;

  // Uplift factor — depends on slot count, slot depth, and reservoir quality
  const baseUplift = 1 + (p.sptSlots * 0.55) * (p.sptDepth / 4);
  const qualityBoost = (k_phi > 4 ? 1.8 : 1.0) * (p.reservoirPressure / 1850);
  const uplift = Math.min(11, baseUplift * qualityBoost * 0.7);

  // Ramp: peak ~60d, then natural decline (Arps-like b=0.5)
  const peak = Math.min(1, day / 60);
  const declineDays = Math.max(0, day - 60);
  const decline = Math.pow(1 + 0.0008 * declineDays, -1 / 0.5);
  const rate = preRate + (preRate * uplift - preRate) * peak * decline;

  // Pressure: builds up then stabilizes
  const pressure = p.reservoirPressure * (1 + 0.18 * peak * decline);

  // Water cut: dip at 30d, slow recovery
  const dip = Math.exp(-Math.pow((day - 30) / 55, 2)) * (p.initialWC * 0.32);
  const drift = (day / 365) * (p.initialWC * 0.18);
  const wc = Math.max(8, p.initialWC - dip + drift);

  // Drainage radius (ft) — sqrt(uplift) proxy
  const drainage = 80 * Math.sqrt(Math.max(1, 1 + (uplift - 1) * peak));

  // Tiny seeded noise so chart isn't perfectly smooth
  const noise = (hash(day, seed) - 0.5) * 0.8;

  return {
    rate: Math.max(0.5, +(rate + noise).toFixed(2)),
    preRate: +preRate.toFixed(2),
    uplift: +uplift.toFixed(2),
    pressure: Math.round(pressure),
    waterCut: +wc.toFixed(1),
    drainage: +drainage.toFixed(1),
  };
}

type Mode = "predict" | "transfer" | "reason";

const CosmosSimulator = () => {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [mode, setMode] = useState<Mode>("predict");
  const [day, setDay] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2); // days per tick
  const [seed] = useState(42);
  const tickRef = useRef<number | null>(null);

  // ── Animation loop ──
  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setDay(d => {
        const next = d + speed;
        if (next >= 365) {
          setRunning(false);
          return 365;
        }
        return next;
      });
    }, 60);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running, speed]);

  // ── Full timeline (precomputed) ──
  const timeline = useMemo(() => {
    return Array.from({ length: 74 }, (_, i) => {
      const d = i * 5;
      const s = simulatePhysics(params, d, seed);
      return { day: d, ...s };
    });
  }, [params, seed]);

  // ── Current snapshot ──
  const current = useMemo(() => simulatePhysics(params, day, seed), [params, day, seed]);

  // ── Visible portion of curve as time progresses ──
  const visibleCurve = useMemo(
    () => timeline.filter(t => t.day <= Math.max(5, day)),
    [timeline, day]
  );

  // ── Cumulative production (bbl) over visible window ──
  const cumulative = useMemo(() => {
    let cum = 0;
    return visibleCurve.map(t => {
      cum += t.rate * 5; // 5-day step
      return { day: t.day, cum: Math.round(cum) };
    });
  }, [visibleCurve]);

  // ── Economic snapshot ──
  const totalRevenue = cumulative.length
    ? cumulative[cumulative.length - 1].cum * params.oilPrice
    : 0;

  const reset = () => { setRunning(false); setDay(0); };

  const updateParam = (key: keyof SimParams, v: number) =>
    setParams(p => ({ ...p, [key]: v }));

  // ── Mode-specific tagline ──
  const modeInfo = {
    predict:  { icon: Eye,           label: "PREDICT",  color: C.nvidia, desc: "Physics-aware temporal forecast — depth as time axis" },
    transfer: { icon: Database,      label: "TRANSFER", color: C.blue,   desc: "Synthetic log generation for data-sparse regions" },
    reason:   { icon: MessageSquare, label: "REASON",   color: C.purple, desc: "Chain-of-thought explanation of the simulation" },
  }[mode];

  return (
    <div style={{
      background: C.bg,
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
      color: C.text,
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: C.panel,
        flexWrap: "wrap",
      }}>
        <div style={{
          background: C.nvidia, color: "#000", fontWeight: 700, fontSize: 10,
          letterSpacing: "0.12em", padding: "4px 10px", borderRadius: 3,
        }}>SGOM PHYSICS SIMULATOR · NVIDIA NIM</div>
        <span style={{ color: C.muted, fontSize: 11 }}>×</span>
        <span style={{ color: C.blue, fontSize: 11, letterSpacing: "0.1em" }}>
          AI SMART WELL · FULL SIMULATOR
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: "#f28c0025", color: C.orange, fontSize: 8, fontWeight: 700,
            padding: "2px 6px", borderRadius: 3, letterSpacing: "0.1em",
            border: "1px solid #f28c0050",
          }}>HYBRID · PHYSICS + AI</span>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: C.panel2, border: `1px solid ${C.border2}`,
            padding: "4px 10px", borderRadius: 4, fontSize: 10,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: running ? C.nvidia : C.muted,
              boxShadow: running ? `0 0 6px ${C.nvidia}` : undefined,
            }} />
            <span style={{ color: C.dimText, letterSpacing: "0.08em" }}>
              T+{day}d / 365d
            </span>
          </div>
        </div>
      </div>

      {/* ── Mode selector ── */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.panel2 }}>
        {(["predict", "transfer", "reason"] as Mode[]).map(m => {
          const info = { predict: { icon: Eye, label: "Predict", color: C.nvidia },
                         transfer: { icon: Database, label: "Transfer", color: C.blue },
                         reason: { icon: MessageSquare, label: "Reason", color: C.purple } }[m];
          const Icon = info.icon;
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "12px 16px", background: active ? C.bg : "transparent",
                border: "none", borderRight: `1px solid ${C.border}`,
                borderBottom: active ? `2px solid ${info.color}` : "2px solid transparent",
                color: active ? info.color : C.dimText,
                fontFamily: "inherit", fontSize: 11, letterSpacing: "0.1em", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all .2s",
              }}
            >
              <Icon size={14} /> COSMOS {info.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* ── Mode description ── */}
      <div style={{
        padding: "10px 24px", borderBottom: `1px solid ${C.border}`,
        background: C.panel, fontSize: 10, color: C.dimText,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <modeInfo.icon size={12} style={{ color: modeInfo.color }} />
        <span>{modeInfo.desc}</span>
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 640 }}>

        {/* ── LEFT: Parameter sliders ── */}
        <div style={{
          borderRight: `1px solid ${C.border}`,
          background: C.panel,
          padding: "16px 18px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.12em", marginBottom: 4 }}>
            RESERVOIR PARAMETERS
          </div>

          <Slider label="Porosity"        value={params.porosity}          unit="%"     min={5}    max={28}   step={0.5} onChange={v => updateParam("porosity", v)}          color={C.blue} />
          <Slider label="Permeability"    value={params.permeability}      unit="mD"    min={1}    max={120}  step={1}   onChange={v => updateParam("permeability", v)}      color={C.orange} />
          <Slider label="Net Pay"         value={params.netPay}            unit="ft"    min={10}   max={200}  step={1}   onChange={v => updateParam("netPay", v)}            color={C.teal} />
          <Slider label="Initial WC"      value={params.initialWC}         unit="%"     min={10}   max={95}   step={1}   onChange={v => updateParam("initialWC", v)}         color={C.red} />
          <Slider label="Reservoir P"     value={params.reservoirPressure} unit="psi"   min={500}  max={5000} step={50}  onChange={v => updateParam("reservoirPressure", v)} color={C.purple} />

          <div style={{ height: 1, background: C.border, margin: "6px 0" }} />
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.12em" }}>
            SPT TREATMENT
          </div>

          <Slider label="Slots"           value={params.sptSlots}          unit=""      min={2}    max={12}   step={1}   onChange={v => updateParam("sptSlots", v)}          color={C.nvidia} />
          <Slider label="Slot Depth"      value={params.sptDepth}          unit="ft"    min={2}    max={8}    step={0.5} onChange={v => updateParam("sptDepth", v)}          color={C.nvidia} />
          <Slider label="Oil Price"       value={params.oilPrice}          unit="$/bbl" min={40}   max={120}  step={1}   onChange={v => updateParam("oilPrice", v)}          color={C.orange} />

          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.12em", marginBottom: 8 }}>
              SIMULATION SPEED
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 5, 10].map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  style={{
                    flex: 1, padding: "6px 0",
                    background: speed === s ? C.nvidia : C.panel2,
                    color: speed === s ? "#000" : C.dimText,
                    border: `1px solid ${speed === s ? C.nvidia : C.border2}`,
                    fontFamily: "inherit", fontSize: 10, fontWeight: 700,
                    borderRadius: 3, cursor: "pointer",
                  }}>{s}×</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Visualizations ── */}
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>

          {/* Top control bar */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setRunning(r => !r)}
              style={{
                padding: "8px 18px", background: running ? C.orange : C.nvidia,
                color: "#000", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em",
                border: "none", borderRadius: 4, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              {running ? <Pause size={13} /> : <Play size={13} />}
              {running ? "PAUSE" : day >= 365 ? "REPLAY" : day > 0 ? "RESUME" : "RUN COSMOS"}
            </button>
            <button onClick={reset}
              style={{
                padding: "8px 14px", background: "transparent",
                color: C.dimText, border: `1px solid ${C.border2}`, borderRadius: 4,
                fontFamily: "inherit", fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              <RotateCcw size={12} /> RESET
            </button>

            {/* Day slider */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>
              <span style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em" }}>DAY</span>
              <input
                type="range" min={0} max={365} step={5} value={day}
                onChange={e => { setRunning(false); setDay(Number(e.target.value)); }}
                style={{ flex: 1, accentColor: C.nvidia }}
              />
              <span style={{ fontSize: 10, color: C.text, fontFamily: "monospace", minWidth: 36, textAlign: "right" }}>
                {day}
              </span>
            </div>
          </div>

          {/* Live KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <KPI label="Production Rate" value={current.rate}    unit="bbl/d" color={C.nvidia} icon={Activity} />
            <KPI label="Uplift"          value={current.uplift}  unit="×"     color={C.orange} icon={Zap} suffix />
            <KPI label="Reservoir P"     value={current.pressure} unit="psi"  color={C.purple} icon={Gauge} />
            <KPI label="Water Cut"       value={current.waterCut} unit="%"    color={C.red}    icon={Cpu} />
          </div>

          {/* Production curve */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}>
                PRODUCTION FORECAST · bbl/day
              </span>
              <span style={{ fontSize: 9, color: C.dimText }}>
                pre-SPT baseline {current.preRate} bbl/d
              </span>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <ComposedChart data={visibleCurve} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="cosmosFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.nvidia} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.nvidia} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} />
                <YAxis stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} />
                <Tooltip contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, fontSize: 11 }} />
                <ReferenceLine y={current.preRate} stroke={C.muted} strokeDasharray="3 3" label={{ value: "pre-SPT", fontSize: 9, fill: C.muted, position: "left" }} />
                <Area type="monotone" dataKey="rate" stroke={C.nvidia} strokeWidth={2} fill="url(#cosmosFill)" />
                <ReferenceLine x={day} stroke={C.orange} strokeWidth={1.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom row: cumulative + drainage / reasoning */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Cumulative */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}>
                  CUMULATIVE OIL · bbl
                </span>
                <span style={{ fontSize: 11, color: C.nvidia, fontWeight: 700 }}>
                  ${(totalRevenue / 1000).toFixed(1)}k revenue
                </span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={cumulative} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.orange} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} />
                  <YAxis stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} />
                  <Tooltip contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, fontSize: 11 }} />
                  <Area type="monotone" dataKey="cum" stroke={C.orange} strokeWidth={2} fill="url(#cumFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Mode-specific panel */}
            {mode === "predict" && <DrainagePanel pre={80} post={current.drainage} sptSlots={params.sptSlots} />}
            {mode === "transfer" && <TransferPanel params={params} />}
            {mode === "reason" && <ReasonPanel params={params} current={current} day={day} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Slider component ──
function Slider({ label, value, unit, min, max, step, onChange, color }: {
  label: string; value: number; unit: string;
  min: number; max: number; step: number;
  onChange: (v: number) => void; color: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
        <span style={{ color: C.dimText, letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontFamily: "monospace" }}>
          {value} <span style={{ color: C.muted, fontWeight: 400 }}>{unit}</span>
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color }}
      />
    </div>
  );
}

// ── KPI card ──
function KPI({ label, value, unit, color, icon: Icon, suffix }: {
  label: string; value: number; unit: string; color: string;
  icon: any; suffix?: boolean;
}) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6,
      padding: "10px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <Icon size={11} style={{ color }} />
        <span style={{ fontSize: 9, color: C.muted, letterSpacing: "0.08em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "monospace" }}>
        {suffix ? value : value.toLocaleString()}
        <span style={{ fontSize: 10, color: C.dimText, marginLeft: 4, fontWeight: 400 }}>{unit}</span>
      </div>
    </div>
  );
}

// ── Drainage radial panel (Predict mode) ──
function DrainagePanel({ pre, post, sptSlots }: { pre: number; post: number; sptSlots: number }) {
  const W = 280, H = 200, cx = W / 2, cy = H / 2;
  const SCALE = 0.9;
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 6 }}>
        DRAINAGE EXPANSION · {Math.round(pre)} → {Math.round(post)} ft
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <ellipse cx={cx} cy={cy} rx={post * SCALE} ry={post * SCALE * 0.55}
          fill={`${C.nvidia}18`} stroke={C.nvidia} strokeWidth={1.5} strokeDasharray="3 2" />
        <ellipse cx={cx} cy={cy} rx={pre * SCALE} ry={pre * SCALE * 0.55}
          fill={`${C.muted}25`} stroke={C.muted} strokeWidth={1} />
        <line x1={cx} y1={20} x2={cx} y2={H - 20} stroke={C.text} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill={C.orange} />
        {Array.from({ length: sptSlots }).map((_, i) => {
          const a = (i / sptSlots) * Math.PI * 2;
          const x2 = cx + Math.cos(a) * post * SCALE * 0.92;
          const y2 = cy + Math.sin(a) * post * SCALE * 0.55 * 0.92;
          return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={C.nvidia} strokeWidth={0.8} opacity={0.75} />;
        })}
      </svg>
      <div style={{ fontSize: 9, color: C.dimText, marginTop: 4 }}>
        r_post ≈ r_pre · √uplift · {sptSlots} radiating slot perforations
      </div>
    </div>
  );
}

// ── Synthetic log preview (Transfer mode) ──
function TransferPanel({ params }: { params: SimParams }) {
  const data = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const depth = 4500 + i * 8;
      const isPay = i > 18 && i < 38;
      const gr = isPay ? 35 + hash(i, 1) * 18 : 80 + hash(i, 2) * 25;
      const nphi = isPay
        ? params.porosity / 100 + (hash(i, 3) - 0.5) * 0.04
        : 0.32 + hash(i, 4) * 0.05;
      return { depth, gr: +gr.toFixed(1), nphi: +(nphi * 100).toFixed(1) };
    });
  }, [params.porosity]);

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 6 }}>
        SYNTHETIC LOG · COSMOS TRANSFER
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <XAxis dataKey="depth" stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} />
          <YAxis stroke={C.muted} tick={{ fontSize: 9, fill: C.muted }} />
          <Tooltip contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, fontSize: 11 }} />
          <Line type="monotone" dataKey="gr" stroke={C.nvidia} strokeWidth={1.5} dot={false} name="GR" />
          <Line type="monotone" dataKey="nphi" stroke={C.blue} strokeWidth={1.5} dot={false} name="NPHI×100" />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 9, color: C.dimText, marginTop: 4 }}>
        10× synthetic augmentation conditioned on porosity {params.porosity}%
      </div>
    </div>
  );
}

// ── Chain-of-thought reasoning panel (Reason mode) ──
function ReasonPanel({ params, current, day }: { params: SimParams; current: any; day: number }) {
  const steps = [
    `Reservoir quality: φ=${params.porosity}%, k=${params.permeability} mD → ${(params.permeability * params.porosity / 100).toFixed(1)} mD·% storage capacity.`,
    `SPT design: ${params.sptSlots} slots × ${params.sptDepth} ft tunnels bypass near-wellbore damage.`,
    `Pressure restoration: ${params.reservoirPressure} → ${current.pressure} psi (+${Math.round((current.pressure / params.reservoirPressure - 1) * 100)}%).`,
    `Day ${day}: rate ${current.rate} bbl/d (${current.uplift}× pre-SPT baseline ${current.preRate}).`,
    `Water cut at ${current.waterCut}% — ${current.waterCut < params.initialWC ? "below" : "above"} initial ${params.initialWC}%.`,
  ];

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 8 }}>
        COSMOS REASON · CHAIN OF THOUGHT
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: "flex", gap: 8, alignItems: "flex-start",
            fontSize: 10, color: C.text, lineHeight: 1.45,
          }}>
            <ChevronRight size={12} style={{ color: C.purple, flexShrink: 0, marginTop: 2 }} />
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CosmosSimulator;
