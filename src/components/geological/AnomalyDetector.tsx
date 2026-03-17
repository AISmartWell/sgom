import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Droplets } from "lucide-react";
import type { SeismicTrace } from "./SeismicDataUpload";

interface Anomaly {
  depth: number;
  type: "bright_spot" | "dim_spot" | "flat_spot" | "avo_anomaly";
  severity: "critical" | "warning" | "info";
  description: string;
}

interface AnomalyDetectorProps {
  data: SeismicTrace[];
}

const typeLabels: Record<Anomaly["type"], { label: string; icon: typeof AlertTriangle }> = {
  bright_spot: { label: "Bright Spot", icon: Zap },
  dim_spot: { label: "Dim Spot", icon: AlertTriangle },
  flat_spot: { label: "Flat Spot", icon: Droplets },
  avo_anomaly: { label: "AVO Anomaly", icon: Zap },
};

const severityColors: Record<Anomaly["severity"], string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-primary/15 text-primary border-primary/30",
};

const AnomalyDetector = ({ data }: AnomalyDetectorProps) => {
  const anomalies = useMemo(() => {
    if (data.length < 5) return [];

    const results: Anomaly[] = [];
    const amplitudes = data.map(d => d.amplitude);
    const mean = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
    const std = Math.sqrt(amplitudes.reduce((s, v) => s + (v - mean) ** 2, 0) / amplitudes.length);

    for (let i = 2; i < data.length - 2; i++) {
      const d = data[i];
      const amp = d.amplitude;

      // Bright spot: amplitude > mean + 1.8σ
      if (amp > mean + 1.8 * std) {
        results.push({
          depth: d.depth,
          type: "bright_spot",
          severity: amp > mean + 2.5 * std ? "critical" : "warning",
          description: `High amplitude (${amp.toFixed(1)}) — possible gas accumulation`,
        });
      }

      // Dim spot: amplitude < mean - 1.8σ
      if (amp < mean - 1.8 * std) {
        results.push({
          depth: d.depth,
          type: "dim_spot",
          severity: "warning",
          description: `Low amplitude (${amp.toFixed(1)}) — possible fluid substitution`,
        });
      }

      // Flat spot: constant amplitude across 3+ points
      if (
        i >= 2 &&
        Math.abs(data[i - 1].amplitude - amp) < std * 0.15 &&
        Math.abs(data[i + 1].amplitude - amp) < std * 0.15
      ) {
        const alreadyDetected = results.some(
          r => r.type === "flat_spot" && Math.abs(r.depth - d.depth) < 200
        );
        if (!alreadyDetected) {
          results.push({
            depth: d.depth,
            type: "flat_spot",
            severity: "info",
            description: `Flat reflector at ${d.depth} ft — possible fluid contact (OWC/GWC)`,
          });
        }
      }

      // AVO anomaly: sign reversal between traces
      if (d.trace1 * d.trace2 < 0 && Math.abs(d.trace1 - d.trace2) > std * 1.5) {
        const alreadyDetected = results.some(
          r => r.type === "avo_anomaly" && Math.abs(r.depth - d.depth) < 200
        );
        if (!alreadyDetected) {
          results.push({
            depth: d.depth,
            type: "avo_anomaly",
            severity: "warning",
            description: `Phase reversal between traces — AVO Class II/III indicator`,
          });
        }
      }
    }

    return results.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    }).slice(0, 8);
  }, [data]);

  if (anomalies.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No significant anomalies detected in current dataset
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          Detected Anomalies
        </h4>
        <Badge variant="outline" className="text-[10px]">
          {anomalies.length} found
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {anomalies.map((a, i) => {
          const tl = typeLabels[a.type];
          const Icon = tl.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg border border-border/50 bg-background/50 text-xs"
            >
              <Icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-medium">{tl.label}</span>
                  <Badge className={`text-[9px] px-1 py-0 ${severityColors[a.severity]}`}>
                    {a.depth}m
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-tight">{a.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnomalyDetector;
