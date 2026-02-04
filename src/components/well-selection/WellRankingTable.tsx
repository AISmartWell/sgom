import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, Info, Loader2 } from "lucide-react";
import { WellRanking, WellData } from "@/hooks/useWellRanking";

interface WellRankingTableProps {
  rankings: WellRanking[] | null;
  wells: WellData[];
  isLoading: boolean;
}

const WellRankingTable = ({ rankings, wells, isLoading }: WellRankingTableProps) => {
  const getPotentialBadge = (potential: string) => {
    switch (potential) {
      case "high":
        return <Badge className="bg-success/20 text-success border-success/30">High Potential</Badge>;
      case "medium":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Medium</Badge>;
      case "low":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Low</Badge>;
      default:
        return null;
    }
  };

  const getPotentialIcon = (potential: string) => {
    switch (potential) {
      case "high":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "medium":
        return <Minus className="h-4 w-4 text-warning" />;
      case "low":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getWellData = (wellId: string) => wells.find(w => w.id === wellId);

  // Show static data if no AI rankings yet
  const displayData = rankings || wells.map(w => ({
    wellId: w.id,
    score: 0,
    potential: "medium" as const,
    recommendation: "Run AI analysis to get recommendations",
    factors: { production: 0, geology: 0, age: 0, waterCut: 0 }
  }));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Ranking Results
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </CardTitle>
        <CardDescription>
          {rankings ? "Wells sorted by SPT treatment potential" : "Click 'Run AI Selection' to analyze wells"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Well ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Potential</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">AI Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Current (BPD)</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">AI is analyzing wells...</p>
                      <p className="text-sm text-muted-foreground">This may take 10-20 seconds</p>
                    </div>
                  </td>
                </tr>
              ) : displayData.map((ranking) => {
                const well = getWellData(ranking.wellId);
                return (
                  <tr key={ranking.wellId} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono text-sm">{ranking.wellId}</td>
                    <td className="py-3 px-4 font-medium">{well?.name || ranking.wellId}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getPotentialIcon(ranking.potential)}
                        {getPotentialBadge(ranking.potential)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={ranking.score} className="w-16 h-2" />
                        <span className="text-sm font-medium">{ranking.score || "—"}</span>
                        {rankings && ranking.factors && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1 text-xs">
                                  <p>Production: {ranking.factors.production}</p>
                                  <p>Geology: {ranking.factors.geology}</p>
                                  <p>Age: {ranking.factors.age}</p>
                                  <p>Water Cut: {ranking.factors.waterCut}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{well?.currentProduction || 0} BPD</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                      {ranking.recommendation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WellRankingTable;
