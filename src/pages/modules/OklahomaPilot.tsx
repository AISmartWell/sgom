import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Play, RotateCcw, CheckCircle2, Loader2, Droplets,
  FileSpreadsheet, MapPin, AlertTriangle, TrendingUp, Download,
  SkipForward,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PilotWellsMap from "@/components/oklahoma-pilot/PilotWellsMap";
import PilotWellLog from "@/components/oklahoma-pilot/PilotWellLog";
import WellSelectionTable from "@/components/oklahoma-pilot/WellSelectionTable";
import PilotCharts from "@/components/oklahoma-pilot/PilotCharts";
import PilotAIProcessing from "@/components/oklahoma-pilot/PilotAIProcessing";
import PilotStats from "@/components/oklahoma-pilot/PilotStats";
import PilotHeader from "@/components/oklahoma-pilot/PilotHeader";
import FieldScanStageViz from "@/components/oklahoma-pilot/FieldScanStageViz";
import AnalyzedWellsTable from "@/components/oklahoma-pilot/AnalyzedWellsTable";
import ClassificationStageViz from "@/components/oklahoma-pilot/stage-viz/ClassificationStageViz";
import CoreAnalysisStageViz from "@/components/oklahoma-pilot/stage-viz/CoreAnalysisStageViz";
import CumulativeStageViz from "@/components/oklahoma-pilot/stage-viz/CumulativeStageViz";
import SPTProjectionStageViz from "@/components/oklahoma-pilot/stage-viz/SPTProjectionStageViz";
import EconomicStageViz from "@/components/oklahoma-pilot/stage-viz/EconomicStageViz";
import GeophysicalStageViz from "@/components/oklahoma-pilot/stage-viz/GeophysicalStageViz";

const MAX_ANALYSIS = 20;

// SPT candidate criteria based on Maxxwell Production parameters
const isSptCandidate = (w: WellRecord): boolean => {
  const oil = w.production_oil ?? 0;
  const wc = w.water_cut ?? 0;
  // Low-production, still producing, water cut not too extreme
  return oil > 0 && oil <= 25 && wc < 80;
};

const getSptRating = (w: WellRecord): "excellent" | "good" | "marginal" => {
  const oil = w.production_oil ?? 0;
  const wc = w.water_cut ?? 0;
  // Excellent: low production + ideal water cut range (20-60%)
  if (oil > 0 && oil <= 15 && wc >= 20 && wc <= 60) return "excellent";
  // Good: moderate production or slightly outside ideal WC
  if (oil > 0 && oil <= 25 && wc >= 10 && wc <= 70) return "good";
  return "marginal";
};

const STAGES = [
  { key: "field_scan", label: "Field Scanning", badge: "Stage 1" },
  { key: "classification", label: "Data Classification", badge: "Stage 2" },
  { key: "core_analysis", label: "Core Analysis (CV)", badge: "Core" },
  { key: "cumulative", label: "Cumulative Analysis", badge: "Stage 3" },
  { key: "spt_projection", label: "SPT Projection", badge: "Stage 4" },
  { key: "economic", label: "Economic Analysis", badge: "Stage 5" },
  { key: "geophysical", label: "Geophysical Expertise", badge: "Stage 6" },
  { key: "eor", label: "EOR Recommendation", badge: "Final" },
];

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
  latitude: number | null;
  longitude: number | null;
}

interface StageResult {
  title: string;
  metrics: { label: string; value: string; color?: string }[];
  verdict: string;
}

interface WellAnalysis {
  well: WellRecord;
  stages: Map<string, StageResult>;
  status: "pending" | "running" | "done" | "error";
  error?: string;
}

const OklahomaPilot = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [allWells, setAllWells] = useState<WellRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Map<string, WellAnalysis>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [currentWellIdx, setCurrentWellIdx] = useState(-1);
  const [currentStageIdx, setCurrentStageIdx] = useState(-1);
  const [stageProgress, setStageProgress] = useState(0);
  const [analyzedWellIds, setAnalyzedWellIds] = useState<Set<string>>(new Set());
  const [currentBatch, setCurrentBatch] = useState(1);

  // Load ALL Oklahoma wells + previously analyzed well IDs
  useEffect(() => {
    const load = async () => {
      // Load wells
      const { data, error } = await supabase
        .from("wells")
        .select("id, well_name, api_number, operator, county, state, formation, production_oil, production_gas, water_cut, total_depth, well_type, status, latitude, longitude")
        .eq("state", "OK")
        .order("production_oil", { ascending: true })
        .limit(500);
      if (error) {
        console.error("Failed to load wells:", error);
        toast.error("Failed to load wells");
      }

      // Load previously analyzed well IDs
      const { data: analysisData } = await supabase
        .from("well_analyses")
        .select("well_id, batch_number");

      const alreadyAnalyzed = new Set<string>();
      let maxBatch = 0;
      if (analysisData) {
        analysisData.forEach((a: any) => {
          alreadyAnalyzed.add(a.well_id);
          if (a.batch_number > maxBatch) maxBatch = a.batch_number;
        });
      }
      setAnalyzedWellIds(alreadyAnalyzed);
      setCurrentBatch(maxBatch + 1);

      if (data) {
        setAllWells(data);
        // Auto-select top 10 unanalyzed SPT candidates
        const candidates = data.filter(w => isSptCandidate(w) && !alreadyAnalyzed.has(w.id));
        const ranked = [...candidates].sort((a, b) => {
          const ratingOrder = { excellent: 0, good: 1, marginal: 2 };
          const rA = ratingOrder[getSptRating(a)];
          const rB = ratingOrder[getSptRating(b)];
          if (rA !== rB) return rA - rB;
          return (a.production_oil ?? 0) - (b.production_oil ?? 0);
        });
        const top10 = new Set(ranked.slice(0, 10).map((w) => w.id));
        setSelectedIds(top10);
      }
      setLoading(false);
    };
    load();
  }, []);

  const sptCandidates = allWells.filter(isSptCandidate);
  const excellentWells = sptCandidates.filter(w => getSptRating(w) === "excellent");
  const goodWells = sptCandidates.filter(w => getSptRating(w) === "good");
  const marginalWells = sptCandidates.filter(w => getSptRating(w) === "marginal");
  const nonCandidates = allWells.filter(w => !isSptCandidate(w));
  const selectedWells = allWells.filter((w) => selectedIds.has(w.id));

  const toggleWell = useCallback((id: string) => {
    if (isRunning) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_ANALYSIS) {
        next.add(id);
      }
      return next;
    });
  }, [isRunning]);

  const selectTopN = useCallback(() => {
    if (isRunning) return;
    setSelectedIds(new Set(allWells.slice(0, MAX_ANALYSIS).map((w) => w.id)));
  }, [allWells, isRunning]);

  const deselectAll = useCallback(() => {
    if (isRunning) return;
    setSelectedIds(new Set());
  }, [isRunning]);

  const [lastPolygonIds, setLastPolygonIds] = useState<string[]>([]);

  const selectByPolygon = useCallback((wellIds: string[]) => {
    if (isRunning) return;
    setLastPolygonIds(wellIds);
    setSelectedIds(new Set(wellIds.slice(0, MAX_ANALYSIS)));
    toast.success(`${Math.min(wellIds.length, MAX_ANALYSIS)} wells selected by area (${wellIds.length} found)`);
  }, [isRunning]);

  const reselectLastPolygon = useCallback(() => {
    if (isRunning || lastPolygonIds.length === 0) return;
    setSelectedIds(new Set(lastPolygonIds.slice(0, MAX_ANALYSIS)));
    toast.success(`Re-selected ${Math.min(lastPolygonIds.length, MAX_ANALYSIS)} wells from last area`);
  }, [isRunning, lastPolygonIds]);

  const analyzeStage = async (well: WellRecord, stageKey: string): Promise<StageResult> => {
    const { data, error } = await supabase.functions.invoke("analyze-well-stage", {
      body: { well, stageKey },
    });
    if (error) throw new Error(error.message || "AI analysis failed");
    if (data?.error) throw new Error(data.error);
    return data as StageResult;
  };

  const runBatchAnalysis = useCallback(async () => {
    if (selectedWells.length === 0) {
      toast.error("Select at least one well to analyze");
      return;
    }
    setIsRunning(true);

    // Init analyses
    const initial = new Map<string, WellAnalysis>();
    selectedWells.forEach((w) => initial.set(w.id, { well: w, stages: new Map(), status: "pending" }));
    setAnalyses(initial);

    const completedIds: string[] = [];

    for (let wi = 0; wi < selectedWells.length; wi++) {
      const well = selectedWells[wi];
      setCurrentWellIdx(wi);

      setAnalyses((prev) => {
        const next = new Map(prev);
        const a = next.get(well.id)!;
        next.set(well.id, { ...a, status: "running", stages: new Map() });
        return next;
      });

      let failed = false;
      const stageResults: Record<string, StageResult> = {};
      for (let si = 0; si < STAGES.length; si++) {
        setCurrentStageIdx(si);
        setStageProgress(10);

        const progressInterval = setInterval(() => {
          setStageProgress((prev) => Math.min(prev + 2, 90));
        }, 300);

        try {
          const result = await analyzeStage(well, STAGES[si].key);
          clearInterval(progressInterval);
          setStageProgress(100);
          await new Promise((r) => setTimeout(r, 200));

          stageResults[STAGES[si].key] = result;

          setAnalyses((prev) => {
            const next = new Map(prev);
            const a = next.get(well.id)!;
            const stages = new Map(a.stages);
            stages.set(STAGES[si].key, result);
            next.set(well.id, { ...a, stages });
            return next;
          });
        } catch (err: any) {
          clearInterval(progressInterval);
          console.error(`Well ${well.well_name} Stage ${STAGES[si].key} failed:`, err);

          if (err.message?.includes("Rate limit")) {
            toast.error("Rate limit — pausing 10 seconds...");
            await new Promise((r) => setTimeout(r, 10000));
            si--;
            continue;
          }

          setAnalyses((prev) => {
            const next = new Map(prev);
            const a = next.get(well.id)!;
            next.set(well.id, { ...a, status: "error", error: err.message });
            return next;
          });
          failed = true;
          break;
        }
      }

      if (!failed) {
        completedIds.push(well.id);
        setAnalyses((prev) => {
          const next = new Map(prev);
          const a = next.get(well.id)!;
          next.set(well.id, { ...a, status: "done" });
          return next;
        });
      }
    }

    // Save completed analyses to DB
    if (completedIds.length > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: ucData } = await supabase.from("user_companies").select("company_id").limit(1);
        const companyId = ucData?.[0]?.company_id;

        if (user && companyId) {
          const rows = completedIds.map(wellId => ({
            well_id: wellId,
            company_id: companyId,
            user_id: user.id,
            batch_number: currentBatch,
            status: "completed",
            stage_results: {} as Record<string, any>,
          }));

          await supabase.from("well_analyses").insert(rows);

          // Update local analyzed set
          setAnalyzedWellIds(prev => {
            const next = new Set(prev);
            completedIds.forEach(id => next.add(id));
            return next;
          });
          setCurrentBatch(prev => prev + 1);
        }
      } catch (e) {
        console.error("Failed to save analyses:", e);
      }
    }

    setIsRunning(false);
    setCurrentWellIdx(-1);
    setCurrentStageIdx(-1);
    toast.success("Batch analysis complete!");
  }, [selectedWells, currentBatch]);

  // Auto-queue: select next batch of unanalyzed candidates
  const selectNextBatch = useCallback(() => {
    if (isRunning) return;
    const unanalyzed = allWells.filter(w => isSptCandidate(w) && !analyzedWellIds.has(w.id));
    const ranked = [...unanalyzed].sort((a, b) => {
      const ratingOrder = { excellent: 0, good: 1, marginal: 2 };
      const rA = ratingOrder[getSptRating(a)];
      const rB = ratingOrder[getSptRating(b)];
      if (rA !== rB) return rA - rB;
      return (a.production_oil ?? 0) - (b.production_oil ?? 0);
    });
    const nextBatch = ranked.slice(0, MAX_ANALYSIS);
    if (nextBatch.length === 0) {
      toast.info("All SPT candidates have been analyzed!");
      return;
    }
    setSelectedIds(new Set(nextBatch.map(w => w.id)));
    setAnalyses(new Map());
    toast.success(`Batch ${currentBatch}: ${nextBatch.length} unanalyzed wells queued`);
  }, [isRunning, allWells, analyzedWellIds, currentBatch]);

  const unanalyzedCount = useMemo(() => 
    allWells.filter(w => isSptCandidate(w) && !analyzedWellIds.has(w.id)).length
  , [allWells, analyzedWellIds]);

  const reset = () => {
    setCurrentWellIdx(-1);
    setCurrentStageIdx(-1);
    setStageProgress(0);
    setIsRunning(false);
    setAnalyses(new Map());
  };

  const completedWells = Array.from(analyses.values()).filter((a) => a.status === "done").length;
  const totalAnalyzing = selectedWells.length;
  const overallProgress = totalAnalyzing > 0
    ? ((completedWells + (currentWellIdx >= 0 && currentWellIdx < totalAnalyzing
        ? (currentStageIdx + stageProgress / 100) / STAGES.length
        : 0)) / totalAnalyzing) * 100
    : 0;

  const handleExportGeoJSON = () => {
    const wellsToExport = selectedIds.size > 0
      ? sptCandidates.filter(w => selectedIds.has(w.id))
      : sptCandidates.filter(w => w.latitude != null && w.longitude != null);
    const features = wellsToExport
      .filter(w => w.latitude != null && w.longitude != null)
      .map(w => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [w.longitude!, w.latitude!] },
        properties: {
          well_name: w.well_name || null,
          api_number: w.api_number || null,
          county: w.county || null,
          formation: w.formation || null,
          operator: w.operator || null,
          production_oil_bpd: w.production_oil ?? null,
          production_gas_mcfd: w.production_gas ?? null,
          water_cut_pct: w.water_cut ?? null,
          total_depth_ft: w.total_depth ?? null,
          spt_rating: getSptRating(w),
          status: w.status || null,
        },
      }));
    const geojson = { type: "FeatureCollection", features };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spt-candidates-${features.length}wells.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${features.length} wells to GeoJSON`);
  };

  const handleExportKML = () => {
    const wellsToExport = selectedIds.size > 0
      ? sptCandidates.filter(w => selectedIds.has(w.id))
      : sptCandidates.filter(w => w.latitude != null && w.longitude != null);
    const placemarks = wellsToExport
      .filter(w => w.latitude != null && w.longitude != null)
      .map(w => {
        const rating = getSptRating(w);
        const colorMap: Record<string, string> = { excellent: "ff00ff00", good: "ff00ffff", marginal: "ff0080ff", not_suitable: "ff808080" };
        return `    <Placemark>
      <name>${w.well_name || w.api_number || "Unknown"}</name>
      <description>API: ${w.api_number || "—"}\nCounty: ${w.county || "—"}\nOil: ${w.production_oil ?? "—"} bbl/d\nWC: ${w.water_cut ?? "—"}%\nSPT: ${rating.toUpperCase()}</description>
      <Style><IconStyle><color>${colorMap[rating] || "ff808080"}</color><scale>0.8</scale></IconStyle></Style>
      <Point><coordinates>${w.longitude},${w.latitude},0</coordinates></Point>
    </Placemark>`;
      }).join("\n");
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>SPT Candidates — Oklahoma Pilot</name>
    <description>Exported ${wellsToExport.length} wells on ${new Date().toLocaleDateString()}</description>
${placemarks}
  </Document>
</kml>`;
    const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spt-candidates-${wellsToExport.length}wells.kml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${wellsToExport.length} wells to KML`);
  };

  const handleExportCandidatesCSV = () => {
    const headers = ["Well Name", "API #", "County", "Formation", "Operator", "Oil (bbl/d)", "Gas (mcf/d)", "Water Cut (%)", "Total Depth (ft)", "SPT Rating", "Status"];
    const rows: string[][] = [headers];
    const wellsToExport = selectedIds.size > 0
      ? sptCandidates.filter(w => selectedIds.has(w.id))
      : sptCandidates;
    wellsToExport.forEach((w) => {
      rows.push([
        w.well_name || "—",
        w.api_number || "—",
        w.county || "—",
        w.formation || "—",
        w.operator || "—",
        String(w.production_oil ?? "—"),
        String(w.production_gas ?? "—"),
        String(w.water_cut ?? "—"),
        String(w.total_depth ?? "—"),
        getSptRating(w).replace("_", " ").toUpperCase(),
        w.status || "—",
      ]);
    });
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spt-candidates-${wellsToExport.length}wells-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${wellsToExport.length} SPT candidates to CSV`);
  };

  const handleExportCSV = () => {
    const rows: string[][] = [["Well Name", "API #", "County", "Operator", "Oil (bbl/d)", "Water Cut (%)", "Stage", "Metric", "Value", "Verdict"]];
    analyses.forEach((a) => {
      STAGES.forEach((stage) => {
        const result = a.stages.get(stage.key);
        if (!result) return;
        result.metrics.forEach((m, i) => {
          rows.push([
            i === 0 ? (a.well.well_name || "") : "",
            i === 0 ? (a.well.api_number || "") : "",
            i === 0 ? (a.well.county || "") : "",
            i === 0 ? (a.well.operator || "") : "",
            i === 0 ? String(a.well.production_oil ?? "") : "",
            i === 0 ? String(a.well.water_cut ?? "") : "",
            i === 0 ? stage.label : "",
            m.label, m.value,
            i === 0 ? result.verdict : "",
          ]);
        });
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oklahoma-pilot-${selectedWells.length}wells-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    toast.info("Generating PDF — rendering charts…");

    // Convert all SVG elements inside the report to inline canvases
    // so html2canvas can capture Recharts graphs.
    const container = reportRef.current;
    const svgs = Array.from(container.querySelectorAll("svg"));
    const restorations: (() => void)[] = [];

    for (const svg of svgs) {
      try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = url;
        });

        const c = document.createElement("canvas");
        c.width = svg.clientWidth * 2;
        c.height = svg.clientHeight * 2;
        c.style.width = `${svg.clientWidth}px`;
        c.style.height = `${svg.clientHeight}px`;
        const ctx = c.getContext("2d")!;
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, svg.clientWidth, svg.clientHeight);
        URL.revokeObjectURL(url);

        const parent = svg.parentElement!;
        parent.insertBefore(c, svg);
        svg.style.display = "none";
        restorations.push(() => {
          svg.style.display = "";
          parent.removeChild(c);
        });
      } catch {
        // If conversion fails for a particular SVG, skip it
      }
    }

    try {
      const canvas = await html2canvas(container, {
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
      pdf.save(`oklahoma-pilot-${selectedWells.length}wells-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF saved!");
    } finally {
      // Restore original SVGs
      restorations.forEach((fn) => fn());
    }
  }, [selectedWells]);

  const getSptScore = (a: WellAnalysis): string => {
    const eor = a.stages.get("eor");
    if (!eor) return "—";
    const m = eor.metrics.find((m) => m.label.toLowerCase().includes("score"));
    return m?.value || "—";
  };

  const getVerdict = (a: WellAnalysis): string => {
    const eor = a.stages.get("eor");
    return eor?.verdict || "—";
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <PilotHeader
        allWellsCount={allWells.length}
        sptCandidatesCount={sptCandidates.length}
        selectedCount={selectedIds.size}
        completedWells={completedWells}
        isRunning={isRunning}
        currentWellIdx={currentWellIdx}
        totalAnalyzing={totalAnalyzing}
        onBack={() => navigate("/dashboard")}
        onExportCSV={handleExportCandidatesCSV}
        onExportKML={handleExportKML}
        onExportGeoJSON={handleExportGeoJSON}
        onExportAnalysisCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onRunAnalysis={runBatchAnalysis}
        onReset={reset}
      />

      {/* Batch Info Bar */}
      {analyzedWellIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 text-sm">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {analyzedWellIds.size} wells analyzed
          </Badge>
          <span className="text-muted-foreground">
            {unanalyzedCount} unanalyzed candidates remaining
          </span>
          {!isRunning && unanalyzedCount > 0 && (
            <Button size="sm" variant="outline" onClick={selectNextBatch} className="ml-auto gap-1">
              <SkipForward className="h-3.5 w-3.5" />
              Next Batch ({Math.min(unanalyzedCount, MAX_ANALYSIS)})
            </Button>
          )}
        </div>
      )}

      {/* Analyzed Wells History */}
      {analyzedWellIds.size > 0 && !isRunning && analyses.size === 0 && (
        <div className="mb-6">
          <AnalyzedWellsTable />
        </div>
      )}

      {/* Overall Progress */}
      {(isRunning || completedWells > 0) && (
        <Card className="mb-6 glass-card border-primary/30">
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Batch {currentBatch - (isRunning ? 0 : 1)}: {completedWells}/{totalAnalyzing} wells completed</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            {isRunning && currentWellIdx >= 0 && currentWellIdx < totalAnalyzing && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analyzing: <span className="font-medium text-foreground">{selectedWells[currentWellIdx]?.well_name}</span>
                — Stage {currentStageIdx + 1}/{STAGES.length}: {STAGES[currentStageIdx]?.label}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
          <p>Loading Oklahoma wells...</p>
        </div>
      )}

      {/* Main layout: 3-column grid */}
      {!loading && allWells.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
          {/* Left: Map + AI Processing */}
          <div className="xl:col-span-8 space-y-6">
            {/* Map */}
            <Card className="glass-card border-primary/20 overflow-hidden">
              <CardContent className="p-0">
                <PilotWellsMap
                  wells={allWells}
                  selectedIds={selectedIds}
                  activeWellId={currentWellIdx >= 0 ? selectedWells[currentWellIdx]?.id : undefined}
                  analyzedIds={analyzedWellIds}
                  onWellClick={isRunning ? undefined : toggleWell}
                  onPolygonSelect={isRunning ? undefined : selectByPolygon}
                />
              </CardContent>
            </Card>
            {lastPolygonIds.length > 0 && !isRunning && (
              <div className="flex items-center gap-2 -mt-4">
                <Button size="sm" variant="outline" onClick={reselectLastPolygon} className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  Select all in area ({lastPolygonIds.length})
                </Button>
                <span className="text-[10px] text-muted-foreground">Re-apply last selection</span>
              </div>
            )}

            {/* AI Processing Modules */}
            <PilotAIProcessing />
          </div>

          {/* Right: Stats panel */}
          <div className="xl:col-span-4">
            <PilotStats
              allWells={allWells}
              sptCandidates={sptCandidates}
              excellentWells={excellentWells}
              goodWells={goodWells}
              marginalWells={marginalWells}
              nonCandidates={nonCandidates}
            />
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {!loading && allWells.length > 0 && (
        <div className="mb-8">
          <PilotCharts
            wells={allWells}
            getSptRating={(w) => {
              const oil = w.production_oil ?? 0;
              const wc = w.water_cut ?? 0;
              if (oil <= 0 || oil > 25 || wc >= 80) return "not_suitable";
              if (oil <= 15 && wc >= 20 && wc <= 60) return "excellent";
              if (oil <= 25 && wc >= 10 && wc <= 70) return "good";
              return "marginal";
            }}
            analyses={analyses}
          />
        </div>
      )}

      {/* Well Selection Table */}
      {!loading && allWells.length > 0 && !isRunning && analyses.size === 0 && (
        <Card className="glass-card border-primary/30 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Select Wells for Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WellSelectionTable
              wells={allWells}
              selectedIds={selectedIds}
              onToggle={toggleWell}
              onSelectAll={selectTopN}
              onDeselectAll={deselectAll}
              maxSelection={MAX_ANALYSIS}
              analyzedIds={analyzedWellIds}
              getSptRating={(w) => {
                const oil = w.production_oil ?? 0;
                const wc = w.water_cut ?? 0;
                if (oil <= 0 || oil > 25 || wc >= 80) return "not_suitable";
                if (oil <= 15 && wc >= 20 && wc <= 60) return "excellent";
                if (oil <= 25 && wc >= 10 && wc <= 70) return "good";
                return "marginal";
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analyses.size > 0 && (
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Well-by-Well Analysis ({completedWells}/{totalAnalyzing})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3">
                {selectedWells.map((well, idx) => {
                  const analysis = analyses.get(well.id);
                  const isActive = idx === currentWellIdx && isRunning;
                  const isDone = analysis?.status === "done";
                  const isError = analysis?.status === "error";
                  const completedStages = analysis?.stages.size || 0;

                  return (
                    <Card
                      key={well.id}
                      className={`transition-all duration-300 ${
                        isActive ? "ring-2 ring-primary shadow-lg" : isDone ? "border-success/30" : isError ? "border-destructive/30" : ""
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              isDone ? "bg-success/20 text-success" : isActive ? "bg-primary/20 text-primary" : isError ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                            }`}>
                              {isDone ? <CheckCircle2 className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : isError ? <AlertTriangle className="h-4 w-4" /> : idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{well.well_name || well.api_number}</p>
                              <p className="text-xs text-muted-foreground">{well.operator} · {well.county}, OK</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span><span className="text-muted-foreground">Oil:</span> <span className="font-medium">{well.production_oil?.toFixed(1)} bbl/d</span></span>
                            <span className={`font-medium ${(well.water_cut ?? 0) > 70 ? "text-destructive" : "text-success"}`}>
                              WC: {well.water_cut?.toFixed(1)}%
                            </span>
                            {isDone && (
                              <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                                SPT: {getSptScore(analysis!)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {(isActive || isDone || completedStages > 0) && (
                          <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {STAGES.map((stage, si) => {
                                const hasResult = analysis?.stages.has(stage.key);
                                const isCurrent = isActive && si === currentStageIdx;
                                return (
                                  <div
                                    key={stage.key}
                                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                                      hasResult ? "bg-success" : isCurrent ? "bg-primary animate-pulse" : "bg-muted"
                                    }`}
                                    title={stage.label}
                                  />
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {completedStages}/{STAGES.length} stages
                              {isActive && ` — ${STAGES[currentStageIdx]?.label}`}
                            </p>
                          </div>
                        )}

                        {isDone && (
                          <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                            <p className="font-medium">{getVerdict(analysis!)}</p>
                          </div>
                        )}

                        {isDone && analysis?.stages.has("field_scan") && (
                          <FieldScanStageViz well={well} allWells={allWells} />
                        )}
                        {isDone && analysis?.stages.has("classification") && (
                          <ClassificationStageViz well={well} allWells={allWells} />
                        )}
                        {isDone && analysis?.stages.has("core_analysis") && (
                          <CoreAnalysisStageViz well={well} />
                        )}
                        {isDone && analysis?.stages.has("cumulative") && (
                          <CumulativeStageViz well={well} />
                        )}
                        {isDone && analysis?.stages.has("spt_projection") && (
                          <SPTProjectionStageViz well={well} />
                        )}
                        {isDone && analysis?.stages.has("economic") && (
                          <EconomicStageViz well={well} />
                        )}
                        {isDone && analysis?.stages.has("geophysical") && (
                          <GeophysicalStageViz well={well} />
                        )}
                        {isDone && (
                          <PilotWellLog
                            wellName={well.well_name || well.api_number || "Unknown"}
                            totalDepth={well.total_depth}
                            waterCut={well.water_cut}
                            productionOil={well.production_oil}
                            formation={well.formation}
                          />
                        )}

                        {isError && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                            Error: {analysis?.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Next Batch CTA after analysis completes */}
      {!isRunning && completedWells >= totalAnalyzing && totalAnalyzing > 0 && unanalyzedCount > 0 && (
        <div className="my-6 flex justify-center">
          <Button size="lg" onClick={selectNextBatch} className="gap-2">
            <SkipForward className="h-4 w-4" />
            Analyze Next Batch ({Math.min(unanalyzedCount, MAX_ANALYSIS)} wells)
          </Button>
        </div>
      )}

      {/* Combined Results */}
      {completedWells >= totalAnalyzing && totalAnalyzing > 0 && (
        <div ref={reportRef}>
          <Card className="mt-6 border-success/30 glass-card animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Oklahoma Pilot — Combined Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-success">{completedWells}</p>
                <p className="text-xs text-muted-foreground">Wells Analyzed</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{completedWells * STAGES.length}</p>
                <p className="text-xs text-muted-foreground">Total Stages</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-warning">
                  {selectedWells.filter(w => (w.water_cut ?? 0) > 70).length}
                </p>
                <p className="text-xs text-muted-foreground">EOR Candidates</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-success">
                  {selectedWells.filter(w => (w.water_cut ?? 0) < 30).length}
                </p>
                <p className="text-xs text-muted-foreground">Stable Wells</p>
              </div>
            </div>

            <Separator />

            {/* Detailed per-well analysis */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Detailed Well Analysis</h4>
              <div className="space-y-4">
                {selectedWells.map((well) => {
                  const a = analyses.get(well.id);
                  if (!a || a.status !== "done") return null;
                  return (
                    <div key={well.id} className="p-4 bg-muted/20 rounded-lg border border-border/50 space-y-3">
                      {/* Well header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="font-semibold">{well.well_name || well.api_number}</span>
                          <span className="text-xs text-muted-foreground">{well.operator} · {well.county}, OK</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            SPT: {getSptScore(a)}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${(well.water_cut ?? 0) > 70 ? "border-destructive/50 text-destructive" : "border-success/50 text-success"}`}>
                            {(well.water_cut ?? 0) > 70 ? "⚠️ High WC" : "✅ Stable"}
                          </Badge>
                        </div>
                      </div>

                      {/* Well properties */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-muted-foreground">Oil</p>
                          <p className="font-semibold">{well.production_oil?.toFixed(1) ?? "—"} bbl/d</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-muted-foreground">Gas</p>
                          <p className="font-semibold">{well.production_gas?.toFixed(0) ?? "—"} MCF/d</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-muted-foreground">Water Cut</p>
                          <p className="font-semibold">{well.water_cut?.toFixed(1) ?? "—"}%</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-muted-foreground">Depth</p>
                          <p className="font-semibold">{well.total_depth ? `${well.total_depth.toLocaleString()} ft` : "—"}</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-muted-foreground">Formation</p>
                          <p className="font-semibold">{well.formation || "—"}</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-semibold">{well.well_type || "Oil"}</p>
                        </div>
                      </div>

                      {/* Stage-by-stage metrics */}
                      <div className="space-y-2">
                        {STAGES.map((stage) => {
                          const result = a.stages.get(stage.key);
                          if (!result) return null;
                          return (
                            <div key={stage.key} className="p-2 bg-muted/10 rounded border border-border/30">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">{stage.badge}</Badge>
                                <span className="text-xs font-semibold">{stage.label}</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                {result.metrics.map((m) => (
                                  <div key={m.label}>
                                    <p className="text-muted-foreground text-[10px]">{m.label}</p>
                                    <p className={`font-semibold ${m.color || ""}`}>{m.value}</p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1 border-t border-border/20 pt-1">{result.verdict}</p>
                              {stage.key === "field_scan" && (
                                <FieldScanStageViz well={well} allWells={allWells} />
                              )}
                              {stage.key === "classification" && (
                                <ClassificationStageViz well={well} allWells={allWells} />
                              )}
                              {stage.key === "core_analysis" && (
                                <CoreAnalysisStageViz well={well} />
                              )}
                              {stage.key === "cumulative" && (
                                <CumulativeStageViz well={well} />
                              )}
                              {stage.key === "spt_projection" && (
                                <SPTProjectionStageViz well={well} />
                              )}
                              {stage.key === "economic" && (
                                <EconomicStageViz well={well} />
                              )}
                              {stage.key === "geophysical" && (
                                <GeophysicalStageViz well={well} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Well Log for PDF */}
                      <PilotWellLog
                        wellName={well.well_name || well.api_number || "Unknown"}
                        totalDepth={well.total_depth}
                        waterCut={well.water_cut}
                        productionOil={well.production_oil}
                        formation={well.formation}
                        defaultExpanded
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Comparison Table */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-3">Summary Comparison</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Well</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">County</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Oil (bbl/d)</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Gas (MCF/d)</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">WC (%)</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Depth (ft)</th>
                      <th className="text-center py-2 px-2 font-semibold text-muted-foreground">SPT Score</th>
                      <th className="text-center py-2 px-2 font-semibold text-muted-foreground">ROI</th>
                      <th className="text-center py-2 px-2 font-semibold text-muted-foreground">EOR</th>
                      <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWells.map((well) => {
                      const a = analyses.get(well.id);
                      if (!a || a.status !== "done") return null;
                      const sptMetric = a.stages.get("spt_projection")?.metrics.find(m => m.label.toLowerCase().includes("score"));
                      const roiMetric = a.stages.get("economic")?.metrics.find(m => m.label.toLowerCase().includes("roi"));
                      const eorMetric = a.stages.get("eor")?.metrics.find(m => m.label.toLowerCase().includes("score"));
                      return (
                        <tr key={well.id} className="border-b border-border/20 hover:bg-muted/20">
                          <td className="py-1.5 px-2 font-medium">{well.well_name || well.api_number}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{well.county}</td>
                          <td className="py-1.5 px-2 text-right">{well.production_oil?.toFixed(1) ?? "—"}</td>
                          <td className="py-1.5 px-2 text-right">{well.production_gas?.toFixed(0) ?? "—"}</td>
                          <td className={`py-1.5 px-2 text-right font-medium ${(well.water_cut ?? 0) > 70 ? "text-destructive" : "text-success"}`}>
                            {well.water_cut?.toFixed(1) ?? "—"}
                          </td>
                          <td className="py-1.5 px-2 text-right">{well.total_depth?.toLocaleString() ?? "—"}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-primary">{sptMetric?.value || "—"}</td>
                          <td className="py-1.5 px-2 text-center font-medium">{roiMetric?.value || "—"}</td>
                          <td className="py-1.5 px-2 text-center font-medium">{eorMetric?.value || "—"}</td>
                          <td className="py-1.5 px-2 text-center">
                            <Badge variant="outline" className={`text-[9px] ${(well.water_cut ?? 0) > 70 ? "border-destructive/50 text-destructive" : "border-success/50 text-success"}`}>
                              {(well.water_cut ?? 0) > 70 ? "High WC" : "Stable"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
              <p>Generated by AI Smart Well (SGOM Platform) — Powered by SPT Technology (Patent US 8,863,823)</p>
              <p>Oklahoma Pilot Analysis — {new Date().toLocaleDateString()} — © {new Date().getFullYear()} Maxxwell Production</p>
            </div>
          </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OklahomaPilot;
