import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";

interface WellRecord {
  id: string;
  well_name: string | null;
  county: string | null;
  production_oil: number | null;
  water_cut: number | null;
}

interface PilotStatsProps {
  allWells: WellRecord[];
  sptCandidates: WellRecord[];
  excellentWells: WellRecord[];
  goodWells: WellRecord[];
  marginalWells: WellRecord[];
  nonCandidates: WellRecord[];
}

const PilotStats = ({
  allWells,
  sptCandidates,
  excellentWells,
  goodWells,
  marginalWells,
  nonCandidates,
}: PilotStatsProps) => {
  return (
    <div className="space-y-4">
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            SPT Screening Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg text-center border border-border/30 bg-muted/20">
              <p className="text-2xl font-bold">{allWells.length}</p>
              <p className="text-xs text-muted-foreground">Total OK Wells</p>
            </div>
            <div className="p-3 rounded-lg text-center border border-success/30 bg-success/5">
              <p className="text-2xl font-bold text-success">{sptCandidates.length}</p>
              <p className="text-xs text-muted-foreground">SPT Candidates</p>
            </div>
            <div className="p-3 rounded-lg text-center border border-emerald-500/30 bg-emerald-500/5">
              <p className="text-2xl font-bold text-emerald-400">{excellentWells.length}</p>
              <p className="text-xs text-muted-foreground">Excellent</p>
            </div>
            <div className="p-3 rounded-lg text-center border border-yellow-500/30 bg-yellow-500/5">
              <p className="text-2xl font-bold text-yellow-400">{goodWells.length}</p>
              <p className="text-xs text-muted-foreground">Good</p>
            </div>
            <div className="p-3 rounded-lg text-center border border-orange-500/30 bg-orange-500/5">
              <p className="text-2xl font-bold text-orange-400">{marginalWells.length}</p>
              <p className="text-xs text-muted-foreground">Marginal</p>
            </div>
            <div className="p-3 rounded-lg text-center border border-destructive/30 bg-destructive/5">
              <p className="text-2xl font-bold text-destructive">{nonCandidates.length}</p>
              <p className="text-xs text-muted-foreground">Not Suitable</p>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p><span className="text-emerald-400 font-medium">Excellent:</span> ≤15 bbl/d, WC 20–60%</p>
            <p><span className="text-yellow-400 font-medium">Good:</span> ≤25 bbl/d, WC 10–70%</p>
            <p><span className="text-orange-400 font-medium">Marginal:</span> ≤25 bbl/d, WC &lt;80%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Candidates by County</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(
            sptCandidates.reduce<Record<string, number>>((acc, w) => {
              const c = w.county || "Unknown";
              acc[c] = (acc[c] || 0) + 1;
              return acc;
            }, {})
          ).sort((a, b) => b[1] - a[1]).map(([county, count]) => (
            <div key={county} className="flex justify-between items-center py-1.5 text-sm">
              <span className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-primary" />
                {county}
              </span>
              <Badge variant="outline">{count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PilotStats;
