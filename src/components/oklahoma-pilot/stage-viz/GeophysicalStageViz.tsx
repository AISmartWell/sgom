import { useMemo } from "react";
import { Waves, Layers, Activity, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWellLogs } from "@/hooks/useWellLogs";

interface WellRecord {
  id?: string;
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

const FORMATION_DB: Record<string, FormationProps> = {
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
  wolfcamp:      { lithology: "Calcareous Mudstone",  phiMin: 3,  phiMax: 10, kMin: 0.0001,   kMax: 0.5,    color: "bg-slate-600" },
  spraberry:     { lithology: "Silty Carbonate",      phiMin: 7,  phiMax: 14, kMin: 0.1,      kMax: 10,     color: "bg-indigo-700" },
  "bone spring": { lithology: "Interbedded Limestone",phiMin: 4,  phiMax: 12, kMin: 0.001,    kMax: 1,      color: "bg-teal-700" },
  delaware:      { lithology: "Turbidite Sandstone",  phiMin: 12, phiMax: 22, kMin: 1,        kMax: 200,    color: "bg-emerald-700" },
  "san andres":  { lithology: "Dolomite",             phiMin: 5,  phiMax: 15, kMin: 0.5,      kMax: 50,     color: "bg-rose-700" },
  dean:          { lithology: "Tight Sandstone",      phiMin: 5,  phiMax: 12, kMin: 0.01,     kMax: 5,      color: "bg-neutral-600" },
  cline:         { lithology: "Organic Shale",        phiMin: 2,  phiMax: 8,  kMin: 0.00001,  kMax: 0.1,    color: "bg-zinc-700" },
  avalon:        { lithology: "Siliceous Shale",      phiMin: 3,  phiMax: 10, kMin: 0.0001,   kMax: 0.5,    color: "bg-purple-700" },
  // East Texas formations
  rodessa:       { lithology: "Limestone/Dolomite",   phiMin: 8,  phiMax: 22, kMin: 0.5,      kMax: 80,     color: "bg-amber-600" },
  "james lime":  { lithology: "Limestone",            phiMin: 6,  phiMax: 18, kMin: 0.1,      kMax: 50,     color: "bg-sky-700" },
  "upper carlisle": { lithology: "Limestone",         phiMin: 5,  phiMax: 15, kMin: 0.2,      kMax: 40,     color: "bg-cyan-600" },
  travis_peak:   { lithology: "Tight Sandstone",      phiMin: 4,  phiMax: 12, kMin: 0.01,     kMax: 5,      color: "bg-orange-600" },
  cotton_valley: { lithology: "Tight Sandstone",      phiMin: 3,  phiMax: 10, kMin: 0.001,    kMax: 2,      color: "bg-red-800" },
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
  const { data: realLogs, isLoading, hasRealData } = useWellLogs(well.id);

  // Build log strips from real data or synthetic
  const logStrips = useMemo(() => {
    if (hasRealData && realLogs) {
      return realLogs.map((p) => ({
        depth: Math.round(p.measured_depth),
        gr: p.gamma_ray ?? 50,
        res: p.resistivity ?? 5,
        por: p.porosity ?? 5,
      }));
    }
    // Synthetic fallback
    const segments = 20;
    const strips = [];
    for (let i = 0; i < segments; i++) {
      const d = (depth / segments) * i;
      const gr = 40 + Math.sin(i * 0.7) * 30 + Math.random() * 20;
      const res = 5 + Math.cos(i * 0.5) * 15 + Math.random() * 10;
      const por = 8 + Math.sin(i * 0.3 + 1) * 8 + Math.random() * 4;
      strips.push({ depth: Math.round(d), gr: +gr.toFixed(1), res: +res.toFixed(1), por: +por.toFixed(1) });
    }
    return strips;
  }, [hasRealData, realLogs, depth]);

  const formProp = lookupFormation(well.formation || "");

  // Build stratigraphic column — real data uses actual depth markers
  const stratigraphicColumn = useMemo(() => {
    if (hasRealData && realLogs && realLogs.length > 3) {
      // Detect pay zone from porosity peak
      const maxPor = Math.max(...realLogs.map((p) => p.porosity ?? 0));
      const payIdx = realLogs.findIndex((p) => (p.porosity ?? 0) === maxPor);
      const payTop = payIdx > 0 ? realLogs[Math.max(0, payIdx - 1)].measured_depth : realLogs[payIdx].measured_depth;
      const payBot = payIdx < realLogs.length - 1 ? realLogs[Math.min(realLogs.length - 1, payIdx + 1)].measured_depth : realLogs[payIdx].measured_depth;
      
      const layers = [];
      if (payTop > 500) {
        layers.push({ name: "Overburden", from: 0, to: Math.round(payTop * 0.3), color: "bg-amber-400/60" });
        layers.push({ name: "Shale/Marl", from: Math.round(payTop * 0.3), to: Math.round(payTop * 0.7), color: "bg-gray-500/60" });
        layers.push({ name: "Transition", from: Math.round(payTop * 0.7), to: Math.round(payTop), color: "bg-blue-600/60" });
      }
      layers.push({ name: well.formation || "Target Zone", from: Math.round(payTop), to: Math.round(payBot), color: "bg-success/50" });
      if (payBot < depth) {
        layers.push({ name: "Sub-pay", from: Math.round(payBot), to: Math.round(depth), color: "bg-red-900/60" });
      }
      return layers;
    }
    // Synthetic fallback
    return [
      { name: "Surface/Alluvium", from: 0, to: Math.round(depth * 0.05), color: "bg-amber-400/60" },
      { name: "Shale (cap)", from: Math.round(depth * 0.05), to: Math.round(depth * 0.2), color: "bg-gray-500/60" },
      { name: "Limestone", from: Math.round(depth * 0.2), to: Math.round(depth * 0.45), color: "bg-blue-600/60" },
      { name: well.formation || "Target Zone", from: Math.round(depth * 0.45), to: Math.round(depth * 0.65), color: "bg-success/50" },
      { name: "Sandstone", from: Math.round(depth * 0.65), to: Math.round(depth * 0.85), color: "bg-yellow-600/60" },
      { name: "Basement", from: Math.round(depth * 0.85), to: depth, color: "bg-red-900/60" },
    ];
  }, [hasRealData, realLogs, depth, well.formation]);

  // Compute real log stats for properties panel
  const logStats = useMemo(() => {
    if (!hasRealData || !realLogs) return null;
    const porosities = realLogs.map((p) => p.porosity ?? 0).filter(Boolean);
    const resistivities = realLogs.map((p) => p.resistivity ?? 0).filter(Boolean);
    const gammas = realLogs.map((p) => p.gamma_ray ?? 0).filter(Boolean);
    return {
      avgPorosity: porosities.reduce((a, b) => a + b, 0) / porosities.length,
      maxPorosity: Math.max(...porosities),
      avgResistivity: resistivities.reduce((a, b) => a + b, 0) / resistivities.length,
      maxResistivity: Math.max(...resistivities),
      avgGR: gammas.reduce((a, b) => a + b, 0) / gammas.length,
      depthRange: `${realLogs[0].measured_depth}–${realLogs[realLogs.length - 1].measured_depth}`,
      pointCount: realLogs.length,
    };
  }, [hasRealData, realLogs]);

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Mini Well Log */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
          <Activity className="h-3.5 w-3.5 text-primary" />
          {hasRealData ? (
            <>
              Well Log ({logStrips.length} pts)
              <Badge variant="outline" className="text-[9px] text-success border-success/30">
                <Database className="h-2.5 w-2.5 mr-0.5" />REAL DATA
              </Badge>
            </>
          ) : (
            <>
              Synthetic Log Preview
              <Badge variant="outline" className="text-[9px] text-warning border-warning/30">SYNTHETIC</Badge>
            </>
          )}
          {isLoading && <span className="text-muted-foreground animate-pulse text-[9px]">Loading...</span>}
        </div>
        <div className="flex gap-1 h-[220px]">
          {/* SVG Log Track renderer */}
          {([
            { key: "gr" as const, label: "GR (API)", color: "hsl(var(--chart-3))", minV: 0, maxV: 150, unit: "API" },
            { key: "res" as const, label: "Res (Ωm)", color: "hsl(var(--chart-1))", minV: 0, maxV: 60, unit: "Ωm" },
            { key: "por" as const, label: "φ (%)", color: "hsl(var(--chart-5))", minV: 0, maxV: 30, unit: "%" },
          ] as const).map((track) => {
            const vals = logStrips.map((s) => s[track.key]);
            const trackMin = Math.min(track.minV, ...vals);
            const trackMax = Math.max(track.maxV, ...vals);
            const range = trackMax - trackMin || 1;
            const w = 100;
            const h = 200;
            const points = logStrips.map((s, i) => {
              const x = ((s[track.key] - trackMin) / range) * (w - 4) + 2;
              const y = (i / Math.max(logStrips.length - 1, 1)) * (h - 4) + 2;
              return `${x},${y}`;
            });
            const fillPoints = [`2,2`, ...points, `2,${h - 2}`].join(" ");
            return (
              <div key={track.key} className="flex-1 flex flex-col bg-muted/20 rounded overflow-hidden">
                <p className="text-[7px] text-center text-muted-foreground py-0.5 shrink-0">{track.label}</p>
                <svg viewBox={`0 0 ${w} ${h}`} className="flex-1 w-full" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line key={f} x1={f * w} y1={0} x2={f * w} y2={h}
                      stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2,2" opacity={0.3} />
                  ))}
                  {/* Fill area */}
                  <polygon points={fillPoints} fill={track.color} opacity={0.15} />
                  {/* Curve line */}
                  <polyline
                    points={points.join(" ")}
                    fill="none"
                    stroke={track.color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Data points */}
                  {logStrips.map((s, i) => {
                    const x = ((s[track.key] - trackMin) / range) * (w - 4) + 2;
                    const y = (i / Math.max(logStrips.length - 1, 1)) * (h - 4) + 2;
                    return (
                      <circle key={i} cx={x} cy={y} r="1.5" fill={track.color} opacity={0.8}>
                        <title>{`${s.depth} ft — ${track.label}: ${s[track.key]} ${track.unit}`}</title>
                      </circle>
                    );
                  })}
                </svg>
                <div className="flex justify-between text-[6px] text-muted-foreground px-1 py-0.5 shrink-0">
                  <span>{Math.round(trackMin)}</span>
                  <span>{Math.round(trackMax)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
          <span>{hasRealData && realLogs ? `${realLogs[0].measured_depth} ft` : "0 ft"}</span>
          <span>{hasRealData && realLogs ? `${realLogs[realLogs.length - 1].measured_depth} ft` : `${depth.toLocaleString()} ft`}</span>
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
            const totalDepth = stratigraphicColumn[stratigraphicColumn.length - 1]?.to || depth;
            const heightPct = ((layer.to - layer.from) / totalDepth) * 100;
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
          {hasRealData ? "Log Statistics" : "Formation Properties"}
        </div>
        {hasRealData && logStats ? (
          <div className="space-y-1.5">
            <div className="p-2 bg-muted/20 rounded">
              <p className="text-[9px] text-muted-foreground">Avg Porosity</p>
              <p className="text-xs font-medium">{logStats.avgPorosity.toFixed(1)}% (max {logStats.maxPorosity.toFixed(1)}%)</p>
            </div>
            <div className="p-2 bg-muted/20 rounded">
              <p className="text-[9px] text-muted-foreground">Avg Resistivity</p>
              <p className="text-xs font-medium">{logStats.avgResistivity.toFixed(1)} Ωm (max {logStats.maxResistivity.toFixed(1)})</p>
            </div>
            <div className="p-2 bg-muted/20 rounded">
              <p className="text-[9px] text-muted-foreground">Avg Gamma Ray</p>
              <p className="text-xs font-medium">{logStats.avgGR.toFixed(1)} API</p>
            </div>
            <div className="p-2 bg-muted/20 rounded">
              <p className="text-[9px] text-muted-foreground">Depth Range</p>
              <p className="text-xs font-medium">{logStats.depthRange} ft ({logStats.pointCount} points)</p>
            </div>
            <Badge variant="outline" className="text-[9px]">
              {well.formation || "Unknown"}
            </Badge>
          </div>
        ) : formProp ? (
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
