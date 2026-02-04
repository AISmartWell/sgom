import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database,
  Map,
  Radio,
  FileText,
  BarChart3,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface DataSource {
  id: string;
  name: string;
  icon: React.ElementType;
  status: ConnectionStatus;
  records: number;
  targetRecords: number;
}

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

const INITIAL_SOURCES: DataSource[] = [
  { id: "iwm", name: "Interactive Well Maps", icon: Map, status: "disconnected", records: 0, targetRecords: 15847 },
  { id: "ok-db", name: "State Databases (Oklahoma)", icon: Database, status: "disconnected", records: 0, targetRecords: 8234 },
  { id: "tx-db", name: "State Databases (Texas)", icon: Database, status: "disconnected", records: 0, targetRecords: 7613 },
  { id: "seismic", name: "Seismic Data Feeds", icon: Radio, status: "disconnected", records: 0, targetRecords: 3421 },
  { id: "logs", name: "Well Log Archives", icon: FileText, status: "disconnected", records: 0, targetRecords: 12890 },
  { id: "prod", name: "Production History", icon: BarChart3, status: "disconnected", records: 0, targetRecords: 45230 },
];

const LOG_MESSAGES: { sourceId: string; messages: { msg: string; type: LogEntry["type"] }[] }[] = [
  {
    sourceId: "iwm",
    messages: [
      { msg: "Initializing connection to Interactive Well Maps API...", type: "info" },
      { msg: "Authentication successful", type: "success" },
      { msg: "Scanning geographic regions...", type: "info" },
      { msg: "Found 15,847 wells in target area", type: "success" },
      { msg: "Downloading well coordinates and metadata...", type: "info" },
      { msg: "Interactive Well Maps sync complete ✓", type: "success" },
    ],
  },
  {
    sourceId: "ok-db",
    messages: [
      { msg: "Connecting to Oklahoma Corporation Commission database...", type: "info" },
      { msg: "Connection established via secure tunnel", type: "success" },
      { msg: "Querying Anadarko Basin well records...", type: "info" },
      { msg: "Retrieved 8,234 production records", type: "success" },
      { msg: "Oklahoma database sync complete ✓", type: "success" },
    ],
  },
  {
    sourceId: "tx-db",
    messages: [
      { msg: "Connecting to Texas Railroad Commission...", type: "info" },
      { msg: "Authenticating with API credentials...", type: "info" },
      { msg: "Fetching Permian Basin well data...", type: "info" },
      { msg: "Downloaded 7,613 well records", type: "success" },
      { msg: "Texas database sync complete ✓", type: "success" },
    ],
  },
  {
    sourceId: "seismic",
    messages: [
      { msg: "Establishing connection to seismic data feed...", type: "info" },
      { msg: "Subscribing to real-time seismic streams...", type: "info" },
      { msg: "Processing 2D/3D survey data...", type: "info" },
      { msg: "Indexed 3,421 seismic sections", type: "success" },
      { msg: "Seismic data feed connected ✓", type: "success" },
    ],
  },
  {
    sourceId: "logs",
    messages: [
      { msg: "Accessing well log archive storage...", type: "info" },
      { msg: "Scanning LAS file directories...", type: "info" },
      { msg: "Parsing gamma ray, resistivity, porosity logs...", type: "info" },
      { msg: "Processed 12,890 well log files", type: "success" },
      { msg: "Well log archive sync complete ✓", type: "success" },
    ],
  },
  {
    sourceId: "prod",
    messages: [
      { msg: "Connecting to production history database...", type: "info" },
      { msg: "Loading monthly oil/gas/water volumes...", type: "info" },
      { msg: "Aggregating 45,230 production records...", type: "info" },
      { msg: "Calculating decline curves and EUR estimates...", type: "info" },
      { msg: "Production history sync complete ✓", type: "success" },
    ],
  },
];

export const DataCollectionDemo = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [sources, setSources] = useState<DataSource[]>(INITIAL_SOURCES);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false });
  };

  const addLog = useCallback((message: string, type: LogEntry["type"]) => {
    setLogs((prev) => [...prev, { time: getTimestamp(), message, type }]);
  }, []);

  const animateRecordCount = useCallback(
    (sourceId: string, targetRecords: number) => {
      const duration = 1500;
      const steps = 30;
      const increment = targetRecords / steps;
      let current = 0;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current = Math.min(Math.round(increment * step), targetRecords);
        setSources((prev) =>
          prev.map((s) => (s.id === sourceId ? { ...s, records: current } : s))
        );
        if (step >= steps) {
          clearInterval(interval);
        }
      }, duration / steps);
    },
    []
  );

  const connectSource = useCallback(
    async (sourceIndex: number) => {
      const source = INITIAL_SOURCES[sourceIndex];
      const logMessages = LOG_MESSAGES.find((l) => l.sourceId === source.id)?.messages || [];

      // Set to connecting
      setSources((prev) =>
        prev.map((s, i) => (i === sourceIndex ? { ...s, status: "connecting" } : s))
      );

      // Play through log messages
      for (let i = 0; i < logMessages.length; i++) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
        addLog(logMessages[i].msg, logMessages[i].type);

        // Start counting records on the third message
        if (i === 2) {
          animateRecordCount(source.id, source.targetRecords);
        }
      }

      // Set to connected
      setSources((prev) =>
        prev.map((s, i) =>
          i === sourceIndex ? { ...s, status: "connected", records: source.targetRecords } : s
        )
      );

      // Update overall progress
      setOverallProgress(((sourceIndex + 1) / INITIAL_SOURCES.length) * 100);
    },
    [addLog, animateRecordCount]
  );

  const runDemo = useCallback(async () => {
    setIsRunning(true);
    setLogs([]);
    setSources(INITIAL_SOURCES);
    setOverallProgress(0);
    setCurrentSourceIndex(0);

    addLog("=== Data Collection Demo Started ===", "info");
    addLog("Initializing data pipeline...", "info");

    await new Promise((r) => setTimeout(r, 800));

    for (let i = 0; i < INITIAL_SOURCES.length; i++) {
      setCurrentSourceIndex(i);
      await connectSource(i);
      await new Promise((r) => setTimeout(r, 500));
    }

    addLog("=== All data sources synchronized ===", "success");
    addLog(`Total records collected: 93,235`, "success");
    setCurrentSourceIndex(-1);
    setIsRunning(false);
  }, [addLog, connectSource]);

  const reset = () => {
    setIsRunning(false);
    setSources(INITIAL_SOURCES);
    setLogs([]);
    setOverallProgress(0);
    setCurrentSourceIndex(-1);
  };

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "connecting":
        return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      case "error":
        return <WifiOff className="h-4 w-4 text-destructive" />;
      default:
        return <Wifi className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    const styles = {
      connected: "bg-success/20 text-success border-success/30",
      connecting: "bg-warning/20 text-warning border-warning/30",
      error: "bg-destructive/20 text-destructive border-destructive/30",
      disconnected: "bg-muted text-muted-foreground border-border",
    };

    return (
      <Badge className={styles[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "error":
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Interactive Demo: Data Collection Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sources.map((source, index) => (
            <div
              key={source.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                currentSourceIndex === index
                  ? "bg-primary/10 border-primary ring-1 ring-primary/50"
                  : source.status === "connected"
                  ? "bg-success/5 border-success/30"
                  : "bg-muted/30 border-border/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
                    source.status === "connected"
                      ? "bg-success/20"
                      : source.status === "connecting"
                      ? "bg-warning/20"
                      : "bg-primary/10"
                  }`}
                >
                  <source.icon
                    className={`h-4 w-4 ${
                      source.status === "connected"
                        ? "text-success"
                        : source.status === "connecting"
                        ? "text-warning"
                        : "text-primary"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">{source.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {source.records.toLocaleString()} records
                  </p>
                </div>
              </div>
              {getStatusBadge(source.status)}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Live Log Console */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div
              className={`h-2 w-2 rounded-full ${isRunning ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
            />
            Live Console
          </div>
          <ScrollArea className="h-[200px] rounded-lg bg-background/80 border border-border p-3">
            <div ref={scrollRef} className="font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">Click "Run Demo" to start data collection simulation...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                    <span className={getLogColor(log.type)}>{log.message}</span>
                  </div>
                ))
              )}
              {isRunning && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground">[{getTimestamp()}]</span>
                  <span className="text-primary animate-pulse">Processing...</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button onClick={runDemo} disabled={isRunning} className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            Run Demo
          </Button>
          <Button variant="outline" onClick={reset} disabled={isRunning}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Explanation */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
          <p><strong>Data Collection Pipeline Stages:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Well Maps</strong> — Interactive maps with well coordinates</li>
            <li><strong>State Databases</strong> — Official production data from OK/TX</li>
            <li><strong>Seismic Feeds</strong> — 2D/3D survey data streams</li>
            <li><strong>Well Logs</strong> — LAS files (gamma, resistivity, porosity)</li>
            <li><strong>Production History</strong> — Monthly volumes and decline curves</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
