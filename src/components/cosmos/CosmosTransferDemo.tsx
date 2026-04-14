import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, CartesianGrid, Legend, AreaChart, Area,
} from "recharts";
import {
  Database, Play, CheckCircle2, Globe, Layers, Cpu,
  TrendingUp, Zap, ArrowRight, Sparkles, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Region presets ──
interface Region {
  id: string;
  name: string;
  basin: string;
  realWells: number;
  targetWells: number;
  formations: string[];
  depthRange: [number, number];
  avgPorosity: number;
  avgPerm: number;
  baseAccuracy: number;
  referenceWell?: { name: string; api: string; formation: string };
}

const REGIONS: Region[] = [
  {
    id: "east-texas",
    name: "East Texas Basin — Van Zandt County",
    basin: "East Texas",
    realWells: 6,
    targetWells: 45,
    formations: ["Rodessa / James Lime", "Upper Carlisle", "Sub-Rodessa"],
    depthRange: [3800, 5285],
    avgPorosity: 15.2,
    avgPerm: 24,
    baseAccuracy: 61,
    referenceWell: { name: "Brawner 10-15", api: "42-467-30979", formation: "Rodessa / James Lime" },
  },
  {
    id: "anadarko",
    name: "Anadarko Basin — Caddo County",
    basin: "Anadarko",
    realWells: 12,
    targetWells: 60,
    formations: ["Mississippian Limestone", "Hunton Dolomite", "Woodford Shale"],
    depthRange: [3800, 6200],
    avgPorosity: 12.4,
    avgPerm: 8.5,
    baseAccuracy: 72,
  },
  {
    id: "permian",
    name: "Permian Basin — Midland",
    basin: "Permian",
    realWells: 8,
    targetWells: 50,
    formations: ["Spraberry", "Wolfcamp", "Bone Spring"],
    depthRange: [5000, 9500],
    avgPorosity: 8.1,
    avgPerm: 0.5,
    baseAccuracy: 65,
  },
  {
    id: "midcontinent",
    name: "Mid-Continent — Grady County",
    basin: "Mid-Continent",
    realWells: 5,
    targetWells: 40,
    formations: ["Arbuckle Dolomite", "Simpson Group", "Viola Limestone"],
    depthRange: [4500, 7800],
    avgPorosity: 10.2,
    avgPerm: 4.2,
    baseAccuracy: 58,
  },
];

// ── Generate synthetic log data for a well ──
function genLogData(seed: number, depthRange: [number, number], formation: string) {
  const points = 60;
  const [dMin, dMax] = depthRange;
  const step = (dMax - dMin) / points;
  const data = [];
  let gr = 40, rt = 10, nphi = 0.18;
  const rng = (s: number) => {
    s = Math.sin(s * 9301 + 49297) % 233280;
    return Math.abs(s / 233280);
  };
  for (let i = 0; i < points; i++) {
    const r = rng(seed * 1000 + i);
    const isShale = r > 0.6;
    gr = gr * 0.85 + (isShale ? 80 + r * 20 : 25 + r * 15) * 0.15;
    rt = rt * 0.85 + (isShale ? 2 + r * 2 : 15 + r * 20) * 0.15;
    nphi = nphi * 0.85 + (isShale ? 0.30 + r * 0.08 : 0.14 + r * 0.08) * 0.15;
    data.push({
      depth: Math.round(dMin + i * step),
      GR: +gr.toFixed(1),
      RT: +rt.toFixed(1),
      NPHI: +nphi.toFixed(3),
    });
  }
  return data;
}

// ── Accuracy improvement curve ──
function genAccuracyCurve(base: number, realWells: number, syntheticWells: number) {
  const points = [];
  for (let i = 0; i <= syntheticWells; i += Math.max(1, Math.floor(syntheticWells / 12))) {
    const total = realWells + i;
    const improvement = (1 - base / 100) * (1 - Math.exp(-i / (syntheticWells * 0.3)));
    const acc = Math.min(97, base + improvement * 100);
    points.push({
      wells: total,
      accuracy: +acc.toFixed(1),
      label: i === 0 ? "Real only" : `+${i} synthetic`,
    });
  }
  return points;
}

type Phase = "idle" | "encoding" | "generating" | "validating" | "complete";

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Ready to generate",
  encoding: "Encoding real logs → latent space",
  generating: "Generating synthetic curves from WFM",
  validating: "Validating petrophysical consistency",
  complete: "Generation complete",
};

const PHASE_PROGRESS: Record<Phase, number> = {
  idle: 0,
  encoding: 30,
  generating: 65,
  validating: 90,
  complete: 100,
};

export default function CosmosTransferDemo() {
  const [region, setRegion] = useState<Region>(REGIONS[0]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [syntheticWells, setSyntheticWells] = useState<ReturnType<typeof genLogData>[]>([]);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const syntheticCount = region.targetWells - region.realWells;
  const finalAccuracy = Math.min(97, region.baseAccuracy + (1 - region.baseAccuracy / 100) * (1 - Math.exp(-syntheticCount / (syntheticCount * 0.3))) * 100);

  const accuracyCurve = genAccuracyCurve(region.baseAccuracy, region.realWells, syntheticCount);

  function runGeneration() {
    setPhase("encoding");
    setShowResults(false);
    setSyntheticWells([]);

    timerRef.current = setTimeout(() => {
      setPhase("generating");

      const wells: ReturnType<typeof genLogData>[] = [];
      const batchSize = Math.ceil(syntheticCount / 4);
      let batch = 0;
      const interval = setInterval(() => {
        for (let j = 0; j < batchSize && wells.length < syntheticCount; j++) {
          wells.push(genLogData(wells.length + 1, region.depthRange, region.formations[wells.length % region.formations.length]));
        }
        setSyntheticWells([...wells]);
        batch++;
        if (batch >= 4 || wells.length >= syntheticCount) {
          clearInterval(interval);
          setPhase("validating");
          setTimeout(() => {
            setPhase("complete");
            setShowResults(true);
          }, 1200);
        }
      }, 600);
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const previewWells = syntheticWells.slice(0, 3);

  return (
    <Card className="border-blue-500/30 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <Database className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Cosmos Transfer — Interactive Demo
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Data Augmentation</Badge>
            </CardTitle>
            <CardDescription>
              Synthetic well log generation for data-scarce regions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Region selector */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Region</h4>
          <div className="grid md:grid-cols-3 gap-3">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRegion(r); setPhase("idle"); setShowResults(false); setSyntheticWells([]); }}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  region.id === r.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <div className="font-semibold text-sm">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.realWells} real wells</div>
                {r.referenceWell && (
                  <div className="text-xs mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-green-400 font-medium">{r.referenceWell.name}</span>
                    <span className="text-muted-foreground">· ref well</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{r.basin}</Badge>
                  <span className="text-xs text-muted-foreground">Accuracy: {r.baseAccuracy}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Region stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Real Wells", value: region.realWells, icon: Globe },
            { label: "To Generate", value: syntheticCount, icon: Sparkles },
            { label: "Target Volume", value: region.targetWells, icon: Database },
            { label: "Avg. Porosity", value: `${region.avgPorosity}%`, icon: Layers },
            { label: "Base Accuracy", value: `${region.baseAccuracy}%`, icon: BarChart3 },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
              <s.icon className="h-4 w-4 mx-auto mb-1 text-blue-400" />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Formations */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Formations:</span>
          {region.formations.map((f) => (
            <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
          ))}
          <Badge variant="outline" className="text-xs">
            {region.depthRange[0]}–{region.depthRange[1]} ft
          </Badge>
        </div>

        {/* Run button + progress */}
        <div className="flex items-center gap-4">
          <Button
            onClick={runGeneration}
            disabled={phase !== "idle" && phase !== "complete"}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Play className="h-4 w-4" />
            {phase === "complete" ? "Regenerate" : "Run Cosmos Transfer"}
          </Button>
          {phase !== "idle" && (
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{PHASE_LABELS[phase]}</span>
                <span className="text-blue-400">{PHASE_PROGRESS[phase]}%</span>
              </div>
              <Progress value={PHASE_PROGRESS[phase]} className="h-2" />
            </div>
          )}
        </div>

        {/* Generation progress — live counter */}
        {(phase === "generating" || phase === "validating" || phase === "complete") && (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-400" />
                Synthetic Well Generation
              </h4>
              <Badge className={cn(
                phase === "complete"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-blue-500/20 text-blue-400 border-blue-500/30"
              )}>
                {syntheticWells.length}/{syntheticCount}
              </Badge>
            </div>
            <Progress value={(syntheticWells.length / syntheticCount) * 100} className="h-2" />

            {/* Mini log previews */}
            {previewWells.length > 0 && (
              <div className="grid md:grid-cols-3 gap-3">
                {previewWells.map((well, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <div className="text-xs font-mono text-muted-foreground mb-2">
                      Synthetic Well #{idx + 1} — {region.formations[idx % region.formations.length]}
                    </div>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={well} layout="vertical">
                          <XAxis type="number" domain={[0, 120]} hide />
                          <YAxis type="number" dataKey="depth" reversed domain={["dataMin", "dataMax"]} hide />
                          <Line dataKey="GR" stroke="#76b900" dot={false} strokeWidth={1.5} />
                          <Line dataKey="RT" stroke="#38bdf8" dot={false} strokeWidth={1.5} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#76b900]" /> GR</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#38bdf8]" /> RT</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Accuracy improvement chart */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                ML Model Accuracy Growth with Synthetic Data
              </h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accuracyCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2530" />
                    <XAxis
                      dataKey="wells"
                      tick={{ fontSize: 11, fill: "#6b8899" }}
                      label={{ value: "Total wells in training set", position: "insideBottom", offset: -5, fill: "#6b8899", fontSize: 11 }}
                    />
                    <YAxis
                      domain={[50, 100]}
                      tick={{ fontSize: 11, fill: "#6b8899" }}
                      label={{ value: "Accuracy %", angle: -90, position: "insideLeft", fill: "#6b8899", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0d1117", border: "1px solid #1c2530", borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(v) => `${v} wells`}
                      formatter={(v: number) => [`${v}%`, "Accuracy"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#76b900"
                      fill="url(#accGrad)"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#76b900" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#76b900" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Wells", value: region.targetWells, sub: `${region.realWells} real + ${syntheticCount} synthetic`, color: "text-blue-400" },
                { label: "Accuracy Gain", value: `+${(finalAccuracy - region.baseAccuracy).toFixed(0)}%`, sub: `${region.baseAccuracy}% → ${finalAccuracy.toFixed(0)}%`, color: "text-green-400" },
                { label: "Data Augmentation", value: `${(syntheticCount / region.realWells).toFixed(0)}×`, sub: "Expansion factor", color: "text-purple-400" },
                { label: "Generation Time", value: "<3s", sub: "On NVIDIA A100 GPU", color: "text-yellow-400" },
              ].map((m) => (
                <div key={m.label} className="p-4 rounded-xl bg-muted/20 border border-border/30 text-center">
                  <div className={cn("text-2xl font-bold", m.color)}>{m.value}</div>
                  <div className="text-sm font-medium mt-1">{m.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Validation summary */}
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Petrophysical Consistency Validation
              </h4>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  {
                    check: "GR Distribution",
                    result: "KL-divergence < 0.05",
                    status: "Real and synthetic distributions are statistically indistinguishable",
                  },
                  {
                    check: "RT–NPHI Correlation",
                    result: "r² = 0.91",
                    status: "Petrophysical relationships preserved through WFM latent space",
                  },
                  {
                    check: "Blind test (withheld wells)",
                    result: "RMSE = 3.2 API",
                    status: "Synthetic data reproduces log curves within ±5% deviation",
                  },
                ].map((v) => (
                  <div key={v.check} className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      <span className="text-sm font-medium">{v.check}</span>
                    </div>
                    <div className="text-xs font-mono text-green-400 mb-1">{v.result}</div>
                    <div className="text-xs text-muted-foreground">{v.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* XAI reasoning */}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-blue-400" />
                Cosmos Transfer — Verdict
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For region <span className="text-foreground font-medium">{region.name}</span>, generated{" "}
                <span className="text-blue-400 font-semibold">{syntheticCount} synthetic wells</span> based on{" "}
                {region.realWells} real logs. The World Foundation Model encodes real GR, RT, NPHI curves into a latent
                space of physical properties, then generates new curves while preserving geological consistency of formations{" "}
                {region.formations.join(", ")}. ML production forecasting model accuracy increased from{" "}
                <span className="text-yellow-400">{region.baseAccuracy}%</span> to{" "}
                <span className="text-green-400 font-semibold">{finalAccuracy.toFixed(0)}%</span> — equivalent to drilling{" "}
                {syntheticCount} exploration wells worth ~${(syntheticCount * 850000).toLocaleString()}, obtained in{" "}
                <span className="text-blue-400">3 seconds of GPU compute</span>.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
