import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  RotateCcw,
  Eye,
  Layers,
  Target,
  Cpu,
  CheckCircle2,
  Activity,
  Search,
  FileText,
  Zap,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";

type AnalysisStage =
  | "idle"
  | "data_loading"
  | "curve_analysis"
  | "zone_detection"
  | "missed_pay"
  | "report"
  | "complete";

interface PayZone {
  top: number;
  bottom: number;
  name: string;
  porosity: number;
  sw: number;
  permeability: number;
  status: "productive" | "missed" | "water";
}

interface AnalysisReport {
  totalPayThickness: number;
  missedIntervals: number;
  recommendedPerforations: number;
  estimatedReserves: number;
  payZones: PayZone[];
}

const STAGES: { key: AnalysisStage; label: string; icon: any; duration: number }[] = [
  { key: "data_loading", label: "Data Loading", icon: Activity, duration: 1000 },
  { key: "curve_analysis", label: "Curve Analysis", icon: Eye, duration: 1800 },
  { key: "zone_detection", label: "Zone Detection", icon: Target, duration: 2000 },
  { key: "missed_pay", label: "Missed Pay", icon: Search, duration: 1800 },
  { key: "report", label: "Report Gen", icon: FileText, duration: 1200 },
  { key: "complete", label: "Complete", icon: CheckCircle2, duration: 0 },
];

// Brawner 10-15 specific intervals based on real log data (formation: Rodessa / Upper Carlisle / James Lime)
const PAY_ZONES: PayZone[] = [
  { top: 4200, bottom: 4400, name: "Upper Carlisle — Transition", porosity: 11.4, sw: 72, permeability: 8.5, status: "productive" },
  { top: 4400, bottom: 4750, name: "Upper Carlisle — Main Pay", porosity: 14.0, sw: 60, permeability: 15.5, status: "productive" },
  { top: 4750, bottom: 4915, name: "Rodessa / James Lime — Best Pay", porosity: 20.2, sw: 28, permeability: 48, status: "missed" },
  { top: 5000, bottom: 5100, name: "Sub-Rodessa — Water", porosity: 7.0, sw: 85, permeability: 5, status: "water" },
];

export const WellLogAnalysisDemo = () => {
  const [stage, setStage] = useState<AnalysisStage>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visibleDepth, setVisibleDepth] = useState(0);
  const [detectedZones, setDetectedZones] = useState<PayZone[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [scanDepth, setScanDepth] = useState(0);

  // Generate synthetic well log data
  const wellLogData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 80; i++) {
      const depth = 2800 + i * 10;

      // Gamma Ray — low in sand (pay zones), high in shale
      const inZoneA = depth >= 2900 && depth <= 3050;
      const inZoneB = depth >= 3120 && depth <= 3180;
      const inZoneC = depth >= 3250 && depth <= 3280;
      const inZoneD = depth >= 3350 && depth <= 3400;
      const inPay = inZoneA || inZoneB || inZoneC || inZoneD;

      const baseGR = inPay ? 25 : 85;
      const gammaRay = Math.max(0, baseGR + Math.random() * 30 - 15);

      // Resistivity — high in oil zones, low in water
      const baseRes = inZoneD ? 3 : inPay ? 60 : 5;
      const resistivity = Math.max(0.5, baseRes * (0.7 + Math.random() * 0.6));

      // Porosity
      const basePor = inZoneA ? 22 : inZoneB ? 18 : inZoneC ? 16 : inZoneD ? 20 : 6;
      const porosity = Math.max(0, Math.min(40, basePor + Math.random() * 6 - 3));

      // Neutron Porosity (slightly different from density porosity in pay)
      const neutronPor = porosity + (inPay ? -2 + Math.random() * 1 : 2 + Math.random() * 2);

      // Water Saturation
      const baseSw = inZoneA ? 24 : inZoneB ? 32 : inZoneC ? 38 : inZoneD ? 85 : 100;
      const waterSat = Math.min(100, Math.max(0, baseSw + Math.random() * 15 - 7));

      data.push({
        depth,
        gammaRay,
        resistivity,
        porosity,
        neutronPor,
        waterSat,
      });
    }
    return data;
  }, []);

  const runAnalysis = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setDetectedZones([]);
    setReport(null);
    setVisibleDepth(0);
    setScanDepth(0);

    for (let i = 0; i < STAGES.length - 1; i++) {
      const currentStage = STAGES[i];
      setStage(currentStage.key);

      const startProgress = (i / (STAGES.length - 1)) * 100;
      const endProgress = ((i + 1) / (STAGES.length - 1)) * 100;

      const steps = 25;
      for (let step = 0; step <= steps; step++) {
        await new Promise((r) => setTimeout(r, currentStage.duration / steps));
        setProgress(startProgress + (endProgress - startProgress) * (step / steps));

        if (currentStage.key === "data_loading") {
          setVisibleDepth(Math.floor((step / steps) * wellLogData.length));
        }

        if (currentStage.key === "curve_analysis") {
          setScanDepth(2800 + (step / steps) * 800);
        }

        if (currentStage.key === "zone_detection" && step % 6 === 0 && step > 0) {
          const zoneIdx = Math.floor(step / 6) - 1;
          if (zoneIdx >= 0 && zoneIdx < PAY_ZONES.length) {
            setDetectedZones((prev) => [...prev, PAY_ZONES[zoneIdx]]);
          }
        }
      }
    }

    setStage("complete");
    setVisibleDepth(wellLogData.length);
    setDetectedZones(PAY_ZONES);
    setReport({
      totalPayThickness: 220,
      missedIntervals: 1,
      recommendedPerforations: 3,
      estimatedReserves: 1.85,
      payZones: PAY_ZONES,
    });
    setIsRunning(false);
  }, [wellLogData]);

  const reset = () => {
    setStage("idle");
    setIsRunning(false);
    setProgress(0);
    setVisibleDepth(0);
    setDetectedZones([]);
    setReport(null);
    setScanDepth(0);
  };

  const displayData = stage === "idle" ? wellLogData : wellLogData.slice(0, Math.max(1, visibleDepth));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-50">
          <p className="text-sm font-medium mb-2">Depth: {label}m TVD</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
              {entry.name === "GR" && " API"}
              {entry.name === "Resistivity" && " Ω·m"}
              {(entry.name === "Porosity" || entry.name === "NPHI" || entry.name === "Sw") && "%"}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getZoneColor = (status: PayZone["status"]) => {
    switch (status) {
      case "productive": return "hsl(var(--success))";
      case "missed": return "hsl(var(--warning))";
      case "water": return "hsl(var(--primary))";
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Demo: AI Well Log Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Well Log Chart */}
        <div className="relative bg-slate-900/50 rounded-lg p-4 border border-border">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                layout="vertical"
                data={displayData}
                margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 150]} />
                <YAxis
                  dataKey="depth"
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  reversed
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) => `${v}m`}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Detected pay zones */}
                {detectedZones.map((zone) => (
                  <ReferenceArea
                    key={zone.name}
                    y1={zone.top}
                    y2={zone.bottom}
                    fill={getZoneColor(zone.status)}
                    fillOpacity={0.15}
                    stroke={getZoneColor(zone.status)}
                    strokeDasharray={zone.status === "missed" ? "6 3" : "3 3"}
                    strokeWidth={zone.status === "missed" ? 2 : 1}
                  />
                ))}

                {/* AI scan line */}
                {stage === "curve_analysis" && (
                  <ReferenceLine
                    y={scanDepth}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="0"
                  />
                )}

                {/* Log curves */}
                <Line type="monotone" dataKey="gammaRay" stroke="#eab308" strokeWidth={1.5} dot={false} name="GR" />
                <Area type="monotone" dataKey="porosity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Porosity" />
                <Line type="monotone" dataKey="resistivity" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Resistivity" />
                <Area type="monotone" dataKey="waterSat" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} name="Sw" strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Stage label overlay */}
          {isRunning && (
            <div className="absolute top-6 left-6">
              <div className="bg-background/85 backdrop-blur-sm rounded-md px-3 py-1.5 flex items-center gap-2 border border-border">
                <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">{STAGES.find((s) => s.key === stage)?.label}</span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-yellow-500" /><span>GR</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-500/30 border border-blue-500" /><span>Porosity</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-red-500" /><span>Resistivity</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-cyan-500 border-dashed" /><span>Sw</span></div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Analysis Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stages Timeline */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {STAGES.map((s, idx) => {
            const stageIndex = STAGES.findIndex((st) => st.key === stage);
            const isActive = s.key === stage;
            const isComplete = stageIndex > idx;
            const Icon = s.icon;

            return (
              <div
                key={s.key}
                className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                  isActive ? "bg-primary/20 ring-1 ring-primary" : isComplete ? "bg-success/10" : "bg-muted/50"
                }`}
              >
                <div className={`mb-1 ${isActive ? "text-primary" : isComplete ? "text-success" : "text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Detected Zones */}
        {detectedZones.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Detected Formation Zones</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detectedZones.map((zone) => (
                <div
                  key={zone.name}
                  className={`p-3 rounded-lg border animate-in slide-in-from-left duration-500 ${
                    zone.status === "productive"
                      ? "border-success/30 bg-success/5"
                      : zone.status === "missed"
                      ? "border-warning/30 bg-warning/5"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{zone.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        zone.status === "productive"
                          ? "text-success border-success"
                          : zone.status === "missed"
                          ? "text-warning border-warning"
                          : "text-primary border-primary"
                      }`}
                    >
                      {zone.status === "productive" ? "✅ Productive" : zone.status === "missed" ? "⚠️ Missed Pay" : "💧 Water"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                    <div>
                      <span className="block">Depth</span>
                      <span className="font-medium text-foreground">{zone.top}-{zone.bottom}m</span>
                    </div>
                    <div>
                      <span className="block">φ / Sw</span>
                      <span className="font-medium text-foreground">{zone.porosity}% / {zone.sw}%</span>
                    </div>
                    <div>
                      <span className="block">Perm</span>
                      <span className="font-medium text-foreground">{zone.permeability} mD</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Report */}
        {report && stage === "complete" && (
          <div className="p-4 rounded-lg border border-success/30 bg-success/5 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-success font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Formation Evaluation Report
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Pay Thickness</p>
                <p className="font-bold text-lg">{report.totalPayThickness}m</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Missed Intervals</p>
                <p className="font-bold text-lg text-warning">{report.missedIntervals}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Recommended Perfs</p>
                <p className="font-bold text-lg text-primary">{report.recommendedPerforations}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Est. Reserves</p>
                <p className="font-bold text-lg text-success">{report.estimatedReserves} MMbbl</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
              <p className="font-medium text-foreground">AI Recommendations:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Perforate Zone C (3250-3280m) — missed pay interval with 15.8% porosity and 85 mD permeability</li>
                <li>Zone A remains primary target with best reservoir properties (φ=22.4%, k=320 mD)</li>
                <li>Avoid Zone D — water-saturated interval (Sw=85%)</li>
                <li>Consider acidizing Zone B to improve productivity index</li>
              </ul>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button onClick={runAnalysis} disabled={isRunning} className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            Run Analysis
          </Button>
          <Button variant="outline" onClick={reset} disabled={stage === "idle"}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Explanation */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
          <p><strong>AI Geophysical Pipeline:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Data Loading</strong> — Import and digitize well log curves (GR, RT, NPHI, RHOB)</li>
            <li><strong>Curve Analysis</strong> — Neural network correlates multi-curve patterns across depth</li>
            <li><strong>Zone Detection</strong> — AI identifies productive intervals by cross-analyzing log responses</li>
            <li><strong>Missed Pay Detection</strong> — Model finds thin beds (&lt;2m) with pay zone signatures missed by conventional analysis</li>
            <li><strong>Report Generation</strong> — LLM generates formation evaluation report with perforation recommendations</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
