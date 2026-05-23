import { useState, useEffect, useRef, useMemo } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Activity, Brain, Gauge, Play, Pause } from "lucide-react";

// ─── Deterministic hash (no Math.random) ─────────────────────────────────────
function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function seededRand(seed: number): number {
  // simple LCG; returns [0,1)
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function gaussian(seed: number): number {
  // Box–Muller via seeded uniforms
  const u1 = Math.max(seededRand(seed), 1e-9);
  const u2 = seededRand(seed + 1);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ─── Wells (Arps DCA params) ─────────────────────────────────────────────────
const WELLS = [
  { id: "W-001", name: "Brawner 10-15",  field: "Oklahoma Basin",  depth: 6840, qi: 108, Di: 0.00014, b: 0.52 },
  { id: "W-002", name: "Bysener 10-15",  field: "Oklahoma Basin",  depth: 6720, qi:  94, Di: 0.00018, b: 0.48 },
  { id: "W-003", name: "Caldera 22-9",   field: "Permian Delaware", depth: 9120, qi: 142, Di: 0.00021, b: 0.61 },
  { id: "W-004", name: "Eagle Ford 31",  field: "Eagle Ford Shale", depth: 8400, qi: 165, Di: 0.00025, b: 0.55 },
];

// Arps hyperbolic: q(t) = qi / (1 + b*Di*t)^(1/b)
function arps(qi: number, Di: number, b: number, tDays: number) {
  return qi / Math.pow(1 + b * Di * tDays, 1 / b);
}

const HISTORY_LIMIT = 140;

export default function BayesianDCA() {
  const [wellId, setWellId] = useState(WELLS[0].id);
  const [running, setRunning] = useState(true);
  const [uncertainty, setUncertainty] = useState(1.5);
  const [intervalSec, setIntervalSec] = useState(1.2);
  const [tick, setTick] = useState(0);
  const [history, setHistory] = useState<Array<{
    t: number; day: number; qActual: number; qForecast: number; lower: number; upper: number;
  }>>([]);
  const startRef = useRef(Date.now());

  const well = useMemo(() => WELLS.find(w => w.id === wellId)!, [wellId]);

  // reset history when well changes
  useEffect(() => {
    setHistory([]);
    setTick(0);
    startRef.current = Date.now();
  }, [wellId]);

  // streaming loop
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick(t => t + 1), intervalSec * 1000);
    return () => clearInterval(id);
  }, [running, intervalSec]);

  useEffect(() => {
    const seedBase = stableHash(well.id) + tick;
    const day = tick * 2; // each tick = 2 simulated days
    const qForecast = arps(well.qi, well.Di, well.b, day);
    // actual = forecast + seeded Gaussian noise * σ-factor
    const noise = gaussian(seedBase) * uncertainty * (well.qi * 0.04);
    const qActual = Math.max(0, qForecast + noise);
    const band = uncertainty * (well.qi * 0.06);
    const point = {
      t: tick,
      day,
      qActual: +qActual.toFixed(2),
      qForecast: +qForecast.toFixed(2),
      lower: +(qForecast - band).toFixed(2),
      upper: +(qForecast + band).toFixed(2),
    };
    setHistory(h => {
      const next = [...h, point];
      return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
    });
  }, [tick, well, uncertainty]);

  const latest = history[history.length - 1];
  const accuracy = useMemo(() => {
    if (history.length < 5) return 0;
    const slice = history.slice(-30);
    const mape = slice.reduce((s, p) => s + Math.abs(p.qActual - p.qForecast) / Math.max(p.qForecast, 1), 0) / slice.length;
    return Math.max(0, Math.min(100, (1 - mape) * 100));
  }, [history]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-primary/20 text-primary border-primary/30">Stage 4+</Badge>
            <Badge variant="outline" className="border-accent/40 text-accent">Bayesian DCA</Badge>
            <Badge variant="outline">Demo Mode</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Bayesian Production Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time Arps decline curve forecast with uncertainty bands · AI Smart Well Platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={running ? "secondary" : "default"}
            onClick={() => setRunning(r => !r)}
          >
            {running ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />Resume</>}
          </Button>
        </div>
      </div>

      {/* Well selector */}
      <div className="flex flex-wrap gap-2">
        {WELLS.map(w => (
          <Button
            key={w.id}
            variant={w.id === wellId ? "default" : "outline"}
            size="sm"
            onClick={() => setWellId(w.id)}
          >
            {w.name}
            <span className="ml-2 text-xs opacity-70">{w.field}</span>
          </Button>
        ))}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Current Rate" value={latest ? `${latest.qActual.toFixed(1)} bbl/d` : "—"} icon={<Activity className="h-4 w-4" />} />
        <KpiCard label="Forecast" value={latest ? `${latest.qForecast.toFixed(1)} bbl/d` : "—"} icon={<Gauge className="h-4 w-4" />} />
        <KpiCard label="Model Accuracy" value={`${accuracy.toFixed(1)}%`} accent />
        <KpiCard label="Samples" value={`${history.length}/${HISTORY_LIMIT}`} />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Production Forecast vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 420, minHeight: 420 }}>
            <ResponsiveContainer>
              <ComposedChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }}
                  label={{ value: "Days on production", position: "insideBottom", offset: -2, fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }}
                  label={{ value: "bbl/d", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandFill)" name="Confidence band" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" />
                <Line type="monotone" dataKey="qForecast" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Forecast (Arps)" />
                <Line type="monotone" dataKey="qActual" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Actual" />
                {latest && <ReferenceLine x={latest.day} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 4" />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Uncertainty σ-Factor: ×{uncertainty.toFixed(1)}</CardTitle></CardHeader>
          <CardContent>
            <Slider value={[uncertainty]} min={0.2} max={4} step={0.1}
              onValueChange={v => setUncertainty(v[0])} />
            <p className="text-xs text-muted-foreground mt-2">
              Scales the Bayesian confidence band (lower = more confident model).
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Update Interval: {intervalSec.toFixed(1)} s</CardTitle></CardHeader>
          <CardContent>
            <Slider value={[intervalSec]} min={0.3} max={3} step={0.1}
              onValueChange={v => setIntervalSec(v[0])} />
            <p className="text-xs text-muted-foreground mt-2">
              Simulated telemetry tick rate (each tick = 2 production days).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Well params */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Arps Parameters · {well.name}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <Param label="Field" value={well.field} />
          <Param label="Depth" value={`${well.depth.toLocaleString()} ft`} />
          <Param label="qi" value={`${well.qi} bbl/d`} />
          <Param label="Di" value={well.Di.toExponential(2)} />
          <Param label="b" value={well.b.toFixed(2)} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        AI Smart Well, Inc. © 2026 · Bayesian DCA · Demo Mode (deterministic seeded noise)
      </p>
    </div>
  );
}

function KpiCard({ label, value, icon, accent }: { label: string; value: string; icon?: React.ReactNode; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {icon}{label}
        </div>
        <div className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Param({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-foreground">{value}</div>
    </div>
  );
}
