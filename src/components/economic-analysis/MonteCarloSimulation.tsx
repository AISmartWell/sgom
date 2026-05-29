import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Dice5, TrendingUp, AlertTriangle, ShieldCheck, Cpu } from "lucide-react";
import TornadoChart from "./TornadoChart";
import { useMonteCarloExport, ExportPDFButton } from "./MonteCarloExport";
import type { MCWorkerInput, MCWorkerProgress, MCWorkerResult } from "@/workers/monteCarlo.worker";

interface Props {
  baseOilPrice: number;
  baseTreatmentCost: number;
  baseOpex: number;
  wells: { name: string; addedProd: number; Di: number; b: number }[];
}

interface SimStats {
  bins: { range: string; count: number; midpoint: number }[];
  mean: number;
  stdDev: number;
  p10: number; p25: number; p50: number; p75: number; p90: number;
  probPositive: number; probOver100: number; probOver200: number;
  iterations: number;
  elapsedMs: number;
}

function summarize(sorted: Float64Array, elapsedMs: number): SimStats {
  const n = sorted.length;
  const min = Math.floor(sorted[0] / 25) * 25;
  const max = Math.ceil(sorted[n - 1] / 25) * 25;
  const bins: { range: string; count: number; midpoint: number }[] = [];
  // Linear binning pass (sorted array → walk pointer)
  let idx = 0;
  for (let lo = min; lo < max; lo += 25) {
    let count = 0;
    while (idx < n && sorted[idx] < lo + 25) { count++; idx++; }
    bins.push({ range: `${lo}–${lo + 25}%`, count, midpoint: lo + 12.5 });
  }

  let sum = 0;
  for (let i = 0; i < n; i++) sum += sorted[i];
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (sorted[i] - mean) ** 2;
  const stdDev = Math.sqrt(varSum / n);

  let pos = 0, over100 = 0, over200 = 0;
  for (let i = 0; i < n; i++) {
    if (sorted[i] > 0) pos++;
    if (sorted[i] > 100) over100++;
    if (sorted[i] > 200) over200++;
  }

  return {
    bins, mean, stdDev,
    p10: sorted[Math.floor(n * 0.1)],
    p25: sorted[Math.floor(n * 0.25)],
    p50: sorted[Math.floor(n * 0.5)],
    p75: sorted[Math.floor(n * 0.75)],
    p90: sorted[Math.floor(n * 0.9)],
    probPositive: (pos / n) * 100,
    probOver100: (over100 / n) * 100,
    probOver200: (over200 / n) * 100,
    iterations: n,
    elapsedMs,
  };
}

const MonteCarloSimulation = ({ baseOilPrice, baseTreatmentCost, baseOpex, wells }: Props) => {
  const [iterations, setIterations] = useState(10000);
  const [priceVolatility, setPriceVolatility] = useState(15);
  const [costVolatility, setCostVolatility] = useState(15000);
  const [seed, setSeed] = useState(42);
  const [results, setResults] = useState<SimStats | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  const { exporting, exportPDF, refs } = useMonteCarloExport();

  useEffect(() => {
    const worker = new Worker(new URL("@/workers/monteCarlo.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    setRunning(true);
    setProgress(0);

    const onMessage = (e: MessageEvent<MCWorkerProgress | MCWorkerResult>) => {
      const msg = e.data;
      if (msg.type === "progress") {
        setProgress((msg.done / msg.total) * 100);
      } else if (msg.type === "result") {
        setResults(summarize(msg.rois, msg.elapsedMs));
        setRunning(false);
        setProgress(100);
      }
    };
    worker.addEventListener("message", onMessage);

    const input: MCWorkerInput = {
      type: "run",
      wells,
      basePrice: baseOilPrice,
      baseCost: baseTreatmentCost,
      baseOpex,
      priceStd: priceVolatility,
      costStd: costVolatility,
      opexStd: 4,
      diStd: 0.008,
      iterations,
      seed,
    };
    worker.postMessage(input);

    return () => worker.removeEventListener("message", onMessage);
  }, [wells, baseOilPrice, baseTreatmentCost, baseOpex, priceVolatility, costVolatility, iterations, seed]);

  // Placeholder while first run completes
  const safe = results ?? {
    bins: [], mean: 0, stdDev: 0,
    p10: 0, p25: 0, p50: 0, p75: 0, p90: 0,
    probPositive: 0, probOver100: 0, probOver200: 0,
    iterations, elapsedMs: 0,
  };


  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Monte Carlo Risk Analysis</h3>
        <ExportPDFButton exporting={exporting} onClick={exportPDF} />
      </div>

      {/* Parameters */}
      <div ref={refs.paramsRef}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Dice5 className="h-4 w-4 text-primary" />
              Simulation Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Oil Price σ: <span className="font-semibold text-foreground">±${priceVolatility}/bbl</span>
                </label>
                <Slider value={[priceVolatility]} onValueChange={([v]) => setPriceVolatility(v)} min={5} max={30} step={1} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  CAPEX σ: <span className="font-semibold text-foreground">±${(costVolatility / 1000).toFixed(0)}K</span>
                </label>
                <Slider value={[costVolatility]} onValueChange={([v]) => setCostVolatility(v)} min={5000} max={50000} step={5000} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Iterations: <span className="font-semibold text-foreground">{iterations.toLocaleString()}</span>
                </label>
                <Slider value={[iterations]} onValueChange={([v]) => setIterations(v)} min={1000} max={50000} step={1000} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              Parameters varied: Oil Price (N(μ={baseOilPrice}, σ={priceVolatility})), CAPEX (N(μ={baseTreatmentCost/1000}K, σ={costVolatility/1000}K)), OPEX (N(μ={baseOpex}, σ=4)), Di (N(μ=well.Di, σ=0.008))
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Cpu className={`h-4 w-4 ${running ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <Progress value={progress} className="h-1.5" />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground min-w-[140px] text-right">
                {running
                  ? `Running… ${progress.toFixed(0)}%`
                  : `${safe.iterations.toLocaleString()} iters · ${safe.elapsedMs.toFixed(0)} ms (Web Worker)`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* KPI row */}
      <div ref={refs.kpiRef}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-3 text-center">
              <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Mean ROI</p>
              <p className="text-2xl font-bold">{safe.mean.toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">σ = {safe.stdDev.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <ShieldCheck className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">P(ROI &gt; 0%)</p>
              <p className="text-2xl font-bold">{safe.probPositive.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">P(ROI &gt; 100%)</p>
              <p className="text-2xl font-bold">{safe.probOver100.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="pt-4 pb-3 text-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">P(ROI &gt; 200%)</p>
              <p className="text-2xl font-bold">{safe.probOver200.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Histogram */}
      <div ref={refs.histogramRef}>
        <Card>
          <CardHeader>
            <CardTitle>ROI Distribution ({iterations.toLocaleString()} simulations)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={safe.bins} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: "Frequency", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <ReferenceLine x={safe.bins.findIndex(b => b.midpoint >= safe.p50) >= 0 ? safe.bins[safe.bins.findIndex(b => b.midpoint >= safe.p50)]?.range : undefined} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="4 4" label={{ value: "P50", position: "top", fill: "hsl(var(--primary))" }} />
                <Bar dataKey="count" name="Scenarios" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Percentiles table */}
      <div ref={refs.percentilesRef}>
        <Card>
          <CardHeader><CardTitle className="text-sm">Percentile Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              {[
                { label: "P10 (Downside)", value: safe.p10, color: "text-red-400" },
                { label: "P25", value: safe.p25, color: "text-orange-400" },
                { label: "P50 (Median)", value: safe.p50, color: "text-foreground" },
                { label: "P75", value: safe.p75, color: "text-green-400" },
                { label: "P90 (Upside)", value: safe.p90, color: "text-green-500" },
              ].map((p) => (
                <div key={p.label} className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{p.label}</p>
                  <p className={`text-xl font-bold font-mono ${p.color}`}>{p.value.toFixed(0)}%</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              P10 = 90% chance of doing better. P90 = only 10% chance of exceeding this ROI.
              <button onClick={() => setSeed(s => s + 1)} className="ml-2 underline text-primary hover:text-primary/80">Re-roll seed</button>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tornado Chart */}
      <div ref={refs.tornadoRef}>
        <TornadoChart
          baseOilPrice={baseOilPrice}
          baseTreatmentCost={baseTreatmentCost}
          baseOpex={baseOpex}
          wells={wells}
        />
      </div>
    </div>
  );
};

export default MonteCarloSimulation;
