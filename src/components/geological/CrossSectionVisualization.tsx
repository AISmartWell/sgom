import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const CrossSectionVisualization = () => {
  const [activeWell, setActiveWell] = useState<number | null>(null);
  const [hoveredWell, setHoveredWell] = useState<number | null>(null);

  const wells = [
    { id: 1, x: 15, name: "Well A-1", status: "producing", depth: 3250 },
    { id: 2, x: 35, name: "Well A-2", status: "producing", depth: 3180 },
    { id: 3, x: 55, name: "Well B-1", status: "injector", depth: 3320 },
    { id: 4, x: 75, name: "Well B-2", status: "planned", depth: 3200 },
  ];

  const layers = [
    { name: "Surface", top: 0, height: 10, color: "from-amber-800/40 to-amber-700/30", textColor: "text-amber-200" },
    { name: "Quaternary", top: 10, height: 8, color: "from-yellow-900/30 to-yellow-800/20", textColor: "text-yellow-200" },
    { name: "Tertiary Shale", top: 18, height: 15, color: "from-stone-600/40 to-stone-500/30", textColor: "text-stone-300" },
    { name: "Seal (Cap Rock)", top: 33, height: 8, color: "from-slate-500/50 to-slate-400/40", textColor: "text-slate-200" },
    { name: "Reservoir Sandstone", top: 41, height: 25, color: "from-primary/30 to-primary/20", textColor: "text-primary", isReservoir: true },
    { name: "Transition Zone", top: 66, height: 8, color: "from-blue-800/30 to-blue-700/20", textColor: "text-blue-300" },
    { name: "Aquifer", top: 74, height: 12, color: "from-blue-900/40 to-blue-800/30", textColor: "text-blue-200" },
    { name: "Basement", top: 86, height: 14, color: "from-slate-800/60 to-slate-900/50", textColor: "text-slate-400" },
  ];

  const selectedWell = activeWell ? wells.find((w) => w.id === activeWell) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Interactive Cross-Section</h4>
          <p className="text-sm text-muted-foreground">Click on wells to see detailed information</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Producing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Injector</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span>Planned</span>
          </div>
        </div>
      </div>

      <div className="relative h-[500px] rounded-lg border border-border/50">
        {/* Label overlay (not clipped) */}
        <div className="pointer-events-none absolute inset-x-0 top-3 z-30">
          {wells.map((well) => {
            const showLabel = hoveredWell === well.id || activeWell === well.id;
            return (
              <div
                key={well.id}
                className="absolute"
                style={{ left: `${well.x}%`, transform: "translateX(-50%)" }}
              >
                <div
                  className={cn(
                    "rounded-md border border-border bg-background/95 px-2 py-1 text-xs shadow-lg transition-all",
                    showLabel ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                  )}
                >
                  <p className="font-semibold leading-tight">{well.name}</p>
                  <p className="text-muted-foreground leading-tight">TD: {well.depth}m</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clipped plot area (keeps rounded corners) */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          {/* Geological layers */}
          {layers.map((layer) => (
            <div
              key={layer.name}
              className={cn(
                "absolute left-0 right-0 bg-gradient-to-b transition-all duration-300",
                layer.color,
                layer.isReservoir && "border-y border-primary/30"
              )}
              style={{ top: `${layer.top}%`, height: `${layer.height}%` }}
            >
              <span
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium",
                  layer.textColor
                )}
              >
                {layer.name}
              </span>
              {layer.isReservoir && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-success/20 text-success px-2 py-0.5 rounded">
                  Target Zone
                </span>
              )}
            </div>
          ))}

          {/* Wells */}
          {wells.map((well) => (
            <div
              key={well.id}
              className="absolute top-0 bottom-0 cursor-pointer"
              style={{ left: `${well.x}%` }}
              onMouseEnter={() => setHoveredWell(well.id)}
              onMouseLeave={() => setHoveredWell((prev) => (prev === well.id ? null : prev))}
              onClick={() => setActiveWell(activeWell === well.id ? null : well.id)}
            >
              {/* Well casing */}
              <div
                className={cn(
                  "absolute w-1 transition-all duration-300",
                  well.status === "producing" && "bg-success/70 shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                  well.status === "injector" && "bg-blue-500/70 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                  well.status === "planned" &&
                    "bg-muted-foreground/50 border border-dashed border-muted-foreground",
                  activeWell === well.id && "w-1.5"
                )}
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  top: "0%",
                  height: "80%",
                }}
              />

              {/* Well head */}
              <div
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-4 rounded-full transition-transform",
                  well.status === "producing" && "bg-success animate-pulse",
                  well.status === "injector" && "bg-blue-500",
                  well.status === "planned" &&
                    "bg-muted-foreground/50 border-2 border-dashed border-muted-foreground",
                  activeWell === well.id && "scale-125"
                )}
                style={{ top: "0%" }}
              />

              {/* Perforation zone */}
              {well.status !== "planned" && (
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 w-3",
                    well.status === "producing" ? "bg-success/50" : "bg-blue-500/50"
                  )}
                  style={{
                    top: "45%",
                    height: "20%",
                    borderRadius: "2px",
                  }}
                >
                  {/* Perforation marks */}
                  {[0, 25, 50, 75, 100].map((pos) => (
                    <div
                      key={pos}
                      className="absolute w-full h-0.5 bg-current opacity-50"
                      style={{ top: `${pos}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Depth scale */}
          <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-2 text-[10px] text-muted-foreground">
            <span>0m</span>
            <span>1000m</span>
            <span>2000m</span>
            <span>3000m</span>
            <span>4000m</span>
          </div>
        </div>
      </div>

      {/* Selected well details - enlarged panel with scroll */}
      {activeWell && (
        <div className="mt-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border-2 border-primary/30 shadow-lg animate-in fade-in slide-in-from-top-2">
          <ScrollArea className="h-[300px]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full",
                     selectedWell?.status === "producing" && "bg-success animate-pulse",
                     selectedWell?.status === "injector" && "bg-blue-500",
                     selectedWell?.status === "planned" && "bg-muted-foreground"
                  )} />
                  <h5 className="text-2xl font-bold">{selectedWell?.name}</h5>
                </div>
                <span className={cn(
                  "text-sm font-medium px-4 py-2 rounded-full",
                  selectedWell?.status === "producing" && "bg-success/20 text-success border border-success/30",
                  selectedWell?.status === "injector" && "bg-blue-500/20 text-blue-500 border border-blue-500/30",
                  selectedWell?.status === "planned" && "bg-muted text-muted-foreground border border-muted-foreground/30"
                )}>
                  {selectedWell?.status?.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-5 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-muted-foreground text-sm mb-2">Total Depth</p>
                  <p className="text-3xl font-bold text-primary">{selectedWell?.depth}m</p>
                </div>
                <div className="p-5 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-muted-foreground text-sm mb-2">Top Reservoir</p>
                  <p className="text-3xl font-bold text-primary">2,850m</p>
                </div>
                <div className="p-5 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-muted-foreground text-sm mb-2">Net Pay</p>
                  <p className="text-3xl font-bold text-success">45m</p>
                </div>
                <div className="p-5 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-muted-foreground text-sm mb-2">Production</p>
                  <p className="text-3xl font-bold text-accent">450 bbl/d</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                  <p className="text-muted-foreground text-xs mb-1">Perforations</p>
                  <p className="text-lg font-semibold">2,850 - 2,895m</p>
                </div>
                <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                  <p className="text-muted-foreground text-xs mb-1">Water Cut</p>
                  <p className="text-lg font-semibold text-blue-400">12%</p>
                </div>
                <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                  <p className="text-muted-foreground text-xs mb-1">GOR</p>
                  <p className="text-lg font-semibold">150 scf/bbl</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                  <p className="text-muted-foreground text-xs mb-1">Formation</p>
                  <p className="text-lg font-semibold">Sandstone A</p>
                </div>
                <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                  <p className="text-muted-foreground text-xs mb-1">Porosity</p>
                  <p className="text-lg font-semibold text-primary">18.5%</p>
                </div>
                <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                  <p className="text-muted-foreground text-xs mb-1">Permeability</p>
                  <p className="text-lg font-semibold">245 mD</p>
                </div>
                <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                  <p className="text-muted-foreground text-xs mb-1">Sw</p>
                  <p className="text-lg font-semibold text-blue-400">22%</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default CrossSectionVisualization;
