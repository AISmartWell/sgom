import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  DollarSign, TrendingDown, AlertTriangle, RotateCcw, Download, Layers, Coins, Percent,
  FileSpreadsheet, FileText, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { exportModelXlsx, exportModelPdf } from "@/lib/profitability-export";
import {
  DEFAULT_INPUTS, runModel, fmtUsd, fmtFullUsd,
  type ModelInputs, type CaseKey, type YearRow,
} from "@/lib/profitability-model";

const CASE_LABEL: Record<CaseKey, string> = { upside: "Upside case (workbook)", base: "Base case (corrected)" };

function KPI({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "good" | "bad" }) {
  return (
    <Card className="bg-card/60 backdrop-blur border-border/60">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold ${tone === "good" ? "text-primary" : tone === "bad" ? "text-destructive" : ""}`}>{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Knob({
  label, value, min, max, step, onChange, format, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-medium tabular-nums">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const LINES: { key: keyof YearRow; label: string; group?: boolean; negative?: boolean }[] = [
  { key: "saasRevenue", label: "SGOM software revenue" },
  { key: "oilRevenueGross", label: "Oil revenue (gross)" },
  { key: "royalty", label: "Less: royalty", negative: true },
  { key: "severance", label: "Less: severance / production tax", negative: true },
  { key: "revenue", label: "Total revenue (net)", group: true },
  { key: "saasCogs", label: "SGOM COGS", negative: true },
  { key: "wellOpex", label: "Well maintenance / opex", negative: true },
  { key: "grossProfit", label: "Gross profit", group: true },
  { key: "payroll", label: "Payroll", negative: true },
  { key: "ga", label: "G&A", negative: true },
  { key: "sales", label: "Sales & marketing", negative: true },
  { key: "mvp", label: "MVP build (one-time)", negative: true },
  { key: "ebitda", label: "EBITDA", group: true },
  { key: "da", label: "Depreciation & amortization", negative: true },
  { key: "ebt", label: "EBT", group: true },
  { key: "tax", label: "Income tax", negative: true },
  { key: "netIncome", label: "Net income", group: true },
  { key: "capex", label: "Capex (SPT + platform)", negative: true },
  { key: "nwcChange", label: "Change in net working capital", negative: true },
  { key: "freeCashFlow", label: "Free cash flow", group: true },
  { key: "cashEnd", label: "Cash, end of year", group: true },
];

export default function ProfitabilityModel() {
  const [inputs, setInputs] = useState<ModelInputs>(DEFAULT_INPUTS);
  const [activeCase, setActiveCase] = useState<CaseKey>("base");

  const base = useMemo(() => runModel(inputs, "base"), [inputs]);
  const upside = useMemo(() => runModel(inputs, "upside"), [inputs]);
  const rows = activeCase === "base" ? base : upside;

  const set = <K extends keyof ModelInputs>(k: K, v: ModelInputs[K]) => setInputs(p => ({ ...p, [k]: v }));

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const last = rows[rows.length - 1];
  const cumFcf = rows.reduce((s, r) => s + r.freeCashFlow, 0);
  const breakeven = rows.find(r => r.ebitda > 0)?.year;
  const deltaRevenue = base[base.length - 1].revenue - upside[upside.length - 1].revenue;
  const deltaNi = base[base.length - 1].netIncome - upside[upside.length - 1].netIncome;

  const chartData = rows.map((r, i) => ({
    year: String(r.year),
    software: Math.round(r.saasRevenue / 1000),
    oil: Math.round(r.oilRevenueNet / 1000),
    ebitda: Math.round(r.ebitda / 1000),
    cash: Math.round(r.cashEnd / 1000),
    upsideRevenue: Math.round(upside[i].revenue / 1000),
    baseRevenue: Math.round(base[i].revenue / 1000),
  }));

  const chartOneRef = useRef<HTMLDivElement>(null);
  const chartTwoRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  // Resolve design tokens to concrete colors so exported charts render correctly
  const [colors, setColors] = useState({ primary: "#1A9FFF", muted: "#7c8798", danger: "#ef4444" });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => {
      const raw = cs.getPropertyValue(name).trim();
      return raw ? `hsl(${raw})` : fallback;
    };
    setColors({
      primary: v("--primary", "#1A9FFF"),
      muted: v("--muted-foreground", "#7c8798"),
      danger: v("--destructive", "#ef4444"),
    });
  }, []);

  const exportXlsx = () => {
    exportModelXlsx({ inputs, base, upside, lines: LINES });
    toast.success("XLSX exported — assumptions, both cases and delta sheet");
  };

  const exportPdf = async () => {
    setPdfBusy(true);
    try {
      await exportModelPdf({
        inputs, rows, caseLabel: CASE_LABEL[activeCase], lines: LINES,
        chartNodes: [chartOneRef.current, chartTwoRef.current],
      });
      toast.success("PDF report generated");
    } catch (e) {
      toast.error(`PDF export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPdfBusy(false);
    }
  };

  const exportCsv = () => {
    const header = ["Line item", ...rows.map(r => r.year)].join(",");
    const body = LINES.map(l => [`"${l.label}"`, ...rows.map(r => Math.round(r[l.key] as number))].join(",")).join("\n");
    const blob = new Blob([`${CASE_LABEL[activeCase]}\n${header}\n${body}`], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sgom-maxxwell-${activeCase}-case.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">Finance</Badge>
            <Badge variant="secondary">P&amp;L 2026–2030</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Combined Profitability Model — SGOM + Maxxwell Production</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Two revenue engines: SGOM software (SaaS) and SPT well restoration &amp; production. Switch between the
            original workbook (<em>upside</em>) and the corrected <em>base case</em> that adds Arps decline, royalty,
            severance tax, D&amp;A and SaaS churn.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setInputs(DEFAULT_INPUTS)} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportXlsx} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> XLSX
          </Button>
          <Button size="sm" onClick={exportPdf} disabled={pdfBusy} className="gap-2">
            {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {pdfBusy ? "Generating…" : "PDF report"}
          </Button>
        </div>
      </div>

      <Tabs value={activeCase} onValueChange={v => setActiveCase(v as CaseKey)}>
        <TabsList>
          <TabsTrigger value="base">Base case</TabsTrigger>
          <TabsTrigger value="upside">Upside case</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCase} className="mt-6 space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPI label="Revenue 2030" value={fmtUsd(last.revenue)} sub={`Cumulative 5y: ${fmtUsd(totalRevenue)}`} />
            <KPI label="EBITDA 2030" value={fmtUsd(last.ebitda)} tone={last.ebitda >= 0 ? "good" : "bad"}
              sub={breakeven ? `First EBITDA-positive year: ${breakeven}` : "No EBITDA-positive year in horizon"} />
            <KPI label="Net income 2030" value={fmtUsd(last.netIncome)} tone={last.netIncome >= 0 ? "good" : "bad"}
              sub={activeCase === "base" ? "After D&A, royalty, severance, tax" : "Tax on EBITDA, no D&A"} />
            <KPI label="Cash, end 2030" value={fmtUsd(last.cashEnd)} tone={last.cashEnd >= 0 ? "good" : "bad"}
              sub={`Cumulative FCF: ${fmtUsd(cumFcf)}`} />
          </div>

          {activeCase === "upside" && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="flex gap-3 p-4 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <div className="font-medium">This is the best-case scenario from the workbook.</div>
                  <p className="mt-1 text-muted-foreground">
                    Arithmetic is consistent, but production is held flat at {inputs.bblPerDay} bbl/d for five years,
                    royalty and severance tax are not deducted, tax is applied to EBITDA before depreciation, and SaaS
                    churn is 0%. Use the base case for underwriting.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCase === "base" && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="grid gap-4 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex gap-2"><TrendingDown className="h-4 w-4 shrink-0 text-primary" />
                  <span>Arps exponential decline <strong>Di = {(inputs.declineDi * 100).toFixed(1)}%/yr</strong>, half-year convention for new wells</span></div>
                <div className="flex gap-2"><Percent className="h-4 w-4 shrink-0 text-primary" />
                  <span>Royalty <strong>{(inputs.royaltyPct * 100).toFixed(2)}%</strong> + severance <strong>{(inputs.severancePct * 100).toFixed(1)}%</strong> deducted from oil revenue</span></div>
                <div className="flex gap-2"><Layers className="h-4 w-4 shrink-0 text-primary" />
                  <span>Capex depreciated straight-line over <strong>{inputs.daYears} yrs</strong>; tax on EBT with NOL carry-forward</span></div>
                <div className="flex gap-2"><Coins className="h-4 w-4 shrink-0 text-primary" />
                  <span>SaaS logo churn <strong>{(inputs.churn * 100).toFixed(0)}%/yr</strong> applied to the retained client base</span></div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Assumptions */}
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base">Assumptions</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <Knob label="Oil price" value={inputs.oilPrice} min={35} max={110} step={0.53}
                  onChange={v => set("oilPrice", v)} format={v => `$${v.toFixed(2)}/bbl`}
                  hint="REAL — $68.47 in Maxxwell's business plan" />
                <Knob label="Initial rate per well" value={inputs.bblPerDay} min={5} max={60} step={1}
                  onChange={v => set("bblPerDay", v)} format={v => `${v} bbl/d`}
                  hint="REAL — 30 bbl/d post-SPT benchmark" />
                <Knob label="Arps decline Di (base case)" value={inputs.declineDi} min={0} max={0.4} step={0.005}
                  onChange={v => set("declineDi", v)} format={v => `${(v * 100).toFixed(1)} %/yr`} />
                <Knob label="Royalty (base case)" value={inputs.royaltyPct} min={0} max={0.3} step={0.0025}
                  onChange={v => set("royaltyPct", v)} format={v => `${(v * 100).toFixed(2)} %`} />
                <Knob label="Severance / production tax" value={inputs.severancePct} min={0} max={0.15} step={0.005}
                  onChange={v => set("severancePct", v)} format={v => `${(v * 100).toFixed(1)} %`} />
                <Knob label="Well opex" value={inputs.opexPct} min={0.1} max={0.6} step={0.01}
                  onChange={v => set("opexPct", v)} format={v => `${(v * 100).toFixed(0)} % of gross oil revenue`} />
                <Knob label="SaaS churn (base case)" value={inputs.churn} min={0} max={0.4} step={0.01}
                  onChange={v => set("churn", v)} format={v => `${(v * 100).toFixed(0)} %/yr`} />
                <Knob label="Depreciation life" value={inputs.daYears} min={3} max={15} step={1}
                  onChange={v => set("daYears", v)} format={v => `${v} yrs`} />
                <Knob label="SPT capex per well" value={inputs.sptCapexPerWell} min={100000} max={500000} step={5000}
                  onChange={v => set("sptCapexPerWell", v)} format={v => fmtUsd(v, 2)}
                  hint="$1,157,840 / 4 wells from the SPT budget" />
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Revenue mix, EBITDA and cash ($K)</CardTitle></CardHeader>
                <CardContent style={{ minHeight: 320 }} ref={chartOneRef}>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}K`} />
                      <Legend />
                      <Bar dataKey="software" stackId="rev" name="Software" fill={colors.primary} />
                      <Bar dataKey="oil" stackId="rev" name="Oil (net)" fill={colors.muted} />
                      <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke={colors.danger} strokeWidth={2} dot />
                      <Line type="monotone" dataKey="cash" name="Cash" stroke={colors.primary} strokeDasharray="4 4" strokeWidth={2} dot />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Base vs upside — total revenue ($K)</CardTitle>
                </CardHeader>
                <CardContent style={{ minHeight: 260 }} ref={chartTwoRef}>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}K`} />
                      <Legend />
                      <Area type="monotone" dataKey="upsideRevenue" name="Upside" stroke={colors.muted} fill={colors.muted} fillOpacity={0.15} />
                      <Area type="monotone" dataKey="baseRevenue" name="Base" stroke={colors.primary} fill={colors.primary} fillOpacity={0.25} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="mt-3 text-xs text-muted-foreground">
                    2030 gap vs workbook: revenue {fmtUsd(deltaRevenue)}, net income {fmtUsd(deltaNi)}.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* P&L table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" /> P&amp;L — {CASE_LABEL[activeCase]}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 text-left font-medium">Line item</th>
                    {rows.map(r => <th key={r.year} className="py-2 text-right font-medium tabular-nums">{r.year}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {LINES.map(l => (
                    <tr key={String(l.key)} className={`border-b border-border/40 ${l.group ? "bg-muted/30 font-medium" : ""}`}>
                      <td className={`py-1.5 pr-4 ${l.negative ? "pl-4 text-muted-foreground" : ""}`}>{l.label}</td>
                      {rows.map(r => {
                        const v = r[l.key] as number;
                        return (
                          <td key={r.year} className={`py-1.5 text-right tabular-nums ${v < 0 ? "text-destructive" : ""}`}>
                            {v === 0 ? "–" : fmtFullUsd(l.negative ? -v : v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="text-muted-foreground">
                    <td className="py-1.5 pr-4">Memo: wells producing / avg rate</td>
                    {rows.map(r => (
                      <td key={r.year} className="py-1.5 text-right tabular-nums">
                        {r.wellsProducing} / {r.avgRatePerWell.toFixed(1)} bbl/d
                      </td>
                    ))}
                  </tr>
                  <tr className="text-muted-foreground">
                    <td className="py-1.5 pr-4">Memo: paying clients</td>
                    {rows.map(r => <td key={r.year} className="py-1.5 text-right tabular-nums">{r.payingClients.toFixed(1)}</td>)}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
