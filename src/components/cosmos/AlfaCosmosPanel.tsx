import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { callCosmos, type CosmosResponse } from "./useCosmosInference";

interface ReasonResult {
  score: number;
  verdict: string;
  uplift_bbl_d: number;
  post_spt_oil: number;
  key_reasons: string[];
  summary: string;
}
interface PredictResult {
  pre_spt_bbl_d: number;
  post_spt_bbl_d: number;
  uplift_bbl_d: number;
  decline_rate_per_year: number;
  expected_eur_uplift_bbl: number;
  confidence: number;
  physics_notes: string;
}
interface TransferZone {
  name: string;
  thickness_ft: number;
  porosity_pct: number;
  sw_pct: number;
}
interface TransferResult {
  formation: string;
  depth_range_ft: number[];
  synthetic_zones: TransferZone[];
  augmentation_factor: number;
  notes: string;
}

// Only values transcribed from the SLB document — no platform records exist for this well yet.
const ALFA_WELL = {
  name: "SLB Slotted Liner Case (Alfa)",
  formation: "Alfa tight gas sand (slotted liner completion)",
  depth: 14777,
  // Gas well: oil rate, water cut and GOR are not reported in the SLB document — sent as unknown, not zero.
  oil: null,
  waterCut: null,
  gor: null,
  fluid: "gas",
  porosity: 7,
  permeability: 0.4,
  status: "Active",
};

const ALFA_CONTEXT = `Deep GAS well, 14,777 ft (~4,504 m), ~10,300 psi BH pressure on PLT track (TO CONFIRM), est. BHT 130-160 C. 7" casing to 4,503.8 m, slotted liner 4,379-4,503 m; pay 4,350-4,495 m (net 63 m of 145 m gross), porosity ~7%, Sw ~37%, k ~0.4 mD (tight gas sand). Poor cement 4,249-4,368 m; 82% of gas inflow enters through a behind-casing channel ABOVE the liner top (bypassed pay); ~49 m of pay above liner. No LAS curves, no rate history, gas composition (H2S/CO2) unknown. SPT case library covers depths up to ~5,400 ft only - this well is far outside it. Assess SPT candidacy for a gas well: hydro-slotting clears liner slots and near-wellbore damage; isolating the channel is a separate decision (only if it carries water).`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry AI requests 3x with exponential backoff (project reliability rule). */
async function callWithRetry<T>(mode: "reason" | "predict" | "transfer", retries = 3): Promise<CosmosResponse<T> | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await callCosmos<T>(
      mode,
      // reason mode scores only the well payload + `context`; predict/transfer use `prompt`.
      mode === "reason" ? { well: ALFA_WELL, context: ALFA_CONTEXT } : { well: ALFA_WELL, prompt: ALFA_CONTEXT },
    );
    if (res) return res;
    if (attempt < retries - 1) await sleep(1000 * 2 ** attempt);
  }
  return null;
}

const verdictStyle = (v: string) =>
  v === "recommended"
    ? "border-success/40 text-success"
    : v === "not_recommended"
    ? "border-destructive/40 text-destructive"
    : "border-warning/40 text-warning";

const verdictLabel = (v: string) => v.replace(/_/g, " ");

function CosBadge({ live }: { live: boolean }) {
  return live ? (
    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
      <Cpu className="h-3 w-3 mr-1" /> COSMOS · LIVE RUN
    </Badge>
  ) : (
    <Badge variant="outline" className="text-[10px]">NOT RUN</Badge>
  );
}

export default function AlfaCosmosPanel() {
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [reason, setReason] = useState<CosmosResponse<ReasonResult> | null>(null);
  const [predict, setPredict] = useState<CosmosResponse<PredictResult> | null>(null);
  const [transfer, setTransfer] = useState<CosmosResponse<TransferResult> | null>(null);

  const run = async () => {
    setRunning(true);
    setFailed(null);
    const [r, p, t] = await Promise.all([
      callWithRetry<ReasonResult>("reason"),
      callWithRetry<PredictResult>("predict"),
      callWithRetry<TransferResult>("transfer"),
    ]);
    setReason(r);
    setPredict(p);
    setTransfer(t);
    if (!r && !p && !t) setFailed("NVIDIA Cosmos is unreachable right now. The static review above stays valid — try again later.");
    setRunning(false);
  };

  return (
    <Card className="glass-card" data-pdf-skip>
      <CardHeader>
        <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" />NVIDIA Cosmos — live model run on this well</span>
          <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10" onClick={run} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {running ? "Running…" : "Run Cosmos"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border/40 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span>
            Explicit, user-initiated run. Input is the transcribed SLB document values only — no LAS, rates or platform records exist yet, so every output below is an
            <b> AI interpretation for discussion, not a measured analysis</b>. This panel is excluded from the PDF export.
          </span>
        </div>

        {failed && (
          <div className="text-sm text-destructive border border-destructive/40 rounded-lg p-3">{failed}</div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Cosmos Reason */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm flex justify-between items-center">Cosmos Reason · SPT verdict <CosBadge live={!!reason} /></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!reason ? (
                <p className="text-muted-foreground text-xs py-6 text-center">Not run yet — press “Run Cosmos”.</p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold font-mono text-primary">{reason.result.score}<span className="text-sm text-muted-foreground">/100</span></div>
                    <Badge variant="outline" className={`text-[10px] ${verdictStyle(reason.result.verdict)}`}>{verdictLabel(reason.result.verdict)}</Badge>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                    {(reason.result.key_reasons ?? []).slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                  <p className="text-xs border-t border-border/40 pt-2">{reason.result.summary}</p>
                  <p className="text-[10px] text-muted-foreground">Model: {reason.model}</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cosmos Predict */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm flex justify-between items-center">Cosmos Predict · post-SPT forecast <CosBadge live={!!predict} /></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!predict ? (
                <p className="text-muted-foreground text-xs py-6 text-center">Not run yet — press “Run Cosmos”.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="glass-card rounded p-2"><div className="text-muted-foreground">Uplift</div><div className="font-mono font-bold">{predict.result.uplift_bbl_d} bbl/d</div></div>
                    <div className="glass-card rounded p-2"><div className="text-muted-foreground">Post-SPT rate</div><div className="font-mono font-bold">{predict.result.post_spt_bbl_d} bbl/d</div></div>
                    <div className="glass-card rounded p-2"><div className="text-muted-foreground">Decline</div><div className="font-mono font-bold">{predict.result.decline_rate_per_year}/yr</div></div>
                    <div className="glass-card rounded p-2"><div className="text-muted-foreground">Confidence</div><div className="font-mono font-bold">{typeof predict.result.confidence === "number" ? (predict.result.confidence * 100).toFixed(0) : predict.result.confidence}%</div></div>
                  </div>
                  <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">{predict.result.physics_notes}</p>
                  <p className="text-[10px] text-warning">Conditional: SPT case library tops out near 5,400 ft — this forecast is an extrapolation far outside it.</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cosmos Transfer */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm flex justify-between items-center">Cosmos Transfer · synthetic log <CosBadge live={!!transfer} /></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!transfer ? (
                <p className="text-muted-foreground text-xs py-6 text-center">Not run yet — press “Run Cosmos”.</p>
              ) : (
                <>
                  <table className="w-full text-xs">
                    <thead className="text-muted-foreground text-left"><tr><th className="py-1">Zone</th><th>ft</th><th>φ %</th><th>Sw %</th></tr></thead>
                    <tbody>
                      {(transfer.result.synthetic_zones ?? []).slice(0, 5).map((z, i) => (
                        <tr key={i} className="border-t border-border/30">
                          <td className="py-1">{z.name}</td>
                          <td className="font-mono">{z.thickness_ft}</td>
                          <td className="font-mono">{z.porosity_pct}</td>
                          <td className="font-mono">{z.sw_pct}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-muted-foreground">{transfer.result.notes}</p>
                  <p className="text-[10px] text-destructive">SYNTHETIC — model-generated values, never measured data. A placeholder for augmentation only; the real LAS remains required.</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
