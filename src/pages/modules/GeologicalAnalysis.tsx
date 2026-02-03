import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Map,
  Layers,
  BarChart3,
  Cpu,
  Play,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const GeologicalAnalysis = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("seismic");

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
            <span className="text-3xl">🗺️</span>
            <h1 className="text-3xl font-bold">Geological & Geophysical Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered processing and interpretation of geological data
          </p>
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Run AI Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Well Cross-Section View */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Well Cross-Section View</CardTitle>
              <CardDescription>Layered geological structure visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-64 rounded-lg overflow-hidden bg-gradient-to-b from-amber-900/30 via-stone-700/30 to-slate-900/30 border border-border/50">
                {/* Surface Layer */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-amber-800/20 border-b border-amber-700/30 flex items-center px-4">
                  <span className="text-xs text-amber-200">Surface</span>
                </div>
                
                {/* Sediment Layer */}
                <div className="absolute top-12 left-0 right-0 h-16 bg-stone-600/20 border-b border-stone-500/30 flex items-center px-4">
                  <span className="text-xs text-stone-300">Sediment</span>
                </div>
                
                {/* Reservoir Layer */}
                <div className="absolute top-28 left-0 right-0 h-20 bg-primary/20 border-b border-primary/30 flex items-center px-4">
                  <span className="text-xs text-primary">Reservoir (Target Zone)</span>
                  <Badge className="ml-auto bg-success/20 text-success">High Potential</Badge>
                </div>
                
                {/* Basement Layer */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-800/40 flex items-center px-4">
                  <span className="text-xs text-slate-400">Basement</span>
                </div>

                {/* Well indicator */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-accent/50 transform -translate-x-1/2">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                    <div className="w-4 h-4 rounded-full bg-accent animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Tabs */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>AI Processing Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="seismic">🎯 Seismic</TabsTrigger>
                  <TabsTrigger value="welllog">📊 Well Log</TabsTrigger>
                  <TabsTrigger value="3d">🧊 3D Model</TabsTrigger>
                </TabsList>
                
                <TabsContent value="seismic" className="mt-4 space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Seismic Interpretation</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Map horizons, faults, and structural traps. Attribute analysis for reservoir characterization.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Horizon Mapping</span>
                        <span className="text-success">Complete</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between text-sm">
                        <span>Fault Detection</span>
                        <span className="text-warning">In Progress</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="welllog" className="mt-4 space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Well Log Interpretation</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Calculate porosity (density/neutron logs), permeability (core data), hydrocarbon saturation (resistivity logs).
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-2xl font-bold text-primary">18.5%</p>
                        <p className="text-xs text-muted-foreground">Avg. Porosity</p>
                      </div>
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <p className="text-2xl font-bold text-accent">245 mD</p>
                        <p className="text-xs text-muted-foreground">Permeability</p>
                      </div>
                      <div className="p-3 bg-success/10 rounded-lg">
                        <p className="text-2xl font-bold text-success">72%</p>
                        <p className="text-xs text-muted-foreground">Saturation</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="3d" className="mt-4 space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">3D Geological Modeling</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Build stratigraphic framework and reservoir properties distribution model.
                    </p>
                    <div className="h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-success/20 rounded-lg flex items-center justify-center border border-border/50">
                      <div className="text-center">
                        <Layers className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">3D Model Visualization</p>
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
          {/* Analysis Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Analysis Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-4xl font-bold text-primary">847</p>
                <p className="text-sm text-muted-foreground">Wells Analyzed</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <p className="text-4xl font-bold text-accent">45</p>
                <p className="text-sm text-muted-foreground">Formations Mapped</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">78%</span>
                </div>
                <Progress value={78} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Map className="mr-2 h-4 w-4" />
                View Seismic Map
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Export Well Logs
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Cpu className="mr-2 h-4 w-4" />
                AI Re-analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeologicalAnalysis;
