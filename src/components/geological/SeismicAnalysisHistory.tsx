import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  History, Trash2, ChevronRight, ArrowLeft, Loader2, Eye, Layers, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface SeismicAnalysisRecord {
  id: string;
  analysis_mode: string;
  model: string | null;
  results: any;
  created_at: string;
  well_id: string | null;
  seismic_image_id: string | null;
}

const modeIcons: Record<string, typeof Eye> = {
  full: Eye,
  faults: Layers,
  horizons: Layers,
  anomalies: AlertTriangle,
};

const resultSummary = (results: any, mode: string): string => {
  if (!results) return "No results";
  const parts: string[] = [];
  if (results.faults?.length) parts.push(`${results.faults.length} faults`);
  if (results.horizons?.length) parts.push(`${results.horizons.length} horizons`);
  if (results.anomalies?.length) parts.push(`${results.anomalies.length} anomalies`);
  if (results.reservoir_potential) parts.push(`Reservoir: ${results.reservoir_potential}`);
  return parts.length ? parts.join(" · ") : mode;
};

const ConfidenceBadge = ({ c }: { c: number }) => (
  <Badge variant={c >= 0.8 ? "default" : c >= 0.5 ? "secondary" : "destructive"} className="text-xs">
    {(c * 100).toFixed(0)}%
  </Badge>
);

export const SeismicAnalysisHistory = () => {
  const [records, setRecords] = useState<SeismicAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SeismicAnalysisRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("seismic_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error("Failed to fetch seismic history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("seismic_analyses")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Analysis deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  if (selected) {
    const r = selected.results || {};
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex-1">
              <CardTitle className="text-base">
                Seismic CV Analysis
                <Badge variant="outline" className="ml-2 text-xs">{selected.analysis_mode}</Badge>
              </CardTitle>
              <CardDescription>{format(new Date(selected.created_at), "PPpp")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4">
              {/* Faults */}
              {r.faults?.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Faults ({r.faults.length})</h5>
                  <div className="space-y-2">
                    {r.faults.map((f: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-destructive/5 rounded-md border border-destructive/10">
                        <Badge variant="destructive" className="text-xs shrink-0">{f.id || `F${i+1}`}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{f.type} fault</p>
                          <p className="text-xs text-muted-foreground">
                            {f.dip_angle_deg && `Dip: ${f.dip_angle_deg}°`}
                            {f.throw_m && ` · Throw: ${f.throw_m}m`}
                            {f.depth_range && ` · ${f.depth_range}`}
                          </p>
                        </div>
                        {f.confidence != null && <ConfidenceBadge c={f.confidence} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Horizons */}
              {r.horizons?.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Horizons ({r.horizons.length})</h5>
                  <div className="space-y-2">
                    {r.horizons.map((h: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-primary/5 rounded-md border border-primary/10">
                        <Badge className="text-xs shrink-0">{h.id || `H${i+1}`}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{h.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {h.depth_m && `Depth: ${h.depth_m}m`}
                            {h.twt_ms && ` · TWT: ${h.twt_ms}ms`}
                            {h.continuity && ` · ${h.continuity}`}
                          </p>
                        </div>
                        {h.confidence != null && <ConfidenceBadge c={h.confidence} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anomalies */}
              {r.anomalies?.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Anomalies ({r.anomalies.length})</h5>
                  <div className="space-y-2">
                    {r.anomalies.map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-accent/5 rounded-md border border-accent/10">
                        <Badge variant="secondary" className="text-xs shrink-0">{a.id || `A${i+1}`}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{a.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.depth_m && `Depth: ${a.depth_m}m`}
                            {a.lateral_extent_m && ` · Extent: ${a.lateral_extent_m}m`}
                          </p>
                        </div>
                        {a.confidence != null && <ConfidenceBadge c={a.confidence} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary badges */}
              <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                {r.structural_style && <Badge variant="outline" className="text-xs">🏗️ {r.structural_style}</Badge>}
                {r.reservoir_potential && <Badge variant="outline" className="text-xs">🎯 Reservoir: {r.reservoir_potential}</Badge>}
                {r.bypassed_reserves_potential && <Badge variant="outline" className="text-xs">💎 Bypassed: {r.bypassed_reserves_potential}</Badge>}
                {r.seal_risk && <Badge variant="outline" className="text-xs">🔒 Seal: {r.seal_risk}</Badge>}
              </div>

              {/* Interpretation */}
              {r.interpretation && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs font-semibold text-primary mb-1">AI Interpretation</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.interpretation}</p>
                </div>
              )}

              {r.key_observations && (
                <div>
                  <p className="text-xs font-semibold mb-1">Key Observations</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                    {r.key_observations.map((o: string, i: number) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}

              {r.recommendations && (
                <div>
                  <p className="text-xs font-semibold mb-1">Recommendations</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                    {r.recommendations.map((rec: string, i: number) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5" />
          Seismic Analysis History
        </CardTitle>
        <CardDescription>Previous CV analyses saved to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Eye className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No seismic analyses saved yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Run a Seismic CV analysis and save it to see history here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => {
              const ModeIcon = modeIcons[record.analysis_mode] || Eye;
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer group"
                  onClick={() => setSelected(record)}
                >
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ModeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {resultSummary(record.results, record.analysis_mode)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(record.created_at), "PP · p")}
                    </p>
                    <Badge variant="secondary" className="text-[10px] mt-1">{record.analysis_mode}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                      disabled={deleting === record.id}
                    >
                      {deleting === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
