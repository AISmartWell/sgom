import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GeophysicalStageViz from "@/components/oklahoma-pilot/stage-viz/GeophysicalStageViz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  Droplets,
  CheckCircle2,
  Radar,
  FolderSearch,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Activity,
  Brain,
  Microscope,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface StageResult {
  title: string;
  metrics: { label: string; value: string; color?: string }[];
  verdict: string;
}

interface AnalysisRecord {
  id: string;
  well_id: string;
  created_at: string;
  status: string;
  batch_number: number;
  stage_results: Record<string, StageResult> | null;
  well_name: string | null;
  api_number: string | null;
  county: string | null;
  state: string;
  formation: string | null;
  operator: string | null;
  production_oil: number | null;
  water_cut: number | null;
  total_depth: number | null;
  well_type: string | null;
}

const STAGE_META: { key: string; label: string; icon: React.ElementType; badge: string }[] = [
  { key: "field_scan", label: "Field Scanning", icon: Radar, badge: "Stage 1" },
  { key: "classification", label: "Data Classification", icon: FolderSearch, badge: "Stage 2" },
  { key: "core_analysis", label: "Core Analysis (CV)", icon: Microscope, badge: "Core" },
  { key: "cumulative", label: "Cumulative Analysis", icon: TrendingDown, badge: "Stage 3" },
  { key: "spt_projection", label: "SPT Projection", icon: TrendingUp, badge: "Stage 4" },
  { key: "economic", label: "Economic Analysis", icon: DollarSign, badge: "Stage 5" },
  { key: "geophysical", label: "Geophysical Expertise", icon: Activity, badge: "Stage 6" },
  { key: "eor", label: "EOR Recommendation", icon: Brain, badge: "Final" },
];

const ROWS_PER_PAGE = 10;

const AnalysisReports = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("well_analyses")
        .select(`
          id, well_id, created_at, status, batch_number, stage_results,
          wells!inner(well_name, api_number, county, state, formation, operator, production_oil, water_cut, total_depth, well_type)
        `)
        .order("created_at", { ascending: false })
        .range(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE - 1);

      if (error) {
        console.error("Error fetching analyses:", error);
        setAnalyses([]);
      } else {
        setAnalyses(
          (data || []).map((row: any) => ({
            id: row.id,
            well_id: row.well_id,
            created_at: row.created_at,
            status: row.status,
            batch_number: row.batch_number,
            stage_results: row.stage_results as Record<string, StageResult> | null,
            well_name: row.wells?.well_name,
            api_number: row.wells?.api_number,
            county: row.wells?.county,
            state: row.wells?.state,
            formation: row.wells?.formation,
            operator: row.wells?.operator,
            production_oil: row.wells?.production_oil,
            water_cut: row.wells?.water_cut,
            total_depth: row.wells?.total_depth,
            well_type: row.wells?.well_type,
          }))
        );
      }
      setLoading(false);
    };
    fetch();
  }, [page]);

  const stageCount = (sr: Record<string, StageResult> | null) =>
    sr ? Object.keys(sr).length : 0;

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("well_analyses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete analysis");
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Analysis deleted");
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      // Convert SVGs to canvas for html2canvas
      const svgs = reportRef.current.querySelectorAll("svg");
      const restoreFns: (() => void)[] = [];
      for (const svg of svgs) {
        const canvas = document.createElement("canvas");
        const rect = svg.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const img = new Image();
          img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
          await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          svg.parentNode?.insertBefore(canvas, svg);
          svg.style.display = "none";
          restoreFns.push(() => { svg.style.display = ""; canvas.remove(); });
        }
      }

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#0a0a0a",
        useCORS: true,
      });

      restoreFns.forEach((f) => f());

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297;
      let position = 0;

      while (position < imgHeight) {
        if (position > 0) pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          -position,
          imgWidth,
          imgHeight
        );
        position += pageHeight;
      }

      const a = analyses.find((a) => a.id === expandedId);
      const filename = a
        ? `Analysis_${a.well_name || a.api_number || "well"}_${new Date(a.created_at).toISOString().slice(0, 10)}.pdf`
        : "analysis-report.pdf";
      pdf.save(filename);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">Analysis Reports</h1>
          </div>
          <p className="text-muted-foreground">
            View detailed results for every analyzed well — all 8 stages with metrics, verdicts, and PDF export
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          {analyses.length} reports
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : analyses.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
            <p className="text-muted-foreground mb-4">
              Run analysis on a well via the Well Analysis Pipeline to see reports here.
            </p>
            <Button onClick={() => navigate("/dashboard/well-analysis")}>
              <Droplets className="mr-2 h-4 w-4" /> Go to Well Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => {
            const isExpanded = expandedId === a.id;
            const stages = stageCount(a.stage_results);
            const date = new Date(a.created_at);

            return (
              <Card key={a.id} className={`transition-all ${isExpanded ? "ring-1 ring-primary" : ""}`}>
                <CardHeader className="pb-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">
                          {a.well_name || a.api_number || a.well_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.county && `${a.county}, `}{a.state} · {a.operator || "—"} · {a.formation || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground hidden sm:block">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <span>{stages} stages completed</span>
                      </div>
                      <Badge variant={stages >= 8 ? "default" : "outline"} className={stages >= 8 ? "bg-success/20 text-success border-success/30" : ""}>
                        {stages >= 8 ? "Complete" : `${stages}/8`}
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0" ref={expandedId === a.id ? reportRef : undefined}>
                    {/* Action buttons */}
                    <div className="flex gap-2 mb-4">
                      <Button size="sm" variant="outline" onClick={exportPDF} disabled={exporting}>
                        {exporting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
                        Export PDF
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                      </Button>
                    </div>

                    {/* Well summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg text-sm mb-4">
                      <div>
                        <span className="text-[10px] text-muted-foreground">API #</span>
                        <p className="font-mono text-xs">{a.api_number || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Oil Production</span>
                        <p className="text-xs font-medium">{a.production_oil?.toFixed(1) ?? "—"} bbl/d</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Water Cut</span>
                        <p className="text-xs font-medium">{a.water_cut?.toFixed(1) ?? "—"}%</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Batch</span>
                        <p className="text-xs font-medium">#{a.batch_number}</p>
                      </div>
                    </div>

                    {/* Stage results */}
                    {a.stage_results && Object.keys(a.stage_results).length > 0 ? (
                      <div className="space-y-3">
                        {STAGE_META.map((sm) => {
                          const result = a.stage_results?.[sm.key];
                          if (!result) return null;
                          const Icon = sm.icon;

                          return (
                            <div key={sm.key} className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-md bg-success/20 flex items-center justify-center">
                                    <Icon className="h-4 w-4 text-success" />
                                  </div>
                                  <span className="text-sm font-semibold">{sm.label}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px]">{sm.badge}</Badge>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {result.metrics.map((m) => (
                                  <div key={m.label} className="p-2 bg-muted/20 rounded">
                                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                                    <p className={`text-xs font-medium ${m.color || ""}`}>{m.value}</p>
                                  </div>
                                ))}
                              </div>

                              <p className="text-xs text-muted-foreground leading-relaxed">{result.verdict}</p>

                              {/* Well Log visualization for geophysical stage */}
                              {sm.key === "geophysical" && (
                                <GeophysicalStageViz
                                  well={{
                                    id: a.well_id,
                                    well_name: a.well_name,
                                    api_number: a.api_number,
                                    formation: a.formation,
                                    total_depth: a.total_depth,
                                    production_oil: a.production_oil,
                                    water_cut: a.water_cut,
                                    well_type: a.well_type,
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No detailed stage results available (batch analysis — run via Well Analysis Pipeline for full results)
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Pagination */}
          <div className="flex justify-between items-center pt-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <Button size="sm" variant="outline" disabled={analyses.length < ROWS_PER_PAGE} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisReports;
