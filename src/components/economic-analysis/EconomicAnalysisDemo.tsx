import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from "recharts";
import { DollarSign, TrendingUp, Clock, Calculator, CheckCircle2 } from "lucide-react";
import {
  DEFAULT_OIL_PRICE, DEFAULT_OPEX_PER_BBL, DEFAULT_TREATMENT_COST, arpsRate, calcIRR,
} from "@/lib/economics-config";
import MonteCarloSimulation from "./MonteCarloSimulation";
import QuantumMonteCarloSimulation from "./QuantumMonteCarloSimulation";
import { useFullReportExport, ExportFullReportButton } from "./FullReportExport";

function arpsCumulative(qi: number, Di: number, b: number, months: number): number {
  let cum = 0;
  for (let m = 1; m <= months; m++) {
    cum += arpsRate(qi, Di, b, m) * 30.44;
  }
  return cum;
}

const SPT_CANDIDATES = [
  { id: "W-001", name: "Oklahoma-1", currentProd: 12, projectedInflow: 19, reserves: 850, timeline: 18, Di: 0.025, b: 0.5 },
  { id: "W-003", name: "Texas-1", currentProd: 15, projectedInflow: 21, reserves: 1200, timeline: 22, Di: 0.020, b: 0.6 },
  { id: "W-005", name: "Oklahoma-3", currentProd: 18, projectedInflow: 26, reserves: 1500, timeline: 25, Di: 0.030, b: 0.4 },
  { id: "W-007", name: "Oklahoma-4", currentProd: 16, projectedInflow: 22, reserves: 1100, timeline: 20, Di: 0.022, b: 0.55 },
  { id: "W-009", name: "Oklahoma-5", currentProd: 14, projectedInflow: 20, reserves: 950, timeline: 19, Di: 0.028, b: 0.45 },
  { id: "W-010", name: "Texas-5", currentProd: 17, projectedInflow: 24, reserves: 1300, timeline: 23, Di: 0.018, b: 0.65 },
];

const EconomicAnalysisDemo = () => {
  const [oilPrice, setOilPrice] = useState(DEFAULT_OIL_PRICE);
  const [treatmentCost, setTreatmentCost] = useState(DEFAULT_TREATMENT_COST);
  const [opexPerBbl, setOpexPerBbl] = useState(DEFAULT_OPEX_PER_BBL);

  const { exporting, exportFullPDF, refs: exportRefs } = useFullReportExport();

  const economics = useMemo(() => {
    return SPT_CANDIDATES.map((well) => {
      const addedProd = well.projectedInflow - well.currentProd;
      const timelineMonths = well.timeline * 12;

      let totalRevenue = 0;
      let totalOpex = 0;
      for (let m = 1; m <= timelineMonths; m++) {
        const monthlyRate = arpsRate(addedProd, well.Di, well.b, m);
        const monthBarrels = monthlyRate * 30.44;
        totalRevenue += monthBarrels * oilPrice;
        totalOpex += monthBarrels * opexPerBbl;
      }
      const totalNet = totalRevenue - totalOpex - treatmentCost;

      let year1Revenue = 0;
      let year1Opex = 0;
      for (let m = 1; m <= 12; m++) {
        const monthlyRate = arpsRate(addedProd, well.Di, well.b, m);
        const monthBarrels = monthlyRate * 30.44;
        year1Revenue += monthBarrels * oilPrice;
        year1Opex += monthBarrels * opexPerBbl;
      }
      const annualGross = year1Revenue;
      const annualNet = year1Revenue - year1Opex;

      let cumProfit = 0;
      let paybackMonths = Infinity;
      for (let m = 1; m <= timelineMonths; m++) {
        const monthlyRate = arpsRate(addedProd, well.Di, well.b, m);
        const monthBarrels = monthlyRate * 30.44;
        cumProfit += monthBarrels * (oilPrice - opexPerBbl);
        if (cumProfit >= treatmentCost && paybackMonths === Infinity) {
          paybackMonths = m;
        }
      }
      paybackMonths = paybackMonths === Infinity ? 999 : paybackMonths;

      let fiveYearNet = 0;
      for (let m = 1; m <= 60; m++) {
        const monthlyRate = arpsRate(addedProd, well.Di, well.b, m);
        fiveYearNet += monthlyRate * 30.44 * (oilPrice - opexPerBbl);
      }
      const fiveYearROI = +((fiveYearNet - treatmentCost) / treatmentCost * 100).toFixed(0);

      const irr = calcIRR(addedProd, oilPrice, opexPerBbl, treatmentCost, well.Di, well.b);

      return {
        ...well, addedProd, annualGross, annualNet,
        paybackMonths: +(paybackMonths).toFixed(1),
        fiveYearROI, irr, fullPeriodNet: totalNet,
        dailyProfit: addedProd * (oilPrice - opexPerBbl),
      };
    });
  }, [oilPrice, treatmentCost, opexPerBbl]);

  const totals = useMemo(() => {
    const totalInvestment = treatmentCost * economics.length;
    const totalAnnualGross = economics.reduce((s, w) => s + w.annualGross, 0);
    const totalAnnualNet = economics.reduce((s, w) => s + w.annualNet, 0);
    const avgPayback = +(economics.reduce((s, w) => s + w.paybackMonths, 0) / economics.length).toFixed(1);
    const totalFullPeriod = economics.reduce((s, w) => s + w.fullPeriodNet, 0);
    const avgIRR = +(economics.reduce((s, w) => s + w.irr, 0) / economics.length).toFixed(0);
    return { totalInvestment, totalAnnualGross, totalAnnualNet, avgPayback, totalFullPeriod, avgIRR };
  }, [economics, treatmentCost]);

  const roiChartData = economics.map((w) => ({
    name: w.name,
    paybackMonths: w.paybackMonths,
    fiveYearROI: w.fiveYearROI,
    irr: Math.round(w.irr),
  }));

  const profitChartData = economics.map((w) => ({
    name: w.name,
    annualGross: Math.round(w.annualGross),
    annualNet: Math.round(w.annualNet),
    treatmentCost: treatmentCost,
  }));

  const cumulativeData = useMemo(() => {
    const months: { month: number; [key: string]: number }[] = [];
    for (let m = 0; m <= 60; m++) {
      const point: any = { month: m };
      economics.forEach((w) => {
        let cumProfit = -treatmentCost;
        const candidate = SPT_CANDIDATES.find(c => c.id === w.id)!;
        for (let mo = 1; mo <= m; mo++) {
          const rate = arpsRate(w.addedProd, candidate.Di, candidate.b, mo);
          cumProfit += rate * 30.44 * (oilPrice - opexPerBbl);
        }
        point[w.name] = Math.round(cumProfit);
      });
      months.push(point);
    }
    return months;
  }, [economics, treatmentCost, oilPrice, opexPerBbl]);

  const sensitivityData = useMemo(() => {
    const prices = [];
    for (let p = 40; p <= 120; p += 5) {
      const point: any = { price: `$${p}` };
      SPT_CANDIDATES.forEach((well) => {
        const addedProd = well.projectedInflow - well.currentProd;
        let fiveYearNet = 0;
        for (let m = 1; m <= 60; m++) {
          const rate = arpsRate(addedProd, well.Di, well.b, m);
          fiveYearNet += rate * 30.44 * (p - opexPerBbl);
        }
        point[well.name] = +((fiveYearNet - treatmentCost) / treatmentCost * 100).toFixed(0);
      });
      const wellNames = SPT_CANDIDATES.map(w => w.name);
      point["Avg"] = Math.round(wellNames.reduce((s, n) => s + point[n], 0) / wellNames.length);
      prices.push(point);
    }
    return prices;
  }, [treatmentCost, opexPerBbl]);

  const OIL_PRICES_MATRIX = [50, 60, 72, 85, 100];
  const CAPEX_MATRIX = [50000, 65000, 85000, 120000, 150000];

  const sensitivityMatrix = useMemo(() => {
    return OIL_PRICES_MATRIX.map((price) => {
      const row: { price: number; [key: string]: number } = { price };
      CAPEX_MATRIX.forEach((capex) => {
        let totalROI = 0;
        SPT_CANDIDATES.forEach((well) => {
          const addedProd = well.projectedInflow - well.currentProd;
          let fiveYearNet = 0;
          for (let m = 1; m <= 60; m++) {
            const rate = arpsRate(addedProd, well.Di, well.b, m);
            fiveYearNet += rate * 30.44 * (price - opexPerBbl);
          }
          totalROI += (fiveYearNet - capex) / capex * 100;
        });
        row[`capex_${capex}`] = Math.round(totalROI / SPT_CANDIDATES.length);
      });
      return row;
    });
  }, [opexPerBbl]);

  const colors = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Economic Analysis — Stage 5
          </h2>
          <p className="text-muted-foreground">
            ROI calculation, payback period, annual profit projection for SPT treatment candidates
          </p>
        </div>
        <ExportFullReportButton exporting={exporting} onClick={exportFullPDF} />
      </div>

      {/* KPI Cards */}
      <div ref={exportRefs.kpiRef}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: "Total Investment", value: `$${(totals.totalInvestment / 1000).toFixed(0)}k`, icon: Calculator },
            { label: "Annual Gross Revenue", value: `$${(totals.totalAnnualGross / 1e6).toFixed(2)}M`, icon: TrendingUp },
            { label: "Annual Net Profit", value: `$${(totals.totalAnnualNet / 1e6).toFixed(2)}M`, icon: DollarSign },
            { label: "Avg Payback", value: `${totals.avgPayback} mo`, icon: Clock },
            { label: "Avg IRR", value: `${totals.avgIRR}%`, icon: TrendingUp },
            { label: "Full Period Net", value: `$${(totals.totalFullPeriod / 1e6).toFixed(1)}M`, icon: CheckCircle2 },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Parameters */}
      <div ref={exportRefs.paramsRef}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scenario Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Oil Price: <span className="font-semibold text-foreground">${oilPrice}/bbl</span></label>
                <Slider value={[oilPrice]} onValueChange={([v]) => setOilPrice(v)} min={40} max={120} step={1} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Treatment Cost: <span className="font-semibold text-foreground">${(treatmentCost / 1000).toFixed(0)}k</span></label>
                <Slider value={[treatmentCost]} onValueChange={([v]) => setTreatmentCost(v)} min={30000} max={200000} step={5000} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">OPEX: <span className="font-semibold text-foreground">${opexPerBbl}/bbl</span></label>
                <Slider value={[opexPerBbl]} onValueChange={([v]) => setOpexPerBbl(v)} min={5} max={40} step={1} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roi" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="roi">ROI & Payback</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
          <TabsTrigger value="montecarlo">Monte Carlo</TabsTrigger>
          <TabsTrigger value="quantum">⚛ Quantum MC</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative</TabsTrigger>
          <TabsTrigger value="details">Well Details</TabsTrigger>
        </TabsList>

        <TabsContent value="roi">
          <div ref={exportRefs.roiRef}>
            <Card>
              <CardHeader><CardTitle>Payback Period & 5-Year ROI per Well</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={roiChartData} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" label={{ value: "Months", angle: -90, position: "insideLeft" }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: "ROI %", angle: 90, position: "insideRight" }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="paybackMonths" fill="hsl(var(--primary))" name="Payback (months)" />
                    <Bar yAxisId="right" dataKey="fiveYearROI" fill="#22c55e" name="5-Year ROI %" />
                    <Bar yAxisId="right" dataKey="irr" fill="#f59e0b" name="IRR % (Annual)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sensitivity">
          <div ref={exportRefs.sensitivityRef} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ROI Matrix — Oil Price × CAPEX (Portfolio Average)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-muted-foreground border border-border/40">Oil Price ↓ / CAPEX →</th>
                        {CAPEX_MATRIX.map((c) => (
                          <th key={c} className={`p-2 text-center border border-border/40 ${c === treatmentCost ? 'bg-primary/20 font-bold' : 'text-muted-foreground'}`}>
                            ${(c / 1000).toFixed(0)}K
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivityMatrix.map((row) => (
                        <tr key={row.price}>
                          <td className={`p-2 font-medium border border-border/40 ${row.price === oilPrice ? 'bg-primary/20 font-bold' : ''}`}>
                            ${row.price}/bbl
                          </td>
                          {CAPEX_MATRIX.map((capex) => {
                            const val = row[`capex_${capex}`];
                            const bg = val >= 300 ? 'bg-green-500/30 text-green-200'
                              : val >= 150 ? 'bg-green-500/15 text-green-300'
                              : val >= 50 ? 'bg-yellow-500/15 text-yellow-300'
                              : val >= 0 ? 'bg-orange-500/15 text-orange-300'
                              : 'bg-red-500/20 text-red-300';
                            const isCurrentCell = row.price === oilPrice && capex === treatmentCost;
                            return (
                              <td key={capex} className={`p-2 text-center font-mono border border-border/40 ${bg} ${isCurrentCell ? 'ring-2 ring-primary font-bold' : ''}`}>
                                {val}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Highlighted cell = current scenario (${oilPrice}/bbl, ${(treatmentCost / 1000).toFixed(0)}K CAPEX). Green ≥150%, Yellow ≥50%, Orange ≥0%, Red = negative.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sensitivity — ROI vs Oil Price (at current CAPEX ${(treatmentCost / 1000).toFixed(0)}K)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={sensitivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="price" />
                    <YAxis tickFormatter={(v) => `${v}%`} label={{ value: "5-Year ROI %", angle: -90, position: "insideLeft" }} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend />
                    <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Break-even", position: "right", fill: "hsl(var(--destructive))" }} />
                    <ReferenceLine x={`$${oilPrice}`} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Current", position: "top", fill: "hsl(var(--primary))" }} />
                    {SPT_CANDIDATES.map((w, i) => (
                      <Line key={w.id} type="monotone" dataKey={w.name} stroke={colors[i]} strokeWidth={1.5} dot={false} opacity={0.5} />
                    ))}
                    <Line type="monotone" dataKey="Avg" stroke="hsl(var(--foreground))" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">
                  Bold line = portfolio average. Dashed red = break-even. Dashed blue = current oil price.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="montecarlo">
          <div ref={exportRefs.monteCarloRef}>
            <MonteCarloSimulation
              baseOilPrice={oilPrice}
              baseTreatmentCost={treatmentCost}
              baseOpex={opexPerBbl}
              wells={SPT_CANDIDATES.map((w) => ({
                name: w.name,
                addedProd: w.projectedInflow - w.currentProd,
                Di: w.Di,
                b: w.b,
              }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="quantum">
          <QuantumMonteCarloSimulation
            baseOilPrice={oilPrice}
            baseTreatmentCost={treatmentCost}
            baseOpex={opexPerBbl}
            wells={SPT_CANDIDATES.map((w) => ({
              name: w.name,
              addedProd: w.projectedInflow - w.currentProd,
              Di: w.Di,
              b: w.b,
            }))}
          />
        </TabsContent>

        <TabsContent value="profit">
          <div ref={exportRefs.profitRef}>
            <Card>
              <CardHeader><CardTitle>Annual Gross vs. Net Profit per Well</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={profitChartData} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="annualGross" fill="hsl(var(--primary))" name="Annual Gross" />
                    <Bar dataKey="annualNet" fill="#22c55e" name="Annual Net Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cumulative">
          <div ref={exportRefs.cumulativeRef}>
            <Card>
              <CardHeader><CardTitle>Cumulative Net Profit (60-month projection)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Legend />
                    {economics.map((w, i) => (
                      <Area key={w.id} type="monotone" dataKey={w.name} stroke={colors[i]} fill={colors[i]} fillOpacity={0.1} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">Break-even point = where curve crosses $0</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div ref={exportRefs.detailsRef}>
            <Card>
              <CardHeader><CardTitle>Per-Well Economic Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {economics.map((w) => (
                    <div key={w.id} className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            {w.name}
                          </p>
                          <p className="text-xs text-muted-foreground">Initial added: +{w.addedProd} bbl/d (Di={SPT_CANDIDATES.find(c=>c.id===w.id)?.Di}, b={SPT_CANDIDATES.find(c=>c.id===w.id)?.b})</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="default" className="bg-primary">ROI {w.fiveYearROI}%</Badge>
                          <Badge variant="outline" className="text-amber-500 border-amber-500/40">IRR {w.irr.toFixed(0)}%</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Payback</p>
                          <p className="font-semibold">{w.paybackMonths} mo</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Annual Gross</p>
                          <p className="font-semibold">${(w.annualGross / 1000).toFixed(0)}k</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Annual Net</p>
                          <p className="font-semibold">${(w.annualNet / 1000).toFixed(0)}k</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">IRR</p>
                          <p className="font-semibold text-amber-500">{w.irr.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Timeline</p>
                          <p className="font-semibold">{w.timeline} yr</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Full Period Net</p>
                          <p className="font-semibold">${(w.fullPeriodNet / 1e6).toFixed(2)}M</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <div ref={exportRefs.summaryRef}>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-sm">Stage 6 Summary (Arps Decline Model)</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              Total investment: <span className="font-semibold">${(totals.totalInvestment / 1000).toFixed(0)}k</span> for {economics.length} wells.
              Average payback: <span className="font-semibold">{totals.avgPayback} months</span>.
            </p>
            <p>
              Year 1 net profit (with decline): <span className="font-semibold">${(totals.totalAnnualNet / 1e6).toFixed(2)}M</span>.
              Full period return: <span className="font-semibold">${(totals.totalFullPeriod / 1e6).toFixed(1)}M</span>.
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-2">
              q(t) = q_added / (1 + b·Di·t)^(1/b) · Net = Σ[q(m)·30.44·(Price − OPEX)] − CAPEX
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EconomicAnalysisDemo;
