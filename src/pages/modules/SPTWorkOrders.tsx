import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClipboardList, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const STATUSES = ["planned", "approved", "in_progress", "completed", "rejected"] as const;

interface Row {
  id: string;
  well_id: string | null;
  restoration_date: string;
  created_at: string;
  source: string;
  spt_depth_ft: number | null;
  predicted_qoil: number | null;
  predicted_cum: number | null;
  payload: any;
  wells?: { well_name: string | null; api_number: string | null } | null;
}

const statusStyle: Record<string, string> = {
  planned: "bg-primary/20 text-primary border-primary/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function SPTWorkOrders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("well_restorations")
      .select("id,well_id,restoration_date,created_at,source,spt_depth_ft,predicted_qoil,predicted_cum,payload,wells(well_name,api_number)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (row: Row, status: string) => {
    setSavingId(row.id);
    const payload = { ...(row.payload ?? {}), status, status_updated_at: new Date().toISOString() };
    const { error } = await supabase.from("well_restorations").update({ payload }).eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, payload } : x)));
      toast.success(`Status → ${status}`);
    }
    setSavingId(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-[10px]">Stage AI · Registry</Badge>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" /> SPT Work Order Registry
          </h1>
          <Badge variant="outline">{rows.length} records</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
          <Button asChild>
            <Link to="/dashboard/spt-advisor">SPT Advisor <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground max-w-3xl">
        Every recommendation approved in SPT Advisor is persisted here with its creation date, forecast
        (P10 / P50 / P90, incremental uplift) and lifecycle status.
      </p>

      <div className="space-y-3">
        {rows.length === 0 && !loading && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
            No work orders yet. Run SPT Advisor and approve a recommendation.
          </CardContent></Card>
        )}
        {rows.map((r) => {
          const p = r.payload ?? {};
          const f = p.forecast ?? {};
          const status = p.status ?? "planned";
          return (
            <Card key={r.id}>
              <CardHeader className="pb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                  {r.wells?.well_name || "Unlinked well"}
                  <span className="font-mono text-xs text-muted-foreground">#{r.id.slice(0, 8)}</span>
                  <Badge variant="outline" className={statusStyle[status] ?? ""}>{status}</Badge>
                  <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                  <Select value={status} onValueChange={(v) => setStatus(r, v)} disabled={savingId === r.id}>
                    <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <Cell label="SPT depth" value={r.spt_depth_ft != null ? `${r.spt_depth_ft} ft` : "—"} />
                  <Cell label="Rate after SPT (P50)" value={r.predicted_qoil != null ? `${r.predicted_qoil} BOPD` : "—"} accent />
                  <Cell label="Cum P50" value={r.predicted_cum != null ? `${Math.round(r.predicted_cum).toLocaleString()} bbl` : "—"} />
                  <Cell label="Uplift" value={f.uplift_bbl != null ? `+${Number(f.uplift_bbl).toLocaleString()} bbl` : (p.expected_uplift_bbl != null ? `+${Number(p.expected_uplift_bbl).toLocaleString()} bbl` : "—")} accent />
                  <Cell label="Score / confidence" value={`${p.score ?? "—"}/100 · ${p.confidence_adjusted != null ? Math.round(p.confidence_adjusted * 100) + "%" : "—"}`} />
                </div>
                {(f.cum_p10_bbl != null || f.cum_p90_bbl != null) && (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <Cell label="P10 cumulative" value={`${Number(f.cum_p10_bbl ?? 0).toLocaleString()} bbl`} />
                    <Cell label="P50 cumulative" value={`${Number(f.cum_p50_bbl ?? 0).toLocaleString()} bbl`} />
                    <Cell label="P90 cumulative" value={`${Number(f.cum_p90_bbl ?? 0).toLocaleString()} bbl`} />
                  </div>
                )}
                {p.reasoning && <p className="text-sm text-muted-foreground leading-relaxed">{p.reasoning}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-2 rounded-md bg-muted/40">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold text-sm ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
