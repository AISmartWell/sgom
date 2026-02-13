import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { Filter, TrendingUp, Droplets, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

// Sample well data for SPT projection
const wellsData = [
  { id: "W-001", name: "Oklahoma-1", waterCut: 45, currentProduction: 12, reserves: 850, timelineYears: 18, state: "filtered" },
  { id: "W-002", name: "Oklahoma-2", waterCut: 78, currentProduction: 8, reserves: 450, timelineYears: 12, state: "excluded_water" },
  { id: "W-003", name: "Texas-1", waterCut: 32, currentProduction: 15, reserves: 1200, timelineYears: 22, state: "filtered" },
  { id: "W-004", name: "Texas-2", waterCut: 92, currentProduction: 4, reserves: 200, timelineYears: 8, state: "excluded_water" },
  { id: "W-005", name: "Oklahoma-3", waterCut: 28, currentProduction: 18, reserves: 1500, timelineYears: 25, state: "filtered" },
  { id: "W-006", name: "Texas-3", waterCut: 65, currentProduction: 10, reserves: 600, timelineYears: 14, state: "excluded_water" },
  { id: "W-007", name: "Oklahoma-4", waterCut: 35, currentProduction: 16, reserves: 1100, timelineYears: 20, state: "filtered" },
  { id: "W-008", name: "Texas-4", waterCut: 88, currentProduction: 5, reserves: 300, timelineYears: 9, state: "excluded_water" },
  { id: "W-009", name: "Oklahoma-5", waterCut: 42, currentProduction: 14, reserves: 950, timelineYears: 19, state: "filtered" },
  { id: "W-010", name: "Texas-5", waterCut: 38, currentProduction: 17, reserves: 1300, timelineYears: 23, state: "filtered" },
];

const SPTProjectionDemo = () => {
  const [stage, setStage] = useState(1);

  // Filter calculations
  const allWells = wellsData.length;
  const filteredByWaterCut = wellsData.filter((w) => w.waterCut < 60).length;
  const estimatedInflow = wellsData.filter((w) => w.waterCut < 60).map((w) => ({
    ...w,
    inflowMin: (w.currentProduction * 2) + 5,
    inflowMax: (w.currentProduction * 2.5) + 10,
  }));
  const estimatedReserves = estimatedInflow.filter((w) => w.reserves > 500);
  const timelinePromising = estimatedReserves.filter((w) => w.timelineYears >= 15);
  const candidates = timelinePromising;

  // Data for charts
  const filteringChart = [
    { stage: "All Wells", count: allWells },
    { stage: "Water Cut &lt; 60%", count: filteredByWaterCut },
    { stage: "Reserves &gt; 500k", count: estimatedReserves.length },
    { stage: "Timeline ≥ 15yr", count: candidates.length },
  ];

  const inflowPotential = estimatedInflow.map((w) => ({
    name: w.name,
    current: w.currentProduction,
    inflowMin: w.inflowMin,
    inflowMax: w.inflowMax,
    avgProjected: (w.inflowMin + w.inflowMax) / 2,
  }));

  const timelineData = timelinePromising.map((w) => ({
    name: w.name,
    timeline: w.timelineYears,
    reserves: w.reserves,
    inflow: ((w.inflowMin + w.inflowMax) / 2) || 0,
  }));

  const waterCutScatter = wellsData.map((w) => ({
    waterCut: w.waterCut,
    reserves: w.reserves,
    name: w.name,
    included: w.waterCut < 60,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          SPT Projection — Stage 4
        </h2>
        <p className="text-muted-foreground">
          Redevelopment potential analysis: inflow forecasting, reserve estimation, timeline evaluation
        </p>
      </div>

      {/* Stage Indicators */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { num: 1, title: "Water Cut Filter", icon: Filter },
          { num: 2, title: "Inflow Estimate", icon: Droplets },
          { num: 3, title: "Reserve Analysis", icon: TrendingUp },
          { num: 4, title: "Timeline Check", icon: Calendar },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.num}
              className={`cursor-pointer transition-all ${
                stage >= s.num ? "bg-primary/10 border-primary" : "bg-muted/30"
              }`}
              onClick={() => setStage(s.num)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${stage >= s.num ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-sm font-medium">{s.title}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="funnel" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="inflow">Inflow</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
        </TabsList>

        {/* Funnel View */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtering Pipeline: Well Screening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteringChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>

              {/* Filtering Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Initial Wells</p>
                  <p className="text-2xl font-bold">{allWells}</p>
                </div>
                <div className="p-4 bg-warning/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">After Water Cut Filter</p>
                  <p className="text-2xl font-bold">{filteredByWaterCut}</p>
                  <p className="text-xs text-warning mt-1">Excluded: {allWells - filteredByWaterCut} (over 60% water)</p>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Reserve Threshold</p>
                  <p className="text-2xl font-bold">{estimatedReserves.length}</p>
                  <p className="text-xs text-accent mt-1">Reserves over 500k bbl</p>
                </div>
                <div className="p-4 bg-success/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">SPT Candidates</p>
                  <p className="text-2xl font-bold text-success">{candidates.length}</p>
                  <p className="text-xs text-success mt-1">Timeline &ge; 15 years</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inflow Forecast */}
        <TabsContent value="inflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expected SPT Inflow Projection (25–35 bbl/day average)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={inflowPotential} margin={{ left: 0, right: 0, top: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: "bbl/day", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="hsl(var(--muted))" name="Current Prod" />
                  <Bar dataKey="avgProjected" fill="hsl(var(--primary))" name="SPT Projected" />
                </BarChart>
              </ResponsiveContainer>

              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Inflow Calculation</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Projected Inflow = (Current Production × 2.0–2.5) + Treatment Effect (5–10 bbl/day)
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-2">
                  Expected Range: 25–35 bbl/day for optimal candidates
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline & Reserves */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Development Timeline vs. Reserves (15+ years = promising)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ left: 0, right: 0, top: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeline" name="Timeline (years)" />
                  <YAxis dataKey="reserves" name="Reserves (bbl)" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter
                    data={timelineData}
                    fill="hsl(var(--primary))"
                    name="Viable Wells"
                  />
                </ScatterChart>
              </ResponsiveContainer>

              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Promising Criteria</p>
                <p className="text-xs text-muted-foreground">
                  ✓ Development timeline &ge; 15 years (ensures ROI window) <br />
                  ✓ Useful reserves over 500k bbl <br />
                  ✓ Water cut under 60% (operational efficiency)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPT Candidates */}
        <TabsContent value="candidates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SPT Treatment Candidates ({candidates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {candidates.length > 0 ? (
                  candidates.map((well) => (
                    <div key={well.id} className="p-4 border border-success/20 bg-success/5 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            {well.name}
                          </p>
                          <p className="text-xs text-muted-foreground">ID: {well.id}</p>
                        </div>
                        <Badge variant="default" className="bg-success">Ready for SPT</Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Water Cut</p>
                          <p className="font-semibold">{well.waterCut}%</p>
                          <Progress value={well.waterCut} className="mt-1 h-1" />
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Reserves</p>
                          <p className="font-semibold">{(well.reserves / 1000).toFixed(1)}k bbl</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Timeline</p>
                          <p className="font-semibold">{well.timelineYears} years</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Est. SPT Inflow</p>
                          <p className="font-semibold">
                            {((well.currentProduction * 2.25) + 7).toFixed(0)} bbl/day
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No wells meet all criteria. Adjust filters to explore candidates.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Excluded Wells Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Excluded Wells ({allWells - candidates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {wellsData.filter((w) => !candidates.some((c) => c.id === w.id)).map((well) => (
                  <div key={well.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <span>{well.name}</span>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      {well.waterCut >= 60 && <Badge variant="outline">Water Cut {well.waterCut}%</Badge>}
                      {well.reserves <= 500 && <Badge variant="outline">Low Reserves</Badge>}
                      {well.timelineYears < 15 && <Badge variant="outline">Short Timeline</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm">Stage 4 Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <span className="font-semibold">{candidates.length} wells</span> qualify for SPT treatment with projected ROI recovery in 7–8 months.
          </p>
          <p>
            Average timeline: <span className="font-semibold">{(candidates.reduce((a, w) => a + w.timelineYears, 0) / candidates.length || 0).toFixed(1)} years</span> — sustainable long-term production optimization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SPTProjectionDemo;
