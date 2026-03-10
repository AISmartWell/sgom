import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SeismicVisualization from "@/components/geological/SeismicVisualization";
import Geological3DModel from "@/components/geological/Geological3DModel";

const PilotAIProcessing = () => {
  const [activeTab, setActiveTab] = useState("3d");

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          AI Processing Modules
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="seismic">🎯 Seismic</TabsTrigger>
            <TabsTrigger value="3d">🧊 3D Model</TabsTrigger>
          </TabsList>

          <TabsContent value="seismic" className="mt-0">
            <SeismicVisualization />
          </TabsContent>

          <TabsContent value="3d" className="mt-0">
            <Geological3DModel />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PilotAIProcessing;
