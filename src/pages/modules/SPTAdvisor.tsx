import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Brain, Wrench, CheckCircle2, AlertTriangle, Sparkles, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

type TraceItem =
  | { step: number; kind: "tool"; name: string; args: any; ms: number; error: string | null; result_preview: string; result_full?: any }
  | { step: number; kind: "final"; content: string };

interface AdvisorResponse {
  ok: boolean;
  answer: any | null;
  raw: string | null;
  trace: TraceItem[];
  error?: string;
}

const DEFAULT_Q = "Pick the single best well in our company for SPT treatment, explain why with concrete numbers, list expected uplift and 2 alternatives.";

export default function SPTAdvisor() {
  const [question, setQuestion] = useState(DEFAULT_Q);
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<AdvisorResponse | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvedId, setApprovedId] = useState<string | null>(null);

  const approve = async () => {
    if (!resp?.answer?.recommended_well?.id) return;
    setApproving(true);
    try {
      const a = resp.answer;
      const forecast = (resp.trace.find((t: any) => t.kind === "tool" && t.name === "forecast_well") as any)?.result_full;
      const enrich = (resp.trace.find((t: any) => t.kind === "tool" && t.name === "enrich_well_metadata") as any)?.result_full;
      const adjusted = enrich?.confidence?.adjusted ?? a.recommended_well.confidence ?? null;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: uc } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user?.id ?? "")
        .limit(1)
        .maybeSingle();
      if (!uc?.company_id) throw new Error("No company assigned to user");

      const spt_depth = enrich?.filled?.total_depth ?? null;
      const p50 = forecast?.p50_qoil ?? forecast?.scenarios?.p50?.qoil ?? null;

      const { data, error } = await supabase
        .from("well_restorations")
        .insert({
          company_id: uc.company_id,
          well_id: a.recommended_well.id,
          source: "spt-advisor",
          spt_depth_ft: spt_depth,
          predicted_qoil: p50,
          arps_b_used: forecast?.arps_b ?? 0.5,
          arps_di_used: forecast?.arps_di ?? 0.00018,
          spt_multiplier_used: forecast?.spt_multiplier ?? 1.45,
          payload: {
            status: "planned",
            recommended_by: "spt-advisor/openai/gpt-5.2",
            score: a.recommended_well.score,
            confidence_raw: a.recommended_well.confidence,
            confidence_adjusted: adjusted,
            reasoning: a.reasoning,
            expected_uplift_bbl: a.expected_uplift_bbl,
            risks: a.risks,
            alternatives: a.alternatives,
            enrichment: a.enrichment,
            ood_flag: a.ood_flag,
            question,
          },
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      setApprovedId(data.id);
      toast.success(`Work order created · ${data.id.slice(0, 8)}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setApproving(false);
    }
  };

  const run = async () => {
    setLoading(true); setResp(null); setMs(null); setApprovedId(null);
    const t0 = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("spt-advisor", {
        body: { question, company_id: companyId.trim() || undefined },
      });
      setMs(Date.now() - t0);
      if (error) throw error;
      setResp(data as AdvisorResponse);
      if (!data?.ok) toast.error(data?.error || "Advisor failed");
      else toast.success("Recommendation ready");
    } catch (e: any) {
      toast.error(e.message);
      setResp({ ok: false, answer: null, raw: null, trace: [], error: e.message });
    } finally { setLoading(false); }
  };

  const a = resp?.answer;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-[10px]">Stage AI · Agent</Badge>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" /> SPT Advisor
        </h1>
        <Badge className="bg-primary/20 text-primary border-primary/30">openai/gpt-5.2 · tool-calling</Badge>
      </div>

      <p className="text-sm text-muted-foreground max-w-3xl">
        Autonomous agent that ranks wells, forecasts production with SPT uplift, runs an out-of-distribution check,
        and returns an explained recommendation with alternatives. All calls are real (no mocks).
      </p>

      <Card>
        <CardHeader><CardTitle className="text-base">Ask the advisor</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} />
          <div className="flex gap-2">
            <input
              placeholder="company_id (optional — leave empty = all wells)"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md font-mono"
            />
            <Button onClick={run} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              Run advisor
            </Button>
          </div>
        </CardContent>
      </Card>

      {a && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Recommendation
              </span>
              {a.ood_flag && (
                <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> OOD</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-md bg-muted/40">
                <div className="text-xs text-muted-foreground">Well</div>
                <div className="font-semibold">{a.recommended_well?.name}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{a.recommended_well?.id?.slice(0, 8)}</div>
              </div>
              <div className="p-3 rounded-md bg-muted/40">
                <div className="text-xs text-muted-foreground">SPT score</div>
                <div className="text-2xl font-bold text-primary">{a.recommended_well?.score}/100</div>
              </div>
              <div className="p-3 rounded-md bg-muted/40">
                <div className="text-xs text-muted-foreground">Confidence</div>
                <div className="text-2xl font-bold">{Math.round((a.recommended_well?.confidence ?? 0) * 100)}%</div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Reasoning</div>
              <p className="text-sm leading-relaxed">{a.reasoning}</p>
            </div>

            {typeof a.expected_uplift_bbl === "number" && (
              <div className="text-sm">Expected cumulative uplift: <span className="font-semibold text-primary">{a.expected_uplift_bbl.toLocaleString()} bbl</span></div>
            )}

            {a.risks?.length > 0 && (
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">Risks</div>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {a.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {a.alternatives?.length > 0 && (
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Alternatives</div>
                <div className="grid gap-2">
                  {a.alternatives.map((alt: any, i: number) => (
                    <div key={i} className="p-2 border border-border rounded-md flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{alt.name}</div>
                        <div className="text-xs text-muted-foreground">{alt.why}</div>
                      </div>
                      <Badge variant="outline">{alt.score}/100</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(() => {
              const enrichTrace = resp?.trace?.find((t: any) => t.kind === "tool" && t.name === "enrich_well_metadata" && t.result_full) as any;
              const attempts = enrichTrace?.result_full?.attempts as Record<string, string[]> | undefined;
              const e = a.enrichment;
              if (!e && !attempts) return null;
              return (
                <div className="p-3 rounded-md border border-border bg-muted/30 space-y-1">
                  <div className="text-xs uppercase text-muted-foreground">Enrichment</div>
                  {e?.filled?.length > 0 && (
                    <div className="text-sm">Filled: <span className="font-mono">{e.filled.join(", ")}</span></div>
                  )}
                  {e?.still_missing?.length > 0 && (
                    <div className="text-sm text-amber-500">Still missing: <span className="font-mono">{e.still_missing.join(", ")}</span></div>
                  )}
                  {e?.sources && Object.keys(e.sources).length > 0 && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {Object.entries(e.sources).map(([k, v]) => <div key={k}>{k} ← {String(v)}</div>)}
                    </div>
                  )}
                  {attempts && Object.values(attempts).some((arr) => arr.length > 0) && (
                    <div className="pt-2 mt-2 border-t border-border/60 space-y-0.5">
                      <div className="text-[10px] uppercase text-muted-foreground">Cascade trace (why fields stayed empty)</div>
                      {Object.entries(attempts).flatMap(([field, msgs]) =>
                        msgs.map((m, i) => (
                          <div key={`${field}-${i}`} className="text-xs font-mono text-muted-foreground">
                            <span className="text-amber-500/80">{field}</span> · {m}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="pt-3 mt-2 border-t border-border flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {approvedId
                  ? <>Saved as planned work order <span className="font-mono">{approvedId.slice(0, 8)}</span> in <code>well_restorations</code>.</>
                  : <>Approve to persist this recommendation as a <span className="font-mono">planned</span> record with the adjusted confidence.</>}
              </div>
              <Button onClick={approve} disabled={approving || !!approvedId} size="sm">
                {approving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
                {approvedId ? "Approved" : "Approve & create work order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="w-4 h-4" /> Agent trace
              {ms != null && <Badge variant="outline">{ms} ms</Badge>}
              <Badge variant="outline">{resp.trace.length} steps</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[420px] pr-3">
              <div className="space-y-2 text-xs font-mono">
                {resp.trace.map((t, i) => (
                  <div key={i} className="p-2 border border-border rounded-md">
                    {t.kind === "tool" ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={t.error ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}>
                            #{t.step} · {t.name}
                          </Badge>
                          <span className="text-muted-foreground">{t.ms}ms</span>
                          {t.error && <span className="text-destructive">{t.error}</span>}
                        </div>
                        <div className="text-muted-foreground">args: {JSON.stringify(t.args)}</div>
                        <div className="mt-1 text-foreground/80 break-all">{t.result_preview}…</div>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="mb-1">#{t.step} · final</Badge>
                        <pre className="whitespace-pre-wrap text-foreground/90">{t.content}</pre>
                      </>
                    )}
                  </div>
                ))}
                {!resp.trace.length && <div className="text-muted-foreground">No trace.</div>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
