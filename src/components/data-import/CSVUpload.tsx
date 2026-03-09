import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import * as XLSX from "xlsx";

interface ParsedWell {
  api_number: string;
  well_name: string;
  operator: string;
  well_type?: string;
  status?: string;
  county?: string;
  state: string;
  latitude?: number;
  longitude?: number;
  formation?: string;
  total_depth?: number;
  production_oil?: number;
  production_gas?: number;
  water_cut?: number;
}

interface CSVUploadProps {
  companyId: string | null;
  onImportComplete: () => void;
}

const REQUIRED_COLUMNS = ["api_number", "well_name", "operator", "state"];
const OPTIONAL_COLUMNS = [
  "well_type", "status", "county", "latitude", "longitude",
  "formation", "total_depth", "production_oil", "production_gas", "water_cut",
  "spud_date", "completion_date",
];

export const CSVUpload = ({ companyId, onImportComplete }: CSVUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedWell[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; skipped: number } | null>(null);

  const parseCSV = (text: string): { data: ParsedWell[]; errors: string[] } => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return { data: [], errors: ["File must have a header row and at least one data row"] };

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["\s]/g, "").replace(/-/g, "_"));
    const parseErrors: string[] = [];

    // Validate required columns
    const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
    if (missing.length > 0) {
      parseErrors.push(`Missing required columns: ${missing.join(", ")}`);
      return { data: [], errors: parseErrors };
    }

    const wells: ParsedWell[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      if (values.length < headers.length) {
        parseErrors.push(`Row ${i + 1}: not enough columns (${values.length} vs ${headers.length})`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      if (!row.api_number || !row.well_name) {
        parseErrors.push(`Row ${i + 1}: missing api_number or well_name`);
        continue;
      }

      wells.push({
        api_number: row.api_number,
        well_name: row.well_name,
        operator: row.operator || "Unknown",
        well_type: row.well_type || undefined,
        status: row.status || undefined,
        county: row.county || undefined,
        state: row.state || "OK",
        latitude: row.latitude ? parseFloat(row.latitude) : undefined,
        longitude: row.longitude ? parseFloat(row.longitude) : undefined,
        formation: row.formation || undefined,
        total_depth: row.total_depth ? parseFloat(row.total_depth) : undefined,
        production_oil: row.production_oil ? parseFloat(row.production_oil) : undefined,
        production_gas: row.production_gas ? parseFloat(row.production_gas) : undefined,
        water_cut: row.water_cut ? parseFloat(row.water_cut) : undefined,
      });
    }

    return { data: wells, errors: parseErrors };
  };

  const parseExcel = (buffer: ArrayBuffer): { data: ParsedWell[]; errors: string[] } => {
    try {
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      return parseCSV(csvText);
    } catch {
      return { data: [], errors: ["Failed to parse Excel file"] };
    }
  };

  const handleFile = (f: File) => {
    setFile(f);
    setUploadResult(null);

    if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const { data, errors: parseErrors } = parseExcel(buffer);
        setParsedData(data);
        setErrors(parseErrors);
      };
      reader.readAsArrayBuffer(f);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { data, errors: parseErrors } = parseCSV(text);
        setParsedData(data);
        setErrors(parseErrors);
      };
      reader.readAsText(f);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.name.endsWith(".txt") || f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      handleFile(f);
    } else {
      toast.error("Please upload a CSV or Excel file");
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const uploadToDatabase = async () => {
    if (!companyId) {
      toast.error("No company found. Please log in first.");
      return;
    }
    if (parsedData.length === 0) return;

    setIsUploading(true);
    let inserted = 0;
    let skipped = 0;

    try {
      const batchSize = 50;
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize).map((w) => ({
          ...w,
          company_id: companyId,
          source: "CSV_IMPORT",
        }));

        const { data, error } = await supabase
          .from("wells")
          .upsert(batch, { onConflict: "api_number", ignoreDuplicates: false })
          .select("id");

        if (error) {
          console.error("Upsert error:", error);
          skipped += batch.length;
        } else {
          inserted += data?.length || 0;
        }
      }

      setUploadResult({ inserted, skipped });
      toast.success(`Imported ${inserted} wells, ${skipped} skipped`);
      onImportComplete();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to import wells");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setUploadResult(null);
  };

  const downloadTemplate = () => {
    const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].join(",");
    const sample = "3500100001,SMITH 1-24,ALPHA PETROLEUM,OIL,ACTIVE,CANADIAN,OK,35.467,-97.523,MISSISSIPPIAN,8500,150,300,25,2023-01-15,2023-03-20";
    const csv = `${headers}\n${sample}\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "well_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          CSV / Excel Import
        </CardTitle>
        <CardDescription>
          Upload well data from CSV files. Download our template for the correct format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template download */}
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download CSV Template
        </Button>

        {/* Drop zone */}
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drag & drop your CSV file here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            <input
              type="file"
              accept=".csv,.txt"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={onFileChange}
              style={{ position: "relative", marginTop: "8px" }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* File info */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Parse results */}
            <div className="flex gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-center flex-1">
                <p className="text-2xl font-bold">{parsedData.length}</p>
                <p className="text-xs text-muted-foreground">Wells parsed</p>
              </div>
              {errors.length > 0 && (
                <div className="p-3 bg-destructive/10 rounded-lg text-center flex-1">
                  <p className="text-2xl font-bold text-destructive">{errors.length}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              )}
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <ScrollArea className="h-[100px]">
                <div className="space-y-1">
                  {errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Preview table */}
            {parsedData.length > 0 && (
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground px-2 py-1 border-b">
                    <span>API #</span>
                    <span>Well Name</span>
                    <span>Operator</span>
                    <span>State</span>
                    <span>Oil (bbl)</span>
                  </div>
                  {parsedData.slice(0, 20).map((well, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 text-xs px-2 py-1.5 rounded hover:bg-muted/30">
                      <span className="font-mono">{well.api_number}</span>
                      <span className="truncate">{well.well_name}</span>
                      <span className="truncate">{well.operator}</span>
                      <span>{well.state}</span>
                      <span>{well.production_oil ?? "—"}</span>
                    </div>
                  ))}
                  {parsedData.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      ... and {parsedData.length - 20} more wells
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Upload button */}
            <Button
              onClick={uploadToDatabase}
              disabled={isUploading || parsedData.length === 0}
              className="w-full"
            >
              {isUploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />Import {parsedData.length} Wells to Database</>
              )}
            </Button>

            {/* Result */}
            {uploadResult && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  Successfully imported <strong>{uploadResult.inserted}</strong> wells
                  {uploadResult.skipped > 0 && <>, {uploadResult.skipped} skipped</>}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Format info & example */}
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/20 rounded-lg">
            <p className="font-medium">Required columns:</p>
            <p className="font-mono">{REQUIRED_COLUMNS.join(", ")}</p>
            <p className="font-medium mt-2">Optional columns:</p>
            <p className="font-mono">{OPTIONAL_COLUMNS.join(", ")}</p>
          </div>

          <div className="border border-border/50 rounded-lg overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground">📋 Example CSV format</p>
            </div>
            <ScrollArea className="w-full">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    {["api_number", "well_name", "operator", "state", "county", "well_type", "latitude", "longitude", "formation", "total_depth", "production_oil", "production_gas", "water_cut"].map((col) => (
                      <th key={col} className={`px-2 py-1.5 text-left whitespace-nowrap ${REQUIRED_COLUMNS.includes(col) ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {col}
                        {REQUIRED_COLUMNS.includes(col) && <span className="text-destructive ml-0.5">*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["3500100001", "SMITH 1-24", "ALPHA PETROLEUM", "OK", "CANADIAN", "OIL", "35.467", "-97.523", "MISSISSIPPIAN", "8500", "150", "300", "25"],
                    ["3500100002", "JONES 2-15", "BETA ENERGY", "TX", "MIDLAND", "OIL", "31.234", "-101.456", "WOLFCAMP", "9200", "200", "450", "18"],
                    ["3500100003", "WILLIAMS 3-8", "GAMMA OIL", "OK", "GRADY", "GAS", "35.012", "-97.890", "WOODFORD", "11000", "50", "800", "12"],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
