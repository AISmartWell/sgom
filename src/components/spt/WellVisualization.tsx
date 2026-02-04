import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SimulationStatus } from "@/hooks/useSPTSimulation";

interface WellVisualizationProps {
  progress: number;
  status: SimulationStatus;
  depth: number;
  targetDepth: number;
}

const statusConfig: Record<SimulationStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-success/20 text-success border-success/30" },
  running: { label: "Cutting...", className: "bg-accent/20 text-accent border-accent/30" },
  paused: { label: "Paused", className: "bg-warning/20 text-warning border-warning/30" },
  completed: { label: "Completed", className: "bg-primary/20 text-primary border-primary/30" },
};

const WellVisualization = ({ progress, status, depth, targetDepth }: WellVisualizationProps) => {
  const slotPosition = 10 + (progress / 100) * 70; // 10% to 80% of container height
  const { label, className } = statusConfig[status];

  return (
    <div className="relative h-80 rounded-lg bg-gradient-to-b from-amber-900/20 via-stone-800/30 to-slate-900/40 border border-border/50 overflow-hidden">
      {/* Depth indicator */}
      <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-between py-4 text-xs text-muted-foreground">
        <span>0 ft</span>
        <span>{Math.round(targetDepth * 0.25)} ft</span>
        <span>{Math.round(targetDepth * 0.5)} ft</span>
        <span>{Math.round(targetDepth * 0.75)} ft</span>
        <span>{targetDepth} ft</span>
      </div>

      {/* Well casing */}
      <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-slate-700/50 transform -translate-x-1/2 border-x border-slate-600/50">
        {/* Completed slots trail */}
        {status !== "ready" && (
          <div 
            className="absolute left-0 right-0 top-[10%] bg-primary/20 transition-all duration-200"
            style={{ height: `${Math.max(0, slotPosition - 10)}%` }}
          />
        )}
        
        {/* Active slot cut animation */}
        {(status === "running" || status === "paused") && (
          <div 
            className="absolute left-0 right-0 h-12 bg-accent/30 border-y border-accent/50 transition-all duration-200"
            style={{ top: `${slotPosition}%` }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className={`h-6 w-6 text-accent ${status === "running" ? "animate-pulse" : ""}`} />
            </div>
            {/* Water jet effect */}
            {status === "running" && (
              <>
                <div className="absolute -left-4 top-1/2 w-4 h-1 bg-blue-400/50 animate-pulse rounded-full" />
                <div className="absolute -right-4 top-1/2 w-4 h-1 bg-blue-400/50 animate-pulse rounded-full" />
              </>
            )}
          </div>
        )}

        {/* Completion marker */}
        {status === "completed" && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/20 to-primary/30" />
        )}
      </div>

      {/* Formation layers */}
      <div className="absolute right-4 top-0 bottom-0 flex flex-col justify-around text-xs text-right">
        <span className="text-amber-400">Surface Formation</span>
        <span className="text-stone-400">Shale Layer</span>
        <span className="text-primary">Target Reservoir</span>
        <span className="text-slate-500">Basement Rock</span>
      </div>

      {/* Current depth indicator */}
      {status !== "ready" && (
        <div 
          className="absolute left-16 text-xs font-medium text-accent bg-background/80 px-2 py-1 rounded transition-all duration-200"
          style={{ top: `${slotPosition}%` }}
        >
          {depth} ft
        </div>
      )}

      {/* Status overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <Badge className={`${className} text-lg px-4 py-2`}>
          {label}
        </Badge>
      </div>
    </div>
  );
};

export default WellVisualization;
