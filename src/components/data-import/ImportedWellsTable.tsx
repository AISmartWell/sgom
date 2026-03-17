import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Database, RefreshCw, Loader2, Search, Trash2 } from "lucide-react";
import { WellDetailDialog } from "@/components/data-collection/WellDetailDialog";
import { toast } from "sonner";

interface ImportedWellsTableProps {
  refreshTrigger: number;
}

export const ImportedWellsTable = ({ refreshTrigger }: ImportedWellsTableProps) => {
  const [wells, setWells] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedWell, setSelectedWell] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadWells = async () => {
    setIsLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("wells")
      .select("id, api_number, well_name, operator, state, county, formation, status, source, production_oil, production_gas, water_cut, well_type, latitude, longitude, total_depth, spud_date, completion_date, created_at, company_id")
      .order("created_at", { ascending: false });

    let countQuery = supabase
      .from("wells")
      .select("*", { count: "exact", head: true });

    if (debouncedSearch.trim()) {
      const s = `%${debouncedSearch.trim()}%`;
      const filter = `well_name.ilike."${s}",api_number.ilike."${s}",operator.ilike."${s}",county.ilike."${s}",formation.ilike."${s}"`;
      query = query.or(filter);
      countQuery = countQuery.or(filter);
    }

    const [{ data, error }, { count }] = await Promise.all([
      query.range(from, to),
      countQuery,
    ]);

    if (!error && data) setWells(data);
    setTotal(count || 0);
    setIsLoading(false);
  };

  useEffect(() => {
    loadWells();
  }, [page, refreshTrigger, debouncedSearch]);

  const handleDeleteWell = async (e: React.MouseEvent, wellId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this well and all associated data?")) return;
    setDeleting(wellId);
    try {
      const { error } = await supabase.from("wells").delete().eq("id", wellId);
      if (error) throw error;
      toast.success("Well deleted");
      loadWells();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Delete ALL ${total} wells? This cannot be undone.`)) return;
    setDeletingAll(true);
    try {
      const { error } = await supabase.from("wells").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("All wells deleted");
      loadWells();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setDeletingAll(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Saved Wells in Database
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {total.toLocaleString()} total
              </Badge>
            </CardTitle>
            <CardDescription>
              Wells persisted in the database. This data is available across all modules.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadWells} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {total > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={deletingAll}>
                {deletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete All
              </Button>
            )}
          </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by well name, API #, operator, county, formation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : wells.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No wells found</p>
            <p className="text-sm mt-1">Import wells using CSV upload or manual entry above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <ScrollArea className="h-[350px]">
              <div className="space-y-0.5">
                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground px-2 py-2 border-b sticky top-0 bg-background z-10">
                  <span>API #</span>
                  <span>Well Name</span>
                  <span>Operator</span>
                  <span>State</span>
                  <span>Status</span>
                  <span>Source</span>
                  <span>Oil (bbl)</span>
                </div>
                {wells.map((well) => (
                  <div key={well.id} className="grid grid-cols-7 gap-2 text-xs px-2 py-2 rounded hover:bg-muted/30 border-b border-border/20 cursor-pointer transition-colors" onClick={() => { setSelectedWell(well); setDialogOpen(true); }}>
                    <span className="font-mono truncate">{well.api_number || "—"}</span>
                    <span className="truncate">{well.well_name || "—"}</span>
                    <span className="truncate">{well.operator || "—"}</span>
                    <span>{well.state}</span>
                    <span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {well.status || "N/A"}
                      </Badge>
                    </span>
                    <span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {well.source || "Manual"}
                      </Badge>
                    </span>
                    <span>{well.production_oil?.toLocaleString() ?? "—"}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    <WellDetailDialog
      well={selectedWell}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
    />
    </>
  );
};
