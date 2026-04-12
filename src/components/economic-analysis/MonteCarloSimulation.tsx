import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Dice5, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { arpsRate } from "@/lib/economics-config";
import TornadoChart from "./TornadoChart";

interface Props {
  baseOilPrice: number;
  baseTreatmentCost: number;
  baseOpex: number;
  wells: { name: string; addedProd: number; Di: number; b: number }[];
}

// Seeded pseudo-random (Mulberry32) for reproducibility
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller for normal distribution
function normalRandom(rand: () => number, mean: number, stdDev: number): number {
  const u1 = rand();
  const u2 = rand();
  return mean + stdDev * Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

function runSimulation(
  wells: Props["wells"],
  basePrice: number,
  baseCost: number,
  baseOpex: number,
  priceStd: number,
  costStd: number,
  opexStd: number,
  diStd: number,
  iterations: number,
  seed: number,
): number[] {
  const rand = mulberry32(seed);
  const rois: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const price = Math.max(20, normalRandom(rand, basePrice, priceStd));
    const cost = Math.max(10000, normalRandom(rand, baseCost, costStd));
    const opex = Math.max(2, normalRandom(rand, baseOpex, opexStd));

    let totalNet = 0;
    let totalCapex = 0;

    for (const w of wells) {
      const di = Math.max(0.005, normalRandom(rand, w.Di, diStd));
      let fiveYearNet = 0;
      for (let m = 1; m <= 60; m++) {
        const rate = arpsRate(w.addedProd, di, w.b, m);
        fiveYearNet += rate * 30.44 * (price - opex);
      }
      totalNet += fiveYearNet;
      totalCapex += cost;
    }

    const roi = totalCapex > 0 ? ((totalNet - totalCapex) / totalCapex) * 100 : 0;
    rois.push(roi);
  }

  return rois.sort((a, b) => a - b);
}

const MonteCarloSimulation = ({ baseOilPrice, baseTreatmentCost, baseOpex, wells }: Props) => {
  const [iterations, setIterations] = useState(5000);
  const [priceVolatility, setPriceVolatility] = useState(15); // $/bbl std dev
  const [costVolatility, setCostVolatility] = useState(15000); // $ std dev
  const [seed, setSeed] = useState(42);

  const results = useMemo(() => {
    const rois = runSimulation(
      wells, baseOilPrice, baseTreatmentCost, baseOpex,
      priceVolatility, costVolatility, 4, 0.008,
      iterations, seed,
    );

    // Histogram bins
    const min = Math.floor(rois[0] / 25) * 25;
    const max = Math.ceil(rois[rois.length - 1] / 25) * 25;
    const bins: { range: string; count: number; midpoint: number }[] = [];
    for (let lo = min; lo < max; lo += 25) {
      const count = rois.filter((r) => r >= lo && r < lo + 25).length;
      bins.push({ range: `${lo}–${lo + 25}%`, count, midpoint: lo + 12.5 });
    }

    const mean = rois.reduce((s, r) => s + r, 0) / rois.length;
    const variance = rois.reduce((s, r) => s + (r - mean) ** 2, 0) / rois.length;
    const stdDev = Math.sqrt(variance);
    const p10 = rois[Math.floor(rois.length * 0.1)];
    const p25 = rois[Math.floor(rois.length * 0.25)];
    const p50 = rois[Math.floor(rois.length * 0.5)];
    const p75 = rois[Math.floor(rois.length * 0.75)];
    const p90 = rois[Math.floor(rois.length * 0.9)];
    const probPositive = (rois.filter((r) => r > 0).length / rois.length) * 100;
    const probOver100 = (rois.filter((r) => r > 100).length / rois.length) * 100;
    const probOver200 = (rois.filter((r) => r > 200).length / rois.length) * 100;

    return { bins, mean, stdDev, p10, p25, p50, p75, p90, probPositive, probOver100, probOver200 };
  }, [wells, baseOilPrice, baseTreatmentCost, baseOpex, priceVolatility, costVolatility, iterations, seed]);

  return (
    <div className="space-y-6">
      {/* Parameters */}
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
              <Slider value={[iterations]} onValueChange={([v]) => setIterations(v)} min={1000} max={10000} step={1000} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 italic">
            Parameters varied: Oil Price (N(μ={baseOilPrice}, σ={priceVolatility})), CAPEX (N(μ={baseTreatmentCost/1000}K, σ={costVolatility/1000}K)), OPEX (N(μ={baseOpex}, σ=4)), Di (N(μ=well.Di, σ=0.008))
          </p>
        </CardContent>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Mean ROI</p>
            <p className="text-2xl font-bold">{results.mean.toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground">σ = {results.stdDev.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <ShieldCheck className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">P(ROI &gt; 0%)</p>
            <p className="text-2xl font-bold">{results.probPositive.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">P(ROI &gt; 100%)</p>
            <p className="text-2xl font-bold">{results.probOver100.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">P(ROI &gt; 200%)</p>
            <p className="text-2xl font-bold">{results.probOver200.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Histogram */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Distribution ({iterations.toLocaleString()} simulations)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={results.bins} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 10 }} />
              <YAxis label={{ value: "Frequency", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <ReferenceLine x={results.bins.findIndex(b => b.midpoint >= results.p50) >= 0 ? results.bins[results.bins.findIndex(b => b.midpoint >= results.p50)]?.range : undefined} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="4 4" label={{ value: "P50", position: "top", fill: "hsl(var(--primary))" }} />
              <Bar dataKey="count" name="Scenarios" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Percentiles table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Percentile Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            {[
              { label: "P10 (Downside)", value: results.p10, color: "text-red-400" },
              { label: "P25", value: results.p25, color: "text-orange-400" },
              { label: "P50 (Median)", value: results.p50, color: "text-foreground" },
              { label: "P75", value: results.p75, color: "text-green-400" },
              { label: "P90 (Upside)", value: results.p90, color: "text-green-500" },
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

      {/* Tornado Chart */}
      <TornadoChart
        baseOilPrice={baseOilPrice}
        baseTreatmentCost={baseTreatmentCost}
        baseOpex={baseOpex}
        wells={wells}
      />
    </div>
  );
};

export default MonteCarloSimulation;
