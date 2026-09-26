import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileCheck2, TrendingUp, RefreshCw, ArrowRight } from "lucide-react";

interface AgentRun {
  id: string;
  created_at: string;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  reservoir_rating: string | null;
  confidence: number | null;
  conclusion: any;
}

interface ForecastRow {
  id: string;
  created_at: string;
  restoration_date: string;
  well_external_ref: string | null;
  predicted_qoil: number | null;
  predicted_cum: number | null;
  actual_qoil: number | null;
  actual_cum: number | null;
  processed: boolean;
  payload: any;
}

const ratingColor: Record<string, string> = {
  excellent: "border-emerald-500/40 text-emerald-400",
  good: "border-cyan-500/40 text-cyan-400",
  fair: "border-amber-500/40 text-amber-400",
  poor: "border-rose-500/40 text-rose-400",
};

const fmt = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined ? "—" : Number(v).toLocaleString("en-US", { maximumFractionDigits: digits });

const Conclusions = () => {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [forecasts, setForecasts] = useState<ForecastRow[]>([]);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [forecastsError, setForecastsError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setRunsError(null);
    setForecastsError(null);
    const [r1, r2] = await Promise.all([
      supabase
        .from("geophysics_agent_runs")
        .select("id, created_at, well_name, api_number, formation, reservoir_rating, confidence, conclusion")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("well_restorations")
        .select(
          "id, created_at, restoration_date, well_external_ref, predicted_qoil, predicted_cum, actual_qoil, actual_cum, processed, payload"
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setRunsError(r1.error ? "Could not load conclusions. Please try again." : null);
    setForecastsError(r2.error ? "Could not load forecasts. Please try again." : null);
    setRuns(r1.error ? [] : (r1.data as AgentRun[]) ?? []);
    setForecasts(r2.error ? [] : (r2.data as ForecastRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Conclusions &amp; Forecasts</h1>
            <Badge variant="outline" className="font-mono text-xs">READ VIEW</Badge>
          </div>
          <p className="text-muted-foreground">
            Agent verdicts and production forecasts across all wells — no module navigation required.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} data-readonly-allow>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="conclusions">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="conclusions">
              <FileCheck2 className="h-4 w-4 mr-2" /> Conclusions ({runs.length})
            </TabsTrigger>
            <TabsTrigger value="forecasts">
              <TrendingUp className="h-4 w-4 mr-2" /> Forecasts ({forecasts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conclusions" className="mt-6 space-y-4">
            {runsError && <p role="alert" className="text-sm text-destructive">{runsError}</p>}
            {!runsError && runs.length === 0 && (
              <Card className="glass-card">
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No agent conclusions yet. Run the Geophysical AI Agent on a well.
                  <div className="mt-4">
                    <Link to="/dashboard/geophysics-agent">
                      <Button variant="outline" size="sm" data-readonly-allow>
                        Open Geophysical AI Agent <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            {runs.map((run) => {
              const overall = run.conclusion?.overall ?? {};
              const rating = (run.reservoir_rating ?? overall.reservoir_rating ?? "").toLowerCase();
              return (
                <Card key={run.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">
                        {run.well_name ?? run.api_number ?? "Unnamed well"}
                        {run.formation && (
                          <span className="ml-2 text-xs font-mono text-muted-foreground">{run.formation}</span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {rating && (
                          <Badge variant="outline" className={ratingColor[rating] ?? ""}>
                            {rating.toUpperCase()}
                          </Badge>
                        )}
                        {run.confidence !== null && (
                          <Badge variant="secondary" className="text-xs">
                            Confidence {Math.round((run.confidence ?? 0) * 100)}%
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(run.created_at).toLocaleDateString("en-US")}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {overall.verdict && <p className="text-sm">{overall.verdict}</p>}
                    {overall.net_pay_comment && (
                      <p className="text-xs text-muted-foreground">{overall.net_pay_comment}</p>
                    )}
                    {overall.spt_candidacy && (
                      <p className="text-sm text-primary">{overall.spt_candidacy}</p>
                    )}
                    {Array.isArray(overall.risks) && overall.risks.length > 0 && (
                      <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                        {overall.risks.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="forecasts" className="mt-6 space-y-4">
            {forecastsError && <p role="alert" className="text-sm text-destructive">{forecastsError}</p>}
            {!forecastsError && forecasts.length === 0 && (
              <Card className="glass-card">
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No forecasts yet. Run SPT Advisor to create a forecast and work order.
                  <div className="mt-4">
                    <Link to="/dashboard/spt-advisor">
                      <Button variant="outline" size="sm" data-readonly-allow>
                        Open SPT Advisor <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            {forecasts.map((f) => {
              const p = f.payload ?? {};
              const name = p.well_name ?? f.well_external_ref ?? "Unnamed well";
              return (
                <Card key={f.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">{name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={f.processed ? "default" : "secondary"} className="text-xs">
                          {f.processed ? "COMPLETED" : "PLANNED"}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(f.restoration_date).toLocaleDateString("en-US")}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">PREDICTED QOIL</p>
                        <p className="font-semibold text-primary">{fmt(f.predicted_qoil)} BOPD</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">PREDICTED CUM</p>
                        <p className="font-semibold">{fmt(f.predicted_cum, 0)} bbl</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">ACTUAL QOIL</p>
                        <p className="font-semibold">{fmt(f.actual_qoil)} BOPD</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">ACTUAL CUM</p>
                        <p className="font-semibold">{fmt(f.actual_cum, 0)} bbl</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Conclusions;
