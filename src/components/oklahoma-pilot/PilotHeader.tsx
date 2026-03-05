import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Play, RotateCcw, Loader2,
  FileSpreadsheet, MapPin, Download,
} from "lucide-react";

interface PilotHeaderProps {
  allWellsCount: number;
  sptCandidatesCount: number;
  selectedCount: number;
  completedWells: number;
  isRunning: boolean;
  currentWellIdx: number;
  totalAnalyzing: number;
  onBack: () => void;
  onExportCSV: () => void;
  onExportKML: () => void;
  onExportGeoJSON: () => void;
  onExportAnalysisCSV: () => void;
  onExportPDF: () => void;
  onRunAnalysis: () => void;
  onReset: () => void;
}

const PilotHeader = ({
  allWellsCount,
  sptCandidatesCount,
  selectedCount,
  completedWells,
  isRunning,
  currentWellIdx,
  totalAnalyzing,
  onBack,
  onExportCSV,
  onExportKML,
  onExportGeoJSON,
  onExportAnalysisCSV,
  onExportPDF,
  onRunAnalysis,
  onReset,
}: PilotHeaderProps) => {
  return (
    <div className="mb-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      {/* Title row */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">Oklahoma Pilot</h1>
            <Badge className="bg-success/20 text-success border-success/30 text-xs">LIVE</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {allWellsCount} wells loaded → <span className="text-success font-medium">{sptCandidatesCount} SPT candidates</span> (≤25 bbl/d, WC &lt;80%)
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" onClick={onExportCSV} className="text-xs">
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            {selectedCount > 0 ? `CSV (${selectedCount})` : "CSV"}
          </Button>
          <Button variant="outline" size="sm" onClick={onExportKML} className="text-xs">
            <MapPin className="mr-1.5 h-3.5 w-3.5" /> KML
          </Button>
          <Button variant="outline" size="sm" onClick={onExportGeoJSON} className="text-xs">
            <MapPin className="mr-1.5 h-3.5 w-3.5" /> GeoJSON
          </Button>
          {completedWells > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={onExportAnalysisCSV} className="text-xs">
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Analysis
              </Button>
              <Button variant="outline" size="sm" onClick={onExportPDF} className="text-xs">
                <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
              </Button>
            </>
          )}
          <Button onClick={onRunAnalysis} disabled={isRunning || selectedCount === 0} size="sm">
            {isRunning ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Analyzing {currentWellIdx + 1}/{totalAnalyzing}</>
            ) : (
              <><Play className="mr-1.5 h-3.5 w-3.5" />Analyze {selectedCount}</>
            )}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onReset} disabled={isRunning}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PilotHeader;
