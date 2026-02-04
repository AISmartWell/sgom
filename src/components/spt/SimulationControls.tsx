import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Square } from "lucide-react";
import { SimulationStatus } from "@/hooks/useSPTSimulation";

interface SimulationControlsProps {
  status: SimulationStatus;
  progress: number;
  slotsCut: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onStop: () => void;
}

const SimulationControls = ({
  status,
  progress,
  slotsCut,
  onStart,
  onPause,
  onResume,
  onReset,
  onStop,
}: SimulationControlsProps) => {
  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Treatment Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Slots Cut: {slotsCut}/10</span>
          <span>Est. Production Increase: {Math.round(5 + (progress / 100) * 15)}×</span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-3">
        {status === "ready" && (
          <Button onClick={onStart} className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            Start Treatment
          </Button>
        )}
        
        {status === "running" && (
          <>
            <Button onClick={onPause} variant="secondary" className="flex-1">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button onClick={onStop} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}
        
        {status === "paused" && (
          <>
            <Button onClick={onResume} className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
            <Button onClick={onReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </>
        )}
        
        {status === "completed" && (
          <Button onClick={onReset} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Run New Treatment
          </Button>
        )}
      </div>
    </div>
  );
};

export default SimulationControls;
