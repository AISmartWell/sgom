import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, CheckCircle2, Loader2, AlertTriangle, ShieldCheck, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InterpretationSummary, PetroPoint } from "@/lib/petrophysics";

interface WellLite {
  id: string;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  total_depth: number | null;
}

interface AgentStep {
  key: string;
  title: string;
  finding: string;
  assessment: "positive" | "neutral" | "negative";
}

interface AgentConclusion {
  steps: AgentStep[];
  overall: {
    verdict: string;
    reservoir_rating: "excellent" | "good" | "fair" | "poor";
    net_pay_comment: string;
    spt_candidacy: string;
    risks: string[];
    confidence: number;
  };
}

// Local deterministic pipeline steps the agent "walks through" before reasoning
const PIPELINE_STEPS = [
  { key: "lithology", label: "Lithology segmentation (GR cutoffs)" },
  { key: "vshale", label: "Vshale — Larionov 1969" },
  { key: "porosity", label: "Porosity — DEN/NPHI" },
  { key: "archie", label: "Water saturation — Archie 1942" },
  { key: "timur", label: "Permeability — Timur" },
  { key: "fluid", label: "Fluid classification — Ko Ko rules" },
  { key: "reasoning", label: "AI expert reasoning (LLM)" },
];

const ratingColor: Record<string, string> = {
  excellent: "text-green-400 border-green-500/50",
  good: "text-emerald-400 border-emerald-500/50",
  fair: "text-amber-400 border-amber-500/50",
  poor: "text-red-400 border-red-500/50",
};

const assessIcon = (a: AgentStep["assessment"]) =>
  a === "positive" ? (
    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
  ) : a === "negative" ? (
    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
  ) : (
    <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
  );

interface Props {
  well: WellLite | null;
  petroData: PetroPoint[];
  interpretation: InterpretationSummary | null;
  onClose?: () => void;
  /** Persist the run into the agent run history table */
  persist?: boolean;
  onSaved?: () => void;
  headerExtra?: React.ReactNode;
}

const GeophysicsAgentPanel = ({ well, petroData, interpretation, onClose, persist = false, onSaved, headerExtra }: Props) => {
  const [phase, setPhase] = useState<"running" | "done" | "error">("running");
  const [stepIdx, setStepIdx] = useState(0);
  const [conclusion, setConclusion] = useState<AgentConclusion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const logStats = useMemo(() => {
    if (!petroData.length) return null;
    const depths = petroData.map((p) => p.depth);
    return {
      points: petroData.length,
      depth_top: Math.min(...depths),
      depth_bottom: Math.max(...depths),
      has_density: petroData.some((p) => p.rhob != null),
      has_neutron: petroData.some((p) => p.nphi != null),
    };
  }, [petroData]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!well || !interpretation) {
      setError("No interpreted data for the selected well.");
      setPhase("error");
      return;
    }

    // Animate the deterministic pipeline steps while the LLM reasons
    const timer = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, PIPELINE_STEPS.length - 1));
    }, 700);

    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("geophysics-agent", {
          body: {
            well_id: well.id,
            well,
            interpretation,
            intervals: interpretation.intervals,
            log_stats: logStats,
          },
        });
        if (fnError) {
          let detail = fnError.message;
          try {
            const ctx = (fnError as any).context;
            if (ctx && typeof ctx.text === "function") {
              const body = await ctx.text();
              const parsed = JSON.parse(body);
              if (parsed?.error) detail = parsed.error;
            }
          } catch { /* keep original message */ }
          throw new Error(detail);
        }
        if (data?.error) throw new Error(data.error);
        const conc = data.conclusion as AgentConclusion;
        setConclusion(conc);
        setStepIdx(PIPELINE_STEPS.length - 1);
        setPhase("done");

        if (persist) {
          const { error: insErr } = await supabase.from("geophysics_agent_runs").insert({
            well_id: well.id,
            well_name: well.well_name,
            api_number: well.api_number,
            formation: well.formation,
            reservoir_rating: conc.overall?.reservoir_rating ?? null,
            confidence: conc.overall?.confidence ?? null,
            conclusion: conc as any,
            log_stats: logStats as any,
            model: data.model ?? null,
          });
          if (insErr) {
            toast.error(`Run not saved to history: ${insErr.message}`);
          } else {
            onSaved?.();
          }
        }
      } catch (e) {
        setError((e as Error).message);
        setPhase("error");
      } finally {
        clearInterval(timer);
      }
    })();

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.round(((stepIdx + 1) / PIPELINE_STEPS.length) * 100);

  return (
    <Card className="glass-card border-primary/30 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Geophysical AI Agent
            <Badge variant="outline" className="text-primary border-primary/50 tech-label">
              STAGE 8 · AUTONOMOUS
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
          {headerExtra}
          {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {well?.well_name ?? "—"} {well?.api_number ? `· API ${well.api_number}` : ""} {well?.formation ? `· ${well.formation}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline walk-through */}
        <div className="space-y-1.5">
          {PIPELINE_STEPS.map((s, i) => {
            const done = phase === "done" || i < stepIdx;
            const active = phase !== "done" && i === stepIdx;
            return (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                )}
                <span className={done || active ? "text-foreground" : "text-muted-foreground/60"}>{s.label}</span>
              </div>
            );
          })}
          <Progress value={phase === "done" ? 100 : progress} className="h-1.5 mt-2" />
        </div>

        {phase === "error" && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Agent failed: {error}</span>
          </div>
        )}

        {phase === "done" && conclusion && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {/* Per-step findings */}
            <div className="grid gap-2">
              {conclusion.steps?.map((s) => (
                <div key={s.key} className="flex items-start gap-2 bg-background/40 border border-border/50 rounded-md p-3">
                  {assessIcon(s.assessment)}
                  <div>
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.finding}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall verdict */}
            <div className="border border-primary/30 rounded-md p-4 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Expert Conclusion</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={ratingColor[conclusion.overall.reservoir_rating] ?? ""}>
                    {conclusion.overall.reservoir_rating?.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    Confidence {Math.round((conclusion.overall.confidence ?? 0) * 100)}%
                  </Badge>
                </div>
              </div>
              <p className="text-sm">{conclusion.overall.verdict}</p>
              <p className="text-xs text-muted-foreground">{conclusion.overall.net_pay_comment}</p>
              <div className="text-xs border-l-2 border-primary/50 pl-3 py-1">
                <span className="font-mono text-primary">SPT: </span>
                {conclusion.overall.spt_candidacy}
              </div>
              {conclusion.overall.risks?.length > 0 && (
                <div className="text-xs space-y-1">
                  {conclusion.overall.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-amber-400/90">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeophysicsAgentPanel;
