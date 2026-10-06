import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { MAXXWELL_TEMPLATE, parseMaxxwellCsv, apiKey } from "@/lib/maxxwell-import";

interface W { id: string; company_id: string; well_name: string | null; api_number: string | null; total_depth: number | null }

async function loadWells(): Promise<W[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in");
  const { data: m, error } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id);
  if (error) throw error;
  const ids = (m ?? []).map(x => x.company_id);
  if (!ids.length) return [];
  const all: W[] = [];
  for (let o = 0; ; o += 1000) {
    const { data, error: e } = await supabase.from("wells").select("id, company_id, well_name, api_number, total_depth").in("company_id", ids).not("api_number", "is", null).range(o, o + 999);
    if (e) throw e;
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return all;
}

export default function MaxxwellImport() {
  const { role } = useUserRole();
  const canEdit = role === "admin" || role === "engineer";
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; id: string }[]>([]);
  const wells = useQuery({ queryKey: ["maxxwell-wells"], queryFn: loadWells });

  const byApi = useMemo(() => {
    const m = new Map<string, W[]>();
    (wells.data ?? []).forEach(w => { const k = apiKey(w.api_number ?? ""); if (k) m.set(k, [...(m.get(k) ?? []), w]); });
    return m;
  }, [wells.data]);

  const parsed = useMemo(() => text.trim() ? parseMaxxwellCsv(text) : null, [text]);
  const rows = (parsed?.bundles ?? []).map(b => {
    const matches = byApi.get(b.api) ?? [];
    const errs = [...b.errors];
    if (!matches.length) errs.push("No well with this API in your company");
    if (matches.length > 1) errs.push("API matches several wells — fix duplicates first");
    const w = matches.length === 1 ? matches[0] : null;
    if (w?.total_depth) b.casing.forEach((c, i) => { if (c.bottom_ft > w.total_depth!) errs.push(`Casing ${i + 1}: bottom exceeds TD ${w.total_depth} ft`); });
    return { b, w, errs };
  });
  const ready = rows.filter(r => !r.errs.length && r.w);
  const blocked = !!parsed?.errors.length || rows.some(r => r.errs.length);

  const onFile = async (f?: File) => { if (f) setText(await f.text()); setDone([]); };
  const template = () => {
    const url = URL.createObjectURL(new Blob([MAXXWELL_TEMPLATE], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "SGOM_Maxxwell_import_template.csv" }).click();
    URL.revokeObjectURL(url);
  };

  const run = async () => {
    setBusy(true);
    const ok: { name: string; id: string }[] = [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      for (const { b, w } of ready) {
        if (!w) continue;
        const c = b.conditions;
        if (c) {
          const { water_cut_pct, ...pt } = c;
          const payload = Object.fromEntries(Object.entries(pt).filter(([, v]) => v != null));
          if (Object.keys(payload).length) {
            const { error } = await supabase.from("well_water_inputs").upsert({ well_id: w.id, company_id: w.company_id, ...payload, updated_by: user?.id }, { onConflict: "well_id" });
            if (error) throw new Error(`${w.well_name}: ${error.message}`);
          }
          if (water_cut_pct != null) {
            const { error } = await supabase.from("wells").update({ water_cut: water_cut_pct }).eq("id", w.id).eq("company_id", w.company_id);
            if (error) throw new Error(`${w.well_name}: ${error.message}`);
          }
        }
        if (b.casing.length) {
          const strings = [...b.casing].sort((a, z) => a.top_ft - z.top_ft || z.od_in - a.od_in);
          const { error } = await supabase.from("well_casing_programs").upsert({ well_id: w.id, company_id: w.company_id, strings: JSON.parse(JSON.stringify(strings)), source: `Maxxwell import ${new Date().toISOString().slice(0, 10)}`, notes: "Imported from Maxxwell CSV. Verify against well file before field use.", updated_by: user?.id }, { onConflict: "well_id" });
          if (error) throw new Error(`${w.well_name}: ${error.message}`);
        }
        ok.push({ name: w.well_name ?? w.api_number ?? w.id, id: w.id });
      }
      toast.success(`Imported ${ok.length} well(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally { setDone(ok); setBusy(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <Badge variant="outline" className="mb-2">Stage 2 · Stage 6</Badge>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><FileSpreadsheet className="h-6 w-6 text-primary" />Maxxwell Data Import</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">Import reservoir pressure, bottom-hole temperature, water cut and casing strings supplied by Maxxwell. Wells are matched by API number within your company only. Values are stored as provided — measured field data, not estimates.</p>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={template}><Download className="h-4 w-4 mr-2" />CSV template</Button>
          <Button variant="outline" asChild><label className="cursor-pointer"><Upload className="h-4 w-4 mr-2" />Upload CSV<input type="file" accept=".csv,.txt" className="hidden" onChange={e => onFile(e.target.files?.[0])} /></label></Button>
        </div>
        <p className="text-xs text-muted-foreground">One CONDITIONS row per well (pressure psi + datum ft, BHT °F + depth ft, surface temp °F, water cut %) and one CASING row per string (type, top/bottom ft, OD/wall in, grade, cement top ft, cement status). Casing rows replace the well's saved program.</p>
        <Textarea rows={8} value={text} onChange={e => { setText(e.target.value); setDone([]); }} placeholder="Paste CSV here…" className="font-mono text-xs" />
      </div>

      {wells.isLoading && <p className="text-sm text-muted-foreground">Loading company wells…</p>}
      {parsed?.errors.map(e => <p key={e} className="text-sm text-destructive">{e}</p>)}

      {rows.length > 0 && (
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Preview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-left"><tr><th className="py-2">API</th><th>Well</th><th>Pressure</th><th>BHT</th><th>Water cut</th><th>Casing strings</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map(({ b, w, errs }) => (
                  <tr key={b.api} className="border-t border-border align-top">
                    <td className="py-2 font-mono">{b.api}</td>
                    <td>{w?.well_name ?? "—"}</td>
                    <td>{b.conditions?.reservoir_pressure_psi != null ? `${b.conditions.reservoir_pressure_psi} psi @ ${b.conditions.pressure_datum_ft} ft` : "—"}</td>
                    <td>{b.conditions?.bht_f != null ? `${b.conditions.bht_f} °F @ ${b.conditions.bht_depth_ft} ft` : "—"}</td>
                    <td>{b.conditions?.water_cut_pct != null ? `${b.conditions.water_cut_pct}%` : "—"}</td>
                    <td>{b.casing.length || "—"}</td>
                    <td>{errs.length ? <ul className="text-destructive text-xs space-y-0.5">{errs.map(e => <li key={e} className="flex gap-1"><AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />{e}</li>)}</ul> : <span className="text-primary flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />Ready</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!canEdit && <p className="text-xs text-muted-foreground">Only admin or engineer roles can import.</p>}
          <Button disabled={!canEdit || busy || blocked || !ready.length} onClick={run}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Import {ready.length} well(s)
          </Button>
          {blocked && <p className="text-xs text-muted-foreground">Fix all errors before importing — partial imports are not allowed.</p>}
        </div>
      )}

      {done.length > 0 && (
        <div className="glass-card rounded-xl p-5 space-y-2">
          <h2 className="font-semibold">Continue the SPT cycle</h2>
          {done.map(d => (
            <div key={d.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium mr-2">{d.name}</span>
              <Button size="sm" variant="outline" asChild><Link to={`/dashboard/spt-slot-plan?wellId=${d.id}`}>SPT Slot Plan</Link></Button>
              <Button size="sm" variant="outline" asChild><Link to={`/dashboard/casing-program?wellId=${d.id}`}>Casing Program</Link></Button>
              <Button size="sm" variant="outline" asChild><Link to={`/dashboard/geophysical-expertise?wellId=${d.id}`}>Geophysical Expertise</Link></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
