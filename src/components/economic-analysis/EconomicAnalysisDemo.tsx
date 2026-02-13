import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { DollarSign, TrendingUp, Clock, Calculator, CheckCircle2 } from "lucide-react";

const SPT_CANDIDATES = [
  { id: "W-001", name: "Oklahoma-1", currentProd: 12, projectedInflow: 34, reserves: 850, timeline: 18 },
  { id: "W-003", name: "Texas-1", currentProd: 15, projectedInflow: 41, reserves: 1200, timeline: 22 },
  { id: "W-005", name: "Oklahoma-3", currentProd: 18, projectedInflow: 48, reserves: 1500, timeline: 25 },
  { id: "W-007", name: "Oklahoma-4", currentProd: 16, projectedInflow: 43, reserves: 1100, timeline: 20 },
  { id: "W-009", name: "Oklahoma-5", currentProd: 14, projectedInflow: 39, reserves: 950, timeline: 19 },
  { id: "W-010", name: "Texas-5", currentProd: 17, projectedInflow: 45, reserves: 1300, timeline: 23 },
];

const EconomicAnalysisDemo = () => {
  const [oilPrice, setOilPrice] = useState(72);
  const [treatmentCost, setTreatmentCost] = useState(85000);
  const [opexPerBbl, setOpexPerBbl] = useState(18);

  const economics = useMemo(() => {
    return SPT_CANDIDATES.map((well) => {
      const addedProd = well.projectedInflow - well.currentProd;
      const dailyRevenue = addedProd * oilPrice;
      const dailyOpex = addedProd * opexPerBbl;
      const dailyProfit = dailyRevenue - dailyOpex;
      const annualGross = dailyRevenue * 365;
      const annualNet = dailyProfit * 365;
      const paybackDays = dailyProfit > 0 ? Math.ceil(treatmentCost / dailyProfit) : Infinity;
      const paybackMonths = +(paybackDays / 30.44).toFixed(1);
      const fiveYearROI = dailyProfit > 0 ? +(((annualNet * 5 - treatmentCost) / treatmentCost) * 100).toFixed(0) : 0;
      const fullPeriodNet = annualNet * well.timeline - treatmentCost;

      return { ...well, addedProd, dailyRevenue, dailyOpex, dailyProfit, annualGross, annualNet, paybackDays, paybackMonths, fiveYearROI, fullPeriodNet };
    });
  }, [oilPrice, treatmentCost, opexPerBbl]);

  const totals = useMemo(() => {
    const totalInvestment = treatmentCost * economics.length;
    const totalAnnualGross = economics.reduce((s, w) => s + w.annualGross, 0);
    const totalAnnualNet = economics.reduce((s, w) => s + w.annualNet, 0);
    const avgPayback = +(economics.reduce((s, w) => s + w.paybackMonths, 0) / economics.length).toFixed(1);
    const totalFullPeriod = economics.reduce((s, w) => s + w.fullPeriodNet, 0);
    return { totalInvestment, totalAnnualGross, totalAnnualNet, avgPayback, totalFullPeriod };
  }, [economics, treatmentCost]);

  const roiChartData = economics.map((w) => ({
    name: w.name,
    paybackMonths: w.paybackMonths,
    fiveYearROI: w.fiveYearROI,
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
        const cumRevenue = w.dailyProfit * 30.44 * m - treatmentCost;
        point[w.name] = Math.round(cumRevenue);
      });
      months.push(point);
    }
    return months;
  }, [economics, treatmentCost]);

  const colors = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Economic Analysis — Stage 5
        </h2>
        <p className="text-muted-foreground">
          ROI calculation, payback period, annual profit projection for SPT treatment candidates
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Investment", value: `$${(totals.totalInvestment / 1000).toFixed(0)}k`, icon: Calculator },
          { label: "Annual Gross Revenue", value: `$${(totals.totalAnnualGross / 1e6).toFixed(2)}M`, icon: TrendingUp },
          { label: "Annual Net Profit", value: `$${(totals.totalAnnualNet / 1e6).toFixed(2)}M`, icon: DollarSign },
          { label: "Avg Payback", value: `${totals.avgPayback} mo`, icon: Clock },
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

      {/* Parameters */}
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

      {/* Tabs */}
      <Tabs defaultValue="roi" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roi">ROI & Payback</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative</TabsTrigger>
          <TabsTrigger value="details">Well Details</TabsTrigger>
        </TabsList>

        <TabsContent value="roi">
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
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit">
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
        </TabsContent>

        <TabsContent value="cumulative">
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
        </TabsContent>

        <TabsContent value="details">
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
                        <p className="text-xs text-muted-foreground">Added production: +{w.addedProd} bbl/day</p>
                      </div>
                      <Badge variant="default" className="bg-primary">ROI {w.fiveYearROI}%</Badge>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm">
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
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="text-sm">Stage 5 Summary</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            Total investment: <span className="font-semibold">${(totals.totalInvestment / 1000).toFixed(0)}k</span> for {economics.length} wells.
            Average payback: <span className="font-semibold">{totals.avgPayback} months</span>.
          </p>
          <p>
            Projected annual net profit: <span className="font-semibold">${(totals.totalAnnualNet / 1e6).toFixed(2)}M</span>.
            Full operational period return: <span className="font-semibold">${(totals.totalFullPeriod / 1e6).toFixed(1)}M</span>.
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-2">
            Net Profit = (Added Production × Oil Price − OPEX) × 365 × Timeline − Treatment Cost
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EconomicAnalysisDemo;
