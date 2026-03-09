import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WellLogPoint {
  measured_depth: number;
  gamma_ray: number | null;
  resistivity: number | null;
  porosity: number | null;
  water_saturation: number | null;
  sp: number | null;
  density: number | null;
  neutron_porosity: number | null;
  source: string;
}

interface UseWellLogsResult {
  data: WellLogPoint[] | null;
  isLoading: boolean;
  hasRealData: boolean;
}

export function useWellLogs(wellId: string | undefined): UseWellLogsResult {
  const [data, setData] = useState<WellLogPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!wellId) { setData(null); return; }

    let cancelled = false;
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const { data: rows, error } = await (supabase as any)
          .from("well_logs")
          .select("measured_depth, gamma_ray, resistivity, porosity, water_saturation, sp, density, neutron_porosity, source")
          .eq("well_id", wellId)
          .order("measured_depth", { ascending: true });

        if (error || !rows || rows.length === 0) {
          if (!cancelled) setData(null);
          return;
        }
        if (!cancelled) setData(rows as WellLogPoint[]);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchLogs();
    return () => { cancelled = true; };
  }, [wellId]);

  return { data, isLoading, hasRealData: !!data && data.length > 0 };
}
