import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Layers, Plus, Save, Download, Trash2, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { CasingProgram as Program, CasingString, CasingWell, casingTypes, cementStatuses, emptyCasingProgram, newCasingString, casingNumber, validateCasingProgram } from "@/lib/casing-program";
import CasingSchematic from "@/components/casing/CasingSchematic";
import { CasingReport } from "@/components/casing/CasingReport";
import { downloadCasingPdf } from "@/lib/casing-pdf";

async function loadWells(): Promise<CasingWell[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Please sign in");
  const { data: memberships, error } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id);
  if (error) throw error;
  const ids = (memberships ?? []).map(m => m.company_id);
  if (!ids.length) return [];
  const all: CasingWell[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error: we } = await supabase.from("wells").select("id, company_id, well_name, api_number, total_depth, state").in("company_id", ids).order("well_name").order("id").range(offset, offset + 999);
    if (we) throw we;
    all.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return all;
}

function CasingEditor({ well, canEdit, onDirty, onBusy }: { well: CasingWell; canEdit: boolean; onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void }) {
  const [program, setProgram] = useState<Program>(emptyCasingProgram);
  const [saved, setSaved] = useState<Program>(emptyCasingProgram);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(program) !== JSON.stringify(saved);
  const { parsed, errors } = validateCasingProgram(program, well.total_depth);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useEffect(() => { onBusy(loading || busy || pdfBusy); }, [loading, busy, pdfBusy, onBusy]);
  useEffect(() => {
    let cancelled = false;
    supabase.from("well_casing_programs").select("*").eq("well_id", well.id).eq("company_id", well.company_id).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error.message);
      else {
        const p = data ? { strings: data.strings as unknown as CasingString[], source: data.source, notes: data.notes } : emptyCasingProgram();
        setProgram(p); setSaved(p); setSavedAt(data?.updated_at ?? null);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [well.id, well.company_id]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    const click = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (link && !window.confirm("Discard unsaved casing changes?")) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", click, true); };
  }, [dirty]);
  const changeString = (id: string, patch: Partial<CasingString>) => setProgram(p => ({ ...p, strings: p.strings.map(r => r.id === id ? { ...r, ...patch } : r) }));
  const save = async () => {
    setShowErrors(true);
    if (!canEdit || !parsed.success || errors.length) return;
    setBusy(true);
    try {
      const { data: { user }, error: ae } = await supabase.auth.getUser();
      if (ae) throw ae;
      if (!user) throw new Error("Please sign in again");
      const { data, error } = await supabase.from("well_casing_programs").upsert({ well_id: well.id, company_id: well.company_id, strings: JSON.parse(JSON.stringify(parsed.data.strings)), source: parsed.data.source, notes: parsed.data.notes, updated_by: user.id }, { onConflict: "well_id" }).select("updated_at").single();
      if (error) throw error;
      setProgram(parsed.data); setSaved(parsed.data); setSavedAt(data.updated_at); toast.success("Casing program saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to save casing program"); }
    finally { setBusy(false); }
  };
  const exportPdf = async () => {
    if (!reportRef.current || dirty || !program.strings.length) return;
    setPdfBusy(true);
    try { await downloadCasingPdf(reportRef.current, well.well_name || well.api_number || "Well"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Unable to export PDF"); }
    finally { setPdfBusy(false); }
  };
  if (loading) return <p className="flex items-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading casing records…</p>;
  if (loadError) return <p role="alert" className="py-10 text-destructive">Could not load casing records: {loadError}</p>;
  const numeric = (r: CasingString, key: "top_ft" | "bottom_ft" | "od_in" | "wall_in" | "cement_top_ft", label: string) => <div className="space-y-2"><Label htmlFor={`${r.id}-${key}`}>{label}</Label><Input id={`${r.id}-${key}`} type="number" min="0" step="any" value={r[key] === null || !Number.isFinite(r[key]) ? "" : r[key] ?? ""} onChange={e => changeString(r.id, { [key]: e.target.value === "" ? key === "cement_top_ft" ? null : NaN : Number(e.target.value) })} /></div>;
  return <div className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
      <div className="text-sm text-muted-foreground">{dirty ? <span className="text-warning">Unsaved changes</span> : savedAt ? `Saved ${new Date(savedAt).toLocaleString("en-US")}` : "No casing program on record"}</div>
      <div className="flex flex-wrap gap-2">
        {canEdit && <><Button variant="outline" size="icon" title="Discard unsaved changes" aria-label="Discard unsaved changes" disabled={!dirty || busy || pdfBusy} onClick={() => { if (window.confirm("Discard unsaved casing changes?")) { setProgram(saved); setShowErrors(false); } }}><RotateCcw className="h-4 w-4" /></Button><Button onClick={save} disabled={!dirty || busy || pdfBusy}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save program</Button></>}
        <Button variant="outline" onClick={exportPdf} disabled={dirty || busy || pdfBusy || !program.strings.length} title={dirty ? "Save changes before exporting" : "Download saved casing program"}>{pdfBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Download PDF</Button>
      </div>
    </div>
    {showErrors && errors.length > 0 && <div role="alert" className="border-l-2 border-destructive pl-4 text-sm text-destructive"><p className="font-semibold mb-2">Correct these fields before saving</p><ul className="list-disc pl-4 space-y-1">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
    <section className="space-y-3"><h2 className="text-lg font-semibold">Wellbore schematic</h2><CasingSchematic strings={program.strings} totalDepth={well.total_depth} /></section>
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Casing strings <span className="text-muted-foreground">/ {program.strings.length}</span></h2>{canEdit && <Button variant="outline" disabled={busy || pdfBusy || program.strings.length >= 50} onClick={() => setProgram(p => ({ ...p, strings: [...p.strings, newCasingString()] }))}><Plus className="h-4 w-4 mr-2" />Add string</Button>}</div>
      {!program.strings.length && <p className="py-6 text-sm text-muted-foreground">No casing strings on record for this well.</p>}
      {program.strings.map((r, i) => <fieldset key={r.id} disabled={!canEdit || busy || pdfBusy} className="border border-border rounded-md p-5 space-y-5 min-w-0">
        <div className="flex items-center justify-between"><h3 className="font-semibold">String {i + 1}</h3>{canEdit && <Button variant="ghost" size="icon" aria-label={`Delete string ${i + 1}`} title="Delete string" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2"><Label htmlFor={`${r.id}-type`}>String type</Label><Select value={r.type} onValueChange={v => changeString(r.id, { type: v as CasingString["type"] })}><SelectTrigger id={`${r.id}-type`}><SelectValue /></SelectTrigger><SelectContent>{casingTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          {numeric(r, "top_ft", "Top MD (ft)")}{numeric(r, "bottom_ft", "Bottom MD (ft)")}{numeric(r, "od_in", "Outer diameter (in)")}{numeric(r, "wall_in", "Wall thickness (in)")}
          <div className="space-y-2"><Label htmlFor={`${r.id}-grade`}>Steel grade</Label><Input id={`${r.id}-grade`} maxLength={80} placeholder="e.g. API N80" value={r.grade} onChange={e => changeString(r.id, { grade: e.target.value })} /></div>
          {numeric(r, "cement_top_ft", "Cement top MD (ft)")}
          <div className="space-y-2"><Label htmlFor={`${r.id}-cement`}>Cement status</Label><Select value={r.cement_status} onValueChange={v => changeString(r.id, { cement_status: v as CasingString["cement_status"] })}><SelectTrigger id={`${r.id}-cement`}><SelectValue /></SelectTrigger><SelectContent>{cementStatuses.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Calculated pipe-body ID (in)</Label><p className="h-10 flex items-center font-mono text-primary">{Number.isFinite(r.od_in) && Number.isFinite(r.wall_in) && r.od_in > 2 * r.wall_in ? casingNumber(r.od_in - 2 * r.wall_in) : "—"}</p></div>
        </div>
        <div className="space-y-2"><Label htmlFor={`${r.id}-notes`}>Cementing / string notes</Label><Textarea id={`${r.id}-notes`} maxLength={2000} value={r.notes} onChange={e => changeString(r.id, { notes: e.target.value })} /></div>
      </fieldset>)}
    </section>
    <fieldset disabled={!canEdit || busy || pdfBusy} className="space-y-5 border-t border-border pt-5">
      <div className="space-y-2"><Label htmlFor="casing-source">Source documents / reference</Label><Textarea id="casing-source" maxLength={1000} value={program.source} onChange={e => setProgram(p => ({ ...p, source: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="casing-notes">Program notes</Label><Textarea id="casing-notes" maxLength={4000} value={program.notes} onChange={e => setProgram(p => ({ ...p, notes: e.target.value }))} /></div>
    </fieldset>
    <p className="text-xs text-warning border-t border-border pt-4">DRAFT · Entered records, not an engineered design. No collapse, burst, tension or SPT-access verification. Calculated ID is not drift diameter. Not a field work order.</p>
    <div className="fixed -left-[10000px] top-0 pointer-events-none" aria-hidden="true"><CasingReport ref={reportRef} program={saved} well={well} savedAt={savedAt} /></div>
    <AlertDialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete casing string?</AlertDialogTitle><AlertDialogDescription>The string will be removed from this draft. Save the program to apply the change.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setProgram(p => ({ ...p, strings: p.strings.filter(r => r.id !== deleteId) })); setDeleteId(null); }}>Delete string</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

export default function CasingProgram() {
  const { canEdit } = useUserRole();
  const { data: wells = [], isLoading, error } = useQuery({ queryKey: ["casing-wells"], queryFn: loadWells });
  const [wellId, setWellId] = useState("");
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const well = wells.find(w => w.id === wellId);
  const filtered = wells.filter(w => `${w.well_name ?? ""} ${w.api_number ?? ""} ${w.state}`.toLowerCase().includes(search.toLowerCase()));
  useEffect(() => {
    const prev = document.title;
    document.title = "Casing Program | SGOM";
    return () => { document.title = prev; };
  }, []);
  return <div className="max-w-6xl mx-auto p-5 md:p-8 space-y-6">
    <header className="space-y-3"><div className="flex gap-2"><Badge variant="outline" className="text-primary border-primary/40">Stage 6 · Completion</Badge><Badge variant="outline" className="text-warning border-warning/40">DRAFT</Badge></div><h1 className="text-3xl font-bold flex gap-3 items-center"><Layers className="h-7 w-7 text-primary shrink-0" />Casing Program</h1></header>
    {isLoading ? <p className="text-muted-foreground">Loading company wells…</p> : error ? <p role="alert" className="text-destructive">Could not load wells: {(error as Error).message}</p> : !wells.length ? <p className="text-muted-foreground">No wells are available for your company.</p> : <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="well-search">Search wells</Label><Input id="well-search" placeholder="Well name or API" value={search} disabled={busy} onChange={e => setSearch(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="casing-well">Well</Label><Select value={wellId} disabled={busy} onValueChange={id => { if (dirty && !window.confirm("Discard unsaved casing changes?")) return; setDirty(false); setWellId(id); }}><SelectTrigger id="casing-well"><SelectValue placeholder="Select a well" /></SelectTrigger><SelectContent>{filtered.map(w => <SelectItem key={w.id} value={w.id}>{w.well_name || "Unnamed well"} · {w.api_number || w.state} · {w.id.slice(0, 6)}</SelectItem>)}</SelectContent></Select>{!filtered.length && <p className="text-sm text-muted-foreground">No matching wells.</p>}</div>
    </div>}
    {well ? <><p className="text-sm text-muted-foreground">{well.well_name} · API {well.api_number || "Not recorded"} · {well.state} · TD {casingNumber(well.total_depth)} ft</p><CasingEditor key={well.id} well={well} canEdit={canEdit} onDirty={setDirty} onBusy={setBusy} /></> : !isLoading && wells.length > 0 ? <p className="py-10 text-muted-foreground text-sm">No well selected.</p> : null}
  </div>;
}