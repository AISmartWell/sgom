import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Radar, MapPin, AlertTriangle, CheckCircle2, Search, Loader2 } from "lucide-react";

interface WellRecord {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  county: string | null;
  state: string;
  formation: string | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  well_type: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface FieldScanMapProps {
  wells: WellRecord[];
  loading: boolean;
  onWellSelected: (wellId: string) => void;
}

type ScanPhase = "idle" | "scanning" | "analyzing" | "results";

interface ScannedWell {
  well: WellRecord;
  x: number;
  y: number;
  delay: number;
  isLowProducer: boolean;
}

const FieldScanMap = ({ wells, loading, onWellSelected }: FieldScanMapProps) => {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [revealedWells, setRevealedWells] = useState<Set<number>>(new Set());
  const [scannedWells, setScannedWells] = useState<ScannedWell[]>([]);
  const [lowProducerWells, setLowProducerWells] = useState<ScannedWell[]>([]);
  const [selectedScanWell, setSelectedScanWell] = useState<string | null>(null);

  // Generate well positions on the map
  useEffect(() => {
    if (wells.length === 0) return;
    const mapped = wells.slice(0, 40).map((well, i) => {
      // Use real coords if available, otherwise distribute pseudo-randomly
      const hash = well.id.charCodeAt(0) + well.id.charCodeAt(1) * 7 + i * 13;
      const x = well.longitude ? ((well.longitude + 100) / 5) * 100 : 8 + (hash * 37) % 84;
      const y = well.latitude ? ((38 - well.latitude) / 4) * 100 : 6 + (hash * 53) % 88;
      const isLow = (well.production_oil ?? 50) < 15 || (well.water_cut ?? 0) > 55;
      return {
        well,
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
        delay: i * 80,
        isLowProducer: isLow,
      };
    });
    setScannedWells(mapped);
    setLowProducerWells(mapped.filter((w) => w.isLowProducer));
  }, [wells]);

  const startScan = useCallback(async () => {
    setPhase("scanning");
    setRevealedWells(new Set());
    setScanProgress(0);
    setScanLine(0);

    // Animate scan line sweeping top to bottom
    const totalSteps = 60;
    for (let step = 0; step <= totalSteps; step++) {
      await new Promise((r) => setTimeout(r, 50));
      const pct = (step / totalSteps) * 100;
      setScanLine(pct);
      setScanProgress(pct * 0.6); // scanning is 60% of total

      // Reveal wells as scan line passes them
      setRevealedWells((prev) => {
        const next = new Set(prev);
        scannedWells.forEach((sw, idx) => {
          if (sw.y <= pct && !next.has(idx)) {
            next.add(idx);
          }
        });
        return next;
      });
    }

    // Analyzing phase
    setPhase("analyzing");
    for (let step = 0; step <= 20; step++) {
      await new Promise((r) => setTimeout(r, 80));
      setScanProgress(60 + (step / 20) * 40);
    }

    setPhase("results");
    setScanProgress(100);
  }, [scannedWells]);

  const resetScan = () => {
    setPhase("idle");
    setScanProgress(0);
    setScanLine(0);
    setRevealedWells(new Set());
    setSelectedScanWell(null);
  };

  const handleSelectWell = (wellId: string) => {
    setSelectedScanWell(wellId);
    onWellSelected(wellId);
  };

  return (
    <Card className="glass-card mb-6 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Radar className="h-5 w-5 text-primary" />
          </div>
          <span className="flex-1">Field Reconnaissance</span>
          {phase === "idle" && (
            <Button size="sm" onClick={startScan} disabled={loading || wells.length === 0}>
              <Search className="mr-2 h-4 w-4" />
              Scan for Low Producers
            </Button>
          )}
          {phase === "scanning" && (
            <Badge variant="outline" className="animate-pulse text-primary border-primary/30">
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Scanning...
            </Badge>
          )}
          {phase === "analyzing" && (
            <Badge variant="outline" className="animate-pulse text-warning border-warning/30">
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Analyzing production data...
            </Badge>
          )}
          {phase === "results" && (
            <div className="flex items-center gap-2">
              <Badge className="bg-success/20 text-success border-success/30">
                <CheckCircle2 className="mr-1.5 h-3 w-3" />
                {lowProducerWells.length} candidates found
              </Badge>
              <Button size="sm" variant="ghost" onClick={resetScan}>Re-scan</Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress bar during scan */}
        {(phase === "scanning" || phase === "analyzing") && (
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{phase === "scanning" ? "Scanning field area..." : "Filtering low-production wells..."}</span>
              <span>{Math.round(scanProgress)}%</span>
            </div>
            <Progress value={scanProgress} className="h-1.5" />
          </div>
        )}

        {/* Map visualization */}
        <div className="relative h-72 sm:h-80 rounded-lg bg-slate-900/60 border border-border/50 overflow-hidden">
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                               linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Topographic-style contour lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <ellipse cx="35" cy="40" rx="25" ry="18" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" />
            <ellipse cx="35" cy="40" rx="18" ry="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" />
            <ellipse cx="65" cy="60" rx="22" ry="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" />
            <ellipse cx="65" cy="60" rx="14" ry="9" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" />
          </svg>

          {/* Scan line */}
          {phase === "scanning" && (
            <>
              <div
                className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_4px_hsl(var(--primary)/0.4)] transition-all duration-75 z-20"
                style={{ top: `${scanLine}%` }}
              />
              {/* Scan area highlight */}
              <div
                className="absolute left-0 right-0 top-0 bg-primary/5 transition-all duration-75 z-10"
                style={{ height: `${scanLine}%` }}
              />
            </>
          )}

          {/* Well markers */}
          {scannedWells.map((sw, idx) => {
            const isRevealed = revealedWells.has(idx);
            const isLow = sw.isLowProducer;
            const isSelected = selectedScanWell === sw.well.id;
            const showAsCandidate = phase === "results" || phase === "analyzing";

            if (phase === "idle") {
              // Show dim dots initially
              return (
                <div
                  key={sw.well.id}
                  className="absolute w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
                  style={{ left: `${sw.x}%`, top: `${sw.y}%`, transform: "translate(-50%, -50%)" }}
                />
              );
            }

            if (!isRevealed && phase === "scanning") return null;

            return (
              <div
                key={sw.well.id}
                className={`absolute transition-all duration-500 z-10 ${
                  isRevealed ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
                style={{
                  left: `${sw.x}%`,
                  top: `${sw.y}%`,
                  transform: "translate(-50%, -50%)",
                  transitionDelay: `${Math.random() * 200}ms`,
                }}
              >
                {/* Marker */}
                <div
                  className={`rounded-full cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? "w-5 h-5 ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : showAsCandidate && isLow
                        ? "w-3.5 h-3.5 animate-pulse"
                        : "w-2 h-2"
                  } ${
                    showAsCandidate && isLow
                      ? "bg-warning shadow-[0_0_8px_2px_hsl(var(--warning)/0.5)]"
                      : showAsCandidate && !isLow
                        ? "bg-success/50"
                        : "bg-primary/70"
                  }`}
                  onClick={() => phase === "results" && isLow && handleSelectWell(sw.well.id)}
                  title={sw.well.well_name || sw.well.api_number || ""}
                />

                {/* Label for low producers in results */}
                {phase === "results" && isLow && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] text-warning font-medium pointer-events-none">
                    {sw.well.production_oil?.toFixed(0) ?? "?"} bbl/d
                  </div>
                )}
              </div>
            );
          })}

          {/* Region label */}
          <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 z-20">
            <span className="text-xs font-medium text-primary">
              {STATE_BASIN_LABELS[wells[0]?.state] || wells[0]?.state || "Field Area"}
            </span>
            <span className="text-[10px] text-muted-foreground ml-2">
              {wells.length} wells loaded
            </span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg p-2.5 space-y-1.5 z-20">
            <div className="flex items-center gap-2 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
              <span className="text-muted-foreground">Normal producer</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
              <span className="text-muted-foreground">Low producer / High WC</span>
            </div>
          </div>

          {/* Stats overlay during scanning */}
          {phase === "scanning" && (
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg p-2.5 z-20">
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <p>Wells scanned: <span className="font-medium text-foreground">{revealedWells.size}</span></p>
                <p>Low producers: <span className="font-medium text-warning">
                  {[...revealedWells].filter((i) => scannedWells[i]?.isLowProducer).length}
                </span></p>
              </div>
            </div>
          )}
        </div>

        {/* Results list */}
        {phase === "results" && lowProducerWells.length > 0 && (
          <div className="mt-4 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Low-Production Wells — Candidates for SPT Analysis</span>
            </div>
            <div className="grid gap-2 max-h-52 overflow-y-auto pr-1">
              {lowProducerWells.map((sw) => (
                <button
                  key={sw.well.id}
                  onClick={() => handleSelectWell(sw.well.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 ${
                    selectedScanWell === sw.well.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/50 bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-warning" />
                      <span className="text-sm font-medium">
                        {sw.well.well_name || sw.well.api_number || sw.well.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sw.well.county}, {sw.well.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-warning font-medium">
                        {sw.well.production_oil?.toFixed(1) ?? "—"} bbl/d
                      </span>
                      {(sw.well.water_cut ?? 0) > 55 && (
                        <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px] py-0">
                          WC {sw.well.water_cut?.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {selectedScanWell && (
              <p className="text-xs text-muted-foreground mt-2">
                ✅ Well selected — click <strong>Run Full Analysis</strong> to start the 8-stage pipeline
              </p>
            )}
          </div>
        )}

        {/* Idle state hint */}
        {phase === "idle" && !loading && (
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Click <strong>Scan for Low Producers</strong> to identify wells with declining production or high water cut
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FieldScanMap;
