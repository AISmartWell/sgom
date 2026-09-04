import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Bot, CheckCircle2, Loader2, MinusCircle, User, X, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

type Match = "match" | "partial" | "mismatch";

interface Row {
  key: string;
  label: string;
  /** Deterministic engine (human methodology) statement */
  human: string;
  /** Reference numbers the agent is expected to reproduce */
  refs: { value: number; tol: number; unit?: string }[];
  /** Engine's own qualitative call */
  humanAssessment: "positive" | "neutral" | "negative";
}

const STEP_LABELS: Record<string, string> = {
  lithology: "Lithology segmentation (GR cutoffs)",
  vshale: "Vshale — Larionov / linear",
  porosity: "Porosity — DEN / NPHI",
  archie: "Water saturation — Archie 1942",
  timur: "Permeability — Timur",
  fluid: "Fluid classification — Ko Ko rules",
  netpay: "Net Pay / N:G summary",
};

const matchMeta: Record<Match, { label: string; cls: string; icon: JSX.Element }> = {
  match: {
    label: "MATCH",
    cls: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  },
  partial: {
    label: "PARTIAL",
    cls: "text-amber-400 border-amber-500/50 bg-amber-500/10",
    icon: <MinusCircle className="h-4 w-4 text-amber-400" />,
  },
  mismatch: {
    label: "MISMATCH",
    cls: "text-red-400 border-red-500/50 bg-red-500/10",
    icon: <XCircle className="h-4 w-4 text-red-400" />,
  },
};

const extractNumbers = (text: string): number[] =>
  (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

/** Does the agent text reproduce a reference value within tolerance? */
const reproduces = (text: string, ref: { value: number; tol: number }) => {
  const nums = extractNumbers(text);
  return nums.some((n) => Math.abs(n - ref.value) <= ref.tol);
};

const AgentHumanComparison = ({
  well,
  petroData,
  interpretation,
  onClose,
}: {
  well: WellLite | null;
  petroData: PetroPoint[];
  interpretation: InterpretationSummary | null;
  onClose?: () => void;
}) => {
  const [phase, setPhase] = useState<"running" | "done" | "error">("running");
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

  /* ── Deterministic (human methodology) reference rows ── */
  const humanRows = useMemo<Row[]>(() => {
    if (!interpretation) return [];
    const iv = interpretation.intervals;
    const n = iv.length || 1;
    const sand = iv.filter((i) => i.avgGR <= 45).length;
    const shale = iv.filter((i) => i.avgGR > 75).length;
    const silt = n - sand - shale;
    const avgVsh = iv.reduce((s, i) => s + i.vshale, 0) / n;
    const perms = iv.map((i) => i.timurPermMd).filter((v): v is number => v != null);
    const avgPerm = perms.length ? perms.reduce((s, v) => s + v, 0) / perms.length : 0;
    const payCount = iv.filter((i) => i.isNetPay).length;

    return [
      {
        key: "lithology",
        label: STEP_LABELS.lithology,
        human: `${n} intervals segmented: ${sand} sand (GR ≤ 45 API), ${silt} silt, ${shale} shale (GR > 75 API).`,
        refs: [{ value: n, tol: 0 }, { value: sand, tol: 0 }],
        humanAssessment: sand > 0 ? "positive" : "negative",
      },
      {
        key: "vshale",
        label: STEP_LABELS.vshale,
        human: `Average Vshale = ${(avgVsh * 100).toFixed(1)}% (cutoff 40%). ${
          iv.filter((i) => i.vshale <= 0.4).length
        } intervals below the shale cutoff.`,
        refs: [{ value: Number((avgVsh * 100).toFixed(1)), tol: 3, unit: "%" }],
        humanAssessment: avgVsh <= 0.4 ? "positive" : "negative",
      },
      {
        key: "porosity",
        label: STEP_LABELS.porosity,
        human: `Average effective porosity = ${interpretation.avgPorosity.toFixed(1)}% (cutoff 8%).`,
        refs: [{ value: Number(interpretation.avgPorosity.toFixed(1)), tol: 1.5, unit: "%" }],
        humanAssessment: interpretation.avgPorosity >= 8 ? "positive" : "negative",
      },
      {
        key: "archie",
        label: STEP_LABELS.archie,
        human: `Average water saturation = ${interpretation.avgSw.toFixed(1)}% (a=1, m=2, n=2; cutoff 60%).`,
        refs: [{ value: Number(interpretation.avgSw.toFixed(1)), tol: 5, unit: "%" }],
        humanAssessment: interpretation.avgSw <= 60 ? "positive" : "negative",
      },
      {
        key: "timur",
        label: STEP_LABELS.timur,
        human: perms.length
          ? `Average Timur permeability = ${avgPerm.toFixed(1)} mD across ${perms.length} intervals.`
          : "Permeability not computable — missing porosity/Swirr inputs.",
        refs: perms.length ? [{ value: Number(avgPerm.toFixed(1)), tol: Math.max(2, avgPerm * 0.3), unit: "mD" }] : [],
        humanAssessment: avgPerm >= 1 ? "positive" : "neutral",
      },
      {
        key: "fluid",
        label: STEP_LABELS.fluid,
        human: `Dominant fluid = ${interpretation.dominantFluid.toUpperCase()} by Ko Ko pattern classification.`,
        refs: [],
        humanAssessment: ["oil", "gas"].includes(interpretation.dominantFluid) ? "positive" : "neutral",
      },
      {
        key: "netpay",
        label: STEP_LABELS.netpay,
        human: `Gross pay ${interpretation.grossPay} ft · Net pay ${interpretation.netPay} ft · N:G ${interpretation.netToGross}% · ${payCount} pay intervals · missed pay ${interpretation.totalMissedPay} ft.`,
        refs: [
          { value: interpretation.netPay, tol: Math.max(2, interpretation.netPay * 0.1), unit: "ft" },
          { value: interpretation.netToGross, tol: 5, unit: "%" },
        ],
        humanAssessment: interpretation.netToGross >= 40 ? "positive" : "negative",
      },
    ];
  }, [interpretation]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!well || !interpretation) {
      setError("No interpreted data for the selected well.");
      setPhase("error");
      return;
    }
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
        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);
        setConclusion(data.conclusion as AgentConclusion);
        setPhase("done");
      } catch (e) {
        setError((e as Error).message);
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Per-step comparison ── */
  const comparison = useMemo(() => {
    if (!conclusion) return [];
    const agentSteps = conclusion.steps ?? [];
    return humanRows.map((row) => {
      const agent =
        agentSteps.find((s) => (s.key ?? "").toLowerCase().includes(row.key)) ??
        agentSteps.find((s) => (s.title ?? "").toLowerCase().includes(row.key));

      let match: Match = "mismatch";
      let reason = "Agent did not cover this step.";

      if (agent) {
        const numbersOk = row.refs.length === 0 || row.refs.every((r) => reproduces(agent.finding, r));
        const someNumbersOk = row.refs.length === 0 || row.refs.some((r) => reproduces(agent.finding, r));
        const assessmentOk = agent.assessment === row.humanAssessment;

        if (numbersOk && assessmentOk) {
          match = "match";
          reason = row.refs.length
            ? "Numbers reproduced within tolerance and qualitative call is identical."
            : "Qualitative call is identical to the engine.";
        } else if (someNumbersOk || assessmentOk) {
          match = "partial";
          reason = !assessmentOk
            ? `Numbers align but the call differs (engine: ${row.humanAssessment}, agent: ${agent.assessment}).`
            : "Same conclusion, but some values deviate from engine output.";
        } else {
          match = "mismatch";
          reason = `Values and call both diverge (engine: ${row.humanAssessment}, agent: ${agent.assessment}).`;
        }
      }

      return { row, agent, match, reason };
    });
  }, [conclusion, humanRows]);

  const score = useMemo(() => {
    if (!comparison.length) return 0;
    const pts = comparison.reduce((s, c) => s + (c.match === "match" ? 1 : c.match === "partial" ? 0.5 : 0), 0);
    return Math.round((pts / comparison.length) * 100);
  }, [comparison]);

  return (
    <Card className="glass-card border-primary/30 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Agent vs Human Comparison
            <Badge variant="outline" className="text-primary border-primary/50 tech-label">
              STAGE 8 · QA MODE
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {phase === "done" && (
              <Badge
                variant="outline"
                className={score >= 80 ? matchMeta.match.cls : score >= 50 ? matchMeta.partial.cls : matchMeta.mismatch.cls}
              >
                Agreement {score}%
              </Badge>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {well?.well_name ?? "—"} {well?.api_number ? `· API ${well.api_number}` : ""} · deterministic engine vs LLM expert
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {phase === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Running the agent and aligning its findings with the engine output…
          </div>
        )}

        {phase === "error" && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Comparison failed: {error}</span>
          </div>
        )}

        {phase === "done" && (
          <>
            <div className="space-y-1">
              <Progress value={score} className="h-1.5" />
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono tech-label">
                <span>STEP-BY-STEP AGREEMENT</span>
                <span>
                  {comparison.filter((c) => c.match === "match").length} match ·{" "}
                  {comparison.filter((c) => c.match === "partial").length} partial ·{" "}
                  {comparison.filter((c) => c.match === "mismatch").length} mismatch
                </span>
              </div>
            </div>

            {/* Column headers */}
            <div className="hidden md:grid grid-cols-[1fr_1fr_150px] gap-3 text-[11px] font-mono tech-label text-muted-foreground px-1">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> HUMAN METHODOLOGY (ENGINE)
              </div>
              <div className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" /> AI AGENT
              </div>
              <div>AGREEMENT</div>
            </div>

            <div className="space-y-2">
              {comparison.map(({ row, agent, match, reason }) => (
                <div key={row.key} className="border border-border/60 rounded-md overflow-hidden">
                  <div className="px-3 py-1.5 bg-background/50 text-xs font-medium border-b border-border/50">
                    {row.label}
                  </div>
                  <div className="grid md:grid-cols-[1fr_1fr_150px] gap-3 p-3">
                    <div className="text-sm">
                      <div className="md:hidden text-[11px] font-mono text-muted-foreground mb-1">HUMAN / ENGINE</div>
                      {row.human}
                    </div>
                    <div className="text-sm">
                      <div className="md:hidden text-[11px] font-mono text-muted-foreground mb-1">AI AGENT</div>
                      {agent ? (
                        <>
                          <div className="font-medium text-xs mb-0.5">{agent.title}</div>
                          <div className="text-muted-foreground text-sm">{agent.finding}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Not addressed by the agent.</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className={`${matchMeta[match].cls} gap-1`}>
                        {matchMeta[match].icon}
                        {matchMeta[match].label}
                      </Badge>
                      <p className="text-[11px] text-muted-foreground leading-snug">{reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {conclusion && (
              <div className="border border-primary/30 rounded-md p-4 bg-primary/5 space-y-2">
                <div className="text-sm font-semibold">Agent overall verdict</div>
                <p className="text-sm">{conclusion.overall?.verdict}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Rating {conclusion.overall?.reservoir_rating?.toUpperCase()}</Badge>
                  <Badge variant="outline">
                    Agent confidence {Math.round((conclusion.overall?.confidence ?? 0) * 100)}%
                  </Badge>
                  <Badge variant="outline">Engine agreement {score}%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Agreement is computed by re-checking the agent's numbers against the deterministic engine
                  (tolerance-based) and comparing its qualitative call per step. The engine remains the source of truth.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentHumanComparison;
