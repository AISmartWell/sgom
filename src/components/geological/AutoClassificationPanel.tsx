import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import type { SeismicTrace } from "./SeismicDataUpload";

interface ClassifiedZone {
  depthFrom: number;
  depthTo: number;
  lithology: string;
  color: string;
  confidence: number;
}

interface AutoClassificationPanelProps {
  data: SeismicTrace[];
}

const AutoClassificationPanel = ({ data }: AutoClassificationPanelProps) => {
  const zones = useMemo(() => {
    if (data.length < 3) return [];

    const results: ClassifiedZone[] = [];
    let currentType = "";
    let startDepth = data[0].depth;

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const avgAmp = d.amplitude;
      const highFreq = Math.abs(d.trace1 - d.trace2);

      // Simple rule-based classification
      let lithology: string;
      let color: string;
      let confidence: number;

      if (avgAmp > 30 && highFreq > 20) {
        lithology = "Sandstone";
        color = "hsl(var(--success))";
        confidence = 82;
      } else if (avgAmp < -20) {
        lithology = "Shale";
        color = "hsl(var(--muted-foreground))";
        confidence = 88;
      } else if (avgAmp > 15 && highFreq < 10) {
        lithology = "Limestone";
        color = "hsl(var(--primary))";
        confidence = 75;
      } else if (avgAmp < -10 && highFreq > 25) {
        lithology = "Dolomite";
        color = "hsl(var(--accent))";
        confidence = 68;
      } else {
        lithology = "Siltstone";
        color = "hsl(var(--warning))";
        confidence = 60;
      }

      if (lithology !== currentType) {
        if (currentType && i > 0) {
          results.push({
            depthFrom: startDepth,
            depthTo: data[i - 1].depth,
            lithology: currentType,
            color: results.length > 0 ? results[results.length - 1].color : color,
            confidence: results.length > 0 ? results[results.length - 1].confidence : confidence,
          });
        }
        currentType = lithology;
        startDepth = d.depth;
      }

      // Push the last zone's color/confidence
      if (results.length > 0 && results[results.length - 1].lithology === currentType) {
        // already tracked
      }

      if (i === data.length - 1) {
        results.push({ depthFrom: startDepth, depthTo: d.depth, lithology, color, confidence });
      }
    }

    // Merge adjacent zones of same type
    const merged: ClassifiedZone[] = [];
    for (const z of results) {
      const last = merged[merged.length - 1];
      if (last && last.lithology === z.lithology) {
        last.depthTo = z.depthTo;
      } else {
        merged.push({ ...z });
      }
    }

    return merged.slice(0, 8);
  }, [data]);

  if (zones.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-1.5">
        <Layers className="h-3.5 w-3.5 text-primary" />
        Auto-Classification (Lithology)
      </h4>
      {/* Visual column */}
      <div className="flex rounded-lg overflow-hidden h-8 border border-border/50">
        {zones.map((z, i) => {
          const totalDepth = zones[zones.length - 1].depthTo - zones[0].depthFrom;
          const width = ((z.depthTo - z.depthFrom) / totalDepth) * 100;
          return (
            <div
              key={i}
              className="relative group cursor-default"
              style={{
                width: `${Math.max(width, 3)}%`,
                backgroundColor: z.color,
                opacity: 0.7,
              }}
              title={`${z.lithology} (${z.depthFrom}–${z.depthTo}m)`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-background border border-border rounded px-2 py-1 text-[10px] whitespace-nowrap z-10 shadow-lg">
                <strong>{z.lithology}</strong> · {z.depthFrom}–{z.depthTo}m · {z.confidence}%
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {[...new Set(zones.map(z => z.lithology))].map(lith => {
          const z = zones.find(z => z.lithology === lith)!;
          return (
            <Badge key={lith} variant="outline" className="text-[10px] gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: z.color, opacity: 0.7 }} />
              {lith}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default AutoClassificationPanel;
