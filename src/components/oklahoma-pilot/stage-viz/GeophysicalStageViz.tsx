import { useMemo } from "react";
import { Waves, Layers, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WellRecord {
  formation: string | null;
  total_depth: number | null;
  production_oil: number | null;
  water_cut: number | null;
  well_type: string | null;
}

interface Props {
  well: WellRecord;
}

interface FormationProps {
  lithology: string;
  phiMin: number;
  phiMax: number;
  kMin: number;
  kMax: number;
  color: string;
}

// Synced with analyze-well-stage edge function formation database
const FORMATION_DB: Record<string, FormationProps> = {
  // Oklahoma formations
  woodford:      { lithology: "Organic Shale",        phiMin: 3,  phiMax: 8,  kMin: 0.000001, kMax: 0.01,   color: "bg-gray-600" },
  hunton:        { lithology: "Limestone/Dolomite",   phiMin: 5,  phiMax: 15, kMin: 0.5,      kMax: 50,     color: "bg-amber-700" },
  mississippian: { lithology: "Limestone",            phiMin: 8,  phiMax: 20, kMin: 1,        kMax: 100,    color: "bg-blue-700" },
  "red fork":    { lithology: "Sandstone",            phiMin: 10, phiMax: 20, kMin: 5,        kMax: 300,    color: "bg-yellow-700" },
  chester:       { lithology: "Limestone",            phiMin: 6,  phiMax: 14, kMin: 0.5,      kMax: 30,     color: "bg-cyan-700" },
  morrow:        { lithology: "Sandstone",            phiMin: 8,  phiMax: 18, kMin: 1,        kMax: 150,    color: "bg-orange-700" },
  tonkawa:       { lithology: "Sandstone",            phiMin: 10, phiMax: 20, kMin: 5,        kMax: 250,    color: "bg-yellow-600" },
  simpson:       { lithology: "Sandstone/Limestone",  phiMin: 8,  phiMax: 18, kMin: 1,        kMax: 100,    color: "bg-lime-700" },
  wilcox:        { lithology: "Sandstone",            phiMin: 20, phiMax: 35, kMin: 50,       kMax: 2000,   color: "bg-amber-500" },
  arbuckle:      { lithology: "Dolomite",             phiMin: 3,  phiMax: 12, kMin: 0.1,      kMax: 20,     color: "bg-stone-600" },
  // Permian Basin formations
  wolfcamp:      { lithology: "Calcareous Mudstone",  phiMin: 3,  phiMax: 10, kMin: 0.0001,   kMax: 0.5,    color: "bg-slate-600" },
  spraberry:     { lithology: "Silty Carbonate",      phiMin: 7,  phiMax: 14, kMin: 0.1,      kMax: 10,     color: "bg-indigo-700" },
  "bone spring": { lithology: "Interbedded Limestone",phiMin: 4,  phiMax: 12, kMin: 0.001,    kMax: 1,      color: "bg-teal-700" },
  delaware:      { lithology: "Turbidite Sandstone",  phiMin: 12, phiMax: 22, kMin: 1,        kMax: 200,    color: "bg-emerald-700" },
  "san andres":  { lithology: "Dolomite",             phiMin: 5,  phiMax: 15, kMin: 0.5,      kMax: 50,     color: "bg-rose-700" },
  dean:          { lithology: "Tight Sandstone",      phiMin: 5,  phiMax: 12, kMin: 0.01,     kMax: 5,      color: "bg-neutral-600" },
  cline:         { lithology: "Organic Shale",        phiMin: 2,  phiMax: 8,  kMin: 0.00001,  kMax: 0.1,    color: "bg-zinc-700" },
  avalon:        { lithology: "Siliceous Shale",      phiMin: 3,  phiMax: 10, kMin: 0.0001,   kMax: 0.5,    color: "bg-purple-700" },
};

const formatPermeability = (k: number): string => {
  if (k < 0.001) return `${(k * 1000).toFixed(1)} µD`;
  if (k < 0.1) return `${k.toFixed(4)} mD`;
  if (k < 10) return `${k.toFixed(2)} mD`;
  return `${Math.round(k)} mD`;
};

const lookupFormation = (formation: string): FormationProps | null => {
  const f = (formation || "").toLowerCase();
  for (const [key, props] of Object.entries(FORMATION_DB)) {
    if (f.includes(key)) return props;
  }
  return null;
};

const GeophysicalStageViz = ({ well }: Props) => {
  const depth = well.total_depth ?? 3500;

  // Generate synthetic log strips
  const logStrips = useMemo(() => {
    const segments = 20;
    const strips = [];
    for (let i = 0; i < segments; i++) {
      const d = (depth / segments) * i;
      const gr = 40 + Math.sin(i * 0.7) * 30 + Math.random() * 20; // Gamma Ray
      const res = 5 + Math.cos(i * 0.5) * 15 + Math.random() * 10; // Resistivity
      const por = 8 + Math.sin(i * 0.3 + 1) * 8 + Math.random() * 4; // Porosity
      strips.push({ depth: Math.round(d), gr: +gr.toFixed(1), res: +res.toFixed(1), por: +por.toFixed(1) });
    }
    return strips;
  }, [depth]);

  const formProp = lookupFormation(well.formation || "");

  // Synthetic stratigraphic column
  const stratigraphicColumn = useMemo(() => {
    const layers = [
      { name: "Surface/Alluvium", from: 0, to: Math.round(depth * 0.05), color: "bg-amber-400/60" },
      { name: "Shale (cap)", from: Math.round(depth * 0.05), to: Math.round(depth * 0.2), color: "bg-gray-500/60" },
      { name: "Limestone", from: Math.round(depth * 0.2), to: Math.round(depth * 0.45), color: "bg-blue-600/60" },
      { name: well.formation || "Target Zone", from: Math.round(depth * 0.45), to: Math.round(depth * 0.65), color: "bg-success/50" },
      { name: "Sandstone", from: Math.round(depth * 0.65), to: Math.round(depth * 0.85), color: "bg-yellow-600/60" },
      { name: "Basement", from: Math.round(depth * 0.85), to: depth, color: "bg-red-900/60" },
    ];
    return layers;
  }, [depth, well.formation]);

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Mini Well Log */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Synthetic Log Preview
        </div>
        <div className="flex gap-0.5 h-[200px]">
          {/* GR Track */}
          <div className="flex-1 flex flex-col justify-between relative bg-muted/20 rounded overflow-hidden">
            <p className="text-[7px] text-center text-muted-foreground p-0.5">GR (API)</p>
            {logStrips.map((s, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: `hsl(${120 - s.gr}, 60%, ${30 + s.gr * 0.3}%)`,
                  opacity: 0.7,
                }}
                title={`${s.depth}ft — GR: ${s.gr} API`}
              />
            ))}
          </div>
          {/* Resistivity Track */}
          <div className="flex-1 flex flex-col justify-between relative bg-muted/20 rounded overflow-hidden">
            <p className="text-[7px] text-center text-muted-foreground p-0.5">Res (Ωm)</p>
            {logStrips.map((s, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: `hsl(200, ${Math.min(s.res * 3, 80)}%, ${20 + s.res}%)`,
                  opacity: 0.7,
                }}
                title={`${s.depth}ft — Res: ${s.res} Ωm`}
              />
            ))}
          </div>
          {/* Porosity Track */}
          <div className="flex-1 flex flex-col justify-between relative bg-muted/20 rounded overflow-hidden">
            <p className="text-[7px] text-center text-muted-foreground p-0.5">φ (%)</p>
            {logStrips.map((s, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: `hsl(280, ${Math.min(s.por * 4, 80)}%, ${20 + s.por * 2}%)`,
                  opacity: 0.7,
                }}
                title={`${s.depth}ft — Porosity: ${s.por}%`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[8px] text-muted-foreground">
          <span>0 ft</span>
          <span>{depth.toLocaleString()} ft</span>
        </div>
      </div>

      {/* Stratigraphic Column */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Layers className="h-3.5 w-3.5 text-primary" />
          Stratigraphic Column
        </div>
        <div className="space-y-0.5">
          {stratigraphicColumn.map((layer, i) => {
            const heightPct = ((layer.to - layer.from) / depth) * 100;
            const isTarget = layer.name === (well.formation || "Target Zone");
            return (
              <div
                key={i}
                className={`${layer.color} rounded px-2 py-1 flex justify-between items-center text-[9px] ${isTarget ? "ring-1 ring-success" : ""}`}
                style={{ minHeight: `${Math.max(heightPct * 1.8, 18)}px` }}
              >
                <span className={`font-medium ${isTarget ? "text-success" : ""}`}>
                  {isTarget ? "🎯 " : ""}{layer.name}
                </span>
                <span className="text-muted-foreground">{layer.from.toLocaleString()}–{layer.to.toLocaleString()} ft</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formation Properties */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Waves className="h-3.5 w-3.5 text-primary" />
          Formation Properties
        </div>
        {formProp ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-1.5">
              <div className="p-2 bg-muted/20 rounded">
                <p className="text-[9px] text-muted-foreground">Lithology</p>
                <p className="text-xs font-medium">{formProp.lithology}</p>
              </div>
              <div className="p-2 bg-muted/20 rounded">
                <p className="text-[9px] text-muted-foreground">Porosity Range</p>
                <p className="text-xs font-medium">{formProp.phiMin}–{formProp.phiMax}%</p>
              </div>
              <div className="p-2 bg-muted/20 rounded">
                <p className="text-[9px] text-muted-foreground">Permeability</p>
                <p className="text-xs font-medium">{formatPermeability(formProp.kMin)} – {formatPermeability(formProp.kMax)}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px]">
              {well.formation || "Unknown"}
            </Badge>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-2 bg-muted/20 rounded">
              <p className="text-[9px] text-muted-foreground">Formation</p>
              <p className="text-xs font-medium">{well.formation || "Not specified"}</p>
            </div>
            <div className="p-2 bg-muted/20 rounded">
              <p className="text-[9px] text-muted-foreground">Total Depth</p>
              <p className="text-xs font-medium">{depth.toLocaleString()} ft</p>
            </div>
            <div className="p-2 bg-muted/20 rounded">
              <p className="text-[9px] text-muted-foreground">Well Type</p>
              <p className="text-xs font-medium">{well.well_type || "Oil"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeophysicalStageViz;
