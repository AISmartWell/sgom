import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WellDataSource = "company" | "demo";

export interface WellData {
  id: string;
  name: string;
  currentProduction: number;
  remainingYears: number;
  depth: number;
  formationType: string;
  lastMaintenanceYears: number;
  waterCut: number;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
  apiNumber?: string | null;
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

// Demo fallback set — used only when the company registry is empty
const MOCK_WELLS: WellData[] = [
  { id: "W-001", name: "Anadarko-Alpha", currentProduction: 45, remainingYears: 18, depth: 8500, formationType: "Sandstone", lastMaintenanceYears: 3, waterCut: 35, latitude: 35.62, longitude: -98.35 },
  { id: "W-002", name: "Anadarko-Beta", currentProduction: 38, remainingYears: 22, depth: 9200, formationType: "Carbonate", lastMaintenanceYears: 5, waterCut: 42, latitude: 35.48, longitude: -97.85 },
  { id: "W-003", name: "Anadarko-Gamma", currentProduction: 52, remainingYears: 15, depth: 7800, formationType: "Sandstone", lastMaintenanceYears: 2, waterCut: 28, latitude: 35.55, longitude: -98.10 },
  { id: "W-004", name: "Basin-Delta", currentProduction: 28, remainingYears: 12, depth: 6500, formationType: "Shale", lastMaintenanceYears: 4, waterCut: 55, latitude: 35.72, longitude: -97.50 },
  { id: "W-005", name: "Basin-Epsilon", currentProduction: 22, remainingYears: 8, depth: 5800, formationType: "Sandstone", lastMaintenanceYears: 6, waterCut: 48, latitude: 35.38, longitude: -97.70 },
  { id: "W-006", name: "Central-Zeta", currentProduction: 18, remainingYears: 20, depth: 7200, formationType: "Carbonate", lastMaintenanceYears: 8, waterCut: 62, latitude: 35.25, longitude: -97.30 },
  { id: "W-007", name: "Central-Eta", currentProduction: 8, remainingYears: 25, depth: 6100, formationType: "Shale", lastMaintenanceYears: 10, waterCut: 75, latitude: 35.10, longitude: -98.20 },
  { id: "W-008", name: "South-Theta", currentProduction: 5, remainingYears: 30, depth: 5500, formationType: "Sandstone", lastMaintenanceYears: 12, waterCut: 85, latitude: 35.05, longitude: -97.60 },
];

const REGION_STATE: Record<string, string> = {
  Oklahoma: "OK",
  Texas: "TX",
  TexasEagleFord: "TX",
  NewMexico: "NM",
};

const DECLINE_RATE = 0.08; // nominal 8%/yr exponential decline
const ECONOMIC_LIMIT_BPD = 2;

/** Remaining life from exponential decline to the economic limit. */
const estimateRemainingYears = (qOil: number): number => {
  if (!qOil || qOil <= ECONOMIC_LIMIT_BPD) return 0;
  return Math.round(Math.log(qOil / ECONOMIC_LIMIT_BPD) / DECLINE_RATE);
};

const yearsSince = (iso?: string | null): number => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.round((Date.now() - t) / (365.25 * 24 * 3600 * 1000)));
};

export const useWellRanking = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingWells, setIsLoadingWells] = useState(true);
  const [wells, setWells] = useState<WellData[]>([]);
  const [dataSource, setDataSource] = useState<WellDataSource>("demo");
  const [result, setResult] = useState<RankingResult | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>({
    minRemainingYears: 10,
    maxWaterCut: 70,
    includeClosedWells: false,
    region: "Oklahoma",
  });

  const loadWells = useCallback(async () => {
    setIsLoadingWells(true);
    setResult(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: uc } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user?.id ?? "")
        .limit(1)
        .maybeSingle();

      let q = supabase
        .from("wells")
        .select(
          "id,well_name,api_number,formation,total_depth,production_oil,water_cut,status,latitude,longitude,completion_date,spud_date,state,company_id"
        )
        .order("production_oil", { ascending: false, nullsFirst: false })
        .limit(500);

      if (uc?.company_id) q = q.eq("company_id", uc.company_id);
      const stateCode = REGION_STATE[filters.region];
      if (stateCode) q = q.eq("state", stateCode);

      const { data, error } = await q;
      if (error) throw error;

      const mapped: WellData[] = (data ?? []).map((w: any) => {
        const qOil = Number(w.production_oil) || 0;
        return {
          id: w.id,
          name: w.well_name || w.api_number || w.id.slice(0, 8),
          apiNumber: w.api_number,
          currentProduction: Math.round(qOil * 10) / 10,
          remainingYears: estimateRemainingYears(qOil),
          depth: Number(w.total_depth) || 0,
          formationType: w.formation || "Unknown",
          lastMaintenanceYears: yearsSince(w.completion_date || w.spud_date),
          waterCut: Number(w.water_cut) || 0,
          latitude: w.latitude,
          longitude: w.longitude,
          status: w.status,
        };
      });

      if (mapped.length > 0) {
        setWells(mapped);
        setDataSource("company");
      } else {
        setWells(MOCK_WELLS);
        setDataSource("demo");
      }
    } catch (e) {
      console.error("Load wells error:", e);
      setWells(MOCK_WELLS);
      setDataSource("demo");
    } finally {
      setIsLoadingWells(false);
    }
  }, [filters.region]);

  useEffect(() => {
    loadWells();
  }, [loadWells]);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const filteredWells = wells.filter((well) => {
        if (well.remainingYears < filters.minRemainingYears) return false;
        if (well.waterCut > filters.maxWaterCut) return false;
        if (!filters.includeClosedWells && well.status && /plug|abandon|closed|inactive/i.test(well.status)) return false;
        return true;
      });

      if (filteredWells.length === 0) {
        toast.error("No wells match the current filter criteria");
        setIsAnalyzing(false);
        return;
      }

      // Cap the AI payload for large registries — analyze the strongest candidates
      const payload = filteredWells.slice(0, 40).map(({ latitude, longitude, status, apiNumber, ...w }) => w);

      const { data, error } = await supabase.functions.invoke("rank-wells", {
        body: { wells: payload, filters },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast.success(`AI analysis complete! ${data.summary.totalAnalyzed} wells ranked.`);
    } catch (error) {
      console.error("Well ranking error:", error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [filters, wells]);

  const updateFilters = useCallback((newFilters: Partial<FilterCriteria>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const getWellData = useCallback(() => wells, [wells]);

  return {
    isAnalyzing,
    isLoadingWells,
    dataSource,
    wells,
    result,
    filters,
    runAnalysis,
    updateFilters,
    getWellData,
    reloadWells: loadWells,
  };
};
