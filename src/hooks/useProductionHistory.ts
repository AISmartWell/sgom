import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProductionRecord {
  month: number; // 0-based index from earliest record
  date: string;
  oil_bbl: number;
  gas_mcf: number;
  water_bbl: number;
  days_on: number;
  rate: number; // oil_bbl / days_on (bbl/d)
  cumulative: number; // running total oil_bbl
}

interface UseProductionHistoryResult {
  data: ProductionRecord[] | null;
  isLoading: boolean;
  hasRealData: boolean;
}

export function useProductionHistory(wellId: string | undefined): UseProductionHistoryResult {
  const [data, setData] = useState<ProductionRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!wellId) {
      setData(null);
      return;
    }

    let cancelled = false;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const { data: rows, error } = await supabase
          .from("production_history")
          .select("production_month, oil_bbl, gas_mcf, water_bbl, days_on")
          .eq("well_id", wellId)
          .order("production_month", { ascending: true });

        if (error || !rows || rows.length === 0) {
          if (!cancelled) setData(null);
          return;
        }

        let cumulative = 0;
        const records: ProductionRecord[] = rows.map((r, i) => {
          const oil = r.oil_bbl ?? 0;
          const days = r.days_on ?? 30;
          cumulative += oil;
          return {
            month: i,
            date: r.production_month,
            oil_bbl: oil,
            gas_mcf: r.gas_mcf ?? 0,
            water_bbl: r.water_bbl ?? 0,
            days_on: days,
            rate: days > 0 ? +(oil / days).toFixed(2) : 0,
            cumulative: Math.round(cumulative),
          };
        });

        if (!cancelled) setData(records);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [wellId]);

  return { data, isLoading, hasRealData: !!data && data.length > 0 };
}
