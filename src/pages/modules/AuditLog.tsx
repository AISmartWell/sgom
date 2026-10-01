import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

type Entry = { id: string; at: string; who: string; what: string; where: string; detail: string; source: string };

const AuditLog = () => {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [users, wells, api, docs, analyses, cores, seis, calib, geo] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("wells").select("id, well_name, api_number").limit(5000),
      supabase.from("api_call_log").select("id, token_label, action, status_code, well_ref, verdict, error_code, created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("well_documents").select("id, uploaded_by, title, well_id, doc_type, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("well_analyses").select("id, user_id, well_id, status, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("core_analyses").select("id, user_id, sample_name, rock_type, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("seismic_analyses").select("id, user_id, well_id, analysis_mode, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("calibration_audit").select("id, well_id, method, scope_key, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("geophysics_agent_runs").select("id, user_id, well_name, reservoir_rating, created_at").order("created_at", { ascending: false }).limit(200),
    ]);
    const email = new Map<string, string>((users.data ?? []).map((u: { user_id: string; email: string }) => [u.user_id, u.email]));
    const wellName = new Map<string, string>((wells.data ?? []).map((w) => [w.id, w.well_name ?? w.api_number ?? w.id]));
    const who = (id?: string | null) => (id ? email.get(id) ?? id.slice(0, 8) : "system");
    const wn = (id?: string | null) => (id ? wellName.get(id) ?? "—" : "—");
    const out: Entry[] = [
      ...(api.data ?? []).map((r) => ({ id: `api-${r.id}`, at: r.created_at, who: `API token: ${r.token_label ?? "unknown"}`, what: `Sandbox ${r.action}`, where: r.well_ref ?? "—", detail: r.error_code ? `HTTP ${r.status_code} · ${r.error_code}` : `HTTP ${r.status_code} · ${r.verdict ?? ""}`, source: "Upstrima sandbox" })),
      ...(docs.data ?? []).map((r) => ({ id: `doc-${r.id}`, at: r.created_at, who: who(r.uploaded_by), what: "Document uploaded", where: wn(r.well_id), detail: `${r.title} (${r.doc_type})`, source: "Documents" })),
      ...(analyses.data ?? []).map((r) => ({ id: `wa-${r.id}`, at: r.created_at, who: who(r.user_id), what: "Well analysis run", where: wn(r.well_id), detail: r.status, source: "Analysis" })),
      ...(cores.data ?? []).map((r) => ({ id: `ca-${r.id}`, at: r.created_at, who: who(r.user_id), what: "Core analysis", where: r.sample_name ?? "—", detail: r.rock_type ?? "", source: "Stage 3" })),
      ...(seis.data ?? []).map((r) => ({ id: `sa-${r.id}`, at: r.created_at, who: who(r.user_id), what: "Seismic analysis", where: wn(r.well_id), detail: r.analysis_mode, source: "Stage 5" })),
      ...(calib.data ?? []).map((r) => ({ id: `cal-${r.id}`, at: r.created_at, who: "system", what: "Model calibration", where: r.well_id ? wn(r.well_id) : r.scope_key ?? "—", detail: r.method, source: "Calibration" })),
      ...(geo.data ?? []).map((r) => ({ id: `geo-${r.id}`, at: r.created_at, who: who(r.user_id), what: "Geophysical Agent verdict", where: r.well_name ?? "—", detail: r.reservoir_rating ?? "", source: "Stage 8" })),
    ].sort((a, b) => b.at.localeCompare(a.at));
    setRows(out);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sources = useMemo(() => ["all", ...Array.from(new Set(rows.map((r) => r.source)))], [rows]);
  const shown = rows.filter((r) => (src === "all" || r.source === src) && (!q || `${r.who} ${r.what} ${r.where} ${r.detail}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2">Security · Admin</Badge>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Who did what, when and where — platform actions and Upstrima sandbox API calls.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        {sources.map((s) => (
          <Button key={s} size="sm" variant={src === s ? "default" : "outline"} onClick={() => setSrc(s)}>{s}</Button>
        ))}
      </div>
      <Card className="glass-card"><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>What</TableHead>
            <TableHead>Where</TableHead><TableHead>Details</TableHead><TableHead>Source</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm whitespace-nowrap">{new Date(r.at).toLocaleString()}</TableCell>
                <TableCell className="text-sm">{r.who}</TableCell>
                <TableCell className="text-sm font-medium">{r.what}</TableCell>
                <TableCell className="text-sm">{r.where}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.detail}</TableCell>
                <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
              </TableRow>
            ))}
            {!shown.length && <TableRow><TableCell colSpan={6} className="text-muted-foreground">{loading ? "Loading…" : "No entries"}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default AuditLog;
