import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, History, Activity, Send, Loader2 } from "lucide-react";
import { useModelParameters, useCalibrationAudit } from "@/hooks/useModelParameters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = { scopeType?: "well" | "formation" | "global"; scopeKey: string; compact?: boolean };

export function AutoCalibratedBadge({ scopeType = "well", scopeKey, compact = false }: Props) {
  const { params, refresh } = useModelParameters(scopeType, scopeKey);
  const audit = useCalibrationAudit(scopeKey, 15);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<{ ok: boolean; status?: number; durationMs: number; body: unknown; requestBody: unknown; at: string } | null>(null);

  async function sendTestRestoration() {
    setSending(true);
    try {
      const predicted = 120 + Math.round((Math.random() - 0.5) * 20);
      const actual = predicted + Math.round((Math.random() - 0.3) * 30);
      const { data, error } = await supabase.functions.invoke("ingest-restoration", {
        body: {
          well_external_ref: scopeType === "well" ? scopeKey : null,
          formation_key: scopeType === "formation" ? scopeKey : null,
          predicted_qoil: predicted,
          actual_qoil: actual,
          arps_b_used: Number(params?.arps_b ?? 0.5),
          arps_di_used: Number(params?.arps_di ?? 0.00018),
          spt_multiplier_used: Number(params?.spt_multiplier ?? 1.45),
          spt_depth_ft: 4200,
          oil_price: 75,
          source: "ui_test_button",
        },
      });
      if (error) throw error;
      toast.success(`Calibrated · MAPE ${((data?.mape ?? 0) * 100).toFixed(1)}%`, {
        description: `b: ${data?.before?.arps_b?.toFixed(3)} → ${data?.after?.arps_b?.toFixed(3)} · spt: ${data?.before?.spt_multiplier?.toFixed(3)} → ${data?.after?.spt_multiplier?.toFixed(3)}`,
      });
      refresh();
    } catch (e: unknown) {
      toast.error("Calibration failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setSending(false);
    }
  }

  const confidence = params?.confidence ?? 50;
  const samples = params?.sample_count ?? 0;
  const isCalibrated = samples > 0;
  const stdB = params ? Math.sqrt(Number(params.arps_b_variance)) : 0.2;
  const stdSpt = params ? Math.sqrt(Number(params.spt_multiplier_variance)) : 0.22;

  const tone =
    confidence >= 85 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" :
    confidence >= 65 ? "bg-amber-500/15 text-amber-300 border-amber-500/40" :
                       "bg-rose-500/15 text-rose-300 border-rose-500/40";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 px-2.5 py-1 rounded border text-[10px] uppercase tracking-wider transition-colors",
            tone, "hover:brightness-125"
          )}
          title="Model parameters auto-calibrated by Bayesian update. Click for details."
        >
          <Sparkles className="h-3 w-3" />
          {isCalibrated ? "Auto-calibrated" : "Prior (uncalibrated)"}
          <span className="font-mono normal-case tracking-normal">
            · conf {confidence.toFixed(0)}% · n={samples}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Model calibration · {scopeType}:{scopeKey}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Stat label="Confidence" value={`${confidence.toFixed(1)}%`} />
          <Stat label="Samples" value={String(samples)} />
          <Stat label="Arps b" value={params ? `${Number(params.arps_b).toFixed(3)} ± ${stdB.toFixed(3)}` : "—"} />
          <Stat label="SPT mult" value={params ? `${Number(params.spt_multiplier).toFixed(3)} ± ${stdSpt.toFixed(3)}` : "—"} />
          <Stat label="Arps Di" value={params ? Number(params.arps_di).toExponential(2) : "—"} />
          <Stat label="Model" value={params?.model_version ?? "—"} />
          <Stat label="Last calibrated" value={params?.last_calibrated_at ? new Date(params.last_calibrated_at).toLocaleString() : "never"} />
          <Stat label="Method" value="Bayesian 1-D" />
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <History className="h-3.5 w-3.5" /> Recent calibration audit · last {audit.length}
          </div>
          {audit.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center border border-border/40 rounded">
              No calibrations yet. POST data to <code className="text-primary">/functions/v1/ingest-restoration</code> to start auto-tuning.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto border border-border/40 rounded divide-y divide-border/30">
              {audit.map((a) => {
                const before = a.before_state as { arps_b?: number; spt_multiplier?: number; confidence?: number };
                const after = a.after_state as { arps_b?: number; spt_multiplier?: number; confidence?: number };
                return (
                  <div key={a.id} className="p-2.5 text-[11px] font-mono grid grid-cols-12 gap-2">
                    <div className="col-span-3 text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                    <div className="col-span-3">
                      b: {before.arps_b?.toFixed(3)} → <span className="text-primary">{after.arps_b?.toFixed(3)}</span>
                    </div>
                    <div className="col-span-3">
                      spt: {before.spt_multiplier?.toFixed(3)} → <span className="text-primary">{after.spt_multiplier?.toFixed(3)}</span>
                    </div>
                    <div className="col-span-3 text-right">
                      MAPE {((a.mape ?? 0) * 100).toFixed(1)}% · Δconf {(a.confidence_delta ?? 0).toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[10px] text-muted-foreground flex-1">
            <Badge variant="outline" className="mr-2">Bayesian 1-D update</Badge>
            μ′ = (μ·r² + z·σ²)/(σ²+r²), σ′² = σ²·r²/(σ²+r²)
          </div>
          <a href="/dashboard/ingest-diagnostics" target="_blank" rel="noreferrer" className="text-[10px] underline text-primary shrink-0">Open diagnostics ↗</a>
          <Button size="sm" onClick={sendTestRestoration} disabled={sending} className="shrink-0">
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send test restoration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-card/60 border border-border/40 rounded">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-mono mt-0.5">{value}</div>
    </div>
  );
}
