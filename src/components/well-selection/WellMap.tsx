import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WellRanking } from "@/hooks/useWellRanking";

interface WellMapProps {
  rankings: WellRanking[] | null;
  region: string;
}

const WELL_POSITIONS = [
  { id: "W-001", top: "20%", left: "25%" },
  { id: "W-002", top: "35%", left: "40%" },
  { id: "W-003", top: "45%", left: "30%" },
  { id: "W-004", top: "25%", left: "60%" },
  { id: "W-005", top: "55%", left: "50%" },
  { id: "W-006", top: "65%", left: "70%" },
  { id: "W-007", top: "75%", left: "35%" },
  { id: "W-008", top: "80%", left: "55%" },
];

const REGION_NAMES: Record<string, string> = {
  Oklahoma: "Anadarko Basin",
  Texas: "Permian Basin",
  NewMexico: "Delaware Basin",
};

const WellMap = ({ rankings, region }: WellMapProps) => {
  const getWellColor = (wellId: string) => {
    if (!rankings) return "bg-muted";
    const ranking = rankings.find(r => r.wellId === wellId);
    if (!ranking) return "bg-muted";
    switch (ranking.potential) {
      case "high": return "bg-success animate-pulse";
      case "medium": return "bg-warning";
      case "low": return "bg-destructive/70";
      default: return "bg-muted";
    }
  };

  const getWellSize = (wellId: string) => {
    if (!rankings) return "w-3 h-3";
    const ranking = rankings.find(r => r.wellId === wellId);
    if (!ranking) return "w-3 h-3";
    switch (ranking.potential) {
      case "high": return "w-4 h-4";
      case "medium": return "w-3 h-3";
      case "low": return "w-2 h-2";
      default: return "w-3 h-3";
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Well Field Map - {region}</CardTitle>
        <CardDescription>{region.toUpperCase()} • {REGION_NAMES[region] || region}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-80 rounded-lg bg-slate-900/50 border border-border/50 overflow-hidden">
          {/* Grid overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px),
                               linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Well markers */}
          {WELL_POSITIONS.map((pos) => (
            <div
              key={pos.id}
              className={`absolute rounded-full transition-all duration-500 ${getWellColor(pos.id)} ${getWellSize(pos.id)}`}
              style={{ top: pos.top, left: pos.left }}
              title={pos.id}
            />
          ))}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span>High Potential</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>Low/Closed</span>
            </div>
          </div>

          {/* Region label */}
          <div className="absolute top-4 left-4 bg-primary/20 backdrop-blur-sm rounded-lg px-3 py-1">
            <span className="text-sm font-medium text-primary">{REGION_NAMES[region] || region}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WellMap;
