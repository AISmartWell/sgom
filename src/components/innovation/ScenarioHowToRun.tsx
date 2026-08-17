import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileUp, Microscope, TrendingDown, Brain, DollarSign } from "lucide-react";

const STEPS = [
  {
    n: 1,
    title: "Load well data",
    icon: FileUp,
    body: "Upload CSV, LAS 2.0, PDF/paper log, or fetch from a public registry (TX, OK, KS, NM, etc.). For paper logs use OCR Paper Well Log Recognition.",
    routes: [
      { label: "Data Import", to: "/dashboard/data-import" },
      { label: "OCR Well Log", to: "/dashboard/ocr-well-log" },
      { label: "Autonomous Scan", to: "/dashboard/autonomous-scan" },
    ],
  },
  {
    n: 2,
    title: "Run petrophysics",
    icon: Microscope,
    body: "Compute Vsh, porosity, Sw, net pay, and Timur permeability. Add diagnostics if needed.",
    routes: [
      { label: "Geophysical Expertise", to: "/dashboard/geophysical" },
    ],
  },
  {
    n: 3,
    title: "Build production forecast",
    icon: TrendingDown,
    body: "Fit Arps decline (b, Di), compute remaining IOIP, and project economic limit.",
    routes: [
      { label: "Cumulative Analysis", to: "/dashboard/cumulative-analysis" },
    ],
  },
  {
    n: 4,
    title: "Score restoration potential",
    icon: Brain,
    body: "SPT Advisor runs MCDA + AI reasoning and returns Restore / Monitor / P&A with RPS and confidence.",
    routes: [
      { label: "SPT Advisor", to: "/dashboard/spt-advisor" },
    ],
  },
  {
    n: 5,
    title: "Economics and decision",
    icon: DollarSign,
    body: "NPV, IRR, payback, Monte Carlo P10/P90. Compare Upside vs Base case in Profitability Model.",
    routes: [
      { label: "Economic Analysis", to: "/dashboard/economic-analysis" },
      { label: "Profitability Model", to: "/dashboard/profitability-model" },
    ],
  },
];

export default function ScenarioHowToRun() {
  const navigate = useNavigate();
  return (
    <Card className="glass-card border-primary/30 mb-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRight className="h-5 w-5 text-primary" />
          How to run this scenario in the platform
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The two cards above are not mockups — they represent a real workflow you can execute today
          on any well with enough data. Follow the modules in order; each stage feeds the next
          inside the same dataset.
        </p>
        <div className="space-y-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.n}
                className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-start"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">Step {step.n}</Badge>
                    <span className="font-semibold text-sm">{step.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{step.body}</p>
                  <div className="flex flex-wrap gap-2">
                    {step.routes.map((r) => (
                      <Button
                        key={r.to}
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => navigate(r.to)}
                      >
                        Open {r.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <span className="font-medium text-foreground">Quick start:</span>{" "}
          <span className="text-muted-foreground">
            For a guided end-to-end SPT demo, use the SPT Demo wizard — it walks through the same
            five steps with sample data and live charts.
          </span>
          <Button
            variant="link"
            size="sm"
            className="px-0 h-auto text-xs"
            onClick={() => navigate("/dashboard/spt-demo")}
          >
            Launch SPT Demo →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
