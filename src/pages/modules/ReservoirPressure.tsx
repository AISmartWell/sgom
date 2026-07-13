import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";
import { Gauge, Save, Droplets, TrendingDown, Activity, Layers, Sigma, Plus, Trash2, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { calcIOIP, lookupFormation } from "@/lib/formation-db";
import { estimatePorePressure, calibrateEatonExponent, type PoreLogPoint } from "@/lib/pore-pressure";

type CalibPoint = {
  id: string;
  depth: string;      // ft (string for input control)
  pp: string;         // psi
  source?: "manual" | "rft" | "dst" | "db";
  note?: string;
};

function median(xs: number[]): number | null {
  const a = xs.filter(x => isFinite(x)).slice().sort((a, b) => a - b);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

type Well = {
  id: string;
  well_name: string;
  api_number: string | null;
  total_depth: number | null;
  formation: string | null;
  production_oil: number | null;
  company_id: string;
};

type ProdRow = { production_month: string; oil_bbl: number | null };

// ── Pressure physics ─────────────────────────────────────────────────────────
// Hydrostatic (fresh) ≈ 0.433 psi/ft, brine ≈ 0.465 psi/ft, geopressured > 0.5
const GRAD_HYDROSTATIC = 0.465;   // psi/ft (typical brine)
const GRAD_LITHOSTATIC = 1.0;     // psi/ft (overburden)

// Material-balance surrogate for solution-gas drive:
// P(t)/Pi ≈ 1 - RF(t) / RF_max, where RF(t) = Np(t) / OOIP
// RF_max typical primary depletion ≈ 0.15 for solution-gas drive
function estimatePressureFromMB(
  pInitial: number,
  cumOil: number,
  ooip: number,
  rfMax = 0.15,
  pAbandon = 0.15, // fraction of Pi at abandonment
): number {
  if (ooip <= 0) return pInitial;
  const rf = Math.min(cumOil / ooip, rfMax);
  const depletionFrac = rf / rfMax; // 0..1
  const pRatio = 1 - (1 - pAbandon) * depletionFrac;
  return Math.max(pInitial * pAbandon, pInitial * pRatio);
}

export default function ReservoirPressure() {
  const [wells, setWells] = useState<Well[]>([]);
  const [wellId, setWellId] = useState<string>("");
  const [prod, setProd] = useState<ProdRow[]>([]);
  const [gradient, setGradient] = useState(GRAD_HYDROSTATIC);
  const [rfMax, setRfMax] = useState(0.15);
  const [saving, setSaving] = useState(false);

  // ── Eaton (pore pressure from resistivity) ────────────────────────────────
  const [logs, setLogs] = useState<PoreLogPoint[]>([]);
  const [eatonN, setEatonN] = useState(1.2);       // Gulf Coast default
  const [grShaleCutoff, setGrShaleCutoff] = useState(75);
  const [calibPoints, setCalibPoints] = useState<CalibPoint[]>([
    { id: crypto.randomUUID(), depth: "", pp: "", source: "manual" },
  ]);
  const [autoApplyN, setAutoApplyN] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, total_depth, formation, production_oil, company_id")
        .order("well_name")
        .limit(200);
      const list = (data ?? []) as Well[];
      setWells(list);
      if (list.length && !wellId) setWellId(list[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!wellId) return;
    (async () => {
      const { data } = await supabase
        .from("production_history")
        .select("production_month, oil_bbl")
        .eq("well_id", wellId)
        .order("production_month", { ascending: true });
      setProd((data ?? []) as ProdRow[]);
    })();
    (async () => {
      const { data } = await (supabase as any)
        .from("well_logs")
        .select("measured_depth, gamma_ray, resistivity, density")
        .eq("well_id", wellId)
        .order("measured_depth", { ascending: true });
      const rows = (data ?? []).map((r: any) => ({
        depth: r.measured_depth,
        gr: r.gamma_ray,
        res: r.resistivity,
        rhob: r.density,
      })) as PoreLogPoint[];
      setLogs(rows);
    })();
  }, [wellId]);

  const well = useMemo(() => wells.find(w => w.id === wellId), [wells, wellId]);

  // Eaton pore pressure profile
  const eaton = useMemo(() => {
    if (logs.length < 10) return null;
    const { profile, nct } = estimatePorePressure(logs, {
      grShaleCutoff,
      hydrostaticGrad: gradient,
      eatonExponent: eatonN,
    });
    // Downsample for chart (~250 points)
    const step = Math.max(1, Math.floor(profile.length / 250));
    const chart = profile.filter((_, i) => i % step === 0);
    const validPp = profile.filter(p => p.pp_psi !== null);
    const meanPpg = validPp.length
      ? validPp.reduce((s, p) => s + (p.ppg ?? 0), 0) / validPp.length
      : null;
    const maxPp = validPp.reduce((m, p) => (p.pp_psi ?? 0) > (m?.pp_psi ?? 0) ? p : m, validPp[0] ?? null);
    return { profile, chart, nct, meanPpg, maxPp };
  }, [logs, gradient, eatonN, grShaleCutoff]);

  // Per-point suggested n + aggregate (median) across all valid calibration points
  const calibResults = useMemo(() => {
    if (!eaton) return [] as Array<CalibPoint & { nSuggested: number | null; nearestDepth: number | null }>;
    return calibPoints.map(cp => {
      const d = parseFloat(cp.depth);
      const p = parseFloat(cp.pp);
      if (!isFinite(d) || !isFinite(p) || d <= 0) {
        return { ...cp, nSuggested: null, nearestDepth: null };
      }
      const pt = eaton.profile.reduce((best, x) =>
        Math.abs(x.depth - d) < Math.abs(best.depth - d) ? x : best, eaton.profile[0]);
      if (!pt || pt.rnct === null || pt.robs === null) {
        return { ...cp, nSuggested: null, nearestDepth: pt?.depth ?? null };
      }
      const n = calibrateEatonExponent(pt.depth, p, pt.sv_psi, pt.pn_psi, pt.robs, pt.rnct);
      return { ...cp, nSuggested: isFinite(n) ? n : null, nearestDepth: pt.depth };
    });
  }, [eaton, calibPoints]);

  const suggestedN = useMemo(
    () => median(calibResults.map(r => r.nSuggested ?? NaN)),
    [calibResults],
  );

  // Auto-apply the aggregated n whenever calibration inputs produce a valid value
  useEffect(() => {
    if (!autoApplyN || suggestedN === null || !isFinite(suggestedN)) return;
    const clamped = Math.max(0.6, Math.min(2.0, suggestedN));
    setEatonN(prev => (Math.abs(prev - clamped) < 0.005 ? prev : clamped));
  }, [suggestedN, autoApplyN]);

  const addCalibPoint = () =>
    setCalibPoints(pts => [...pts, { id: crypto.randomUUID(), depth: "", pp: "", source: "manual" }]);
  const removeCalibPoint = (id: string) =>
    setCalibPoints(pts => pts.filter(p => p.id !== id));
  const updateCalibPoint = (id: string, patch: Partial<CalibPoint>) =>
    setCalibPoints(pts => pts.map(p => (p.id === id ? { ...p, ...patch } : p)));

  // Load previously measured RFT/DST points saved for this well from well_pressures
  const loadMeasuredFromDb = async () => {
    if (!wellId) return;
    const { data, error } = await (supabase as any)
      .from("well_pressures")
      .select("datum_depth_ft, p_current_psi, method, notes")
      .eq("well_id", wellId)
      .in("method", ["measured", "rft", "dst"])
      .order("datum_depth_ft", { ascending: true });
    if (error) { toast.error(`Load failed: ${error.message}`); return; }
    const rows = (data ?? []) as Array<{ datum_depth_ft: number | null; p_current_psi: number | null; method: string; notes: string | null }>;
    if (!rows.length) { toast.info("No stored RFT/DST points for this well"); return; }
    const imported: CalibPoint[] = rows
      .filter(r => r.datum_depth_ft && r.p_current_psi)
      .map(r => ({
        id: crypto.randomUUID(),
        depth: String(r.datum_depth_ft),
        pp: String(r.p_current_psi),
        source: (r.method === "rft" ? "rft" : r.method === "dst" ? "dst" : "db"),
        note: r.notes ?? undefined,
      }));
    if (!imported.length) { toast.info("Stored rows have no depth/pressure"); return; }
    setCalibPoints(pts => {
      // dedupe by (depth ± 2 ft, pp ± 5 psi)
      const merged = [...pts];
      for (const ip of imported) {
        const d = parseFloat(ip.depth), p = parseFloat(ip.pp);
        const dup = merged.some(m => {
          const md = parseFloat(m.depth), mp = parseFloat(m.pp);
          return isFinite(md) && isFinite(mp) && Math.abs(md - d) < 2 && Math.abs(mp - p) < 5;
        });
        if (!dup) merged.push(ip);
      }
      // drop trailing empty rows if we now have data
      return merged.filter(m => m.depth || m.pp).length ? merged.filter(m => m.depth || m.pp) : merged;
    });
    toast.success(`Loaded ${imported.length} point${imported.length > 1 ? "s" : ""} from database`);
  };



  const analysis = useMemo(() => {
    if (!well) return null;
    const depth = well.total_depth ?? 5000;
    const pInitial = depth * gradient;                 // psi
    const pLitho = depth * GRAD_LITHOSTATIC;           // psi (fracture pressure proxy)
    const { ioip } = calcIOIP(well.formation);          // bbl
    const f = lookupFormation(well.formation ?? "");

    // Build cumulative production series
    let cum = 0;
    const series = prod.map((r) => {
      cum += r.oil_bbl ?? 0;
      const p = estimatePressureFromMB(pInitial, cum, ioip, rfMax);
      return {
        date: r.production_month,
        cum: Math.round(cum),
        pressure: Math.round(p),
        depletion: +(((pInitial - p) / pInitial) * 100).toFixed(1),
      };
    });

    const pCurrent = series.length ? series[series.length - 1].pressure : pInitial;
    const depletionPct = +(((pInitial - pCurrent) / pInitial) * 100).toFixed(1);
    const cumOil = series.length ? series[series.length - 1].cum : 0;

    return {
      depth,
      pInitial: Math.round(pInitial),
      pLitho: Math.round(pLitho),
      pCurrent: Math.round(pCurrent),
      depletionPct,
      ioip,
      cumOil,
      formation: f,
      series,
      method: series.length > 0 ? "material_balance" : "gradient",
    };
  }, [well, prod, gradient, rfMax]);

  const save = async () => {
    if (!well || !analysis) return;
    setSaving(true);
    const { error } = await supabase.from("well_pressures").insert({
      well_id: well.id,
      company_id: well.company_id,
      p_initial_psi: analysis.pInitial,
      p_current_psi: analysis.pCurrent,
      depletion_pct: analysis.depletionPct,
      method: analysis.method,
      gradient_psi_ft: gradient,
      datum_depth_ft: analysis.depth,
      confidence: analysis.method === "material_balance" ? 0.75 : 0.5,
      notes: `RF_max=${rfMax}, formation=${well.formation ?? "n/a"}`,
    });
    setSaving(false);
    if (error) toast.error(`Save failed: ${error.message}`);
    else toast.success("Pressure estimate saved");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-primary/20 text-primary border-primary/30">Stage 4.5</Badge>
            <Badge variant="outline" className="border-accent/40 text-accent">Reservoir Pressure</Badge>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gauge className="h-8 w-8 text-primary" />
            Reservoir Pressure Estimator
          </h1>
          <p className="text-muted-foreground mt-1">
            Initial P from gradient · Depletion curve from material balance · Feeds SPT Advisor
          </p>
        </div>
        <Button onClick={save} disabled={!analysis || saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving…" : "Save estimate"}
        </Button>
      </div>

      {/* Well selector */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Select well</CardTitle></CardHeader>
        <CardContent>
          <select
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={wellId}
            onChange={(e) => setWellId(e.target.value)}
          >
            {wells.map(w => (
              <option key={w.id} value={w.id}>
                {w.well_name} {w.api_number ? `· ${w.api_number}` : ""} {w.formation ? `· ${w.formation}` : ""}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {analysis && well && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi icon={<Activity className="h-4 w-4" />} label="Datum depth" value={`${analysis.depth.toLocaleString()} ft`} />
            <Kpi icon={<Droplets className="h-4 w-4" />} label="P initial" value={`${analysis.pInitial.toLocaleString()} psi`} accent />
            <Kpi icon={<Gauge className="h-4 w-4" />} label="P current" value={`${analysis.pCurrent.toLocaleString()} psi`} />
            <Kpi icon={<TrendingDown className="h-4 w-4" />} label="Depletion" value={`${analysis.depletionPct}%`} accent={analysis.depletionPct > 40} />
          </div>

          {/* Controls */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Pressure gradient: {gradient.toFixed(3)} psi/ft</CardTitle></CardHeader>
              <CardContent>
                <Slider value={[gradient]} min={0.40} max={0.80} step={0.005}
                  onValueChange={v => setGradient(v[0])} />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Fresh 0.433</span><span>Brine 0.465</span><span>Geopressured &gt; 0.6</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Ultimate recovery factor: {(rfMax * 100).toFixed(0)}%</CardTitle></CardHeader>
              <CardContent>
                <Slider value={[rfMax]} min={0.05} max={0.35} step={0.01}
                  onValueChange={v => setRfMax(v[0])} />
                <p className="text-xs text-muted-foreground mt-2">
                  Solution-gas drive ≈ 15%; waterflood ≈ 25–35%; strong aquifer up to 40%.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Depletion chart */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Pressure depletion over production history</CardTitle></CardHeader>
            <CardContent>
              {analysis.series.length === 0 ? (
                <div className="text-sm text-muted-foreground py-12 text-center">
                  No production history for this well. Only gradient-based P initial is shown.
                </div>
              ) : (
                <div style={{ width: "100%", height: 380, minHeight: 380 }}>
                  <ResponsiveContainer>
                    <LineChart data={analysis.series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }}
                        label={{ value: "psi", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Legend />
                      <ReferenceLine y={analysis.pInitial} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: "P initial", fill: "hsl(var(--accent))", fontSize: 11 }} />
                      <Line type="monotone" dataKey="pressure" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Reservoir P (psi)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assumptions */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Assumptions & method</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <Row k="Well" v={well.well_name} />
                <Row k="Formation" v={well.formation ?? "unknown"} />
                <Row k="OOIP (volumetric)" v={`${analysis.ioip.toLocaleString()} bbl`} />
                <Row k="Cumulative oil" v={`${analysis.cumOil.toLocaleString()} bbl`} />
                <Row k="Method" v={analysis.method} />
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><b className="text-foreground">P_initial</b> = depth × gradient. Default brine gradient 0.465 psi/ft.</p>
                <p><b className="text-foreground">P(t)</b> from material-balance surrogate: P/Pi = 1 − (Np/OOIP)/RF_max, bounded by abandonment pressure (15% of Pi).</p>
                <p>Fracture pressure proxy (lithostatic ≈ 1.0 psi/ft) for this well: <b className="text-foreground">{analysis.pLitho.toLocaleString()} psi</b>.</p>
                <p>Saved estimates feed the SPT Advisor: low current pressure (&lt; 40% of Pi) routes candidates toward pressure-maintenance EOR (gas lift, waterflood) instead of SPT.</p>
              </div>
            </CardContent>
          </Card>

          {/* ── Eaton pore pressure ────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-accent" />
                Pore Pressure — Eaton method (resistivity)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Pp = Sv − (Sv − Pn) · (R<sub>obs</sub> / R<sub>nct</sub>)<sup>n</sup> · Soft prior for Digital Twin — not a hard SLSQP constraint
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {logs.length < 10 ? (
                <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-md">
                  No well logs (GR + resistivity + density) for this well. Load a LAS via Geophysical Expertise to enable Eaton.
                </div>
              ) : !eaton ? (
                <div className="text-sm text-muted-foreground">Computing…</div>
              ) : (
                <>
                  {/* Controls */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Eaton exponent n: {eatonN.toFixed(2)}</Label>
                      <Slider value={[eatonN]} min={0.6} max={2.0} step={0.05}
                        onValueChange={v => setEatonN(v[0])} />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Gulf Coast 1.2 · Anadarko/Woodford ≈ 1.0–1.4 · calibrate to local RFT
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">GR shale cutoff: {grShaleCutoff} API</Label>
                      <Slider value={[grShaleCutoff]} min={60} max={100} step={1}
                        onValueChange={v => setGrShaleCutoff(v[0])} />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        NCT fitted on shale points only (GR ≥ cutoff)
                      </p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">NCT R² (shale fit)</span><span className="font-mono">{(eaton.nct.r2 * 100).toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Shale points used</span><span className="font-mono">{eaton.nct.shalePoints}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Mean PPG</span><span className="font-mono">{eaton.meanPpg !== null ? eaton.meanPpg.toFixed(3) + " psi/ft" : "—"}</span></div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Regime</span>
                        <Badge variant="outline" className={
                          (eaton.meanPpg ?? 0) > 0.60 ? "border-red-500/50 text-red-400" :
                          (eaton.meanPpg ?? 0) > 0.48 ? "border-amber-500/50 text-amber-400" :
                          "border-emerald-500/50 text-emerald-400"
                        }>
                          {(eaton.meanPpg ?? 0) > 0.60 ? "Overpressured" : (eaton.meanPpg ?? 0) > 0.48 ? "Mildly high" : "Normal"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Chart: Pp / Pn / Sv vs depth */}
                  <div style={{ width: "100%", height: 420, minHeight: 420 }}>
                    <ResponsiveContainer>
                      <LineChart data={eaton.chart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="depth" domain={["dataMin", "dataMax"]}
                          stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }}
                          label={{ value: "Depth (ft)", position: "insideBottom", offset: -2, fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }}
                          label={{ value: "Pressure (psi)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(v: any, name) => [typeof v === "number" ? v.toFixed(0) + " psi" : v, name]}
                          labelFormatter={(d) => `Depth ${Number(d).toFixed(0)} ft`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="sv_psi" stroke="#6b7280" strokeWidth={1.5} dot={false} name="Sv (overburden)" />
                        <Line type="monotone" dataKey="pn_psi" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Pn (hydrostatic)" />
                        <Line type="monotone" dataKey="pp_psi" stroke="#ef4444" strokeWidth={2.5} dot={false} name="Pp (Eaton)" connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Calibration panel */}
                  <div className="border border-border/60 rounded-md p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Sigma className="h-4 w-4 text-accent" />
                      Calibrate n from measured Pp (RFT / DST / production test)
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Depth (ft)</Label>
                        <Input value={calibDepth} onChange={e => setCalibDepth(e.target.value)} placeholder="e.g. 4820" />
                      </div>
                      <div>
                        <Label className="text-xs">Measured Pp (psi)</Label>
                        <Input value={calibPp} onChange={e => setCalibPp(e.target.value)} placeholder="e.g. 2340" />
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="text-xs text-muted-foreground">Suggested n</div>
                        <div className="text-2xl font-mono">
                          {suggestedN !== null && isFinite(suggestedN) ? suggestedN.toFixed(2) : "—"}
                        </div>
                        {suggestedN !== null && isFinite(suggestedN) && (
                          <Button size="sm" variant="outline" className="mt-1"
                            onClick={() => setEatonN(Math.max(0.6, Math.min(2.0, suggestedN)))}>
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Without a single real RFT/DST point the default n = 1.2 is a Gulf Coast assumption (Eaton 1975). Miscalibration can shift Pp by hundreds of psi. Treat Eaton output as a <b>soft prior</b> with wide variance in the Kalman/Bayesian layer, never as a hard constraint in ELAN SLSQP inversion.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>

      )}
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
        <div className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}
