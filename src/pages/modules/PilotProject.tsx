import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Briefcase, CheckCircle2, Circle, Download, Loader2, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import type { WellLogPoint } from "@/hooks/useWellLogs";
import { parseLAS, mapLasToWellLogs } from "@/lib/las-parser";
import { auditLog, qcLabel, type LogQc } from "@/lib/log-qc-audit";
import { correlate, pickSands, flagLabel, distanceKm, tieReliability, tieLabel, type Correlation } from "@/lib/well-correlation";
import { sptScreening, wellVerdictLabel } from "@/lib/spt-sandbox-verdict";
import { rankFromLogs, fluidOf, type LogRankResult } from "@/lib/spt-log-ranking";
import { downloadReportPdf } from "@/lib/report-pdf";
import { CorrelationMap } from "@/components/pilot/CorrelationMap";
import { CompositeLogPanel } from "@/components/pilot/CompositeLogPanel";

const MAX = 10;
const STORE = "sgom.pilotProject.wells";
interface W { id: string; company_id: string; well_name: string | null; api_number: string | null; total_depth: number | null; well_type: string | null; water_cut: number | null; production_oil: number | null; production_gas: number | null }
interface Water { well_id: string; reservoir_pressure_psi: number | null; bht_f: number | null; rw_formation: number | null; rw_injection: number | null; injection_share_pct: number | null }

async function loadWells(): Promise<W[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in");
  const { data: m, error } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id);
  if (error) throw error;
  const ids = (m ?? []).map(x => x.company_id);
  if (!ids.length) return [];
  const all: W[] = [];
  for (let o = 0; ; o += 1000) {
    const { data, error: e } = await supabase.from("wells").select("id, company_id, well_name, api_number, total_depth, well_type, water_cut, production_oil, production_gas, latitude, longitude, altitude_ft").in("company_id", ids).order("well_name").order("id").range(o, o + 999);
    if (e) throw e;
    all.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return all;
}

async function loadPilotData(wells: W[]) {
  const ids = wells.map(w => w.id);
  const logs: Record<string, WellLogPoint[]> = {};
  ids.forEach(id => (logs[id] = []));
  for (let o = 0; ; o += 1000) {
    const { data, error } = await supabase.from("well_logs").select("well_id, measured_depth, gamma_ray, resistivity, porosity, water_saturation, sp, density, neutron_porosity, source").in("well_id", ids).order("well_id").order("measured_depth").range(o, o + 999);
    if (error) throw error;
    (data ?? []).forEach(r => logs[r.well_id]?.push(r));
    if ((data ?? []).length < 1000) break;
  }
  const { data: water, error } = await supabase.from("well_water_inputs").select("well_id, reservoir_pressure_psi, bht_f, rw_formation, rw_injection, injection_share_pct").in("well_id", ids);
  if (error) throw error;
  const waterBy: Record<string, Water> = {};
  (water ?? []).forEach(r => (waterBy[r.well_id] = r));
  return { logs, water: waterBy };
}

const Step = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`flex items-center gap-1 text-xs ${ok ? "text-primary" : "text-muted-foreground"}`}>{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}{label}</span>
);

export default function PilotProject() {
  const qc = useQueryClient();
  const { role } = useUserRole();
  const canEdit = role === "admin" || role === "engineer";
  const [selected, setSelected] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; } });
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  useEffect(() => localStorage.setItem(STORE, JSON.stringify(selected)), [selected]);

  const wellsQ = useQuery({ queryKey: ["pilot-wells"], queryFn: loadWells });
  const pilotWells = useMemo(() => (wellsQ.data ?? []).filter(w => selected.includes(w.id)), [wellsQ.data, selected]);
  const dataQ = useQuery({ queryKey: ["pilot-data", pilotWells.map(w => w.id).join(",")], queryFn: () => loadPilotData(pilotWells), enabled: pilotWells.length > 0 });

  const rows = useMemo(() => pilotWells.map(w => {
    const logs = dataQ.data?.logs[w.id] ?? [];
    const water = dataQ.data?.water[w.id] ?? null;
    const audit: LogQc = auditLog(logs);
    const conditions = water?.reservoir_pressure_psi != null && water?.bht_f != null && w.water_cut != null;
    const rank: LogRankResult | null = logs.length ? rankFromLogs(logs, water, fluidOf(w.well_type)) : null;
    const screen = sptScreening(w);
    return { w, logs, water, audit, conditions, rank, screen, hasGr: logs.some(l => l.gamma_ray != null) };
  }), [pilotWells, dataQ.data]);

  const corr: Correlation | null = useMemo(() => {
    const withGr = rows.filter(r => r.hasGr);
    if (withGr.length < 2) return null;
    return correlate(withGr.map(r => pickSands(r.w.id, r.w.well_name ?? r.w.api_number ?? r.w.id, r.logs.filter(l => l.gamma_ray != null).map(l => ({ depth: l.measured_depth, gr: l.gamma_ray! })))));
  }, [rows]);

  const done = rows.reduce((a, r) => a + (r.audit.grade !== "no_data" ? 1 : 0) + (r.conditions ? 1 : 0) + (corr && r.hasGr ? 1 : 0), 0);
  const total = rows.length * 3 + (rows.length ? 1 : 0);
  const progress = total ? Math.round(((done + (corr ? 1 : 0)) / total) * 100) : 0;

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length >= MAX ? (toast.error(`Pilot is limited to ${MAX} wells`), s) : [...s, id]);

  const uploadLas = async (w: W, file?: File) => {
    if (!file) return;
    setBusy(w.id);
    try {
      const las = parseLAS(await file.text());
      const lasApi = (las.header.api_number ?? "").replace(/\D/g, "");
      const wellApi = (w.api_number ?? "").replace(/\D/g, "");
      if (lasApi && wellApi && !lasApi.startsWith(wellApi.slice(0, 10)) && !wellApi.startsWith(lasApi.slice(0, 10))) throw new Error(`LAS API ${las.header.api_number} does not match well API ${w.api_number}`);
      const depthUnit = (las.curves[0]?.unit ?? "").toUpperCase();
      const k = depthUnit === "M" || depthUnit === "METERS" ? 3.28084 : 1;
      const mapped = mapLasToWellLogs(las).map(r => ({ ...r, measured_depth: +(r.measured_depth * k).toFixed(2) }));
      if (mapped.length < 10) throw new Error("LAS file has fewer than 10 depth samples");
      const curves = ["gamma_ray", "resistivity", "porosity", "density", "neutron_porosity"].filter(c => mapped.some(r => (r as any)[c] != null));
      if (!confirm(`${file.name}\n${mapped.length} samples, ${mapped[0].measured_depth}–${mapped.at(-1)!.measured_depth} ft${k !== 1 ? " (converted from m)" : ""}\nCurves: ${curves.join(", ") || "none mapped"}\n\nReplace the log record of ${w.well_name ?? w.api_number} in this depth range?`)) return;
      const depths = mapped.map(r => r.measured_depth);
      // One transaction: old samples in the range are replaced only if every new sample is written.
      const { error } = await supabase.rpc("replace_well_logs", { p_well_id: w.id, p_top: Math.min(...depths), p_base: Math.max(...depths), p_rows: mapped as any });
      if (error) throw new Error(`nothing was changed — ${error.message}`);
      toast.success(`Saved ${mapped.length} log samples for ${w.well_name ?? w.api_number}`);
      qc.invalidateQueries({ queryKey: ["pilot-data"] });
    } catch (e: any) {
      toast.error(`LAS import failed: ${e.message}`);
    } finally { setBusy(null); }
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setPdfBusy(true);
    try { await downloadReportPdf(reportRef.current, "SGOM Pilot Project Report", `SGOM_Pilot_Report_${new Date().toISOString().slice(0, 10)}.pdf`, "SGOM · AI Smart Well Inc. · PRELIMINARY — not an expert-signed opinion"); }
    catch (e: any) { toast.error(`PDF failed: ${e.message}`); }
    finally { setPdfBusy(false); }
  };

  const candidates = (wellsQ.data ?? []).filter(w => !filter || `${w.well_name} ${w.api_number}`.toLowerCase().includes(filter.toLowerCase())).slice(0, 200);
  const name = (w: W) => w.well_name ?? w.api_number ?? w.id.slice(0, 8);
  const fmt = (v: number | null | undefined, d = 0) => v == null ? "—" : v.toFixed(d);

  return (
    <div className="space-y-6 p-6">
      <div>
        <Badge variant="outline" className="mb-2">Stage 2 · Stage 6 · Stage 8</Badge>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Briefcase className="h-6 w-6 text-primary" />Pilot Project</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">Batch pilot for up to {MAX} wells: LAS intake, Maxxwell CONDITIONS intake, horizon correlation and a consolidated report. All verdicts are PRELIMINARY screening results; expert sign-off is a separate service.</p>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">1 · Pilot wells ({selected.length}/{MAX})</h2>
          <Input placeholder="Filter by name or API…" value={filter} onChange={e => setFilter(e.target.value)} className="max-w-xs" />
        </div>
        {wellsQ.isLoading ? <p className="text-sm text-muted-foreground">Loading company wells…</p> : (
          <div className="max-h-48 overflow-y-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {candidates.map(w => (
              <label key={w.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer"><Checkbox checked={selected.includes(w.id)} onCheckedChange={() => toggle(w.id)} /><span className="truncate">{name(w)}</span><span className="text-xs text-muted-foreground font-mono">{w.api_number}</span></label>
            ))}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold">2 · Project status</h2>
            <div className="flex gap-2">
              <Button variant="outline" asChild><Link to="/dashboard/maxxwell-import"><Upload className="h-4 w-4 mr-2" />CONDITIONS intake (Maxxwell CSV)</Link></Button>
              <Button onClick={exportPdf} disabled={pdfBusy || dataQ.isLoading}>{pdfBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Consolidated report PDF</Button>
            </div>
          </div>
          <div className="flex items-center gap-3"><Progress value={progress} className="h-2" /><span className="text-sm text-muted-foreground w-12">{progress}%</span></div>
          {dataQ.isLoading && <p className="text-sm text-muted-foreground">Loading logs and conditions…</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-left"><tr><th className="py-2">Well</th><th>LAS</th><th>Data audit</th><th>CONDITIONS</th><th>Correlation</th><th>Verdict</th><th /></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.w.id} className="border-t border-border">
                    <td className="py-2"><div>{name(r.w)}</div><div className="text-xs text-muted-foreground font-mono">{r.w.api_number}</div></td>
                    <td><Step ok={r.audit.grade !== "no_data"} label={r.audit.samples ? `${r.audit.samples} samples` : "Missing"} /></td>
                    <td><Badge variant={r.audit.grade === "pass" ? "default" : r.audit.grade === "fail" ? "destructive" : "secondary"}>{qcLabel[r.audit.grade]}</Badge></td>
                    <td><Step ok={r.conditions} label={r.conditions ? "P, T, water cut" : "Incomplete"} /></td>
                    <td><Step ok={!!corr && r.hasGr} label={r.hasGr ? (corr ? "Included" : "Needs ≥2 GR wells") : "No GR"} /></td>
                    <td className="text-xs">{wellVerdictLabel(r.screen.verdict)}{r.rank && <div className="text-muted-foreground">Log score {r.rank.score}/100</div>}</td>
                    <td className="text-right">
                      <Button size="sm" variant="outline" disabled={!canEdit || busy === r.w.id} asChild={canEdit && busy !== r.w.id}>
                        {canEdit && busy !== r.w.id ? <label className="cursor-pointer"><Upload className="h-3.5 w-3.5 mr-1" />LAS<input type="file" accept=".las,.LAS,.txt" className="hidden" onChange={e => { uploadLas(r.w, e.target.files?.[0]); e.target.value = ""; }} /></label> : <span>{busy === r.w.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "LAS"}</span>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!canEdit && <p className="text-xs text-muted-foreground">Only admin or engineer roles can upload LAS files.</p>}
          <p className="text-xs text-muted-foreground">CONDITIONS = reservoir pressure, bottom-hole temperature and water cut, imported for all pilot wells in one Maxxwell CSV.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div ref={reportRef} className="bg-background text-foreground space-y-4 rounded-xl">
          <section className="glass-card rounded-xl p-6 space-y-2">
            <Badge variant="outline">PRELIMINARY</Badge>
            <h2 className="text-xl font-semibold">SGOM Pilot Project Report — {rows.length} wells</h2>
            <p className="text-sm text-muted-foreground">Generated {new Date().toISOString().slice(0, 10)}. Scope: LAS intake and geologger data audit, Maxxwell CONDITIONS, horizon correlation, petrophysical log ranking (Stage 8 solver), SPT screening (Stage 6). Verdicts are automated screening results and require expert confirmation before field decisions.</p>
            <div className="grid grid-cols-4 gap-3 pt-2 text-sm">
              <div><div className="text-muted-foreground text-xs">LAS received</div>{rows.filter(r => r.audit.grade !== "no_data").length}/{rows.length}</div>
              <div><div className="text-muted-foreground text-xs">Audit pass</div>{rows.filter(r => r.audit.grade === "pass").length}/{rows.length}</div>
              <div><div className="text-muted-foreground text-xs">CONDITIONS complete</div>{rows.filter(r => r.conditions).length}/{rows.length}</div>
              <div><div className="text-muted-foreground text-xs">SPT candidates</div>{rows.filter(r => r.screen.verdict === "candidate").length}/{rows.length}</div>
            </div>
          </section>

          <section className="glass-card rounded-xl p-6 space-y-2">
            <h3 className="font-semibold">Verdict table</h3>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground text-left"><tr><th className="py-1">Well</th><th>API</th><th>TD, ft</th><th>Water cut</th><th>Net pay, ft</th><th>φ, %</th><th>k, mD</th><th>Sw, %</th><th>Log score</th><th>Verdict</th><th>Data gaps</th></tr></thead>
              <tbody>{rows.map(r => (
                <tr key={r.w.id} className="border-t border-border"><td className="py-1">{name(r.w)}</td><td className="font-mono">{r.w.api_number ?? "—"}</td><td>{fmt(r.w.total_depth)}</td><td>{r.w.water_cut != null ? `${r.w.water_cut}%` : "—"}</td><td>{fmt(r.rank?.netPay, 1)}</td><td>{fmt(r.rank?.avgPor, 1)}</td><td>{fmt(r.rank?.avgK, 2)}</td><td>{fmt(r.rank?.avgSw, 0)}</td><td>{r.rank ? r.rank.score : "—"}</td><td>{wellVerdictLabel(r.screen.verdict)} ({r.screen.confidence})</td><td>{[...r.screen.missing_data, ...(r.audit.grade === "no_data" ? ["LAS"] : []), ...(r.conditions ? [] : ["CONDITIONS"])].join(", ") || "—"}</td></tr>
              ))}</tbody>
            </table>
          </section>

          <section className="glass-card rounded-xl p-6 space-y-2">
            <h3 className="font-semibold">Geologger data audit</h3>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground text-left"><tr><th className="py-1">Well</th><th>Grade</th><th>Interval, ft</th><th>Step, ft</th><th>GR / RES / POR / RHOB / NPHI coverage, %</th><th>Gaps</th><th>Findings</th></tr></thead>
              <tbody>{rows.map(r => (
                <tr key={r.w.id} className="border-t border-border align-top"><td className="py-1">{name(r.w)}</td><td>{qcLabel[r.audit.grade]}</td><td>{r.audit.top != null ? `${fmt(r.audit.top)}–${fmt(r.audit.base)}` : "—"}</td><td>{r.audit.stepFt ?? "—"}</td><td>{r.audit.curves.map(c => c.coveragePct).join(" / ") || "—"}</td><td>{r.audit.gaps}</td><td>{r.audit.issues.join("; ") || "No issues found"}</td></tr>
              ))}</tbody>
            </table>
            <p className="text-xs text-muted-foreground">Automated QC: curve coverage, physical range, flat-line runs, sampling regularity and depth gaps. VDL, tool calibration records and repeat sections require review by a log analyst.</p>
          </section>

          <section className="glass-card rounded-xl p-6 space-y-2">
            <h3 className="font-semibold">Horizon correlation panel</h3>
            {!corr ? <p className="text-sm text-muted-foreground">Correlation and the correlation map need gamma-ray logs in at least two pilot wells (with coordinates for the map).</p> : (
              <>
                <CorrelationMap corr={corr} wells={rows.map(r => ({ id: r.w.id, latitude: (r.w as any).latitude ?? null, longitude: (r.w as any).longitude ?? null }))} />

                <table className="w-full text-xs">
                  <thead className="text-muted-foreground text-left"><tr><th className="py-1">Unit</th><th>Ref. top–base, ft</th>{corr.wells.map(w => <th key={w.wellId}>{w.name}{w.wellId === corr.referenceId ? " (ref)" : ""}</th>)}</tr></thead>
                  <tbody>{corr.units.map(u => (
                    <tr key={u.id} className="border-t border-border"><td className="py-1">{u.id}</td><td>{fmt(u.refTop)}–{fmt(u.refBase)}</td>{corr.wells.map(w => { const c = u.cells[w.wellId]; return <td key={w.wellId} className={c?.flag === "ok" ? "" : "text-muted-foreground"}>{c?.sand ? `${fmt(c.sand.top)} (${c.sand.thickness} ft)` : "—"}{c && c.flag !== "ok" && <div className="text-[10px]">{flagLabel[c.flag]}</div>}</td>; })}</tr>
                  ))}</tbody>
                </table>
                {(() => { const ref = rows.find(r => r.w.id === corr.referenceId)?.w as any; return (
                  <table className="w-full text-xs mt-2">
                    <thead className="text-muted-foreground text-left"><tr><th className="py-1">Well</th><th>Distance to reference</th><th>Tie reliability</th></tr></thead>
                    <tbody>{corr.wells.filter(w => w.wellId !== corr.referenceId).map(w => { const ww = rows.find(r => r.w.id === w.wellId)?.w as any; const km = ref?.latitude != null && ref?.longitude != null && ww?.latitude != null && ww?.longitude != null ? distanceKm(+ref.latitude, +ref.longitude, +ww.latitude, +ww.longitude) : null; return (
                      <tr key={w.wellId} className="border-t border-border"><td className="py-1">{w.name}</td><td>{km == null ? "—" : `${km.toFixed(2)} km (${Math.round(km * 3280.84).toLocaleString()} ft)`}</td><td>{tieLabel[tieReliability(km)]}</td></tr>); })}</tbody>
                  </table>); })()}
                <p className="text-xs text-muted-foreground">Spacing thresholds (≤0.5 km reliable, ≤3 km check offsets, &gt;3 km tentative) are a screening heuristic from well coordinates.</p>
                <p className="text-xs text-muted-foreground">Candidate sand units auto-picked from GR and matched by depth to the reference well. No formation names are assigned; faults and pinch-outs must be confirmed by a geophysicist.</p>
              </>
            )}
          </section>

          <section className="glass-card rounded-xl p-6 space-y-2">
            <h3 className="font-semibold">Well spacing (location map data)</h3>
            <p className="text-xs text-muted-foreground">Distances from each pilot well to the nearest producing and nearest injection well of your company, computed from stored coordinates (WGS84).</p>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground text-left"><tr><th className="py-1">Well</th><th>Altitude, ft</th><th>Nearest producer</th><th>Nearest injector</th></tr></thead>
              <tbody>{rows.map(r => {
                const w = r.w as any;
                const others = (wellsQ.data ?? []).filter(o => o.id !== w.id && (o as any).latitude != null && (o as any).longitude != null);
                const dist = (o: any) => w.latitude != null && w.longitude != null ? distanceKm(+w.latitude, +w.longitude, +o.latitude, +o.longitude) : null;
                const isInj = (o: W) => /inject/i.test(o.well_type ?? "");
                const nearest = (list: W[]) => list.map(o => ({ o, km: dist(o) })).filter(x => x.km != null).sort((a, b) => a.km! - b.km!)[0] ?? null;
                const prod = nearest(others.filter(o => !isInj(o)));
                const inj = nearest(others.filter(isInj));
                const cell = (x: { o: W; km: number | null } | null) => x == null ? "—" : `${x.o.well_name ?? x.o.api_number ?? x.o.id} · ${x.km!.toFixed(2)} km (${Math.round(x.km! * 3280.84).toLocaleString()} ft)`;
                return (
                  <tr key={w.id} className="border-t border-border"><td className="py-1">{name(r.w)}</td><td>{w.altitude_ft != null ? fmt(w.altitude_ft, 0) : "—"}</td><td>{w.latitude != null ? cell(prod) : "no coordinates"}</td><td>{w.latitude != null ? cell(inj) : "no coordinates"}</td></tr>);
              })}</tbody>
            </table>
            <p className="text-xs text-muted-foreground">Injector wells are identified by the well type field; wells without coordinates are skipped. Altitude is the wellhead elevation above sea level, entered manually in Data Import from the client location map.</p>
          </section>

          {rows.map(r => (
            <section key={r.w.id} className="glass-card rounded-xl p-6 space-y-2">
              <h3 className="font-semibold">{name(r.w)} <span className="text-xs text-muted-foreground font-mono">{r.w.api_number}</span></h3>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div><div className="text-muted-foreground">Verdict</div>{wellVerdictLabel(r.screen.verdict)} · confidence {r.screen.confidence}</div>
                <div><div className="text-muted-foreground">Reservoir pressure / BHT</div>{r.water?.reservoir_pressure_psi != null ? `${r.water.reservoir_pressure_psi} psi` : "—"} / {r.water?.bht_f != null ? `${r.water.bht_f} °F` : "—"}</div>
                <div><div className="text-muted-foreground">Net pay / missed pay</div>{fmt(r.rank?.netPay, 1)} / {fmt(r.rank?.missedPay, 1)} ft</div>
                <div><div className="text-muted-foreground">Data audit</div>{qcLabel[r.audit.grade]}</div>
              </div>
              <CompositeLogPanel logs={r.logs} rank={r.rank} title={name(r.w)} />
              {r.rank && r.rank.intervals.length > 0 && (
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground text-left"><tr><th className="py-1">Reservoir interval, ft</th><th>h, ft</th><th>φ, %</th><th>k, mD</th><th>Sw, %</th></tr></thead>
                  <tbody>{r.rank.intervals.slice(0, 8).map((i, n) => <tr key={n} className="border-t border-border"><td className="py-1">{fmt(i.top)}–{fmt(i.bottom)}</td><td>{fmt(i.thickness, 1)}</td><td>{fmt(i.avgPor, 1)}</td><td>{fmt(i.timurPermMd, 2)}</td><td>{fmt(i.archieSwCalc ?? i.avgSw, 0)}</td></tr>)}</tbody>
                </table>
              )}
              <ul className="text-xs space-y-0.5">
                {r.screen.factors_for.map(f => <li key={f} className="flex gap-1"><CheckCircle2 className="h-3 w-3 mt-0.5 text-primary shrink-0" />{f}</li>)}
                {r.screen.risks.map(f => <li key={f} className="flex gap-1"><AlertTriangle className="h-3 w-3 mt-0.5 text-destructive shrink-0" />{f}</li>)}
                {r.rank && r.rank.riskIntervals.length > 0 && <li className="flex gap-1"><AlertTriangle className="h-3 w-3 mt-0.5 text-destructive shrink-0" />{r.rank.riskIntervals.length} reservoir interval(s) with Sw ≥ 60% or k below {r.rank.kCutoff} mD</li>}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
