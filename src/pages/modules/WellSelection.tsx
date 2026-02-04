import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Play, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWellRanking } from "@/hooks/useWellRanking";
import WellFilters from "@/components/well-selection/WellFilters";
import WellRankingTable from "@/components/well-selection/WellRankingTable";
import WellMap from "@/components/well-selection/WellMap";
import RankingSummary from "@/components/well-selection/RankingSummary";

const WellSelection = () => {
  const navigate = useNavigate();
  const { isAnalyzing, result, filters, runAnalysis, updateFilters, getWellData } = useWellRanking();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎯</span>
            <h1 className="text-3xl font-bold">AI Well Selection & Ranking</h1>
          </div>
          <p className="text-muted-foreground">
            Pattern recognition and ML-based well ranking for SPT treatment
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="text-primary border-primary">
            <Target className="mr-1 h-3 w-3" />
            AI-Powered
          </Badge>
          <Button onClick={runAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run AI Selection
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <WellMap rankings={result?.rankings || null} region={filters.region} />
          <WellRankingTable
            rankings={result?.rankings || null}
            wells={getWellData()}
            isLoading={isAnalyzing}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <WellFilters
            filters={filters}
            onFiltersChange={updateFilters}
            disabled={isAnalyzing}
          />
          <RankingSummary summary={result?.summary || null} />
        </div>
      </div>
    </div>
  );
};

export default WellSelection;
