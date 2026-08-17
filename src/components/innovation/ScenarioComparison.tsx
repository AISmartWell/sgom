import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, Droplets, Gauge, Layers, TrendingDown } from "lucide-react";

type Scenario = {
  id: string;
  name: string;
  api: string;
  verdict: string;
  verdictTone: "high" | "medium";
  rps: number;
  summary: string;
  inputs: { icon: typeof Gauge; label: string; value: string }[];
  drivers: { label: string; note: string; positive: boolean }[];
  recommendation: string;
  economics: { label: string; value: string }[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "A",
    name: "Scenario A — Strong SPT candidate",
    api: "Grayburg sandstone · TX · idle since 2019",
    verdict: "Restore via SPT",
    verdictTone: "high",
    rps: 82,
    summary:
      "Thick clean pay with retained reservoir pressure and a near-wellbore damage signature. Slot perforation opens drainage area without re-fracturing, so the diagnostic and the execution method agree.",
    inputs: [
      { icon: Layers, label: "Net pay", value: "38 ft (Vsh < 0.3)" },
      { icon: Gauge, label: "Reservoir pressure", value: "820 psi (0.29 psi/ft)" },
      { icon: Droplets, label: "Water cut", value: "42 %" },
      { icon: TrendingDown, label: "Arps decline", value: "b = 0.5, Di = 0.021" },
    ],
    drivers: [
      { label: "Skin +6.4", note: "damage is near-wellbore — exactly what slotting removes", positive: true },
      { label: "k = 14 mD (Timur)", note: "sufficient inflow once drainage area is restored", positive: true },
      { label: "Bypassed pay 11 ft", note: "two clean sands never perforated in the 1978 completion", positive: true },
      { label: "Casing 5.5\" / 4.95\"", note: "geometry inside SPT tool envelope", positive: true },
    ],
    recommendation:
      "4 slot intervals across 2,775–2,900 ft, ~12 ft net slots. Expected uplift 3.1× on initial rate, payback under 7 months.",
    economics: [
      { label: "NPV₁₀", value: "$412k" },
      { label: "5-yr ROI", value: "268 %" },
      { label: "Payback", value: "6.8 mo" },
    ],
  },
  {
    id: "B",
    name: "Scenario B — SPT less attractive, diagnostics still valid",
    api: "Mississippian carbonate · KS · marginal producer",
    verdict: "Monitor · alternative method",
    verdictTone: "medium",
    rps: 41,
    summary:
      "The same nine stages run end to end and produce a defensible answer — but the physics does not favour slot perforation. The value here is the diagnosis itself: the platform tells the operator not to spend on SPT and explains why.",
    inputs: [
      { icon: Layers, label: "Net pay", value: "9 ft (thin, interbedded)" },
      { icon: Gauge, label: "Reservoir pressure", value: "310 psi (0.13 psi/ft — depleted)" },
      { icon: Droplets, label: "Water cut", value: "88 %" },
      { icon: TrendingDown, label: "Arps decline", value: "b = 0.3, Di = 0.048" },
    ],
    drivers: [
      { label: "Skin +0.9", note: "no meaningful near-wellbore damage to remove", positive: false },
      { label: "Depleted pressure", note: "added drainage area cannot overcome missing drive energy", positive: false },
      { label: "Water cut 88 %", note: "incremental slots mostly produce water", positive: false },
      { label: "Matrix carbonate", note: "acidizing or waterflood conformance scores higher than SPT", positive: false },
    ],
    recommendation:
      "SPT not recommended. Diagnostics still deliver value: bypassed-pay map, remaining IOIP, economic limit date, and a ranked shortlist of alternative interventions.",
    economics: [
      { label: "NPV₁₀ (SPT)", value: "−$46k" },
      { label: "Economic limit", value: "14 months" },
      { label: "Screening cost avoided", value: "$180k workover" },
    ],
  },
];

const ScenarioComparison = () => (
  <div className="grid gap-4 lg:grid-cols-2 mb-10">
    {SCENARIOS.map((s) => (
      <Card
        key={s.id}
        className={`glass-card ${s.verdictTone === "high" ? "border-success/40" : "border-border/60"}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{s.name}</CardTitle>
            <Badge variant={s.verdictTone === "high" ? "default" : "outline"}>
              {s.verdictTone === "high" ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : (
                <AlertTriangle className="mr-1 h-3 w-3" />
              )}
              {s.verdict}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{s.api}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-muted-foreground">Restoration Potential Score</span>
              <span className="text-2xl font-bold">{s.rps}<span className="text-sm text-muted-foreground">/100</span></span>
            </div>
            <Progress value={s.rps} className="h-2" />
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{s.summary}</p>

          <div className="grid grid-cols-2 gap-2">
            {s.inputs.map((i) => {
              const Icon = i.icon;
              return (
                <div key={i.label} className="p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] text-muted-foreground">{i.label}</span>
                  </div>
                  <span className="text-sm font-medium">{i.value}</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold">Score drivers</p>
            {s.drivers.map((d) => (
              <div key={d.label} className="flex gap-2 text-xs">
                <span
                  className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                    d.positive ? "bg-success" : "bg-destructive"
                  }`}
                />
                <span>
                  <span className="font-medium text-foreground">{d.label}</span>{" "}
                  <span className="text-muted-foreground">— {d.note}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Recommendation:</span> {s.recommendation}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {s.economics.map((e) => (
              <div key={e.label} className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-sm font-bold">{e.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{e.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default ScenarioComparison;
