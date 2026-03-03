import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileUp, X, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface SeismicTrace {
  depth: number;
  trace1: number;
  trace2: number;
  trace3: number;
  amplitude: number;
}

interface SeismicDataUploadProps {
  onDataLoaded: (data: SeismicTrace[]) => void;
  onClear: () => void;
  hasUploadedData: boolean;
}

const parseCSV = (text: string): SeismicTrace[] => {
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const depthIdx = header.findIndex((h) => h === "depth" || h === "md" || h === "tvd");
  
  if (depthIdx === -1) throw new Error("CSV must have a 'depth', 'md', or 'tvd' column");

  // Find trace columns (any numeric column that isn't depth)
  const traceIndices = header
    .map((h, i) => (i !== depthIdx ? i : -1))
    .filter((i) => i !== -1)
    .slice(0, 3); // Take up to 3 trace columns

  if (traceIndices.length === 0) throw new Error("CSV must have at least one trace/amplitude column");

  const data: SeismicTrace[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const depth = parseFloat(cols[depthIdx]);
    if (isNaN(depth)) continue;

    const t1 = traceIndices[0] !== undefined ? parseFloat(cols[traceIndices[0]]) || 0 : 0;
    const t2 = traceIndices[1] !== undefined ? parseFloat(cols[traceIndices[1]]) || 0 : 0;
    const t3 = traceIndices[2] !== undefined ? parseFloat(cols[traceIndices[2]]) || 0 : 0;

    data.push({
      depth,
      trace1: t1,
      trace2: t2,
      trace3: t3,
      amplitude: (t1 + t2 + t3) / Math.max(traceIndices.length, 1),
    });
  }

  if (data.length === 0) throw new Error("No valid data rows found");
  return data.sort((a, b) => a.depth - b.depth);
};

const SeismicDataUpload = ({ onDataLoaded, onClear, hasUploadedData }: SeismicDataUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "segy" || ext === "sgy") {
      toast.error("SEG-Y format support coming in Phase 2. Please convert to CSV.");
      return;
    }

    if (ext !== "csv" && ext !== "txt") {
      toast.error("Supported formats: CSV, TXT (comma-separated)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size limit: 10 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        setFileName(file.name);
        onDataLoaded(data);
        toast.success(`Loaded ${data.length} data points from ${file.name}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const handleClear = () => {
    setFileName(null);
    onClear();
    if (fileRef.current) fileRef.current.value = "";
  };

  if (hasUploadedData && fileName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm">
        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-foreground font-medium truncate">{fileName}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={handleClear}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium">Drop CSV file or click to upload</p>
      <p className="text-xs text-muted-foreground mt-1">
        Format: depth, trace1, trace2, trace3 (comma-separated)
      </p>
      <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        <span>SEG-Y support — Phase 2</span>
      </div>
    </div>
  );
};

export default SeismicDataUpload;
