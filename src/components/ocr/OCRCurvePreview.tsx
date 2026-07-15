import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";
import { Activity } from "lucide-react";

type Reading = {
  depth_ft: number;
  gr_api?: number | null;
  sp_mv?: number | null;
  res_ohmm?: number | null;
  nphi_pu?: number | null;
  rhob_gcc?: number | null;
};

type Perf = { top_ft: number; bottom_ft: number };

interface Props {
  readings?: Reading[];
  perforations?: Perf[];
  formationTops?: { name: string; depth_ft: number }[];
}

// Tracks to render — only those with real data will appear
const TRACKS: {
  key: keyof Reading;
  label: string;
  unit: string;
  color: string;
  reversed?: boolean;
  scale?: "linear" | "log";
}[] = [
  { key: "gr_api", label: "GR", unit: "API", color: "#1A9FFF" },
  { key: "sp_mv", label: "SP", unit: "mV", color: "#22d3ee" },
  { key: "res_ohmm", label: "RES", unit: "Ω·m", color: "#f59e0b", scale: "log" },
  { key: "nphi_pu", label: "NPHI", unit: "p.u.", color: "#a78bfa", reversed: true },
  { key: "rhob_gcc", label: "RHOB", unit: "g/cc", color: "#ef4444" },
];

export const OCRCurvePreview = ({ readings = [], perforations = [], formationTops = [] }: Props) => {
  const activeTracks = useMemo(() => {
    if (!readings.length) return [];
    return TRACKS.filter((t) =>
      readings.some((r) => typeof r[t.key] === "number" && !Number.isNaN(r[t.key] as number))
    );
  }, [readings]);

  const depthDomain = useMemo(() => {
    if (!readings.length) return [0, 1] as [number, number];
    const depths = readings.map((r) => r.depth_ft).filter((d) => Number.isFinite(d));
    return [Math.max(...depths), Math.min(...depths)] as [number, number]; // reversed: shallow up
  }, [readings]);

  if (!readings.length) {
    return (
      <Card className="p-6 text-sm text-muted-foreground italic border-dashed">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4" />
          <span className="font-medium not-italic text-foreground">Digitised curves</span>
        </div>
        No curve readings digitised yet. Run OCR to extract depth-vs-value samples from the log.
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Digitised curves ({readings.length} samples)
        </h2>
        <div className="flex flex-wrap gap-1">
          {activeTracks.map((t) => (
            <Badge key={String(t.key)} variant="outline" style={{ borderColor: t.color, color: t.color }}>
              {t.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${activeTracks.length}, minmax(0, 1fr))` }}>
        {activeTracks.map((t) => (
          <div key={String(t.key)} className="rounded-lg border border-border/50 bg-muted/10 p-2">
            <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground mb-1 px-1">
              <span style={{ color: t.color }}>{t.label}</span>
              <span>{t.unit}</span>
            </div>
            <div style={{ height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={readings}
                  layout="vertical"
                  margin={{ top: 4, right: 8, bottom: 4, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    type="number"
                    scale={t.scale === "log" ? "log" : "linear"}
                    domain={t.scale === "log" ? [0.1, "auto"] : ["auto", "auto"]}
                    reversed={t.reversed}
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickCount={3}
                    orientation="top"
                  />
                  <YAxis
                    type="number"
                    dataKey="depth_ft"
                    domain={depthDomain}
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    width={36}
                    tickFormatter={(v) => `${Math.round(v)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 11,
                      borderRadius: 6,
                    }}
                    formatter={(v: number) => [typeof v === "number" ? v.toFixed(2) : v, t.label]}
                    labelFormatter={(d) => `${d} ft`}
                  />
                  {perforations.map((p, i) => (
                    <ReferenceArea
                      key={i}
                      y1={p.top_ft}
                      y2={p.bottom_ft}
                      fill="#ef4444"
                      fillOpacity={0.15}
                      stroke="#ef4444"
                      strokeOpacity={0.4}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey={t.key as string}
                    stroke={t.color}
                    strokeWidth={1.4}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {(perforations.length > 0 || formationTops.length > 0) && (
        <div className="flex flex-wrap gap-4 text-xs pt-2 border-t border-border/40">
          {perforations.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-red-500/30 border border-red-500/60 rounded-sm" />
              <span className="text-muted-foreground">
                Perforations: {perforations.map((p) => `${p.top_ft}–${p.bottom_ft}`).join(", ")} ft
              </span>
            </div>
          )}
          {formationTops.length > 0 && (
            <div className="text-muted-foreground">
              Tops: {formationTops.map((t) => `${t.name} @ ${t.depth_ft}`).join(" · ")}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default OCRCurvePreview;
