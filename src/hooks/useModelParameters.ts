import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ModelParameters = {
  id: string;
  scope_type: "well" | "formation" | "global";
  scope_key: string;
  arps_b: number;
  arps_b_variance: number;
  arps_di: number;
  arps_di_variance: number;
  spt_multiplier: number;
  spt_multiplier_variance: number;
  confidence: number;
  sample_count: number;
  model_version: string;
  last_calibrated_at: string | null;
};

export type CalibrationAuditRow = {
  id: string;
  scope_type: string | null;
  scope_key: string | null;
  method: string;
  residual: number | null;
  mape: number | null;
  confidence_delta: number | null;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  input_summary: Record<string, unknown>;
  created_at: string;
};

/** Resolves model_parameters for a scope. Falls back to global default. */
export function useModelParameters(scopeType: "well" | "formation" | "global", scopeKey: string) {
  const [params, setParams] = useState<ModelParameters | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: scoped } = await supabase
      .from("model_parameters" as never)
      .select("*")
      .eq("scope_type", scopeType)
      .eq("scope_key", scopeKey)
      .maybeSingle();
    if (scoped) {
      setParams(scoped as unknown as ModelParameters);
    } else {
      const { data: gl } = await supabase
        .from("model_parameters" as never)
        .select("*")
        .eq("scope_type", "global")
        .eq("scope_key", "default")
        .maybeSingle();
      setParams((gl as unknown as ModelParameters) ?? null);
    }
    setLoading(false);
  }, [scopeType, scopeKey]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const ch = supabase
      .channel(`model_params_${scopeType}_${scopeKey}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "model_parameters", filter: `scope_key=eq.${scopeKey}` },
        () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [scopeType, scopeKey, refresh]);

  return { params, loading, refresh };
}

export function useCalibrationAudit(scopeKey: string | null, limit = 10) {
  const [rows, setRows] = useState<CalibrationAuditRow[]>([]);
  useEffect(() => {
    if (!scopeKey) { setRows([]); return; }
    (async () => {
      const { data } = await supabase
        .from("calibration_audit" as never)
        .select("*")
        .eq("scope_key", scopeKey)
        .order("created_at", { ascending: false })
        .limit(limit);
      setRows((data ?? []) as unknown as CalibrationAuditRow[]);
    })();
  }, [scopeKey, limit]);
  return rows;
}
