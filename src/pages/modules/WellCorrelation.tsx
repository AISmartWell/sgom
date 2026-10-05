import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { GitCompareArrows, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { correlate, flagLabel, pickSands, type CellFlag, type Correlation } from "@/lib/well-correlation";
import { downloadReportPdf } from "@/lib/report-pdf";

const MAX_WELLS = 10;
interface W { id: string; well_name: string | null; api_number: string | null; total_depth: number | null }

async function loadWells(): Promise<W[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in");
  const { data: m, error } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id);
  if (error) throw error;
  const ids = (m ?? []).map(x => x.company_id);
  if (!ids.length) return [];
  const all: W[] = [];
  for (let o = 0; ; o += 1000) {
    const { data, error: e } = await supabase.from("wells").select("id, well_name, api_number, total_depth").in("company_id", ids).order("well_name").order("id").range(o, o + 999);
    if (e) throw e;
    all.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return all;
}

async function loadLogs(ids: string[]) {
  const rows: { well_id: string; measured_depth: number; gamma_ray: number | null }[] = [];
  for (let o = 0; ; o += 1000) {
    const { data, error } = await supabase.from("well_logs").select("well_id, measured_depth, gamma_ray").in("well_id", ids).not("gamma_ray", "is", null).order("well_id").order("measured_depth").range(o, o + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return rows;
}

const flagClass: Record<CellFlag, string> = {
  ok: "text-foreground", missing: "text-destructive font-semibold", offset: "text-warning font-semibold",
  thinning: "text-warning", no_coverage: "text-muted-foreground",
};

function CrossSection({ c }: { c: Correlation }) {
  const wells = c.wells;
  const depths = wells.flatMap(w => w.points.map(p => p.depth));
  if (!depths.length) return <p className="text-sm text-muted-foreground">No gamma-ray logs for the selected wells.</p>;
  const dMin = Math.min(...depths), dMax = Math.max(...depths);
  const H = 520, top = 30, colW = 120, gap = 50, left = 60;
  const W = left + wells.length * (colW + gap);
  const y = (d: number) => top + ((d - dMin) / Math.max(1, dMax - dMin)) * (H - top - 10);
  const x0 = (i: number) => left + i * (colW + gap);
  const ticks = Array.from({ length: 6 }, (_, i) => dMin + (i * (dMax - dMin)) / 5);
  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} className="text-muted-foreground" role="img" aria-label="Correlation cross-section">
        {ticks.map(t => (<g key={t}><line x1={left - 5} x2={W} y1={y(t)} y2={y(t)} stroke="hsl(var(--border))" strokeDasharray="2 4" /><text x={4} y={y(t) + 4} fontSize={10} fill="currentColor">{Math.round(t)} ft</text></g>))}
        {c.units.map(u => wells.slice(0, -1).map((w, i) => {
          const a = u.cells[w.wellId], b = u.cells[wells[i + 1].wellId];
          if (!a?.sand || !b?.sand) return null;
          const bad = a.flag !== "ok" || b.flag !== "ok";
          return (<g key={u.id + i}>
            <polygon points={`${x0(i) + colW},${y(a.sand.top)} ${x0(i + 1)},${y(b.sand.top)} ${x0(i + 1)},${y(b.sand.base)} ${x0(i) + colW},${y(a.sand.base)}`} fill="hsl(var(--primary) / 0.12)" />
            <line x1={x0(i) + colW} y1={y(a.sand.top)} x2={x0(i + 1)} y2={y(b.sand.top)} stroke={bad ? "hsl(var(--destructive))" : "hsl(var(--primary))"} strokeDasharray={bad ? "4 3" : undefined} />
          </g>);
        }))}
        {wells.map((w, i) => {
          const grs = w.points.map(p => p.gr);
          const gMin = Math.min(...grs, 0), gMax = Math.max(...grs, 150);
          const gx = (g: number) => x0(i) + ((g - gMin) / (gMax - gMin)) * colW;
          return (<g key={w.wellId}>
            <text x={x0(i)} y={14} fontSize={11} fill="hsl(var(--foreground))">{w.name.slice(0, 18)}</text>
            <rect x={x0(i)} y={top} width={colW} height={H - top - 10} fill="none" stroke="hsl(var(--border))" />
            {w.sands.map(s => <rect key={s.top} x={x0(i)} y={y(s.top)} width={colW} height={Math.max(1, y(s.base) - y(s.top))} fill="hsl(var(--warning) / 0.35)" />)}
            {c.units.map(u => { const cell = u.cells[w.wellId]; if (cell?.flag !== "missing") return null;
              return <g key={u.id}><rect x={x0(i)} y={y(u.refTop)} width={colW} height={Math.max(4, y(u.refBase) - y(u.refTop))} fill="none" stroke="hsl(var(--destructive))" strokeDasharray="3 3" /><text x={x0(i) + 3} y={y(u.refTop) + 10} fontSize={9} fill="hsl(var(--destructive))">{u.id} missing</text></g>; })}
            {w.points.length > 1 && <polyline points={w.points.map(p => `${gx(p.gr)},${y(p.depth)}`).join(" ")} fill="none" stroke="hsl(var(--success))" strokeWidth={1} />}
            {w.cutoff !== null && <line x1={gx(w.cutoff)} x2={gx(w.cutoff)} y1={top} y2={H - 10} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />}
            {!w.points.length && <text x={x0(i) + 6} y={top + 20} fontSize={10} fill="currentColor">No GR log</text>}
          </g>);
        })}
      </svg>
    </div>
  );
}

export default function WellCorrelation() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [tolerance, setTolerance] = useState(100);
  const [pdfBusy, setPdfBusy] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const wellsQ = useQuery({ queryKey: ["corr-wells"], queryFn: loadWells });
  const logsQ = useQuery({ queryKey: ["corr-logs", [...selected].sort()], queryFn: () => loadLogs(selected), enabled: selected.length > 0 });
  const wells = wellsQ.data ?? [];
  const filtered = wells.filter(w => `${w.well_name ?? ""} ${w.api_number ?? ""}`.toLowerCase().includes(search.toLowerCase())).slice(0, 200);

  const corr = useMemo<Correlation | null>(() => {
    if (!logsQ.data) return null;
    const picks = selected.map(id => {
      const w = wells.find(x => x.id === id);
      const pts = logsQ.data.filter(r => r.well_id === id).map(r => ({ depth: r.measured_depth, gr: r.gamma_ray as number }));
      return pickSands(id, w?.well_name || w?.api_number || id.slice(0, 8), pts);
    });
    return correlate(picks, tolerance);
  }, [logsQ.data, selected, wells, tolerance]);

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length >= MAX_WELLS ? (toast.error(`Up to ${MAX_WELLS} wells`), s) : [...s, id]);
  const flagsCount = corr ? corr.units.reduce((n, u) => n + Object.values(u.cells).filter(c => c.flag === "missing" || c.flag === "offset" || c.flag === "thinning").length, 0) : 0;

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setPdfBusy(true);
    try { await downloadReportPdf(reportRef.current, "SGOM Well Correlation — DRAFT", `SGOM_Correlation_${selected.length}_wells_DRAFT.pdf`, "SGOM | Well Correlation | DRAFT - auto-picked markers, geophysicist review required"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setPdfBusy(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">Stage 8</Badge>
        <GitCompareArrows className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Well Correlation</h1>
        <Badge variant="secondary">DRAFT</Badge>
      </div>
      <p className="text-sm text-muted-foreground max-w-3xl">Select 2–{MAX_WELLS} wells of your company. Clean sand markers are auto-picked from gamma ray (per-well P10/P90 midpoint cutoff) and matched by depth to the reference well. Markers are candidates only — faults and pinch-outs must be confirmed by a geophysicist. No formation names are assigned.</p>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <Input placeholder="Search name or API" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="text-xs text-muted-foreground">{selected.length} / {MAX_WELLS} selected</div>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {wellsQ.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {filtered.map(w => (
              <label key={w.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted">
                <Checkbox checked={selected.includes(w.id)} onCheckedChange={() => toggle(w.id)} />
                <span className="truncate">{w.well_name || "Unnamed"}</span>
                <span className="ml-auto text-xs text-muted-foreground">{w.api_number}</span>
              </label>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor="tol">Depth tolerance (ft)</Label>
            <Input id="tol" type="number" min={10} max={1000} value={tolerance} onChange={e => setTolerance(Math.max(10, Number(e.target.value) || 100))} />
          </div>
          <Button className="w-full" disabled={!corr || selected.length < 2 || pdfBusy} onClick={exportPdf}>
            {pdfBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download combined PDF
          </Button>
        </div>

        <div className="min-w-0">
          {selected.length < 2 && <p className="text-sm text-muted-foreground">Select at least two wells.</p>}
          {logsQ.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {logsQ.error && <p className="text-sm text-destructive">{(logsQ.error as Error).message}</p>}
          {corr && selected.length >= 2 && (
            <div ref={reportRef} className="space-y-6 bg-background text-foreground">
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-lg font-semibold">Well Correlation Report — {selected.length} wells</h2>
                <p className="text-xs text-muted-foreground">Generated {new Date().toLocaleString("en-US")} · Tolerance {tolerance} ft · Reference: {corr.wells.find(w => w.wellId === corr.referenceId)?.name ?? "—"} · {corr.units.length} units · {flagsCount} flagged cells</p>
                <p className="mt-1 text-xs text-warning">DRAFT — auto-picked GR markers, not an approved stratigraphic interpretation.</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-2 font-semibold">Cross-section (GR, sand shading, unit tops)</h3>
                <CrossSection c={corr} />
                <p className="mt-2 text-xs text-muted-foreground">Yellow = clean sand (GR ≤ cutoff). Blue lines = correlated tops; red dashed = flagged; red boxes = missing unit.</p>
              </div>
              <div className="rounded-lg border bg-card p-4 overflow-x-auto">
                <h3 className="mb-2 font-semibold">Unit tops & thickness (ft)</h3>
                <table className="w-full text-xs">
                  <thead><tr className="border-b text-left"><th className="p-1">Unit</th><th className="p-1">Median h</th>{corr.wells.map(w => <th key={w.wellId} className="p-1">{w.name}</th>)}</tr></thead>
                  <tbody>{corr.units.map(u => (
                    <tr key={u.id} className="border-b">
                      <td className="p-1 font-medium">{u.id}</td><td className="p-1">{u.medianThickness}</td>
                      {corr.wells.map(w => { const c = u.cells[w.wellId];
                        return <td key={w.wellId} className={`p-1 ${flagClass[c.flag]}`} title={flagLabel[c.flag]}>
                          {c.sand ? `${c.sand.top}–${c.sand.base} (h ${c.sand.thickness})` : c.flag === "missing" ? "MISSING" : "n/c"}
                          {c.flag !== "ok" && c.sand && <div>{flagLabel[c.flag]}</div>}
                        </td>; })}
                    </tr>))}
                    <tr className="font-semibold"><td className="p-1">Net sand</td><td />{corr.wells.map(w => <td key={w.wellId} className="p-1">{w.sands.reduce((s, x) => s + x.thickness, 0).toFixed(1)}</td>)}</tr>
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border bg-card p-4 overflow-x-auto">
                <h3 className="mb-2 font-semibold">Per-well summary</h3>
                <table className="w-full text-xs">
                  <thead><tr className="border-b text-left"><th className="p-1">Well</th><th className="p-1">Logged interval</th><th className="p-1">GR points</th><th className="p-1">GR cutoff</th><th className="p-1">Sand bodies</th><th className="p-1">Flags</th></tr></thead>
                  <tbody>{corr.wells.map(w => {
                    const fl = corr.units.map(u => u.cells[w.wellId]).filter(c => c.flag === "missing" || c.flag === "offset" || c.flag === "thinning").length;
                    return <tr key={w.wellId} className="border-b"><td className="p-1">{w.name}</td><td className="p-1">{w.logTop !== null ? `${w.logTop}–${w.logBase} ft` : "No GR data"}</td><td className="p-1">{w.points.length}</td><td className="p-1">{w.cutoff ?? "—"}</td><td className="p-1">{w.sands.length}</td><td className={`p-1 ${fl ? "text-destructive" : ""}`}>{fl}</td></tr>; })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
