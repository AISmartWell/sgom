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

export interface WellLogsDiagnostics {
  wellId?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  rowCount?: number;
  httpStatus?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
  errorHint?: string | null;
  exception?: string | null;
}

interface UseWellLogsResult {
  data: WellLogPoint[] | null;
  isLoading: boolean;
  hasRealData: boolean;
  diagnostics: WellLogsDiagnostics;
}

export function useWellLogs(wellId: string | undefined): UseWellLogsResult {
  const [data, setData] = useState<WellLogPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<WellLogsDiagnostics>({});

  useEffect(() => {
    if (!wellId) {
      setData(null);
      setDiagnostics({ errorMessage: "wellId is empty" });
      return;
    }

    let cancelled = false;
    const startedAt = new Date();
    const startMs = performance.now();

    const fetchLogs = async () => {
      setIsLoading(true);
      const base: WellLogsDiagnostics = {
        wellId,
        startedAt: startedAt.toISOString(),
      };
      try {
        const res: any = await (supabase as any)
          .from("well_logs")
          .select(
            "measured_depth, gamma_ray, resistivity, porosity, water_saturation, sp, density, neutron_porosity, source",
          )
          .eq("well_id", wellId)
          .order("measured_depth", { ascending: true });

        const { data: rows, error, status } = res;
        const diag: WellLogsDiagnostics = {
          ...base,
          finishedAt: new Date().toISOString(),
          durationMs: Math.round(performance.now() - startMs),
          httpStatus: status ?? null,
          rowCount: rows?.length ?? 0,
          errorCode: error?.code ?? null,
          errorMessage: error?.message ?? null,
          errorDetails: error?.details ?? null,
          errorHint: error?.hint ?? null,
        };

        if (cancelled) return;
        setDiagnostics(diag);

        if (error || !rows || rows.length === 0) {
          setData(null);
          return;
        }
        setData(rows as WellLogPoint[]);
      } catch (e: any) {
        if (cancelled) return;
        setDiagnostics({
          ...base,
          finishedAt: new Date().toISOString(),
          durationMs: Math.round(performance.now() - startMs),
          exception: e?.message ?? String(e),
        });
        setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchLogs();
    return () => {
      cancelled = true;
    };
  }, [wellId]);

  return {
    data,
    isLoading,
    hasRealData: !!data && data.length > 0,
    diagnostics,
  };
}
