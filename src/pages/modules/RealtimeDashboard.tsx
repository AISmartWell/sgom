import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Activity,
  Droplets,
  Gauge,
  Thermometer,
  Zap,
  Wifi,
  WifiOff,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealtimeMetrics, WellMetrics } from "@/hooks/useRealtimeMetrics";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from "recharts";

const RealtimeDashboard = () => {
  const navigate = useNavigate();
  const { wells, aggregated, isConnected, lastUpdate, connect, disconnect } = useRealtimeMetrics(2000);
  const [selectedWell, setSelectedWell] = useState<string | null>(null);

  const getStatusColor = (status: WellMetrics["status"]) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "critical": return "bg-red-500";
      case "offline": return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: WellMetrics["status"]) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case "warning": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>;
      case "critical": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case "offline": return <Badge variant="secondary">Offline</Badge>;
    }
  };

  // Production chart data from wells
  const productionData = wells.map(well => ({
    name: well.wellName.split(" ")[0],
    production: well.production,
    waterCut: well.waterCut,
    status: well.status,
  }));

  const chartConfig = {
    production: { label: "Production (bbl/d)", color: "hsl(var(--primary))" },
    waterCut: { label: "Water Cut (%)", color: "hsl(var(--accent))" },
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <span className="text-3xl">📡</span>
            <h1 className="text-3xl font-bold">Real-Time Production Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Live metrics streaming from field sensors
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}>
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Disconnected</span>
              </>
            )}
          </div>
          
          <Button
            variant={isConnected ? "outline" : "default"}
            onClick={isConnected ? disconnect : connect}
          >
            {isConnected ? (
              <>
                <WifiOff className="mr-2 h-4 w-4" />
                Pause Stream
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resume Stream
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Live Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Production</p>
                <p className="text-3xl font-bold text-primary">{aggregated.totalProduction.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">bbl/day</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-full">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>+3.2% vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Pressure</p>
                <p className="text-3xl font-bold text-accent">{aggregated.avgPressure.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">psi</p>
              </div>
              <div className="p-3 bg-accent/20 rounded-full">
                <Gauge className="h-6 w-6 text-accent" />
              </div>
            </div>
            <Progress value={(aggregated.avgPressure / 4000) * 100} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Water Cut</p>
                <p className="text-3xl font-bold text-yellow-400">{aggregated.avgWaterCut}%</p>
                <p className="text-xs text-muted-foreground">of total fluid</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <Activity className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
            <Progress value={aggregated.avgWaterCut} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Well Status</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-400">{aggregated.activeWells}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-yellow-400">{aggregated.warningWells}</p>
                    <p className="text-xs text-muted-foreground">Warning</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-400">{aggregated.criticalWells}</p>
                    <p className="text-xs text-muted-foreground">Critical</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-full">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wells Table */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Live Well Metrics
                </CardTitle>
                <CardDescription>
                  {lastUpdate && `Last update: ${lastUpdate.toLocaleTimeString()}`}
                </CardDescription>
              </div>
              {isConnected && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-400">Streaming</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Well</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Production</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Pressure</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Water Cut</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Gas Rate</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wells.map((well) => (
                    <tr
                      key={well.wellId}
                      className={`border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer ${
                        selectedWell === well.wellId ? "bg-primary/10" : ""
                      }`}
                      onClick={() => setSelectedWell(well.wellId)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(well.status)} animate-pulse`} />
                          <div>
                            <p className="font-medium">{well.wellName}</p>
                            <p className="text-xs text-muted-foreground">{well.wellId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="font-mono font-medium">{well.production}</span>
                        <span className="text-xs text-muted-foreground ml-1">bbl/d</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="font-mono">{well.pressure.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">psi</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={`font-mono ${well.waterCut > 40 ? "text-red-400" : well.waterCut > 30 ? "text-yellow-400" : ""}`}>
                          {well.waterCut}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="font-mono">{well.gasRate}</span>
                        <span className="text-xs text-muted-foreground ml-1">mcf/d</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        {getStatusBadge(well.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wells.filter(w => w.status === "critical" || w.status === "warning").map((well) => (
              <div
                key={well.wellId}
                className={`p-4 rounded-lg border ${
                  well.status === "critical" 
                    ? "bg-red-500/10 border-red-500/30" 
                    : "bg-yellow-500/10 border-yellow-500/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{well.wellName}</span>
                  {getStatusBadge(well.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {well.status === "critical" 
                    ? `High water cut (${well.waterCut}%) or low production (${well.production} bbl/d)`
                    : `Elevated water cut (${well.waterCut}%)`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {well.lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            ))}
            
            {wells.filter(w => w.status === "critical" || w.status === "warning").length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>All wells operating normally</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Production Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Production Overview by Well</CardTitle>
          <CardDescription>Real-time production rates with water cut indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={productionData}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="production" radius={[4, 4, 0, 0]}>
                {productionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.status === "critical" 
                        ? "hsl(0, 84%, 60%)" 
                        : entry.status === "warning"
                        ? "hsl(45, 93%, 47%)"
                        : "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeDashboard;
