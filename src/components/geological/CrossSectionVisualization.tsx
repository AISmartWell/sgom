import { useState } from "react";
import { cn } from "@/lib/utils";

const CrossSectionVisualization = () => {
  const [activeWell, setActiveWell] = useState<number | null>(null);

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

      <div className="relative h-72 rounded-lg overflow-hidden border border-border/50">
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
            <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium", layer.textColor)}>
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
            className="absolute top-0 bottom-0 cursor-pointer group"
            style={{ left: `${well.x}%` }}
            onClick={() => setActiveWell(activeWell === well.id ? null : well.id)}
          >
            {/* Well casing */}
            <div
              className={cn(
                "absolute w-1 transition-all duration-300",
                well.status === "producing" && "bg-success/70 shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                well.status === "injector" && "bg-blue-500/70 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                well.status === "planned" && "bg-muted-foreground/50 border border-dashed border-muted-foreground",
                activeWell === well.id && "w-1.5"
              )}
              style={{ 
                left: "50%", 
                transform: "translateX(-50%)",
                top: "0%",
                height: "80%"
              }}
            />
            
            {/* Well head */}
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-4 rounded-full transition-transform",
                well.status === "producing" && "bg-success animate-pulse",
                well.status === "injector" && "bg-blue-500",
                well.status === "planned" && "bg-muted-foreground/50 border-2 border-dashed border-muted-foreground",
                activeWell === well.id && "scale-125"
              )}
              style={{ top: "0%" }}
            />

            {/* Well label */}
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all",
                "bg-background/90 border border-border shadow-lg",
                activeWell === well.id ? "opacity-100 -top-10" : "opacity-0 group-hover:opacity-100 -top-8"
              )}
            >
              <p className="font-semibold">{well.name}</p>
              <p className="text-muted-foreground">TD: {well.depth}m</p>
            </div>

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
                  borderRadius: "2px"
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

      {/* Selected well details */}
      {activeWell && (
        <div className="p-4 bg-muted/30 rounded-lg border border-border/50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold">{wells.find(w => w.id === activeWell)?.name}</h5>
            <span className={cn(
              "text-xs px-2 py-1 rounded",
              wells.find(w => w.id === activeWell)?.status === "producing" && "bg-success/20 text-success",
              wells.find(w => w.id === activeWell)?.status === "injector" && "bg-blue-500/20 text-blue-500",
              wells.find(w => w.id === activeWell)?.status === "planned" && "bg-muted text-muted-foreground"
            )}>
              {wells.find(w => w.id === activeWell)?.status}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Total Depth</p>
              <p className="font-medium">{wells.find(w => w.id === activeWell)?.depth}m</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Top Reservoir</p>
              <p className="font-medium">2,850m</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Net Pay</p>
              <p className="font-medium">45m</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Production</p>
              <p className="font-medium">450 bbl/d</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossSectionVisualization;
