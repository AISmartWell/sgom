import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RankingSummary as RankingSummaryType } from "@/hooks/useWellRanking";
import { Sparkles, AlertCircle } from "lucide-react";

interface RankingSummaryProps {
  summary: RankingSummaryType | null;
}

const RankingSummary = ({ summary }: RankingSummaryProps) => {
  if (!summary) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Run AI analysis to see results
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground">Total Analyzed</span>
          <span className="text-xl font-bold">{summary.totalAnalyzed}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
          <span className="text-sm text-success">High Potential (SPT)</span>
          <span className="text-xl font-bold text-success">{summary.highPotential}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
          <span className="text-sm text-warning">Medium Potential</span>
          <span className="text-xl font-bold text-warning">{summary.mediumPotential}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
          <span className="text-sm text-destructive">Low Potential</span>
          <span className="text-xl font-bold text-destructive">{summary.lowPotential}</span>
        </div>

        {summary.topRecommendation && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <Badge variant="outline" className="mb-2 text-primary border-primary/30">
                  AI Recommendation
                </Badge>
                <p className="text-sm">{summary.topRecommendation}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingSummary;
