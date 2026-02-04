import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, BarChart3, Activity, Droplets } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ComposedChart,
  Bar,
} from "recharts";

const productionData = [
  { month: "M1", oil: 45, gas: 120, water: 15, projected: 48 },
  { month: "M2", oil: 52, gas: 135, water: 18, projected: 55 },
  { month: "M3", oil: 58, gas: 148, water: 20, projected: 62 },
  { month: "M4", oil: 62, gas: 155, water: 22, projected: 68 },
  { month: "M5", oil: 65, gas: 162, water: 24, projected: 72 },
  { month: "M6", oil: 68, gas: 170, water: 25, projected: 75 },
  { month: "M9", oil: 72, gas: 185, water: 28, projected: 80 },
  { month: "M12", oil: 78, gas: 198, water: 30, projected: 85 },
];

const pressureData = [
  { month: "M1", reservoir: 2450, bottomhole: 2200, tubing: 1800 },
  { month: "M2", reservoir: 2420, bottomhole: 2180, tubing: 1780 },
  { month: "M3", reservoir: 2395, bottomhole: 2160, tubing: 1760 },
  { month: "M4", reservoir: 2370, bottomhole: 2140, tubing: 1745 },
  { month: "M5", reservoir: 2350, bottomhole: 2125, tubing: 1730 },
  { month: "M6", reservoir: 2330, bottomhole: 2110, tubing: 1720 },
  { month: "M9", reservoir: 2280, bottomhole: 2070, tubing: 1690 },
  { month: "M12", reservoir: 2230, bottomhole: 2030, tubing: 1660 },
];

const recoveryData = [
  { month: "M1", recovery: 18, cumulative: 850 },
  { month: "M2", recovery: 20, cumulative: 1720 },
  { month: "M3", recovery: 22, cumulative: 2650 },
  { month: "M4", recovery: 24, cumulative: 3640 },
  { month: "M5", recovery: 26, cumulative: 4700 },
  { month: "M6", recovery: 28, cumulative: 5840 },
  { month: "M9", recovery: 30, cumulative: 8100 },
  { month: "M12", recovery: 32, cumulative: 10800 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ForecastVisualization = () => {
  const [activeChart, setActiveChart] = useState("production");

  return (
    <div className="space-y-4">
      {/* Chart Type Tabs */}
      <Tabs value={activeChart} onValueChange={setActiveChart}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="production" className="gap-2">
            <Droplets className="h-4 w-4" />
            Production
          </TabsTrigger>
          <TabsTrigger value="pressure" className="gap-2">
            <Activity className="h-4 w-4" />
            Pressure
          </TabsTrigger>
          <TabsTrigger value="recovery" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Recovery
          </TabsTrigger>
        </TabsList>

        {/* Production Chart */}
        <TabsContent value="production" className="mt-4">
          <Card className="bg-muted/20 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                Production Forecast (12 Months)
              </CardTitle>
              <CardDescription>Oil, Gas, and Water production rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={productionData}>
                    <defs>
                      <linearGradient id="oilGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="oil"
                      name="Oil (BPD)"
                      stroke="hsl(var(--primary))"
                      fill="url(#oilGradient)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="projected"
                      name="AI Projected"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "hsl(var(--success))", r: 3 }}
                    />
                    <Bar
                      dataKey="water"
                      name="Water (BPD)"
                      fill="hsl(var(--warning))"
                      opacity={0.7}
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-success mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-lg font-bold">+73%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Oil Production</p>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-accent mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-lg font-bold">+65%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Gas Production</p>
                </div>
                <div className="text-center p-3 bg-warning/10 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-warning mb-1">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-lg font-bold">+100%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Water Cut</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pressure Chart */}
        <TabsContent value="pressure" className="mt-4">
          <Card className="bg-muted/20 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                Pressure Decline Forecast
              </CardTitle>
              <CardDescription>Reservoir, bottomhole, and tubing pressure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pressureData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={[1500, 2600]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="reservoir"
                      name="Reservoir (PSI)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bottomhole"
                      name="Bottomhole (PSI)"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--accent))", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tubing"
                      name="Tubing (PSI)"
                      stroke="hsl(var(--warning))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--warning))", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Pressure Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <p className="text-lg font-bold text-primary">2,230 PSI</p>
                  <p className="text-xs text-muted-foreground">Final Reservoir</p>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <p className="text-lg font-bold text-accent">-220 PSI</p>
                  <p className="text-xs text-muted-foreground">Pressure Drop</p>
                </div>
                <div className="text-center p-3 bg-warning/10 rounded-lg">
                  <p className="text-lg font-bold text-warning">9%</p>
                  <p className="text-xs text-muted-foreground">Decline Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Chart */}
        <TabsContent value="recovery" className="mt-4">
          <Card className="bg-muted/20 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-success" />
                Recovery Factor Analysis
              </CardTitle>
              <CardDescription>Cumulative production and recovery percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={recoveryData}>
                    <defs>
                      <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={[0, 40]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative (BBL)"
                      stroke="hsl(var(--success))"
                      fill="url(#cumulativeGradient)"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="recovery"
                      name="Recovery Factor (%)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Recovery Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-success/10 rounded-lg">
                  <p className="text-lg font-bold text-success">10,800 BBL</p>
                  <p className="text-xs text-muted-foreground">Total Cumulative</p>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <p className="text-lg font-bold text-primary">32%</p>
                  <p className="text-xs text-muted-foreground">Recovery Factor</p>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <p className="text-lg font-bold text-accent">+14%</p>
                  <p className="text-xs text-muted-foreground">RF Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ForecastVisualization;
