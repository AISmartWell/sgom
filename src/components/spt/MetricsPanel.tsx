import { Gauge, Droplets, Timer, Layers } from "lucide-react";
import { SimulationMetrics } from "@/hooks/useSPTSimulation";

interface MetricsPanelProps {
  metrics: SimulationMetrics;
}

const MetricsPanel = ({ metrics }: MetricsPanelProps) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">Depth</p>
        <p className="text-xl font-bold">{metrics.depth.toLocaleString()} ft</p>
      </div>
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Pressure</span>
        </div>
        <p className="text-xl font-bold">{metrics.pressure.toLocaleString()} PSI</p>
      </div>
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Droplets className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Flow Rate</span>
        </div>
        <p className="text-xl font-bold">{metrics.flowRate} GPM</p>
      </div>
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cut Speed</span>
        </div>
        <p className="text-xl font-bold">{metrics.cutSpeed} ft/hr</p>
      </div>
    </div>
  );
};

export default MetricsPanel;
