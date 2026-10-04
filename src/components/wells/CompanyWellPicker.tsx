import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PickerWell = { id: string; well_name: string | null; api_number: string | null };

/** All wells of the user's company (RLS-scoped), paginated past the 1000-row limit. */
export function useCompanyWells() {
  return useQuery({
    queryKey: ["company-wells-picker"],
    queryFn: async () => {
      const all: PickerWell[] = [];
      for (let from = 0; from < 10000; from += 1000) {
        const { data, error } = await supabase.from("wells").select("id, well_name, api_number")
          .order("well_name").range(from, from + 999);
        if (error) throw error;
        all.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      return all;
    },
  });
}

/** Search + select for any company well. Defaults to Brawner 10-15 when present. */
export function CompanyWellPicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const { data: wells } = useCompanyWells();
  const [q, setQ] = useState("");
  useEffect(() => {
    if (value || !wells?.length) return;
    const b = wells.find((w) => (w.well_name ?? "").toLowerCase() === "brawner 10-15");
    onChange((b ?? wells[0]).id);
  }, [wells, value, onChange]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const all = wells ?? [];
    const res = s ? all.filter((w) => `${w.well_name ?? ""} ${w.api_number ?? ""}`.toLowerCase().includes(s)) : all;
    const sel = all.find((w) => w.id === value);
    return sel && !res.includes(sel) ? [sel, ...res.slice(0, 499)] : res.slice(0, 500);
  }, [wells, q, value]);
  return (
    <div data-pdf-skip className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Well:</span>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or API…"
        className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm" />
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        className="h-9 max-w-xs rounded-md border border-input bg-background px-2 text-sm">
        {list.map((w) => <option key={w.id} value={w.id}>{w.well_name ?? "Unnamed"}{w.api_number ? ` · ${w.api_number}` : ""}</option>)}
      </select>
      <span className="text-xs text-muted-foreground">{wells?.length ?? 0} wells in your company</span>
    </div>
  );
}
