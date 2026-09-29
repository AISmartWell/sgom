import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplets, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWellWaterInputs } from "@/hooks/useWellWaterInputs";

/** Arps/Bateman-Konen: NaCl-equivalent TDS (ppm) + temperature (°F) -> Rw (Ohm-m). */
export function tdsToRw(ppm: number, tempF: number): number | null {
  if (!(ppm > 0) || !(tempF > 0)) return null;
  const rw75 = 0.0123 + 3647.5 / Math.pow(ppm, 0.955);
  return rw75 * (75 + 6.77) / (tempF + 6.77);
}

const num = (s: string) => (s.trim() === "" || isNaN(parseFloat(s)) ? null : parseFloat(s));
const str = (v: number | null | undefined) => (v == null ? "" : String(v));

export function InjectionSalinityForm({ companyId }: { companyId: string | null }) {
  const [wells, setWells] = useState<{ id: string; label: string }[]>([]);
  const [wellId, setWellId] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { data: saved } = useWellWaterInputs(wellId || undefined, refresh);
  const [fTds, setFTds] = useState("");
  const [iTds, setITds] = useState("");
  const [temp, setTemp] = useState("");
  const [injected, setInjected] = useState("");
  const [produced, setProduced] = useState("");
  const [period, setPeriod] = useState<string | null>(null);
  const [csvInfo, setCsvInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("wells").select("id, well_name, api_number").order("well_name").limit(1000)
      .then(({ data }) => setWells((data ?? []).map((w) => ({ id: w.id, label: `${w.well_name ?? "Unnamed"}${w.api_number ? ` · ${w.api_number}` : ""}` }))));
  }, []);

  useEffect(() => {
    setFTds(str(saved?.formation_tds_ppm)); setITds(str(saved?.injection_tds_ppm)); setTemp(str(saved?.reservoir_temp_f));
    setInjected(str(saved?.cum_injected_bbl)); setProduced(str(saved?.cum_produced_bbl));
    setPeriod(saved?.history_period ?? null); setCsvInfo(null);
  }, [saved]);

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); return; }
    const header = lines[0].toLowerCase().split(/[,;\t]/).map((h) => h.trim());
    const findCol = (...keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));
    const dateIdx = findCol("date", "month", "period", "year");
    const injIdx = findCol("inject", "inj");
    const prodIdx = findCol("produced", "prod", "liquid");
    if (injIdx < 0 && prodIdx < 0) { toast.error("No injection/production columns found. Expected: month, injected_bbl, produced_bbl"); return; }
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
    if (sumInj > 0) setInjected(String(Math.round(sumInj)));
    if (sumProd > 0) setProduced(String(Math.round(sumProd)));
    const p = dates.length >= 2 ? `${dates[0]} — ${dates[dates.length - 1]}` : null;
    setPeriod(p);
    setCsvInfo(`${rows} monthly rows loaded${p ? ` · period ${p}` : ""}`);
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

  const save = async () => {
    if (!companyId) { toast.error("No company linked to your account"); return; }
    if (!wellId) { toast.error("Select a well"); return; }
    if (rwF == null) { toast.error("Enter formation TDS and reservoir temperature"); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("well_water_inputs").upsert({
      well_id: wellId, company_id: companyId,
      formation_tds_ppm: num(fTds), injection_tds_ppm: num(iTds), reservoir_temp_f: num(temp),
      cum_injected_bbl: num(injected), cum_produced_bbl: num(produced),
      rw_formation: Number(rwF.toFixed(4)), rw_injection: rwI != null ? Number(rwI.toFixed(4)) : null,
      injection_share_pct: share != null ? Number(share.toFixed(1)) : 0,
      history_period: period, updated_by: u.user?.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error(`Save failed: ${error.message}`); return; }
    setRefresh((r) => r + 1);
    toast.success("Saved to the well. Stage 6 and Stage 8 will use these values for everyone on your team.");
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
        <CardDescription>Client water analyses and injection volumes, saved per well and shared with your company. Salinity is converted to Rw (Arps, NaCl-equivalent) for Stage 6 and Stage 8.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={wellId} onValueChange={setWellId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Select well" /></SelectTrigger>
            <SelectContent>{wells.map((w) => <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>)}</SelectContent>
          </Select>
          {saved && <Badge variant="secondary">Saved {new Date(saved.updated_at).toLocaleDateString()}</Badge>}
        </div>
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
            {(csvInfo || period) && <Badge variant="secondary">{csvInfo ?? `period ${period}`}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            Expected columns: <code>month, injected_bbl, produced_bbl</code> (one row per month, full injection period).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">Rw formation: {rwF != null ? `${rwF.toFixed(3)} Ω·m` : "—"}</Badge>
          <Badge variant="outline">Rw injected: {rwI != null ? `${rwI.toFixed(3)} Ω·m` : "—"}</Badge>
          <Badge variant="outline">Injection share: {share != null ? `${share.toFixed(1)}%` : "—"}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Injection share is a screening estimate (injected ÷ produced liquid, capped at 100%); it does not model injector distance or connectivity.</p>
        <Button size="sm" onClick={save} disabled={busy}>Save to well</Button>
      </CardContent>
    </Card>
  );
}
