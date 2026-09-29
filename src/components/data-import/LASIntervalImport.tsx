import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseLAS, mapLasToWellLogs, type WellLogRow } from "@/lib/las-parser";

const M_TO_FT = 3.28084;

interface Props {
  companyId: string | null;
  onImportComplete?: () => void;
}

/** LAS upload with interval filter; depths in metres are converted to ft (platform standard). */
export function LASIntervalImport({ companyId, onImportComplete }: Props) {
  const [wells, setWells] = useState<{ id: string; label: string }[]>([]);
  const [wellId, setWellId] = useState("");
  const [unit, setUnit] = useState<"m" | "ft">("m");
  const [top, setTop] = useState("4340");
  const [base, setBase] = useState("4500");
  const [allRows, setAllRows] = useState<WellLogRow[]>([]);
  const [fileUnit, setFileUnit] = useState<"m" | "ft">("ft");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("wells").select("id, well_name, api_number").order("well_name").limit(1000)
      .then(({ data }) => setWells((data ?? []).map((w) => ({ id: w.id, label: `${w.well_name ?? "Unnamed"}${w.api_number ? ` · ${w.api_number}` : ""}` }))));
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const las = parseLAS(await f.text());
      const rows = mapLasToWellLogs(las);
      if (!rows.length) { toast.error("No depth data rows found in LAS file"); return; }
      const u = (las.curves[0]?.unit || "").trim().toUpperCase();
      const fu: "m" | "ft" = u === "M" || u === "METERS" || u === "METRES" ? "m" : "ft";
      setFileUnit(fu);
      setAllRows(rows);
      setFileName(f.name);
      toast.success(`Parsed ${rows.length} points · depth unit: ${fu}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse LAS file");
    }
  };

  // Rows in ft, filtered to the requested interval
  const rowsFt = useMemo(() => {
    const t = parseFloat(top), b = parseFloat(base);
    const toFt = (d: number, from: "m" | "ft") => (from === "m" ? d * M_TO_FT : d);
    const tFt = isFinite(t) ? toFt(t, unit) : -Infinity;
    const bFt = isFinite(b) ? toFt(b, unit) : Infinity;
    return allRows
      .map((r) => ({ ...r, measured_depth: Math.round(toFt(r.measured_depth, fileUnit) * 100) / 100 }))
      .filter((r) => r.measured_depth >= tFt && r.measured_depth <= bFt);
  }, [allRows, fileUnit, top, base, unit]);

  const curves = ["gamma_ray", "resistivity", "porosity", "density", "neutron_porosity", "sp", "water_saturation"]
    .filter((k) => rowsFt.some((r) => (r as any)[k] != null));

  const save = async () => {
    if (!companyId) { toast.error("No company linked to your account"); return; }
    if (!wellId) { toast.error("Select a well"); return; }
    if (!rowsFt.length) { toast.error("No points inside the selected interval"); return; }
    setBusy(true);
    try {
      const { error: delErr } = await supabase.from("well_logs").delete()
        .eq("well_id", wellId).eq("company_id", companyId)
        .gte("measured_depth", rowsFt[0].measured_depth).lte("measured_depth", rowsFt[rowsFt.length - 1].measured_depth);
      if (delErr) throw delErr;
      for (let i = 0; i < rowsFt.length; i += 500) {
        const { error } = await supabase.from("well_logs").insert(
          rowsFt.slice(i, i + 500).map((r) => ({ ...r, well_id: wellId, company_id: companyId, source: "las_import" })),
        );
        if (error) throw error;
      }
      toast.success(`Saved ${rowsFt.length} log points. Stage 8 now uses these curves.`);
      setAllRows([]); setFileName("");
      onImportComplete?.();
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" />Well Log Import (LAS, depth interval)</CardTitle>
        <CardDescription>Upload a LAS 2.0 file and keep only the interval of interest. Metre depths are converted to ft and saved as measured curves for the selected well.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Well</Label>
            <Select value={wellId} onValueChange={setWellId}>
              <SelectTrigger><SelectValue placeholder="Select well" /></SelectTrigger>
              <SelectContent>{wells.map((w) => <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="las-top" className="text-xs">Interval top ({unit})</Label>
            <Input id="las-top" type="number" value={top} onChange={(e) => setTop(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="las-base" className="text-xs">Interval base ({unit})</Label>
            <Input id="las-base" type="number" value={base} onChange={(e) => setBase(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setUnit(unit === "m" ? "ft" : "m")}>Interval unit: {unit}</Button>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5 mr-1.5" />Upload LAS</Button>
          <input ref={fileRef} type="file" accept=".las,.LAS" className="hidden" onChange={onFile} />
          {fileName && <Badge variant="secondary">{fileName} · file depth in {fileUnit}</Badge>}
        </div>
        {allRows.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{rowsFt.length} points in interval</Badge>
            {rowsFt.length > 0 && <Badge variant="outline">{fmt(rowsFt[0].measured_depth)} – {fmt(rowsFt[rowsFt.length - 1].measured_depth)} ft</Badge>}
            <Badge variant="outline">Curves: {curves.length ? curves.join(", ") : "none"}</Badge>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Existing curves for this well inside the interval are replaced; curves outside it are kept.</p>
        <Button size="sm" onClick={save} disabled={busy || !rowsFt.length}>
          {busy && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}Save curves to well
        </Button>
      </CardContent>
    </Card>
  );
}
