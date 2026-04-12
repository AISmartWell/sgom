import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Eye, Play, RotateCcw, TrendingUp, Droplets, Zap,
  ArrowRight, CheckCircle2, Loader2, BarChart3,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend,
} from "recharts";

// ── Well presets ────────────────────────────────────────
const WELL_PRESETS = [
  {
    id: "well-5",
    name: "Well #5 — Mississippian Limestone",
    formation: "Mississippian Limestone",
    depth: 4850,
    porosity: 12.3,
    permeability: 8.5,
    waterCut: 45,
    currentOil: 18,
    gammaRay: 65,
    resistivity: 22,
  },
  {
    id: "well-3",
    name: "Well #3 — Hunton Group",
    formation: "Hunton Group",
    depth: 5200,
    porosity: 10.7,
    permeability: 5.2,
    waterCut: 62,
    currentOil: 11,
    gammaRay: 48,
    resistivity: 18,
  },
  {
    id: "well-9",
    name: "Well #9 — Arbuckle Dolomite",
    formation: "Arbuckle Dolomite",
    depth: 6100,
    porosity: 8.1,
    permeability: 3.8,
    waterCut: 71,
    currentOil: 7,
    gammaRay: 35,
    resistivity: 30,
  },
];

// ── Generate synthetic log data ────────────────────────
function generateLogData(preset: typeof WELL_PRESETS[0]) {
  const points = [];
  const baseDepth = preset.depth - 200;
  for (let i = 0; i <= 80; i++) {
    const d = baseDepth + i * 5;
    const noise = () => (Math.random() - 0.5) * 2;
    const zoneCenter = preset.depth;
    const distFromCenter = Math.abs(d - zoneCenter);
    const inZone = distFromCenter < 60;

    points.push({
      depth: d,
      grBefore: preset.gammaRay + noise() * 8 + (inZone ? -15 : 10),
      grAfter: preset.gammaRay + noise() * 6 + (inZone ? -20 : 8),
      rtBefore: preset.resistivity + noise() * 3 + (inZone ? 5 : -2),
      rtAfter: preset.resistivity + noise() * 2 + (inZone ? 12 : -1),
      phiBefore: preset.porosity + noise() * 1.5 + (inZone ? 2 : -1),
      phiAfter: preset.porosity + noise() * 1.2 + (inZone ? 4.5 : -0.5),
    });
  }
  return points;
}

// ── Production forecast ────────────────────────────────
function generateProductionForecast(preset: typeof WELL_PRESETS[0]) {
  const months: { month: number; label: string; baseline: number; postSPT: number }[] = [];
  const upliftFactor = 1 + (preset.porosity / 100) * 15 + (1 - preset.waterCut / 100) * 8;

  for (let m = -6; m <= 18; m++) {
    const baseDecline = preset.currentOil * Math.exp(-0.015 * (m + 6));
    let postSPT: number;
    if (m < 0) {
      postSPT = baseDecline;
    } else if (m === 0) {
      postSPT = preset.currentOil * upliftFactor * 0.6;
    } else {
      const peakOil = preset.currentOil * upliftFactor;
      postSPT = peakOil * Math.exp(-0.02 * m) + baseDecline * 0.3;
    }
    months.push({
      month: m,
      label: m === 0 ? "SPT" : `${m > 0 ? "+" : ""}${m}`,
      baseline: Math.max(1, Math.round(baseDecline * 10) / 10),
      postSPT: Math.max(1, Math.round(postSPT * 10) / 10),
    });
  }
  return months;
}

// ── Component ──────────────────────────────────────────
const CosmosPredictDemo = () => {
  const [selectedWell, setSelectedWell] = useState(WELL_PRESETS[0]);
  const [porosity, setPorosity] = useState(WELL_PRESETS[0].porosity);
  const [waterCut, setWaterCut] = useState(WELL_PRESETS[0].waterCut);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [logData, setLogData] = useState<ReturnType<typeof generateLogData>>([]);
  const [forecastData, setForecastData] = useState<ReturnType<typeof generateProductionForecast>>([]);

  const handleWellChange = useCallback((wellId: string) => {
    const preset = WELL_PRESETS.find((w) => w.id === wellId) ?? WELL_PRESETS[0];
    setSelectedWell(preset);
    setPorosity(preset.porosity);
    setWaterCut(preset.waterCut);
    setShowResults(false);
    setProgress(0);
  }, []);

  const runPrediction = useCallback(() => {
    setIsRunning(true);
    setShowResults(false);
    setProgress(0);

    const well = { ...selectedWell, porosity, waterCut };

    const steps = [10, 25, 40, 55, 70, 85, 95, 100];
    steps.forEach((p, i) => {
      setTimeout(() => {
        setProgress(p);
        if (p === 100) {
          setLogData(generateLogData(well));
          setForecastData(generateProductionForecast(well));
          setIsRunning(false);
          setShowResults(true);
        }
      }, (i + 1) * 350);
    });
  }, [selectedWell, porosity, waterCut]);

  const reset = () => {
    setShowResults(false);
    setProgress(0);
    handleWellChange(selectedWell.id);
  };

  // Derived metrics
  const peakUplift = showResults
    ? Math.round(
        ((Math.max(...forecastData.filter((d) => d.month >= 0).map((d) => d.postSPT)) /
          selectedWell.currentOil -
          1) *
          100)
      )
    : 0;

  const cumulativeGain = showResults
    ? Math.round(
        forecastData
          .filter((d) => d.month >= 0)
          .reduce((sum, d) => sum + (d.postSPT - d.baseline) * 30, 0)
      )
    : 0;

  const estimatedROI = showResults ? Math.round(cumulativeGain * 65 / 15000 * 100) : 0;

  return (
    <Card className="glass-card border-green-500/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <Eye className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <CardTitle className="text-xl">Cosmos Predict — Interactive Demo</CardTitle>
            <CardDescription>
              Simulate post-SPT formation behavior before Maxxwell arrives on site
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Input Panel ─────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Well selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Well</label>
            <Select value={selectedWell.id} onValueChange={handleWellChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WELL_PRESETS.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Porosity slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Porosity: {porosity.toFixed(1)}%</label>
            <Slider
              value={[porosity]}
              min={3}
              max={25}
              step={0.1}
              onValueChange={([v]) => setPorosity(v)}
            />
          </div>

          {/* Water cut slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Water Cut: {waterCut}%</label>
            <Slider
              value={[waterCut]}
              min={10}
              max={95}
              step={1}
              onValueChange={([v]) => setWaterCut(v)}
            />
          </div>
        </div>

        {/* Well info badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Formation: {selectedWell.formation}</Badge>
          <Badge variant="outline">Depth: {selectedWell.depth} ft</Badge>
          <Badge variant="outline">Perm: {selectedWell.permeability} mD</Badge>
          <Badge variant="outline">Current: {selectedWell.currentOil} BOPD</Badge>
          <Badge variant="outline">GR: {selectedWell.gammaRay} API</Badge>
          <Badge variant="outline">RT: {selectedWell.resistivity} Ω·m</Badge>
        </div>

        {/* Run / Reset */}
        <div className="flex items-center gap-3">
          <Button
            onClick={runPrediction}
            disabled={isRunning}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isRunning ? "Running Cosmos Predict…" : "Run Prediction"}
          </Button>
          {showResults && (
            <Button variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          )}
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {progress < 30
                  ? "Loading well state into Cosmos…"
                  : progress < 60
                  ? "Physics-aware simulation running…"
                  : progress < 90
                  ? "Generating post-SPT log response…"
                  : "Finalizing production forecast…"}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Results ─────────────────────────── */}
        {showResults && (
          <>
            <Separator />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Peak Uplift", value: `+${peakUplift}%`, icon: TrendingUp, color: "text-green-400" },
                { label: "18-mo Cum. Gain", value: `${cumulativeGain.toLocaleString()} bbl`, icon: BarChart3, color: "text-blue-400" },
                { label: "Est. ROI", value: `${estimatedROI}%`, icon: Zap, color: "text-yellow-400" },
                { label: "Water Cut Δ", value: `−${Math.round(waterCut * 0.18)}%`, icon: Droplets, color: "text-cyan-400" },
              ].map((kpi) => (
                <div key={kpi.label} className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center">
                  <kpi.icon className={`h-5 w-5 mx-auto mb-1 ${kpi.color}`} />
                  <div className="text-lg font-bold">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Log Curves: Before vs After */}
            <Card className="border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-400" />
                  Predicted Log Response — Before vs After SPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* GR */}
                  <div>
                    <p className="text-xs text-center text-muted-foreground mb-1">Gamma Ray (API)</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={logData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis type="number" domain={[0, 120]} tick={{ fontSize: 10 }} />
                        <YAxis dataKey="depth" type="number" reversed tick={{ fontSize: 10 }} domain={["dataMin", "dataMax"]} />
                        <Tooltip />
                        <Line dataKey="grBefore" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={1.5} name="Before" />
                        <Line dataKey="grAfter" stroke="#22c55e" dot={false} strokeWidth={2} name="After SPT" />
                        <ReferenceLine y={selectedWell.depth} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "SPT Zone", fontSize: 10, fill: "#f59e0b" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Resistivity */}
                  <div>
                    <p className="text-xs text-center text-muted-foreground mb-1">Resistivity (Ω·m)</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={logData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="depth" type="number" reversed tick={{ fontSize: 10 }} domain={["dataMin", "dataMax"]} />
                        <Tooltip />
                        <Line dataKey="rtBefore" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={1.5} name="Before" />
                        <Line dataKey="rtAfter" stroke="#3b82f6" dot={false} strokeWidth={2} name="After SPT" />
                        <ReferenceLine y={selectedWell.depth} stroke="#f59e0b" strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Porosity */}
                  <div>
                    <p className="text-xs text-center text-muted-foreground mb-1">Porosity (%)</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={logData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="depth" type="number" reversed tick={{ fontSize: 10 }} domain={["dataMin", "dataMax"]} />
                        <Tooltip />
                        <Line dataKey="phiBefore" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={1.5} name="Before" />
                        <Line dataKey="phiAfter" stroke="#a855f7" dot={false} strokeWidth={2} name="After SPT" />
                        <ReferenceLine y={selectedWell.depth} stroke="#f59e0b" strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-muted-foreground inline-block" /> Before SPT</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> After SPT (predicted)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 inline-block border-dashed" /> SPT Zone</span>
                </div>
              </CardContent>
            </Card>

            {/* Production Forecast */}
            <Card className="border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  Production Forecast — 18-Month Outlook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: "BOPD", angle: -90, position: "insideLeft", fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine x="SPT" stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "SPT Treatment", fontSize: 11, fill: "#f59e0b", position: "top" }} />
                    <Area dataKey="baseline" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} strokeWidth={1.5} name="Baseline (no SPT)" />
                    <Area dataKey="postSPT" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} name="Post-SPT (Cosmos)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cosmos Reasoning */}
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Cosmos Predict — Verdict
              </h4>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{selectedWell.name}</span> shows
                strong SPT candidacy. The {selectedWell.formation} at {selectedWell.depth} ft has{" "}
                {porosity.toFixed(1)}% porosity and {selectedWell.permeability} mD permeability —
                physics simulation predicts <span className="text-green-400 font-semibold">+{peakUplift}% peak production uplift</span> with{" "}
                <span className="text-blue-400 font-semibold">{cumulativeGain.toLocaleString()} bbl</span> cumulative gain
                over 18 months. Estimated ROI: <span className="text-yellow-400 font-semibold">{estimatedROI}%</span>.
                Water cut expected to decrease by ~{Math.round(waterCut * 0.18)}% due to improved drainage geometry.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Powered by NVIDIA Cosmos World Foundation Model — physics-aware temporal simulation
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CosmosPredictDemo;
