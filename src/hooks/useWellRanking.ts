import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WellData {
  id: string;
  name: string;
  currentProduction: number;
  remainingYears: number;
  depth: number;
  formationType: string;
  lastMaintenanceYears: number;
  waterCut: number;
}

export interface FilterCriteria {
  minRemainingYears: number;
  maxWaterCut: number;
  includeClosedWells: boolean;
  region: string;
}

export interface WellRanking {
  wellId: string;
  score: number;
  potential: "high" | "medium" | "low";
  recommendation: string;
  factors: {
    production: number;
    geology: number;
    age: number;
    waterCut: number;
  };
}

export interface RankingSummary {
  highPotential: number;
  mediumPotential: number;
  lowPotential: number;
  totalAnalyzed: number;
  topRecommendation: string;
}

export interface RankingResult {
  rankings: WellRanking[];
  summary: RankingSummary;
}

// Mock well data for demo
const MOCK_WELLS: WellData[] = [
  { id: "W-001", name: "Anadarko-Alpha", currentProduction: 45, remainingYears: 18, depth: 8500, formationType: "Sandstone", lastMaintenanceYears: 3, waterCut: 35 },
  { id: "W-002", name: "Anadarko-Beta", currentProduction: 38, remainingYears: 22, depth: 9200, formationType: "Carbonate", lastMaintenanceYears: 5, waterCut: 42 },
  { id: "W-003", name: "Anadarko-Gamma", currentProduction: 52, remainingYears: 15, depth: 7800, formationType: "Sandstone", lastMaintenanceYears: 2, waterCut: 28 },
  { id: "W-004", name: "Basin-Delta", currentProduction: 28, remainingYears: 12, depth: 6500, formationType: "Shale", lastMaintenanceYears: 4, waterCut: 55 },
  { id: "W-005", name: "Basin-Epsilon", currentProduction: 22, remainingYears: 8, depth: 5800, formationType: "Sandstone", lastMaintenanceYears: 6, waterCut: 48 },
  { id: "W-006", name: "Central-Zeta", currentProduction: 18, remainingYears: 20, depth: 7200, formationType: "Carbonate", lastMaintenanceYears: 8, waterCut: 62 },
  { id: "W-007", name: "Central-Eta", currentProduction: 8, remainingYears: 25, depth: 6100, formationType: "Shale", lastMaintenanceYears: 10, waterCut: 75 },
  { id: "W-008", name: "South-Theta", currentProduction: 5, remainingYears: 30, depth: 5500, formationType: "Sandstone", lastMaintenanceYears: 12, waterCut: 85 },
];

export const useWellRanking = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RankingResult | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>({
    minRemainingYears: 10,
    maxWaterCut: 70,
    includeClosedWells: false,
    region: "Oklahoma",
  });

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Filter wells based on criteria
      const filteredWells = MOCK_WELLS.filter(well => {
        if (well.remainingYears < filters.minRemainingYears) return false;
        if (well.waterCut > filters.maxWaterCut) return false;
        return true;
      });

      if (filteredWells.length === 0) {
        toast.error("No wells match the current filter criteria");
        setIsAnalyzing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("rank-wells", {
        body: { wells: filteredWells, filters },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success(`AI analysis complete! ${data.summary.totalAnalyzed} wells ranked.`);
    } catch (error) {
      console.error("Well ranking error:", error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<FilterCriteria>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const getWellData = useCallback(() => MOCK_WELLS, []);

  return {
    isAnalyzing,
    result,
    filters,
    runAnalysis,
    updateFilters,
    getWellData,
  };
};
