import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Radar, Check, X, RefreshCw, MapPin, Sparkles, History, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  api_number: string | null;
  well_name: string | null;
  operator: string | null;
  state: string | null;
  county: string | null;
  formation: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_miles: number | null;
  score: number | null;
  reason: string | null;
  source: string | null;
  suggestion_status: string;
  created_at: string;
  company_id: string;
  well_type: string | null;
  status: string | null;
  total_depth: number | null;
  raw_data: any;
}

interface ScanRun {
  id: string;
  scan_run_id: string;
  status: string;
  radius_miles: number | null;
  seeds_count: number;
  suggestions_count: number;
  error_message: string | null;
  created_at: string;
}

export default function AutonomousScan() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [lastRun, setLastRun] = useState<any>(null);
  const [runs, setRuns] = useState<ScanRun[]>([]);

  const loadRuns = async () => {
    const { data } = await supabase
      .from("registry_scan_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    setRuns((data as ScanRun[]) || []);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("registry_scan_suggestions")
      .select("*")
      .eq("suggestion_status", "pending")
      .order("score", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setItems((data as Suggestion[]) || []);
    await loadRuns();
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: uc } = await supabase
        .from("user_companies").select("company_id")
        .eq("user_id", user?.id ?? "").limit(1).maybeSingle();
      const { data, error } = await supabase.functions.invoke("autonomous-registry-scan", {
        body: { company_id: uc?.company_id, radius_miles: 5, max_seeds: 10, limit_per_seed: 100 },
      });
      if (error) throw error;
      setLastRun(data);
      const total = data?.results?.reduce((s: number, r: any) => s + (r.suggestions || 0), 0) ?? 0;
      toast.success(`Scan complete · ${total} new candidates found`);
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setScanning(false); }
  };

  const importOne = async (s: Suggestion) => {
    try {
      const { error: insErr } = await supabase.from("wells").insert({
        company_id: s.company_id,
        api_number: s.api_number,
        well_name: s.well_name,
        operator: s.operator,
        well_type: s.well_type,
        status: s.status,
        county: s.county,
        state: s.state ?? "OK",
        latitude: s.latitude,
        longitude: s.longitude,
        total_depth: s.total_depth,
        formation: s.formation,
        source: s.source ?? "auto-scan",
        raw_data: s.raw_data,
      });
      if (insErr) throw insErr;
      await supabase.from("registry_scan_suggestions").update({ suggestion_status: "imported" }).eq("id", s.id);
      setItems((prev) => prev.filter((x) => x.id !== s.id));
      toast.success(`${s.well_name ?? s.api_number} imported`);
    } catch (e: any) { toast.error(e.message); }
  };

  const dismissOne = async (s: Suggestion) => {
    await supabase.from("registry_scan_suggestions").update({ suggestion_status: "dismissed" }).eq("id", s.id);
    setItems((prev) => prev.filter((x) => x.id !== s.id));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-[10px]">Stage AI · Autonomous</Badge>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Radar className="w-7 h-7 text-primary" /> Autonomous Registry Scan
        </h1>
        <Badge className="bg-primary/20 text-primary border-primary/30">Level 1 · Semi-autonomous</Badge>
      </div>
      <p className="text-sm text-muted-foreground max-w-3xl">
        The agent inspects state registries (OK, TX, KS, NM, CO, ND, WY) around each well in your portfolio,
        ranks the newly discovered candidates by proximity, formation match, and status, then queues them here
        for approval. Nothing is added to your portfolio without a manual click.
      </p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Scan controls</CardTitle>
            <div className="text-xs text-muted-foreground mt-1">Radius 5 mi · up to 10 seed wells · top-50 by score</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button onClick={runScan} disabled={scanning}>
              {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {scanning ? "Scanning registries…" : "Run scan now"}
            </Button>
          </div>
        </CardHeader>
        {lastRun && (
          <CardContent className="text-xs font-mono text-muted-foreground">
            run <span className="text-foreground">{lastRun.scan_run_id?.slice(0, 8)}</span> · radius {lastRun.radius_miles} mi ·
            {" "}{lastRun.results?.length ?? 0} companies scanned
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Run history
            </span>
            <Badge variant="outline">{runs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">
              No runs yet. Click <span className="font-semibold">Run scan now</span> above.
            </div>
          ) : (
            <ScrollArea className="h-[240px] pr-3">
              <div className="space-y-1.5">
                {runs.map((r) => {
                  const ok = r.status === "ok";
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border/60 hover:bg-muted/30 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        )}
                        <span className="font-mono text-muted-foreground shrink-0">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            ok
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-destructive/10 text-destructive border-destructive/30"
                          }`}
                        >
                          {ok ? "OK" : "ERROR"}
                        </Badge>
                        {r.error_message && (
                          <span className="text-destructive truncate">{r.error_message}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                        {r.radius_miles != null && <span>r={r.radius_miles} mi</span>}
                        <span>· {r.seeds_count} seeds</span>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                          {r.suggestions_count} found
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Pending suggestions</span>
            <Badge variant="outline">{items.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[560px] pr-3">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                No pending suggestions. Click <span className="font-semibold">Run scan now</span> to let the agent search state registries.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((s) => (
                  <div key={s.id} className="p-3 border border-border rounded-md flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{s.well_name || "Unnamed"}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{s.api_number}</Badge>
                        <Badge variant="outline" className="text-[10px]">{s.source}</Badge>
                        {s.status && <Badge variant="outline" className="text-[10px]">{s.status}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span>{s.operator}</span>
                        {s.county && <span>· {s.county}, {s.state}</span>}
                        {s.formation && <span>· {s.formation}</span>}
                        {s.latitude != null && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.latitude.toFixed(3)}, {s.longitude?.toFixed(3)}</span>
                        )}
                      </div>
                      <div className="text-xs text-primary/80 mt-1 font-mono">{s.reason}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {Math.round((s.score ?? 0) * 100)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => dismissOne(s)}>
                          <X className="w-3 h-3 mr-1" /> Dismiss
                        </Button>
                        <Button size="sm" onClick={() => importOne(s)}>
                          <Check className="w-3 h-3 mr-1" /> Import
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
