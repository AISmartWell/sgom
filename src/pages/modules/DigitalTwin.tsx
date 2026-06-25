import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Slug → preset key map for deep-link routes like /dashboard/digital-twin/brawner-10-15
const SLUG_PRESET: Record<string, "brawner" | "ghawar"> = {
  "brawner-10-15": "brawner",
  "brawner": "brawner",
  "ghawar": "ghawar",
};

const WELLS = [
  { id: "BRW-10",  x: 155, y: 100, rank: 1, score: 92, depth: 3240, q0: 45, potential: "high" },
  { id: "BYS-10",  x: 295, y: 165, rank: 2, score: 87, depth: 2890, q0: 38, potential: "high" },
  { id: "W-047",   x: 395, y:  85, rank: 3, score: 71, depth: 3100, q0: 22, potential: "medium" },
  { id: "W-112",   x: 210, y: 265, rank: 4, score: 45, depth: 2450, q0:  8, potential: "low" },
  { id: "W-203",   x: 470, y: 210, rank: 5, score: 38, depth: 2100, q0:  5, potential: "low" },
  { id: "W-089",   x: 335, y: 320, rank: 6, score: 29, depth: 1980, q0:  0, potential: "none" },
  { id: "W-156",   x: 125, y: 235, rank: 7, score: 22, depth: 2340, q0:  0, potential: "none" },
  { id: "W-334",   x: 440, y: 335, rank: 8, score: 18, depth: 1650, q0:  0, potential: "none" },
];

function potColor(p: string) {
  if (p === "high")   return "hsl(145 80% 50%)";
  if (p === "medium") return "hsl(45 100% 55%)";
  if (p === "low")    return "hsl(0 85% 55%)";
  return "hsl(215 15% 70%)";
}

function potTailwind(p: string) {
  if (p === "high")   return "text-emerald-400";
  if (p === "medium") return "text-amber-400";
  if (p === "low")    return "text-red-400";
  return "text-muted-foreground";
}

function genProduction(q0: number, sptMult: number) {
  const D = 0.075;
  const seed = [1.42, 0.91, 1.18, 0.76, 1.05, 0.88, 1.31, 0.95,
                1.12, 0.83, 1.22, 0.78, 1.08, 0.93, 1.17, 0.85,
                1.28, 0.72, 1.14, 0.96, 1.06, 0.87, 1.25, 0.79,
                1.10, 0.92, 1.19, 0.82, 1.07, 0.94, 1.16, 0.84,
                1.24, 0.77, 1.09, 0.89];
  return Array.from({ length: 36 }, (_, i) => {
    const base = q0 * sptMult * Math.exp(-D * i);
    return {
      month: i,
      p10: +(base * 1.45 * (seed[i] > 1 ? seed[i] : 1)).toFixed(1),
      p50: +base.toFixed(1),
      p90: +(base * 0.55 * (seed[i] < 1 ? seed[i] : 0.85)).toFixed(1),
    };
  });
}

const LOOP_STEPS = [
  { label: "Real data", sub: "SCADA / IoT", color: "#3B8BD4",  x: 40,  y: 110 },
  { label: "Bayesian update", sub: "DCA + Monte Carlo", color: "#7F77DD", x: 215, y: 30  },
  { label: "Forecast", sub: "P10 / P50 / P90", color: "#1D9E75", x: 390, y: 110 },
  { label: "Calibration", sub: "Δ model vs actual", color: "#EF9F27", x: 215, y: 190 },
];

const LOOP_ARROWS = [
  { d: "M 172 128 Q 215 90  215 90",  step: 0 },
  { d: "M 345 60  Q 390 90  390 140", step: 1 },
  { d: "M 390 170 Q 370 220 345 220", step: 2 },
  { d: "M 215 220 Q 195 170 172 148", step: 3 },
];

const TAB_LABELS = ["Field Map", "Scenario", "Twin Dashboard", "Feedback Loop", "Live Example"];

// ─── Live example presets ─────────────────────────────────────────────────────
// Two complete digital-twin case studies. Same physics, same pipeline — only
// the geology, units, fluid, and economics differ. Demonstrates that the twin
// is field-agnostic: works for US tight carbonate and Saudi giant alike.

type ExamplePreset = {
  key: "brawner" | "ghawar";
  badge: string;
  well: {
    id: string; name: string; api: string;
    field: string; operator: string;
    depth: string; formation: string;
    porosity: number; perm: number; sw: number; pres: string; temp: string;
    qPre: string; qPost: string;
  };
  stages: { key: string; label: string; sub: string; color: string; duration: number }[];
  history: number[];        // 24-mo actual production (display units)
  forecastQi: number;       // initial rate post-SPT (display units)
  rateUnit: string;         // "bbl/d" | "m³/d"
  sptSpec: string;          // e.g. "SPT @ 4 ft, 8 stages"
  upliftLabel: string;
  npv: string;
  irr: string;
  payback: string;
  rationale: string;        // why SPT here (tight rock vs water-shutoff)
};

const PRESETS: Record<"brawner" | "ghawar", ExamplePreset> = {
  brawner: {
    key: "brawner",
    badge: "US · Imperial",
    well: {
      id: "BRW-10-15", name: "Brawner 10-15", api: "35-019-24680",
      field: "Anadarko Basin · OK", operator: "Diversified Energy",
      depth: "3,240 ft", formation: "Mississippian Lime",
      porosity: 18.4, perm: 42, sw: 0.34, pres: "2,410 psi", temp: "178 °F",
      qPre: "12 bbl/d", qPost: "45 bbl/d",
    },
    stages: [
      { key: "ingest",   label: "Data Ingestion",       sub: "LAS · SEIS · 24mo history · 4 offsets", color: "#3B8BD4", duration: 1800 },
      { key: "model",    label: "Reservoir Snapshot",    sub: "φ=18.4% · k=42 md · Sw=34% · P=2,410 psi", color: "#A08060", duration: 1600 },
      { key: "simulate", label: "SPT Simulation",        sub: "Arps + Monte Carlo (50K) · 60 months",    color: "#7F77DD", duration: 2000 },
      { key: "forecast", label: "P10 / P50 / P90 NPV",   sub: "NPV₁₀ = $487K (P50) · IRR 38%",            color: "#1D9E75", duration: 1700 },
      { key: "rank",     label: "Ranked Recommendation", sub: "Rank #1 · Score 92/100 · SPT 4 ft",       color: "#EF9F27", duration: 1500 },
    ],
    history: [35, 33, 31, 29, 27, 25, 24, 22, 21, 20, 19, 18, 17, 16, 16, 15, 14, 14, 13, 13, 12, 12, 12, 12],
    forecastQi: 45,
    rateUnit: "bbl/d",
    sptSpec: "SPT @ 4 ft penetration, 8 stages",
    upliftLabel: "12 → 45 bbl/d (×3.75)",
    npv: "$487K",
    irr: "38%",
    payback: "9 months",
    rationale: "Tight carbonate (k=42 md) — SPT removes near-wellbore damage and creates radial flow channels to bypass formation skin.",
  },
  ghawar: {
    key: "ghawar",
    badge: "KSA · Metric",
    well: {
      id: "GHWR-512H", name: "Ghawar-512H", api: "KSA-GHW-0512",
      field: "Ghawar · Saudi Arabia", operator: "Saudi Aramco",
      depth: "2,150 m", formation: "Arab-D Carbonate",
      porosity: 22.1, perm: 380, sw: 0.18, pres: "203 bar", temp: "99 °C",
      qPre: "85 m³/d", qPost: "395 m³/d",
    },
    stages: [
      { key: "ingest",   label: "Data Ingestion",       sub: "LAS · 3D seismic · 36mo MPFM · 6 offsets",  color: "#3B8BD4", duration: 1800 },
      { key: "model",    label: "Reservoir Snapshot",    sub: "φ=22.1% · k=380 md · Sw=18% · P=203 bar",  color: "#A08060", duration: 1600 },
      { key: "simulate", label: "SPT Simulation",        sub: "Arps + Monte Carlo (50K) · 60 months",     color: "#7F77DD", duration: 2000 },
      { key: "forecast", label: "P10 / P50 / P90 NPV",   sub: "NPV₁₀ = $4.8M (P50) · IRR 52%",             color: "#1D9E75", duration: 1700 },
      { key: "rank",     label: "Ranked Recommendation", sub: "Rank #1 · Score 96/100 · SPT 1.2 m",       color: "#EF9F27", duration: 1500 },
    ],
    // Arab-D giant: high rate, gradual water-cut driven decline
    history: [220, 215, 208, 198, 190, 182, 175, 168, 160, 152, 145, 138, 132, 125, 118, 112, 108, 102, 98, 94, 90, 88, 86, 85],
    forecastQi: 395,
    rateUnit: "m³/d",
    sptSpec: "SPT @ 1.2 m penetration, 12 stages, water-shutoff zones",
    upliftLabel: "85 → 395 m³/d (×4.6)",
    npv: "$4.8M",
    irr: "52%",
    payback: "5 months",
    rationale: "High-k Arab-D (380 md) — SPT isolates watered-out zones and re-establishes selective oil inflow above WOC.",
  },
};

const buildCombined = (p: ExamplePreset) => {
  const forecast = Array.from({ length: 36 }, (_, i) => {
    const t = i;
    const p50 = p.forecastQi / Math.pow(1 + 0.5 * 0.08 * t, 1 / 0.5);
    const band = p50 * (0.18 + i * 0.004);
    return {
      month: 25 + i,
      p10: +(p50 + band).toFixed(1),
      p50: +p50.toFixed(1),
      p90: +Math.max(0, p50 - band).toFixed(1),
    };
  });
  return [
    ...p.history.map((q, i) => ({ month: i + 1, actual: q, p10: null, p50: null, p90: null })),
    { month: 24, actual: p.history[p.history.length - 1], p10: p.forecastQi, p50: p.forecastQi, p90: p.forecastQi },
    ...forecast.map(f => ({ month: f.month, actual: null, p10: f.p10, p50: f.p50, p90: f.p90 })),
  ];
};

export default function DigitalTwin() {
  const { wellSlug } = useParams<{ wellSlug?: string }>();
  const [searchParams] = useSearchParams();
  const initialPreset = (wellSlug && SLUG_PRESET[wellSlug]) || "brawner";
  const initialTab = wellSlug ? 4 : Number(searchParams.get("tab") ?? 0);
  const [tab, setTab]           = useState(initialTab);
  const [well, setWell]         = useState(WELLS[0]);
  const [sptDepth, setSptDepth] = useState(4);
  const [price, setPrice]       = useState(70);
  const [units, setUnits]       = useState("US");
  const [loopStep, setLoopStep] = useState(0);
  const [twinWellIdx, setTwinWellIdx] = useState(0);
  const [presetKey, setPresetKey] = useState<"brawner" | "ghawar">(initialPreset);

  // If the deep-link slug changes (user navigates to /digital-twin/brawner-10-15
  // from OCR), re-sync tab + preset.
  useEffect(() => {
    if (wellSlug && SLUG_PRESET[wellSlug]) {
      setPresetKey(SLUG_PRESET[wellSlug]);
      setTab(4);
    }
  }, [wellSlug]);
  const preset = PRESETS[presetKey];
  const EXAMPLE_WELL = preset.well;
  const EXAMPLE_STAGES = preset.stages;
  const EXAMPLE_COMBINED = useMemo(() => buildCombined(preset), [presetKey]);
  const [exStage, setExStage]   = useState(0);
  const [exPlaying, setExPlaying] = useState(true);
  const [exProgress, setExProgress] = useState(0);

  useEffect(() => {
    if (tab !== 3) return;
    const t = setInterval(() => setLoopStep(s => (s + 1) % 4), 1400);
    return () => clearInterval(t);
  }, [tab]);

  // Live example animation: advance through 5 stages
  useEffect(() => {
    if (tab !== 4 || !exPlaying) return;
    const dur = EXAMPLE_STAGES[exStage].duration;
    const start = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / dur);
      setExProgress(p);
      if (p >= 1) {
        clearInterval(iv);
        if (exStage < EXAMPLE_STAGES.length - 1) {
          setExStage(s => s + 1);
          setExProgress(0);
        } else {
          setExPlaying(false);
        }
      }
    }, 40);
    return () => clearInterval(iv);
  }, [tab, exStage, exPlaying]);

  useEffect(() => {
    if (tab === 4 && !exPlaying && exStage === EXAMPLE_STAGES.length - 1 && exProgress === 0) {
      // entering tab fresh
    }
  }, [tab]);

  const resetExample = () => { setExStage(0); setExProgress(0); setExPlaying(true); };


  const sptMult = +(1 + (sptDepth - 3) * 0.3).toFixed(2);
  const prodData = useMemo(() => genProduction(well.q0, sptMult), [well.id, sptMult]);
  const revData  = useMemo(() =>
    prodData.map(d => ({ ...d, rev: Math.round(d.p50 * 30 * price) })),
    [prodData, price]);

  const npv50 = Math.round(revData.reduce((s, d, i) => s + d.rev / Math.pow(1.1, i / 12), 0));

  const cell = (k: string, v: string | number, warn?: boolean) => (
    <div key={k} className="flex justify-between items-center text-[11px] px-2 py-[5px] bg-card rounded border border-border/50">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("font-medium", warn ? "text-amber-400" : "text-foreground")}>{v}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 font-mono">
      <div className="max-w-7xl mx-auto rounded-xl border border-border/50 overflow-hidden bg-card/40 backdrop-blur-sm">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              AI Smart Well Platform · Digital Twin
            </div>
            <div className="text-[15px] font-medium mt-0.5">
              Anadarko Basin · 8 wells monitored
            </div>
          </div>
          <div className="flex gap-2.5 items-center">
            <button
              onClick={() => setUnits(u => u === "US" ? "SI" : "US")}
              className="text-[11px] px-2.5 py-1 rounded-md border border-border/50 bg-transparent cursor-pointer text-muted-foreground font-mono hover:bg-muted/30 transition-colors"
            >
              {units === "US" ? "US ft/psi/°F" : "SI m/bar/°C"}
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-[7px] h-[7px] rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]" />
              <span className="text-[11px] text-emerald-400">Live</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50">
          {TAB_LABELS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={cn(
                "flex-1 px-2 py-2.5 text-[11px] border-b-2 font-mono transition-colors cursor-pointer bg-transparent",
                tab === i
                  ? "border-emerald-400 text-emerald-400 font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-5">
          {/* ═══ TAB 0 – FIELD MAP ═══ */}
          {tab === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
              <svg viewBox="0 0 560 400" className="w-full bg-card rounded-lg border border-border/50">
                {/* grid */}
                {[100,200,300,400,500].map(x => (
                  <line key={`v${x}`} x1={x} y1="20" x2={x} y2="380" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
                ))}
                {[80,160,240,320].map(y => (
                  <line key={`h${y}`} x1="20" y1={y} x2="540" y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
                ))}
                {/* lease */}
                <rect x="50" y="40" width="460" height="320" rx="4" fill="none"
                  stroke="hsl(145 80% 50%)" strokeWidth="0.5" strokeDasharray="6 4" opacity="0.35" />
                <text x="56" y="32" fill="hsl(145 80% 50%)" fontSize="10" opacity="0.55"
                  fontFamily="'IBM Plex Mono', monospace">
                  Lease Block 14-N · 640 ac{units === "SI" ? " / 2.59 km²" : ""}
                </text>
                {/* seismic lines */}
                <path d="M50 195 Q280 185 510 195" fill="none" stroke="#3B8BD4"
                  strokeWidth="0.5" strokeDasharray="3 6" opacity="0.25" />
                <path d="M280 40 Q285 200 280 360" fill="none" stroke="#3B8BD4"
                  strokeWidth="0.5" strokeDasharray="3 6" opacity="0.25" />
                {/* wells */}
                {WELLS.map(w => (
                  <g key={w.id} style={{ cursor: "pointer" }} onClick={() => setWell(w)}>
                    <circle cx={w.x} cy={w.y} r={well.id === w.id ? 16 : 11}
                      fill={potColor(w.potential)} opacity="0.12"
                      style={{ transition: "r 0.2s" }} />
                    <circle cx={w.x} cy={w.y} r={well.id === w.id ? 9 : 6}
                      fill={potColor(w.potential)} opacity="0.9" />
                    {w.rank <= 3 && (
                      <text x={w.x} y={w.y + 0.5} textAnchor="middle"
                        dominantBaseline="central" fill="white" fontSize="8" fontWeight="600"
                        fontFamily="'IBM Plex Mono', monospace">{w.rank}</text>
                    )}
                    <text x={w.x + 13} y={w.y - 2} fill="hsl(var(--muted-foreground))"
                      fontSize="9" fontFamily="'IBM Plex Mono', monospace">{w.id}</text>
                    <text x={w.x + 13} y={w.y + 10} fill="hsl(var(--muted-foreground))"
                      fontSize="8" fontFamily="'IBM Plex Mono', monospace">
                      {units === "US" ? `${w.depth}ft` : `${Math.round(w.depth * 0.3048)}m`}
                    </text>
                  </g>
                ))}
                {/* legend */}
                {[
                  { label: "High", c: "hsl(145 80% 50%)", dx: 16 },
                  { label: "Medium", c: "hsl(45 100% 55%)", dx: 86 },
                  { label: "Low", c: "hsl(0 85% 55%)", dx: 166 },
                  { label: "Abandoned", c: "hsl(215 15% 70%)", dx: 226 },
                ].map(l => (
                  <g key={l.label} transform={`translate(${l.dx}, 368)`}>
                    <circle cx="5" cy="5" r="5" fill={l.c} opacity="0.85" />
                    <text x="13" y="9" fill="hsl(var(--muted-foreground))" fontSize="9"
                      fontFamily="'IBM Plex Mono', monospace">{l.label}</text>
                  </g>
                ))}
              </svg>

              {/* Well detail */}
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-muted-foreground tracking-[0.12em] uppercase">Selected Well</div>
                <div className="p-3 bg-card rounded-lg border border-border/50">
                  <div className={cn("text-[15px] font-medium", potTailwind(well.potential))}>
                    {well.id}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Rank #{well.rank}
                  </div>
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {[
                      ["Score", `${well.score} / 100`],
                      ["Depth", units === "US" ? `${well.depth} ft` : `${Math.round(well.depth * 0.3048)} m`],
                      ["Est. q₀", units === "US" ? `${well.q0} bbl/d` : `${(well.q0 * 0.159).toFixed(1)} m³/d`],
                      ["Status", well.potential],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5">
                    <div className="h-[3px] bg-border rounded-full">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${well.score}%`, backgroundColor: potColor(well.potential) }} />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground tracking-[0.12em] uppercase mt-1">Ranked List</div>
                {WELLS.filter(w => w.potential !== "none").map(w => (
                  <div key={w.id} onClick={() => setWell(w)}
                    className={cn(
                      "px-2.5 py-1.5 cursor-pointer rounded-md border flex items-center gap-2 text-[11px] transition-colors",
                      well.id === w.id
                        ? "bg-emerald-400/10 border-emerald-400/40"
                        : "bg-card border-border/50 hover:border-border"
                    )}>
                    <span className="text-[10px] text-muted-foreground min-w-[18px]">#{w.rank}</span>
                    <span className="flex-1">{w.id}</span>
                    <span className={cn("text-[10px] font-medium", potTailwind(w.potential))}>
                      {w.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ TAB 1 – SCENARIO ═══ */}
          {tab === 1 && (
            <div className="flex flex-col gap-3.5">
              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-card rounded-lg border border-border/50">
                  <div className="text-[10px] text-muted-foreground mb-2 tracking-[0.1em] uppercase">Well</div>
                  <select
                    value={well.id}
                    onChange={e => setWell(WELLS.find(w => w.id === e.target.value) || WELLS[0])}
                    className="w-full text-xs font-mono bg-background text-foreground border border-border/50 rounded px-1 py-1"
                  >
                    {WELLS.filter(w => w.potential !== "none").map(w => (
                      <option key={w.id} value={w.id}>{w.id} (rank #{w.rank})</option>
                    ))}
                  </select>
                </div>
                {[
                  { label: `SPT DEPTH · ${sptDepth}${units === "US" ? " ft" : " m"}`, val: sptDepth, min: 3, max: 5, step: 0.5, set: setSptDepth },
                  { label: `OIL PRICE · $${price}/bbl`, val: price, min: 40, max: 120, step: 5, set: setPrice },
                ].map((ctrl, i) => (
                  <div key={i} className="p-3 bg-card rounded-lg border border-border/50">
                    <div className="text-[10px] text-muted-foreground mb-2 tracking-[0.1em] uppercase">{ctrl.label}</div>
                    <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step}
                      value={ctrl.val} onChange={e => ctrl.set(parseFloat(e.target.value))}
                      className="w-full accent-primary" />
                  </div>
                ))}
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "P50 NPV (36mo)", val: `$${(npv50/1000).toFixed(0)}K`, color: "text-emerald-400" },
                  { label: "SPT multiplier", val: `${sptMult}×`, color: "text-amber-400" },
                  { label: "Peak rate (P50)", val: `${Math.round(well.q0 * sptMult)} bbl/d`, color: "text-blue-400" },
                  { label: "EUR estimate", val: `${Math.round(prodData.reduce((s,d)=>s+d.p50*30,0)/1000)}K bbl`, color: "text-muted-foreground" },
                ].map((k, i) => (
                  <div key={i} className="p-2.5 bg-card rounded-lg border border-border/50">
                    <div className="text-[9px] text-muted-foreground mb-1 tracking-[0.1em] uppercase">{k.label}</div>
                    <div className={cn("text-[17px] font-medium", k.color)}>{k.val}</div>
                  </div>
                ))}
              </div>

              {/* Production forecast */}
              <div>
                <div className="text-[10px] text-muted-foreground mb-2 tracking-[0.08em] uppercase">
                  Production Forecast · {well.id} · SPT {sptDepth}{units === "US" ? "ft" : "m"} · P10 / P50 / P90
                </div>
                <div className="h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prodData} margin={{ top:2, right:2, bottom:0, left:0 }}>
                      <defs>
                        <linearGradient id="gP10" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(145 80% 50%)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="hsl(145 80% 50%)" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gP90" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(0 85% 55%)" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="hsl(0 85% 55%)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity="0.4" />
                      <XAxis dataKey="month"
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono'" }}
                        label={{ value: "months", position: "insideBottomRight", offset: -4,
                          fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono'" }}
                        label={{ value: "bbl/d", angle: -90, position: "insideLeft",
                          fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))",
                        border: "0.5px solid hsl(var(--border))", fontSize: "11px",
                        fontFamily: "'IBM Plex Mono'" }}
                        formatter={(v: number) => [`${v} bbl/d`]} />
                      <Area type="monotone" dataKey="p10" stroke="hsl(145 80% 50%)" strokeWidth={1.5}
                        fill="url(#gP10)" name="P10" />
                      <Area type="monotone" dataKey="p50" stroke="hsl(45 100% 55%)" strokeWidth={2}
                        fill="none" name="P50" />
                      <Area type="monotone" dataKey="p90" stroke="hsl(0 85% 55%)" strokeWidth={1}
                        fill="url(#gP90)" strokeDasharray="4 2" name="P90" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue */}
              <div>
                <div className="text-[10px] text-muted-foreground mb-2 tracking-[0.08em] uppercase">
                  Monthly Revenue · P50 · ${price}/bbl
                </div>
                <div className="h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revData} margin={{ top:2, right:2, bottom:0, left:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity="0.4" />
                      <XAxis dataKey="month"
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono'" }} />
                      <YAxis
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono'" }}
                        tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))",
                        border: "0.5px solid hsl(var(--border))", fontSize: "11px",
                        fontFamily: "'IBM Plex Mono'" }}
                        formatter={(v: number) => [`$${v.toLocaleString()}`]} />
                      <Area type="monotone" dataKey="rev" stroke="#3B8BD4" strokeWidth={1.5}
                        fill="#3B8BD4" fillOpacity={0.1} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 2 – TWIN DASHBOARD ═══ */}
          {tab === 2 && (() => {
            // Deterministic per-well variation (no Math.random)
            const tw = WELLS[twinWellIdx];
            const h = (s: string, salt: number) => {
              let n = salt;
              for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
              return n;
            };
            const rnd = (salt: number, min: number, max: number) => {
              const v = (h(tw.id, salt) % 1000) / 1000;
              return min + v * (max - min);
            };
            const phi  = rnd(1, 14, 22);                  // porosity %
            const perm = rnd(2, 18, 75);                  // permeability md
            const pres = rnd(3, 2100, 2900);              // psi
            const temp = rnd(4, 165, 195);                // °F
            const sw   = rnd(5, 22, 48);                  // water saturation %
            const lag  = rnd(6, 1, 4);                    // min
            const conf = rnd(7, 78, 94);                  // model confidence %
            const recal = rnd(8, 2, 11);                  // hours
            const health = Math.round(85 + (conf - 78) * 0.9);
            const active = tw.potential !== "none";
            // Mini 24h health sparkline (deterministic walk)
            const spark = Array.from({ length: 24 }, (_, i) => {
              const v = ((h(tw.id, 100 + i) % 100) - 50) / 50; // -1..1
              return Math.max(70, Math.min(100, health + v * 4 - Math.abs(12 - i) * 0.1));
            });
            const sparkMax = Math.max(...spark), sparkMin = Math.min(...spark);
            const sparkPath = spark.map((v, i) => {
              const x = (i / 23) * 100;
              const y = 100 - ((v - sparkMin) / (sparkMax - sparkMin || 1)) * 100;
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(" ");

            const psi = (v: number) => units === "US" ? `${Math.round(v).toLocaleString()} psi` : `${(v * 0.0689).toFixed(0)} bar`;
            const degF = (v: number) => units === "US" ? `${Math.round(v)}°F` : `${Math.round((v - 32) * 5/9)}°C`;
            const rate = active ? rnd(9, 18, 65) : 0;
            const rateLbl = units === "US" ? `${rate.toFixed(1)} bbl/d` : `${(rate * 0.159).toFixed(2)} m³/d`;

            return (
              <div className="flex flex-col gap-3">
                <div className="text-[11px] text-muted-foreground">
                  4-layer architecture · real-time sync · drill-down per well · NVIDIA DGX Cloud
                </div>

                {/* Well selector */}
                <div className="flex flex-wrap gap-1.5">
                  {WELLS.map((w, i) => (
                    <button key={w.id} onClick={() => setTwinWellIdx(i)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] border transition-colors",
                        i === twinWellIdx
                          ? "bg-primary/15 border-primary text-primary"
                          : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
                      )}>
                      <span className="font-medium">{w.id}</span>
                      <span className="ml-1.5" style={{ color: potColor(w.potential) }}>●</span>
                    </button>
                  ))}
                </div>

                {/* Selected well summary + health sparkline */}
                <div className="px-3.5 py-3 bg-card rounded-lg border border-border/50 flex items-center gap-4 flex-wrap">
                  <div className="flex flex-col">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Selected well</div>
                    <div className="text-sm font-medium">{tw.id} · rank #{tw.rank} · score {tw.score}</div>
                    <div className={cn("text-[10px]", potTailwind(tw.potential))}>{tw.potential.toUpperCase()} potential</div>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>Twin health · 24h</span>
                      <span className="text-emerald-400">{health}%</span>
                    </div>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-10">
                      <path d={sparkPath} fill="none" stroke="hsl(145 80% 50%)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>

                {[
                  {
                    name: "Geological layer", color: "#A08060", icon: "◈",
                    items: [
                      ["3D reservoir model", "Active", false],
                      ["Porosity",   `${phi.toFixed(1)}%`,   phi < 16],
                      ["Permeability", `${perm.toFixed(0)} md`, perm < 25],
                      ["Last seismic", "Apr 2026", true],
                    ],
                  },
                  {
                    name: "Hydrodynamic layer", color: "#3B8BD4", icon: "≋",
                    items: [
                      ["Reservoir pressure", psi(pres), pres < 2200],
                      ["Temperature",        degF(temp), false],
                      ["Fluid simulator", "Running", false],
                      ["Water saturation", `${sw.toFixed(0)}%`, sw > 40],
                    ],
                  },
                  {
                    name: "Production layer", color: "#1D9E75", icon: "⚡",
                    items: [
                      ["Status", active ? "Producing" : "Idle", !active],
                      ["Rate", active ? rateLbl : "—", !active],
                      ["SCADA sync", active ? "Live" : "Offline", !active],
                      ["Last data point", active ? `${lag.toFixed(1)} min ago` : "n/a", false],
                    ],
                  },
                  {
                    name: "AI / ML layer", color: "#7F77DD", icon: "∿",
                    items: [
                      ["Bayesian DCA", "Updated", false],
                      ["Monte Carlo (N)", "50,000", false],
                      ["Model confidence", `${conf.toFixed(0)}%`, conf < 82],
                      ["Next recalibration", `${recal.toFixed(1)}h`, false],
                    ],
                  },
                ].map((layer, i) => (
                  <div key={i} className="px-3.5 py-3 bg-card rounded-lg border border-border/50"
                    style={{ borderLeft: `3px solid ${layer.color}` }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-sm" style={{ color: layer.color }}>{layer.icon}</span>
                      <span className="text-xs font-medium" style={{ color: layer.color }}>
                        {layer.name}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full",
                          active ? "bg-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.2)]" : "bg-muted-foreground")} />
                        <span className={cn("text-[10px]", active ? "text-emerald-400" : "text-muted-foreground")}>
                          {active ? "online" : "idle"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {layer.items.map(([k, v, w]) => cell(String(k), String(v), !!w))}
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { v: `${health}%`,           l: "Digital twin health",   s: `${tw.id} · 4 layers` },
                    { v: `${lag.toFixed(1)} min`, l: "Data freshness",       s: "SCADA connected" },
                    { v: `< 2 min`,              l: "Simulation lag",        s: "DGX Cloud" },
                  ].map((s, i) => (
                    <div key={i} className="p-2.5 bg-card rounded-lg text-center border border-border/50">
                      <div className="text-[17px] font-medium text-emerald-400">{s.v}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.l}</div>
                      <div className="text-[10px] text-muted-foreground">{s.s}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ═══ TAB 3 – FEEDBACK LOOP ═══ */}
          {tab === 3 && (
            <div className="flex flex-col gap-3.5 items-center">
              <div className="text-[11px] text-muted-foreground self-start">
                Self-learning cycle · runs every 6 hours · powered by NVIDIA DGX Cloud
              </div>
              <svg viewBox="0 0 560 290" className="w-full max-w-[520px]">
                <defs>
                  <marker id="al" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M2 1L8 5L2 9" fill="none" stroke="hsl(215 15% 70%)"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </marker>
                </defs>
                {/* Arrows */}
                {LOOP_ARROWS.map((a, i) => (
                  <path key={i} d={a.d} fill="none" stroke="hsl(215 15% 70%)" strokeWidth="0.8"
                    markerEnd="url(#al)"
                    opacity={loopStep >= a.step ? 0.8 : 0.2}
                    style={{ transition: "opacity 0.5s" }} />
                ))}
                {/* Nodes */}
                {LOOP_STEPS.map((n, i) => {
                  const cx = n.x + 130 / 2;
                  const cy = n.y + 60 / 2;
                  const active = loopStep === i;
                  return (
                    <g key={i}>
                      <rect x={n.x} y={n.y} width={130} height={60} rx="8"
                        fill={n.color} fillOpacity={active ? 0.18 : 0.06}
                        stroke={n.color} strokeWidth={active ? 1.5 : 0.5}
                        style={{ transition: "all 0.4s" }} />
                      <text x={cx} y={cy - 8} textAnchor="middle"
                        fill={n.color} fontSize="12" fontWeight="500"
                        fontFamily="'IBM Plex Mono', monospace">{n.label}</text>
                      <text x={cx} y={cy + 10} textAnchor="middle"
                        fill={n.color} fontSize="10" opacity="0.65"
                        fontFamily="'IBM Plex Mono', monospace">{n.sub}</text>
                      {active && (
                        <circle cx={n.x + 120} cy={n.y + 10} r="4"
                          fill={n.color} opacity="0.9" />
                      )}
                    </g>
                  );
                })}
                {/* Center label */}
                <text x="280" y="148" textAnchor="middle"
                  fill="hsl(var(--muted-foreground))" fontSize="11"
                  fontFamily="'IBM Plex Mono', monospace">Digital twin</text>
                <text x="280" y="163" textAnchor="middle"
                  fill="hsl(var(--muted-foreground))" fontSize="11"
                  fontFamily="'IBM Plex Mono', monospace">feedback loop</text>
                {/* Step label */}
                <text x="280" y="270" textAnchor="middle"
                  fill="hsl(var(--muted-foreground))" fontSize="10"
                  fontFamily="'IBM Plex Mono', monospace">
                  {`Step ${loopStep + 1}/4 · ${["Ingesting SCADA / IoT data","Updating Bayesian model","Running P10/P50/P90 forecast","Calibrating model vs actual"][loopStep]}`}
                </text>
              </svg>
              <div className="grid grid-cols-4 gap-2 w-full">
                {[
                  { v: "6h",     l: "Cycle time",      c: "#3B8BD4" },
                  { v: "50K",    l: "MC iterations",   c: "#7F77DD" },
                  { v: "36 mo",  l: "Forecast horizon", c: "#1D9E75" },
                  { v: "< 3%",   l: "Calibration Δ",   c: "#EF9F27" },
                ].map((s, i) => (
                  <div key={i} className="p-2.5 bg-card rounded-lg text-center border"
                    style={{ borderColor: `${s.c}40` }}>
                    <div className="text-[18px] font-medium" style={{ color: s.c }}>{s.v}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground text-center leading-relaxed max-w-[460px]">
                Model accuracy improves automatically with each production data cycle.
                Bayesian posterior updates propagate through all 8 well simulations
                before the next operator dashboard refresh.
              </div>
            </div>
          )}

          {/* ═══ TAB 4 – LIVE EXAMPLE (Brawner 10-15) ═══ */}
          {tab === 4 && (
            <div className="flex flex-col gap-3.5">
              {/* Preset switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-card rounded-lg border border-border/50 self-start">
                {(["brawner", "ghawar"] as const).map(k => (
                  <button key={k}
                    onClick={() => { setPresetKey(k); setExStage(0); setExProgress(0); setExPlaying(true); }}
                    className={cn(
                      "text-[10px] px-3 py-1.5 rounded-md font-mono tracking-[0.08em] uppercase transition-all",
                      presetKey === k
                        ? "bg-primary/15 text-primary border border-primary/40"
                        : "text-muted-foreground hover:text-foreground"
                    )}>
                    {PRESETS[k].badge} · {PRESETS[k].well.operator}
                  </button>
                ))}
              </div>

              {/* Well header */}
              <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2.5 bg-card rounded-lg border border-border/50">
                <div>
                  <div className="text-[10px] text-muted-foreground tracking-[0.12em] uppercase">Case study · Live digital twin</div>
                  <div className="text-[15px] font-medium mt-0.5">
                    {EXAMPLE_WELL.name} <span className="text-muted-foreground text-[11px]">· {EXAMPLE_WELL.api}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {EXAMPLE_WELL.field} · {EXAMPLE_WELL.formation} · {EXAMPLE_WELL.depth} · {EXAMPLE_WELL.operator}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={resetExample}
                    className="text-[11px] px-3 py-1.5 rounded-md border border-emerald-400/40 bg-emerald-400/10 text-emerald-400 font-mono hover:bg-emerald-400/20 transition-colors">
                    ▶ Replay
                  </button>
                  <button onClick={() => setExPlaying(p => !p)}
                    className="text-[11px] px-3 py-1.5 rounded-md border border-border/50 bg-transparent text-muted-foreground font-mono hover:bg-muted/30 transition-colors">
                    {exPlaying ? "⏸ Pause" : "▶ Resume"}
                  </button>
                </div>
              </div>

              {/* Stage stepper */}
              <div className="grid grid-cols-5 gap-1.5">
                {EXAMPLE_STAGES.map((s, i) => {
                  const done = i < exStage;
                  const active = i === exStage;
                  const pct = done ? 100 : active ? exProgress * 100 : 0;
                  return (
                    <div key={s.key} className="flex flex-col gap-1">
                      <div className="h-[3px] rounded-full bg-border overflow-hidden">
                        <div className="h-full transition-all duration-100"
                          style={{ width: `${pct}%`, background: s.color }} />
                      </div>
                      <div className="text-[9px] tracking-[0.08em] uppercase"
                        style={{ color: done || active ? s.color : "hsl(var(--muted-foreground))" }}>
                        {i + 1}. {s.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active stage card */}
              <div className="p-3.5 bg-card rounded-lg border border-border/50"
                style={{ borderLeft: `3px solid ${EXAMPLE_STAGES[exStage].color}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: EXAMPLE_STAGES[exStage].color,
                      boxShadow: `0 0 0 4px ${EXAMPLE_STAGES[exStage].color}30` }} />
                  <span className="text-[12px] font-medium"
                    style={{ color: EXAMPLE_STAGES[exStage].color }}>
                    Stage {exStage + 1}/5 · {EXAMPLE_STAGES[exStage].label}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">{EXAMPLE_STAGES[exStage].sub}</div>
              </div>

              {/* Live KPIs (revealed as stages progress) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { unlock: 1, label: "Porosity (φ)",   val: `${EXAMPLE_WELL.porosity}%`,    c: "text-blue-400" },
                  { unlock: 1, label: "Permeability",   val: `${EXAMPLE_WELL.perm} md`,       c: "text-blue-400" },
                  { unlock: 1, label: "Reservoir P",    val: EXAMPLE_WELL.pres,               c: "text-blue-400" },
                  { unlock: 1, label: "Water sat.",     val: `${(EXAMPLE_WELL.sw*100).toFixed(0)}%`, c: "text-amber-400" },
                  { unlock: 2, label: "Pre-SPT rate",   val: EXAMPLE_WELL.qPre,               c: "text-red-400" },
                  { unlock: 2, label: "Post-SPT P50",   val: EXAMPLE_WELL.qPost,              c: "text-emerald-400" },
                  { unlock: 3, label: "NPV₁₀ (P50)",    val: preset.npv,                      c: "text-emerald-400" },
                  { unlock: 4, label: "Rank · Score",   val: presetKey === "ghawar" ? "#1 · 96" : "#1 · 92", c: "text-emerald-400" },
                ].map((k, i) => {
                  const visible = exStage >= k.unlock;
                  return (
                    <div key={i}
                      className="p-2.5 bg-card rounded-lg border border-border/50 transition-all duration-500"
                      style={{ opacity: visible ? 1 : 0.18, transform: visible ? "translateY(0)" : "translateY(4px)" }}>
                      <div className="text-[9px] text-muted-foreground mb-1 tracking-[0.1em] uppercase">{k.label}</div>
                      <div className={cn("text-[16px] font-medium font-mono", visible ? k.c : "text-muted-foreground")}>
                        {visible ? k.val : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Combined history + forecast chart (revealed at stage 2+) */}
              <div className="transition-opacity duration-700"
                style={{ opacity: exStage >= 2 ? 1 : 0.25 }}>
                <div className="text-[10px] text-muted-foreground mb-2 tracking-[0.08em] uppercase">
                  Production · 24-mo actual (red) → SPT event → 36-mo forecast P10 / P50 / P90
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={EXAMPLE_COMBINED} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="exP10" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(145 80% 50%)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="hsl(145 80% 50%)" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="exP90" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(0 85% 55%)" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="hsl(0 85% 55%)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity="0.4" />
                      <XAxis dataKey="month"
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono'" }}
                        label={{ value: "month", position: "insideBottomRight", offset: -4,
                          fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono'" }}
                        label={{ value: preset.rateUnit, angle: -90, position: "insideLeft",
                          fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))",
                        border: "0.5px solid hsl(var(--border))", fontSize: "11px",
                        fontFamily: "'IBM Plex Mono'" }} />
                      <Area type="monotone" dataKey="actual" stroke="hsl(0 85% 55%)" strokeWidth={2}
                        fill="hsl(0 85% 55%)" fillOpacity={0.1} name="Actual (pre-SPT)" />
                      <Area type="monotone" dataKey="p10" stroke="hsl(145 80% 50%)" strokeWidth={1.5}
                        fill="url(#exP10)" name="P10" />
                      <Area type="monotone" dataKey="p50" stroke="hsl(45 100% 55%)" strokeWidth={2}
                        fill="none" name="P50" />
                      <Area type="monotone" dataKey="p90" stroke="hsl(0 85% 55%)" strokeWidth={1}
                        fill="url(#exP90)" strokeDasharray="4 2" name="P90" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Final recommendation (stage 4) */}
              <div className="transition-all duration-700 p-3.5 rounded-lg border"
                style={{
                  opacity: exStage >= 4 ? 1 : 0.2,
                  borderColor: exStage >= 4 ? "hsl(145 80% 50% / 0.5)" : "hsl(var(--border))",
                  background: exStage >= 4 ? "hsl(145 80% 50% / 0.06)" : "hsl(var(--card))",
                }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span className="text-[12px] font-medium text-emerald-400">AI Smart Well Recommendation</span>
                </div>
                <div className="text-[12px] leading-relaxed">
                  <span className="text-muted-foreground">Proceed with </span>
                  <span className="text-emerald-400 font-medium">{preset.sptSpec}</span>
                  <span className="text-muted-foreground">. Expected rate uplift </span>
                  <span className="text-emerald-400 font-medium">{preset.upliftLabel}</span>
                  <span className="text-muted-foreground">. NPV₁₀ </span>
                  <span className="text-emerald-400 font-medium">{preset.npv} (P50)</span>
                  <span className="text-muted-foreground"> · IRR </span>
                  <span className="text-emerald-400 font-medium">{preset.irr}</span>
                  <span className="text-muted-foreground"> · payback </span>
                  <span className="text-emerald-400 font-medium">{preset.payback}</span>
                  <span className="text-muted-foreground">. Twin will re-calibrate every 6 h as new SCADA arrives.</span>
                </div>
                <div className="mt-2 pt-2 border-t border-emerald-400/15 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="text-emerald-400/80 font-medium">Why SPT here: </span>{preset.rationale}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
