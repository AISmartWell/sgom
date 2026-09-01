import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, RefreshCw, ScanText, Loader2 } from "lucide-react";

interface WellRow {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  formation: string | null;
  total_depth: number | null;
  production_oil: number | null;
  water_cut: number | null;
  source: string | null;
  created_at: string;
}

export default function WellRegistry({
  companyId,
  refreshKey = 0,
}: {
  companyId?: string | null;
  refreshKey?: number;
}) {
  const [rows, setRows] = useState<WellRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("wells")
      .select("id,well_name,api_number,operator,formation,total_depth,production_oil,water_cut,source,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (companyId) q = q.eq("company_id", companyId);
    const { data } = await q;
    setRows((data as WellRow[]) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const isOcr = (s: string | null) => !!s && /ocr/i.test(s);
  const ocrCount = rows.filter((r) => isOcr(r.source)).length;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-5 h-5 text-primary" /> Well registry
            <Badge variant="outline">{rows.length} wells</Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <ScanText className="w-3 h-3 mr-1" /> {ocrCount} from OCR
            </Badge>
          </CardTitle>
          <CardDescription>
            Every well here — including wells ingested from paper logs via OCR — is part of the advisor ranking pool.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-3">
          <div className="space-y-2">
            {rows.length === 0 && (
              <div className="text-sm text-muted-foreground">No wells yet — ingest a paper log above or add a well manually.</div>
            )}
            {rows.map((w) => (
              <div key={w.id} className="p-2 border border-border rounded-md flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-[180px]">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {w.well_name || "Unnamed well"}
                    {isOcr(w.source) && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">OCR</Badge>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    {w.api_number || w.id.slice(0, 8)} · {w.operator || "—"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{w.formation || "formation —"}</span>
                  <span>{w.total_depth != null ? `${w.total_depth} ft` : "depth —"}</span>
                  <span>{w.production_oil != null ? `${w.production_oil} BOPD` : "rate —"}</span>
                  <span>{w.water_cut != null ? `WC ${w.water_cut}%` : "WC —"}</span>
                  <span className="font-mono">{new Date(w.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
