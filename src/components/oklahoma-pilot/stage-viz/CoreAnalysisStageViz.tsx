import { useMemo } from "react";
import { Eye, Gem, Microscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";

interface WellRecord {
  formation: string | null;
  total_depth: number | null;
  water_cut: number | null;
}

interface Props {
  well: WellRecord;
}

const MINERAL_PALETTES: Record<string, { name: string; pct: number; color: string }[]> = {
  shale: [
    { name: "Quartz", pct: 35, color: "#94a3b8" },
    { name: "Clay Minerals", pct: 30, color: "#78716c" },
    { name: "Feldspar", pct: 15, color: "#f59e0b" },
    { name: "Organic Matter", pct: 12, color: "#22c55e" },
    { name: "Pyrite", pct: 8, color: "#eab308" },
  ],
  limestone: [
    { name: "Calcite", pct: 70, color: "#60a5fa" },
    { name: "Dolomite", pct: 12, color: "#a78bfa" },
    { name: "Quartz", pct: 10, color: "#94a3b8" },
    { name: "Clay", pct: 5, color: "#78716c" },
    { name: "Organic", pct: 3, color: "#22c55e" },
  ],
  sandstone: [
    { name: "Quartz", pct: 65, color: "#fbbf24" },
    { name: "Feldspar", pct: 15, color: "#f59e0b" },
    { name: "Rock Fragments", pct: 10, color: "#a3a3a3" },
    { name: "Clay Cement", pct: 7, color: "#78716c" },
    { name: "Ite Oxide", pct: 3, color: "#ef4444" },
  ],
};

const CoreAnalysisStageViz = ({ well }: Props) => {
  const formName = (well.formation || "").toLowerCase();
  const rockType = formName.includes("shale") || formName.includes("woodford")
    ? "shale"
    : formName.includes("sand") || formName.includes("fork") || formName.includes("morrow")
    ? "sandstone"
    : "limestone";

  const minerals = MINERAL_PALETTES[rockType];

  const coreProperties = useMemo(() => {
    const depth = well.total_depth ?? 3500;
    const wc = well.water_cut ?? 30;
    const porosity = rockType === "sandstone" ? 14 + Math.random() * 8 : rockType === "shale" ? 3 + Math.random() * 5 : 8 + Math.random() * 10;
    const permeability = rockType === "sandstone" ? 50 + Math.random() * 200 : rockType === "shale" ? 0.001 + Math.random() * 0.1 : 5 + Math.random() * 50;
    const satOil = 100 - wc - (10 + Math.random() * 10);
    const satWater = wc;
    const satGas = Math.max(0, 100 - satOil - satWater);
    const fractureIndex = Math.random() * 100;

    return {
      porosity: +porosity.toFixed(1),
      permeability: +permeability.toFixed(3),
      satOil: +Math.max(0, satOil).toFixed(1),
      satWater: +satWater.toFixed(1),
      satGas: +satGas.toFixed(1),
      fractureIndex: +fractureIndex.toFixed(0),
      grainSize: rockType === "sandstone" ? "Fine–Medium" : rockType === "shale" ? "Clay/Silt" : "Crystalline",
    };
  }, [well, rockType]);

  // Core quality score
  const qualityScore = useMemo(() => {
    let score = 50;
    if (coreProperties.porosity > 10) score += 15;
    if (coreProperties.permeability > 10) score += 15;
    if (coreProperties.satOil > 30) score += 10;
    if (coreProperties.fractureIndex > 50) score += 10;
    return Math.min(100, score);
  }, [coreProperties]);

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Mineral Composition */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Gem className="h-3.5 w-3.5 text-primary" />
          Mineral Composition
        </div>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={minerals}
                cx="50%" cy="50%"
                innerRadius={30} outerRadius={60}
                paddingAngle={2} dataKey="pct"
                label={({ name, pct }) => `${name}: ${pct}%`}
                labelLine={false}
              >
                {minerals.map((m, i) => (
                  <Cell key={i} fill={m.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "10px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <Badge variant="outline" className="text-[9px]">
          {rockType.charAt(0).toUpperCase() + rockType.slice(1)} — {well.formation || "Unknown Fm."}
        </Badge>
      </div>

      {/* Core Properties */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Microscope className="h-3.5 w-3.5 text-primary" />
          Petrophysical Properties
        </div>
        <div className="space-y-1.5 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Porosity (φ)</span>
            <span className="font-medium">{coreProperties.porosity}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Permeability (k)</span>
            <span className="font-medium">{coreProperties.permeability > 1 ? coreProperties.permeability.toFixed(1) : coreProperties.permeability.toFixed(3)} mD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Grain Size</span>
            <span className="font-medium">{coreProperties.grainSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fracture Index</span>
            <span className={`font-medium ${coreProperties.fractureIndex > 50 ? "text-warning" : ""}`}>{coreProperties.fractureIndex}/100</span>
          </div>
          <div className="pt-1 border-t border-border/20">
            <p className="text-muted-foreground mb-1">Fluid Saturation</p>
            <div className="h-3 flex rounded-full overflow-hidden">
              <div className="bg-success/70" style={{ width: `${coreProperties.satOil}%` }} title={`Oil: ${coreProperties.satOil}%`} />
              <div className="bg-blue-500/70" style={{ width: `${coreProperties.satWater}%` }} title={`Water: ${coreProperties.satWater}%`} />
              <div className="bg-amber-400/70" style={{ width: `${coreProperties.satGas}%` }} title={`Gas: ${coreProperties.satGas}%`} />
            </div>
            <div className="flex justify-between text-[8px] mt-0.5">
              <span className="text-success">Oil {coreProperties.satOil}%</span>
              <span className="text-blue-400">Water {coreProperties.satWater}%</span>
              <span className="text-amber-400">Gas {coreProperties.satGas}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Score */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Eye className="h-3.5 w-3.5 text-primary" />
          Core Quality Assessment
        </div>
        <div className="flex items-center justify-center py-2">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={qualityScore >= 75 ? "hsl(var(--success, 142 76% 36%))" : qualityScore >= 50 ? "hsl(var(--warning, 38 92% 50%))" : "hsl(var(--destructive))"}
                strokeWidth="8"
                strokeDasharray={`${qualityScore * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-lg font-bold ${qualityScore >= 75 ? "text-success" : qualityScore >= 50 ? "text-warning" : "text-destructive"}`}>{qualityScore}</span>
              <span className="text-[8px] text-muted-foreground">/100</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <Badge variant="outline" className={`text-[9px] ${qualityScore >= 75 ? "text-success" : qualityScore >= 50 ? "text-warning" : "text-destructive"}`}>
            {qualityScore >= 75 ? "High Quality Core" : qualityScore >= 50 ? "Moderate Quality" : "Low Quality"}
          </Badge>
        </div>
        <div className="text-[9px] text-muted-foreground text-center">
          Based on porosity, permeability, saturation & fracture analysis
        </div>
      </div>
    </div>
  );
};

export default CoreAnalysisStageViz;
