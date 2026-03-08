import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FormationCode {
  id: string;
  code: string;
  state_code: string;
  state_name: string;
  county_fips: string | null;
  county_name: string | null;
  well_type: string | null;
  formation: string | null;
  basin: string | null;
  description: string | null;
  source: string | null;
}

export function useFormationCodes(filters?: {
  stateCode?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["formation-codes", filters],
    queryFn: async () => {
      let query = supabase
        .from("formation_codes")
        .select("*")
        .order("code");

      if (filters?.stateCode) {
        query = query.eq("state_code", filters.stateCode);
      }

      if (filters?.search) {
        query = query.or(
          `code.ilike.%${filters.search}%,county_name.ilike.%${filters.search}%,formation.ilike.%${filters.search}%,basin.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FormationCode[];
    },
  });
}

export function useLookupCode(code: string | null) {
  return useQuery({
    queryKey: ["formation-code-lookup", code],
    queryFn: async () => {
      if (!code) return null;
      // Try exact match first
      const { data } = await supabase
        .from("formation_codes")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      
      if (data) return data as FormationCode;

      // Try prefix match (e.g. "15-019" from "15-019-24680")
      const prefix = code.substring(0, 6);
      const { data: prefixData } = await supabase
        .from("formation_codes")
        .select("*")
        .eq("code", prefix)
        .maybeSingle();
      
      return (prefixData as FormationCode) || null;
    },
    enabled: !!code,
  });
}
