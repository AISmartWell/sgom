import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Play,
  ArrowLeft,
  TrendingUp,
  Thermometer,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Simulation = () => {
  const navigate = useNavigate();

  const months = ["M1", "M2", "M3", "M4", "M5", "M6", "M9", "M12"];
  const productionData = [45, 52, 58, 62, 65, 68, 72, 78];

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
            <span className="text-3xl">📊</span>
            <h1 className="text-3xl font-bold">Reservoir Simulation</h1>
          </div>
          <p className="text-muted-foreground">
            Dynamic modeling and production forecasting
          </p>
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Run Simulation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Production Forecast Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Production Forecast (12 Months)</CardTitle>
              <CardDescription>Predicted oil production based on reservoir simulation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2 px-4">
                {months.map((month, index) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-primary to-cyan-400 rounded-t-lg transition-all duration-300 hover:opacity-80"
                      style={{ height: `${(productionData[index] / 80) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{month}</span>
                    <span className="text-xs font-medium">{productionData[index]} BPD</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm">+73% projected increase</span>
                </div>
                <Badge className="bg-primary/20 text-primary">12-month forecast</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Input Data & Scenarios */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Simulation Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="input" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="input">Input Data</TabsTrigger>
                  <TabsTrigger value="scenarios">🔄 Scenarios</TabsTrigger>
                  <TabsTrigger value="kpi">📈 KPIs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="input" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge className="h-4 w-4 text-primary" />
                        <span className="font-medium">Initial Reservoir Conditions</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Pressure, Temperature</p>
                      <p className="text-lg font-bold mt-2">2,450 PSI / 185°F</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-accent" />
                        <span className="font-medium">Well Data</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Locations, Completions</p>
                      <p className="text-lg font-bold mt-2">12 wells configured</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="h-4 w-4 text-warning" />
                        <span className="font-medium">Fluid Properties (PVT)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Phase behavior</p>
                      <p className="text-lg font-bold mt-2">API 38° / GOR 450</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="font-medium">History Data</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Production, Pressure</p>
                      <p className="text-lg font-bold mt-2">15 years history</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="scenarios" className="mt-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-3">Scenario Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Perform sensitivity analyses by altering well placement, recovery techniques to assess impact on production.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <span className="text-sm">Base Case</span>
                        <Badge className="bg-success/20 text-success">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <span className="text-sm">Enhanced Recovery (+20%)</span>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <span className="text-sm">Conservative Estimate</span>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="kpi" className="mt-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-3">KPI Identification</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Recovery factors, economic viability, optimal extraction strategy for each well.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <p className="text-2xl font-bold text-primary">32%</p>
                        <p className="text-xs text-muted-foreground">Recovery Factor</p>
                      </div>
                      <div className="text-center p-4 bg-success/10 rounded-lg">
                        <p className="text-2xl font-bold text-success">5.2x</p>
                        <p className="text-xs text-muted-foreground">Production Increase</p>
                      </div>
                      <div className="text-center p-4 bg-accent/10 rounded-lg">
                        <p className="text-2xl font-bold text-accent">8mo</p>
                        <p className="text-xs text-muted-foreground">Payback Period</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-4xl font-bold text-primary">32%</p>
                <p className="text-sm text-muted-foreground">Recovery Factor</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-4xl font-bold text-success">5.2×</p>
                <p className="text-sm text-muted-foreground">Production Increase</p>
              </div>
              <Progress value={78} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                Simulation 78% complete
              </p>
            </CardContent>
          </Card>

          {/* Environmental Factors */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Environmental Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <p className="text-sm font-medium text-warning">High Temperatures</p>
                <p className="text-xs text-muted-foreground">Affect viscosity calculations</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium text-destructive">Abnormal Pressure</p>
                <p className="text-xs text-muted-foreground">Indicates depletion or gas pockets</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium">High Stress Zones</p>
                <p className="text-xs text-muted-foreground">Risks fractures - monitor closely</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
