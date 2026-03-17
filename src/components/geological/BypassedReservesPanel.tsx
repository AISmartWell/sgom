import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Layers, TrendingUp, AlertTriangle } from "lucide-react";

interface BypassedZone {
  depthFrom: number;
  depthTo: number;
  formation: string;
  lithology: string;
  potential: "high" | "medium" | "low";
  estimatedReserves: string;
  confidence: number;
  indicator: string;
}

interface BypassedReservesPanelProps {
  zones?: BypassedZone[];
  isFromAI?: boolean;
}

const defaultZones: BypassedZone[] = [
  {
    depthFrom: 450,
    depthTo: 650,
    formation: "Wolfcamp A",
    lithology: "Tight Sandstone",
    potential: "high",
    estimatedReserves: "12–18 MBOE",
    confidence: 87,
    indicator: "Bright spot + AVO Class III",
  },
  {
    depthFrom: 1100,
    depthTo: 1350,
    formation: "Bone Spring",
    lithology: "Carbonate",
    potential: "medium",
    estimatedReserves: "6–10 MBOE",
    confidence: 72,
    indicator: "Dim spot anomaly",
  },
  {
    depthFrom: 2800,
    depthTo: 3100,
    formation: "Spraberry",
    lithology: "Siltstone",
    potential: "low",
    estimatedReserves: "2–5 MBOE",
    confidence: 54,
    indicator: "Flat spot at fluid contact",
  },
];

const potentialColors = {
  high: "bg-success/15 text-success border-success/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

const BypassedReservesPanel = ({ zones = defaultZones, isFromAI = false }: BypassedReservesPanelProps) => {
  const totalEstimate = zones.length;
  const highPotential = zones.filter(z => z.potential === "high").length;

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          Bypassed Reserves Detection
          {isFromAI && (
            <Badge variant="outline" className="text-[10px] ml-auto border-primary/30 text-primary">
              AI Result
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-center">
            <p className="text-lg font-bold text-primary">{totalEstimate}</p>
            <p className="text-[10px] text-muted-foreground">Zones Found</p>
          </div>
          <div className="p-2 rounded-lg bg-success/10 text-center">
            <p className="text-lg font-bold text-success">{highPotential}</p>
            <p className="text-[10px] text-muted-foreground">High Potential</p>
          </div>
          <div className="p-2 rounded-lg bg-warning/10 text-center">
            <p className="text-lg font-bold text-warning">20–40%</p>
            <p className="text-[10px] text-muted-foreground">Est. Missed</p>
          </div>
        </div>

        {/* Zones list */}
        <div className="space-y-2">
          {zones.map((zone, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{zone.formation}</span>
                </div>
                <Badge className={`text-[10px] ${potentialColors[zone.potential]}`}>
                  {zone.potential.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                <span>Depth: {zone.depthFrom}–{zone.depthTo} ft</span>
                <span>Lithology: {zone.lithology}</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {zone.estimatedReserves}
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {zone.indicator}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={zone.confidence} className="h-1.5 flex-1" />
                <span className="text-[10px] text-muted-foreground font-medium">{zone.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BypassedReservesPanel;
