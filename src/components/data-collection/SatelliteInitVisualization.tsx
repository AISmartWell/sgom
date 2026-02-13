import { useState, useEffect } from "react";
import { Satellite, Grid3X3, CheckCircle2 } from "lucide-react";
import satelliteImage from "@/assets/satellite-field-view.jpg";

interface SatelliteInitVisualizationProps {
  stage: "idle" | "initializing" | "scanning" | "analyzing" | "filtering" | "cleanup" | "complete";
}

export const SatelliteInitVisualization = ({ stage }: SatelliteInitVisualizationProps) => {
  const [satelliteLoaded, setSatelliteLoaded] = useState(false);
  const [gridOverlay, setGridOverlay] = useState(false);
  const [scanLines, setScanLines] = useState(0);

  const isActive = stage !== "idle";
  const pastInit = ["scanning", "analyzing", "filtering", "cleanup", "complete"].includes(stage);

  useEffect(() => {
    if (stage === "initializing") {
      setSatelliteLoaded(false);
      setGridOverlay(false);
      setScanLines(0);

      // Simulate satellite image loading with scan lines
      const scanInterval = setInterval(() => {
        setScanLines((prev) => {
          if (prev >= 100) {
            clearInterval(scanInterval);
            setSatelliteLoaded(true);
            return 100;
          }
          return prev + 4;
        });
      }, 40);

      return () => clearInterval(scanInterval);
    } else if (pastInit) {
      setSatelliteLoaded(true);
      setGridOverlay(true);
      setScanLines(100);
    }
  }, [stage, pastInit]);

  // Show GIS grid after satellite loads
  useEffect(() => {
    if (satelliteLoaded && stage === "initializing") {
      const timer = setTimeout(() => setGridOverlay(true), 400);
      return () => clearTimeout(timer);
    }
  }, [satelliteLoaded, stage]);

  if (!isActive) return null;

  return (
    <div className="relative rounded-lg overflow-hidden border border-border bg-black">
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-2 text-[10px]">
          <Satellite className={`h-3 w-3 ${satelliteLoaded ? "text-success" : "text-primary animate-pulse"}`} />
          <span className={satelliteLoaded ? "text-success" : "text-primary"}>
            {satelliteLoaded ? "Satellite imagery loaded" : "Loading satellite data..."}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <Grid3X3 className={`h-3 w-3 ${gridOverlay ? "text-success" : "text-muted-foreground"}`} />
          <span className={gridOverlay ? "text-success" : "text-muted-foreground"}>
            {gridOverlay ? "GIS grid active" : "GIS grid pending"}
          </span>
          {gridOverlay && satelliteLoaded && <CheckCircle2 className="h-3 w-3 text-success" />}
        </div>
      </div>

      {/* Satellite image container */}
      <div className="relative h-48 overflow-hidden">
        {/* Satellite image with reveal effect */}
        <img
          src={satelliteImage}
          alt="Satellite field view"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            clipPath: `inset(0 0 ${100 - scanLines}% 0)`,
            transition: "clip-path 0.05s linear",
          }}
        />

        {/* Dark base before image loads */}
        <div
          className="absolute inset-0 bg-slate-950"
          style={{
            clipPath: `inset(${scanLines}% 0 0 0)`,
          }}
        />

        {/* Scan line effect */}
        {!satelliteLoaded && (
          <div
            className="absolute left-0 right-0 h-[2px] bg-primary/80 shadow-[0_0_10px_2px_hsl(var(--primary)/0.5)] z-10"
            style={{ top: `${scanLines}%`, transition: "top 0.05s linear" }}
          />
        )}

        {/* GIS Grid overlay */}
        {gridOverlay && (
          <div
            className="absolute inset-0 z-10 transition-opacity duration-700"
            style={{ opacity: gridOverlay ? 1 : 0 }}
          >
            {/* Vertical lines */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={`v${i}`}
                className="absolute top-0 bottom-0 w-px bg-primary/40"
                style={{
                  left: `${(i / 6) * 100}%`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
            {/* Horizontal lines */}
            {[1, 2, 3].map((i) => (
              <div
                key={`h${i}`}
                className="absolute left-0 right-0 h-px bg-primary/40"
                style={{
                  top: `${(i / 4) * 100}%`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
            {/* Grid cell labels */}
            {[...Array(24)].map((_, idx) => {
              const row = Math.floor(idx / 6);
              const col = idx % 6;
              return (
                <div
                  key={idx}
                  className="absolute text-[7px] text-primary/60 font-mono"
                  style={{
                    left: `${(col / 6) * 100 + 1}%`,
                    top: `${(row / 4) * 100 + 2}%`,
                  }}
                >
                  {String.fromCharCode(65 + row)}{col + 1}
                </div>
              );
            })}
          </div>
        )}

        {/* Coordinates overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-between px-2 py-1 bg-black/60 text-[8px] font-mono text-muted-foreground">
          <span>34.5°N 97.8°W</span>
          <span>NAD83 / UTM Zone 14N</span>
          <span>Res: 0.5m/px</span>
        </div>
      </div>
    </div>
  );
};
