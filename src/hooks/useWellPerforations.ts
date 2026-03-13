import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PerforationInterval {
  id: string;
  depth_from: number;
  depth_to: number;
  shots_per_foot: number | null;
  hole_diameter: number | null;
  phasing: number | null;
  date_perforated: string | null;
  status: string | null;
  notes: string | null;
}

interface UseWellPerforationsResult {
  data: PerforationInterval[];
  isLoading: boolean;
  hasData: boolean;
}

export function useWellPerforations(wellId: string | undefined): UseWellPerforationsResult {
  const [data, setData] = useState<PerforationInterval[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!wellId) { setData([]); return; }

    let cancelled = false;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const { data: rows, error } = await (supabase as any)
          .from("well_perforations")
          .select("id, depth_from, depth_to, shots_per_foot, hole_diameter, phasing, date_perforated, status, notes")
          .eq("well_id", wellId)
          .order("depth_from", { ascending: true });

        if (!cancelled) setData(error || !rows ? [] : rows as PerforationInterval[]);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [wellId]);

  return { data, isLoading, hasData: data.length > 0 };
}
