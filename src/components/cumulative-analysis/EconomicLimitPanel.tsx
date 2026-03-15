import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Fuel, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  DEFAULT_OIL_PRICE,
  DEFAULT_OPEX_PER_BBL,
  arpsRate,
  ARPS_DEFAULTS,
} from "@/lib/economics-config";

interface ProductionPoint {
  month: number;
  rate: number;
  cumOil: number;
}

interface Props {
  productionData: ProductionPoint[];
}

export const EconomicLimitPanel = ({ productionData }: Props) => {
  const [oilPrice, setOilPrice] = useState(DEFAULT_OIL_PRICE);
  const [opexPerBbl, setOpexPerBbl] = useState(DEFAULT_OPEX_PER_BBL);
  const [minEconomicRate, setMinEconomicRate] = useState(5); // bbl/d

  // Calculate economic limit from price/opex: rate where monthly revenue = monthly cost
  // Revenue per day = q * oilPrice; Cost per day = q * opex + fixedDaily
  // At economic limit: q * (oilPrice - opex) = 0 → simplified: q_econ = 0 if price > opex
  // More realistic: include fixed costs per day
  const [fixedMonthlyCost, setFixedMonthlyCost] = useState(1500); // $/month fixed overhead

  const analysis = useMemo(() => {
    if (productionData.length === 0) return null;

    const initialRate = productionData[0]?.rate ?? 0;
    // Calculate economic limit rate: q where q*(oilPrice - opex)*30.44 = fixedMonthlyCost
    const netPerBbl = oilPrice - opexPerBbl;
    const calculatedEconRate = netPerBbl > 0
      ? fixedMonthlyCost / (netPerBbl * 30.44)
      : Infinity;

    // Use the higher of calculated economic rate or user-set minimum
    const effectiveEconRate = Math.max(calculatedEconRate, minEconomicRate);

    // Find month when rate drops below economic limit
    let econLimitMonth: number | null = null;
    let economicCumOil = 0;
    let totalRevenue = 0;
    let totalOpex = 0;
    let totalFixed = 0;

    // Extend beyond 60 months using Arps extrapolation if needed
    const Di = ARPS_DEFAULTS.Di;
    const b = ARPS_DEFAULTS.b;
    const maxMonths = 240; // 20-year horizon

    const extendedData: { month: number; rate: number; cumOil: number; revenue: number; cost: number; netProfit: number; cumProfit: number }[] = [];
    let cumProfit = 0;

    for (let m = 0; m < maxMonths; m++) {
      const rate = m < productionData.length
        ? productionData[m].rate
        : arpsRate(initialRate, Di, b, m);

      if (rate <= 0) break;

      const monthlyOil = rate * 30.44;
      economicCumOil += monthlyOil;
      const monthRevenue = monthlyOil * oilPrice;
      const monthOpex = monthlyOil * opexPerBbl;
      const monthTotal = monthOpex + fixedMonthlyCost;
      const monthNet = monthRevenue - monthTotal;
      cumProfit += monthNet;

      totalRevenue += monthRevenue;
      totalOpex += monthOpex;
      totalFixed += fixedMonthlyCost;

      extendedData.push({
        month: m + 1,
        rate,
        cumOil: Math.round(economicCumOil),
        revenue: monthRevenue,
        cost: monthTotal,
        netProfit: monthNet,
        cumProfit,
      });

      if (rate < effectiveEconRate && econLimitMonth === null) {
        econLimitMonth = m + 1;
      }
    }

    // Economic reserves = cumulative oil up to economic limit
    const econReserves = econLimitMonth
      ? extendedData.find(d => d.month === econLimitMonth)?.cumOil ?? 0
      : economicCumOil;

    const totalNet = totalRevenue - totalOpex - totalFixed;

    return {
      effectiveEconRate,
      calculatedEconRate,
      econLimitMonth,
      econReserves,
      totalRevenue,
      totalOpex,
      totalFixed,
      totalNet,
      extendedData,
      initialRate,
      netPerBbl,
    };
  }, [productionData, oilPrice, opexPerBbl, minEconomicRate, fixedMonthlyCost]);

  if (productionData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-center py-12">
            Run the pipeline to calculate economic limits.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-6">
        {/* Parameter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/10">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Economic Parameters
            </h4>

            <div className="space-y-2">
              <Label className="text-xs">Oil Price ($/bbl)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[oilPrice]}
                  onValueChange={([v]) => setOilPrice(v)}
                  min={30}
                  max={150}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={oilPrice}
                  onChange={(e) => setOilPrice(Number(e.target.value) || 0)}
                  className="w-20 h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">OPEX per barrel ($/bbl)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[opexPerBbl]}
                  onValueChange={([v]) => setOpexPerBbl(v)}
                  min={5}
                  max={60}
                  step={0.5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={opexPerBbl}
                  onChange={(e) => setOpexPerBbl(Number(e.target.value) || 0)}
                  className="w-20 h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Fixed Monthly Cost ($)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[fixedMonthlyCost]}
                  onValueChange={([v]) => setFixedMonthlyCost(v)}
                  min={0}
                  max={10000}
                  step={100}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={fixedMonthlyCost}
                  onChange={(e) => setFixedMonthlyCost(Number(e.target.value) || 0)}
                  className="w-20 h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Min Economic Rate (bbl/d)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[minEconomicRate]}
                  onValueChange={([v]) => setMinEconomicRate(v)}
                  min={0.5}
                  max={30}
                  step={0.5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={minEconomicRate}
                  onChange={(e) => setMinEconomicRate(Number(e.target.value) || 0)}
                  className="w-20 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {analysis && (
            <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/10">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Economic Limit Results
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-background rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Economic Rate Limit</p>
                  <p className="text-lg font-bold text-destructive">
                    {analysis.effectiveEconRate.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">bbl/d</p>
                </div>
                <div className="p-3 bg-background rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Economic Life</p>
                  <p className="text-lg font-bold text-primary">
                    {analysis.econLimitMonth ? `${analysis.econLimitMonth}` : ">240"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">months</p>
                </div>
                <div className="p-3 bg-background rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Economic Reserves</p>
                  <p className="text-lg font-bold">
                    {(analysis.econReserves / 1000).toFixed(1)}K
                  </p>
                  <p className="text-[10px] text-muted-foreground">bbl (EUR)</p>
                </div>
                <div className="p-3 bg-background rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Net per Barrel</p>
                  <p className={`text-lg font-bold ${analysis.netPerBbl > 0 ? "text-green-500" : "text-destructive"}`}>
                    ${analysis.netPerBbl.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">$/bbl margin</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-medium text-green-500">${(analysis.totalRevenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Variable OPEX</span>
                  <span className="font-medium text-destructive">-${(analysis.totalOpex / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fixed Costs</span>
                  <span className="font-medium text-destructive">-${(analysis.totalFixed / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="font-medium">Net Profit</span>
                  <span className={`font-bold ${analysis.totalNet > 0 ? "text-green-500" : "text-destructive"}`}>
                    ${(analysis.totalNet / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>

              <div className="pt-2">
                {analysis.netPerBbl <= 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Uneconomic at current prices
                  </Badge>
                ) : analysis.econLimitMonth && analysis.econLimitMonth < 24 ? (
                  <Badge variant="outline" className="text-xs text-warning border-warning/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Short economic life ({analysis.econLimitMonth} months)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Economically viable
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profitability Chart */}
        {analysis && analysis.extendedData.length > 0 && (
          <div className="p-4 rounded-lg border border-border/50 bg-muted/10 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Fuel className="h-4 w-4 text-primary" />
              Monthly Revenue vs Cost (Economic Limit Visualization)
            </h4>
            <div className="relative h-52 bg-background rounded-lg overflow-hidden">
              <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid */}
                {[0, 50, 100, 150, 200].map(y => (
                  <line key={y} x1="0" y1={y} x2="600" y2={y}
                    stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />
                ))}

                {(() => {
                  const data = analysis.extendedData;
                  const maxVal = Math.max(
                    ...data.slice(0, Math.min(data.length, 120)).map(d => Math.max(d.revenue, d.cost))
                  );
                  const displayMonths = Math.min(data.length, analysis.econLimitMonth ? analysis.econLimitMonth + 12 : 120);
                  const slice = data.slice(0, displayMonths);

                  const xScale = (i: number) => (i / (displayMonths - 1)) * 600;
                  const yScale = (v: number) => 200 - (v / maxVal) * 180;

                  const revPath = slice.map((d, i) => `${xScale(i)},${yScale(d.revenue)}`).join(" L ");
                  const costPath = slice.map((d, i) => `${xScale(i)},${yScale(d.cost)}`).join(" L ");

                  // Economic limit line
                  const econX = analysis.econLimitMonth && analysis.econLimitMonth <= displayMonths
                    ? xScale(analysis.econLimitMonth - 1) : null;

                  return (
                    <>
                      {/* Revenue fill */}
                      <path
                        d={`M ${revPath} L ${xScale(slice.length - 1)},200 L 0,200 Z`}
                        fill="hsl(142 71% 45% / 0.1)"
                      />
                      {/* Revenue line */}
                      <path d={`M ${revPath}`} fill="none"
                        stroke="hsl(142, 71%, 45%)" strokeWidth="2" />
                      {/* Cost line */}
                      <path d={`M ${costPath}`} fill="none"
                        stroke="hsl(var(--destructive))" strokeWidth="2" strokeDasharray="4 3" />
                      {/* Economic limit vertical */}
                      {econX && (
                        <>
                          <line x1={econX} y1="0" x2={econX} y2="200"
                            stroke="hsl(var(--destructive))" strokeWidth="1.5" strokeDasharray="6 4" />
                          <text x={econX + 4} y="14" fontSize="9"
                            fill="hsl(var(--destructive))">
                            Econ. Limit
                          </text>
                        </>
                      )}
                    </>
                  );
                })()}
              </svg>

              {/* Legend */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] bg-background/80 rounded p-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded" style={{ background: "hsl(142, 71%, 45%)" }} />
                  <span>Monthly Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded" style={{ background: "hsl(var(--destructive))" }} />
                  <span>Monthly Cost</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formula */}
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <h4 className="text-sm font-semibold mb-2">Economic Limit Formula</h4>
          <div className="bg-background rounded p-3 font-mono text-xs space-y-1.5">
            <p className="text-muted-foreground">Economic limit rate (q<sub>econ</sub>):</p>
            <p className="text-primary font-semibold">
              q<sub>econ</sub> = C<sub>fixed</sub> / ((P<sub>oil</sub> − OPEX<sub>var</sub>) × 30.44)
            </p>
            <p className="text-muted-foreground mt-2">Where:</p>
            <p className="text-muted-foreground">
              C<sub>fixed</sub> = ${fixedMonthlyCost}/mo | P<sub>oil</sub> = ${oilPrice}/bbl | OPEX<sub>var</sub> = ${opexPerBbl}/bbl
            </p>
            <p className="text-muted-foreground mt-1">
              = {fixedMonthlyCost} / (({oilPrice} − {opexPerBbl}) × 30.44) = <span className="text-primary font-semibold">
                {analysis ? analysis.calculatedEconRate.toFixed(2) : "—"} bbl/d
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
