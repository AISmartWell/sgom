import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, Eye, Zap, FileText, Layers, Droplets, BarChart3, Target, Calculator } from "lucide-react";
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
    key: "raw-log",
    label: "Raw Curves",
    icon: Eye,
    formula: null,
    description: "Visualization of well log curves: GR, SP, Resistivity, Porosity, Density, Neutron",
  },
  {
    num: 2,
    key: "vshale",
    label: "Vshale",
    icon: Layers,
    formula: "Vsh = (GR − GRclean) / (GRshale − GRclean)",
    description: "Linear GR method for shale volume calculation. GRclean = 20 API, GRshale = 120 API",
  },
  {
    num: 3,
    key: "porosity",
    label: "Porosity",
    icon: Target,
    formula: "φeff = φtotal × (1 − Vsh)",
    description: "Effective porosity with shale volume correction. Cutoff: φ > 8%",
  },
  {
    num: 4,
    key: "archie-sw",
    label: "Sw (Archie)",
    icon: Droplets,
    formula: "Sw² = (a · Rw) / (φᵐ · Rt)",
    description: "Archie Equation (1942): a=1, m=2, n=2, Rw=0.04 Ω·m. Cutoff: Sw < 60%",
  },
  {
    num: 5,
    key: "koko",
    label: "Ko Ko Rules",
    icon: Zap,
    formula: "Pattern: GR→Res→Den→Neu (L/R)",
    description: "Ko Ko Rules — fluid identification by 4-curve deflection patterns",
  },
  {
    num: 6,
    key: "net-pay",
    label: "Net Pay",
    icon: BarChart3,
    formula: "Net Pay = φ>8% AND Sw<60% AND Vsh<40%",
    description: "Productive interval determination and Missed Pay zone detection",
  },
  {
    num: 7,
    key: "report",
    label: "Report",
    icon: FileText,
    formula: null,
    description: "Final report: Gross/Net Pay, N/G ratio, dominant fluid, recommendations",
  },
];

/* ── Step detail components ── */

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

/* ── Main Page ── */
const GeophysicalExpertise = () => {
  const navigate = useNavigate();
  const [wells, setWells] = useState<WellOption[]>([]);
  const [selectedWell, setSelectedWell] = useState<WellOption | null>(null);
  const [activeStep, setActiveStep] = useState("raw-log");

  useEffect(() => {
    const fetchWells = async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, total_depth")
        .order("well_name", { ascending: true })
        .limit(50);
      if (data && data.length > 0) {
        setWells(data);
        const brawner = data.find(w => w.api_number === "42467309790000");
        setSelectedWell(brawner || data[0]);
      }
    };
    fetchWells();
  }, []);

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
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-muted-foreground font-medium">Well:</label>
        {wells.length > 0 ? (
          <select
            value={selectedWell?.id || ""}
            onChange={(e) => {
              const w = wells.find(w => w.id === e.target.value);
              if (w) setSelectedWell(w);
            }}
            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm min-w-[220px]"
          >
            {wells.map(w => (
              <option key={w.id} value={w.id}>
                {w.well_name || w.api_number || w.id}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-muted-foreground">Нет скважин в базе</span>
        )}
        {selectedWell?.formation && (
          <Badge variant="outline" className="text-xs">{selectedWell.formation}</Badge>
        )}
        {selectedWell?.total_depth && (
          <Badge variant="outline" className="text-xs">{selectedWell.total_depth.toLocaleString()} ft</Badge>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate("/modules/data-import")} className="ml-auto text-xs">
          + Добавить скважину
        </Button>
      </div>

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
