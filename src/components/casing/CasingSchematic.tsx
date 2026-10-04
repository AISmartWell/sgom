import { CasingString, casingNumber } from "@/lib/casing-program";

export default function CasingSchematic({ strings, totalDepth }: { strings: CasingString[]; totalDepth: number | null }) {
  const valid = strings.filter(r => Number.isFinite(r.top_ft) && Number.isFinite(r.bottom_ft) && r.top_ft >= 0 && r.bottom_ft > r.top_ft);
  if (!valid.length) return <div className="py-16 text-center text-sm text-muted-foreground border-y border-border">No depth intervals entered</div>;
  const maxDepth = Math.max(totalDepth ?? 0, ...valid.map(r => r.bottom_ft), 1);
  const y = (d: number) => 62 + d / maxDepth * 390;
  const width = Math.max(560, 110 + valid.length * 100);
  return <div className="overflow-x-auto">
    <svg role="img" aria-label="Depth-aligned casing and cement schematic" viewBox={`0 0 ${width} 510`} className="w-full min-w-[560px] text-foreground" style={{ aspectRatio: `${width} / 510` }}>
      {Array.from({ length: 6 }, (_, i) => {
        const d = maxDepth * i / 5;
        return <g key={i}><line x1="80" x2={width - 12} y1={y(d)} y2={y(d)} className="stroke-border" strokeDasharray="3 4" /><text x="72" y={y(d) + 4} textAnchor="end" className="fill-muted-foreground" fontSize="11">{Math.round(d).toLocaleString("en-US")}</text></g>;
      })}
      <text x="25" y="28" className="fill-muted-foreground" fontSize="11">MD · ft</text>
      {valid.map((r, i) => {
        const x = 100 + i * 100;
        const cement = r.cement_top_ft !== null && r.cement_top_ft >= r.top_ft && r.cement_top_ft <= r.bottom_ft && r.cement_status !== "Not cemented";
        return <g key={r.id}>
          <text x={x + 24} y="22" textAnchor="middle" className="fill-foreground" fontSize="11">{strings.indexOf(r) + 1}. {r.type}</text>
          <text x={x + 24} y="40" textAnchor="middle" className="fill-muted-foreground" fontSize="10">{casingNumber(r.od_in)} in OD</text>
          {cement && <rect x={x - 7} y={y(r.cement_top_ft ?? r.top_ft)} width="62" height={y(r.bottom_ft) - y(r.cement_top_ft ?? r.top_ft)} className="fill-muted stroke-muted-foreground" opacity="0.6" strokeDasharray={r.cement_status === "Planned" ? "4 3" : undefined} />}
          <rect x={x} y={y(r.top_ft)} width="48" height={Math.max(2, y(r.bottom_ft) - y(r.top_ft))} className="fill-background stroke-primary" strokeWidth="3" />
          <line x1={x + 5} x2={x + 43} y1={y(r.bottom_ft)} y2={y(r.bottom_ft)} className="stroke-primary" strokeWidth="5" />
          <text x={x + 24} y="478" textAnchor="middle" className="fill-foreground" fontSize="11">{casingNumber(r.top_ft)}–{casingNumber(r.bottom_ft)}</text>
          <text x={x + 24} y="496" textAnchor="middle" className="fill-muted-foreground" fontSize="10">{r.grade || "Grade pending"}</text>
        </g>;
      })}
    </svg>
    <p className="text-xs text-muted-foreground mt-2">Depth aligned · separate string lanes · radial dimensions not to scale · shaded annulus = entered cement interval</p>
  </div>;
}