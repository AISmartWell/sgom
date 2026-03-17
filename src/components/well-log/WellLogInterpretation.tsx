import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  InterpretationSummary,
  IntervalResult,
  fluidColor,
  fluidLabel,
  fluidEmoji,
} from "@/lib/petrophysics";

interface Props {
  summary: InterpretationSummary;
  wellName: string;
}

const WellLogInterpretation = ({ summary, wellName }: Props) => {
  const { intervals, grossPay, netPay, netToGross, avgPorosity, avgSw, dominantFluid } = summary;

  const reservoirIntervals = useMemo(() => intervals.filter(i => i.isReservoir), [intervals]);
  const netPayIntervals = useMemo(() => intervals.filter(i => i.isNetPay), [intervals]);

  return (
    <div className="space-y-3 text-xs">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <SummaryCard label="Gross Pay" value={`${grossPay} ft`} color="text-amber-400" />
        <SummaryCard label="Net Pay" value={`${netPay} ft`} sub={`N/G: ${netToGross}%`} color="text-emerald-400" />
        <SummaryCard label="Avg φ (Net Pay)" value={`${avgPorosity}%`} color="text-blue-400" />
        <SummaryCard label="Avg Sw (Archie)" value={`${avgSw}%`} sub={`Sh = ${(100 - avgSw).toFixed(1)}%`} color="text-cyan-400" />
      </div>

      {/* Dominant fluid badge */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Dominant fluid in net pay:</span>
        <Badge variant="outline" className="gap-1 text-xs" style={{ borderColor: fluidColor(dominantFluid), color: fluidColor(dominantFluid) }}>
          {fluidLabel(dominantFluid)}
        </Badge>
        <span className="text-muted-foreground ml-auto">Cutoffs: φ&gt;8%, Sw&lt;60%, Vsh&lt;40%</span>
      </div>

      {/* Interval table */}
      <div className="border border-border/30 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground">
                <th className="px-2 py-1.5 text-left font-semibold">Interval (ft)</th>
                <th className="px-2 py-1.5 text-center font-semibold">Thick</th>
                <th className="px-2 py-1.5 text-center font-semibold">GR</th>
                <th className="px-2 py-1.5 text-center font-semibold">Vsh</th>
                <th className="px-2 py-1.5 text-center font-semibold">φ%</th>
                <th className="px-2 py-1.5 text-center font-semibold">Res</th>
                <th className="px-2 py-1.5 text-center font-semibold">Sw%</th>
                <th className="px-2 py-1.5 text-center font-semibold">Sh%</th>
                <th className="px-2 py-1.5 text-center font-semibold">Ko Ko</th>
                <th className="px-2 py-1.5 text-center font-semibold">Fluid</th>
                <th className="px-2 py-1.5 text-center font-semibold">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {intervals.map((iv, i) => (
                <IntervalRow key={i} iv={iv} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology */}
      <div className="p-2.5 bg-muted/20 rounded-lg text-[10px] text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground/80">📐 Methodology (American Well Logging Standards):</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><strong>Lithology</strong>: Clean Sand (GR ≤ 45 API), Silty Sand (GR 45–75), Shale (GR &gt; 75)</li>
          <li><strong>Vshale</strong>: Linear method — Vsh = (GR − GR<sub>clean</sub>) / (GR<sub>shale</sub> − GR<sub>clean</sub>), GR<sub>clean</sub>=45, GR<sub>shale</sub>=75</li>
          <li><strong>Sw</strong>: Archie equation — Sw² = (a·Rw) / (φ<sup>m</sup>·Rt), a=1, m=2, n=2, Rw=0.04 Ω·m</li>
          <li><strong>Fluid</strong>: Water-bearing (Rt 2–8), Oil-bearing (Rt &gt;10), Tight (Rt &gt;30)</li>
          <li><strong>Net Pay Cutoffs</strong>: φ &gt; 8% AND Sw &lt; 60% AND Vsh &lt; 40%</li>
        </ul>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
  <div className="p-2 rounded-lg border border-border/30 bg-muted/10">
    <p className="text-muted-foreground text-[10px]">{label}</p>
    <p className={`font-bold text-base ${color}`}>{value}</p>
    {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
  </div>
);

const IntervalRow = ({ iv }: { iv: IntervalResult }) => {
  const bgClass = iv.isNetPay
    ? "bg-emerald-500/5"
    : iv.isReservoir
    ? "bg-amber-500/5"
    : iv.fluidType === "shale"
    ? "bg-muted/10"
    : "";

  return (
    <tr className={`border-t border-border/20 ${bgClass} hover:bg-muted/20 transition-colors`}>
      <td className="px-2 py-1 font-mono whitespace-nowrap">
        {Math.round(iv.top)}–{Math.round(iv.bottom)}
      </td>
      <td className="px-2 py-1 text-center font-mono">{iv.thickness}</td>
      <td className="px-2 py-1 text-center font-mono">
        <span style={{ color: iv.avgGR < 45 ? "#22c55e" : iv.avgGR < 75 ? "#eab308" : "#ef4444" }}>
          {iv.avgGR}
        </span>
      </td>
      <td className="px-2 py-1 text-center font-mono">
        <span style={{ color: iv.vshale < 0.4 ? "#22c55e" : "#ef4444" }}>
          {(iv.vshale * 100).toFixed(0)}%
        </span>
      </td>
      <td className="px-2 py-1 text-center font-mono">
        <span style={{ color: iv.avgPor > 8 ? "#3b82f6" : "#6b7280" }}>
          {iv.avgPor}
        </span>
      </td>
      <td className="px-2 py-1 text-center font-mono">{iv.avgRes}</td>
      <td className="px-2 py-1 text-center font-mono">
        {iv.archieSwCalc !== null ? (
          <span style={{ color: iv.archieSwCalc < 60 ? "#22c55e" : "#ef4444" }}>
            {iv.archieSwCalc}
          </span>
        ) : (
          <span className="text-muted-foreground">{iv.avgSw}</span>
        )}
      </td>
      <td className="px-2 py-1 text-center font-mono font-bold">
        {iv.hydroSat !== null ? (
          <span style={{ color: iv.hydroSat > 40 ? "#22c55e" : "#6b7280" }}>
            {iv.hydroSat}
          </span>
        ) : "—"}
      </td>
      <td className="px-2 py-1 text-center">
        <code className="text-[9px] bg-muted/30 px-1 py-0.5 rounded" title="GR-Res-Den-Neu">
          {iv.kokoPattern}
        </code>
      </td>
      <td className="px-2 py-1 text-center whitespace-nowrap">
        <span style={{ color: fluidColor(iv.fluidType) }}>
          {fluidEmoji(iv.fluidType)} {iv.fluidType}
        </span>
      </td>
      <td className="px-2 py-1 text-center">
        {iv.isNetPay ? (
          <span className="text-emerald-400 font-bold">✅ YES</span>
        ) : iv.isReservoir ? (
          <span className="text-amber-400">⚠️ No</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
};

export default WellLogInterpretation;
