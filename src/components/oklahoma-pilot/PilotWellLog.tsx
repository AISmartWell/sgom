import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ChevronDown, ChevronUp, Target, Zap } from "lucide-react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

interface PayZone {
  top: number;
  bottom: number;
  name: string;
  porosity: number;
  sw: number;
  permeability: number;
  status: "productive" | "missed" | "water";
}

interface PilotWellLogProps {
  wellName: string;
  totalDepth: number | null;
  waterCut: number | null;
  productionOil: number | null;
  formation: string | null;
  defaultExpanded?: boolean;
}

/**
 * Generates synthetic well log data & pay zones based on actual well parameters.
 * SPT technicians use this to identify perforation targets.
 */
const generateWellLogData = (
  totalDepth: number,
  waterCut: number,
  productionOil: number
) => {
  const baseDepth = Math.max(1500, totalDepth - 600);
  const numPoints = 60;
  const step = 600 / numPoints;

  // Generate 2–4 pay zones dynamically based on well parameters
  const zoneCount = productionOil > 15 ? 2 : waterCut > 50 ? 3 : 4;
  const zones: PayZone[] = [];
  const zoneSpacing = 600 / (zoneCount + 1);

  for (let z = 0; z < zoneCount; z++) {
    const center = baseDepth + zoneSpacing * (z + 1);
    const thickness = 15 + Math.random() * 35;
    const isWater = z === zoneCount - 1 && waterCut > 40;
    const isMissed = z === zoneCount - 2 && productionOil < 10;

    zones.push({
      top: Math.round(center - thickness / 2),
      bottom: Math.round(center + thickness / 2),
      name: `Zone ${String.fromCharCode(65 + z)}${isMissed ? " — Missed Pay" : isWater ? " — Water" : " — Pay"}`,
      porosity: isWater ? 18 + Math.random() * 5 : 12 + Math.random() * 14,
      sw: isWater ? 70 + Math.random() * 20 : isMissed ? 30 + Math.random() * 15 : 15 + Math.random() * 25,
      permeability: isWater ? 150 + Math.random() * 100 : 50 + Math.random() * 300,
      status: isWater ? "water" : isMissed ? "missed" : "productive",
    });
  }

  const data = [];
  for (let i = 0; i < numPoints; i++) {
    const depth = Math.round(baseDepth + i * step);

    const inZone = zones.find((z) => depth >= z.top && depth <= z.bottom);
    const isWater = inZone?.status === "water";

    const baseGR = inZone ? 20 + Math.random() * 15 : 75 + Math.random() * 25;
    const baseRes = isWater ? 2 + Math.random() * 3 : inZone ? 40 + Math.random() * 40 : 3 + Math.random() * 4;
    const basePor = inZone ? inZone.porosity + (Math.random() * 4 - 2) : 4 + Math.random() * 5;
    const baseSw = inZone ? inZone.sw + (Math.random() * 10 - 5) : 90 + Math.random() * 10;

    data.push({
      depth,
      gammaRay: Math.max(0, baseGR),
      resistivity: Math.max(0.5, baseRes),
      porosity: Math.max(0, Math.min(40, basePor)),
      waterSat: Math.max(0, Math.min(100, baseSw)),
    });
  }

  return { data, zones };
};

const PilotWellLog = ({ wellName, totalDepth, waterCut, productionOil, formation, defaultExpanded = false }: PilotWellLogProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const depth = totalDepth || 3000 + Math.random() * 1000;
  const wc = waterCut ?? 30;
  const oil = productionOil ?? 10;

  const { data, zones } = useMemo(
    () => generateWellLogData(depth, wc, oil),
    [depth, wc, oil]
  );

  const productiveZones = zones.filter((z) => z.status === "productive");
  const missedZones = zones.filter((z) => z.status === "missed");
  const waterZones = zones.filter((z) => z.status === "water");

  const totalPayThickness = zones
    .filter((z) => z.status !== "water")
    .reduce((sum, z) => sum + (z.bottom - z.top), 0);

  const bestZone = [...zones]
    .filter((z) => z.status !== "water")
    .sort((a, b) => b.permeability - a.permeability)[0];

  const getZoneColor = (status: PayZone["status"]) => {
    switch (status) {
      case "productive": return "hsl(var(--success))";
      case "missed": return "hsl(var(--warning))";
      case "water": return "hsl(var(--primary))";
    }
  };

  return (
    <div className="mt-3 border border-border/50 rounded-lg overflow-hidden">
      {/* Compact header — always visible */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-xs">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">Well Log</span>
          <span className="text-muted-foreground">
            {zones.length} zones · {totalPayThickness.toFixed(0)}ft pay
          </span>
          {missedZones.length > 0 && (
            <Badge variant="outline" className="text-[9px] h-4 text-warning border-warning/50">
              {missedZones.length} missed
            </Badge>
          )}
          {bestZone && (
            <Badge variant="outline" className="text-[9px] h-4 text-success border-success/50">
              Best: {bestZone.permeability.toFixed(0)} mD
            </Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Log chart */}
          <div className="h-[280px] bg-background/50 rounded border border-border/30 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                layout="vertical"
                data={data}
                margin={{ top: 5, right: 15, left: 45, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={9} domain={[0, 120]} />
                <YAxis
                  dataKey="depth"
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={9}
                  reversed
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) => `${v}'`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border border-border rounded p-2 text-xs shadow-lg">
                        <p className="font-medium mb-1">Depth: {label}ft</p>
                        {payload.map((e: any, i: number) => (
                          <p key={i} style={{ color: e.color }}>
                            {e.name}: {typeof e.value === "number" ? e.value.toFixed(1) : e.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />

                {/* Pay zone highlights */}
                {zones.map((zone) => (
                  <ReferenceArea
                    key={zone.name}
                    y1={zone.top}
                    y2={zone.bottom}
                    fill={getZoneColor(zone.status)}
                    fillOpacity={0.12}
                    stroke={getZoneColor(zone.status)}
                    strokeDasharray={zone.status === "missed" ? "6 3" : "3 3"}
                    strokeWidth={zone.status === "missed" ? 2 : 1}
                  />
                ))}

                <Line type="monotone" dataKey="gammaRay" stroke="#eab308" strokeWidth={1.5} dot={false} name="GR (API)" />
                <Area type="monotone" dataKey="porosity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Porosity (%)" />
                <Line type="monotone" dataKey="resistivity" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Res (Ω·m)" />
                <Area type="monotone" dataKey="waterSat" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.08} name="Sw (%)" strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 inline-block" /> GR</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500/30 border border-blue-500 inline-block" /> Porosity</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Resistivity</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-500 inline-block" /> Sw</span>
          </div>

          {/* Zones table */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-primary" />
              Formation Zones — SPT Target Assessment
            </p>
            {zones.map((zone) => (
              <div
                key={zone.name}
                className={`flex items-center justify-between p-2 rounded text-[11px] border ${
                  zone.status === "productive"
                    ? "border-success/30 bg-success/5"
                    : zone.status === "missed"
                    ? "border-warning/30 bg-warning/5"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[9px] h-4 ${
                      zone.status === "productive"
                        ? "text-success border-success/50"
                        : zone.status === "missed"
                        ? "text-warning border-warning/50"
                        : "text-primary border-primary/50"
                    }`}
                  >
                    {zone.status === "productive" ? "✅ Pay" : zone.status === "missed" ? "⚠️ Missed" : "💧 Water"}
                  </Badge>
                  <span className="font-medium">{zone.name}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{zone.top}–{zone.bottom}ft</span>
                  <span>φ {zone.porosity.toFixed(1)}%</span>
                  <span>Sw {zone.sw.toFixed(0)}%</span>
                  <span className="font-medium text-foreground">{zone.permeability.toFixed(0)} mD</span>
                </div>
              </div>
            ))}
          </div>

          {/* SPT recommendation */}
          {bestZone && (
            <div className="p-2 bg-success/5 border border-success/30 rounded text-xs space-y-1">
              <p className="font-medium text-success flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                SPT Perforation Target
              </p>
              <p className="text-muted-foreground">
                Recommended: <span className="text-foreground font-medium">{bestZone.name}</span> ({bestZone.top}–{bestZone.bottom}ft) — 
                Porosity {bestZone.porosity.toFixed(1)}%, Permeability {bestZone.permeability.toFixed(0)} mD, Sw {bestZone.sw.toFixed(0)}%
                {formation && <> · Formation: <span className="text-foreground">{formation}</span></>}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PilotWellLog;
