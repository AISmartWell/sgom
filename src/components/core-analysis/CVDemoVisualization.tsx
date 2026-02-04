import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Layers,
  Target,
  Cpu,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

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

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop";

const STAGES: { key: AnalysisStage; label: string; duration: number }[] = [
  { key: "preprocessing", label: "Предобработка изображения", duration: 1500 },
  { key: "edge_detection", label: "Обнаружение границ", duration: 2000 },
  { key: "feature_extraction", label: "Извлечение признаков", duration: 2500 },
  { key: "segmentation", label: "Сегментация областей", duration: 2000 },
  { key: "classification", label: "Классификация", duration: 1500 },
  { key: "complete", label: "Анализ завершён", duration: 0 },
];

export const CVDemoVisualization = () => {
  const [stage, setStage] = useState<AnalysisStage>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [features, setFeatures] = useState<DetectedFeature[]>([]);
  const [scanLine, setScanLine] = useState(0);

  const generateFeatures = useCallback(() => {
    const newFeatures: DetectedFeature[] = [];
    const types: DetectedFeature["type"][] = ["pore", "fracture", "mineral", "grain"];
    
    for (let i = 0; i < 15; i++) {
      newFeatures.push({
        id: `feature-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 8 + Math.random() * 20,
        confidence: 0.7 + Math.random() * 0.3,
      });
    }
    return newFeatures;
  }, []);

  const runAnalysis = useCallback(async () => {
    setIsRunning(true);
    setFeatures([]);
    setProgress(0);

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
        
        if (currentStage.key === "feature_extraction" && step % 4 === 0) {
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
    setIsRunning(false);
    setScanLine(0);
  }, [generateFeatures]);

  const reset = () => {
    setStage("idle");
    setIsRunning(false);
    setProgress(0);
    setFeatures([]);
    setScanLine(0);
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

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Демо: Как работает Computer Vision
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Analysis Area */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border">
          {/* Sample Image */}
          <img
            src={SAMPLE_IMAGE}
            alt="Core sample demo"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
              stage === "preprocessing" ? "grayscale contrast-125" : ""
            } ${stage === "edge_detection" ? "grayscale brightness-110" : ""}`}
          />
          
          {/* Edge Detection Overlay */}
          {stage === "edge_detection" && (
            <>
              <div 
                className="absolute left-0 right-0 h-1 bg-primary/80 shadow-[0_0_10px_hsl(var(--primary))]"
                style={{ top: `${scanLine}%` }}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent"
                style={{ height: `${scanLine}%` }}
              />
            </>
          )}

          {/* Segmentation Grid */}
          {(stage === "segmentation" || stage === "classification" || stage === "complete") && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" className="animate-pulse" />
            </svg>
          )}

          {/* Detected Features */}
          {features.map((feature, idx) => (
            <div
              key={feature.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-in zoom-in duration-300"
              style={{
                left: `${feature.x}%`,
                top: `${feature.y}%`,
                animationDelay: `${idx * 50}ms`,
              }}
            >
              <div
                className="rounded-full border-2 flex items-center justify-center text-[8px] font-bold"
                style={{
                  width: feature.size,
                  height: feature.size,
                  borderColor: getFeatureColor(feature.type),
                  backgroundColor: `${getFeatureColor(feature.type)}20`,
                  color: getFeatureColor(feature.type),
                }}
              >
                {Math.round(feature.confidence * 100)}%
              </div>
            </div>
          ))}

          {/* Processing Overlay */}
          {isRunning && (
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] flex items-center justify-center">
              <div className="bg-background/90 rounded-lg px-4 py-2 flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Анализ...</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Прогресс анализа</span>
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
              Поры: {features.filter(f => f.type === "pore").length}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              Трещины: {features.filter(f => f.type === "fracture").length}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              Минералы: {features.filter(f => f.type === "mineral").length}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              Зёрна: {features.filter(f => f.type === "grain").length}
            </Badge>
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
            Запустить демо
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
          <p><strong>Этапы анализа компьютерного зрения:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Предобработка</strong> — нормализация яркости, удаление шума</li>
            <li><strong>Обнаружение границ</strong> — алгоритмы Canny/Sobel для контуров</li>
            <li><strong>Извлечение признаков</strong> — CNN извлекает текстуры и паттерны</li>
            <li><strong>Сегментация</strong> — разделение на смысловые области</li>
            <li><strong>Классификация</strong> — нейросеть определяет типы пород</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
