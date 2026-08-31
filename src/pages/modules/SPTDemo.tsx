import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload, FlaskConical, TrendingDown, Target, DollarSign,
  CheckCircle2, AlertTriangle, RotateCcw, ArrowRight, FileDown,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, AreaChart, Area, ReferenceLine,
} from "recharts";
import {
  SAMPLE_WELL, SAMPLE_CSV, parseProductionCsv, buildIngestReport,
  runPetrophysics, runForecast, runAdvisor, runEconomics, DEFAULT_ECONOMICS,
  type WellInput, type EconomicsInput,
} from "@/lib/spt-demo-pipeline";

const STEPS = [
  { id: 1, title: "Ingest well data", icon: Upload, stage: "Stage 2" },
  { id: 2, title: "Petrophysics", icon: FlaskConical, stage: "Stage 8" },
  { id: 3, title: "Decline forecast", icon: TrendingDown, stage: "Stage 4" },
  { id: 4, title: "SPT Advisor", icon: Target, stage: "Stage 6" },
  { id: 5, title: "Economic effect", icon: DollarSign, stage: "Stage 7" },
];

const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = (n: number) => `$${fmt(Math.round(n))}`;

export default function SPTDemo() {
  const [step, setStep] = useState(1);
  const [well, setWell] = useState<WellInput>(SAMPLE_WELL);
  const [source, setSource] = useState<"csv" | "sample">("sample");
  const [loaded, setLoaded] = useState(false);
  const [econ, setEcon] = useState<EconomicsInput>(DEFAULT_ECONOMICS);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Pipeline (pure, recomputed on every input change) ── */
  const ingest = useMemo(() => buildIngestReport(well, source), [well, source]);

  const lastPoint = well.history[well.history.length - 1];
  const liquid = lastPoint ? lastPoint.oil + lastPoint.water : 0;
  const waterCut = liquid > 0 ? (lastPoint.water / liquid) * 100 : 0;

  const petro = useMemo(() => runPetrophysics(well, waterCut), [well, waterCut]);
  const advisor = useMemo(
    () => runAdvisor(well, petro, { latestOil: lastPoint?.oil ?? 0, latestWaterCut: waterCut }, ingest.quality),
    [well, petro, lastPoint, waterCut, ingest.quality],
  );
  const forecast = useMemo(
    () => runForecast(well, advisor.upliftBpd, 2),
    [well, advisor.upliftBpd],
  );
  const economics = useMemo(() => runEconomics(advisor.upliftBpd, econ), [advisor.upliftBpd, econ]);

  /* ── Handlers ── */
  const handleFile = async (file: File) => {
    const text = await file.text();
    const { points, warnings } = parseProductionCsv(text);
    if (!points.length) {
      toast.error("Could not read production rows from this file");
      return;
    }
    setWell({ ...well, name: file.name.replace(/\.[^.]+$/, ""), history: points });
    setSource("csv");
    setLoaded(true);
    warnings.forEach((w) => toast.warning(w));
    toast.success(`${points.length} production rows ingested`);
    setStep(2);
  };

  const loadSample = () => {
    setWell(SAMPLE_WELL);
    setSource("sample");
    setLoaded(true);
    toast.success("Demo well Brawner 10-15 loaded");
    setStep(2);
  };

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "spt-demo-production-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const reset = () => {
    setWell(SAMPLE_WELL);
    setSource("sample");
    setLoaded(false);
    setEcon(DEFAULT_ECONOMICS);
    setStep(1);
  };

  const exportSummary = () => {
    const lines = [
      `SGOM — SPT pipeline summary`,
      `Well: ${well.name}${well.api ? ` (API ${well.api})` : ""}`,
      `Formation: ${well.formation ?? "n/a"} · Depth: ${well.depthFt} ft · Net pay: ${well.netPayFt} ft`,
      ``,
      `Petrophysics: k(Timur) = ${petro.permMd.toFixed(2)} mD (${petro.permClass}), phi = ${petro.porosityPct.toFixed(1)}%, Swirr = ${petro.swirrPct.toFixed(1)}%, skin ≈ ${petro.skinProxy}`,
      `Forecast: qi = ${forecast.latestOil.toFixed(1)} bbl/d, Di = ${forecast.Di.toFixed(4)}/mo, b = ${forecast.b}, base 5y cum = ${fmt(forecast.baseCum5y)} bbl`,
      `SPT Advisor: score ${advisor.score}/100 — ${advisor.verdict} (confidence ${advisor.confidence}%), uplift ${advisor.upliftBpd} bbl/d`,
      `Economics @ $${econ.oilPrice}/bbl: NPV10 ${usd(economics.npv)}, ROI ${economics.roi.toFixed(0)}%, payback ${economics.paybackMonths} mo, breakeven $${economics.breakevenPrice.toFixed(1)}/bbl`,
      ``,
      `Rationale:`,
      ...advisor.rationale.map((r) => ` - ${r}`),
      `Risks:`,
      ...advisor.risks.map((r) => ` - ${r}`),
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${well.name.replace(/\s+/g, "-")}-spt-summary.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Summary exported");
  };

  const setNum = (k: keyof WellInput) => (v: string) =>
    setWell((w) => ({ ...w, [k]: parseFloat(v) || 0 }) as WellInput);

  const verdictTone =
    advisor.verdict === "Recommended" ? "text-primary"
      : advisor.verdict === "Conditional" ? "text-amber-400"
        : "text-destructive";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Interactive demo</Badge>
            <Badge variant="secondary">SPT-first cycle</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold">SPT End-to-End Demo</h1>
          <p className="text-muted-foreground max-w-2xl">
            Upload one well dataset and walk the full pipeline: ingest → petrophysics → decline
            forecast → SPT recommendation → economic effect. Every number is computed live from your input.
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Restart
        </Button>
      </div>

      {/* Stepper */}
      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = loaded && step > s.id;
            return (
              <button
                key={s.id}
                onClick={() => loaded || s.id === 1 ? setStep(s.id) : toast.info("Load a dataset first")}
                className={`flex flex-1 min-w-[170px] items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className={`rounded-md p-2 ${active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{s.stage}</div>
                  <div className="truncate text-sm font-medium">{s.title}</div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Step 1 — Ingest */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>1 · Ingest well data</CardTitle>
            <CardDescription>
              Upload a CSV production history (date, oil, water) or start from the bundled demo well.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drop a CSV here or browse your files</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <div className="flex gap-2">
                  <Button onClick={() => fileRef.current?.click()}>Choose CSV</Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <FileDown className="mr-2 h-4 w-4" /> Template
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-5">
                <h3 className="font-semibold">No data at hand?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Load Brawner 10-15 — a real-format legacy producer with 18 months of history,
                  Mississippian Chat, 3,980 ft, 22 ft net pay.
                </p>
                <Button className="mt-4" variant="secondary" onClick={loadSample}>
                  Load demo well <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-3 font-semibold">Reservoir parameters</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Well name</Label>
                  <Input value={well.name} onChange={(e) => setWell({ ...well, name: e.target.value })} />
                </div>
                <div>
                  <Label>Formation</Label>
                  <Input value={well.formation ?? ""} onChange={(e) => setWell({ ...well, formation: e.target.value })} />
                </div>
                <div>
                  <Label>Total depth, ft</Label>
                  <Input type="number" value={well.depthFt} onChange={(e) => setNum("depthFt")(e.target.value)} />
                </div>
                <div>
                  <Label>Net pay, ft</Label>
                  <Input type="number" value={well.netPayFt} onChange={(e) => setNum("netPayFt")(e.target.value)} />
                </div>
                <div>
                  <Label>Porosity, fraction</Label>
                  <Input type="number" step="0.01" value={well.porosity} onChange={(e) => setNum("porosity")(e.target.value)} />
                </div>
                <div>
                  <Label>Swirr, fraction</Label>
                  <Input type="number" step="0.01" value={well.swirr} onChange={(e) => setNum("swirr")(e.target.value)} />
                </div>
                <div>
                  <Label>Reservoir pressure, psi</Label>
                  <Input type="number" value={well.reservoirPressurePsi} onChange={(e) => setNum("reservoirPressurePsi")(e.target.value)} />
                </div>
              </div>
            </div>

            {loaded && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data quality</span>
                  <span className="text-sm">{ingest.quality}%</span>
                </div>
                <Progress value={ingest.quality} className="mt-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {ingest.rows} monthly rows · source: {ingest.source.toUpperCase()}
                </p>
                {ingest.warnings.map((w) => (
                  <p key={w} className="mt-1 flex items-center gap-2 text-xs text-amber-400">
                    <AlertTriangle className="h-3 w-3" /> {w}
                  </p>
                ))}
                <Button className="mt-4" onClick={() => setStep(2)}>
                  Continue to petrophysics <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Petrophysics */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>2 · Petrophysics</CardTitle>
            <CardDescription>
              Timur permeability k = 0.136·φ<sup>4.4</sup>/Swirr², net pay and near-wellbore damage proxy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { l: "Permeability (Timur)", v: `${petro.permMd.toFixed(2)} mD`, s: petro.permClass },
                { l: "Porosity", v: `${petro.porosityPct.toFixed(1)} %`, s: "effective" },
                { l: "Irreducible water", v: `${petro.swirrPct.toFixed(1)} %`, s: "Swirr" },
                { l: "Net pay", v: `${petro.netPayFt.toFixed(0)} ft`, s: "perforable interval" },
                { l: "Mobility index", v: petro.mobilityIndex.toFixed(2), s: "0–1, inflow potential" },
                { l: "Skin proxy", v: String(petro.skinProxy), s: "near-wellbore damage" },
                { l: "Water cut (latest)", v: `${waterCut.toFixed(1)} %`, s: "from production data" },
                { l: "Reservoir pressure", v: `${fmt(well.reservoirPressurePsi)} psi`, s: "drive energy" },
              ].map((m) => (
                <div key={m.l} className="rounded-lg border p-4">
                  <div className="text-xs text-muted-foreground">{m.l}</div>
                  <div className="mt-1 text-2xl font-semibold">{m.v}</div>
                  <div className="text-xs text-muted-foreground">{m.s}</div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Reference: Timur, A. (1968), SPWLA 9th Annual Symposium. Permeability class drives the
              slot-density recommendation in the SPT design stage.
            </p>
            <Button onClick={() => setStep(3)}>
              Continue to forecast <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Forecast */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>3 · Decline forecast</CardTitle>
            <CardDescription>
              Arps hyperbolic fit (b = {forecast.b}) on the ingested history, 60-month outlook with
              and without SPT.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { l: "Current rate", v: `${forecast.latestOil.toFixed(1)} bbl/d` },
                { l: "Decline Di", v: `${(forecast.Di * 100).toFixed(2)} %/mo` },
                { l: "Base 5y cumulative", v: `${fmt(forecast.baseCum5y)} bbl` },
                { l: "Economic limit", v: forecast.economicLimitMonth >= 60 ? "> 60 mo" : `${forecast.economicLimitMonth} mo` },
              ].map((m) => (
                <div key={m.l} className="rounded-lg border p-4">
                  <div className="text-xs text-muted-foreground">{m.l}</div>
                  <div className="mt-1 text-xl font-semibold">{m.v}</div>
                </div>
              ))}
            </div>

            <div style={{ width: "100%", minHeight: 320, height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={5} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" label={{ value: "bbl/d", angle: -90, position: "insideLeft", fontSize: 11 }} />
                  <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <ReferenceLine y={2} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Economic limit", fontSize: 10 }} />
                  <Line type="monotone" dataKey="history" name="History" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="base" name="Base decline" stroke="hsl(var(--destructive))" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="spt" name="With SPT" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <Button onClick={() => setStep(4)}>
              Continue to SPT Advisor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4 — Advisor */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>4 · SPT Advisor</CardTitle>
            <CardDescription>
              MCDA scoring against the SPT benchmark pool (US 8,863,823 Slot Perforation Technology).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-5">
                <div className="text-xs text-muted-foreground">Restoration Potential Score</div>
                <div className="mt-1 text-5xl font-bold text-primary">{advisor.score}</div>
                <Progress value={advisor.score} className="mt-3" />
              </div>
              <div className="rounded-lg border p-5">
                <div className="text-xs text-muted-foreground">Verdict</div>
                <div className={`mt-1 text-2xl font-semibold ${verdictTone}`}>{advisor.verdict}</div>
                <div className="mt-2 text-sm text-muted-foreground">Confidence {advisor.confidence}%</div>
              </div>
              <div className="rounded-lg border p-5">
                <div className="text-xs text-muted-foreground">Expected uplift</div>
                <div className="mt-1 text-2xl font-semibold">+{advisor.upliftBpd} bbl/d</div>
                <div className="mt-2 text-sm text-muted-foreground">score-adjusted benchmark gain</div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Criteria breakdown</h3>
              <div className="space-y-2">
                {advisor.criteria.map((c) => (
                  <div key={c.key} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">{c.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.raw} · weight {(c.weight * 100).toFixed(0)}% · score {c.score.toFixed(0)}
                      </span>
                    </div>
                    <Progress value={c.score} className="mt-2" />
                    <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Why this well</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {advisor.rationale.map((r) => (
                    <li key={r} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{r}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Risks & checks</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {advisor.risks.map((r) => (
                    <li key={r} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Button onClick={() => setStep(5)}>
              Continue to economics <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5 — Economics */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>5 · Economic effect</CardTitle>
            <CardDescription>
              Incremental cash flow from the recommended SPT job, discounted at {(econ.discountRate * 100).toFixed(0)}%/yr.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Oil price, $/bbl</Label>
                <Input type="number" value={econ.oilPrice} onChange={(e) => setEcon({ ...econ, oilPrice: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>OPEX, $/bbl</Label>
                <Input type="number" value={econ.opexPerBbl} onChange={(e) => setEcon({ ...econ, opexPerBbl: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>SPT treatment cost, $</Label>
                <Input type="number" value={econ.treatmentCost} onChange={(e) => setEcon({ ...econ, treatmentCost: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Discount rate</Label>
                <Input type="number" step="0.01" value={econ.discountRate} onChange={(e) => setEcon({ ...econ, discountRate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { l: "Incremental oil (5y)", v: `${fmt(economics.incrementalBbl5y)} bbl` },
                { l: "NPV", v: usd(economics.npv) },
                { l: "ROI (5y)", v: `${economics.roi.toFixed(0)} %` },
                { l: "Payback", v: economics.paybackMonths >= 999 ? "n/a" : `${economics.paybackMonths} mo` },
                { l: "Gross revenue", v: usd(economics.grossRevenue) },
                { l: "Net profit (5y)", v: usd(economics.netProfit5y) },
                { l: "Breakeven price", v: `$${economics.breakevenPrice.toFixed(1)}/bbl` },
                { l: "Uplift applied", v: `+${advisor.upliftBpd} bbl/d` },
              ].map((m) => (
                <div key={m.l} className="rounded-lg border p-4">
                  <div className="text-xs text-muted-foreground">{m.l}</div>
                  <div className="mt-1 text-xl font-semibold">{m.v}</div>
                </div>
              ))}
            </div>

            <div style={{ width: "100%", minHeight: 300, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={economics.cashflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" label={{ value: "month", position: "insideBottom", offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <RTooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                  <Area type="monotone" dataKey="cum" name="Cumulative cash flow" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="font-semibold">Decision summary — {well.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {advisor.verdict} for SPT with score {advisor.score}/100. Expected +{advisor.upliftBpd} bbl/d
                yields {fmt(economics.incrementalBbl5y)} incremental bbl over 5 years, NPV {usd(economics.npv)} at
                ${econ.oilPrice}/bbl, payback {economics.paybackMonths >= 999 ? "not reached" : `${economics.paybackMonths} months`}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={exportSummary}><FileDown className="mr-2 h-4 w-4" /> Export summary</Button>
                <Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" /> Run another well</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
