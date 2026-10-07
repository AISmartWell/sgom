import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Scissors, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SW_HIGH } from "@/lib/spt-log-ranking";
import { haversineMiles, isInjectionWell, pressureAtDepth, temperatureAtDepth } from "@/lib/spt-interval-conditions";
import { sptSuitability, MAXXWELL_DECLINE_CAUSES, type SuitState } from "@/lib/spt-suitability";
import blueprintLiner from "@/assets/spt-blueprint-liner.jpg";
import blueprintInflow from "@/assets/spt-blueprint-inflow.jpg";
import blueprintBeforeAfter from "@/assets/spt-blueprint-before-after.jpg";
import CementBondCard from "@/components/spt-projection/CementBondCard";
import WellboreSchematic from "@/components/spt/WellboreSchematic";

/**
 * SPT Slot Cutting Plan — any company well (defaults to Brawner 10-15), DRAFT built from the measured
 * composite log and completion records stored for the user's company (RLS).
 * Pay intervals are derived from log cutoffs; slot geometry stays a design
 * default to be confirmed by a geophysicist and the operator.
 */

const PHI_MIN = 10; // %
const GR_MAX = 50; // API — clean sand
const SPT_LIBRARY_MAX_FT = 5400;

interface LogPt { measured_depth: number; gamma_ray: number | null; resistivity: number | null; porosity: number | null; water_saturation: number | null }
interface Perf { depth_from: number; depth_to: number; shots_per_foot: number | null; phasing: number | null; status: string | null; notes: string | null }
interface ProdRow { production_month: string; oil_bbl: number | null; gas_mcf: number | null; water_bbl: number | null; days_on: number | null }

type Priority = "Primary" | "Secondary" | "Caution";
interface CutInterval {
  top: number; bottom: number; n: number;
  phi: number; sw: number; gr: number; rt: number;
  perforated: "none" | "partial" | "full";
  priority: Priority; nozzles: 2 | 4;
}

const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1);

const SPTSlotPlan = () => {
  // Company wells (RLS scopes the list to the user's company).
  const { data: wellList } = useQuery({
    queryKey: ["spt-slot-plan-wells"],
    queryFn: async () => {
      const all: { id: string; well_name: string | null; api_number: string | null }[] = [];
      for (let from = 0; from < 10000; from += 1000) {
        const { data: page, error } = await supabase.from("wells").select("id, well_name, api_number")
          .order("well_name").range(from, from + 999);
        if (error) throw error;
        all.push(...(page ?? []));
        if (!page || page.length < 1000) break;
      }
      return all;
    },
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wellSearch, setWellSearch] = useState("");
  useEffect(() => {
    if (selectedId || !wellList?.length) return;
    const brawner = wellList.find((w) => (w.well_name ?? "").toLowerCase() === "brawner 10-15");
    setSelectedId((brawner ?? wellList[0]).id);
  }, [wellList, selectedId]);
  const filteredWells = useMemo(() => {
    const q = wellSearch.trim().toLowerCase();
    const list = wellList ?? [];
    const res = q ? list.filter((w) => `${w.well_name ?? ""} ${w.api_number ?? ""}`.toLowerCase().includes(q)) : list;
    const sel = list.find((w) => w.id === selectedId);
    return sel && !res.includes(sel) ? [sel, ...res.slice(0, 499)] : res.slice(0, 500);
  }, [wellList, wellSearch, selectedId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["spt-slot-plan", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data: wells, error: we } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, total_depth, well_type, status, county, state, operator, latitude, longitude, spud_date, completion_date")
        .eq("id", selectedId!)
        .limit(1);
      if (we) throw we;
      const well = wells?.[0];
      if (!well) return null;
      const R = 0.75; // deg box (~50 mi) for injector search
      const nearbyQ = well.latitude != null && well.longitude != null
        ? supabase.from("wells").select("id, well_name, api_number, well_type, status, latitude, longitude")
            .gte("latitude", well.latitude - R).lte("latitude", well.latitude + R)
            .gte("longitude", well.longitude - R).lte("longitude", well.longitude + R)
            .neq("id", well.id).limit(1000)
        : Promise.resolve({ data: [], error: null });
      const [{ data: logs, error: le }, { data: perfs, error: pe }, { data: nearby }, { data: water }, { data: prodHist }] = await Promise.all([
        supabase.from("well_logs")
          .select("measured_depth, gamma_ray, resistivity, porosity, water_saturation")
          .eq("well_id", well.id).order("measured_depth"),
        supabase.from("well_perforations")
          .select("depth_from, depth_to, shots_per_foot, phasing, status, notes")
          .eq("well_id", well.id).order("depth_from"),
        nearbyQ,
        supabase.from("well_water_inputs").select("reservoir_pressure_psi, pressure_datum_ft, bht_f, bht_depth_ft, surface_temp_f").eq("well_id", well.id).maybeSingle(),
        supabase.from("production_history")
          .select("production_month, oil_bbl, gas_mcf, water_bbl, days_on")
          .eq("well_id", well.id).order("production_month", { ascending: false }).limit(3),
      ]);
      const injectors = ((nearby ?? []) as { id: string; well_name: string | null; api_number: string | null; well_type: string | null; status: string | null; latitude: number | null; longitude: number | null }[])
        .filter((w) => isInjectionWell(w.well_type) && w.latitude != null && w.longitude != null)
        .map((w) => ({ ...w, miles: haversineMiles(well.latitude!, well.longitude!, w.latitude!, w.longitude!) }))
        .sort((a, b) => a.miles - b.miles);
      if (le) throw le;
      if (pe) throw pe;
      return { well, logs: (logs ?? []) as LogPt[], perfs: (perfs ?? []) as Perf[], injectors, water, prodHist: (prodHist ?? []) as ProdRow[] };
    },
  });

  const intervals: CutInterval[] = useMemo(() => {
    if (!data) return [];
    const isPay = (p: LogPt) =>
      p.porosity != null && p.water_saturation != null && p.gamma_ray != null &&
      p.porosity >= PHI_MIN && p.water_saturation <= SW_HIGH && p.gamma_ray <= GR_MAX;
    const groups: LogPt[][] = [];
    let cur: LogPt[] = [];
    for (const p of data.logs) {
      if (isPay(p)) cur.push(p);
      else if (cur.length) { groups.push(cur); cur = []; }
    }
    if (cur.length) groups.push(cur);
    return groups.map((g) => {
      const top = g[0].measured_depth, bottom = g[g.length - 1].measured_depth;
      const sw = avg(g.map((p) => p.water_saturation!));
      const covered = g.filter((p) => data.perfs.some((f) => p.measured_depth >= f.depth_from && p.measured_depth <= f.depth_to)).length;
      const perforated = covered === 0 ? "none" : covered === g.length ? "full" : "partial";
      const priority: Priority = sw <= 30 ? "Primary" : sw <= 45 ? "Secondary" : "Caution";
      return {
        top, bottom, n: g.length,
        phi: avg(g.map((p) => p.porosity!)), sw,
        gr: avg(g.map((p) => p.gamma_ray!)), rt: avg(g.map((p) => p.resistivity ?? 0)),
        perforated, priority,
        // Maxxwell tool geometry: 4 nozzles on Primary intervals for the largest
        // opening area, 2 elsewhere. Continuous slots, not discrete shots.
        nozzles: priority === "Primary" ? 4 : 2,
      };
    });
  }, [data]);

  const netPay = intervals.reduce((s, i) => s + Math.max(i.bottom - i.top, 2), 0);
  // Maxxwell documented cutting speed: ~60 min/ft in cased holes, 30 min/ft open hole.
  const totalCutHr = Math.round(netPay); // 60 min/ft → hours ≈ footage
  const totalArea = Math.round(intervals.reduce((s, i) => s + Math.max(i.bottom - i.top, 2) * (i.nozzles === 4 ? 42.8 : 21.4), 0));

  const pageRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  // Preload the PDF libraries while the page is idle so the first click is fast.
  const libsRef = useRef<Promise<[typeof import("html2canvas"), typeof import("jspdf")]> | null>(null);
  useEffect(() => {
    libsRef.current = Promise.all([import("html2canvas"), import("jspdf")]);
  }, []);
  const downloadPdf = async () => {
    if (!pageRef.current) return;
    setPdfBusy(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await (libsRef.current ?? Promise.all([import("html2canvas"), import("jspdf")]));
      const bg = getComputedStyle(document.body).backgroundColor;
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const M = 24, footer = 22, usable = H - M - footer;
      const paint = () => { pdf.setFillColor(bg); pdf.rect(0, 0, W, H, "F"); };
      const foot = () => {
        pdf.setFontSize(7); pdf.setTextColor(150);
        pdf.text("DRAFT — measured log data, pending geophysicist review. AI Smart Well Inc. · Maxxwell Production. Not a work order.", M, H - 10);
      };
      paint(); foot();
      let y = M;
      const blocks = Array.from(pageRef.current.children).filter((el) => !(el as HTMLElement).hasAttribute("data-pdf-skip")) as HTMLElement[];
      // Capture all blocks in parallel — the slowest part of the export.
      const canvases = await Promise.all(
        blocks.map((el) => html2canvas(el, { scale: 1.2, backgroundColor: bg, ignoreElements: (e) => e.hasAttribute("data-pdf-skip") }))
      );
      for (const c of canvases) {
        let w2 = W - 2 * M, h = (c.height * w2) / c.width;
        if (h > usable) { w2 *= usable / h; h = usable; }
        if (y + h > M + usable && y > M) { pdf.addPage(); paint(); foot(); y = M; }
        pdf.addImage(c.toDataURL("image/jpeg", 0.8), "JPEG", M, y, w2, h);
        y += h + 10;
      }
      const safe = (data?.well.well_name ?? "Well").replace(/[^A-Za-z0-9-]+/g, "_");
      pdf.save(`SGOM_${safe}_SPT_Slot_Plan_DRAFT.pdf`);
    } finally { setPdfBusy(false); }
  };

  const picker = (
    <div data-pdf-skip className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Well:</span>
      <input
        value={wellSearch} onChange={(e) => setWellSearch(e.target.value)}
        placeholder="Search name or API…"
        className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm"
      />
      <select
        value={selectedId ?? ""} onChange={(e) => setSelectedId(e.target.value)}
        className="h-9 max-w-xs rounded-md border border-input bg-background px-2 text-sm"
      >
        {filteredWells.map((w) => (
          <option key={w.id} value={w.id}>{w.well_name ?? "Unnamed"}{w.api_number ? ` · ${w.api_number}` : ""}</option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">{wellList?.length ?? 0} wells in your company</span>
    </div>
  );

  if (wellList && wellList.length === 0) return <div className="p-8 text-muted-foreground">No wells are available for your company.</div>;
  if (!selectedId || isLoading) return <div className="p-8 space-y-4">{wellList && picker}<div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading well records…</div></div>;
  if (error) return <div className="p-8 space-y-4">{picker}<div className="text-destructive">Failed to load well data: {(error as Error).message}</div></div>;
  if (!data) return <div className="p-8 space-y-4">{picker}<div className="text-muted-foreground">This well is not available for your company.</div></div>;

  const { well, logs, perfs, injectors, water } = data;
  const nearestInj = injectors[0];
  const hasPT = !!(water?.reservoir_pressure_psi && water?.pressure_datum_ft);
  const ptAt = (d: number) => ({
    p: pressureAtDepth(water?.reservoir_pressure_psi, water?.pressure_datum_ft, d),
    t: temperatureAtDepth(water?.bht_f, water?.bht_depth_ft, d, water?.surface_temp_f),
  });
  const depth = well.total_depth ?? 0;
  const pc = (p: Priority) => p === "Primary" ? "text-success border-success/40" : p === "Secondary" ? "text-primary border-primary/40" : "text-warning border-warning/40";
  const perfLabel = (p: CutInterval["perforated"]) => p === "none" ? "Not perforated — bypassed pay" : p === "partial" ? "Partly perforated" : "Already perforated";

  const screening = [
    { k: "Depth (TD)", v: `${depth.toLocaleString()} ft`, s: depth <= SPT_LIBRARY_MAX_FT ? `Within SPT case library (≈ ${SPT_LIBRARY_MAX_FT.toLocaleString()} ft)` : "Beyond SPT case library", r: depth <= SPT_LIBRARY_MAX_FT ? "pass" : "warn" },
    { k: "Composite log", v: `${logs.length} points, ${logs[0]?.measured_depth ?? "–"}–${logs[logs.length - 1]?.measured_depth ?? "–"} ft`, s: "Measured data on record", r: logs.length ? "pass" : "fail" },
    { k: "Pay intervals (log cutoffs)", v: `${intervals.length}`, s: `φ ≥ ${PHI_MIN}%, Sw ≤ ${SW_HIGH}%, GR ≤ ${GR_MAX} API`, r: intervals.length ? "pass" : "fail" },
    { k: "Bypassed pay (not perforated)", v: `${intervals.filter((i) => i.perforated === "none").length} interval(s)`, s: "Main SPT target", r: intervals.some((i) => i.perforated === "none") ? "pass" : "warn" },
    { k: "Fluid", v: well.well_type ?? "—", s: "Oil-risk permeability cutoff 1 mD applies", r: "pass" },
    hasPT
      ? { k: "Reservoir pressure", v: `${water!.reservoir_pressure_psi} psi @ ${water!.pressure_datum_ft} ft`, s: "From Injection & Water Salinity", r: "pass" }
      : { k: "Reservoir pressure", v: "TO CONFIRM", s: "Enter in Injection & Water Salinity", r: "warn" },
    nearestInj
      ? { k: "Nearest injection well", v: `${nearestInj.miles.toFixed(2)} mi (${Math.round(nearestInj.miles * 5280).toLocaleString()} ft)`, s: `${nearestInj.well_name ?? "Unnamed"} · ${nearestInj.well_type}`, r: nearestInj.miles < 0.25 ? "warn" : "pass" }
      : { k: "Nearest injection well", v: "None found", s: well.latitude == null ? "Well has no coordinates" : "No injection wells within ~50 mi in your records", r: "warn" },
  ];
  const rc = (r: string) => r === "pass" ? "text-success" : r === "warn" ? "text-warning" : "text-destructive";

  return (
    <div ref={pageRef} className="p-8 space-y-6">
      {picker}
      <div className="flex items-center justify-between gap-2 text-xs border border-warning/40 text-warning rounded-lg px-3 py-2">
        <span className="font-semibold">DRAFT — built from measured {well.well_name ?? "well"} logs; pending geophysicist review, not a field work order</span>
        <span className="text-muted-foreground">AI Smart Well Inc. · Maxxwell Production</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-primary/30">Stage 6 · SPT</Badge>
            <Badge variant="outline">{well.well_type ?? "OIL"}</Badge>
            <Badge variant="outline" className="text-success border-success/40">MEASURED DATA</Badge>
            <Badge variant="outline" className="text-warning border-warning/40">DRAFT</Badge>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scissors className="h-7 w-7 text-primary" />
            SPT Slot Cutting Plan — {well.well_name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {well.operator ?? "—"} · {well.county ?? "—"}, {well.state ?? "—"} · {well.formation ?? "—"} · TD {depth.toLocaleString()} ft · status {well.status ?? "—"}
          </p>
        </div>
        <Button data-pdf-skip onClick={downloadPdf} disabled={pdfBusy}>
          {pdfBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Download PDF
        </Button>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border/40 rounded-lg p-3">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        Pay intervals, porosity, Sw and perforation status come from the well's measured composite log and 1997 completion records.
        Slot density, width and phasing are SPT design defaults by priority — they must be confirmed by a geophysicist and the operator before field use.
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">SPT applicability screening</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/40"><th className="py-2 pr-4">Parameter</th><th className="py-2 pr-4">Value</th><th className="py-2">Assessment</th></tr></thead>
            <tbody>
              {screening.map((row) => (
                <tr key={row.k} className="border-b border-border/20">
                  <td className="py-2 pr-4 font-medium">{row.k}</td>
                  <td className={`py-2 pr-4 ${rc(row.r)}`}>{row.v}</td>
                  <td className="py-2 text-muted-foreground">{row.s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Injection wells nearby</CardTitle>
          <p className="text-xs text-muted-foreground">Classified from registry well type (INJ, SWD, Class II 2R/2D, EOR injectors). Straight-line distance from well coordinates; connectivity is not modelled.</p>
        </CardHeader>
        <CardContent>
          {injectors.length === 0 ? <p className="text-sm text-muted-foreground">No injection wells found within ~50 mi in your company records.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/40"><th className="py-2 pr-4">Well</th><th className="py-2 pr-4">API</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Status</th><th className="py-2">Distance</th></tr></thead>
              <tbody>{injectors.slice(0, 5).map((w) => (
                <tr key={w.id} className="border-b border-border/20">
                  <td className="py-2 pr-4">{w.well_name ?? "Unnamed"}</td><td className="py-2 pr-4">{w.api_number ?? "—"}</td>
                  <td className="py-2 pr-4">{w.well_type}</td><td className="py-2 pr-4">{w.status ?? "—"}</td>
                  <td className="py-2">{w.miles.toFixed(2)} mi · {Math.round(w.miles * 5280).toLocaleString()} ft</td>
                </tr>))}</tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Pressure &amp; temperature at SPT intervals</CardTitle>
          <p className="text-xs text-muted-foreground">Screening estimate from Injection &amp; Water Salinity inputs: linear pressure gradient (P ÷ datum depth) and linear geothermal gradient to the measured BHT.</p>
        </CardHeader>
        <CardContent>
          {!water || (!hasPT && !water.bht_f) ? <p className="text-sm text-muted-foreground">Enter reservoir pressure and bottom-hole temperature for this well in Injection &amp; Water Salinity.</p> : intervals.length === 0 ? <p className="text-sm text-muted-foreground">No pay intervals to evaluate.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/40"><th className="py-2 pr-4">Interval (ft)</th><th className="py-2 pr-4">Mid depth</th><th className="py-2 pr-4">Pressure (psi)</th><th className="py-2">Temperature (°F)</th></tr></thead>
              <tbody>{intervals.map((i) => { const mid = (i.top + i.bottom) / 2; const v = ptAt(mid); return (
                <tr key={i.top} className="border-b border-border/20">
                  <td className="py-2 pr-4">{i.top}–{i.bottom}</td><td className="py-2 pr-4">{mid.toFixed(0)}</td>
                  <td className="py-2 pr-4">{v.p != null ? v.p.toFixed(0) : "—"}</td><td className="py-2">{v.t != null ? v.t.toFixed(1) : "—"}</td>
                </tr>); })}</tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
            Slot cutting intervals (from measured log)
            <Badge variant="outline">Total ≈ {totalSlots.toLocaleString()} slots over ≈ {netPay} ft</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {intervals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interval passes the log cutoffs.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border/40">
                  <th className="py-2 pr-3">Interval (ft)</th><th className="py-2 pr-3">Priority</th>
                  <th className="py-2 pr-3">φ avg</th><th className="py-2 pr-3">Sw avg</th><th className="py-2 pr-3">GR avg</th><th className="py-2 pr-3">Rt avg</th>
                  <th className="py-2 pr-3">Completion</th><th className="py-2 pr-3">Slots/ft*</th><th className="py-2 pr-3">Width (in)*</th><th className="py-2">Phasing*</th>
                </tr>
              </thead>
              <tbody>
                {intervals.map((i) => (
                  <tr key={i.top} className="border-b border-border/20">
                    <td className="py-2 pr-3 font-medium">{i.top}–{i.bottom}</td>
                    <td className="py-2 pr-3"><Badge variant="outline" className={pc(i.priority)}>{i.priority}</Badge></td>
                    <td className="py-2 pr-3">{i.phi.toFixed(1)}%</td>
                    <td className="py-2 pr-3">{i.sw.toFixed(0)}%</td>
                    <td className="py-2 pr-3">{i.gr.toFixed(0)}</td>
                    <td className="py-2 pr-3">{i.rt.toFixed(0)} Ω·m</td>
                    <td className={`py-2 pr-3 ${i.perforated === "none" ? "text-success" : "text-muted-foreground"}`}>{perfLabel(i.perforated)}</td>
                    <td className="py-2 pr-3">{i.slotsPerFt}</td>
                    <td className="py-2 pr-3">{i.slotWidthIn}</td>
                    <td className="py-2">360°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-muted-foreground">
            * Design defaults by priority (Primary Sw ≤ 30%, Secondary ≤ 45%, Caution above). Slot length 12 in. To be confirmed.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            Wellbore schematic — how SPT is executed on this well
            <Badge variant="outline" className="text-warning border-warning/40">DRAFT</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">Planned slot intervals (right, colored by priority) against existing perforations (left) and TD. Depths from the measured log; slot geometry is a design default.</p>
        </CardHeader>
        <CardContent>
          {intervals.length === 0 && perfs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No intervals or perforations to draw.</p>
          ) : (
            <WellboreSchematic
              intervals={intervals}
              perfs={perfs}
              logTop={logs[0]?.measured_depth ?? 0}
              totalDepth={depth}
            />
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            Step-by-step SPT work sequence
            <Badge variant="outline" className="text-warning border-warning/40">DRAFT</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">Standard hydro-slotting sequence applied to this well's intervals, cut bottom-up. Durations are planning estimates; the engineered program is issued by the SPT service engineer.</p>
        </CardHeader>
        <CardContent>
          {intervals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pay intervals to plan.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3"><span className="shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span><div><span className="font-medium">Well preparation.</span> Kill the well, pull tubing and rods, run gauge ring and scraper to TD {depth.toLocaleString()} ft, circulate clean fluid. Confirm casing ID and cement quality across target intervals (CBL — see cement bond section).</div></li>
              <li className="flex gap-3"><span className="shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span><div><span className="font-medium">Run in hole with the hydro-slotting tool.</span> RIH on tubing to the deepest interval, {intervals[intervals.length - 1].top}–{intervals[intervals.length - 1].bottom} ft. Depth tie-in with GR/CCL correlation log.</div></li>
              {intervals.map((i, idx) => (
                <li key={i.top} className="flex gap-3">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{idx + 3}</span>
                  <div>
                    <span className="font-medium">Cut interval {i.top}–{i.bottom} ft</span>
                    <Badge variant="outline" className={`ml-2 ${pc(i.priority)}`}>{i.priority}</Badge>
                    <span className="text-muted-foreground"> — ≈ {Math.round(Math.max(i.bottom - i.top, 2) * i.slotsPerFt).toLocaleString()} slots ({i.slotsPerFt}/ft, {i.slotWidthIn} in wide, 12 in long, 360° phasing). Abrasive jet cutting at design pump pressure; monitor returns for sand and fluid. {i.perforated === "none" ? "Interval is not perforated — bypassed pay, main target." : "Interval already has perforations — slots restore inflow."}</span>
                  </div>
                </li>
              ))}
              <li className="flex gap-3"><span className="shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{intervals.length + 3}</span><div><span className="font-medium">Flush and pull out of hole.</span> Circulate cuttings out, POOH with the tool, run final gauge ring.</div></li>
              <li className="flex gap-3"><span className="shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{intervals.length + 4}</span><div><span className="font-medium">Completion and flow-back.</span> Run production tubing, swab/flow the well, measure initial rate — this is the actual q<sub>oil</sub> the platform compares against the SPT prediction (Stage 6 calibration loop).</div></li>
            </ol>
          )}
          <p className="text-xs text-muted-foreground mt-4">Cutting order is bottom-up so debris never covers an uncut interval. Safety and emergency procedures follow the operator HSE plan (see Technical Project section below).</p>
        </CardContent>
      </Card>

      <CementBondCard intervals={intervals} />


      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Existing perforations (completion record)</CardTitle></CardHeader>
        <CardContent>
          {perfs.length === 0 ? <p className="text-sm text-muted-foreground">No perforations on record.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/40"><th className="py-2 pr-3">Interval (ft)</th><th className="py-2 pr-3">SPF</th><th className="py-2 pr-3">Phasing</th><th className="py-2 pr-3">Status</th><th className="py-2">Source</th></tr></thead>
              <tbody>
                {perfs.map((p) => (
                  <tr key={p.depth_from} className="border-b border-border/20">
                    <td className="py-2 pr-3 font-medium">{p.depth_from}–{p.depth_to}</td>
                    <td className="py-2 pr-3">{p.shots_per_foot ?? "—"}</td>
                    <td className="py-2 pr-3">{p.phasing != null ? `${p.phasing}°` : "—"}</td>
                    <td className="py-2 pr-3">{p.status ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{p.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Open items before field use</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>Reservoir pressure, BHT and current water cut — not in the well record.</li>
            <li>Casing size, weight and cement quality across the target intervals.</li>
            <li>Geophysicist review of pay picks and Sw (Preliminary Verdicts workflow).</li>
            <li>Operator confirmation of slot geometry and cutting order (bottom-up).</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Collect / purchase / sorting / processing of necessary information</CardTitle>
          <p className="text-xs text-muted-foreground">Input data package for HSP re-completion. Status shows how SGOM handles each item: Analyzed (used in calculations), Stored (kept as a record or document for the specialist), Not yet (not supported).</p>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          {([
            ["a", "Well operation / exploitation history (production data)", [
              ["Monthly / daily inflow of oil, gas and water", "Analyzed", "Production history — Stage 4 decline analysis."],
              ["Productive and non-productive days per month", "Analyzed", "Days-on field in production history."],
              ["Start and end (maximum and minimum) rate", "Analyzed", "Derived from production history."],
              ["Tubing / formation pressure", hasPT ? "Analyzed" : "Stored", "Injection & Water Salinity — pressure and temperature at SPT intervals."],
              ["Extent of production decline", "Analyzed", "Stage 4 Arps decline."],
              ["Stops and transitions to next productive intervals", "Stored", "Recorded in perforation status and notes."],
            ]],
            ["b", "All possible logging (logs)", [
              ["Induction (electric) log", "Analyzed", "Resistivity — Stage 8 petrophysics."],
              ["Neutron and gamma-ray", "Analyzed", "GR, neutron porosity — Stage 8."],
              ["Acoustic (casing / cement) log", "Stored", "Document Vault; cement status entered in Casing Program."],
              ["Mud-log, chat-log", "Stored", "Document Vault only."],
            ]],
            ["c", "Well information / documentation", [
              ["Design / construction (depths, casing OD/ID)", "Stored", "Casing Program page."],
              ["Opened productive intervals", "Analyzed", "Perforation records above."],
              ["Techniques of opening productive formations", "Stored", "Perforation and casing notes."],
              ["Hydraulic fracturing, chemical treatment, stimulation", "Stored", "Document Vault / notes."],
              ["Previous closing and transitions to new intervals", "Stored", "Perforation status."],
              ["Packers, retainers, cementation, insulation", "Stored", "Casing Program notes."],
            ]],
            ["d", "All possible test results", [
              ["Oil", "Stored", "Document Vault."],
              ["Gas (incl. H2S / CO2)", "Stored", "Injection & Water Salinity form; not in numeric verdict."],
              ["Water (salinity)", "Analyzed", "Formation / injection TDS — Stage 6 and Stage 8."],
              ["Pressure", "Stored", "Reservoir Pressure module."],
            ]],
            ["e", "Well position map (preferably with altitude)", [
              ["Distance to neighboring oil wells", "Analyzed", "Nearby wells search and reserves map."],
              ["Distance to nearest injection wells", "Analyzed", nearestInj ? `Nearest: ${nearestInj.well_name ?? "Unnamed"} at ${nearestInj.miles.toFixed(2)} mi (registry well type).` : "Classified from registry well type; none found nearby in your records."],
            ]],
            ["f", "Core analysis, lithology (core)", [
              ["Core analysis", "Analyzed", "Stage 3 Core Analysis."],
              ["Rock sample pictures", "Analyzed", "Stage 3 computer-vision analysis."],
              ["Previous geology, lithology, core analysis", "Stored", "Document Vault."],
            ]],
          ] as [string, string, [string, string, string][]][]).map(([key, title, items]) => (
            <div key={key} className="space-y-2">
              <h3 className="font-semibold"><span className="text-primary mr-2">{key}</span>{title}</h3>
              <table className="w-full">
                <tbody>
                  {items.map(([item, status, note]) => (
                    <tr key={item} className="border-b border-border/20 align-top">
                      <td className="py-2 pr-3 w-2/5">{item}</td>
                      <td className="py-2 pr-3 w-24"><Badge variant="outline" className={status === "Analyzed" ? "text-primary border-primary/40" : status === "Not yet" ? "text-destructive border-destructive/40" : "text-muted-foreground"}>{status}</Badge></td>
                      <td className="py-2 text-muted-foreground">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Technical Project — Cut Program, specification, schedule</CardTitle>
          <p className="text-xs text-muted-foreground">Structure of the full HSP re-completion package. Status shows what this page provides today; remaining items are prepared by the SPT service engineer and operator.</p>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          {([
            ["a", "Calculation of technological parameters for HSP re-completion", [
              ["Initial data", "Partial", "Log, perforations and TD from the well record; pressure, BHT and casing still required."],
              ["Calculation of technological parameters", "Pending", "Performed by SPT service engineer."],
              ["Results of calculation", "Pending", "Issued with the engineered program."],
            ]],
            ["b", "Technical parameters", [
              ["Flow control valve", "Pending", "Service company specification."],
              ["Pressure – temperature – cutting speed dependence", "Pending", "Requires measured BHP/BHT."],
              ["Nozzles, erosion, rate, connections", "Pending", "Service company specification."],
              ["Surface equipment scheme", "Pending", "Service company specification."],
              ["Hydro-slotting perforation process graph", "Pending", "Issued with the engineered program."],
            ]],
            ["c", "Hydro-slotting perforation program", [
              ["Preparation for slot perforation process", "Pending", "Operator / service company."],
              ["HSP process", "Draft", "Candidate intervals and cutting order above (DRAFT)."],
              ["Start – ending of HSP process", "Pending", "Field procedure."],
              ["Possible violations of HSP process", "Pending", "Field procedure."],
              ["HSP technical schedule", "Pending", "Field procedure."],
            ]],
            ["d", "Safety and operational requirements", [
              ["Emergency medical response procedure", "Operator", "Operator HSE plan."],
              ["Fire emergency procedure", "Operator", "Operator HSE plan."],
              ["Spill or release procedure", "Operator", "Operator HSE plan."],
              ["H2S emergency procedure", "Operator", "Operator HSE plan; H2S value can be recorded in Injection & Water Salinity."],
              ["Emergency response for storm", "Operator", "Operator HSE plan."],
              ["Response to a bomb threat", "Operator", "Operator HSE plan."],
              ["Emergency medical information forms", "Operator", "Operator HSE plan."],
            ]],
          ] as [string, string, [string, string, string][]][]).map(([key, title, items]) => (
            <div key={key} className="space-y-2">
              <h3 className="font-semibold"><span className="text-primary mr-2">{key}</span>{title}</h3>
              <table className="w-full">
                <tbody>
                  {items.map(([item, status, note]) => (
                    <tr key={item} className="border-b border-border/20 align-top">
                      <td className="py-2 pr-3 w-2/5">{item}</td>
                      <td className="py-2 pr-3 w-24"><Badge variant="outline" className={status === "Draft" || status === "Partial" ? "text-warning border-warning/40" : "text-muted-foreground"}>{status}</Badge></td>
                      <td className="py-2 text-muted-foreground">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">How SPT slotting works (illustrative drawings)</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          {[
            [blueprintLiner, "Slotted liner — vertical slots cut through the pipe wall, 360° phasing."],
            [blueprintInflow, "Inflow through slots — reservoir fluid enters the wellbore through the cut slots."],
            [blueprintBeforeAfter, "Before / after — blocked perforations vs. open slot inflow after SPT."],
          ].map(([src, cap]) => (
            <figure key={cap} className="space-y-2">
              <img src={src} alt={cap} loading="lazy" width={1536} height={1024} className="rounded-lg border border-border/40 w-full" />
              <figcaption className="text-xs text-muted-foreground">{cap}</figcaption>
            </figure>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SPTSlotPlan;
