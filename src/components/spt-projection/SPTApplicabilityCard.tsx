import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWellLogs } from "@/hooks/useWellLogs";
import { rankFromLogs, fluidOf, kCutoffFor } from "@/lib/spt-log-ranking";
import { useWellWaterInputs } from "@/hooks/useWellWaterInputs";

type Status = "pass" | "caution" | "fail" | "missing";
interface Criterion { key: string; label: string; value: string; source: string; status: Status; note: string }

interface WellRow { id: string; well_name: string | null; total_depth: number | null; water_cut: number | null; well_type: string | null }

// Screening thresholds (SPT case library: treated wells 2,650–5,400 ft).
const judgeDepth = (d: number): [Status, string] =>
  d <= 6000 ? ["pass", "Within SPT case-library depth range"]
  : d <= 10000 ? ["caution", "Beyond proven depth — recalculate pressures and equipment"]
  : ["fail", "Far outside proven depth — engineering study required"];
const judgePressure = (p: number): [Status, string] =>
  p <= 3000 ? ["pass", "Standard SPT pumping envelope"]
  : p <= 6000 ? ["caution", "Higher kill-fluid density and surface pressure needed"]
  : ["fail", "High-pressure well — well control and equipment rating review"];
const judgePor = (φ: number): [Status, string] =>
  φ >= 10 ? ["pass", "Good storage capacity"] : φ >= 6 ? ["caution", "Marginal porosity"] : ["fail", "Very low porosity"];
const judgePerm = (k: number, fluid: "oil" | "gas"): [Status, string] => {
  const kLow = kCutoffFor(fluid);
  return k >= kLow ? ["pass", fluid === "gas" ? `Above ${kLow} mD gas cutoff — slots can deliver meaningful inflow` : "Slots can deliver meaningful inflow"]
    : k >= kLow / 10 ? ["caution", "Tight rock — limited uplift"]
    : ["fail", "Too tight for slot inflow gain"];
};
const judgeInj = (f: number): [Status, string] =>
  f <= 60 ? ["pass", "Water share acceptable"] : f <= 85 ? ["caution", "High water share — isolate watered intervals"] : ["fail", "Dominated by injected water"];

const STATUS_STYLE: Record<Status, string> = {
  pass: "bg-success/15 text-success border-success/30",
  caution: "bg-warning/15 text-warning border-warning/30",
  fail: "bg-destructive/15 text-destructive border-destructive/30",
  missing: "bg-muted text-muted-foreground border-border",
};

export default function SPTApplicabilityCard() {
  const [wells, setWells] = useState<WellRow[]>([]);
  const [wellId, setWellId] = useState<string>("");
  const [pressure, setPressure] = useState<{ psi: number; method: string } | null>(null);
  const { data: logs, isLoading } = useWellLogs(wellId || undefined);
  const { data: water } = useWellWaterInputs(wellId || undefined);

  useEffect(() => {
    supabase.from("wells").select("id, well_name, total_depth, water_cut, well_type").order("well_name").limit(1000)
      .then(({ data }) => setWells((data ?? []) as WellRow[]));
  }, []);

  useEffect(() => {
    setPressure(null);
    if (!wellId) return;
    supabase.from("well_pressures").select("p_current_psi, p_initial_psi, method")
      .eq("well_id", wellId).order("estimation_date", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        const psi = data?.p_current_psi ?? data?.p_initial_psi;
        if (psi != null) setPressure({ psi: Number(psi), method: data!.method });
      });
  }, [wellId]);

  const well = wells.find((w) => w.id === wellId);
  const fluid = fluidOf(well?.well_type);

  const criteria = useMemo<Criterion[]>(() => {
    if (!well) return [];
    const out: Criterion[] = [];

    const d = well.total_depth;
    out.push(d ? { key: "depth", label: "Depth", value: `${Math.round(d).toLocaleString()} ft`, source: "Well record", status: judgeDepth(d)[0], note: judgeDepth(d)[1] }
      : { key: "depth", label: "Depth", value: "—", source: "No total depth", status: "missing", note: "Add total depth to the well record" });

    out.push(pressure ? { key: "p", label: "Reservoir pressure", value: `${Math.round(pressure.psi).toLocaleString()} psi`, source: `Reservoir Pressure (${pressure.method})`, status: judgePressure(pressure.psi)[0], note: judgePressure(pressure.psi)[1] }
      : { key: "p", label: "Reservoir pressure", value: "—", source: "No estimate", status: "missing", note: "Run Reservoir Pressure for this well" });

    const lr = logs && logs.length ? rankFromLogs(logs, water, fluid) : null;
    const por = lr?.avgPor ?? null, perm = lr?.avgK ?? null;
    const logSrc = "Measured log curves (Stage 8 solver)";
    out.push(por != null ? { key: "por", label: "Porosity (pay)", value: `${por.toFixed(1)} %`, source: logSrc, status: judgePor(por)[0], note: judgePor(por)[1] }
      : { key: "por", label: "Porosity (pay)", value: "—", source: "No usable log curves", status: "missing", note: "Upload LAS in Data Import (GR, RT, porosity)" });
    out.push(perm != null ? { key: "k", label: "Permeability (Timur)", value: `${perm < 1 ? perm.toFixed(2) : perm.toFixed(1)} mD`, source: logSrc, status: judgePerm(perm, fluid)[0], note: judgePerm(perm, fluid)[1] }
      : { key: "k", label: "Permeability (Timur)", value: "—", source: "No usable log curves", status: "missing", note: "Upload LAS in Data Import" });

    const inj = water?.injection_share_pct != null && water.injection_share_pct > 0 ? Number(water.injection_share_pct) : null;
    if (inj != null) out.push({ key: "inj", label: "Injection water share", value: `${inj.toFixed(1)} %`, source: "Injection & Water Salinity form", status: judgeInj(inj)[0], note: judgeInj(inj)[1] });
    else if (well.water_cut != null) { const wc = well.water_cut <= 1 ? well.water_cut * 100 : well.water_cut; out.push({ key: "inj", label: "Water cut (proxy)", value: `${wc.toFixed(0)} %`, source: "Well record", status: judgeInj(wc)[0], note: judgeInj(wc)[1] }); }
    else out.push({ key: "inj", label: "Injection water share", value: "—", source: "No data", status: "missing", note: "Fill Injection & Water Salinity in Data Import" });

    return out;
  }, [well, pressure, logs, water]);

  const known = criteria.filter((c) => c.status !== "missing");
  const verdict = !well ? null
    : known.length < 3 ? { label: "Insufficient data", cls: STATUS_STYLE.missing }
    : known.some((c) => c.status === "fail") ? { label: "Not recommended without engineering study", cls: STATUS_STYLE.fail }
    : known.some((c) => c.status === "caution") ? { label: "Conditional candidate", cls: STATUS_STYLE.caution }
    : { label: "SPT applicable", cls: STATUS_STYLE.pass };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />SPT Applicability Screening
          <Badge variant="outline" className="text-[10px]">Automatic</Badge>
        </CardTitle>
        <CardDescription>Depth, pressure, porosity, permeability and water share are pulled from the well record, Reservoir Pressure, imported log curves and the Injection &amp; Water Salinity form — no manual entry.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={wellId} onValueChange={setWellId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Select well" /></SelectTrigger>
            <SelectContent>{wells.map((w) => <SelectItem key={w.id} value={w.id}>{w.well_name ?? "Unnamed well"}</SelectItem>)}</SelectContent>
          </Select>
          {isLoading && <span className="text-xs text-muted-foreground">Loading log curves…</span>}
          {verdict && <Badge variant="outline" className={verdict.cls}>{verdict.label}</Badge>}
        </div>
        {criteria.length > 0 && (
          <div className="divide-y divide-border rounded-md border border-border">
            {criteria.map((c) => (
              <div key={c.key} className="grid gap-2 p-3 text-sm sm:grid-cols-[160px_110px_1fr_auto] sm:items-center">
                <span className="font-medium">{c.label}</span>
                <span className="font-mono">{c.value}</span>
                <span className="text-xs text-muted-foreground">{c.note}<br /><span className="opacity-70">Source: {c.source}</span></span>
                <Badge variant="outline" className={STATUS_STYLE[c.status]}>{c.status}</Badge>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Screening only. Thresholds follow the SPT case library (treated wells 2,650–5,400 ft); the treatment program itself still needs engineering design.</p>
      </CardContent>
    </Card>
  );
}
