import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play, Zap, Loader2, CheckCircle2, Download, Link2, Scan, Tags,
  TrendingDown, Target, DollarSign, Waves, Droplets, FileText
} from "lucide-react";

const pipelineSteps = [
  { label: "Import Well Data", desc: "Importing from OCC & Texas RRC", icon: Download, pctThreshold: 12 },
  { label: "Link Core Data", desc: "Linking core images by API number", icon: Link2, pctThreshold: 25 },
  { label: "Field Scanning", desc: "Satellite & surface analysis", icon: Scan, pctThreshold: 35 },
  { label: "Data Classification", desc: "Rock type & formation classification", icon: Tags, pctThreshold: 45 },
  { label: "Decline Analysis", desc: "Cumulative production decline curves", icon: TrendingDown, pctThreshold: 55 },
  { label: "SPT Projection", desc: "Stimulation treatment projections", icon: Target, pctThreshold: 65 },
  { label: "Economic Analysis", desc: "NPV, IRR, payback calculations", icon: DollarSign, pctThreshold: 75 },
  { label: "Geophysical Analysis", desc: "Well log interpretation", icon: Waves, pctThreshold: 82 },
  { label: "EOR Optimization", desc: "Enhanced oil recovery modeling", icon: Droplets, pctThreshold: 90 },
  { label: "Generate Report", desc: "Comprehensive PDF export", icon: FileText, pctThreshold: 100 },
];

interface PipelineTabProps {
  pipelineRunning: boolean;
  pipelineProgress: number;
  pipelineStep: string;
  onRunPipeline: () => void;
}

export function PipelineTab({ pipelineRunning, pipelineProgress, pipelineStep, onRunPipeline }: PipelineTabProps) {
  const completed = pipelineProgress >= 100;

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Full Analysis Pipeline
        </CardTitle>
        <CardDescription>One-click execution: Import → 8-Stage Analysis → Report Generation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Start / progress header */}
        {!pipelineRunning && !completed ? (
          <div className="text-center py-6">
            <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Play className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Run Full Pipeline</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Automatically imports new well data, runs all 8 analysis stages, and generates a comprehensive report.
            </p>
            <Button size="lg" onClick={onRunPipeline} className="gap-2">
              <Zap className="h-5 w-5" />
              Start Full Pipeline
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-3">
              {completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              <span className="font-medium">{completed ? "Pipeline Complete!" : "Pipeline Running..."}</span>
              <Badge className={completed ? "bg-green-500/15 text-green-600" : "bg-primary/20 text-primary"}>
                {pipelineProgress}%
              </Badge>
            </div>
            {/* Gradient progress bar */}
            <div className="w-full bg-muted rounded-full h-3 mb-1 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-700 bg-gradient-to-r from-primary via-primary/80 to-green-500"
                style={{ width: `${pipelineProgress}%` }}
              />
            </div>
            {!completed && <p className="text-xs text-muted-foreground">{pipelineStep}</p>}
          </div>
        )}

        {/* Vertical timeline */}
        <div className="relative pl-8">
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-muted" />
          {pipelineSteps.map((step, i) => {
            const isDone = pipelineRunning && pipelineProgress >= step.pctThreshold;
            const isCurrent = pipelineRunning && !isDone && (i === 0 || pipelineProgress >= pipelineSteps[i - 1].pctThreshold);
            const StepIcon = step.icon;

            return (
              <div
                key={step.label}
                className={`relative flex items-start gap-3 pb-5 last:pb-0 transition-all duration-500 ${
                  isDone ? "opacity-100" : isCurrent ? "opacity-100" : pipelineRunning ? "opacity-40" : "opacity-80"
                }`}
              >
                {/* Node */}
                <div
                  className={`absolute -left-8 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isDone
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrent
                      ? "bg-primary/20 border-primary text-primary animate-pulse"
                      : "bg-card border-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                </div>

                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDone ? "text-green-600" : isCurrent ? "text-primary" : ""}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary card on completion */}
        {completed && (
          <Card className="border-green-500/30 bg-green-500/5 animate-fade-in">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Pipeline Summary
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { label: "Wells Processed", value: "142" },
                  { label: "Core Images Linked", value: "89" },
                  { label: "Avg. Decline Rate", value: "12.4%" },
                  { label: "Report Generated", value: "✓" },
                ].map(item => (
                  <div key={item.label} className="p-2 rounded-lg bg-card">
                    <p className="text-lg font-bold">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
