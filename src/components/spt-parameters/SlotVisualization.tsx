import React from "react";

interface SlotVisualizationProps {
  casingOD: number;
  casingID: number;
  slotLength: number; // mm
  slotWidth: number; // mm
  slotsPerRow: number;
  rowSpacing: number; // inches
  perforationZone: string; // "3800-4100"
}

const SlotVisualization: React.FC<SlotVisualizationProps> = ({
  casingOD,
  casingID,
  slotLength,
  slotWidth,
  slotsPerRow,
  rowSpacing,
  perforationZone,
}) => {
  const svgWidth = 480;
  const svgHeight = 420;
  const margin = { top: 40, right: 30, bottom: 50, left: 55 };

  const zoneStart = parseFloat(perforationZone.split("-")[0]);
  const zoneEnd = parseFloat(perforationZone.split("-")[1]);
  const zoneLength = zoneEnd - zoneStart; // ft

  // Unrolled casing surface: width = circumference, height = perf zone length
  const casingCircumference = Math.PI * casingOD; // inches
  const drawW = svgWidth - margin.left - margin.right;
  const drawH = svgHeight - margin.top - margin.bottom;

  // Scale: inches → SVG pixels (horizontal), ft → SVG pixels (vertical)
  const scaleX = drawW / casingCircumference;
  const scaleY = drawH / zoneLength;

  // Slot dimensions in SVG
  const slotH = Math.max(3, (slotLength / 25.4) * scaleX); // mm→in→px (length is along casing depth)
  const slotW = Math.max(1.5, (slotWidth / 25.4) * scaleX); // mm→in→px

  // Row spacing in ft
  const rowSpacingFt = rowSpacing / 12;

  // Generate rows and slots
  const rows: Array<{ depthFt: number; slots: Array<{ cx: number }> }> = [];
  let depth = 0;
  while (depth < zoneLength) {
    const angleStep = casingCircumference / slotsPerRow;
    const slotsInRow: Array<{ cx: number }> = [];
    for (let i = 0; i < slotsPerRow; i++) {
      slotsInRow.push({ cx: angleStep * i + angleStep / 2 });
    }
    rows.push({ depthFt: depth, slots: slotsInRow });
    depth += rowSpacingFt;
  }

  const totalSlots = rows.reduce((sum, r) => sum + r.slots.length, 0);
  const openAreaSqIn = totalSlots * (slotLength / 25.4) * (slotWidth / 25.4);
  const openAreaSqFt = openAreaSqIn / 144;

  // Depth axis ticks
  const depthTicks: number[] = [];
  const tickStep = zoneLength > 200 ? 50 : zoneLength > 100 ? 25 : 10;
  for (let d = 0; d <= zoneLength; d += tickStep) {
    depthTicks.push(d);
  }

  // Circumference ticks
  const circTicks: number[] = [];
  for (let c = 0; c <= casingCircumference; c += Math.round(casingCircumference / 4)) {
    circTicks.push(c);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Unrolled casing surface</span>
        <span>•</span>
        <span>{casingOD}″ OD × {casingCircumference.toFixed(1)}″ circumference</span>
      </div>

      <svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="rounded-lg"
      >
        {/* Background */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} rx="8" fill="hsl(var(--card))" />

        {/* Casing surface area */}
        <rect
          x={margin.left}
          y={margin.top}
          width={drawW}
          height={drawH}
          fill="hsl(var(--muted) / 0.3)"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          rx="2"
        />

        {/* Grid lines - horizontal (depth) */}
        {depthTicks.map((d) => {
          const y = margin.top + d * scaleY;
          return (
            <g key={`dg-${d}`}>
              <line
                x1={margin.left}
                y1={y}
                x2={margin.left + drawW}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              <text
                x={margin.left - 5}
                y={y + 3}
                fontSize="9"
                fill="hsl(var(--muted-foreground))"
                textAnchor="end"
                fontFamily="monospace"
              >
                {(zoneStart + d).toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Grid lines - vertical (circumference) */}
        {circTicks.map((c) => {
          const x = margin.left + c * scaleX;
          return (
            <g key={`cg-${c}`}>
              <line
                x1={x}
                y1={margin.top}
                x2={x}
                y2={margin.top + drawH}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              <text
                x={x}
                y={svgHeight - margin.bottom + 15}
                fontSize="9"
                fill="hsl(var(--muted-foreground))"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {c.toFixed(0)}″
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={margin.left - 10}
          y={margin.top - 10}
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
          textAnchor="end"
          fontWeight="600"
        >
          Depth (ft)
        </text>
        <text
          x={margin.left + drawW / 2}
          y={svgHeight - 8}
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
          textAnchor="middle"
          fontWeight="600"
        >
          Circumference (in)
        </text>

        {/* Slots */}
        {rows.map((row, ri) =>
          row.slots.map((slot, si) => {
            const x = margin.left + slot.cx * scaleX - slotW / 2;
            const y = margin.top + row.depthFt * scaleY - slotH / 2;
            return (
              <rect
                key={`s-${ri}-${si}`}
                x={x}
                y={y}
                width={slotW}
                height={slotH}
                fill="hsl(var(--primary))"
                opacity="0.85"
                rx="0.5"
              >
                <title>
                  Row {ri + 1}, Slot {si + 1} — Depth: {(zoneStart + row.depthFt).toFixed(0)} ft
                </title>
              </rect>
            );
          })
        )}

        {/* Row spacing indicator */}
        {rows.length >= 2 && (
          <g>
            <line
              x1={margin.left + drawW + 5}
              y1={margin.top + rows[0].depthFt * scaleY}
              x2={margin.left + drawW + 5}
              y2={margin.top + rows[1].depthFt * scaleY}
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              markerStart="url(#arrowUp)"
              markerEnd="url(#arrowDown)"
            />
            <text
              x={margin.left + drawW + 10}
              y={margin.top + ((rows[0].depthFt + rows[1].depthFt) / 2) * scaleY + 3}
              fontSize="8"
              fill="hsl(var(--primary))"
              fontFamily="monospace"
            >
              {rowSpacing}″
            </text>
          </g>
        )}

        {/* Arrow markers */}
        <defs>
          <marker id="arrowUp" markerWidth="4" markerHeight="4" refX="2" refY="4" orient="auto">
            <path d="M0,4 L2,0 L4,4" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.8" />
          </marker>
          <marker id="arrowDown" markerWidth="4" markerHeight="4" refX="2" refY="0" orient="auto">
            <path d="M0,0 L2,4 L4,0" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.8" />
          </marker>
        </defs>
      </svg>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-muted/20 text-center">
          <p className="text-muted-foreground">Rows</p>
          <p className="font-mono font-bold text-foreground">{rows.length}</p>
        </div>
        <div className="p-2 rounded bg-muted/20 text-center">
          <p className="text-muted-foreground">Total Slots</p>
          <p className="font-mono font-bold text-foreground">{totalSlots}</p>
        </div>
        <div className="p-2 rounded bg-muted/20 text-center">
          <p className="text-muted-foreground">Open Area</p>
          <p className="font-mono font-bold text-foreground">{openAreaSqFt.toFixed(2)} ft²</p>
        </div>
        <div className="p-2 rounded bg-muted/20 text-center">
          <p className="text-muted-foreground">Slot Size</p>
          <p className="font-mono font-bold text-foreground">{slotLength}×{slotWidth} mm</p>
        </div>
      </div>
    </div>
  );
};

export default SlotVisualization;
