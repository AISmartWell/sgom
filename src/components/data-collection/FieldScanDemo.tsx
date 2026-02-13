import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  RotateCcw,
  Radar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fuel,
  Trash2,
  MapPin,
  Clock,
  Settings,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ScanStage =
  | "idle"
  | "initializing"
  | "scanning"
  | "analyzing"
  | "filtering"
  | "cleanup"
  | "complete";

interface FieldSquare {
  id: string;
  row: number;
  col: number;
  name: string;
  status: "pending" | "scanning" | "scanned" | "flagged";
  wellCount: number;
  activeWells: number;
  lowProdWells: number;
  closedWells: number;
}

interface Well {
  id: string;
  squareId: string;
  name: string;
  status: "active" | "low-productive" | "closed" | "removed";
  production: number; // bbl/day
  waterCut: number;
}

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

const FIELD_NAMES = [
  ["Anadarko NW", "Anadarko NE", "Anadarko C", "Woodford W", "Woodford E", "Woodford SE"],
  ["SCOOP W", "SCOOP C", "SCOOP E", "STACK W", "STACK C", "STACK E"],
  ["Permian NW", "Permian N", "Permian NE", "Permian C", "Permian SW", "Permian SE"],
  ["Delaware W", "Delaware C", "Delaware E", "Midland W", "Midland C", "Midland E"],
];

const STAGES: { key: ScanStage; label: string; icon: any }[] = [
  { key: "initializing", label: "Initialize", icon: Settings },
  { key: "scanning", label: "Scan Fields", icon: Radar },
  { key: "analyzing", label: "Analyze Wells", icon: Fuel },
  { key: "filtering", label: "Flag Low-Prod", icon: AlertTriangle },
  { key: "cleanup", label: "Remove Closed", icon: Trash2 },
  { key: "complete", label: "Complete", icon: CheckCircle2 },
];

const generateWells = (squareId: string, count: number): Well[] => {
  const wells: Well[] = [];
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let status: Well["status"];
    let production: number;
    let waterCut: number;

    if (rand < 0.15) {
      status = "closed";
      production = 0;
      waterCut = 0;
    } else if (rand < 0.35) {
      status = "low-productive";
      production = Math.round(2 + Math.random() * 8);
      waterCut = Math.round(60 + Math.random() * 35);
    } else {
      status = "active";
      production = Math.round(15 + Math.random() * 85);
      waterCut = Math.round(10 + Math.random() * 40);
    }

    wells.push({
      id: `${squareId}-w${i}`,
      squareId,
      name: `Well ${squareId.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
      status,
      production,
      waterCut,
    });
  }
  return wells;
};

export const FieldScanDemo = () => {
  const [stage, setStage] = useState<ScanStage>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [schedule, setSchedule] = useState("weekly");
  const [squares, setSquares] = useState<FieldSquare[]>([]);
  const [wells, setWells] = useState<Well[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [scanningSquare, setScanningSquare] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, lowProd: 0, closed: 0, removed: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const getTimestamp = () => new Date().toLocaleTimeString("en-US", { hour12: false });

  const addLog = useCallback((message: string, type: LogEntry["type"]) => {
    setLogs((prev) => [...prev, { time: getTimestamp(), message, type }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Initialize field squares
  const initSquares = useCallback((): FieldSquare[] => {
    const sq: FieldSquare[] = [];
    for (let r = 0; r < FIELD_NAMES.length; r++) {
      for (let c = 0; c < FIELD_NAMES[r].length; c++) {
        const id = `${r}-${c}`;
        const wellCount = Math.round(8 + Math.random() * 12);
        sq.push({
          id,
          row: r,
          col: c,
          name: FIELD_NAMES[r][c],
          status: "pending",
          wellCount,
          activeWells: 0,
          lowProdWells: 0,
          closedWells: 0,
        });
      }
    }
    return sq;
  }, []);

  const runScan = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setWells([]);
    setStats({ total: 0, active: 0, lowProd: 0, closed: 0, removed: 0 });

    // Stage 1: Initialize
    setStage("initializing");
    const fieldSquares = initSquares();
    setSquares(fieldSquares);
    addLog("=== Automated Field Scan Started ===", "info");
    addLog(`Schedule: ${schedule} auto-scan`, "info");
    addLog(`Target area: ${fieldSquares.length} predefined field squares`, "info");
    await new Promise((r) => setTimeout(r, 1200));
    addLog("Satellite imagery loaded", "success");
    addLog("GIS grid overlay initialized", "success");
    setProgress(10);

    // Stage 2: Scan fields square by square
    setStage("scanning");
    const allWells: Well[] = [];

    for (let i = 0; i < fieldSquares.length; i++) {
      const sq = fieldSquares[i];
      setScanningSquare(sq.id);

      setSquares((prev) =>
        prev.map((s) => (s.id === sq.id ? { ...s, status: "scanning" } : s))
      );

      const sqWells = generateWells(sq.id, sq.wellCount);
      allWells.push(...sqWells);

      await new Promise((r) => setTimeout(r, 200 + Math.random() * 150));

      const active = sqWells.filter((w) => w.status === "active").length;
      const lowProd = sqWells.filter((w) => w.status === "low-productive").length;
      const closed = sqWells.filter((w) => w.status === "closed").length;

      setSquares((prev) =>
        prev.map((s) =>
          s.id === sq.id
            ? { ...s, status: "scanned", activeWells: active, lowProdWells: lowProd, closedWells: closed }
            : s
        )
      );

      if (i % 4 === 0) {
        addLog(`Scanning ${sq.name}... found ${sq.wellCount} wells`, "info");
      }

      setProgress(10 + (i / fieldSquares.length) * 40);
    }

    setScanningSquare(null);
    setWells(allWells);
    addLog(`Scan complete: ${allWells.length} wells detected across ${fieldSquares.length} squares`, "success");
    setProgress(50);

    // Stage 3: Analyze production
    setStage("analyzing");
    addLog("Analyzing production rates and decline curves...", "info");
    await new Promise((r) => setTimeout(r, 1500));

    const activeCount = allWells.filter((w) => w.status === "active").length;
    const lowProdCount = allWells.filter((w) => w.status === "low-productive").length;
    const closedCount = allWells.filter((w) => w.status === "closed").length;
    addLog(`Active wells: ${activeCount} | Low-productive: ${lowProdCount} | Closed: ${closedCount}`, "info");
    setStats({ total: allWells.length, active: activeCount, lowProd: lowProdCount, closed: closedCount, removed: 0 });
    setProgress(65);

    // Stage 4: Flag low-productive
    setStage("filtering");
    addLog("Identifying low-productive operating wells (< 10 bbl/day, WC > 60%)...", "warning");
    await new Promise((r) => setTimeout(r, 1200));

    for (let i = 0; i < fieldSquares.length; i++) {
      const sqLowProd = allWells.filter((w) => w.squareId === fieldSquares[i].id && w.status === "low-productive");
      if (sqLowProd.length > 0) {
        setSquares((prev) =>
          prev.map((s) =>
            s.id === fieldSquares[i].id && s.lowProdWells > 0 ? { ...s, status: "flagged" } : s
          )
        );
      }
    }

    addLog(`⚠ Flagged ${lowProdCount} low-productive wells for review`, "warning");
    addLog("Low-prod criteria: production < 10 bbl/day, water cut > 60%", "info");
    setProgress(80);

    // Stage 5: Remove closed wells
    setStage("cleanup");
    addLog("Removing closed/plugged wells from active database...", "info");
    await new Promise((r) => setTimeout(r, 1000));

    setWells((prev) =>
      prev.map((w) => (w.status === "closed" ? { ...w, status: "removed" } : w))
    );
    setStats((prev) => ({ ...prev, removed: closedCount }));
    addLog(`🗑 Removed ${closedCount} closed wells from database`, "error");
    addLog("Database cleanup complete", "success");
    setProgress(95);

    // Complete
    await new Promise((r) => setTimeout(r, 800));
    setStage("complete");
    setProgress(100);
    addLog("=== Field Scan Complete ===", "success");
    addLog(`Summary: ${activeCount} active, ${lowProdCount} flagged, ${closedCount} removed`, "success");
    addLog(`Next scan scheduled: ${schedule === "weekly" ? "7 days" : schedule === "daily" ? "24 hours" : "30 days"}`, "info");
    setIsRunning(false);
  }, [addLog, initSquares, schedule]);

  const reset = () => {
    setStage("idle");
    setIsRunning(false);
    setProgress(0);
    setSquares([]);
    setWells([]);
    setLogs([]);
    setScanningSquare(null);
    setStats({ total: 0, active: 0, lowProd: 0, closed: 0, removed: 0 });
  };

  const getSquareColor = (sq: FieldSquare) => {
    if (sq.id === scanningSquare) return "bg-primary/40 border-primary ring-2 ring-primary/50 animate-pulse";
    switch (sq.status) {
      case "flagged": return "bg-warning/20 border-warning/50";
      case "scanned": return "bg-success/15 border-success/40";
      case "scanning": return "bg-primary/30 border-primary animate-pulse";
      default: return "bg-muted/30 border-border/50";
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radar className="h-5 w-5" />
          Demo: Automated Field Scanning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Schedule selector */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Scan Schedule:</span>
          <Select value={schedule} onValueChange={setSchedule} disabled={isRunning}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Field Grid Map */}
        <div className="relative bg-slate-900/50 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Field Grid — Predefined Scan Squares</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {squares.length > 0
              ? squares.map((sq) => (
                  <div
                    key={sq.id}
                    className={`relative p-2 rounded-md border transition-all duration-300 cursor-default ${getSquareColor(sq)}`}
                    title={`${sq.name}: ${sq.wellCount} wells`}
                  >
                    <p className="text-[9px] font-medium truncate leading-tight">{sq.name}</p>
                    {sq.status !== "pending" && (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center gap-0.5 text-[8px]">
                          <span className="text-success">●</span>
                          <span>{sq.activeWells}</span>
                          {sq.lowProdWells > 0 && (
                            <>
                              <span className="text-warning ml-1">▲</span>
                              <span>{sq.lowProdWells}</span>
                            </>
                          )}
                          {sq.closedWells > 0 && (
                            <>
                              <span className="text-destructive ml-1">✕</span>
                              <span>{sq.closedWells}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {sq.id === scanningSquare && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Radar className="h-5 w-5 text-primary animate-ping opacity-50" />
                      </div>
                    )}
                  </div>
                ))
              : // Placeholder grid
                FIELD_NAMES.flat().map((name, i) => (
                  <div key={i} className="p-2 rounded-md border border-border/30 bg-muted/20">
                    <p className="text-[9px] font-medium truncate leading-tight text-muted-foreground">{name}</p>
                  </div>
                ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><span className="text-success">●</span> Active</div>
            <div className="flex items-center gap-1"><span className="text-warning">▲</span> Low-Prod</div>
            <div className="flex items-center gap-1"><span className="text-destructive">✕</span> Closed</div>
            <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-warning/30 border border-warning/50" /> Flagged Square</div>
          </div>
        </div>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: "Total Wells", value: stats.total, color: "text-foreground" },
              { label: "Active", value: stats.active, color: "text-success" },
              { label: "Low-Productive", value: stats.lowProd, color: "text-warning" },
              { label: "Closed", value: stats.closed, color: "text-destructive" },
              { label: "Removed", value: stats.removed, color: "text-destructive" },
            ].map((s) => (
              <div key={s.label} className="p-2 rounded-lg bg-muted/30 border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Scan Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stages Timeline */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {STAGES.map((s, idx) => {
            const stageIndex = STAGES.findIndex((st) => st.key === stage);
            const isActive = s.key === stage;
            const isComplete = stageIndex > idx;
            const Icon = s.icon;

            return (
              <div
                key={s.key}
                className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                  isActive ? "bg-primary/20 ring-1 ring-primary" : isComplete ? "bg-success/10" : "bg-muted/50"
                }`}
              >
                <div className={`mb-1 ${isActive ? "text-primary" : isComplete ? "text-success" : "text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Live Console */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className={`h-2 w-2 rounded-full ${isRunning ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
              Scan Console
            </div>
            <ScrollArea className="h-[160px] rounded-lg bg-background/80 border border-border p-3">
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
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button onClick={runScan} disabled={isRunning} className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            Run Field Scan
          </Button>
          <Button variant="outline" onClick={reset} disabled={stage === "idle"}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Explanation */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
          <p><strong>Automated Field Scanning Pipeline:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Initialize</strong> — Load satellite imagery and GIS grid overlay for predefined field squares</li>
            <li><strong>Scan Fields</strong> — Systematically scan each square, detecting all wells via coordinates and API data</li>
            <li><strong>Analyze Wells</strong> — Evaluate production rates, decline curves, and water cut for each well</li>
            <li><strong>Flag Low-Productive</strong> — Identify operating wells below threshold (&lt;10 bbl/day, WC &gt;60%)</li>
            <li><strong>Remove Closed</strong> — Automatically purge closed/plugged wells from the active database</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
