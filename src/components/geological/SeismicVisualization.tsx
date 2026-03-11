import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Cpu, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import SeismicDataUpload, { type SeismicTrace } from "./SeismicDataUpload";
import AnomalyDetector from "./AnomalyDetector";
import AutoClassificationPanel from "./AutoClassificationPanel";
import BypassedReservesPanel from "./BypassedReservesPanel";
import WellSelector, { type SelectedWell } from "./WellSelector";
import SeismicImageAnalysis from "./SeismicImageAnalysis";
import { SeismicAnalysisHistory } from "./SeismicAnalysisHistory";

const SeismicVisualization = () => {
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedData, setUploadedData] = useState<SeismicTrace[] | null>(null);
  const [selectedWell, setSelectedWell] = useState<SelectedWell | null>(null);

  // Generate synthetic seismic trace data
  const syntheticData = useMemo(() => {
    const data: SeismicTrace[] = [];
    for (let i = 0; i < 100; i++) {
      const depth = i * 50;
      const trace1 = Math.sin(i * 0.3) * 50 + Math.random() * 20 - 10;
      const trace2 = Math.cos(i * 0.25 + 1) * 40 + Math.random() * 15 - 7.5;
      const trace3 = Math.sin(i * 0.2 + 2) * 60 + Math.random() * 25 - 12.5;

      data.push({
        depth,
        trace1,
        trace2,
        trace3,
        amplitude: (trace1 + trace2 + trace3) / 3,
      });
    }
    return data;
  }, []);

  const seismicData = uploadedData || syntheticData;
  const isUsingRealData = !!uploadedData;

  const horizons = [
    { depth: 500, name: "Top Reservoir", color: "hsl(var(--success))" },
    { depth: 1200, name: "Base Sandstone", color: "hsl(var(--primary))" },
    { depth: 2000, name: "Fault Zone", color: "hsl(var(--destructive))" },
    { depth: 3500, name: "Basement", color: "hsl(var(--muted-foreground))" },
  ];

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisReport(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-seismic", {
        body: {
          seismicData,
          horizons: horizons.map((h) => ({ name: h.name, depth: h.depth })),
          well: selectedWell ? {
            name: selectedWell.well_name,
            api: selectedWell.api_number,
            formation: selectedWell.formation,
            depth: selectedWell.total_depth,
            county: selectedWell.county,
            state: selectedWell.state,
            operator: selectedWell.operator,
            oil: selectedWell.production_oil,
            waterCut: selectedWell.water_cut,
            status: selectedWell.status,
          } : null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysisReport(data.analysis);
      toast.success("Seismic AI interpretation complete");
    } catch (err: any) {
      console.error("Seismic analysis error:", err);
      toast.error(err.message || "AI analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">Depth: {label}m</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Well Selector */}
      <WellSelector selectedWell={selectedWell} onSelect={(w) => { setSelectedWell(w); setAnalysisReport(null); }} />

      {/* Upload Section */}
      <SeismicDataUpload
        onDataLoaded={(data) => { setUploadedData(data); setAnalysisReport(null); }}
        onClear={() => { setUploadedData(null); setAnalysisReport(null); }}
        hasUploadedData={isUsingRealData}
      />

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Seismic Amplitude Section</h4>
          <p className="text-sm text-muted-foreground">
            {isUsingRealData
              ? "Displaying uploaded operator data"
              : "Synthetic demo data — upload CSV for real analysis"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isUsingRealData && (
            <span className="text-xs px-2 py-1 bg-primary/15 text-primary rounded-full font-medium">
              Real Data
            </span>
          )}
          <Button size="sm" onClick={runAIAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Cpu className="mr-2 h-4 w-4" />
            )}
            {isAnalyzing ? "Analyzing..." : "AI Interpret"}
          </Button>
        </div>
      </div>

      <div className="h-80 bg-slate-900/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={seismicData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="depth"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              domain={[-100, 100]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />

            {horizons.map((h) => (
              <ReferenceLine
                key={h.name}
                x={h.depth}
                stroke={h.color}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            ))}

            <Area
              type="monotone"
              dataKey="trace1"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              name="Trace 1"
            />
            <Line
              type="monotone"
              dataKey="trace2"
              stroke="hsl(var(--accent))"
              strokeWidth={1.5}
              dot={false}
              name="Trace 2"
            />
            <Line
              type="monotone"
              dataKey="trace3"
              stroke="hsl(var(--success))"
              strokeWidth={1.5}
              dot={false}
              name="Trace 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Attribute Analysis */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-primary/10 rounded-lg text-center">
          <p className="text-lg font-bold text-primary">0.85</p>
          <p className="text-xs text-muted-foreground">Coherence</p>
        </div>
        <div className="p-3 bg-accent/10 rounded-lg text-center">
          <p className="text-lg font-bold text-accent">-12°</p>
          <p className="text-xs text-muted-foreground">Dip Angle</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg text-center">
          <p className="text-lg font-bold text-success">2.4 km/s</p>
          <p className="text-xs text-muted-foreground">Interval Velocity</p>
        </div>
        <div className="p-3 bg-warning/10 rounded-lg text-center">
          <p className="text-lg font-bold text-warning">0.12</p>
          <p className="text-xs text-muted-foreground">AVO Gradient</p>
        </div>
      </div>

      {/* Auto-Classification & Anomaly Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AutoClassificationPanel data={seismicData} />
        <AnomalyDetector data={seismicData} />
      </div>

      {/* Seismic Image CV Analysis */}
      <SeismicImageAnalysis selectedWell={selectedWell} />

      {/* Bypassed Reserves Panel */}
      <BypassedReservesPanel isFromAI={!!analysisReport} />

      {/* AI Analysis Report */}
      {(isAnalyzing || analysisReport) && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            AI Seismic Interpretation Report
          </h4>
          {isAnalyzing ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Gemini is analyzing seismic data...</span>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{analysisReport || ""}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeismicVisualization;
