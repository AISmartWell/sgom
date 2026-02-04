import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSPTSimulation } from "@/hooks/useSPTSimulation";
import WellVisualization from "@/components/spt/WellVisualization";
import MetricsPanel from "@/components/spt/MetricsPanel";
import SimulationControls from "@/components/spt/SimulationControls";

const benefits = [
  { label: "Slot Depth", value: "Up to 5 ft (1.5m)" },
  { label: "Drainage Area", value: "25 ft²/linear ft" },
  { label: "Stress Relief", value: "50-100%" },
  { label: "Permeability Increase", value: "30-50%" },
  { label: "Porosity Increase", value: "4-5×" },
  { label: "Inflow Increase", value: "5-20×" },
  { label: "Effect Duration", value: "Up to 25 years" },
  { label: "Max Extraction Rate", value: "Up to 95%" },
];

const SPTTreatment = () => {
  const navigate = useNavigate();
  const simulation = useSPTSimulation(4000);

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
            <span className="text-3xl">🔧</span>
            <h1 className="text-3xl font-bold">SPT Treatment</h1>
            <Badge variant="outline" className="ml-2">
              Patent US8863823
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Slot Perforation Technology — Maxxwell Production
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Slot Perforation Process Visualization */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Slot Perforation Process</CardTitle>
              <CardDescription>Real-time treatment visualization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <WellVisualization
                progress={simulation.metrics.progress}
                status={simulation.status}
                depth={simulation.metrics.depth}
                targetDepth={simulation.targetDepth}
              />
              
              <MetricsPanel metrics={simulation.metrics} />
              
              <SimulationControls
                status={simulation.status}
                progress={simulation.metrics.progress}
                slotsCut={simulation.metrics.slotsCut}
                onStart={simulation.start}
                onPause={simulation.pause}
                onResume={simulation.resume}
                onReset={simulation.reset}
                onStop={simulation.stop}
              />
            </CardContent>
          </Card>

          {/* Technology Description */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💧 Hydro-Slotting Technology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-muted-foreground leading-relaxed">
                  Water + Sand abrasive cutting creates continuous longitudinal slots along the wellbore. 
                  <span className="text-success font-medium"> Ecologically safe, environmentally friendly.</span> 
                  {" "}No detonation impact, no casing damage. The technology enables maximum reservoir contact 
                  while maintaining well integrity.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-3xl">🌿</p>
                  <p className="text-sm font-medium mt-2">Eco-Friendly</p>
                  <p className="text-xs text-muted-foreground">No chemical additives</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-3xl">🔒</p>
                  <p className="text-sm font-medium mt-2">Safe Operation</p>
                  <p className="text-xs text-muted-foreground">No explosives</p>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <p className="text-3xl">⚡</p>
                  <p className="text-sm font-medium mt-2">High Efficiency</p>
                  <p className="text-xs text-muted-foreground">5-20x production boost</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Benefits */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>SPT Technology Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm text-muted-foreground">{benefit.label}</span>
                  <span className="font-medium text-primary">{benefit.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Expected Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-success/10 rounded-xl">
                <p className="text-4xl font-bold text-success">5-20×</p>
                <p className="text-sm text-muted-foreground mt-2">Production Increase</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">25 years</p>
                <p className="text-xs text-muted-foreground">Effect Duration</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <p className="text-2xl font-bold text-accent">95%</p>
                <p className="text-xs text-muted-foreground">Max Extraction Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SPTTreatment;
