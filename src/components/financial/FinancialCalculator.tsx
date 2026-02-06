import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react";

const FinancialCalculator = () => {
  // Input state
  const [oilPrice, setOilPrice] = useState(77.36);
  const [landCost, setLandCost] = useState(320000);
  const [recoveryCost, setRecoveryCost] = useState(800000);
  const [wellCount, setWellCount] = useState(4);
  const [productionIncrease, setProductionIncrease] = useState(120);
  const [operatingCostPercent, setOperatingCostPercent] = useState(30);

  // Calculations
  const calculations = useMemo(() => {
    const totalInvestment = landCost + recoveryCost;
    const dailyRevenue = productionIncrease * oilPrice;
    const annualRevenue = dailyRevenue * 365;
    const operatingCosts = annualRevenue * (operatingCostPercent / 100);
    const year1Profit = annualRevenue - operatingCosts - totalInvestment;
    const year2Profit = annualRevenue - operatingCosts;
    const years2to5Profit = year2Profit * 4;
    const perWellProduction = productionIncrease / wellCount;
    
    // Payback period in months
    const monthlyProfit = (annualRevenue - operatingCosts) / 12;
    const paybackMonths = monthlyProfit > 0 ? Math.ceil(totalInvestment / monthlyProfit) : 0;
    
    const roi = totalInvestment > 0 ? ((year1Profit + years2to5Profit) / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      dailyRevenue,
      annualRevenue,
      operatingCosts,
      year1Profit,
      year2Profit,
      years2to5Profit,
      perWellProduction,
      paybackMonths,
      roi,
    };
  }, [oilPrice, landCost, recoveryCost, wellCount, productionIncrease, operatingCostPercent]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Параметры расчёта
          </CardTitle>
          <CardDescription>Введите данные для расчёта ROI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Oil Price */}
          <div className="space-y-2">
            <Label htmlFor="oilPrice">Цена нефти (WTI), $/баррель</Label>
            <Input
              id="oilPrice"
              type="number"
              value={oilPrice}
              onChange={(e) => setOilPrice(Number(e.target.value))}
              className="bg-background/50"
            />
          </div>

          {/* Land + Wells Cost */}
          <div className="space-y-2">
            <Label htmlFor="landCost">Стоимость земли + скважин, $</Label>
            <Input
              id="landCost"
              type="number"
              value={landCost}
              onChange={(e) => setLandCost(Number(e.target.value))}
              className="bg-background/50"
            />
          </div>

          {/* Recovery Cost */}
          <div className="space-y-2">
            <Label htmlFor="recoveryCost">Расходы на восстановление, $</Label>
            <Input
              id="recoveryCost"
              type="number"
              value={recoveryCost}
              onChange={(e) => setRecoveryCost(Number(e.target.value))}
              className="bg-background/50"
            />
          </div>

          {/* Well Count */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Количество скважин</Label>
              <span className="text-sm font-medium text-primary">{wellCount}</span>
            </div>
            <Slider
              value={[wellCount]}
              onValueChange={(value) => setWellCount(value[0])}
              min={1}
              max={20}
              step={1}
              className="py-2"
            />
          </div>

          {/* Production Increase */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Прирост добычи, баррелей/день</Label>
              <span className="text-sm font-medium text-primary">{productionIncrease}</span>
            </div>
            <Slider
              value={[productionIncrease]}
              onValueChange={(value) => setProductionIncrease(value[0])}
              min={10}
              max={500}
              step={10}
              className="py-2"
            />
          </div>

          {/* Operating Cost */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Операционные расходы, %</Label>
              <span className="text-sm font-medium text-primary">{operatingCostPercent}%</span>
            </div>
            <Slider
              value={[operatingCostPercent]}
              onValueChange={(value) => setOperatingCostPercent(value[0])}
              min={10}
              max={60}
              step={5}
              className="py-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Результаты расчёта
          </CardTitle>
          <CardDescription>Прогноз прибыли и окупаемости</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Investment Summary */}
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Общие инвестиции</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(calculations.totalInvestment)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Добыча на скважину</p>
              <p className="text-lg font-bold">{calculations.perWellProduction.toFixed(1)} BPD</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Дневная выручка</p>
              <p className="text-lg font-bold">{formatCurrency(calculations.dailyRevenue)}</p>
            </div>
          </div>

          {/* Annual Revenue */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Годовая выручка</span>
              <span className="text-xl font-bold">{formatCurrency(calculations.annualRevenue)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full" />
            </div>
          </div>

          {/* Year 1 Profit */}
          <div className={`p-4 rounded-lg ${calculations.year1Profit >= 0 ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
            <div className="flex justify-between items-center">
              <span className={calculations.year1Profit >= 0 ? 'text-success' : 'text-destructive'}>
                Прибыль за 1-й год
              </span>
              <span className={`text-xl font-bold ${calculations.year1Profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(calculations.year1Profit)}
              </span>
            </div>
          </div>

          {/* Year 2 Profit */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Прибыль за 2-й год</span>
              <span className="text-xl font-bold">{formatCurrency(calculations.year2Profit)}</span>
            </div>
          </div>

          {/* Years 2-5 */}
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex justify-between items-center">
              <span className="text-accent">Прибыль за 2-5 годы</span>
              <span className="text-xl font-bold text-accent">
                {formatCurrency(calculations.years2to5Profit)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Payback & ROI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-success/20 rounded-lg border border-success/30 text-center">
              <Calendar className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Окупаемость</p>
              <Badge className="bg-success text-success-foreground text-lg px-3">
                {calculations.paybackMonths} мес
              </Badge>
            </div>
            <div className="p-4 bg-primary/20 rounded-lg border border-primary/30 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-1">ROI (5 лет)</p>
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
