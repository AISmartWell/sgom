import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  RotateCcw,
  FolderSearch,
  CheckCircle2,
  Download,
  FileText,
  Droplets,
  Gauge,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Clock,
  Database,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClassifyStage =
  | "idle"
  | "downloading"
  | "parsing"
  | "classifying"
  | "validating"
  | "complete";

interface DataCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  recordCount: number;
  status: "pending" | "downloading" | "classifying" | "complete";
  quality: number; // 0-100
  fields: string[];
}

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

const STAGES: { key: ClassifyStage; label: string }[] = [
  { key: "downloading", label: "Download" },
  { key: "parsing", label: "Parse Raw Data" },
  { key: "classifying", label: "Classify" },
  { key: "validating", label: "Validate" },
  { key: "complete", label: "Complete" },
];

const INITIAL_CATEGORIES: Omit<DataCategory, "recordCount" | "status" | "quality">[] = [
  {
    id: "monthly-prod",
    name: "Monthly Production History",
    icon: BarChart3,
    description: "Oil, gas, and water production volumes per month",
    fields: ["API Number", "Date", "Oil (bbl)", "Gas (mcf)", "Water (bbl)", "Days Online"],
  },
  {
    id: "initial-prod",
    name: "Initial Production Rates",
    icon: Gauge,
    description: "IP rates and first 30/60/90-day production metrics",
    fields: ["API Number", "IP Oil (bbl/d)", "IP Gas (mcf/d)", "30-day Cum", "60-day Cum", "90-day Cum"],
  },
  {
    id: "pressure",
    name: "Casing & Tubing Pressure",
    icon: Droplets,
    description: "Pressure measurements for casing and tubing strings",
    fields: ["API Number", "Date", "Casing PSI", "Tubing PSI", "Annulus PSI", "BHP (est.)"],
  },
  {
    id: "accidents",
    name: "Accident Reports & Test Results",
    icon: AlertTriangle,
    description: "Incident reports, well tests, and safety inspections",
    fields: ["API Number", "Date", "Type", "Description", "Severity", "Resolution"],
  },
  {
    id: "transitions",
    name: "Productive Interval Transitions",
    icon: ArrowRightLeft,
    description: "Changes in producing intervals and zone recompletions",
    fields: ["API Number", "Date", "From Zone", "To Zone", "Method", "Result (bbl/d)"],
  },
];

export const DataClassificationDemo = () => {
  const [stage, setStage] = useState<ClassifyStage>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [classifiedRecords, setClassifiedRecords] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getTimestamp = () =>
    new Date().toLocaleTimeString("en-US", { hour12: false });

  const addLog = useCallback((message: string, type: LogEntry["type"]) => {
    setLogs((prev) => [...prev, { time: getTimestamp(), message, type }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const runClassification = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setTotalRecords(0);
    setClassifiedRecords(0);

    const cats: DataCategory[] = INITIAL_CATEGORIES.map((c) => ({
      ...c,
      recordCount: 0,
      status: "pending" as const,
      quality: 0,
    }));
    setCategories(cats);

    // Stage 1: Download
    setStage("downloading");
    addLog("=== Data Classification Pipeline Started ===", "info");
    addLog("Connecting to state databases (OK, TX)...", "info");
    await new Promise((r) => setTimeout(r, 800));
    addLog("Connected to Oklahoma Corporation Commission", "success");
    await new Promise((r) => setTimeout(r, 500));
    addLog("Connected to Texas Railroad Commission", "success");

    let total = 0;
    for (let i = 0; i < cats.length; i++) {
      const count = Math.round(2000 + Math.random() * 8000);
      cats[i].recordCount = count;
      cats[i].status = "downloading";
      setCategories([...cats]);
      addLog(`Downloading ${cats[i].name}... ${count.toLocaleString()} records`, "info");
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      cats[i].status = "classifying";
      setCategories([...cats]);
      total += count;
      setProgress(5 + (i / cats.length) * 25);
    }
    setTotalRecords(total);
    addLog(`Download complete: ${total.toLocaleString()} raw records`, "success");
    setProgress(30);

    // Stage 2: Parse
    setStage("parsing");
    addLog("Parsing raw data formats (CSV, XML, JSON)...", "info");
    await new Promise((r) => setTimeout(r, 1200));
    addLog("Standardizing date formats to ISO 8601", "info");
    await new Promise((r) => setTimeout(r, 600));
    addLog("Normalizing API number formats (XX-XXX-XXXXX)", "info");
    await new Promise((r) => setTimeout(r, 800));
    addLog("Parse complete — all records standardized", "success");
    setProgress(50);

    // Stage 3: Classify
    setStage("classifying");
    addLog("Running ML classification model on records...", "info");
    let classified = 0;
    for (let i = 0; i < cats.length; i++) {
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
      const quality = Math.round(85 + Math.random() * 14);
      cats[i].quality = quality;
      classified += cats[i].recordCount;
      setClassifiedRecords(classified);
      setCategories([...cats]);
      addLog(
        `Classified "${cats[i].name}" — ${cats[i].recordCount.toLocaleString()} records (${quality}% quality)`,
        quality >= 95 ? "success" : quality >= 90 ? "info" : "warning"
      );
      setProgress(50 + (i / cats.length) * 30);
    }
    setProgress(80);

    // Stage 4: Validate
    setStage("validating");
    addLog("Running data integrity checks...", "info");
    await new Promise((r) => setTimeout(r, 1000));
    const dupes = Math.round(50 + Math.random() * 150);
    addLog(`Found ${dupes} duplicate records — removed`, "warning");
    await new Promise((r) => setTimeout(r, 600));
    const orphans = Math.round(10 + Math.random() * 30);
    addLog(`Found ${orphans} orphan records (no matching API number) — flagged`, "warning");
    await new Promise((r) => setTimeout(r, 500));
    addLog("Cross-referencing categories for consistency...", "info");
    await new Promise((r) => setTimeout(r, 800));
    addLog("Validation complete ✓", "success");
    setProgress(95);

    // Complete
    for (let i = 0; i < cats.length; i++) {
      cats[i].status = "complete";
    }
    setCategories([...cats]);
    await new Promise((r) => setTimeout(r, 500));
    setStage("complete");
    setProgress(100);
    const avgQuality = Math.round(cats.reduce((a, c) => a + c.quality, 0) / cats.length);
    addLog("=== Classification Complete ===", "success");
    addLog(
      `${total.toLocaleString()} records classified into ${cats.length} categories (avg quality: ${avgQuality}%)`,
      "success"
    );
    setIsRunning(false);
  }, [addLog]);

  const reset = () => {
    setStage("idle");
    setIsRunning(false);
    setProgress(0);
    setCategories([]);
    setLogs([]);
    setTotalRecords(0);
    setClassifiedRecords(0);
  };

  const getCategoryStatusBadge = (status: DataCategory["status"]) => {
    switch (status) {
      case "downloading":
        return <Badge className="bg-primary/20 text-primary border-primary/30"><Download className="mr-1 h-3 w-3 animate-bounce" />Downloading</Badge>;
      case "classifying":
        return <Badge className="bg-warning/20 text-warning border-warning/30"><FolderSearch className="mr-1 h-3 w-3" />Classifying</Badge>;
      case "complete":
        return <Badge className="bg-success/20 text-success border-success/30"><CheckCircle2 className="mr-1 h-3 w-3" />Complete</Badge>;
      default:
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(categories.length > 0 ? categories : INITIAL_CATEGORIES.map((c) => ({
          ...c, recordCount: 0, status: "pending" as const, quality: 0,
        }))).map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.id}
              className={`glass-card transition-all duration-300 ${
                cat.status === "complete"
                  ? "ring-1 ring-success/30"
                  : cat.status === "downloading" || cat.status === "classifying"
                  ? "ring-1 ring-primary/30"
                  : ""
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cat.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {getCategoryStatusBadge(cat.status)}
                  {cat.recordCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {cat.recordCount.toLocaleString()} records
                    </span>
                  )}
                </div>
                {cat.quality > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Data Quality</span>
                      <span className={cat.quality >= 95 ? "text-success" : cat.quality >= 90 ? "text-primary" : "text-warning"}>
                        {cat.quality}%
                      </span>
                    </div>
                    <Progress value={cat.quality} className="h-1.5" />
                  </div>
                )}
                {cat.status === "complete" && (
                  <div className="flex flex-wrap gap-1">
                    {cat.fields.map((f) => (
                      <Badge key={f} variant="secondary" className="text-[9px] px-1.5 py-0">
                        {f}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      {totalRecords > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">Total Records</p>
            <p className="font-bold text-lg">{totalRecords.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">Classified</p>
            <p className="font-bold text-lg text-success">{classifiedRecords.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">Categories</p>
            <p className="font-bold text-lg text-primary">{categories.filter((c) => c.status === "complete").length}/{categories.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">Avg Quality</p>
            <p className="font-bold text-lg text-primary">
              {categories.length > 0 && categories[0].quality > 0
                ? Math.round(categories.reduce((a, c) => a + c.quality, 0) / categories.length) + "%"
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Classification Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Stages */}
          <div className="grid grid-cols-5 gap-2">
            {STAGES.map((s, idx) => {
              const stageIndex = STAGES.findIndex((st) => st.key === stage);
              const isActive = s.key === stage;
              const isComplete = stageIndex > idx;
              return (
                <div
                  key={s.key}
                  className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                    isActive ? "bg-primary/20 ring-1 ring-primary" : isComplete ? "bg-success/10" : "bg-muted/50"
                  }`}
                >
                  <span className={`text-[10px] leading-tight ${isActive ? "text-primary font-medium" : isComplete ? "text-success" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Console */}
      {logs.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isRunning ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
              Classification Console
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="h-[180px] rounded-lg bg-background/80 border border-border p-3">
              <div ref={scrollRef} className="font-mono text-xs space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                    <span className={
                      log.type === "success" ? "text-success" :
                      log.type === "warning" ? "text-warning" :
                      log.type === "error" ? "text-destructive" :
                      "text-primary"
                    }>{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <Button onClick={runClassification} disabled={isRunning} className="flex-1">
          <Play className="mr-2 h-4 w-4" />
          Run Data Classification
        </Button>
        <Button variant="outline" onClick={reset} disabled={isRunning}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
};
