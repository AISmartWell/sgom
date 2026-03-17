import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const benefits = [
  { label: "Slot Depth", value: "Up to 5 ft" },
  { label: "Drainage (2 nozzles)", value: "13 ft²/linear ft" },
  { label: "Drainage (4 nozzles)", value: "23 ft²/linear ft" },
  { label: "Stress Relief", value: "50-100%" },
  { label: "Permeability Increase", value: "30-50%" },
  { label: "Porosity Increase", value: "30-50%" },
  { label: "Inflow Increase", value: "5-10×" },
  { label: "Cut Speed (Cased)", value: "50 min/linear ft" },
  { label: "Cut Speed (Open Hole)", value: "30 min/linear ft" },
  { label: "Effect Duration", value: "10-15 years" },
  { label: "Max Extraction Rate", value: "Up to 95%" },
];

const SPTTreatment = () => {
  const navigate = useNavigate();

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
                  <p className="text-xs text-muted-foreground">5-10× inflow increase</p>
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
                <p className="text-4xl font-bold text-success">5-10×</p>
                <p className="text-sm text-muted-foreground mt-2">Inflow Increase</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">10-15 yr</p>
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
