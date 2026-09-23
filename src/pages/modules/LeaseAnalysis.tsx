import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, Save, Play, FileDown, AlertTriangle, Layers } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

type Well = {
  well_name: string; api_number?: string; well_type: "producer" | "injector" | "other";
  status?: string; total_depth_ft?: number; include: boolean; share?: number; id?: string;
};
type Sale = { month: string; oil_bbl: number; water_bbl?: number; gas_mcf?: number; well_name?: string };
type Lease = { lease_name: string; operator?: string; county?: string; state?: string; formation?: string; notes?: string[] };
type Alloc = "equal" | "depth" | "manual";

function rtfToText(rtf: string) {
  return rtf
    .replace(/\\par[d]?/g, "\n").replace(/\\tab/g, "\t")
    .replace(/\\'([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\{\\\*[^{}]*\}/g, "").replace(/\\[a-z]+-?\d* ?/gi, "")
    .replace(/[{}]/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

async function fileToText(f: File): Promise<string> {
  const n = f.name.toLowerCase();
  if (n.endsWith(".xlsx") || n.endsWith(".xls")) {
    const wb = XLSX.read(await f.arrayBuffer());
    return wb.SheetNames.map((s) => `# ${s}\n${XLSX.utils.sheet_to_csv(wb.Sheets[s])}`).join("\n\n");
  }
  if (n.endsWith(".pdf")) throw new Error(`${f.name}: PDF scans go through the OCR page; use RTF, TXT, CSV or Excel here`);
  const t = await f.text();
  return n.endsWith(".rtf") ? rtfToText(t) : t;
}

export default function LeaseAnalysis() {
  const { canEdit } = useUserRole();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<"" | "extract" | "save" | "analyze">("");
  const [lease, setLease] = useState<Lease | null>(null);
  const [wells, setWells] = useState<Well[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [alloc, setAlloc] = useState<Alloc>("equal");
  const [saved, setSaved] = useState(false);
  const [advisor, setAdvisor] = useState<any>(null);

  const producers = wells.filter((w) => w.include && w.well_type === "producer");
  const leaseSales = sales.filter((s) => !s.well_name);

  const shares = useMemo(() => {
    const m = new Map<string, number>();
    if (!producers.length) return m;
    if (alloc === "equal") producers.forEach((w) => m.set(w.well_name, 1 / producers.length));
    else if (alloc === "depth") {
      const tot = producers.reduce((a, w) => a + (w.total_depth_ft || 0), 0);
      producers.forEach((w) => m.set(w.well_name, tot ? (w.total_depth_ft || 0) / tot : 1 / producers.length));
    } else {
      const tot = producers.reduce((a, w) => a + (w.share || 0), 0);
      producers.forEach((w) => m.set(w.well_name, tot ? (w.share || 0) / tot : 0));
    }
    return m;
  }, [producers, alloc]);

  const kpi = useMemo(() => {
    const oil = sales.reduce((a, s) => a + (s.oil_bbl || 0), 0);
    const water = sales.reduce((a, s) => a + (s.water_bbl || 0), 0);
    const months = new Set(sales.map((s) => s.month)).size;
    const bopd = months ? oil / (months * 30.4) : 0;
    const wc = oil + water > 0 && water > 0 ? (water / (oil + water)) * 100 : null;
    const zero = [...new Set(sales.filter((s) => !s.oil_bbl).map((s) => s.month))];
    return { oil, months, bopd, perWell: producers.length ? bopd / producers.length : 0, wc, zero };
  }, [sales, producers.length]);

  const extract = async () => {
    if (!files.length) return toast.error("Select lease documents first");
    setBusy("extract"); setAdvisor(null); setSaved(false);
    try {
      const texts = await Promise.all(files.map(async (f) => `=== ${f.name} ===\n${await fileToText(f)}`));
      const { data, error } = await supabase.functions.invoke("lease-ingest", {
        body: { text: texts.join("\n\n").slice(0, 200_000), filename: files.map((f) => f.name).join(", ") },
      });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Extraction failed");
      const L = data.lease;
      setLease({ lease_name: L.lease_name, operator: L.operator, county: L.county, state: L.state, formation: L.formation, notes: L.notes });
      setWells((L.wells || []).map((w: any) => ({ ...w, include: true, share: 1 })));
      setSales(L.monthly_sales || []);
      toast.success(`Found ${L.wells?.length ?? 0} wells, ${L.monthly_sales?.length ?? 0} monthly records`);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(""); }
  };

  const save = async () => {
    if (!lease) return;
    setBusy("save");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!uc?.company_id) throw new Error("No company assigned");
      const company_id = uc.company_id;
      const next: Well[] = [];
      for (const w of wells.filter((x) => x.include)) {
        let id: string | undefined;
        if (w.api_number) {
          const { data } = await supabase.from("wells").select("id").eq("company_id", company_id).eq("api_number", w.api_number).maybeSingle();
          id = data?.id;
        }
        if (!id) {
          const { data } = await supabase.from("wells").select("id").eq("company_id", company_id).eq("well_name", w.well_name).maybeSingle();
          id = data?.id;
        }
        const row = {
          company_id, well_name: w.well_name, api_number: w.api_number || null, operator: lease.operator || null,
          well_type: w.well_type === "injector" ? "Injection" : w.well_type === "producer" ? "Oil" : "Other",
          status: w.status || null, county: lease.county || null, state: lease.state || "NA",
          formation: lease.formation || null, total_depth: w.total_depth_ft || null, source: "lease-ingest",
        };
        if (id) await supabase.from("wells").update(row).eq("id", id);
        else {
          const { data, error } = await supabase.from("wells").insert(row).select("id").single();
          if (error) throw error;
          id = data.id;
        }
        next.push({ ...w, id });
      }
      // monthly production, allocated from lease totals
      const rows: any[] = [];
      for (const w of next.filter((x) => x.well_type === "producer")) {
        const own = sales.filter((s) => s.well_name === w.well_name);
        const src = own.length ? own.map((s) => ({ ...s, f: 1 })) : leaseSales.map((s) => ({ ...s, f: shares.get(w.well_name) || 0 }));
        for (const s of src) rows.push({
          well_id: w.id, company_id, production_month: `${s.month}-01`,
          oil_bbl: +(s.oil_bbl * s.f).toFixed(2),
          water_bbl: s.water_bbl != null ? +(s.water_bbl * s.f).toFixed(2) : null,
          gas_mcf: s.gas_mcf != null ? +(s.gas_mcf * s.f).toFixed(2) : null,
        });
      }
      const ids = [...new Set(rows.map((r) => r.well_id))];
      const months = [...new Set(rows.map((r) => r.production_month))];
      if (ids.length) await supabase.from("production_history").delete().in("well_id", ids).in("production_month", months);
      if (rows.length) { const { error } = await supabase.from("production_history").insert(rows); if (error) throw error; }
      setWells(next); setSaved(true);
      toast.success(`Saved ${next.length} wells and ${rows.length} monthly records`);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(""); }
  };

  const analyze = async () => {
    const list = producers.filter((w) => w.id);
    if (!list.length) return toast.error("Save the lease first");
    setBusy("analyze");
    try {
      const q = `Evaluate the whole lease "${lease?.lease_name}" for SPT treatment. Wells (use exactly these ids): ${list
        .map((w) => `${w.well_name} = ${w.id}`).join("; ")}. Call get_well_context, forecast_well (24 months) and ood_check on EACH of them, rank ALL of them, and give expected 24-month uplift per well. Put every other well in alternatives with its score. Apply the TIE RULE strictly.`;
      const { data, error } = await supabase.functions.invoke("spt-advisor", { body: { question: q } });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Advisor failed");
      setAdvisor(data.answer);
      toast.success("Lease analysis ready");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(""); }
  };

  const ranking = useMemo(() => {
    if (!advisor?.recommended_well) return [];
    const r = [{ ...advisor.recommended_well, why: advisor.reasoning }, ...(advisor.alternatives || [])];
    return r.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
  }, [advisor]);

  const pdf = () => {
    if (!lease) return;
    const d = new jsPDF({ unit: "pt", format: "a4" });
    let y = 56; const L = 48; const W = 500;
    const line = (t: string, size = 10, bold = false) => {
      d.setFont("helvetica", bold ? "bold" : "normal"); d.setFontSize(size);
      for (const s of d.splitTextToSize(t, W)) { if (y > 790) { d.addPage(); y = 56; } d.text(s, L, y); y += size * 1.4; }
    };
    line(`SGOM Lease Analysis - ${lease.lease_name}`, 18, true);
    line(`${lease.county ?? ""} ${lease.state ?? ""} | Operator: ${lease.operator ?? "n/a"} | Formation: ${lease.formation ?? "n/a"}`, 9);
    line(`Generated ${new Date().toISOString().slice(0, 10)} by SGOM platform`, 8); y += 8;
    line("Lease overview", 13, true);
    line(`Wells: ${wells.filter((w) => w.include).length} (${producers.length} producers). Months of data: ${kpi.months}. Total oil: ${kpi.oil.toFixed(1)} bbl.`);
    line(`Average rate: ${kpi.bopd.toFixed(2)} BOPD per lease, ${kpi.perWell.toFixed(2)} BOPD per producer.${kpi.wc != null ? ` Water cut: ${kpi.wc.toFixed(0)}%.` : ""}`);
    if (!sales.some((s) => s.well_name)) line(`Allocation: lease-level sales split by "${alloc}" method - per-well figures are approximate.`, 9);
    y += 6; line("Monthly sales", 13, true);
    [...new Set(sales.map((s) => s.month))].sort().forEach((m) =>
      line(`${m}: ${sales.filter((s) => s.month === m).reduce((a, s) => a + s.oil_bbl, 0).toFixed(2)} bbl`, 9));
    y += 6; line("SPT candidates", 13, true);
    if (!advisor) line("Analysis not run yet.", 9);
    else {
      if (advisor.tie) line(`Equal candidates - no single winner: ${(advisor.tied_wells || []).map((t: any) => t.name).join(", ")}. Table order is not a priority.`, 10, true);
      ranking.forEach((r: any) => line(`${r.name}: score ${r.score}${r.confidence != null ? `, confidence ${r.confidence}` : ""}`, 10));
      if (advisor.expected_uplift_bbl != null) line(`Expected uplift (leader / per well, 24 mo): ${advisor.expected_uplift_bbl} bbl`, 10);
      line(advisor.reasoning || "", 9);
      if (advisor.risks?.length) { y += 4; line("Risks", 12, true); advisor.risks.forEach((r: string) => line(`- ${r}`, 9)); }
    }
    y += 6; line("What would improve accuracy", 12, true);
    ["Per-well tests and water volumes", "Well logs (LAS or paper scans)", "Perforation records", "At least one reservoir pressure measurement"].forEach((t) => line(`- ${t}`, 9));
    d.save(`sgom-lease-${lease.lease_name.replace(/\W+/g, "-").toLowerCase()}.pdf`);
  };

  const setW = (i: number, p: Partial<Well>) => setWells((ws) => ws.map((w, j) => (j === i ? { ...w, ...p } : w)));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="text-[10px]">Stage 2 · Lease</Badge>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Layers className="w-7 h-7 text-primary" /> Lease Analysis</h1>
      </div>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Upload operator documents for a lease. SGOM extracts the wells and monthly sales, splits lease volumes across producers,
        runs the SPT Advisor on every well and produces an investor-ready summary.
      </p>

      <Card>
        <CardHeader><CardTitle className="text-base">1 · Upload lease documents</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Input type="file" multiple accept=".rtf,.txt,.csv,.xlsx,.xls" disabled={!canEdit}
            onChange={(e) => setFiles(Array.from(e.target.files || []))} className="max-w-md" />
          <Button onClick={extract} disabled={!canEdit || !files.length || !!busy}>
            {busy === "extract" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Extract
          </Button>
          <span className="text-xs text-muted-foreground">RTF, TXT, CSV, Excel · several files at once</span>
        </CardContent>
      </Card>

      {lease && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base">2 · Review — {lease.lease_name}
              <span className="ml-2 text-xs font-normal text-muted-foreground">{[lease.county, lease.state, lease.formation].filter(Boolean).join(" · ")}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Split lease volumes</span>
              <Select value={alloc} onValueChange={(v) => setAlloc(v as Alloc)}>
                <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equally</SelectItem>
                  <SelectItem value="depth">By depth</SelectItem>
                  <SelectItem value="manual">Manual weights</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={save} disabled={!canEdit || !!busy}>
                {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save to platform
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr><th className="p-2 text-left">Use</th><th className="p-2 text-left">Well</th><th className="p-2 text-left">API</th>
                    <th className="p-2 text-left">Type</th><th className="p-2 text-left">Status</th><th className="p-2 text-right">Depth, ft</th>
                    {alloc === "manual" && <th className="p-2 text-right">Weight</th>}<th className="p-2 text-right">Share</th></tr>
                </thead>
                <tbody>
                  {wells.map((w, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-2"><Checkbox checked={w.include} onCheckedChange={(c) => setW(i, { include: !!c })} /></td>
                      <td className="p-2">{w.well_name}</td>
                      <td className="p-2 font-mono text-xs">{w.api_number || "—"}</td>
                      <td className="p-2"><Badge variant="outline">{w.well_type}</Badge></td>
                      <td className="p-2 text-xs">{w.status || "—"}</td>
                      <td className="p-2 text-right"><Input type="number" className="h-7 w-24 ml-auto text-right" value={w.total_depth_ft ?? ""}
                        onChange={(e) => setW(i, { total_depth_ft: e.target.value ? +e.target.value : undefined })} /></td>
                      {alloc === "manual" && <td className="p-2 text-right"><Input type="number" className="h-7 w-20 ml-auto text-right" value={w.share ?? ""}
                        onChange={(e) => setW(i, { share: +e.target.value })} /></td>}
                      <td className="p-2 text-right font-mono">{shares.has(w.well_name) ? `${(shares.get(w.well_name)! * 100).toFixed(0)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[["Total oil", `${kpi.oil.toFixed(1)} bbl`], ["Months", kpi.months], ["Lease rate", `${kpi.bopd.toFixed(2)} BOPD`], ["Per producer", `${kpi.perWell.toFixed(2)} BOPD`]].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-lg font-mono">{v}</div></div>
              ))}
            </div>
            {kpi.zero.length > 0 && <p className="text-xs text-muted-foreground">No sales in {kpi.zero.join(", ")} — possibly tank accumulation or downtime.</p>}
            {!sales.some((s) => s.well_name) && producers.length > 1 && alloc === "equal" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" />
                Sales are lease-level. With an equal split all producers look identical — add depths or weights, or per-well tests.</p>
            )}
          </CardContent>
        </Card>
      )}

      {lease && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base">3 · Analyze lease</CardTitle>
            <div className="flex gap-2">
              <Button onClick={analyze} disabled={!saved || !!busy}>
                {busy === "analyze" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Analyze Lease
              </Button>
              <Button variant="outline" onClick={pdf}><FileDown className="w-4 h-4" /> Download Investor PDF</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!saved && <p className="text-xs text-muted-foreground">Save the lease to the platform first.</p>}
            {busy === "analyze" && <p className="text-sm text-muted-foreground">SPT Advisor is inspecting every well — this takes 1–2 minutes.</p>}
            {advisor && (
              <>
                {advisor.tie && (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                    <b>Equal candidates — no single winner.</b> Data cannot distinguish: {(advisor.tied_wells || []).map((t: any) => t.name).join(", ")}.
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border"><tr><th className="p-2 text-left">Well</th><th className="p-2 text-right">Score</th><th className="p-2 text-left">Notes</th></tr></thead>
                  <tbody>{ranking.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-border/50"><td className="p-2">{r.name}</td><td className="p-2 text-right font-mono">{r.score}</td><td className="p-2 text-xs text-muted-foreground">{i === 0 && !advisor.tie ? "" : r.why || ""}</td></tr>
                  ))}</tbody>
                </table>
                <p className="text-sm">{advisor.reasoning}</p>
                {advisor.expected_uplift_bbl != null && <p className="text-sm">Expected 24-month uplift: <b>{advisor.expected_uplift_bbl} bbl</b></p>}
                {advisor.risks?.length > 0 && <ul className="text-xs text-muted-foreground list-disc pl-5">{advisor.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
