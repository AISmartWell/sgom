import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, Calendar, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_OIL_PRICE, FINANCIAL_DEFAULTS, ARPS_DEFAULTS, arpsRate, calcFiveYearROI,
} from "@/lib/economics-config";

const FinancialCalculator = () => {
  const [oilPrice, setOilPrice] = useState(DEFAULT_OIL_PRICE);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [landCost, setLandCost] = useState(FINANCIAL_DEFAULTS.landCost);
  const [recoveryCost, setRecoveryCost] = useState(FINANCIAL_DEFAULTS.recoveryCost);
  const [wellCount, setWellCount] = useState(FINANCIAL_DEFAULTS.wellCount);
  const [productionIncrease, setProductionIncrease] = useState(FINANCIAL_DEFAULTS.productionIncrease);
  const [operatingCostPercent, setOperatingCostPercent] = useState(FINANCIAL_DEFAULTS.operatingCostPercent);

  // Fetch current oil price
  useEffect(() => {
    const fetchOilPrice = async () => {
      setIsLoadingPrice(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-oil-price`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        const data = await response.json();
        if (data.price) setOilPrice(data.price);
      } catch (error) {
        console.error("Failed to fetch oil price:", error);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchOilPrice();
    const interval = setInterval(fetchOilPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Unified Arps-based calculations
  const calculations = useMemo(() => {
    const totalInvestment = landCost + recoveryCost;
    const perWellProduction = productionIncrease / wellCount;
    // Effective OPEX $/bbl from percentage of revenue
    const opexPerBbl = oilPrice * (operatingCostPercent / 100);

    // Use Arps decline for each well, then aggregate
    const perWell = calcFiveYearROI(
      perWellProduction, oilPrice, opexPerBbl, totalInvestment / wellCount,
      ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b,
    );

    // Portfolio totals
    const fiveYearNet = perWell.fiveYearNet * wellCount;
    const totalROI = totalInvestment > 0 ? ((fiveYearNet - totalInvestment) / totalInvestment) * 100 : 0;

    // Year 1 revenue/profit with decline
    let year1Revenue = 0;
    let year1Opex = 0;
    for (let m = 1; m <= 12; m++) {
      const rate = arpsRate(productionIncrease, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b, m);
      year1Revenue += rate * 30.44 * oilPrice;
      year1Opex += rate * 30.44 * opexPerBbl;
    }
    const year1Profit = year1Revenue - year1Opex - totalInvestment;

    // Year 2 profit with decline (months 13-24)
    let year2Revenue = 0;
    let year2Opex = 0;
    for (let m = 13; m <= 24; m++) {
      const rate = arpsRate(productionIncrease, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b, m);
      year2Revenue += rate * 30.44 * oilPrice;
      year2Opex += rate * 30.44 * opexPerBbl;
    }
    const year2Profit = year2Revenue - year2Opex;

    // Years 2-5 profit (months 13-60)
    let years2to5Revenue = 0;
    let years2to5Opex = 0;
    for (let m = 13; m <= 60; m++) {
      const rate = arpsRate(productionIncrease, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b, m);
      years2to5Revenue += rate * 30.44 * oilPrice;
      years2to5Opex += rate * 30.44 * opexPerBbl;
    }
    const years2to5Profit = years2to5Revenue - years2to5Opex;

    // Initial daily revenue (month 1 rate)
    const initialRate = arpsRate(productionIncrease, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b, 1);
    const dailyRevenue = initialRate * oilPrice;

    // Annual revenue (year 1)
    const annualRevenue = year1Revenue;

    return {
      totalInvestment,
      dailyRevenue,
      annualRevenue,
      operatingCosts: year1Opex,
      year1Profit,
      year2Profit,
      years2to5Profit,
      perWellProduction,
      paybackMonths: perWell.paybackMonths,
      roi: totalROI,
    };
  }, [oilPrice, landCost, recoveryCost, wellCount, productionIncrease, operatingCostPercent]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const refreshOilPrice = async () => {
    setIsLoadingPrice(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-oil-price`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const data = await response.json();
      if (data.price) setOilPrice(data.price);
    } catch (error) {
      console.error("Failed to refresh oil price:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Calculation Parameters
          </CardTitle>
          <CardDescription>Enter data to calculate ROI (Arps Decline Model)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="oilPrice">Oil Price (WTI), $/barrel</Label>
              <Button variant="ghost" size="sm" onClick={refreshOilPrice} className="h-6 w-6 p-0" disabled={isLoadingPrice}>
                <RefreshCw className={`h-4 w-4 ${isLoadingPrice ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <Input id="oilPrice" type="number" value={oilPrice} onChange={(e) => setOilPrice(Number(e.target.value))} className="bg-background/50" disabled={isLoadingPrice} />
            {isLoadingPrice && <p className="text-xs text-muted-foreground">Updating price...</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="landCost">Land + Wells Cost, $</Label>
            <Input id="landCost" type="number" value={landCost} onChange={(e) => setLandCost(Number(e.target.value))} className="bg-background/50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recoveryCost">Recovery Costs, $</Label>
            <Input id="recoveryCost" type="number" value={recoveryCost} onChange={(e) => setRecoveryCost(Number(e.target.value))} className="bg-background/50" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Well Count</Label>
              <span className="text-sm font-medium text-primary">{wellCount}</span>
            </div>
            <Slider value={[wellCount]} onValueChange={(value) => setWellCount(value[0])} min={1} max={20} step={1} className="py-2" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Production Increase, barrels/day</Label>
              <span className="text-sm font-medium text-primary">{productionIncrease}</span>
            </div>
            <Slider value={[productionIncrease]} onValueChange={(value) => setProductionIncrease(value[0])} min={10} max={500} step={10} className="py-2" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Operating Costs, %</Label>
              <span className="text-sm font-medium text-primary">{operatingCostPercent}%</span>
            </div>
            <Slider value={[operatingCostPercent]} onValueChange={(value) => setOperatingCostPercent(value[0])} min={10} max={60} step={5} className="py-2" />
          </div>

          <p className="text-[10px] text-muted-foreground italic">
            Model: Arps Decline (Di={ARPS_DEFAULTS.Di}, b={ARPS_DEFAULTS.b})
          </p>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Calculation Results
          </CardTitle>
          <CardDescription>Profit and payback forecast (with decline)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Investment</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(calculations.totalInvestment)}</span>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Production per Well</p>
              <p className="text-lg font-bold">{calculations.perWellProduction.toFixed(1)} BPD</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Daily Revenue (M1)</p>
              <p className="text-lg font-bold">{formatCurrency(calculations.dailyRevenue)}</p>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Year 1 Revenue</span>
              <span className="text-xl font-bold">{formatCurrency(calculations.annualRevenue)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${calculations.year1Profit >= 0 ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
            <div className="flex justify-between items-center">
              <span className={calculations.year1Profit >= 0 ? 'text-success' : 'text-destructive'}>Year 1 Profit</span>
              <span className={`text-xl font-bold ${calculations.year1Profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(calculations.year1Profit)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Year 2 Profit</span>
              <span className="text-xl font-bold">{formatCurrency(calculations.year2Profit)}</span>
            </div>
          </div>

          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex justify-between items-center">
              <span className="text-accent">Years 2-5 Profit</span>
              <span className="text-xl font-bold text-accent">{formatCurrency(calculations.years2to5Profit)}</span>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-success/20 rounded-lg border border-success/30 text-center">
              <Calendar className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Payback Period</p>
              <Badge className="bg-success text-success-foreground text-lg px-3">
                {calculations.paybackMonths < 999 ? `${calculations.paybackMonths} mo` : "N/A"}
              </Badge>
            </div>
            <div className="p-4 bg-primary/20 rounded-lg border border-primary/30 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-1">ROI (5 Years)</p>
              <Badge className="bg-primary text-primary-foreground text-lg px-3">
                {calculations.roi.toFixed(0)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialCalculator;
