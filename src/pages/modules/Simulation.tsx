import { useState, Suspense } from "react";
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
  Loader2,
  Eye,
  Pause,
  RotateCcw,
  LineChart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ForecastVisualization from "@/components/simulation/ForecastVisualization";
import ReservoirVisualization from "@/components/simulation/ReservoirVisualization";

const Simulation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("visualization");
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRunSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      return;
    }
    
    setIsSimulating(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          return 100;
        }
        return prev + 2;
      });
    }, 200);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setProgress(0);
  };

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
            Dynamic 3D modeling and production forecasting
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} disabled={progress === 0}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleRunSimulation}>
            {isSimulating ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs for visualization and data */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Reservoir Model</CardTitle>
              <CardDescription>Interactive 3D visualization of reservoir and wells</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="visualization" className="gap-2">
                    <Eye className="h-4 w-4" />
                    3D View
                  </TabsTrigger>
                  <TabsTrigger value="forecast" className="gap-2">
                    <LineChart className="h-4 w-4" />
                    Forecast
                  </TabsTrigger>
                  <TabsTrigger value="parameters" className="gap-2">
                    <Gauge className="h-4 w-4" />
                    Parameters
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="visualization" className="mt-0">
                  <Suspense fallback={
                    <div className="w-full h-[400px] rounded-lg bg-slate-900/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  }>
                    <div className="relative">
                      <ReservoirVisualization isSimulating={isSimulating} />
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Drag to rotate • Scroll to zoom • Right-click to pan
                      </p>
                    </div>
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="forecast" className="mt-0">
                  <ForecastVisualization />
                </TabsContent>
                
                <TabsContent value="parameters" className="mt-0">
                  <div className="h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 p-2">
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
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Simulation Progress */}
          {(isSimulating || progress > 0) && (
            <Card className="glass-card animate-fade-in">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Simulation Progress</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {isSimulating ? "Running dynamic flow simulation..." : progress === 100 ? "Simulation complete!" : "Paused"}
                </p>
              </CardContent>
            </Card>
          )}
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
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <p className="text-4xl font-bold text-accent">78</p>
                <p className="text-sm text-muted-foreground">BPD Total Production</p>
              </div>
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

          {/* Scenario Selection */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Base Case</span>
                <Badge className="bg-success/20 text-success">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Enhanced Recovery (+20%)</span>
                <Badge variant="outline">Pending</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Conservative</span>
                <Badge variant="outline">Pending</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
