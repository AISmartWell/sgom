import { useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Droplets,
  Activity,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { EvidenceConfidenceSection } from "./EvidenceConfidenceSection";
import { BacktestingModule } from "./BacktestingModule";
import { StageVisualization } from "./StageVisualization";

interface StageResult {
  title: string;
  metrics: { label: string; value: string; color?: string }[];
  verdict: string;
  dataSource?: string;
}

interface WellRecord {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  county: string | null;
  state: string;
  formation: string | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  well_type: string | null;
  status: string | null;
}

interface PipelineReportProps {
  well: WellRecord;
  stages: { key: string; label: string; badge: string }[];
  completedStages: Map<string, StageResult>;
}

const STAGE_ICONS: Record<string, typeof Activity> = {
  field_scan: Activity,
  classification: FileText,
  core_analysis: Activity,
  cumulative: TrendingUp,
  geophysical: Activity,
  seismic_reinterpretation: Activity,
  spt_projection: TrendingUp,
  economic: DollarSign,
  eor: Droplets,
};

const PipelineReport = ({ well, stages, completedStages }: PipelineReportProps) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: "#0f172a",
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;

    let yOffset = 0;
    const pageH = pdf.internal.pageSize.getHeight();

    while (yOffset < pdfH) {
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -yOffset, pdfW, pdfH);
      yOffset += pageH;
    }

    const name = well.well_name || well.api_number || "well";
    pdf.save(`${name}-analysis-report.pdf`);
  }, [well]);

  const handleExportCSV = useCallback(() => {
    const rows: string[][] = [["Stage", "Metric", "Value", "Verdict"]];
    stages.forEach((stage) => {
      const result = completedStages.get(stage.key);
      if (!result) return;
      result.metrics.forEach((m, i) => {
        rows.push([
          i === 0 ? stage.label : "",
          m.label,
          m.value,
          i === 0 ? result.verdict : "",
        ]);
      });
    });

    const csvContent = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${well.well_name || well.api_number || "well"}-analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [well, stages, completedStages]);

  const completedCount = completedStages.size;
  const totalStages = stages.length;

  // Extract key summary metrics from results
  const eorResult = completedStages.get("eor");
  const economicResult = completedStages.get("economic");
  const sptResult = completedStages.get("spt_projection");

  return (
    <Card className="mt-6 border-primary/30 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Project Results & Outputs</h3>
              <p className="text-xs text-muted-foreground font-normal">
                Full analysis report for {well.well_name || well.api_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button size="sm" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Printable report content */}
        <div ref={reportRef} className="space-y-6 print:p-8">
          {/* Report Header */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 print:border print:border-gray-300">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">AI Smart Well — Analysis Report</h2>
              <Badge variant="outline" className="text-xs">
                {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Well Name</span>
                <p className="font-semibold">{well.well_name || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">API Number</span>
                <p className="font-semibold">{well.api_number || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Operator</span>
                <p className="font-semibold">{well.operator || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Location</span>
                <p className="font-semibold">{well.county}, {well.state}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Formation</span>
                <p className="font-semibold">{well.formation || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Oil Production</span>
                <p className="font-semibold">{well.production_oil?.toFixed(1) ?? "—"} bbl/d</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Gas Production</span>
                <p className="font-semibold">{well.production_gas?.toFixed(0) ?? "—"} MCF/d</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Water Cut</span>
                <p className="font-semibold">{well.water_cut?.toFixed(1) ?? "—"}%</p>
              </div>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
              <p className="text-xs text-muted-foreground">Stages Completed</p>
              <p className="text-2xl font-bold text-success">{completedCount}/{totalStages}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">SPT Score</p>
              <p className="text-2xl font-bold text-primary">
                {sptResult?.metrics.find((m) => m.label.toLowerCase().includes("score"))?.value || "—"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">ROI</p>
              <p className="text-2xl font-bold text-primary">
                {economicResult?.metrics.find((m) => m.label.toLowerCase().includes("roi"))?.value || "—"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">EOR Score</p>
              <p className="text-2xl font-bold text-primary">
                {eorResult?.metrics.find((m) => m.label.toLowerCase().includes("score"))?.value || "—"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Stage-by-stage results */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Stage-by-Stage Analysis</h3>
            {stages.map((stage) => {
              const result = completedStages.get(stage.key);
              if (!result) return null;

              return (
                <div key={stage.key} className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-3 print:break-inside-avoid">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{stage.badge}</Badge>
                    <h4 className="font-semibold text-sm">{stage.label}</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {result.metrics.map((m) => (
                      <div key={m.label} className="text-sm">
                        <p className="text-muted-foreground text-xs">{m.label}</p>
                        <p className={`font-semibold ${m.color || ""}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium border-t border-border/30 pt-2">{result.verdict}</p>
                </div>
              );
            })}
          </div>

          {/* Evidence & Confidence */}
          <Separator />
          <EvidenceConfidenceSection
            well={well}
            stages={stages}
            completedStages={completedStages}
          />

          {/* Backtesting Module */}
          <Separator />
          <BacktestingModule well={well} completedStages={completedStages} />

          {/* Overall Project Statistics */}
          <Separator />
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-3 print:break-inside-avoid">
            <h3 className="text-base font-semibold">Overall Project Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Stages Analyzed</p>
                <p className="font-bold text-lg">{completedCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Formation</p>
                <p className="font-bold">{well.formation || "Unknown"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Depth</p>
                <p className="font-bold">{well.total_depth ? `${well.total_depth.toLocaleString()} ft` : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Well Type</p>
                <p className="font-bold">{well.well_type || "Oil"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="font-bold">{well.status || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Analysis Date</p>
                <p className="font-bold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Final Recommendation */}
          {eorResult && (
            <div className="p-4 rounded-lg bg-success/5 border border-success/30 print:break-inside-avoid">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="text-base font-semibold text-success">Final Recommendation</h3>
              </div>
              <p className="text-sm">{eorResult.verdict}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
            <p>Generated by AI Smart Well (SGOM Platform) — Powered by SPT Technology (Patent US 8,863,823)</p>
            <p>© {new Date().getFullYear()} Maxxwell Production. All rights reserved.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineReport;
