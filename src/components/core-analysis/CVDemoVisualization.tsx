import { useState, useCallback } from "react";
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
  Sparkles,
} from "lucide-react";
import sampleCore from "@/assets/sample-core.jpg";

type AnalysisStage = 
  | "idle" 
  | "preprocessing" 
  | "edge_detection" 
  | "feature_extraction" 
  | "segmentation" 
  | "classification" 
  | "complete";

interface DetectedFeature {
  id: string;
  type: "pore" | "fracture" | "mineral" | "grain";
  x: number;
  y: number;
  size: number;
  confidence: number;
}

interface AnalysisResult {
  rockType: string;
  porosity: number;
  permeability: number;
  fractureCount: number;
  mineralComposition: { name: string; percent: number }[];
}

const STAGES: { key: AnalysisStage; label: string; duration: number }[] = [
  { key: "preprocessing", label: "Preprocessing", duration: 1200 },
  { key: "edge_detection", label: "Edge Detection", duration: 1800 },
  { key: "feature_extraction", label: "Feature Extraction", duration: 2200 },
  { key: "segmentation", label: "Segmentation", duration: 1800 },
  { key: "classification", label: "Classification", duration: 1200 },
  { key: "complete", label: "Complete", duration: 0 },
];

export const CVDemoVisualization = () => {
  const [stage, setStage] = useState<AnalysisStage>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [features, setFeatures] = useState<DetectedFeature[]>([]);
  const [scanLine, setScanLine] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const generateFeatures = useCallback(() => {
    const newFeatures: DetectedFeature[] = [];
    const types: DetectedFeature["type"][] = ["pore", "fracture", "mineral", "grain"];
    
    for (let i = 0; i < 18; i++) {
      newFeatures.push({
        id: `feature-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
        size: 10 + Math.random() * 22,
        confidence: 0.72 + Math.random() * 0.28,
      });
    }
    return newFeatures;
  }, []);

  const runAnalysis = useCallback(async () => {
    setIsRunning(true);
    setFeatures([]);
    setProgress(0);
    setResult(null);

    for (let i = 0; i < STAGES.length - 1; i++) {
      const currentStage = STAGES[i];
      setStage(currentStage.key);
      
      const startProgress = (i / (STAGES.length - 1)) * 100;
      const endProgress = ((i + 1) / (STAGES.length - 1)) * 100;
      
      const steps = 20;
      for (let step = 0; step <= steps; step++) {
        await new Promise(r => setTimeout(r, currentStage.duration / steps));
        setProgress(startProgress + (endProgress - startProgress) * (step / steps));
        
        if (currentStage.key === "edge_detection") {
          setScanLine((step / steps) * 100);
        }
        
        if (currentStage.key === "feature_extraction" && step % 3 === 0) {
          setFeatures(prev => {
            const newFeature = generateFeatures().slice(0, 1)[0];
            newFeature.id = `feature-${prev.length}`;
            return [...prev, newFeature];
          });
        }
      }
    }

    setStage("complete");
    setFeatures(generateFeatures());
    setResult({
      rockType: "Sandstone (Quartz Arenite)",
      porosity: 14.2 + Math.random() * 4,
      permeability: 85 + Math.random() * 60,
      fractureCount: 3 + Math.floor(Math.random() * 5),
      mineralComposition: [
        { name: "Quartz", percent: 62 + Math.random() * 8 },
        { name: "Feldspar", percent: 12 + Math.random() * 5 },
        { name: "Calcite", percent: 8 + Math.random() * 4 },
        { name: "Clay", percent: 5 + Math.random() * 3 },
      ],
    });
    setIsRunning(false);
    setScanLine(0);
  }, [generateFeatures]);

  const reset = () => {
    setStage("idle");
    setIsRunning(false);
    setProgress(0);
    setFeatures([]);
    setScanLine(0);
    setResult(null);
  };

  const getFeatureColor = (type: DetectedFeature["type"]) => {
    switch (type) {
      case "pore": return "hsl(var(--primary))";
      case "fracture": return "hsl(var(--destructive))";
      case "mineral": return "hsl(var(--warning))";
      case "grain": return "hsl(var(--success))";
    }
  };

  const getStageIcon = (stageKey: AnalysisStage) => {
    switch (stageKey) {
      case "preprocessing": return <Eye className="h-4 w-4" />;
      case "edge_detection": return <Target className="h-4 w-4" />;
      case "feature_extraction": return <Sparkles className="h-4 w-4" />;
      case "segmentation": return <Layers className="h-4 w-4" />;
      case "classification": return <Cpu className="h-4 w-4" />;
      case "complete": return <CheckCircle2 className="h-4 w-4" />;
      default: return null;
    }
  };

  // Dynamic image filter classes based on stage
  const getImageClasses = () => {
    switch (stage) {
      case "preprocessing":
        return "grayscale contrast-150 brightness-110";
      case "edge_detection":
        return "grayscale brightness-75 contrast-200";
      case "feature_extraction":
        return "saturate-50 contrast-125";
      case "segmentation":
        return "hue-rotate-30 saturate-150 contrast-110";
      case "classification":
        return "saturate-200 contrast-110 brightness-105";
      case "complete":
        return "saturate-125";
      default:
        return "";
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Demo: How Computer Vision Works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Analysis Area */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border">
          {/* Core Sample Image */}
          <img
            src={sampleCore}
            alt="Core sample"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${getImageClasses()}`}
          />

          {/* Preprocessing: scan grid overlay */}
          {stage === "preprocessing" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/10 animate-pulse" />
              <svg className="absolute inset-0 w-full h-full opacity-30">
                <defs>
                  <pattern id="scan-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#scan-grid)" />
              </svg>
            </div>
          )}
          
          {/* Edge Detection: scan line + contour effect */}
          {stage === "edge_detection" && (
            <>
              <div 
                className="absolute left-0 right-0 h-1.5 bg-primary shadow-[0_0_15px_3px_hsl(var(--primary)/0.6)]"
                style={{ top: `${scanLine}%`, transition: "top 0.08s linear" }}
              />
              <div 
                className="absolute inset-0"
                style={{ 
                  height: `${scanLine}%`,
                  background: "linear-gradient(to bottom, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
                  backdropFilter: "contrast(2) brightness(0.7)",
                }}
              />
              {/* Simulated edge lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: scanLine / 100 }}>
                <line x1="15%" y1="20%" x2="45%" y2="22%" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6"/>
                <line x1="50%" y1="35%" x2="80%" y2="38%" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5"/>
                <line x1="25%" y1="55%" x2="60%" y2="52%" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.4"/>
                <line x1="10%" y1="70%" x2="40%" y2="75%" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5"/>
                <line x1="55%" y1="65%" x2="90%" y2="68%" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.4"/>
              </svg>
            </>
          )}

          {/* Feature Extraction: heatmap-like glow on detected areas */}
          {stage === "feature_extraction" && (
            <div className="absolute inset-0 pointer-events-none">
              {features.map((f) => (
                <div
                  key={f.id}
                  className="absolute rounded-full animate-in zoom-in duration-500"
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    width: f.size * 2,
                    height: f.size * 2,
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${getFeatureColor(f.type)}40 0%, transparent 70%)`,
                    boxShadow: `0 0 ${f.size}px ${getFeatureColor(f.type)}50`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Segmentation: colored region overlay */}
          {(stage === "segmentation" || stage === "classification") && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <pattern id="seg-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#seg-grid)" />
                {/* Colored segmentation regions */}
                <rect x="5%" y="10%" width="35%" height="30%" rx="4" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary) / 0.4)" strokeWidth="1.5" strokeDasharray="4 2"/>
                <rect x="45%" y="15%" width="50%" height="25%" rx="4" fill="hsl(var(--warning) / 0.15)" stroke="hsl(var(--warning) / 0.4)" strokeWidth="1.5" strokeDasharray="4 2"/>
                <rect x="10%" y="50%" width="40%" height="40%" rx="4" fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success) / 0.4)" strokeWidth="1.5" strokeDasharray="4 2"/>
                <rect x="55%" y="48%" width="40%" height="45%" rx="4" fill="hsl(var(--destructive) / 0.15)" stroke="hsl(var(--destructive) / 0.4)" strokeWidth="1.5" strokeDasharray="4 2"/>
              </svg>
              {stage === "classification" && (
                <>
                  <div className="absolute top-[12%] left-[7%] text-[9px] font-bold text-primary bg-background/80 px-1.5 py-0.5 rounded">Zone A: Quartz</div>
                  <div className="absolute top-[17%] left-[47%] text-[9px] font-bold text-warning bg-background/80 px-1.5 py-0.5 rounded">Zone B: Feldspar</div>
                  <div className="absolute top-[52%] left-[12%] text-[9px] font-bold text-success bg-background/80 px-1.5 py-0.5 rounded">Zone C: Calcite</div>
                  <div className="absolute top-[50%] left-[57%] text-[9px] font-bold text-destructive bg-background/80 px-1.5 py-0.5 rounded">Zone D: Fracture</div>
                </>
              )}
            </div>
          )}

          {/* Complete: feature markers with confidence */}
          {stage === "complete" && features.map((feature, idx) => (
            <div
              key={feature.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-in zoom-in duration-300"
              style={{
                left: `${feature.x}%`,
                top: `${feature.y}%`,
                animationDelay: `${idx * 30}ms`,
              }}
            >
              <div
                className="rounded-full border-2 flex items-center justify-center text-[7px] font-bold backdrop-blur-sm"
                style={{
                  width: feature.size,
                  height: feature.size,
                  borderColor: getFeatureColor(feature.type),
                  backgroundColor: `${getFeatureColor(feature.type)}25`,
                  color: getFeatureColor(feature.type),
                  boxShadow: `0 0 6px ${getFeatureColor(feature.type)}40`,
                }}
              >
                {Math.round(feature.confidence * 100)}%
              </div>
            </div>
          ))}

          {/* Stage label overlay */}
          {isRunning && (
            <div className="absolute top-3 left-3">
              <div className="bg-background/85 backdrop-blur-sm rounded-md px-3 py-1.5 flex items-center gap-2 border border-border">
                <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">
                  {STAGES.find(s => s.key === stage)?.label}
                </span>
              </div>
            </div>
          )}
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
            const stageIndex = STAGES.findIndex(st => st.key === stage);
            const isActive = s.key === stage;
            const isComplete = stageIndex > idx;
            
            return (
              <div
                key={s.key}
                className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                  isActive ? "bg-primary/20 ring-1 ring-primary" : 
                  isComplete ? "bg-success/10" : "bg-muted/50"
                }`}
              >
                <div className={`mb-1 ${
                  isActive ? "text-primary" : 
                  isComplete ? "text-success" : "text-muted-foreground"
                }`}>
                  {getStageIcon(s.key)}
                </div>
                <span className="text-[10px] leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Feature Legend */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Pores: {features.filter(f => f.type === "pore").length}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              Fractures: {features.filter(f => f.type === "fracture").length}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              Minerals: {features.filter(f => f.type === "mineral").length}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              Grains: {features.filter(f => f.type === "grain").length}
            </Badge>
          </div>
        )}

        {/* Analysis Results Card */}
        {result && stage === "complete" && (
          <div className="p-4 rounded-lg border border-success/30 bg-success/5 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-success font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Analysis Complete
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Rock Type</p>
                <p className="font-medium">{result.rockType}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Porosity</p>
                <p className="font-medium">{result.porosity.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Permeability</p>
                <p className="font-medium">{result.permeability.toFixed(0)} mD</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Fractures Detected</p>
                <p className="font-medium">{result.fractureCount}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-2">Mineral Composition</p>
              <div className="space-y-1.5">
                {result.mineralComposition.map((m) => (
                  <div key={m.name} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-muted-foreground">{m.name}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${m.percent}%` }} />
                    </div>
                    <span className="w-10 text-right font-medium">{m.percent.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={runAnalysis}
            disabled={isRunning}
            className="flex-1"
          >
            <Play className="mr-2 h-4 w-4" />
            Run Demo
          </Button>
          <Button
            variant="outline"
            onClick={reset}
            disabled={stage === "idle"}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Explanation */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
          <p><strong>Computer Vision Pipeline:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Preprocessing</strong> — Normalization, noise reduction, contrast enhancement</li>
            <li><strong>Edge Detection</strong> — Canny/Sobel algorithms detect geological contours</li>
            <li><strong>Feature Extraction</strong> — CNN identifies pores, fractures, grain boundaries</li>
            <li><strong>Segmentation</strong> — U-Net divides image into mineralogical zones</li>
            <li><strong>Classification</strong> — Neural network classifies rock type &amp; properties</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
