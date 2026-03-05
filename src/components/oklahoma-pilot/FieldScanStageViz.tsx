import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Layers, Activity, Thermometer } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

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

interface FieldScanStageVizProps {
  well: WellRecord;
  allWells: WellRecord[];
}

/* ── Basin metadata lookup ─────────────────────────────────── */
const BASIN_DATA: Record<string, {
  name: string;
  avgDepth: string;
  formations: string[];
  area: string;
  age: string;
}> = {
  OK: {
    name: "Anadarko Basin",
    avgDepth: "3,000–15,000 ft",
    formations: ["Woodford Shale", "Hunton Limestone", "Mississippian Lime", "Red Fork Sandstone"],
    area: "~58,000 mi²",
    age: "Late Cambrian – Permian",
  },
  TX: {
    name: "Permian Basin",
    avgDepth: "4,000–18,000 ft",
    formations: ["Wolfcamp", "Spraberry", "Bone Spring", "Delaware Sandstone"],
    area: "~86,000 mi²",
    age: "Permian (~299–252 Ma)",
  },
  NM: {
    name: "Delaware Basin",
    avgDepth: "5,000–16,000 ft",
    formations: ["Bone Spring", "Wolfcamp", "Avalon Shale"],
    area: "~10,000 mi²",
    age: "Permian",
  },
};

/* ── Helpers ─────────────────────────────────────────────── */
const normalize = (val: number, min: number, max: number) =>
  Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

const FieldScanStageViz = ({ well, allWells }: FieldScanStageVizProps) => {
  const basin = BASIN_DATA[well.state] || BASIN_DATA["OK"];

  /* ── Radar chart data ──────────────────────────────────── */
  const radarData = useMemo(() => {
    const oil = well.production_oil ?? 0;
    const wc = well.water_cut ?? 0;
    const depth = well.total_depth ?? 3000;

    return [
      { axis: "Дебит нефти", value: normalize(oil, 0, 30), fullMark: 100 },
      { axis: "Обводнённость", value: 100 - normalize(wc, 0, 100), fullMark: 100 }, // inverted — lower WC = better
      { axis: "Глубина", value: normalize(depth, 1000, 8000), fullMark: 100 },
      { axis: "Формация", value: well.formation ? 80 : 30, fullMark: 100 },
      { axis: "Статус", value: well.status === "Active" ? 90 : 40, fullMark: 100 },
      { axis: "Газ/Нефть", value: normalize(well.production_gas ?? 0, 0, 200), fullMark: 100 },
    ];
  }, [well]);

  /* ── Neighbor heatmap (same county) ────────────────────── */
  const neighborStats = useMemo(() => {
    const countyWells = allWells.filter(
      (w) => w.county === well.county && w.id !== well.id
    );

    if (countyWells.length === 0) return null;

    // Group into a 4×4 grid by oil/WC quartiles for visual heat
    const grid: { oil: number; wc: number; count: number; intensity: number }[][] = [];
    const oilBins = [0, 5, 10, 20, 50];
    const wcBins = [0, 20, 40, 60, 100];

    for (let r = 0; r < 4; r++) {
      grid[r] = [];
      for (let c = 0; c < 4; c++) {
        const matches = countyWells.filter((w) => {
          const o = w.production_oil ?? 0;
          const wc2 = w.water_cut ?? 0;
          return o >= oilBins[c] && o < oilBins[c + 1] && wc2 >= wcBins[r] && wc2 < wcBins[r + 1];
        });
        grid[r][c] = {
          oil: oilBins[c],
          wc: wcBins[r],
          count: matches.length,
          intensity: Math.min(1, matches.length / Math.max(1, countyWells.length / 4)),
        };
      }
    }

    const avgOil = countyWells.reduce((s, w) => s + (w.production_oil ?? 0), 0) / countyWells.length;
    const avgWC = countyWells.reduce((s, w) => s + (w.water_cut ?? 0), 0) / countyWells.length;

    return { grid, total: countyWells.length, avgOil, avgWC };
  }, [well, allWells]);

  const getHeatColor = (intensity: number, count: number) => {
    if (count === 0) return "bg-muted/20";
    if (intensity > 0.6) return "bg-red-500/60";
    if (intensity > 0.3) return "bg-amber-500/50";
    if (intensity > 0.1) return "bg-emerald-500/40";
    return "bg-emerald-500/20";
  };

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* ── 1. Basin Info Card ──────────────────────────── */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Layers className="h-3.5 w-3.5 text-primary" />
          {basin.name}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <p className="text-muted-foreground">Площадь</p>
            <p className="font-medium">{basin.area}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ср. глубина</p>
            <p className="font-medium">{basin.avgDepth}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Возраст</p>
            <p className="font-medium">{basin.age}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Округ</p>
            <p className="font-medium">{well.county || "—"}</p>
          </div>
        </div>
        <div className="pt-1 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground mb-1">Типичные формации</p>
          <div className="flex flex-wrap gap-1">
            {basin.formations.map((f) => (
              <Badge
                key={f}
                variant="outline"
                className={`text-[9px] h-4 ${
                  well.formation && f.toLowerCase().includes(well.formation.toLowerCase().split(" ")[0])
                    ? "text-success border-success/50 bg-success/10"
                    : "text-muted-foreground"
                }`}
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Radar Chart — Suitability Profile ───────── */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10">
        <div className="flex items-center gap-2 text-xs font-semibold mb-1">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Профиль пригодности
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis tick={false} domain={[0, 100]} axisLine={false} />
              <Radar
                name="Скважина"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 3. Mini-map placeholder (satellite thumbnail) ─ */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Локация скважины
        </div>
        {well.latitude && well.longitude ? (
          <div className="relative overflow-hidden rounded-md border border-border/30">
            <img
              src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${
                well.longitude - 0.05
              },${well.latitude - 0.03},${well.longitude + 0.05},${
                well.latitude + 0.03
              }&size=400,220&format=jpg&f=image`}
              alt={`Satellite view of ${well.well_name || "well"}`}
              className="w-full h-[140px] object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary/30 shadow-lg shadow-primary/40" />
            </div>
            <div className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {well.latitude.toFixed(4)}°N, {well.longitude.toFixed(4)}°W
            </div>
          </div>
        ) : (
          <div className="h-[140px] bg-muted/30 rounded-md flex items-center justify-center text-xs text-muted-foreground">
            Координаты недоступны
          </div>
        )}
      </div>

      {/* ── 4. Neighbor Heatmap ──────────────────────────── */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Thermometer className="h-3.5 w-3.5 text-primary" />
          Тепловая карта округа
          {neighborStats && (
            <span className="text-muted-foreground font-normal">
              · {neighborStats.total} соседей
            </span>
          )}
        </div>
        {neighborStats ? (
          <>
            <div className="grid grid-cols-4 gap-0.5">
              {neighborStats.grid.map((row, ri) =>
                row.map((cell, ci) => (
                  <div
                    key={`${ri}-${ci}`}
                    className={`aspect-square rounded-sm ${getHeatColor(cell.intensity, cell.count)} flex items-center justify-center text-[9px] font-medium transition-colors`}
                    title={`Oil: ${cell.oil}–${[5, 10, 20, 50][ci]} bbl/d | WC: ${cell.wc}–${[20, 40, 60, 100][ri]}% | ${cell.count} wells`}
                  >
                    {cell.count > 0 ? cell.count : ""}
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between text-[9px] text-muted-foreground">
              <span>Oil →  0–50 bbl/d</span>
              <span>WC ↓  0–100%</span>
            </div>
            <div className="flex gap-3 text-[10px]">
              <span>Ср. дебит: <span className="font-medium text-foreground">{neighborStats.avgOil.toFixed(1)} bbl/d</span></span>
              <span>Ср. WC: <span className="font-medium text-foreground">{neighborStats.avgWC.toFixed(0)}%</span></span>
            </div>
          </>
        ) : (
          <div className="h-[120px] bg-muted/30 rounded-md flex items-center justify-center text-xs text-muted-foreground">
            Нет данных о соседних скважинах
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldScanStageViz;
