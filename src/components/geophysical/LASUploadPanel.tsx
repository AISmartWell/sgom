import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseLAS, mapLasToWellLogs, type LasData, type WellLogRow } from "@/lib/las-parser";

interface Props {
  wellId: string;
  wellName: string;
  companyId: string | null;
  onImportComplete: () => void;
}

export const LASUploadPanel = ({ wellId, wellName, companyId, onImportComplete }: Props) => {
  const [parsed, setParsed] = useState<LasData | null>(null);
  const [mappedRows, setMappedRows] = useState<WellLogRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParsed(null);
    setMappedRows([]);

    if (!file.name.toLowerCase().endsWith(".las")) {
      setError("Please select a .las file");
      return;
    }

    try {
      const text = await file.text();
      const las = parseLAS(text);

      if (las.data.length === 0) {
        setError("No data rows found in LAS file.");
        return;
      }

      const rows = mapLasToWellLogs(las);
      if (rows.length === 0) {
        setError("Could not map curves — missing depth column.");
        return;
      }

      setParsed(las);
      setMappedRows(rows);
      toast.success(`Parsed ${rows.length} data points from ${las.curves.length} curves`);
    } catch (e: any) {
      setError(e.message || "Failed to parse LAS file");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (!companyId || mappedRows.length === 0) return;
    setImporting(true);

    try {
      // Delete existing logs for this well first
      await (supabase as any)
        .from("well_logs")
        .delete()
        .eq("well_id", wellId);

      // Insert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < mappedRows.length; i += batchSize) {
        const batch = mappedRows.slice(i, i + batchSize).map(row => ({
          ...row,
          well_id: wellId,
          company_id: companyId,
          source: "las_import",
        }));

        const { error } = await (supabase as any)
          .from("well_logs")
          .insert(batch);

        if (error) throw error;
      }

      toast.success(`Imported ${mappedRows.length} log points for ${wellName}`);
      setParsed(null);
      setMappedRows([]);
      onImportComplete();
    } catch (e: any) {
      toast.error(`Import failed: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const detectedCurves = parsed?.curves.filter((_, i) => i > 0) || []; // skip DEPT
  const depthRange = mappedRows.length > 0
    ? `${mappedRows[0].measured_depth.toFixed(1)} – ${mappedRows[mappedRows.length - 1].measured_depth.toFixed(1)} ft`
    : "";

  const hasCurve = (name: string) => mappedRows.some(r => {
    switch (name) {
      case "GR": return r.gamma_ray !== null;
      case "SP": return r.sp !== null;
      case "RES": return r.resistivity !== null;
      case "POR": return r.porosity !== null;
      case "RHOB": return r.density !== null;
      case "NPHI": return r.neutron_porosity !== null;
      case "SW": return r.water_saturation !== null;
      default: return false;
    }
  });

  return (
    <Card className="bg-muted/20 border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          Import LAS File
          <Badge variant="outline" className="text-[10px]">LAS 2.0</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Drop zone */}
        {!parsed && (
          <div
            className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop <span className="text-foreground font-medium">.las</span> file here or click to browse
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Supports LAS 2.0 format • GR, SP, Resistivity, Porosity, Density, Neutron
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".las,.LAS"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-destructive">{error}</span>
          </div>
        )}

        {/* Preview after parsing */}
        {parsed && mappedRows.length > 0 && (
          <div className="space-y-3">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {parsed.header.well_name && (
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Well: </span>
                  <span className="font-medium">{parsed.header.well_name}</span>
                </div>
              )}
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Depth: </span>
                <span className="font-medium">{depthRange}</span>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Points: </span>
                <span className="font-medium">{mappedRows.length.toLocaleString()}</span>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Step: </span>
                <span className="font-medium">{parsed.header.step ?? "variable"} ft</span>
              </div>
            </div>

            {/* Detected curves */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Detected Curves ({detectedCurves.length}):</p>
              <div className="flex flex-wrap gap-1">
                {["GR", "SP", "RES", "POR", "RHOB", "NPHI", "SW"].map(c => (
                  <Badge
                    key={c}
                    variant={hasCurve(c) ? "default" : "outline"}
                    className={`text-[10px] ${hasCurve(c) ? "bg-primary/20 text-primary border-primary/30" : "opacity-40"}`}
                  >
                    {hasCurve(c) && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <ScrollArea className="h-40">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/30">
                    <th className="py-1 text-left">Depth</th>
                    <th className="py-1 text-center">GR</th>
                    <th className="py-1 text-center">Res</th>
                    <th className="py-1 text-center">φ%</th>
                    <th className="py-1 text-center">ρb</th>
                    <th className="py-1 text-center">NPHI</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-b border-border/10">
                      <td className="py-0.5 font-mono">{r.measured_depth.toFixed(1)}</td>
                      <td className="py-0.5 text-center">{r.gamma_ray?.toFixed(1) ?? "–"}</td>
                      <td className="py-0.5 text-center">{r.resistivity?.toFixed(2) ?? "–"}</td>
                      <td className="py-0.5 text-center">{r.porosity?.toFixed(1) ?? "–"}</td>
                      <td className="py-0.5 text-center">{r.density?.toFixed(2) ?? "–"}</td>
                      <td className="py-0.5 text-center">{r.neutron_porosity?.toFixed(1) ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mappedRows.length > 20 && (
                <p className="text-[10px] text-muted-foreground text-center py-1">
                  ... and {mappedRows.length - 20} more rows
                </p>
              )}
            </ScrollArea>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={importing || !companyId}
                className="flex-1"
                size="sm"
              >
                {importing ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Importing...</>
                ) : (
                  <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Import {mappedRows.length.toLocaleString()} Points</>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setParsed(null); setMappedRows([]); setError(null); }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {!companyId && (
              <p className="text-[10px] text-destructive">Sign in required to import data.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
