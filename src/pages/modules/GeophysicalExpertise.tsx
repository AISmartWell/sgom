import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Activity, Eye, Zap, FileText, Layers, Droplets, BarChart3, Target, Calculator, Search, Play, RefreshCw, Plus, Loader2, CheckCircle2, Upload } from "lucide-react";
import { AddWellDialog } from "@/components/shared/AddWellDialog";
import { LASUploadPanel } from "@/components/geophysical/LASUploadPanel";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EnhancedWellLog from "@/components/well-log/EnhancedWellLog";
import { WellLogAnalysisDemo } from "@/components/geophysical/WellLogAnalysisDemo";
import { supabase } from "@/integrations/supabase/client";
import { useWellLogs } from "@/hooks/useWellLogs";
import {
  interpretWellLog,
  calcVshale,
  calcArchieSwFromInputs,
  applyKoKoRules,
  fluidColor,
  fluidLabel,
  fluidEmoji,
  type PetroPoint,
  type InterpretationSummary,
  type IntervalResult,
} from "@/lib/petrophysics";

interface WellOption {
  id: string;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  total_depth: number | null;
}

const STEPS = [
  {
    num: 1,
    key: "lithology",
    label: "Lithology (GR)",
    icon: Layers,
    formula: "GR ≤ 45 → Sand | 45–75 → Silt | > 75 → Shale",
    description: "Stage 1: Identification of lithological intervals from the GR curve (API cutoffs)",
  },
  {
    num: 2,
    key: "raw-log",
    label: "Raw Curves",
    icon: Eye,
    formula: null,
    description: "Visualization of well log curves: GR, SP, Resistivity, Porosity, Density, Neutron",
  },
  {
    num: 3,
    key: "vshale",
    label: "Vshale",
    icon: Layers,
    formula: "Vsh = (GR − GRclean) / (GRshale − GRclean)",
    description: "Linear GR method. GRclean = 45 API (clean sand), GRshale = 75 API (shale). American standard.",
  },
  {
    num: 4,
    key: "porosity",
    label: "Porosity",
    icon: Target,
    formula: "φeff = φtotal × (1 − Vsh)",
    description: "Effective porosity with shale volume correction. Cutoff: φ > 8%",
  },
  {
    num: 5,
    key: "archie-sw",
    label: "Sw (Archie)",
    icon: Droplets,
    formula: "Sw² = (a · Rw) / (φᵐ · Rt)",
    description: "Уравнение Арчи (1942): a=1, m=2, n=2, Rw=0.04 Ω·м. Кондиция: Sw < 60%",
  },
  {
    num: 6,
    key: "koko",
    label: "Ko Ko Rules",
    icon: Zap,
    formula: "Pattern: GR→Res→Den→Neu (L/R)",
    description: "Ko Ko Rules — fluid identification by 4-curve deflection patterns",
  },
  {
    num: 7,
    key: "net-pay",
    label: "Net Pay",
    icon: BarChart3,
    formula: "Net Pay = φ>8% AND Sw<60% AND Vsh<40%",
    description: "Productive interval determination and Missed Pay zone detection",
  },
  {
    num: 8,
    key: "report",
    label: "Report",
    icon: FileText,
    formula: null,
    description: "Final report: Gross/Net Pay, N/G ratio, dominant fluid, recommendations",
  },
];

/* ── Step detail components ── */

interface LithInterval {
  top: number;
  bottom: number;
  thickness: number;
  lithology: "Clean Sand" | "Silty Sand" | "Shale";
  avgGR: number;
  minGR: number;
  maxGR: number;
  pointCount: number;
}

const classifyGR = (gr: number): LithInterval["lithology"] => {
  if (gr <= 45) return "Clean Sand";
  if (gr <= 75) return "Silty Sand";
  return "Shale";
};

const lithColor = (lith: LithInterval["lithology"]): string => {
  switch (lith) {
    case "Clean Sand": return "hsl(var(--success))";
    case "Silty Sand": return "hsl(var(--warning))";
    case "Shale": return "hsl(var(--destructive))";
  }
};

const lithBg = (lith: LithInterval["lithology"]): string => {
  switch (lith) {
    case "Clean Sand": return "bg-success/10 border-success/30";
    case "Silty Sand": return "bg-warning/10 border-warning/30";
    case "Shale": return "bg-destructive/10 border-destructive/30";
  }
};

const StepLithology = ({ data }: { data: PetroPoint[] }) => {
  const { intervals, stats } = useMemo(() => {
    if (data.length < 2) return { intervals: [] as LithInterval[], stats: { sand: 0, silt: 0, shale: 0, total: 0 } };

    const results: LithInterval[] = [];
    let curLith = classifyGR(data[0].gr);
    let startIdx = 0;

    for (let i = 1; i <= data.length; i++) {
      const lith = i < data.length ? classifyGR(data[i].gr) : null;
      if (lith !== curLith || i === data.length) {
        const pts = data.slice(startIdx, i);
        const grs = pts.map(p => p.gr);
        const top = pts[0].depth;
        const bottom = pts[pts.length - 1].depth;
        const thickness = Math.round((bottom - top) * 10) / 10;
        if (thickness >= 0.5 || pts.length >= 2) {
          results.push({
            top,
            bottom,
            thickness: Math.max(thickness, 0.5),
            lithology: curLith,
            avgGR: Math.round(grs.reduce((a, b) => a + b, 0) / grs.length * 10) / 10,
            minGR: Math.round(Math.min(...grs) * 10) / 10,
            maxGR: Math.round(Math.max(...grs) * 10) / 10,
            pointCount: pts.length,
          });
        }
        if (lith) { curLith = lith; startIdx = i; }
      }
    }

    // Merge thin intervals (< 2 ft) into neighbors
    const merged: LithInterval[] = [];
    for (const iv of results) {
      if (iv.thickness < 2 && merged.length > 0) {
        const prev = merged[merged.length - 1];
        prev.bottom = iv.bottom;
        prev.thickness = Math.round((prev.bottom - prev.top) * 10) / 10;
        prev.pointCount += iv.pointCount;
        // recalc weighted GR
        const totalPts = prev.pointCount;
        prev.avgGR = Math.round(((prev.avgGR * (totalPts - iv.pointCount)) + (iv.avgGR * iv.pointCount)) / totalPts * 10) / 10;
        prev.minGR = Math.min(prev.minGR, iv.minGR);
        prev.maxGR = Math.max(prev.maxGR, iv.maxGR);
      } else {
        merged.push({ ...iv });
      }
    }

    const totalThick = merged.reduce((s, iv) => s + iv.thickness, 0);
    const sand = merged.filter(iv => iv.lithology === "Clean Sand").reduce((s, iv) => s + iv.thickness, 0);
    const silt = merged.filter(iv => iv.lithology === "Silty Sand").reduce((s, iv) => s + iv.thickness, 0);
    const shale = merged.filter(iv => iv.lithology === "Shale").reduce((s, iv) => s + iv.thickness, 0);

    return { intervals: merged, stats: { sand, silt, shale, total: totalThick } };
  }, [data]);

  if (data.length < 2) {
    return <div className="text-center py-16 text-muted-foreground">Not enough data points for lithological analysis.</div>;
  }

  return (
    <div className="space-y-4">
      {/* API Classification Criteria */}
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            GR Lithological Classification (US API Standard)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-center">
              <div className="text-lg font-bold text-success">≤ 45 API</div>
              <div className="text-xs font-semibold mt-1">Clean Sand</div>
              <div className="text-[10px] text-muted-foreground">Reservoir rock</div>
            </div>
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-center">
              <div className="text-lg font-bold text-warning">45–75 API</div>
              <div className="text-xs font-semibold mt-1">Silty Sand</div>
              <div className="text-[10px] text-muted-foreground">Transition zone</div>
            </div>
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
              <div className="text-lg font-bold text-destructive">&gt; 75 API</div>
              <div className="text-xs font-semibold mt-1">Shale</div>
              <div className="text-[10px] text-muted-foreground">Non-reservoir</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="bg-muted/20 border-border/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold">{intervals.length}</div>
            <div className="text-[10px] text-muted-foreground">Total Intervals</div>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-success">{Math.round(stats.sand)} ft</div>
            <div className="text-[10px] text-muted-foreground">Clean Sand ({stats.total > 0 ? Math.round(stats.sand / stats.total * 100) : 0}%)</div>
          </CardContent>
        </Card>
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-warning">{Math.round(stats.silt)} ft</div>
            <div className="text-[10px] text-muted-foreground">Silty Sand ({stats.total > 0 ? Math.round(stats.silt / stats.total * 100) : 0}%)</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-destructive">{Math.round(stats.shale)} ft</div>
            <div className="text-[10px] text-muted-foreground">Shale ({stats.total > 0 ? Math.round(stats.shale / stats.total * 100) : 0}%)</div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Lithology Column */}
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Lithological Column</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex rounded-lg overflow-hidden h-10 border border-border/50">
            {intervals.map((iv, i) => {
              const width = stats.total > 0 ? (iv.thickness / stats.total) * 100 : 0;
              return (
                <div
                  key={i}
                  className="relative group cursor-default transition-opacity hover:opacity-100"
                  style={{
                    width: `${Math.max(width, 2)}%`,
                    backgroundColor: lithColor(iv.lithology),
                    opacity: 0.7,
                  }}
                  title={`${iv.lithology}: ${iv.top}–${iv.bottom} ft (GR avg ${iv.avgGR} API)`}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-background border border-border rounded px-2 py-1 text-[10px] whitespace-nowrap z-10 shadow-lg">
                    <strong>{iv.lithology}</strong> · {iv.top}–{iv.bottom} ft · GR {iv.avgGR} API
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: lithColor("Clean Sand"), opacity: 0.7 }} />
              Clean Sand
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: lithColor("Silty Sand"), opacity: 0.7 }} />
              Silty Sand
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: lithColor("Shale"), opacity: 0.7 }} />
              Shale
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interval Table */}
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Identified Intervals ({intervals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {intervals.map((iv, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs ${lithBg(iv.lithology)}`}
              >
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: lithColor(iv.lithology), opacity: 0.8 }} />
                <span className="font-mono font-semibold w-28 flex-shrink-0">{iv.top.toFixed(1)}–{iv.bottom.toFixed(1)}'</span>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">{iv.lithology}</Badge>
                <span className="text-muted-foreground flex-shrink-0">{iv.thickness} ft</span>
                <span className="text-muted-foreground ml-auto flex-shrink-0">
                  GR: {iv.minGR}–{iv.maxGR} (avg {iv.avgGR}) API
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GR Profile per point */}
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">GR Profile with Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
            {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 40)) === 0).slice(0, 40).map((p, i) => {
              const lith = classifyGR(p.gr);
              const barWidth = Math.min(100, (p.gr / 150) * 100);
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-14 text-muted-foreground font-mono text-right flex-shrink-0">{p.depth.toFixed(0)}'</span>
                  <div className="flex-1 h-4 bg-muted/20 rounded overflow-hidden relative">
                    <div
                      className="h-full rounded transition-all"
                      style={{ width: `${barWidth}%`, backgroundColor: lithColor(lith), opacity: 0.7 }}
                    />
                    {/* 45 API line */}
                    <div className="absolute top-0 bottom-0 border-l border-success/50 border-dashed" style={{ left: `${(45/150)*100}%` }} />
                    {/* 75 API line */}
                    <div className="absolute top-0 bottom-0 border-l border-destructive/50 border-dashed" style={{ left: `${(75/150)*100}%` }} />
                  </div>
                  <span className="w-10 text-right font-mono flex-shrink-0">{p.gr.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
            <span>--- 45 API (Sand cutoff)</span>
            <span>--- 75 API (Shale cutoff)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StepVshale = ({ data }: { data: PetroPoint[] }) => {
  const examples = useMemo(() => {
    const sampled = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0).slice(0, 8);
    return sampled.map(p => ({
      depth: p.depth,
      gr: p.gr,
      vsh: calcVshale(p.gr),
      litho: calcVshale(p.gr) < 0.2 ? "Reservoir" : calcVshale(p.gr) < 0.4 ? "Transition" : "Shale",
    }));
  }, [data]);

  return (
    <div className="space-y-4">
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Linear Method Formula
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background/50 p-4 rounded-lg font-mono text-center text-lg">
            V<sub>sh</sub> = (GR − GR<sub>clean</sub>) / (GR<sub>shale</sub> − GR<sub>clean</sub>)
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="p-2 bg-muted/30 rounded text-center">
              <div className="font-semibold text-foreground">GR<sub>clean</sub></div>
              <div>20 API</div>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center">
              <div className="font-semibold text-foreground">GR<sub>shale</sub></div>
              <div>120 API</div>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center">
              <div className="font-semibold text-foreground">Cutoff</div>
              <div>Vsh &lt; 0.40</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Results by Depth</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="py-1.5 text-left">Depth (ft)</th>
                <th className="py-1.5 text-center">GR (API)</th>
                <th className="py-1.5 text-center">Vshale</th>
                <th className="py-1.5 text-center">Lithology</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((e, i) => (
                <tr key={i} className="border-b border-border/10">
                  <td className="py-1.5 font-mono">{e.depth.toFixed(0)}</td>
                  <td className="py-1.5 text-center">{e.gr.toFixed(1)}</td>
                  <td className="py-1.5 text-center">
                    <span className={e.vsh < 0.2 ? "text-emerald-400" : e.vsh < 0.4 ? "text-amber-400" : "text-red-400"}>
                      {e.vsh.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-1.5 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {e.litho}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Visual bar chart */}
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Vshale Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {examples.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-12 text-muted-foreground font-mono">{e.depth.toFixed(0)}'</span>
                <div className="flex-1 h-4 bg-muted/20 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${Math.min(100, e.vsh * 100)}%`,
                      backgroundColor: e.vsh < 0.2 ? "#22c55e" : e.vsh < 0.4 ? "#eab308" : "#ef4444",
                    }}
                  />
                </div>
                <span className="w-10 text-right font-mono">{(e.vsh * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StepPorosity = ({ data }: { data: PetroPoint[] }) => {
  const examples = useMemo(() => {
    return data
      .filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0)
      .slice(0, 8)
      .map(p => {
        const vsh = calcVshale(p.gr);
        return {
          depth: p.depth,
          phiTotal: p.por,
          vsh,
          phiEff: p.por * (1 - vsh),
          isReservoir: p.por * (1 - vsh) > 8,
        };
      });
  }, [data]);

  return (
    <div className="space-y-4">
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Porosity Correction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background/50 p-4 rounded-lg font-mono text-center text-lg">
            φ<sub>eff</sub> = φ<sub>total</sub> × (1 − V<sub>sh</sub>)
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Effective porosity — total porosity minus the volume of clay-bound water
          </p>
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Calculation by Intervals</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="py-1.5 text-left">Depth</th>
                <th className="py-1.5 text-center">φ total</th>
                <th className="py-1.5 text-center">Vsh</th>
                <th className="py-1.5 text-center">φ eff</th>
                <th className="py-1.5 text-center">Reservoir?</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((e, i) => (
                <tr key={i} className="border-b border-border/10">
                  <td className="py-1.5 font-mono">{e.depth.toFixed(0)}</td>
                  <td className="py-1.5 text-center">{e.phiTotal.toFixed(1)}%</td>
                  <td className="py-1.5 text-center">{e.vsh.toFixed(2)}</td>
                  <td className="py-1.5 text-center font-semibold">
                    <span className={e.phiEff > 8 ? "text-emerald-400" : "text-muted-foreground"}>
                      {e.phiEff.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-1.5 text-center">
                    {e.isReservoir ? "✅" : "❌"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

const StepArchie = ({ data }: { data: PetroPoint[] }) => {
  const examples = useMemo(() => {
    return data
      .filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0)
      .slice(0, 8)
      .map(p => {
        const porFrac = p.por / 100;
        const swArchie = calcArchieSwFromInputs(porFrac, p.res) * 100;
        return {
          depth: p.depth,
          por: p.por,
          res: p.res,
          swLog: p.sw,
          swArchie,
          hydroSat: 100 - swArchie,
        };
      });
  }, [data]);

  return (
    <div className="space-y-4">
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            Archie Equation (1942)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background/50 p-4 rounded-lg font-mono text-center text-lg">
            S<sub>w</sub><sup>n</sup> = (a · R<sub>w</sub>) / (φ<sup>m</sup> · R<sub>t</sub>)
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div className="p-2 bg-muted/30 rounded text-center">
              <div className="font-semibold text-foreground">a</div>
              <div>1.0</div>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center">
              <div className="font-semibold text-foreground">m</div>
              <div>2.0</div>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center">
              <div className="font-semibold text-foreground">n</div>
              <div>2.0</div>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center">
              <div className="font-semibold text-foreground">Rw</div>
              <div>0.04 Ω·m</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sw Calculation by Depth</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="py-1.5 text-left">Depth</th>
                <th className="py-1.5 text-center">φ%</th>
                <th className="py-1.5 text-center">Rt (Ω·m)</th>
                <th className="py-1.5 text-center">Sw (Archie)</th>
                <th className="py-1.5 text-center">Sh (1−Sw)</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((e, i) => (
                <tr key={i} className="border-b border-border/10">
                  <td className="py-1.5 font-mono">{e.depth.toFixed(0)}</td>
                  <td className="py-1.5 text-center">{e.por.toFixed(1)}</td>
                  <td className="py-1.5 text-center">{e.res.toFixed(2)}</td>
                  <td className="py-1.5 text-center">
                    <span className={e.swArchie < 60 ? "text-emerald-400 font-semibold" : "text-red-400"}>
                      {e.swArchie.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-1.5 text-center font-semibold">
                    <span className={e.hydroSat > 40 ? "text-amber-400" : "text-muted-foreground"}>
                      {e.hydroSat.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

const StepKoKo = ({ data }: { data: PetroPoint[] }) => {
  const examples = useMemo(() => {
    return data
      .filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0)
      .slice(0, 6)
      .map(p => {
        const { fluidType, pattern } = applyKoKoRules(p.gr, p.res, p.rhob, p.nphi, p.por);
        return { depth: p.depth, gr: p.gr, res: p.res, rhob: p.rhob, nphi: p.nphi, pattern, fluidType };
      });
  }, [data]);

  return (
    <div className="space-y-4">
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Ko Ko Rules — Pattern Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { pattern: "L-R-L-L", fluid: "🛢️ Oil", color: "#22c55e", desc: "Clean sand, high Res, porous" },
              { pattern: "L-R-L-R", fluid: "⛽ Gas", color: "#ef4444", desc: "Den-Neu crossover (gas effect)" },
              { pattern: "L-L-L-L", fluid: "💧 Water", color: "#3b82f6", desc: "Clean sand, low Res, porous" },
              { pattern: "R-R-R-R", fluid: "🪨 Tight", color: "#6b7280", desc: "High GR, high Res, dense" },
              { pattern: "R-R-R-L", fluid: "📐 Shale", color: "#8b8b2a", desc: "High GR, high apparent Neu" },
              { pattern: "L-R-*-*", fluid: "🔀 Transition", color: "#eab308", desc: "Ambiguous — needs DST" },
            ].map((r, i) => (
              <div key={i} className="p-2.5 bg-muted/30 rounded-lg border border-border/20">
                <div className="flex items-center justify-between mb-1">
                  <code className="font-mono font-bold text-foreground">{r.pattern}</code>
                  <span style={{ color: r.color }}>{r.fluid}</span>
                </div>
                <p className="text-muted-foreground text-[10px]">{r.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            L = deflects Left (lower value), R = deflects Right (higher value). Order: GR → Res → Density → Neutron
          </p>
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Classification Results</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="py-1.5 text-left">Depth</th>
                <th className="py-1.5 text-center">GR</th>
                <th className="py-1.5 text-center">Res</th>
                <th className="py-1.5 text-center">Pattern</th>
                <th className="py-1.5 text-center">Fluid</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((e, i) => (
                <tr key={i} className="border-b border-border/10">
                  <td className="py-1.5 font-mono">{e.depth.toFixed(0)}</td>
                  <td className="py-1.5 text-center">{e.gr.toFixed(0)}</td>
                  <td className="py-1.5 text-center">{e.res.toFixed(1)}</td>
                  <td className="py-1.5 text-center font-mono font-bold">{e.pattern}</td>
                  <td className="py-1.5 text-center">
                    <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: fluidColor(e.fluidType), color: fluidColor(e.fluidType) }}>
                      {fluidEmoji(e.fluidType)} {e.fluidType}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

const StepNetPay = ({ summary }: { summary: InterpretationSummary }) => {
  const { intervals, grossPay, netPay, netToGross, avgPorosity, avgSw, dominantFluid, totalMissedPay } = summary;
  const netPayIntervals = intervals.filter(i => i.isNetPay);
  const missedIntervals = intervals.filter(i => i.isReservoir && !i.isNetPay);

  return (
    <div className="space-y-4">
      <Card className="bg-muted/20 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Net Pay Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background/50 p-4 rounded-lg text-center space-y-1">
            <div className="font-mono text-sm">
              <span className="text-emerald-400">φ &gt; 8%</span>
              {" AND "}
              <span className="text-blue-400">Sw &lt; 60%</span>
              {" AND "}
              <span className="text-amber-400">Vsh &lt; 40%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="bg-muted/20 border-border/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-amber-400">{grossPay} ft</div>
            <div className="text-[10px] text-muted-foreground">Gross Pay</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-border/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{netPay} ft</div>
            <div className="text-[10px] text-muted-foreground">Net Pay</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-border/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-primary">{netToGross}%</div>
            <div className="text-[10px] text-muted-foreground">N/G Ratio</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-border/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-red-400">{totalMissedPay} ft</div>
            <div className="text-[10px] text-muted-foreground">Missed Pay</div>
          </CardContent>
        </Card>
      </div>

      {/* Net pay intervals */}
      {netPayIntervals.length > 0 && (
        <Card className="bg-muted/20 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-400">✅ Net Pay Intervals ({netPayIntervals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border/30">
                  <th className="py-1.5 text-left">Interval</th>
                  <th className="py-1.5 text-center">Thick</th>
                  <th className="py-1.5 text-center">φ%</th>
                  <th className="py-1.5 text-center">Sw%</th>
                  <th className="py-1.5 text-center">Fluid</th>
                </tr>
              </thead>
              <tbody>
                {netPayIntervals.map((iv, i) => (
                  <tr key={i} className="border-b border-border/10">
                    <td className="py-1.5 font-mono">{iv.top.toFixed(0)}–{iv.bottom.toFixed(0)}'</td>
                    <td className="py-1.5 text-center">{iv.thickness} ft</td>
                    <td className="py-1.5 text-center text-emerald-400">{iv.avgPor}%</td>
                    <td className="py-1.5 text-center">{iv.archieSwCalc ?? iv.avgSw}%</td>
                    <td className="py-1.5 text-center">
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: fluidColor(iv.fluidType), color: fluidColor(iv.fluidType) }}>
                        {fluidEmoji(iv.fluidType)} {iv.fluidType}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Missed pay */}
      {missedIntervals.length > 0 && (
        <Card className="bg-muted/20 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-400">⚠️ Missed Pay Zones ({missedIntervals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              {missedIntervals.map((iv, i) => (
                <div key={i} className="flex items-center justify-between p-1.5 bg-red-500/5 rounded">
                  <span className="font-mono">{iv.top.toFixed(0)}–{iv.bottom.toFixed(0)}'</span>
                  <span>{iv.thickness} ft</span>
                  <span>φ={iv.avgPor}%, Sw={iv.archieSwCalc ?? iv.avgSw}%</span>
                  <Badge variant="outline" className="text-[10px]">{iv.kokoPattern}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* AddWellDialog extracted to shared component */

/* ── Well Search Selector ── */
const WellSearchSelector = ({
  wells,
  selectedWell,
  searchResults,
  searching,
  search,
  open,
  onSearchChange,
  onOpenChange,
  onSelect,
  onAddWell,
}: {
  wells: WellOption[];
  selectedWell: WellOption | null;
  searchResults: WellOption[];
  searching: boolean;
  search: string;
  open: boolean;
  onSearchChange: (value: string) => void;
  onOpenChange: (value: boolean) => void;
  onSelect: (w: WellOption) => void;
  onAddWell: () => void;
}) => {
  const filteredWells = search.trim() ? searchResults : wells;
  const selectedLabel = selectedWell
    ? `${selectedWell.well_name || selectedWell.api_number || selectedWell.id.slice(0, 8)}${selectedWell.formation ? ` • ${selectedWell.formation}` : ""}`
    : "";

  return (
    <Card className="mb-6 bg-muted/20 border-border/30">
      <CardContent className="py-4">
        <p className="text-sm font-semibold mb-2">Select Well</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Popover open={open} onOpenChange={onOpenChange}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {selectedLabel || "Search and select a well..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search by name, API #, or formation..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoFocus
                  />
                </div>
                <ScrollArea className="max-h-64">
                  {searching ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
                  ) : filteredWells.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No wells found.{" "}
                      <button className="text-primary underline" onClick={() => { onOpenChange(false); onAddWell(); }}>
                        Add a well
                      </button>
                    </div>
                  ) : (
                    filteredWells.map((w) => (
                      <button
                        key={w.id}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${w.id === selectedWell?.id ? "bg-accent font-medium" : ""}`}
                        onClick={() => {
                          onSelect(w);
                          onOpenChange(false);
                          onSearchChange("");
                        }}
                      >
                        <span className="font-medium">{w.well_name || w.api_number || w.id.slice(0, 8)}</span>
                        {w.formation && <span className="text-muted-foreground"> • {w.formation}</span>}
                        {w.total_depth && <span className="text-muted-foreground"> • {w.total_depth.toLocaleString()} ft</span>}
                      </button>
                    ))
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={onAddWell} variant="outline" size="sm" className="flex-shrink-0">
            <Plus className="mr-1 h-4 w-4" />
            Add Well
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ── Main Page ── */
const GeophysicalExpertise = () => {
  const navigate = useNavigate();
  const [wells, setWells] = useState<WellOption[]>([]);
  const [selectedWell, setSelectedWell] = useState<WellOption | null>(null);
  const [activeStep, setActiveStep] = useState("raw-log");
  const [addWellOpen, setAddWellOpen] = useState(false);
  const [lasUploadOpen, setLasUploadOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [wellSearch, setWellSearch] = useState("");
  const [wellPickerOpen, setWellPickerOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<WellOption[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      const { data } = await supabase.from("user_companies").select("company_id").limit(1).maybeSingle();
      if (data) setCompanyId(data.company_id);
    };
    loadCompany();
  }, []);

  useEffect(() => {
    if (!wellSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const term = wellSearch.trim();
      const pattern = `%${term}%`;
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, total_depth")
        .or(`well_name.ilike."${pattern}",api_number.ilike."${pattern}",formation.ilike."${pattern}"`)
        .order("well_name", { ascending: true })
        .limit(50);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [wellSearch]);

  const fetchWells = async () => {
    const { data } = await supabase
      .from("wells")
      .select("id, well_name, api_number, formation, total_depth")
      .order("well_name", { ascending: true })
      .limit(200);
    if (data && data.length > 0) {
      setWells(data);
      setSelectedWell((prev) => prev ?? data[0]);
    }
  };

  useEffect(() => { fetchWells(); }, []);

  const handleWellAdded = async (well: WellOption) => {
    const { data } = await supabase
      .from("wells")
      .select("id, well_name, api_number, formation, total_depth")
      .eq("id", well.id)
      .maybeSingle();

    const nextWell = data || well;
    setWells((prev) => {
      const withoutDuplicate = prev.filter((item) => item.id !== nextWell.id);
      return [nextWell, ...withoutDuplicate];
    });
    setSelectedWell(nextWell);
    setWellPickerOpen(false);
    setWellSearch("");
    await fetchWells();
  };

  // Load well log data for calculation steps
  const { data: rawLogs } = useWellLogs(selectedWell?.id);

  const petroData = useMemo<PetroPoint[]>(() => {
    if (!rawLogs) return [];
    return rawLogs.map(p => ({
      depth: p.measured_depth,
      gr: p.gamma_ray ?? 50,
      sp: p.sp ?? -20,
      res: p.resistivity ?? 5,
      por: p.porosity ?? 10,
      sw: p.water_saturation ?? 50,
      rhob: p.density,
      nphi: p.neutron_porosity,
    }));
  }, [rawLogs]);

  const interpretation = useMemo<InterpretationSummary | null>(() => {
    if (petroData.length < 3) return null;
    return interpretWellLog(petroData);
  }, [petroData]);

  return (
    <div className="p-8">
      {/* Add Well Dialog */}
      <AddWellDialog
        open={addWellOpen}
        onOpenChange={setAddWellOpen}
        companyId={companyId}
        onWellAdded={handleWellAdded}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Geophysical Expertise</h1>
              <Badge className="text-xs">Stage 8</Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            Step-by-step well log interpretation algorithm
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <Calculator className="mr-1 h-3 w-3" />
          7-Step Algorithm
        </Badge>
      </div>

      {/* Well Selector */}
      <WellSearchSelector
        wells={wells}
        selectedWell={selectedWell}
        searchResults={searchResults}
        searching={searching}
        search={wellSearch}
        open={wellPickerOpen}
        onSearchChange={setWellSearch}
        onOpenChange={setWellPickerOpen}
        onSelect={setSelectedWell}
        onAddWell={() => setAddWellOpen(true)}
      />

      {/* LAS Upload Panel */}
      {selectedWell && lasUploadOpen && (
        <div className="mb-4">
          <LASUploadPanel
            wellId={selectedWell.id}
            wellName={selectedWell.well_name || "Unknown"}
            companyId={companyId}
            onImportComplete={() => {
              setLasUploadOpen(false);
              // Force re-fetch well logs by toggling the well
              const w = selectedWell;
              setSelectedWell(null);
              setTimeout(() => setSelectedWell(w), 100);
            }}
          />
        </div>
      )}

      {/* Upload LAS button */}
      {selectedWell && !lasUploadOpen && (
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLasUploadOpen(true)}
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload LAS
          </Button>
        </div>
      )}

      {/* 7-Step Pipeline Navigator */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = activeStep === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveStep(s.key)}
              className={`flex-shrink-0 p-2.5 rounded-lg border text-left transition-all min-w-[120px] ${
                isActive
                  ? "bg-primary/15 border-primary ring-1 ring-primary/50"
                  : "bg-muted/30 border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {s.num}
                </span>
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-xs font-semibold block ${isActive ? "text-primary" : "text-foreground"}`}>
                {s.label}
              </span>
              {s.formula && (
                <p className="text-[9px] text-muted-foreground font-mono mt-0.5 truncate">{s.formula}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Step Description */}
      <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">
            Step {STEPS.find(s => s.key === activeStep)?.num}:
          </span>
          <span className="text-sm text-muted-foreground">
            {STEPS.find(s => s.key === activeStep)?.description}
          </span>
        </div>
      </div>

      {/* Step Content */}
      <Tabs value={activeStep} onValueChange={setActiveStep}>
        <TabsList className="hidden">
          {STEPS.map(s => <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>)}
        </TabsList>

        {/* Step 1: Raw Log */}
        <TabsContent value="raw-log" className="mt-0">
          {selectedWell ? (
            <EnhancedWellLog
              wellId={selectedWell.id}
              wellName={selectedWell.well_name || "Unknown Well"}
              formation={selectedWell.formation}
              defaultExpanded={true}
              totalDepth={selectedWell.total_depth ?? undefined}
            />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>No wells found. Import wells first to view well log analysis.</p>
            </div>
          )}
        </TabsContent>

        {/* Step 2: Vshale */}
        <TabsContent value="vshale" className="mt-0">
          {petroData.length > 0 ? (
            <StepVshale data={petroData} />
          ) : (
            <div className="text-center py-16 text-muted-foreground">Loading well data...</div>
          )}
        </TabsContent>

        {/* Step 3: Porosity */}
        <TabsContent value="porosity" className="mt-0">
          {petroData.length > 0 ? (
            <StepPorosity data={petroData} />
          ) : (
            <div className="text-center py-16 text-muted-foreground">Loading well data...</div>
          )}
        </TabsContent>

        {/* Step 4: Archie Sw */}
        <TabsContent value="archie-sw" className="mt-0">
          {petroData.length > 0 ? (
            <StepArchie data={petroData} />
          ) : (
            <div className="text-center py-16 text-muted-foreground">Loading well data...</div>
          )}
        </TabsContent>

        {/* Step 5: Ko Ko Rules */}
        <TabsContent value="koko" className="mt-0">
          {petroData.length > 0 ? (
            <StepKoKo data={petroData} />
          ) : (
            <div className="text-center py-16 text-muted-foreground">Loading well data...</div>
          )}
        </TabsContent>

        {/* Step 6: Net Pay */}
        <TabsContent value="net-pay" className="mt-0">
          {interpretation ? (
            <StepNetPay summary={interpretation} />
          ) : (
            <div className="text-center py-16 text-muted-foreground">Loading interpretation...</div>
          )}
        </TabsContent>

        {/* Step 7: Report */}
        <TabsContent value="report" className="mt-0">
          {selectedWell ? (
            <div className="space-y-4">
              <EnhancedWellLog
                wellId={selectedWell.id}
                wellName={selectedWell.well_name || "Unknown Well"}
                formation={selectedWell.formation}
                defaultExpanded={true}
                totalDepth={selectedWell.total_depth ?? undefined}
                showInterpretationByDefault
              />
              <WellLogAnalysisDemo />
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">Select a well.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeophysicalExpertise;
