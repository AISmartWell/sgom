import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Sparkles, FileSpreadsheet, Target } from "lucide-react";
import { SPT_SCORING_BENCHMARK, SPT_CALIBRATION_RULES } from "@/data/sptBenchmark";

type Filter = "all" | "validation" | "train";

export default function SPTBenchmarkPool() {
  const [filter, setFilter] = useState<Filter>("all");

  const cases = useMemo(
    () => SPT_SCORING_BENCHMARK.filter((c) => filter === "all" || c.split === filter),
    [filter]
  );

  const treated = SPT_SCORING_BENCHMARK.filter((c) => c.label === "treated").length;
  const avgScore = Math.round(
    SPT_SCORING_BENCHMARK.reduce((s, c) => s + c.groundTruthScore, 0) / SPT_SCORING_BENCHMARK.length
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-[10px]">Stage AI · Calibration</Badge>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="w-7 h-7 text-primary" /> SPT Benchmark Pool
          </h1>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {SPT_SCORING_BENCHMARK.length} labeled cases
          </Badge>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/spt-advisor">
            <Sparkles className="w-4 h-4 mr-2" /> Open SPT Advisor
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground max-w-3xl">
        Ground-truth pool of real Slot Perforation Technology (US 8,863,823) programs used as few-shot anchors
        for candidate scoring. Every case is fed into the SPT Advisor prompt so the 0–100 suitability score stays
        calibrated against executed field results instead of free-floating AI judgement.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6">
          <div className="text-2xl font-bold">{SPT_SCORING_BENCHMARK.length}</div>
          <div className="text-xs text-muted-foreground">Labeled cases</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-2xl font-bold">{treated}</div>
          <div className="text-xs text-muted-foreground">Executed (treated) programs</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-2xl font-bold">{avgScore}/100</div>
          <div className="text-xs text-muted-foreground">Mean ground-truth score</div>
        </CardContent></Card>
      </div>

      <div className="flex gap-2">
        {(["all", "validation", "train"] as Filter[]).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "All splits" : f}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {cases.map((c) => (
          <Card key={c.id} className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base leading-snug">{c.well}</CardTitle>
                <Badge className="shrink-0 bg-primary/20 text-primary border-primary/30">
                  {c.groundTruthScore}/100
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className="text-[10px] uppercase">{c.split}</Badge>
                <Badge variant={c.label === "treated" ? "default" : "secondary"} className="text-[10px]">
                  {c.label}
                </Badge>
                <Badge variant="outline" className="text-[10px]">{c.features.lithology}</Badge>
                <Badge variant="outline" className="text-[10px] font-mono">{c.id}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Row k="Total depth" v={`${c.features.totalDepthFt.toLocaleString()} ft`} />
                <Row k="Casing OD" v={`${c.features.casingOD}"`} />
                <Row k="Formation" v={c.features.formation} />
                <Row k="Pay interval" v={`${c.features.payIntervalFt[0]}–${c.features.payIntervalFt[1]} ft`} />
                {c.features.bhpPsi !== undefined && <Row k="BHP" v={`${c.features.bhpPsi} psi`} />}
                {c.features.fluidPpg !== undefined && <Row k="Fluid density" v={`${c.features.fluidPpg} ppg`} />}
              </div>

              {c.program && (
                <div className="rounded-md border border-border/60 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                    <Target className="h-3.5 w-3.5 text-primary" /> Executed / designed program
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Row k="Surface pressure" v={`${c.program.pressurePsi.toLocaleString()} psi`} />
                    <Row k="Slurry rate" v={`${c.program.slurryRateBblMin} bbl/min`} />
                    <Row k="Sand conc." v={`${c.program.sandPpg} ppg`} />
                    {c.program.nitrogenPct !== undefined && <Row k="Nitrogen" v={`${c.program.nitrogenPct} %`} />}
                    <Row k="Cutting speed" v={`${c.program.speedMmMin} mm/min`} />
                    <Row k="Net slots" v={`${c.program.netSlotsFt} ft`} />
                    <Row k="Gross slots" v={`${c.program.grossSlotsFt} ft`} />
                    <Row k="Drainage area" v={`${c.program.drainageAreaFt2} ft²`} />
                    <Row k="ΔP nozzles" v={`${c.program.dpNozzlesPsi.toLocaleString()} psi`} />
                  </div>
                </div>
              )}

              <p className="text-xs leading-relaxed text-muted-foreground">{c.rationale}</p>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="truncate font-mono">{c.source}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Calibration rules applied by the advisor</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {SPT_CALIBRATION_RULES.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-border/40 pb-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
