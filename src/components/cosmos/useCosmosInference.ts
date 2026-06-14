import { supabase } from "@/integrations/supabase/client";

export type CosmosMode = "reason" | "predict" | "transfer";

export interface CosmosResponse<T = any> {
  result: T;
  model: string;
  mode: CosmosMode;
  live: boolean;
}

/**
 * Calls the cosmos-inference edge function (NVIDIA hosted models).
 * Returns parsed result + `live: true` on success, or null on failure
 * (caller should use its local fallback).
 */
export async function callCosmos<T = any>(
  mode: CosmosMode,
  payload: { well?: any; prompt?: string; modelOverride?: string }
): Promise<CosmosResponse<T> | null> {
  try {
    const { data, error } = await supabase.functions.invoke("cosmos-inference", {
      body: { mode, ...payload },
    });
    if (error) {
      console.warn(`[cosmos-inference:${mode}]`, error.message);
      return null;
    }
    if (data?.fallback || data?.error) {
      console.warn(`[cosmos-inference:${mode}]`, data.error || "fallback");
      return null;
    }
    return data as CosmosResponse<T>;
  } catch (e) {
    console.warn(`[cosmos-inference:${mode}] threw`, e);
    return null;
  }
}
