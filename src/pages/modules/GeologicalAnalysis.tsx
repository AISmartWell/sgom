import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import SeismicVisualization from "@/components/geological/SeismicVisualization";
import WellLogVisualization from "@/components/geological/WellLogVisualization";
import Geological3DModel from "@/components/geological/Geological3DModel";
import CrossSectionVisualization from "@/components/geological/CrossSectionVisualization";

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
              <CardDescription>Interactive layered geological structure with well data</CardDescription>
            </CardHeader>
            <CardContent>
              <CrossSectionVisualization />
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
                
                <TabsContent value="seismic" className="mt-4">
                  <SeismicVisualization />
                </TabsContent>
                
                <TabsContent value="welllog" className="mt-4">
                  <WellLogVisualization />
                </TabsContent>
                
                <TabsContent value="3d" className="mt-4">
                  <Geological3DModel />
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
              <Button variant="outline" className="w-full justify-start">
                <Layers className="mr-2 h-4 w-4" />
                Generate 3D Model
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeologicalAnalysis;
