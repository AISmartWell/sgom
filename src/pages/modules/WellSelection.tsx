import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Play,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const wells = [
  { id: "W-001", name: "Anadarko-Alpha", potential: "high", score: 94, production: 45, years: 18 },
  { id: "W-002", name: "Anadarko-Beta", potential: "high", score: 91, production: 38, years: 22 },
  { id: "W-003", name: "Anadarko-Gamma", potential: "high", score: 88, production: 52, years: 15 },
  { id: "W-004", name: "Basin-Delta", potential: "medium", score: 72, production: 28, years: 12 },
  { id: "W-005", name: "Basin-Epsilon", potential: "medium", score: 68, production: 22, years: 8 },
  { id: "W-006", name: "Central-Zeta", potential: "medium", score: 65, production: 18, years: 20 },
  { id: "W-007", name: "Central-Eta", potential: "low", score: 45, production: 8, years: 25 },
  { id: "W-008", name: "South-Theta", potential: "low", score: 38, production: 5, years: 30 },
];

const selectionCriteria = [
  { name: "Operating low-productive wells", status: "active", auto: true },
  { name: "15+ years remaining life", status: "applied", auto: false },
  { name: "Cumulative production method", status: "applied", auto: false },
  { name: "Closed wells auto-removed", status: "active", auto: true },
];

const WellSelection = () => {
  const navigate = useNavigate();

  const getPotentialBadge = (potential: string) => {
    switch (potential) {
      case "high":
        return <Badge className="bg-success/20 text-success border-success/30">High Potential</Badge>;
      case "medium":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Medium</Badge>;
      case "low":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Low</Badge>;
      default:
        return null;
    }
  };

  const getPotentialIcon = (potential: string) => {
    switch (potential) {
      case "high":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "medium":
        return <Minus className="h-4 w-4 text-warning" />;
      case "low":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
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
            <span className="text-3xl">🎯</span>
            <h1 className="text-3xl font-bold">AI Well Selection & Ranking</h1>
          </div>
          <p className="text-muted-foreground">
            Pattern recognition and ML-based well ranking
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Run AI Selection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-3">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Well Field Map - Oklahoma</CardTitle>
              <CardDescription>OKLAHOMA • Anadarko Basin</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simulated Map */}
              <div className="relative h-80 rounded-lg bg-slate-900/50 border border-border/50 overflow-hidden">
                {/* Grid overlay */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `linear-gradient(hsl(210, 100%, 50%, 0.2) 1px, transparent 1px),
                                     linear-gradient(90deg, hsl(210, 100%, 50%, 0.2) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                  }}
                />
                
                {/* Well markers */}
                <div className="absolute top-[20%] left-[25%] w-4 h-4 rounded-full bg-success animate-pulse" title="High Potential" />
                <div className="absolute top-[35%] left-[40%] w-4 h-4 rounded-full bg-success animate-pulse" title="High Potential" />
                <div className="absolute top-[45%] left-[30%] w-4 h-4 rounded-full bg-success animate-pulse" title="High Potential" />
                <div className="absolute top-[25%] left-[60%] w-3 h-3 rounded-full bg-warning" title="Medium" />
                <div className="absolute top-[55%] left-[50%] w-3 h-3 rounded-full bg-warning" title="Medium" />
                <div className="absolute top-[65%] left-[70%] w-3 h-3 rounded-full bg-warning" title="Medium" />
                <div className="absolute top-[75%] left-[35%] w-2 h-2 rounded-full bg-destructive/70" title="Low" />
                <div className="absolute top-[80%] left-[55%] w-2 h-2 rounded-full bg-destructive/70" title="Low" />

                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span>High Potential</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span>Low/Closed</span>
                  </div>
                </div>

                {/* Region label */}
                <div className="absolute top-4 left-4 bg-primary/20 backdrop-blur-sm rounded-lg px-3 py-1">
                  <span className="text-sm font-medium text-primary">Anadarko Basin</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wells Table */}
          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle>AI Ranking Results</CardTitle>
              <CardDescription>Wells sorted by production potential score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Well ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Potential</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">AI Score</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Current (BPD)</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Remaining Life</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wells.map((well) => (
                      <tr key={well.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono text-sm">{well.id}</td>
                        <td className="py-3 px-4 font-medium">{well.name}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getPotentialIcon(well.potential)}
                            {getPotentialBadge(well.potential)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={well.score} className="w-16 h-2" />
                            <span className="text-sm font-medium">{well.score}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{well.production} BPD</td>
                        <td className="py-3 px-4 text-sm">{well.years} years</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Selection Criteria */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Selection Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectionCriteria.map((criteria, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <span className="text-sm">{criteria.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      criteria.status === "active"
                        ? "text-success border-success/30"
                        : "text-primary border-primary/30"
                    }
                  >
                    {criteria.auto ? "✓ Auto" : "Applied"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Scan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Wells Scanned</span>
                <span className="text-xl font-bold">847</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                <span className="text-sm text-success">High Potential (SPT)</span>
                <span className="text-xl font-bold text-success">127</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                <span className="text-sm text-warning">Medium Potential</span>
                <span className="text-xl font-bold text-warning">342</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                <span className="text-sm text-destructive">Closed/Removed</span>
                <span className="text-xl font-bold text-destructive">378</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WellSelection;
