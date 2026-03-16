import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, Eye, Zap, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EnhancedWellLog from "@/components/well-log/EnhancedWellLog";
import { WellLogAnalysisDemo } from "@/components/geophysical/WellLogAnalysisDemo";
import { supabase } from "@/integrations/supabase/client";

interface WellOption {
  id: string;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  total_depth: number | null;
}

const STAGES = [
  {
    key: "raw-log",
    label: "1. Raw Log",
    icon: Eye,
    description: "Визуализация каротажных кривых — GR, Resistivity, Porosity, SP, Density, Neutron",
  },
  {
    key: "ai-interpretation",
    label: "2. AI Interpretation",
    icon: Zap,
    description: "Автоматическая интерпретация: Ko Ko Rules, Archie Equation, Fluid Identification",
  },
  {
    key: "report",
    label: "3. Report",
    icon: FileText,
    description: "Анимированная демонстрация полного AI-пайплайна с генерацией отчёта",
  },
];

const GeophysicalExpertise = () => {
  const navigate = useNavigate();
  const [wells, setWells] = useState<WellOption[]>([]);
  const [selectedWell, setSelectedWell] = useState<WellOption | null>(null);
  const [activeTab, setActiveTab] = useState("raw-log");

  useEffect(() => {
    const fetchWells = async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, total_depth")
        .order("well_name", { ascending: true })
        .limit(50);
      if (data && data.length > 0) {
        setWells(data);
        const brawner = data.find(w => w.api_number === "42467309790000");
        setSelectedWell(brawner || data[0]);
      }
    };
    fetchWells();
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Geophysical Expertise</h1>
              <Badge className="text-xs">Stage 8</Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            AI-powered well log interpretation and formation evaluation
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <Activity className="mr-1 h-3 w-3" />
          Well Log AI
        </Badge>
      </div>

      {/* Well Selector */}
      {wells.length > 1 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm text-muted-foreground font-medium">Well:</label>
          <select
            value={selectedWell?.id || ""}
            onChange={(e) => {
              const w = wells.find(w => w.id === e.target.value);
              if (w) setSelectedWell(w);
            }}
            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
          >
            {wells.map(w => (
              <option key={w.id} value={w.id}>
                {w.well_name || w.api_number || w.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3-Stage Pipeline */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isActive = activeTab === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveTab(s.key)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isActive
                  ? "bg-primary/15 border-primary ring-1 ring-primary/50"
                  : "bg-muted/30 border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                  {s.label}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">{s.description}</p>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="hidden">
          {STAGES.map(s => <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>)}
        </TabsList>

        {/* Stage 1: Raw Log */}
        <TabsContent value="raw-log" className="mt-0">
          {selectedWell ? (
            <EnhancedWellLog
              wellId={selectedWell.id}
              wellName={selectedWell.well_name || "Unknown Well"}
              formation={selectedWell.formation}
              defaultExpanded={true}
              totalDepth={selectedWell.total_depth ?? undefined}
            />
          ) : wells.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No wells found. Import wells first to view well log analysis.</p>
            </div>
          ) : null}
        </TabsContent>

        {/* Stage 2: AI Interpretation (same component with interpretation panel shown) */}
        <TabsContent value="ai-interpretation" className="mt-0">
          {selectedWell ? (
            <EnhancedWellLog
              wellId={selectedWell.id}
              wellName={selectedWell.well_name || "Unknown Well"}
              formation={selectedWell.formation}
              defaultExpanded={true}
              totalDepth={selectedWell.total_depth ?? undefined}
              showInterpretationByDefault
            />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>Select a well to view AI interpretation.</p>
            </div>
          )}
        </TabsContent>

        {/* Stage 3: Animated Demo Report */}
        <TabsContent value="report" className="mt-0">
          <WellLogAnalysisDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeophysicalExpertise;
