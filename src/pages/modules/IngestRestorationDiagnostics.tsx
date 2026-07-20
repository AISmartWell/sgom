import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Send, AlertTriangle, CheckCircle2, Activity, Database, History, Wand2, Layers } from "lucide-react";
import { toast } from "sonner";
import { buildAttributionModel, normState, type OcrLite } from "@/lib/formation-attribution";
import type { FormationCode } from "@/hooks/useFormationCodes";

type Restoration = {
  id: string; created_at: string; well_external_ref: string | null; well_id: string | null;
  predicted_qoil: number | null; actual_qoil: number | null;
  arps_b_used: number | null; spt_multiplier_used: number | null;
  processed: boolean; processed_at: string | null; source: string; payload: Record<string, unknown>;
};
type AuditRow = {
  id: string; created_at: string; scope_type: string | null; scope_key: string | null;
  method: string; mape: number | null; residual: number | null; confidence_delta: number | null;
  before_state: Record<string, number>; after_state: Record<string, number>;
  input_summary: Record<string, unknown>;
};
type ParamRow = {
  id: string; scope_type: string; scope_key: string;
  arps_b: number; arps_b_variance: number; spt_multiplier: number; spt_multiplier_variance: number;
  confidence: number; sample_count: number; last_calibrated_at: string | null; model_version: string;
};

export default function IngestRestorationDiagnostics() {
  const [restorations, setRestorations] = useState<Restoration[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [params, setParams] = useState<ParamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // test form
  const [scopeKey, setScopeKey] = useState("DEMO-001");
  const [predicted, setPredicted] = useState(120);
  const [actual, setActual] = useState(135);
  const [sending, setSending] = useState(false);
  const [lastCall, setLastCall] = useState<{ ok: boolean; ms: number; response: unknown; error?: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [r, a, p] = await Promise.all([
      supabase.from("well_restorations").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("calibration_audit").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("model_parameters").select("*").order("last_calibrated_at", { ascending: false, nullsFirst: false }).limit(30),
    ]);
    if (r.data) setRestorations(r.data as unknown as Restoration[]);
    if (a.data) setAudit(a.data as unknown as AuditRow[]);
    if (p.data) setParams(p.data as unknown as ParamRow[]);
    if (r.error) toast.error("well_restorations: " + r.error.message);
    if (a.error) toast.error("calibration_audit: " + a.error.message);
    if (p.error) toast.error("model_parameters: " + p.error.message);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [autoRefresh, refresh]);

  async function sendTest() {
    setSending(true);
    setLastCall(null);
    const started = performance.now();
    try {
      const { data, error } = await supabase.functions.invoke("ingest-restoration", {
        body: {
          well_external_ref: scopeKey,
          predicted_qoil: Number(predicted),
          actual_qoil: Number(actual),
          arps_b_used: 0.5,
          arps_di_used: 0.00018,
          spt_multiplier_used: 1.45,
          spt_depth_ft: 4200,
          oil_price: 75,
          source: "diagnostics_ui",
        },
      });
      const ms = Math.round(performance.now() - started);
      if (error) {
        setLastCall({ ok: false, ms, response: data, error: error.message });
        toast.error(`ingest-restoration failed in ${ms}ms`, { description: error.message });
      } else {
        setLastCall({ ok: true, ms, response: data });
        toast.success(`OK in ${ms}ms · MAPE ${((data?.mape ?? 0) * 100).toFixed(1)}%`);
      }
      refresh();
    } catch (e) {
      const ms = Math.round(performance.now() - started);
      const msg = e instanceof Error ? e.message : String(e);
      setLastCall({ ok: false, ms, response: null, error: msg });
      toast.error("Invoke threw: " + msg);
    } finally {
      setSending(false);
    }
  }

  const [attributing, setAttributing] = useState(false);
  const [attributionLog, setAttributionLog] = useState<
    { ref: string; state?: string; county?: string; formation?: string; score?: number; note?: string }[]
  >([]);

  async function autoAttributeFormations() {
    setAttributing(true);
    setAttributionLog([]);
    const log: typeof attributionLog = [];
    try {
      const { data: rows, error } = await supabase
        .from("well_restorations")
        .select("id, well_id, well_external_ref, payload")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!rows?.length) {
        toast.info("No restoration rows to attribute");
        return;
      }

      // Preload wells referenced by well_id
      const wellIds = Array.from(new Set(rows.map((r) => r.well_id).filter(Boolean))) as string[];
      const wellsById = new Map<string, { state?: string; county?: string; total_depth?: number; formation?: string; well_name?: string }>();
      if (wellIds.length) {
        const { data: ws } = await supabase
          .from("wells")
          .select("id, state, county, total_depth, formation, well_name")
          .in("id", wellIds);
        (ws ?? []).forEach((w: any) => wellsById.set(w.id, w));
      }

      // Cache registry per state
      const registryCache = new Map<string, FormationCode[]>();
      async function getRegistry(stateCode: string): Promise<FormationCode[]> {
        if (registryCache.has(stateCode)) return registryCache.get(stateCode)!;
        const { data } = await supabase
          .from("formation_codes")
          .select("*")
          .eq("state_code", stateCode);
        const list = (data ?? []) as FormationCode[];
        registryCache.set(stateCode, list);
        return list;
      }

      let updated = 0;
      for (const r of rows) {
        const payload = (r.payload ?? {}) as Record<string, any>;
        const well = r.well_id ? wellsById.get(r.well_id) : undefined;
        const stateRaw = payload.state ?? well?.state;
        const countyRaw = payload.county ?? well?.county;
        const depthTop = payload.depth_top_ft ?? payload.spt_depth_ft ?? null;
        const depthBot = payload.depth_bottom_ft ?? well?.total_depth ?? null;
        const curves: string[] = payload.logged_curves ?? [];
        const tops = payload.formation_tops ?? [];

        const stateCode = normState(stateRaw);
        const ref = r.well_external_ref ?? well?.well_name ?? r.id.slice(0, 8);
        if (!stateCode) {
          log.push({ ref, note: "no state → skipped" });
          continue;
        }
        const registry = await getRegistry(stateCode);
        if (!registry.length) {
          log.push({ ref, state: stateCode, note: "no registry rows for state" });
          continue;
        }
        const ocr: OcrLite = {
          state: stateCode,
          county: countyRaw,
          depth_range_ft: { top: depthTop, bottom: depthBot },
          logged_curves: curves,
          formation_tops: tops,
        };
        const model = buildAttributionModel(ocr, registry);
        if (!model) {
          log.push({ ref, state: stateCode, county: countyRaw, note: "no candidates" });
          continue;
        }
        const winner = model.candidates[model.winner];
        const newPayload = {
          ...payload,
          formation: winner.formation,
          formation_attribution: {
            method: "algorithmic",
            algo: "formation-attribution/v1",
            state: stateCode,
            county: countyRaw ?? null,
            score: model.scores[model.winner],
            candidates: model.candidates.map((c, i) => ({
              formation: c.formation,
              basin: c.basin,
              score: model.scores[i],
              selected: i === model.winner,
            })),
            evidence: model.evidence.map((e) => ({
              source: e.source,
              signal: e.signal,
              ocr_field: e.ocrField,
              delta: e.perCandidate?.[model.winner] ?? e.delta,
            })),
            computed_at: new Date().toISOString(),
          },
        };
        const { error: upErr } = await supabase
          .from("well_restorations")
          .update({ payload: newPayload })
          .eq("id", r.id);
        if (upErr) {
          log.push({ ref, note: `update failed: ${upErr.message}` });
          continue;
        }
        updated++;
        log.push({
          ref,
          state: stateCode,
          county: countyRaw,
          formation: winner.formation ?? undefined,
          score: model.scores[model.winner],
        });
      }
      setAttributionLog(log);
      toast.success(`Auto-attribution complete: ${updated}/${rows.length} rows updated`);
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Auto-attribution failed: " + msg);
    } finally {
      setAttributing(false);
    }
  }

  const failedRestorations = restorations.filter((r) => !r.processed);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            ingest-restoration · Live Diagnostics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time view of well_restorations, model_parameters and calibration_audit. Send synthetic payloads and inspect full edge-function responses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh((v) => !v)}>
            {autoRefresh ? "Auto-refresh: ON (5s)" : "Auto-refresh: OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Database className="h-4 w-4" />} label="Restorations" value={restorations.length} />
        <Kpi icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} label="Processed" value={restorations.filter(r => r.processed).length} />
        <Kpi icon={<AlertTriangle className="h-4 w-4 text-rose-400" />} label="Failed / unprocessed" value={failedRestorations.length} tone={failedRestorations.length > 0 ? "danger" : "ok"} />
        <Kpi icon={<History className="h-4 w-4" />} label="Calibration events" value={audit.length} />
      </div>

      {/* Test form */}
      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Send synthetic restoration</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs">well_external_ref</Label>
            <Input value={scopeKey} onChange={(e) => setScopeKey(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">predicted_qoil</Label>
            <Input type="number" value={predicted} onChange={(e) => setPredicted(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">actual_qoil</Label>
            <Input type="number" value={actual} onChange={(e) => setActual(Number(e.target.value))} />
          </div>
          <Button onClick={sendTest} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Invoke edge function
          </Button>
        </div>
        {lastCall && (
          <div className={`mt-4 p-3 rounded border text-xs font-mono ${lastCall.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"}`}>
            <div className="flex items-center gap-2 mb-2">
              {lastCall.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}
              <span>{lastCall.ok ? "200 OK" : "ERROR"} · {lastCall.ms} ms</span>
            </div>
            {lastCall.error && <div className="text-rose-300 mb-2">error: {lastCall.error}</div>}
            <pre className="max-h-72 overflow-auto text-[11px]">{JSON.stringify(lastCall.response, null, 2)}</pre>
          </div>
        )}
      </Card>

      <Tabs defaultValue="restorations">
        <TabsList>
          <TabsTrigger value="restorations">Restorations ({restorations.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit ({audit.length})</TabsTrigger>
          <TabsTrigger value="params">Model Parameters ({params.length})</TabsTrigger>
          <TabsTrigger value="errors">Errors ({failedRestorations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="restorations">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Well</TableHead>
                  <TableHead>Predicted</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>b · spt</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restorations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{r.well_external_ref ?? r.well_id ?? "—"}</TableCell>
                    <TableCell>{r.predicted_qoil}</TableCell>
                    <TableCell>{r.actual_qoil}</TableCell>
                    <TableCell className="font-mono text-xs">{Number(r.arps_b_used).toFixed(3)} · {Number(r.spt_multiplier_used).toFixed(3)}</TableCell>
                    <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                    <TableCell>
                      {r.processed
                        ? <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/40">processed</Badge>
                        : <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/40">pending/failed</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
                {restorations.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No restorations yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>b: before → after</TableHead>
                  <TableHead>spt: before → after</TableHead>
                  <TableHead>MAPE</TableHead>
                  <TableHead>Δconf</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{new Date(a.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{a.scope_type}:{a.scope_key}</TableCell>
                    <TableCell className="font-mono text-xs">{Number(a.before_state?.arps_b).toFixed(3)} → <span className="text-primary">{Number(a.after_state?.arps_b).toFixed(3)}</span></TableCell>
                    <TableCell className="font-mono text-xs">{Number(a.before_state?.spt_multiplier).toFixed(3)} → <span className="text-primary">{Number(a.after_state?.spt_multiplier).toFixed(3)}</span></TableCell>
                    <TableCell>{((a.mape ?? 0) * 100).toFixed(1)}%</TableCell>
                    <TableCell>{(a.confidence_delta ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {audit.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No calibration events</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="params">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Arps b ± σ</TableHead>
                  <TableHead>SPT mult ± σ</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Samples</TableHead>
                  <TableHead>Last calibrated</TableHead>
                  <TableHead>Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {params.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.scope_type}:{p.scope_key}</TableCell>
                    <TableCell className="font-mono text-xs">{Number(p.arps_b).toFixed(3)} ± {Math.sqrt(Number(p.arps_b_variance)).toFixed(3)}</TableCell>
                    <TableCell className="font-mono text-xs">{Number(p.spt_multiplier).toFixed(3)} ± {Math.sqrt(Number(p.spt_multiplier_variance)).toFixed(3)}</TableCell>
                    <TableCell>{Number(p.confidence).toFixed(1)}%</TableCell>
                    <TableCell>{p.sample_count}</TableCell>
                    <TableCell className="font-mono text-xs">{p.last_calibrated_at ? new Date(p.last_calibrated_at).toLocaleString() : "never"}</TableCell>
                    <TableCell><Badge variant="outline">{p.model_version}</Badge></TableCell>
                  </TableRow>
                ))}
                {params.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No calibrated scopes</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-3">
              Записи в <code>well_restorations</code> с <code>processed = false</code>. Edge function вставляет строку первой, и помечает <code>processed=true</code> только после успешного Bayesian-апдейта и записи в <code>model_parameters</code>/<code>calibration_audit</code>. Если строка осталась unprocessed — апдейт упал.
            </div>
            {failedRestorations.length === 0 ? (
              <div className="text-center text-emerald-300 py-6 text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> No failed restorations — all rows fully processed
              </div>
            ) : (
              <div className="space-y-2">
                {failedRestorations.map((r) => (
                  <div key={r.id} className="p-3 border border-rose-500/40 bg-rose-500/5 rounded text-xs font-mono">
                    <div className="flex justify-between mb-1">
                      <span>{r.id}</span>
                      <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <div>well: {r.well_external_ref ?? r.well_id ?? "—"} · pred {r.predicted_qoil} / act {r.actual_qoil} · source {r.source}</div>
                    {r.payload && Object.keys(r.payload).length > 0 && (
                      <pre className="mt-2 text-[10px] opacity-70 max-h-32 overflow-auto">{JSON.stringify(r.payload, null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: "ok" | "danger" }) {
  return (
    <Card className={`p-3 ${tone === "danger" ? "border-rose-500/40" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="text-2xl font-mono mt-1">{value}</div>
    </Card>
  );
}
