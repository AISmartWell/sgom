import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Upload } from "lucide-react";
import { toast } from "sonner";

export const WATERFLOOD_STORAGE_KEY = "sgom.waterflood.inputs";

/** Arps/Bateman-Konen: NaCl-equivalent TDS (ppm) + temperature (°F) -> Rw (Ohm-m). */
export function tdsToRw(ppm: number, tempF: number): number | null {
  if (!(ppm > 0) || !(tempF > 0)) return null;
  const rw75 = 0.0123 + 3647.5 / Math.pow(ppm, 0.955);
  return rw75 * (75 + 6.77) / (tempF + 6.77);
}

export function InjectionSalinityForm() {
  const [fTds, setFTds] = useState("");
  const [iTds, setITds] = useState("");
  const [temp, setTemp] = useState("");
  const [injected, setInjected] = useState("");
  const [produced, setProduced] = useState("");
  const [csvInfo, setCsvInfo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); return; }
    const header = lines[0].toLowerCase().split(/[,;\t]/).map((h) => h.trim());
    const findCol = (...keys: string[]) =>
      header.findIndex((h) => keys.some((k) => h.includes(k)));
    const dateIdx = findCol("date", "month", "period", "year");
    const injIdx = findCol("inject", "inj");
    const prodIdx = findCol("produced", "prod", "liquid");
    if (injIdx < 0 && prodIdx < 0) {
      toast.error("No injection/production columns found. Expected headers like: month, injected_bbl, produced_bbl");
      return;
    }
    let sumInj = 0, sumProd = 0, rows = 0;
    const dates: string[] = [];
    for (const line of lines.slice(1)) {
      const cells = line.split(/[,;\t]/).map((c) => c.trim());
      const inj = injIdx >= 0 ? parseFloat(cells[injIdx]) : NaN;
      const prod = prodIdx >= 0 ? parseFloat(cells[prodIdx]) : NaN;
      if (inj > 0) sumInj += inj;
      if (prod > 0) sumProd += prod;
      if (dateIdx >= 0 && cells[dateIdx]) dates.push(cells[dateIdx]);
      if (inj > 0 || prod > 0) rows++;
    }
    if (!rows) { toast.error("No numeric data rows found in CSV"); return; }
    if (injIdx >= 0 && sumInj > 0) setInjected(String(Math.round(sumInj)));
    if (prodIdx >= 0 && sumProd > 0) setProduced(String(Math.round(sumProd)));
    const period = dates.length >= 2 ? ` · period ${dates[0]} — ${dates[dates.length - 1]}` : "";
    setCsvInfo(`${rows} monthly rows loaded${period}`);
    toast.success("CSV loaded — cumulative volumes calculated");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => parseCsv(String(reader.result ?? ""));
    reader.readAsText(f);
    e.target.value = "";
  };

  const rwF = tdsToRw(parseFloat(fTds), parseFloat(temp));
  const rwI = tdsToRw(parseFloat(iTds), parseFloat(temp));
  const share = useMemo(() => {
    const inj = parseFloat(injected), prod = parseFloat(produced);
    if (!(inj > 0) || !(prod > 0)) return null;
    return Math.min(100, (inj / prod) * 100);
  }, [injected, produced]);

  const save = () => {
    if (rwF == null) { toast.error("Enter formation TDS and reservoir temperature"); return; }
    localStorage.setItem(WATERFLOOD_STORAGE_KEY, JSON.stringify({
      rwFormation: rwF.toFixed(4),
      rwInjection: rwI != null ? rwI.toFixed(4) : "",
      injShare: share != null ? share.toFixed(1) : "0",
    }));
    toast.success("Saved. Stage 8 Waterflood correction will use these values.");
  };

  const field = (id: string, label: string, v: string, set: (s: string) => void, ph: string) => (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} type="number" min={0} placeholder={ph} value={v} onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Droplets className="h-4 w-4 text-primary" />Injection &amp; Water Salinity</CardTitle>
        <CardDescription>Client water analyses and injection volumes. Salinity is converted to Rw (Arps, NaCl-equivalent) and passed to the Stage 8 waterflood correction.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {field("f-tds", "Formation water TDS (ppm)", fTds, setFTds, "e.g. 120000")}
          {field("i-tds", "Injected water TDS (ppm)", iTds, setITds, "e.g. 20000")}
          {field("t-res", "Reservoir temperature (°F)", temp, setTemp, "e.g. 140")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("inj", "Cumulative water injected (bbl)", injected, setInjected, "offset injectors")}
          {field("prod", "Cumulative liquid produced (bbl)", produced, setProduced, "oil + water")}
        </div>
        <div className="rounded-md border border-dashed border-border p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />Upload monthly history CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            {csvInfo && <Badge variant="secondary">{csvInfo}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            Expected columns: <code>month, injected_bbl, produced_bbl</code> (one row per month, full injection period).
            The platform sums the volumes and fills the cumulative fields above; the injection period is taken from the first and last rows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">Rw formation: {rwF != null ? `${rwF.toFixed(3)} Ω·m` : "—"}</Badge>
          <Badge variant="outline">Rw injected: {rwI != null ? `${rwI.toFixed(3)} Ω·m` : "—"}</Badge>
          <Badge variant="outline">Injection share: {share != null ? `${share.toFixed(1)}%` : "—"}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Injection share is a screening estimate (injected ÷ produced liquid, capped at 100%); it does not model injector distance or connectivity.</p>
        <Button size="sm" onClick={save}>Apply to Stage 8</Button>
      </CardContent>
    </Card>
  );
}
