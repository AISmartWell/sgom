import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, KeyRound, Activity, ShieldCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Token = {
  id: string; label: string; scopes: string[]; expires_at: string;
  revoked_at: string | null; last_used_at: string | null; created_at: string;
};
type Call = {
  id: string; token_label: string | null; action: string; status_code: number;
  well_ref: string | null; verdict: string | null; error_code: string | null;
  latency_ms: number | null; created_at: string;
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString() : "—");

const tokenStatus = (t: Token) => {
  if (t.revoked_at) return { label: "Revoked", variant: "destructive" as const };
  if (new Date(t.expires_at).getTime() < Date.now()) return { label: "Expired", variant: "secondary" as const };
  return { label: "Active", variant: "default" as const };
};

const verdictVariant = (v: string | null) => {
  if (!v) return "outline" as const;
  const s = v.toLowerCase();
  if (s.includes("conditional")) return "secondary" as const;
  if (s.includes("not")) return "destructive" as const;
  if (s.includes("candidate")) return "default" as const;
  return "outline" as const;
};

const UpstrimaSandbox = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [t, c] = await Promise.all([
      supabase.from("api_tokens").select("id, label, scopes, expires_at, revoked_at, last_used_at, created_at").order("created_at", { ascending: false }),
      supabase.from("api_call_log").select("id, token_label, action, status_code, well_ref, verdict, error_code, latency_ms, created_at").order("created_at", { ascending: false }).limit(200),
    ]);
    if (t.error || c.error) toast.error("Failed to load sandbox data");
    setTokens((t.data as Token[]) ?? []);
    setCalls((c.data as Call[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const revoke = async (id: string) => {
    if (!confirm("Revoke this token? Upstrima will lose sandbox access with it.")) return;
    const { error } = await supabase.from("api_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Revoke failed"); else { toast.success("Token revoked"); load(); }
  };

  const stats = useMemo(() => {
    const byAction: Record<string, number> = {};
    const byVerdict: Record<string, number> = {};
    let errors = 0;
    calls.forEach((c) => {
      byAction[c.action] = (byAction[c.action] || 0) + 1;
      if (c.status_code >= 400) errors++;
      if (c.verdict && ["spt_screening", "well_verdict"].includes(c.action)) byVerdict[c.verdict] = (byVerdict[c.verdict] || 0) + 1;
    });
    return { byAction, byVerdict, errors };
  }, [calls]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2">Integration · Admin</Badge>
          <h1 className="text-3xl font-bold">Upstrima Sandbox</h1>
          <p className="text-muted-foreground mt-1">
            API tokens, request history and verdicts returned to Upstrima. Sandbox serves demo data only (Brawner 10-15).
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total calls (last 200)</p>
          <p className="text-3xl font-bold">{calls.length}</p>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Errors (4xx/5xx)</p>
          <p className="text-3xl font-bold text-destructive">{stats.errors}</p>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-2">By method</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats.byAction).map(([a, n]) => <Badge key={a} variant="outline">{a}: {n}</Badge>)}
            {!calls.length && <span className="text-sm text-muted-foreground">No calls yet</span>}
          </div>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-2">Verdicts returned</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats.byVerdict).map(([v, n]) => <Badge key={v} variant={verdictVariant(v)}>{v}: {n}</Badge>)}
            {!Object.keys(stats.byVerdict).length && <span className="text-sm text-muted-foreground">—</span>}
          </div>
        </CardContent></Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> API tokens</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Label</TableHead><TableHead>Status</TableHead><TableHead>Scopes</TableHead>
              <TableHead>Expires</TableHead><TableHead>Last used</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {tokens.map((t) => {
                const s = tokenStatus(t);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.label}</TableCell>
                    <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                    <TableCell className="text-xs">{t.scopes.join(", ")}</TableCell>
                    <TableCell className="text-sm">{fmt(t.expires_at)}</TableCell>
                    <TableCell className="text-sm">{fmt(t.last_used_at)}</TableCell>
                    <TableCell className="text-right">
                      {s.label === "Active" && <Button size="sm" variant="destructive" onClick={() => revoke(t.id)}>Revoke</Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!tokens.length && <TableRow><TableCell colSpan={6} className="text-muted-foreground">No tokens</TableCell></TableRow>}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Only token hashes are stored; the token value itself cannot be shown again.
          </p>
        </CardContent>
      </Card>

      <KnowledgeSearch />

      <Card className="glass-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Request history (audit log)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Time</TableHead><TableHead>Token</TableHead><TableHead>Method</TableHead>
              <TableHead>Well / query</TableHead><TableHead>Result</TableHead><TableHead>HTTP</TableHead><TableHead>ms</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {calls.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm whitespace-nowrap">{fmt(c.created_at)}</TableCell>
                  <TableCell className="text-sm">{c.token_label ?? <span className="text-muted-foreground">unknown</span>}</TableCell>
                  <TableCell><Badge variant="outline">{c.action}</Badge></TableCell>
                  <TableCell className="text-sm">{c.well_ref ?? "—"}</TableCell>
                  <TableCell>
                    {c.error_code
                      ? <Badge variant="destructive">{c.error_code}</Badge>
                      : c.verdict ? <Badge variant={verdictVariant(c.verdict)}>{c.verdict}</Badge> : "—"}
                  </TableCell>
                  <TableCell className={c.status_code >= 400 ? "text-destructive" : "text-success"}>{c.status_code}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.latency_ms ?? "—"}</TableCell>
                </TableRow>
              ))}
              {!calls.length && <TableRow><TableCell colSpan={7} className="text-muted-foreground">No requests yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

type KbHit = { id: string; title: string; category: string; stage: number | null; summary: string | null; tags: string[]; rank: number };

const KnowledgeSearch = () => {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<KbHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!q.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("search_sgom_knowledge", { q: q.trim(), match_count: 5 });
    if (error) toast.error("Search failed");
    setHits((data as KbHit[]) ?? []);
    setBusy(false);
  };
  return (
    <Card className="glass-card">
      <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> Knowledge base search (knowledge_search)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Same articles and ranking Upstrima receives from the knowledge_search method.</p>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(); }}>
          <Input placeholder="e.g. permeability gas" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
          <Button type="submit" disabled={busy}>Search</Button>
        </form>
        {hits && !hits.length && <p className="text-sm text-muted-foreground">No results</p>}
        {hits?.map((h) => (
          <div key={h.id} className="border border-border rounded-md p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{h.title}</span>
              <Badge variant="outline">{h.category}</Badge>
              {h.stage != null && <Badge variant="secondary">Stage {h.stage}</Badge>}
              <span className="text-xs text-muted-foreground">rank {Number(h.rank).toFixed(3)}</span>
            </div>
            {h.summary && <p className="text-sm text-muted-foreground mt-1">{h.summary}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpstrimaSandbox;
