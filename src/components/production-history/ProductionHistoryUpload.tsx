import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedRow {
  api_number: string;
  production_month: string;
  oil_bbl: number;
  gas_mcf: number;
  water_bbl: number;
  days_on: number;
  valid: boolean;
  error?: string;
}

const REQUIRED_HEADERS = ["api_number", "production_month", "oil_bbl", "gas_mcf", "water_bbl", "days_on"];

interface ProductionHistoryUploadProps {
  companyId: string | null;
}

const ProductionHistoryUpload = ({ companyId }: ProductionHistoryUploadProps) => {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; errors: number } | null>(null);

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\ufeff/, ""));

    const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
      return [];
    }

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      const oilBbl = parseFloat(row.oil_bbl) || 0;
      const gasMcf = parseFloat(row.gas_mcf) || 0;
      const waterBbl = parseFloat(row.water_bbl) || 0;
      const daysOn = parseInt(row.days_on) || 0;

      let valid = true;
      let error = "";

      if (!row.api_number) { valid = false; error = "Missing API number"; }
      if (!row.production_month || !/^\d{4}-\d{2}/.test(row.production_month)) {
        valid = false; error = "Invalid date format (use YYYY-MM-DD)";
      }
      if (daysOn < 0 || daysOn > 31) { valid = false; error = "Days on must be 0-31"; }

      rows.push({
        api_number: row.api_number,
        production_month: row.production_month,
        oil_bbl: oilBbl,
        gas_mcf: gasMcf,
        water_bbl: waterBbl,
        days_on: daysOn,
        valid,
        error,
      });
    }
    return rows;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
      if (rows.length > 0) {
        const validCount = rows.filter(r => r.valid).length;
        toast.success(`Parsed ${rows.length} rows (${validCount} valid)`);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!companyId) {
      toast.error("No company selected. Please log in first.");
      return;
    }

    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to upload");
      return;
    }

    setUploading(true);
    let inserted = 0;
    let errors = 0;

    // Get well IDs by API number
    const apiNumbers = [...new Set(validRows.map(r => r.api_number))];
    const { data: wells } = await supabase
      .from("wells")
      .select("id, api_number")
      .eq("company_id", companyId)
      .in("api_number", apiNumbers);

    const wellMap = new Map(wells?.map(w => [w.api_number, w.id]) || []);

    // Batch insert
    for (const row of validRows) {
      const wellId = wellMap.get(row.api_number);
      if (!wellId) {
        errors++;
        continue;
      }

      const { error } = await supabase
        .from("production_history" as any)
        .upsert({
          well_id: wellId,
          company_id: companyId,
          production_month: row.production_month,
          oil_bbl: row.oil_bbl,
          gas_mcf: row.gas_mcf,
          water_bbl: row.water_bbl,
          days_on: row.days_on,
        }, { onConflict: "well_id,production_month" });

      if (error) {
        errors++;
      } else {
        inserted++;
      }
    }

    setUploading(false);
    setUploadResult({ inserted, errors });

    if (inserted > 0) {
      toast.success(`Uploaded ${inserted} production records`);
    }
    if (errors > 0) {
      toast.warning(`${errors} records failed (well not found or duplicate)`);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/templates/sample-production-history.csv";
    link.download = "sample-production-history.csv";
    link.click();
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          Production History Upload
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload monthly production data (oil, gas, water) for historical analysis and decline curve fitting
        </p>
      </div>

      {/* Template download + upload */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              CSV Template
            </CardTitle>
            <CardDescription>
              Download sample CSV with correct column format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Required columns:</strong></p>
              <div className="flex flex-wrap gap-1.5">
                {REQUIRED_HEADERS.map(h => (
                  <Badge key={h} variant="outline" className="font-mono text-xs">{h}</Badge>
                ))}
              </div>
            </div>
            <Button onClick={downloadTemplate} variant="outline" className="gap-2 w-full">
              <Download className="h-4 w-4" />
              Download Template CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Production Data
            </CardTitle>
            <CardDescription>
              CSV with monthly production records per well (matched by API number)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {fileName && (
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span>{fileName}</span>
                <Badge variant="outline">{parsedRows.length} rows</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation summary */}
      {parsedRows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-primary">{parsedRows.length}</p>
              <p className="text-sm text-muted-foreground">Total Rows</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-emerald-400">{validCount}</p>
              <p className="text-sm text-muted-foreground">Valid</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-destructive">{invalidCount}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview table */}
      {parsedRows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Data Preview</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setParsedRows([]); setFileName(""); setUploadResult(null); }}
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" /> Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading || validCount === 0}
                  className="gap-1"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload {validCount} Records
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 sticky top-0">
                    <th className="px-3 py-2 text-center w-8">✓</th>
                    <th className="px-3 py-2 text-left">API Number</th>
                    <th className="px-3 py-2 text-left">Month</th>
                    <th className="px-3 py-2 text-right">Oil (bbl)</th>
                    <th className="px-3 py-2 text-right">Gas (mcf)</th>
                    <th className="px-3 py-2 text-right">Water (bbl)</th>
                    <th className="px-3 py-2 text-right">Days On</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border/30 ${row.valid ? "hover:bg-muted/10" : "bg-destructive/5"}`}
                    >
                      <td className="px-3 py-1.5 text-center">
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                        )}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs">{row.api_number}</td>
                      <td className="px-3 py-1.5 text-xs">{row.production_month}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">{row.oil_bbl.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">{row.gas_mcf.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">{row.water_bbl.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">{row.days_on}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Upload result */}
      {uploadResult && (
        <Card className={uploadResult.errors > 0 ? "border-warning/30" : "border-emerald-500/30"}>
          <CardContent className="pt-5">
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold">Upload Complete</p>
                <p className="text-muted-foreground">
                  {uploadResult.inserted} records uploaded successfully.
                  {uploadResult.errors > 0 && ` ${uploadResult.errors} records failed (well not found in database — import wells first).`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Format guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV Format Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <p className="font-semibold">Column Descriptions</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><code className="text-primary">api_number</code> — Well API number (must match imported wells)</li>
                <li><code className="text-primary">production_month</code> — YYYY-MM-DD (first day of month)</li>
                <li><code className="text-primary">oil_bbl</code> — Oil production in barrels</li>
                <li><code className="text-primary">gas_mcf</code> — Gas production in MCF</li>
                <li><code className="text-primary">water_bbl</code> — Water production in barrels</li>
                <li><code className="text-primary">days_on</code> — Days the well was producing (0–31)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Tips</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Wells must be imported first (via Data Import module)</li>
                <li>• Duplicate months are updated automatically (upsert)</li>
                <li>• Minimum 6 months of data recommended for decline analysis</li>
                <li>• KDOR historical reports can be converted to this format</li>
                <li>• Export from OCC/RRC portals is compatible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionHistoryUpload;
