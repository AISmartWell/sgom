import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Calendar, ChevronLeft, ChevronRight, History, Trash2 } from "lucide-react";
import { toast } from "sonner";
interface AnalyzedWellRow {
  id: string;
  well_id: string;
  batch_number: number;
  status: string;
  created_at: string;
  well_name: string | null;
  api_number: string | null;
  county: string | null;
  operator: string | null;
  production_oil: number | null;
  water_cut: number | null;
  formation: string | null;
}

const ROWS_PER_PAGE = 15;

const AnalyzedWellsTable = () => {
  const [rows, setRows] = useState<AnalyzedWellRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("well_analyses")
        .select(`
          id, well_id, batch_number, status, created_at,
          wells!inner(well_name, api_number, county, operator, production_oil, water_cut, formation)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load analyzed wells:", error);
        setLoading(false);
        return;
      }

      const mapped: AnalyzedWellRow[] = (data || []).map((r: any) => ({
        id: r.id,
        well_id: r.well_id,
        batch_number: r.batch_number,
        status: r.status,
        created_at: r.created_at,
        well_name: r.wells?.well_name ?? null,
        api_number: r.wells?.api_number ?? null,
        county: r.wells?.county ?? null,
        operator: r.wells?.operator ?? null,
        production_oil: r.wells?.production_oil ?? null,
        water_cut: r.wells?.water_cut ?? null,
        formation: r.wells?.formation ?? null,
      }));

      setRows(mapped);
      setLoading(false);
    };
    load();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("well_analyses")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Analysis deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const getSptRating = (wc: number | null, oil: number | null) => {
    const o = oil ?? 0;
    const w = wc ?? 0;
    if (o <= 0 || o > 25 || w >= 80) return { label: "N/A", className: "bg-muted text-muted-foreground" };
    if (o <= 15 && w >= 20 && w <= 60) return { label: "Excellent", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    if (o <= 25 && w >= 10 && w <= 70) return { label: "Good", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    return { label: "Marginal", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
  };

  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const pagedRows = rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  if (loading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading analysis history…</p>
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) return null;

  return (
    <Card className="glass-card border-success/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5 text-success" />
          Analyzed Wells History
          <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/30 text-xs">
            {rows.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[440px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border/50">
                <th className="p-2 text-left font-medium text-muted-foreground">Well Name</th>
                <th className="p-2 text-left font-medium text-muted-foreground">API #</th>
                <th className="p-2 text-left font-medium text-muted-foreground">County</th>
                <th className="p-2 text-left font-medium text-muted-foreground">Operator</th>
                <th className="p-2 text-right font-medium text-muted-foreground">Oil (bbl/d)</th>
                <th className="p-2 text-right font-medium text-muted-foreground">WC %</th>
                <th className="p-2 text-left font-medium text-muted-foreground">Formation</th>
                <th className="p-2 text-center font-medium text-muted-foreground">SPT Rating</th>
                <th className="p-2 text-center font-medium text-muted-foreground">Batch</th>
                <th className="p-2 text-left font-medium text-muted-foreground">Analyzed</th>
                <th className="p-2 text-center font-medium text-muted-foreground">Status</th>
                <th className="p-2 text-center font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => {
                const rating = getSptRating(row.water_cut, row.production_oil);
                const wc = row.water_cut ?? 0;
                return (
                  <tr key={row.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                    <td className="p-2 font-medium">{row.well_name || "—"}</td>
                    <td className="p-2 text-muted-foreground">{row.api_number || "—"}</td>
                    <td className="p-2">{row.county || "—"}</td>
                    <td className="p-2 text-muted-foreground">{row.operator || "—"}</td>
                    <td className="p-2 text-right font-medium">{row.production_oil?.toFixed(1) ?? "—"}</td>
                    <td className="p-2 text-right">
                      <span className={`font-medium ${wc > 70 ? "text-destructive" : wc > 50 ? "text-yellow-400" : "text-success"}`}>
                        {row.water_cut?.toFixed(1) ?? "—"}%
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground">{row.formation || "—"}</td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className={rating.className + " text-[10px]"}>
                        {rating.label}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="text-[10px]">#{row.batch_number}</Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[9px] gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {row.status === "completed" ? "Done" : row.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(row.id)}
                        disabled={deleting === row.id}
                      >
                        {deleting === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Showing {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, rows.length)} of {rows.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-3 w-3 mr-1" /> Prev
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyzedWellsTable;
