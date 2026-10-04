import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WellWaterInputs {
  well_id: string;
  company_id: string;
  formation_tds_ppm: number | null;
  injection_tds_ppm: number | null;
  reservoir_temp_f: number | null;
  cum_injected_bbl: number | null;
  cum_produced_bbl: number | null;
  rw_formation: number | null;
  rw_injection: number | null;
  injection_share_pct: number | null;
  history_period: string | null;
  h2s_ppm: number | null;
  co2_pct: number | null;
  gas_note: string | null;
  reservoir_pressure_psi: number | null;
  pressure_datum_ft: number | null;
  bht_f: number | null;
  bht_depth_ft: number | null;
  surface_temp_f: number | null;
  updated_at: string;
}

/** Per-well injection & salinity inputs, shared with everyone in the well's company. */
export function useWellWaterInputs(wellId: string | undefined, refresh = 0) {
  const [data, setData] = useState<WellWaterInputs | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setData(null);
    if (!wellId) return;
    let off = false;
    setLoading(true);
    supabase.from("well_water_inputs").select("*").eq("well_id", wellId).maybeSingle()
      .then(({ data }) => { if (!off) { setData((data as WellWaterInputs) ?? null); setLoading(false); } });
    return () => { off = true; };
  }, [wellId, refresh]);
  return { data, loading };
}
