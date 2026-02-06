import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  ArrowLeft,
  TrendingUp,
  Calendar,
  BarChart3,
  Calculator,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FinancialCalculator from "@/components/financial/FinancialCalculator";

const Financial = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("calculator");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💰</span>
            <h1 className="text-3xl font-bold">Financial Forecast</h1>
          </div>
          <p className="text-muted-foreground">
            Maxxwell Production Data — Investment Analysis & ROI Calculator
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">7-8 mo</p>
                <p className="text-xs text-muted-foreground">Payback Period</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">$1.25M</p>
                <p className="text-xs text-muted-foreground">Year 1 Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">$9.01M</p>
                <p className="text-xs text-muted-foreground">4-Year Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">25 yr</p>
                <p className="text-xs text-muted-foreground">Effect Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Калькулятор ROI
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Обзор проекта
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <FinancialCalculator />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Investment Analysis */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Investment Analysis (4 Wells + 1 Injection)</CardTitle>
                <CardDescription>Detailed cost and revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Oil Price (WTI)</span>
                    <span className="font-medium">$77.36/bbl</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Land + 3 Wells Cost</span>
                    <span className="font-medium">$320,000</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Recovery Expenses</span>
                    <span className="font-medium">$800,000</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-3">
                    <span className="font-semibold">Total Investment</span>
                    <span className="text-xl font-bold text-primary">$1,120,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Projection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Revenue Projection</CardTitle>
                <CardDescription>Expected returns over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Year 1 Revenue</span>
                      <span className="text-xl font-bold">$3,388,368</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-full" />
                    </div>
                  </div>

                  <div className="p-4 bg-success/10 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-success">Year 1 Profit (after expenses)</span>
                      <span className="text-xl font-bold text-success">$1,251,857</span>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Year 2 Profit</span>
                      <span className="text-xl font-bold">$2,253,264</span>
                    </div>
                  </div>

                  <div className="p-4 bg-accent/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-accent">Years 2-5 Total Profit</span>
                      <span className="text-xl font-bold text-accent">$9,013,056</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-success/20 rounded-lg border border-success/30 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-success">Return on Investment</span>
                    <Badge className="bg-success text-success-foreground text-lg px-4 py-1">
                      7-8 months
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Large Scale Projection */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Large Scale: 100 Wells Field
                </CardTitle>
                <CardDescription>Projection for full-scale operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-muted/30 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground mb-2">Configuration</p>
                    <p className="text-2xl font-bold">70 producing + 30 injection</p>
                  </div>
                  <div className="p-6 bg-primary/10 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground mb-2">Annual Production</p>
                    <p className="text-3xl font-bold text-primary">766,500</p>
                    <p className="text-sm text-muted-foreground">barrels</p>
                  </div>
                  <div className="p-6 bg-success/10 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground mb-2">Annual Revenue</p>
                    <p className="text-3xl font-bold text-success">$59,296,440</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financial;
