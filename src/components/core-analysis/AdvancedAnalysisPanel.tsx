import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layers,
  Zap,
  Gem,
  Play,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import sampleCore from "@/assets/sample-core.jpg";

type AnalysisMode = "segmentation" | "fractures" | "minerals";

interface SegmentationResult {
  zones: { label: string; color: string; area: number; description: string }[];
}

interface FractureResult {
  count: number;
  density: string;
  orientation: string;
  fractures: { x1: number; y1: number; x2: number; y2: number; width: number; type: string }[];
}

interface MineralResult {
  minerals: { name: string; percent: number; color: string; regions: { x: number; y: number; r: number }[] }[];
}

const ANALYSIS_CONFIGS: Record<AnalysisMode, { label: string; icon: React.ReactNode; description: string; duration: number }> = {
  segmentation: {
    label: "Segmentation",
    icon: <Layers className="h-4 w-4" />,
    description: "U-Net semantic segmentation into geological zones",
    duration: 3000,
  },
  fractures: {
    label: "Fracture Detection",
    icon: <Zap className="h-4 w-4" />,
    description: "Deep learning fracture network identification",
    duration: 2500,
  },
  minerals: {
    label: "Mineral Mapping",
    icon: <Gem className="h-4 w-4" />,
    description: "Hyperspectral-style mineral composition mapping",
    duration: 3500,
  },
};

export const AdvancedAnalysisPanel = () => {
  const [mode, setMode] = useState<AnalysisMode>("segmentation");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [segResult, setSegResult] = useState<SegmentationResult | null>(null);
  const [fractureResult, setFractureResult] = useState<FractureResult | null>(null);
  const [mineralResult, setMineralResult] = useState<MineralResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const runAnalysis = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setShowOverlay(false);
    setSegResult(null);
    setFractureResult(null);
    setMineralResult(null);

    const config = ANALYSIS_CONFIGS[mode];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      await new Promise(r => setTimeout(r, config.duration / steps));
      setProgress((i / steps) * 100);
    }

    if (mode === "segmentation") {
      setSegResult({
        zones: [
          { label: "Quartz Matrix", color: "hsl(var(--primary))", area: 45.2, description: "Primary framework grains" },
          { label: "Pore Space", color: "hsl(var(--warning))", area: 14.8, description: "Intergranular porosity" },
          { label: "Clay Cement", color: "hsl(var(--success))", area: 22.1, description: "Authigenic clay fill" },
          { label: "Calcite Cement", color: "hsl(var(--destructive))", area: 17.9, description: "Secondary cementation" },
        ],
      });
    } else if (mode === "fractures") {
      setFractureResult({
        count: 7,
        density: "Medium (4.2/cm²)",
        orientation: "NE-SW dominant (N35°E ± 15°)",
        fractures: [
          { x1: 20, y1: 15, x2: 35, y2: 55, width: 2, type: "Natural" },
          { x1: 45, y1: 10, x2: 55, y2: 45, width: 1.5, type: "Natural" },
          { x1: 60, y1: 25, x2: 75, y2: 65, width: 2.5, type: "Induced" },
          { x1: 30, y1: 60, x2: 50, y2: 85, width: 1, type: "Micro" },
          { x1: 70, y1: 35, x2: 85, y2: 70, width: 1.5, type: "Natural" },
          { x1: 15, y1: 40, x2: 25, y2: 75, width: 1, type: "Micro" },
          { x1: 55, y1: 55, x2: 65, y2: 90, width: 2, type: "Induced" },
        ],
      });
    } else {
      setMineralResult({
        minerals: [
          { name: "Quartz", percent: 62, color: "rgba(59, 130, 246, 0.4)", regions: [{ x: 30, y: 30, r: 18 }, { x: 60, y: 45, r: 15 }, { x: 45, y: 70, r: 20 }] },
          { name: "Feldspar", percent: 15, color: "rgba(234, 179, 8, 0.4)", regions: [{ x: 75, y: 25, r: 12 }, { x: 25, y: 60, r: 10 }] },
          { name: "Calcite", percent: 12, color: "rgba(34, 197, 94, 0.4)", regions: [{ x: 50, y: 20, r: 11 }, { x: 70, y: 65, r: 14 }] },
          { name: "Clay Minerals", percent: 8, color: "rgba(239, 68, 68, 0.35)", regions: [{ x: 35, y: 50, r: 9 }, { x: 80, y: 50, r: 8 }] },
          { name: "Other", percent: 3, color: "rgba(168, 85, 247, 0.3)", regions: [{ x: 55, y: 80, r: 7 }] },
        ],
      });
    }

    setShowOverlay(true);
    setIsRunning(false);
  }, [mode]);

  const reset = () => {
    setProgress(0);
    setShowOverlay(false);
    setSegResult(null);
    setFractureResult(null);
    setMineralResult(null);
    setIsRunning(false);
  };

  const hasResult = segResult || fractureResult || mineralResult;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Advanced CV Analysis
        </CardTitle>
        <CardDescription>
          Specialized computer vision models for detailed core interpretation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as AnalysisMode); reset(); }}>
          <TabsList className="grid w-full grid-cols-3">
            {(Object.entries(ANALYSIS_CONFIGS) as [AnalysisMode, typeof ANALYSIS_CONFIGS[AnalysisMode]][]).map(([key, cfg]) => (
              <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
                {cfg.icon}
                {cfg.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4 text-sm text-muted-foreground">
            {ANALYSIS_CONFIGS[mode].description}
          </div>
        </Tabs>

        {/* Image with overlays */}
        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
          <img
            src={sampleCore}
            alt="Core sample"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
              isRunning ? "brightness-75 contrast-125" : showOverlay ? "brightness-90" : ""
            }`}
          />

          {/* Running animation */}
          {isRunning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 animate-pulse" />
              <div className="absolute top-3 left-3 bg-background/85 backdrop-blur-sm rounded-md px-3 py-1.5 flex items-center gap-2 border border-border">
                <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">{ANALYSIS_CONFIGS[mode].label}...</span>
              </div>
            </div>
          )}

          {/* Segmentation overlay */}
          {showOverlay && segResult && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <rect x="3%" y="5%" width="45%" height="42%" rx="6" fill={segResult.zones[0].color} fillOpacity="0.25" stroke={segResult.zones[0].color} strokeWidth="1.5" strokeDasharray="6 3" />
              <rect x="52%" y="8%" width="44%" height="38%" rx="6" fill={segResult.zones[1].color} fillOpacity="0.25" stroke={segResult.zones[1].color} strokeWidth="1.5" strokeDasharray="6 3" />
              <rect x="5%" y="52%" width="42%" height="42%" rx="6" fill={segResult.zones[2].color} fillOpacity="0.25" stroke={segResult.zones[2].color} strokeWidth="1.5" strokeDasharray="6 3" />
              <rect x="52%" y="50%" width="44%" height="44%" rx="6" fill={segResult.zones[3].color} fillOpacity="0.25" stroke={segResult.zones[3].color} strokeWidth="1.5" strokeDasharray="6 3" />
              <text x="25%" y="28%" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" className="drop-shadow-lg">{segResult.zones[0].label}</text>
              <text x="74%" y="28%" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" className="drop-shadow-lg">{segResult.zones[1].label}</text>
              <text x="26%" y="74%" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" className="drop-shadow-lg">{segResult.zones[2].label}</text>
              <text x="74%" y="74%" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" className="drop-shadow-lg">{segResult.zones[3].label}</text>
            </svg>
          )}

          {/* Fracture overlay */}
          {showOverlay && fractureResult && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {fractureResult.fractures.map((f, i) => (
                <line
                  key={i}
                  x1={`${f.x1}%`} y1={`${f.y1}%`}
                  x2={`${f.x2}%`} y2={`${f.y2}%`}
                  stroke={f.type === "Natural" ? "hsl(var(--destructive))" : f.type === "Induced" ? "hsl(var(--warning))" : "hsl(var(--primary))"}
                  strokeWidth={f.width}
                  strokeLinecap="round"
                  opacity="0.8"
                />
              ))}
              {fractureResult.fractures.map((f, i) => (
                <circle
                  key={`dot-${i}`}
                  cx={`${(f.x1 + f.x2) / 2}%`}
                  cy={`${(f.y1 + f.y2) / 2}%`}
                  r="3"
                  fill={f.type === "Natural" ? "hsl(var(--destructive))" : f.type === "Induced" ? "hsl(var(--warning))" : "hsl(var(--primary))"}
                />
              ))}
            </svg>
          )}

          {/* Mineral overlay */}
          {showOverlay && mineralResult && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {mineralResult.minerals.flatMap((m) =>
                m.regions.map((r, i) => (
                  <circle
                    key={`${m.name}-${i}`}
                    cx={`${r.x}%`}
                    cy={`${r.y}%`}
                    r={`${r.r}%`}
                    fill={m.color}
                    stroke={m.color.replace(/[\d.]+\)$/, "0.8)")}
                    strokeWidth="1.5"
                  />
                ))
              )}
              {mineralResult.minerals.flatMap((m) =>
                m.regions.map((r, i) => (
                  <text
                    key={`label-${m.name}-${i}`}
                    x={`${r.x}%`}
                    y={`${r.y}%`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize="9"
                    fontWeight="bold"
                    className="drop-shadow-lg"
                  >
                    {m.name.substring(0, 4)}
                  </text>
                ))
              )}
            </svg>
          )}
        </div>

        {/* Progress */}
        {(isRunning || hasResult) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Results */}
        {showOverlay && segResult && (
          <div className="p-4 rounded-lg border border-success/30 bg-success/5 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-success font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Segmentation Complete — 4 Zones Identified
            </div>
            <div className="grid grid-cols-2 gap-2">
              {segResult.zones.map((z) => (
                <div key={z.label} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-sm" style={{ background: z.color }} />
                  <span className="font-medium">{z.label}</span>
                  <span className="text-muted-foreground ml-auto">{z.area}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showOverlay && fractureResult && (
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              {fractureResult.count} Fractures Detected
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Density</p>
                <p className="font-medium">{fractureResult.density}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Orientation</p>
                <p className="font-medium">{fractureResult.orientation}</p>
              </div>
            </div>
            <div className="flex gap-3 text-xs">
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                Natural: {fractureResult.fractures.filter(f => f.type === "Natural").length}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-warning" />
                Induced: {fractureResult.fractures.filter(f => f.type === "Induced").length}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Micro: {fractureResult.fractures.filter(f => f.type === "Micro").length}
              </Badge>
            </div>
          </div>
        )}

        {showOverlay && mineralResult && (
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Mineral Composition Mapped
            </div>
            <div className="space-y-1.5">
              {mineralResult.minerals.map((m) => (
                <div key={m.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-sm" style={{ background: m.color }} />
                  <span className="w-20">{m.name}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${m.percent}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium">{m.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button onClick={runAnalysis} disabled={isRunning} className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            Run {ANALYSIS_CONFIGS[mode].label}
          </Button>
          <Button variant="outline" onClick={reset} disabled={!hasResult && !isRunning}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
