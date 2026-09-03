import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Play,
  History,
  Search,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import GeophysicsAgentPanel from "@/components/geophysical/GeophysicsAgentPanel";
import { useWellLogs } from "@/hooks/useWellLogs";
import { interpretWellLog, type PetroPoint, type InterpretationSummary } from "@/lib/petrophysics";

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

interface RunRow {
  id: string;
  well_id: string | null;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  reservoir_rating: string | null;
  confidence: number | null;
  conclusion: AgentConclusion;
  model: string | null;
  created_at: string;
}

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

const RunDetails = ({ run }: { run: RunRow }) => {
  const c = run.conclusion;
  if (!c?.overall) return <div className="text-sm text-muted-foreground">No stored conclusion.</div>;
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {c.steps?.map((s, i) => (
          <div key={`${s.key}-${i}`} className="flex items-start gap-2 bg-background/40 border border-border/50 rounded-md p-3">
            {assessIcon(s.assessment)}
            <div>
              <div className="text-sm font-medium">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.finding}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-primary/30 rounded-md p-4 bg-primary/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Expert Conclusion</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={ratingColor[c.overall.reservoir_rating] ?? ""}>
              {c.overall.reservoir_rating?.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              Confidence {Math.round((c.overall.confidence ?? 0) * 100)}%
            </Badge>
          </div>
        </div>
        <p className="text-sm">{c.overall.verdict}</p>
        <p className="text-xs text-muted-foreground">{c.overall.net_pay_comment}</p>
        <div className="text-xs border-l-2 border-primary/50 pl-3 py-1">
          <span className="font-mono text-primary">SPT: </span>
          {c.overall.spt_candidacy}
        </div>
        {c.overall.risks?.length > 0 && (
          <div className="text-xs space-y-1">
            {c.overall.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 text-amber-400/90">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GeophysicsAgent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlWellId = searchParams.get("wellId") ?? undefined;

  const [wells, setWells] = useState<WellLite[]>([]);
  const [selectedWell, setSelectedWell] = useState<WellLite | null>(null);
  const [query, setQuery] = useState("");
  const [runId, setRunId] = useState<number | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Wells
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, total_depth")
        .order("well_name", { ascending: true })
        .limit(300);
      setWells(data || []);
      if (data?.length) {
        const preferred = urlWellId ? data.find((w) => w.id === urlWellId) : null;
        setSelectedWell((prev) => prev ?? preferred ?? data[0]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Well from URL not in the first page of results
  useEffect(() => {
    if (!urlWellId || selectedWell?.id === urlWellId) return;
    (async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, total_depth")
        .eq("id", urlWellId)
        .maybeSingle();
      if (data) {
        setSelectedWell(data);
        setWells((prev) => (prev.some((w) => w.id === data.id) ? prev : [data, ...prev]));
      }
    })();
  }, [urlWellId, selectedWell?.id]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("geophysics_agent_runs")
      .select("id, well_id, well_name, api_number, formation, reservoir_rating, confidence, conclusion, model, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(`History failed: ${error.message}`);
    setRuns((data as unknown as RunRow[]) || []);
    setHistoryLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const { data: rawLogs, isLoading: logsLoading } = useWellLogs(selectedWell?.id);

  const petroData = useMemo<PetroPoint[]>(() => {
    if (!rawLogs) return [];
    return rawLogs.map((p) => ({
      depth: p.measured_depth,
      gr: p.gamma_ray ?? 50,
      sp: p.sp ?? -20,
      res: p.resistivity ?? 5,
      por: p.porosity ?? 10,
      sw: p.water_saturation ?? 50,
      rhob: p.density,
      nphi: p.neutron_porosity,
    }));
  }, [rawLogs]);

  const interpretation = useMemo<InterpretationSummary | null>(
    () => (petroData.length < 3 ? null : interpretWellLog(petroData)),
    [petroData]
  );

  const filteredWells = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wells.slice(0, 60);
    return wells
      .filter(
        (w) =>
          (w.well_name ?? "").toLowerCase().includes(q) ||
          (w.api_number ?? "").toLowerCase().includes(q) ||
          (w.formation ?? "").toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [wells, query]);

  const wellRuns = useMemo(
    () => (selectedWell ? runs.filter((r) => r.well_id === selectedWell.id) : runs),
    [runs, selectedWell]
  );

  const deleteRun = async (id: string) => {
    const { error } = await supabase.from("geophysics_agent_runs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRuns((prev) => prev.filter((r) => r.id !== id));
    if (openRunId === id) setOpenRunId(null);
  };

  const startRun = () => {
    if (!selectedWell) return toast.error("Select a well first");
    if (!interpretation) return toast.error("No log curves / interpretation for this well");
    setOpenRunId(null);
    setRunId(Date.now());
  };

  const selectWell = (w: WellLite) => {
    setSelectedWell(w);
    setRunId(null);
    setOpenRunId(null);
    setSearchParams({ wellId: w.id }, { replace: true });
  };

  const openRun = runs.find((r) => r.id === openRunId) ?? null;

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-background overflow-auto p-6" : "space-y-6"}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Geophysical AI Agent
            <Badge variant="outline" className="text-primary border-primary/50 tech-label">
              STAGE 8 · AUTONOMOUS
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Full-screen autonomous petrophysics analyst with per-well run history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? <Minimize2 className="h-4 w-4 mr-1.5" /> : <Maximize2 className="h-4 w-4 mr-1.5" />}
            {fullscreen ? "Exit full screen" : "Full screen"}
          </Button>
          <Button size="sm" onClick={startRun} disabled={!selectedWell || logsLoading || !interpretation}>
            {logsLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Play className="h-4 w-4 mr-1.5" />}
            Run AI Agent
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${fullscreen ? "mt-4" : ""} lg:grid-cols-[320px_1fr]`}>
        {/* Left column: wells + history */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" /> Wells
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Search by name, API, formation"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 text-xs"
              />
              <ScrollArea className="h-[220px] pr-2">
                <div className="space-y-1">
                  {filteredWells.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => selectWell(w)}
                      className={`w-full text-left rounded-md px-2 py-1.5 text-xs transition-colors ${
                        selectedWell?.id === w.id
                          ? "bg-primary/15 border border-primary/40"
                          : "hover:bg-muted/40 border border-transparent"
                      }`}
                    >
                      <div className="font-medium truncate">{w.well_name ?? "Unnamed well"}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        {w.api_number ?? "—"} {w.formation ? `· ${w.formation}` : ""}
                      </div>
                    </button>
                  ))}
                  {filteredWells.length === 0 && (
                    <div className="text-xs text-muted-foreground py-6 text-center">No wells found.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Run history
                <Badge variant="outline" className="text-[10px]">{wellRuns.length}</Badge>
              </CardTitle>
              <p className="text-[11px] text-muted-foreground font-mono">
                {selectedWell?.well_name ?? "All wells"}
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-2">
                {historyLoading ? (
                  <div className="text-xs text-muted-foreground py-6 text-center">Loading…</div>
                ) : wellRuns.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-6 text-center">
                    No runs yet for this well.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {wellRuns.map((r) => (
                      <div
                        key={r.id}
                        className={`flex items-start gap-2 rounded-md px-2 py-1.5 border ${
                          openRunId === r.id ? "bg-primary/10 border-primary/40" : "border-transparent hover:bg-muted/40"
                        }`}
                      >
                        <button
                          className="flex-1 text-left"
                          onClick={() => {
                            setOpenRunId(r.id);
                            setRunId(null);
                          }}
                        >
                          <div className="text-xs font-medium truncate">{r.well_name ?? "—"}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {new Date(r.created_at).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className={`text-[10px] ${ratingColor[r.reservoir_rating ?? ""] ?? ""}`}>
                              {(r.reservoir_rating ?? "n/a").toUpperCase()}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round((r.confidence ?? 0) * 100)}%
                            </span>
                          </div>
                        </button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteRun(r.id)}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right column: live run / stored run */}
        <div className="space-y-4">
          {runId ? (
            <GeophysicsAgentPanel
              key={runId}
              well={selectedWell}
              petroData={petroData}
              interpretation={interpretation}
              persist
              onSaved={loadHistory}
              onClose={() => setRunId(null)}
            />
          ) : openRun ? (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Stored run
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {new Date(openRun.created_at).toLocaleString()}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono">
                  {openRun.well_name ?? "—"} {openRun.api_number ? `· API ${openRun.api_number}` : ""}{" "}
                  {openRun.model ? `· ${openRun.model}` : ""}
                </p>
              </CardHeader>
              <CardContent>
                <RunDetails run={openRun} />
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-16 text-center space-y-3">
                <Bot className="h-10 w-10 text-primary/60 mx-auto" />
                <div className="text-sm text-muted-foreground">
                  Select a well and press <span className="text-foreground font-medium">Run AI Agent</span>, or open a
                  stored run from the history.
                </div>
                <Separator className="my-2" />
                <div className="text-xs font-mono text-muted-foreground">
                  {selectedWell
                    ? logsLoading
                      ? "Loading log curves…"
                      : interpretation
                      ? `${petroData.length} log points · ${interpretation.intervals.length} intervals ready`
                      : "No log curves for this well — upload LAS or run OCR first."
                    : "No well selected"}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeophysicsAgent;
