import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  RotateCcw,
  TrendingDown,
  BarChart3,
  Droplets,
  Flame,
  Wind,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface WellReserves {
  name: string;
  initialOil: number;
  initialGas: number;
  initialWater: number;
  producedOil: number;
  producedGas: number;
  producedWater: number;
  remainingOil: number;
  remainingGas: number;
  remainingWater: number;
  recoveryFactor: number;
  declineRate: number;
  status: "analyzing" | "complete" | "warning";
}

interface ProductionPoint {
  month: number;
  cumOil: number;
  cumGas: number;
  cumWater: number;
  rate: number;
}

const WELLS_DATA: Omit<WellReserves, "status">[] = [
  {
    name: "Well OKC-1042",
    initialOil: 285000,
    initialGas: 142000,
    initialWater: 95000,
    producedOil: 178500,
    producedGas: 98700,
    producedWater: 72300,
    remainingOil: 106500,
    remainingGas: 43300,
    remainingWater: 22700,
    recoveryFactor: 62.6,
    declineRate: 8.2,
  },
  {
    name: "Well OKC-2187",
    initialOil: 412000,
    initialGas: 205000,
    initialWater: 138000,
    producedOil: 195700,
    producedGas: 112400,
    producedWater: 101200,
    remainingOil: 216300,
    remainingGas: 92600,
    remainingWater: 36800,
    recoveryFactor: 47.5,
    declineRate: 5.1,
  },
  {
    name: "Well OKC-3295",
    initialOil: 167000,
    initialGas: 89000,
    initialWater: 112000,
    producedOil: 142950,
    producedGas: 78200,
    producedWater: 98400,
    remainingOil: 24050,
    remainingGas: 10800,
    remainingWater: 13600,
    recoveryFactor: 85.6,
    declineRate: 14.7,
  },
  {
    name: "Well OKC-4510",
    initialOil: 530000,
    initialGas: 310000,
    initialWater: 175000,
    producedOil: 247100,
    producedGas: 158900,
    producedWater: 89600,
    remainingOil: 282900,
    remainingGas: 151100,
    remainingWater: 85400,
    recoveryFactor: 46.6,
    declineRate: 4.3,
  },
];

const STAGES = [
  { label: "Load Production Data", icon: BarChart3 },
  { label: "Calculate Cumulative Volumes", icon: TrendingDown },
  { label: "Estimate Initial Reserves", icon: Flame },
  { label: "Compute Remaining Reserves", icon: Droplets },
  { label: "Generate Report", icon: CheckCircle2 },
];

function generateProductionCurve(): ProductionPoint[] {
  const points: ProductionPoint[] = [];
  let cumOil = 0, cumGas = 0, cumWater = 0;
  const initialRate = 120 + Math.random() * 80;
  const decline = 0.03 + Math.random() * 0.02;

  for (let m = 1; m <= 60; m++) {
    const rate = initialRate * Math.exp(-decline * m);
    const monthOil = rate * 30;
    const monthGas = monthOil * (0.4 + Math.random() * 0.2);
    const monthWater = monthOil * (0.2 + m * 0.008);
    cumOil += monthOil;
    cumGas += monthGas;
    cumWater += monthWater;
    points.push({
      month: m,
      cumOil: Math.round(cumOil),
      cumGas: Math.round(cumGas),
      cumWater: Math.round(cumWater),
      rate: Math.round(rate * 10) / 10,
    });
  }
  return points;
}

export const CumulativeAnalysisDemo = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [stageProgress, setStageProgress] = useState(0);
  const [wells, setWells] = useState<WellReserves[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [productionData, setProductionData] = useState<ProductionPoint[]>([]);
  const [activeTab, setActiveTab] = useState("pipeline");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runPipeline = async () => {
    setIsRunning(true);
    setWells([]);
    setLogs([]);
    setProductionData([]);
    setCurrentStage(0);

    // Stage 0: Load
    addLog("📥 Loading production history from database...");
    for (let p = 0; p <= 100; p += 12) {
      setStageProgress(Math.min(p, 100));
      await sleep(120);
    }
    addLog(`✅ Loaded ${WELLS_DATA.length} wells with monthly production records`);

    // Stage 1: Cumulative
    setCurrentStage(1);
    setStageProgress(0);
    addLog("📊 Computing cumulative production volumes...");
    const curve = generateProductionCurve();
    for (let p = 0; p <= 100; p += 8) {
      setStageProgress(Math.min(p, 100));
      await sleep(100);
    }
    setProductionData(curve);
    addLog(`✅ Cumulative curves generated for 60-month period`);

    // Stage 2: Initial Reserves
    setCurrentStage(2);
    setStageProgress(0);
    addLog("🔥 Estimating initial reserves using decline curve analysis...");
    const partialWells: WellReserves[] = [];
    for (let i = 0; i < WELLS_DATA.length; i++) {
      setStageProgress(((i + 1) / WELLS_DATA.length) * 100);
      await sleep(400);
      partialWells.push({ ...WELLS_DATA[i], status: "analyzing" });
      setWells([...partialWells]);
      addLog(`  → ${WELLS_DATA[i].name}: IOIP = ${(WELLS_DATA[i].initialOil / 1000).toFixed(0)}k bbl`);
    }

    // Stage 3: Remaining
    setCurrentStage(3);
    setStageProgress(0);
    addLog("💧 Computing remaining reserves and recovery factors...");
    for (let i = 0; i < partialWells.length; i++) {
      setStageProgress(((i + 1) / partialWells.length) * 100);
      await sleep(350);
      const w = partialWells[i];
      w.status = w.recoveryFactor > 80 ? "warning" : "complete";
      setWells([...partialWells]);
      addLog(`  → ${w.name}: RF=${w.recoveryFactor}% | Remaining Oil=${(w.remainingOil / 1000).toFixed(0)}k bbl`);
    }

    // Stage 4: Report
    setCurrentStage(4);
    setStageProgress(0);
    addLog("📋 Generating cumulative analysis report...");
    for (let p = 0; p <= 100; p += 15) {
      setStageProgress(Math.min(p, 100));
      await sleep(100);
    }
    const totalInitial = WELLS_DATA.reduce((s, w) => s + w.initialOil, 0);
    const totalRemaining = WELLS_DATA.reduce((s, w) => s + w.remainingOil, 0);
    addLog(`✅ Report complete. Total Initial: ${(totalInitial / 1000).toFixed(0)}k bbl | Remaining: ${(totalRemaining / 1000).toFixed(0)}k bbl`);
    addLog("🏁 Stage 3 — Cumulative Analysis pipeline finished.");

    setIsRunning(false);
  };

  const reset = () => {
    setIsRunning(false);
    setCurrentStage(-1);
    setStageProgress(0);
    setWells([]);
    setLogs([]);
    setProductionData([]);
  };

  const formatNum = (n: number) => n.toLocaleString();

  const totalInitial = wells.reduce((s, w) => s + w.initialOil, 0);
  const totalProduced = wells.reduce((s, w) => s + w.producedOil, 0);
  const totalRemaining = wells.reduce((s, w) => s + w.remainingOil, 0);
  const avgRF = wells.length ? (wells.reduce((s, w) => s + w.recoveryFactor, 0) / wells.length) : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cumulative Analysis Pipeline</h3>
              <p className="text-sm text-muted-foreground">
                Mathematical-graphical reserve calculation with decline curve analysis
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={runPipeline} disabled={isRunning}>
                <Play className="mr-2 h-4 w-4" />
                {isRunning ? "Running..." : "Run Analysis"}
              </Button>
              <Button variant="outline" onClick={reset} disabled={isRunning}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline stages */}
      <div className="grid grid-cols-5 gap-2">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isDone = currentStage > i;
          const isActive = currentStage === i;
          return (
            <Card
              key={i}
              className={`transition-all duration-300 ${
                isActive ? "border-primary shadow-lg shadow-primary/10" : isDone ? "border-green-500/50" : "border-border/50 opacity-50"
              }`}
            >
              <CardContent className="p-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${isActive ? "text-primary animate-pulse" : isDone ? "text-green-500" : "text-muted-foreground"}`} />
                <p className="text-xs font-medium leading-tight">{stage.label}</p>
                {isActive && <Progress value={stageProgress} className="mt-2 h-1.5" />}
                {isDone && <Badge variant="outline" className="mt-1 text-[10px] text-green-500 border-green-500/30">Done</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline Log</TabsTrigger>
          <TabsTrigger value="reserves">Reserve Estimates</TabsTrigger>
          <TabsTrigger value="curve">Decline Curve</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Pipeline Log */}
        <TabsContent value="pipeline">
          <Card>
            <CardContent className="pt-4">
              <div
                ref={logRef}
                className="bg-black/90 rounded-lg p-4 h-72 overflow-y-auto font-mono text-xs space-y-1"
              >
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">Press "Run Analysis" to start the pipeline...</p>
                ) : (
                  logs.map((log, i) => (
                    <p key={i} className="text-green-400">{log}</p>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reserve Estimates Table */}
        <TabsContent value="reserves">
          <Card>
            <CardContent className="pt-4">
              {wells.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">Run the pipeline to see reserve estimates.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium">Well</th>
                        <th className="text-right py-2 px-3 font-medium">Initial Oil (bbl)</th>
                        <th className="text-right py-2 px-3 font-medium">Produced (bbl)</th>
                        <th className="text-right py-2 px-3 font-medium">Remaining (bbl)</th>
                        <th className="text-right py-2 px-3 font-medium">RF %</th>
                        <th className="text-right py-2 px-3 font-medium">Decline %/yr</th>
                        <th className="text-center py-2 px-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wells.map((w, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium">{w.name}</td>
                          <td className="text-right py-2 px-3">{formatNum(w.initialOil)}</td>
                          <td className="text-right py-2 px-3">{formatNum(w.producedOil)}</td>
                          <td className="text-right py-2 px-3">{formatNum(w.remainingOil)}</td>
                          <td className="text-right py-2 px-3">{w.recoveryFactor}%</td>
                          <td className="text-right py-2 px-3">{w.declineRate}%</td>
                          <td className="text-center py-2 px-3">
                            {w.status === "analyzing" && <Clock className="h-4 w-4 text-yellow-500 mx-auto animate-spin" />}
                            {w.status === "complete" && <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />}
                            {w.status === "warning" && <AlertTriangle className="h-4 w-4 text-orange-500 mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decline Curve Visualization */}
        <TabsContent value="curve">
          <Card>
            <CardContent className="pt-4">
              {productionData.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">Run the pipeline to see decline curves.</p>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Cumulative Production & Rate Decline (60 months)</h4>
                  <div className="relative h-64 bg-muted/30 rounded-lg overflow-hidden">
                    {/* Simple SVG chart */}
                    <svg viewBox="0 0 600 240" className="w-full h-full" preserveAspectRatio="none">
                      {/* Grid lines */}
                      {[0, 60, 120, 180, 240].map((y) => (
                        <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />
                      ))}

                      {/* Cumulative oil (area) */}
                      <path
                        d={`M ${productionData.map((p, i) => `${(i / 59) * 600},${240 - (p.cumOil / productionData[59].cumOil) * 220}`).join(" L ")} L 600,240 L 0,240 Z`}
                        fill="hsl(var(--primary) / 0.15)"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                      />

                      {/* Rate decline line */}
                      <path
                        d={`M ${productionData.map((p, i) => `${(i / 59) * 600},${240 - (p.rate / productionData[0].rate) * 220}`).join(" L ")}`}
                        fill="none"
                        stroke="hsl(var(--destructive))"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                      />

                      {/* Cumulative water */}
                      <path
                        d={`M ${productionData.map((p, i) => `${(i / 59) * 600},${240 - (p.cumWater / productionData[59].cumOil) * 220}`).join(" L ")}`}
                        fill="none"
                        stroke="hsl(210, 80%, 55%)"
                        strokeWidth="1.5"
                      />
                    </svg>

                    {/* Legend */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] bg-background/80 rounded p-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-primary rounded" />
                        <span>Cumulative Oil</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 rounded" style={{ background: "hsl(var(--destructive))" }} />
                        <span>Rate Decline</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 rounded" style={{ background: "hsl(210, 80%, 55%)" }} />
                        <span>Cumulative Water</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Final Cum. Oil</p>
                      <p className="text-lg font-bold">{formatNum(productionData[59]?.cumOil || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">bbl</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Final Cum. Gas</p>
                      <p className="text-lg font-bold">{formatNum(productionData[59]?.cumGas || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">mcf</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Final Cum. Water</p>
                      <p className="text-lg font-bold">{formatNum(productionData[59]?.cumWater || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">bbl</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Initial Rate</p>
                      <p className="text-lg font-bold">{productionData[0]?.rate || 0}</p>
                      <p className="text-[10px] text-muted-foreground">bbl/d</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary */}
        <TabsContent value="summary">
          <Card>
            <CardContent className="pt-4">
              {wells.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">Run the pipeline to see summary.</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-primary/20">
                      <CardContent className="p-4 text-center">
                        <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Total Initial Oil</p>
                        <p className="text-xl font-bold">{(totalInitial / 1000).toFixed(0)}k</p>
                        <p className="text-[10px] text-muted-foreground">bbl</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-500/20">
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Total Produced</p>
                        <p className="text-xl font-bold">{(totalProduced / 1000).toFixed(0)}k</p>
                        <p className="text-[10px] text-muted-foreground">bbl</p>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-500/20">
                      <CardContent className="p-4 text-center">
                        <Droplets className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Total Remaining</p>
                        <p className="text-xl font-bold">{(totalRemaining / 1000).toFixed(0)}k</p>
                        <p className="text-[10px] text-muted-foreground">bbl</p>
                      </CardContent>
                    </Card>
                    <Card className="border-purple-500/20">
                      <CardContent className="p-4 text-center">
                        <TrendingDown className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Avg Recovery Factor</p>
                        <p className="text-xl font-bold">{avgRF.toFixed(1)}%</p>
                        <p className="text-[10px] text-muted-foreground">of IOIP</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Per-Well Recovery Progress</h4>
                    {wells.map((w, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{w.name}</span>
                          <span className="text-muted-foreground">{w.recoveryFactor}% recovered</span>
                        </div>
                        <Progress value={w.recoveryFactor} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
