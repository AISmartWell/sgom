import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Settings, FileText, Wrench, Layers, Ruler, Play, CheckCircle2, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar, Legend } from "recharts";

const mockWells = [
  { id: "W-101", name: "Maxwell #1", depth: 4200, casingOD: 5.5, casingID: 4.95, tubing: 2.875, perforationZone: "3800-4100", formation: "Hunton Limestone", pressure: 1850, temperature: 165 },
  { id: "W-203", name: "Carson Unit #3", depth: 3800, casingOD: 7.0, casingID: 6.366, tubing: 2.875, perforationZone: "3400-3700", formation: "Wilcox Sandstone", pressure: 1620, temperature: 148 },
  { id: "W-307", name: "Davis Ranch #7", depth: 5100, casingOD: 5.5, casingID: 4.95, tubing: 2.375, perforationZone: "4700-5000", formation: "Mississippian Lime", pressure: 2340, temperature: 192 },
];

const stages = [
  { id: 1, name: "Well Data Input", icon: FileText, desc: "Load well & casing specifications" },
  { id: 2, name: "Cutting Program", icon: Wrench, desc: "Generate slot-perforation cutting plan" },
  { id: 3, name: "Equipment Specs", icon: Settings, desc: "Select tools & equipment parameters" },
  { id: 4, name: "Slot Design", icon: Layers, desc: "Optimize perforation pattern & geometry" },
  { id: 5, name: "Final Report", icon: Ruler, desc: "Generate service program document" },
];

const SPTParametersDemo = () => {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [currentStage, setCurrentStage] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedWell, setSelectedWell] = useState(mockWells[0]);
  const [slotLength, setSlotLength] = useState([120]);
  const [slotWidth, setSlotWidth] = useState([12]);
  const [slotsPerRow, setSlotsPerRow] = useState([4]);
  const [rowSpacing, setRowSpacing] = useState([6]);

  const runPipeline = () => {
    setIsRunning(true);
    setCurrentStage(1);
    let stage = 1;
    const interval = setInterval(() => {
      stage++;
      if (stage > 5) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }
      setCurrentStage(stage);
    }, 1500);
  };

  const totalSlots = slotsPerRow[0] * Math.floor((parseFloat(selectedWell.perforationZone.split("-")[1]) - parseFloat(selectedWell.perforationZone.split("-")[0])) / (rowSpacing[0] * 12));
  const openArea = totalSlots * (slotLength[0] / 25.4) * (slotWidth[0] / 25.4) / 144; // sq ft
  const flowCapacity = openArea * 42 * 24; // estimated bbl/day

  const cuttingData = [
    { zone: "Upper", slots: Math.round(totalSlots * 0.25), depth: `${selectedWell.perforationZone.split("-")[0]}-${Math.round((parseFloat(selectedWell.perforationZone.split("-")[0]) + parseFloat(selectedWell.perforationZone.split("-")[1])) / 3)}` },
    { zone: "Middle", slots: Math.round(totalSlots * 0.45), depth: `${Math.round((parseFloat(selectedWell.perforationZone.split("-")[0]) + parseFloat(selectedWell.perforationZone.split("-")[1])) / 3)}-${Math.round(2 * (parseFloat(selectedWell.perforationZone.split("-")[0]) + parseFloat(selectedWell.perforationZone.split("-")[1])) / 3)}` },
    { zone: "Lower", slots: Math.round(totalSlots * 0.30), depth: `${Math.round(2 * (parseFloat(selectedWell.perforationZone.split("-")[0]) + parseFloat(selectedWell.perforationZone.split("-")[1])) / 3)}-${selectedWell.perforationZone.split("-")[1]}` },
  ];

  const radarData = [
    { param: "Flow Area", value: Math.min(100, openArea * 50), fullMark: 100 },
    { param: "Slot Density", value: Math.min(100, slotsPerRow[0] * 20), fullMark: 100 },
    { param: "Coverage", value: Math.min(100, (totalSlots / 200) * 100), fullMark: 100 },
    { param: "Structural", value: Math.max(20, 100 - slotsPerRow[0] * 12), fullMark: 100 },
    { param: "Flow Rate", value: Math.min(100, flowCapacity / 5), fullMark: 100 },
    { param: "Efficiency", value: Math.min(100, (slotLength[0] * slotWidth[0]) / 20), fullMark: 100 },
  ];

  const equipmentSpecs = [
    { name: "Hydra-Jet Cutting Tool", spec: `OD: ${selectedWell.casingID > 5 ? "3.375" : "2.125"}″`, status: "Available" },
    { name: "High-Pressure Pump", spec: "15,000 psi / 4 BPM", status: "Available" },
    { name: "Abrasive Sand", spec: "100 mesh, 200 lb/slot", status: "In Stock" },
    { name: "Coiled Tubing Unit", spec: `${selectedWell.tubing}″ CT`, status: "Scheduled" },
    { name: "BHA Assembly", spec: "Nozzle + Centralizer", status: "Ready" },
    { name: "Pressure Recorder", spec: "Memory gauge, 20k psi", status: "Calibrated" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Stage 7: SPT Parameters
          </h2>
          <p className="text-muted-foreground mt-1">Cutting program generation & slot-perforation design optimization</p>
        </div>
        <Badge variant="outline" className="text-xs">Interactive Demo</Badge>
      </div>

      {/* Pipeline */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Generation Pipeline</h3>
            <Button size="sm" onClick={runPipeline} disabled={isRunning} className="gap-2">
              <Play className="h-4 w-4" /> {isRunning ? "Processing..." : "Run Pipeline"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {stages.map((stage, i) => (
              <div key={stage.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 p-2 rounded-lg flex-1 text-xs transition-all ${
                  currentStage >= stage.id
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted/30 text-muted-foreground border border-border/30"
                }`}>
                  {currentStage > stage.id ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <stage.icon className="h-4 w-4 flex-shrink-0" />
                  )}
                  <div className="hidden lg:block">
                    <p className="font-medium">{stage.name}</p>
                    <p className="text-[10px] opacity-70">{stage.desc}</p>
                  </div>
                </div>
                {i < stages.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />}
              </div>
            ))}
          </div>
          {isRunning && <Progress value={(currentStage / 5) * 100} className="mt-3 h-1.5" />}
        </CardContent>
      </Card>

      {/* Well selector */}
      <div className="flex gap-2">
        {mockWells.map((w) => (
          <Button
            key={w.id}
            variant={selectedWell.id === w.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedWell(w)}
          >
            {w.id}: {w.name}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="pipeline">Cutting Program</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="design">Slot Design</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        {/* Cutting Program */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Well Specifications</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Well", selectedWell.name],
                    ["Total Depth", `${selectedWell.depth} ft`],
                    ["Casing OD/ID", `${selectedWell.casingOD}″ / ${selectedWell.casingID}″`],
                    ["Tubing", `${selectedWell.tubing}″`],
                    ["Perf Zone", `${selectedWell.perforationZone} ft`],
                    ["Formation", selectedWell.formation],
                    ["BHP", `${selectedWell.pressure} psi`],
                    ["BHT", `${selectedWell.temperature}°F`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between p-1.5 rounded bg-muted/20">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-medium text-foreground">{val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cutting Distribution by Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cuttingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="zone" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="slots" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Slots" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-[10px] text-muted-foreground">
                  Total slots: <strong className="text-foreground">{totalSlots}</strong> | Open area: <strong className="text-foreground">{openArea.toFixed(2)} sq ft</strong> | Est. flow: <strong className="text-primary">{flowCapacity.toFixed(0)} bbl/day</strong>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Equipment */}
        <TabsContent value="equipment">
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Required Equipment & Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {equipmentSpecs.map((eq) => (
                  <div key={eq.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div>
                      <p className="text-sm font-medium">{eq.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{eq.spec}</p>
                    </div>
                    <Badge variant={eq.status === "Available" || eq.status === "Ready" || eq.status === "Calibrated" ? "default" : eq.status === "In Stock" ? "secondary" : "outline"} className="text-[10px]">
                      {eq.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slot Design */}
        <TabsContent value="design" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Slot Geometry Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Slot Length</span>
                    <span className="font-mono font-medium">{slotLength[0]} mm</span>
                  </div>
                  <Slider value={slotLength} onValueChange={setSlotLength} min={60} max={200} step={10} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Slot Width</span>
                    <span className="font-mono font-medium">{slotWidth[0]} mm</span>
                  </div>
                  <Slider value={slotWidth} onValueChange={setSlotWidth} min={6} max={20} step={1} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Slots per Row</span>
                    <span className="font-mono font-medium">{slotsPerRow[0]}</span>
                  </div>
                  <Slider value={slotsPerRow} onValueChange={setSlotsPerRow} min={2} max={8} step={1} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Row Spacing</span>
                    <span className="font-mono font-medium">{rowSpacing[0]} in</span>
                  </div>
                  <Slider value={rowSpacing} onValueChange={setRowSpacing} min={3} max={12} step={1} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Design Optimization Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="param" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                    <RechartsRadar name="Current Design" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Report */}
        <TabsContent value="report">
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Service Program Summary — {selectedWell.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="p-4 rounded-lg bg-muted/20 border border-border/30 font-mono whitespace-pre-wrap leading-relaxed">
{`═══════════════════════════════════════════════════
  SPT CUTTING PROGRAM — SERVICE DOCUMENT
  Well: ${selectedWell.name} (${selectedWell.id})
═══════════════════════════════════════════════════

1. WELL DATA
   Total Depth:     ${selectedWell.depth} ft
   Casing:          ${selectedWell.casingOD}″ OD / ${selectedWell.casingID}″ ID
   Tubing:          ${selectedWell.tubing}″
   Formation:       ${selectedWell.formation}
   BHP / BHT:       ${selectedWell.pressure} psi / ${selectedWell.temperature}°F

2. PERFORATION INTERVAL
   Zone:            ${selectedWell.perforationZone} ft
   Interval Length:  ${parseFloat(selectedWell.perforationZone.split("-")[1]) - parseFloat(selectedWell.perforationZone.split("-")[0])} ft

3. SLOT PARAMETERS
   Slot dimensions: ${slotLength[0]} × ${slotWidth[0]} mm
   Slots per row:   ${slotsPerRow[0]}
   Row spacing:     ${rowSpacing[0]} in
   Total slots:     ${totalSlots}
   Total open area: ${openArea.toFixed(2)} sq ft

4. ESTIMATED PERFORMANCE
   Flow capacity:   ${flowCapacity.toFixed(0)} bbl/day
   Coverage ratio:  ${((totalSlots * slotLength[0]) / (parseFloat(selectedWell.perforationZone.split("-")[1]) - parseFloat(selectedWell.perforationZone.split("-")[0])) / 25.4 * 100).toFixed(1)}%

5. EQUIPMENT REQUIRED
${equipmentSpecs.map(e => `   • ${e.name}: ${e.spec}`).join("\n")}

6. CUTTING DISTRIBUTION
${cuttingData.map(z => `   ${z.zone} zone (${z.depth} ft): ${z.slots} slots`).join("\n")}

═══════════════════════════════════════════════════
  Generated by AI Smartwell SGOM — SPT Parameters
═══════════════════════════════════════════════════`}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SPTParametersDemo;
