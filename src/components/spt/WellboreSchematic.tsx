import { Badge } from "@/components/ui/badge";

/**
 * Illustrative wellbore schematic for the SPT Slot Plan: depth axis, wellbore,
 * existing perforations and planned SPT slot intervals colored by priority.
 * Geometry (slots/ft, width, phasing) is a design default — DRAFT, not a work order.
 */

export interface SchematicInterval {
  top: number;
  bottom: number;
  priority: "Primary" | "Secondary" | "Caution";
  perforated: "none" | "partial" | "full";
}
export interface SchematicPerf { depth_from: number; depth_to: number }

interface Props {
  intervals: SchematicInterval[];
  perfs: SchematicPerf[];
  logTop: number;
  totalDepth: number;
}

const PRIORITY_FILL: Record<SchematicInterval["priority"], string> = {
  Primary: "hsl(var(--success))",
  Secondary: "hsl(var(--primary))",
  Caution: "hsl(var(--warning))",
};

const WellboreSchematic = ({ intervals, perfs, logTop, totalDepth }: Props) => {
  const top = Math.max(0, Math.min(logTop, ...intervals.map((i) => i.top), ...perfs.map((p) => p.depth_from)) - 50);
  const bottom = Math.max(totalDepth, ...intervals.map((i) => i.bottom), ...perfs.map((p) => p.depth_to)) + 50;
  const span = Math.max(bottom - top, 1);

  const W = 520, H = 640, padT = 24, padB = 24;
  const y = (d: number) => padT + ((d - top) / span) * (H - padT - padB);
  const cx = 300; // wellbore center x
  const pipeW = 26;

  const ticks: number[] = [];
  const step = span > 4000 ? 1000 : span > 1500 ? 500 : 250;
  for (let d = Math.ceil(top / step) * step; d <= bottom; d += step) ticks.push(d);

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl mx-auto rounded-lg border border-border/40 bg-background/40" role="img" aria-label="Wellbore schematic with planned SPT slots">
        {/* depth axis */}
        <line x1={70} y1={padT} x2={70} y2={H - padB} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
        {ticks.map((d) => (
          <g key={d}>
            <line x1={64} y1={y(d)} x2={76} y2={y(d)} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
            <text x={58} y={y(d) + 3} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">{d.toLocaleString()}</text>
          </g>
        ))}
        <text x={58} y={padT - 8} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">ft</text>

        {/* wellbore pipe */}
        <rect x={cx - pipeW / 2} y={padT} width={pipeW} height={H - padT - padB} fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth={1.5} rx={3} />
        <rect x={cx - pipeW / 2 + 5} y={padT} width={pipeW - 10} height={H - padT - padB} fill="hsl(var(--background))" />
        <text x={cx} y={padT - 8} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">Wellbore</text>

        {/* existing perforations — left side */}
        {perfs.map((p) => (
          <g key={`perf-${p.depth_from}`}>
            <rect x={cx - pipeW / 2 - 34} y={y(p.depth_from)} width={30} height={Math.max(y(p.depth_to) - y(p.depth_from), 3)} fill="hsl(var(--muted-foreground))" opacity={0.55} rx={2} />
            {Array.from({ length: 4 }).map((_, k) => (
              <line key={k} x1={cx - pipeW / 2 - 34} y1={y(p.depth_from) + 3 + k * 5} x2={cx - pipeW / 2 - 4} y2={y(p.depth_from) + 3 + k * 5} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} opacity={0.7} />
            ))}
            <text x={cx - pipeW / 2 - 40} y={(y(p.depth_from) + y(p.depth_to)) / 2 + 3} textAnchor="end" fontSize={9} fill="hsl(var(--muted-foreground))">perf</text>
          </g>
        ))}

        {/* planned SPT slots — right side, colored by priority */}
        {intervals.map((i) => {
          const y1 = y(i.top), y2 = y(i.bottom);
          const h = Math.max(y2 - y1, 4);
          const fill = PRIORITY_FILL[i.priority];
          const slots = Math.min(Math.max(Math.round(h / 7), 2), 24);
          return (
            <g key={`spt-${i.top}`}>
              <rect x={cx + pipeW / 2 + 4} y={y1} width={34} height={h} fill={fill} opacity={0.18} rx={2} />
              {Array.from({ length: slots }).map((_, k) => (
                <line key={k} x1={cx + pipeW / 2 + 6} y1={y1 + 3 + (k * (h - 6)) / Math.max(slots - 1, 1)} x2={cx + pipeW / 2 + 36} y2={y1 + 3 + (k * (h - 6)) / Math.max(slots - 1, 1)} stroke={fill} strokeWidth={2} />
              ))}
              <text x={cx + pipeW / 2 + 44} y={(y1 + y2) / 2 + 3} fontSize={9} fill={fill}>
                {i.top}–{i.bottom} ft
              </text>
            </g>
          );
        })}

        {/* TD marker */}
        {totalDepth > 0 && totalDepth <= bottom && (
          <g>
            <line x1={cx - 40} y1={y(totalDepth)} x2={cx + 40} y2={y(totalDepth)} stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={cx + 46} y={y(totalDepth) + 3} fontSize={9} fill="hsl(var(--foreground))">TD {totalDepth.toLocaleString()} ft</text>
          </g>
        )}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(var(--muted-foreground))", opacity: 0.55 }} /> Existing perforations</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(var(--success))" }} /> SPT slots — Primary</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(var(--primary))" }} /> SPT slots — Secondary</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(var(--warning))" }} /> SPT slots — Caution</span>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Illustrative schematic, not to scale. Slot count per interval is symbolic; engineered density is in the table below. <Badge variant="outline" className="text-warning border-warning/40 ml-1">DRAFT</Badge>
      </p>
    </div>
  );
};

export default WellboreSchematic;
