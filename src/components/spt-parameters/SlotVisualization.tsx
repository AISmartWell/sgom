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
  const svgWidth = 520;
  const svgHeight = 440;
  const margin = { top: 45, right: 60, bottom: 55, left: 60 };

  const zoneStart = parseFloat(perforationZone.split("-")[0]);
  const zoneEnd = parseFloat(perforationZone.split("-")[1]);
  const zoneLength = zoneEnd - zoneStart; // ft

  const casingCircumference = Math.PI * casingOD; // inches
  const drawW = svgWidth - margin.left - margin.right;
  const drawH = svgHeight - margin.top - margin.bottom;

  // Schematic scale — NOT real proportions
  // Show ~12 rows max for readability
  const rowSpacingFt = rowSpacing / 12;
  const totalRows = Math.floor(zoneLength / rowSpacingFt);
  const displayRows = Math.min(totalRows, 14);

  // Vertical spacing between rows in SVG
  const rowGapPx = drawH / (displayRows + 1);

  // Slot size in SVG — schematic, proportional to controls but not to real scale
  const slotHPx = Math.max(6, Math.min(rowGapPx * 0.6, slotLength / 8));
  const slotWPx = Math.max(2, Math.min(drawW / (slotsPerRow * 3), slotWidth / 2));

  // Horizontal slot positions — evenly spaced around circumference
  const slotPositions = (spr: number): number[] => {
    const step = drawW / spr;
    return Array.from({ length: spr }, (_, i) => step * i + step / 2);
  };

  const positions = slotPositions(slotsPerRow);

  // Real calculations
  const totalSlots = totalRows * slotsPerRow;
  const openAreaSqIn = totalSlots * (slotLength / 25.4) * (slotWidth / 25.4);
  const openAreaSqFt = openAreaSqIn / 144;
  const slotLengthIn = slotLength / 25.4;
  const slotWidthIn = slotWidth / 25.4;

  // Depth labels for displayed rows (interpolated)
  const depthForRow = (i: number) =>
    zoneStart + (i / (displayRows - 1 || 1)) * zoneLength;

  // Circumference ticks
  const circTicks = Array.from({ length: 5 }, (_, i) => ({
    px: (drawW / 4) * i,
    val: ((casingCircumference / 4) * i).toFixed(1),
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Schematic — unrolled casing surface (not to scale)</span>
        <span>{casingOD}″ OD • {casingCircumference.toFixed(1)}″ circ</span>
      </div>

      <svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="rounded-lg"
      >
        {/* Background */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} rx="8" fill="hsl(var(--card))" />

        {/* Casing surface */}
        <rect
          x={margin.left}
          y={margin.top}
          width={drawW}
          height={drawH}
          fill="hsl(var(--muted) / 0.2)"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          rx="2"
        />

        {/* Horizontal grid + depth labels */}
        {Array.from({ length: displayRows }, (_, i) => {
          const y = margin.top + rowGapPx * (i + 1);
          const depth = depthForRow(i);
          return (
            <g key={`row-${i}`}>
              <line
                x1={margin.left}
                y1={y}
                x2={margin.left + drawW}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="0.4"
                strokeDasharray="4,4"
                opacity="0.4"
              />
              {/* Depth label every 3rd row */}
              {(i % 3 === 0 || i === displayRows - 1) && (
                <text
                  x={margin.left - 6}
                  y={y + 3}
                  fontSize="8"
                  fill="hsl(var(--muted-foreground))"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {depth.toFixed(0)} ft
                </text>
              )}
            </g>
          );
        })}

        {/* Circumference ticks */}
        {circTicks.map((t, i) => (
          <g key={`ct-${i}`}>
            <line
              x1={margin.left + t.px}
              y1={margin.top}
              x2={margin.left + t.px}
              y2={margin.top + drawH}
              stroke="hsl(var(--border))"
              strokeWidth="0.4"
              strokeDasharray="4,4"
              opacity="0.3"
            />
            <text
              x={margin.left + t.px}
              y={svgHeight - margin.bottom + 14}
              fontSize="8"
              fill="hsl(var(--muted-foreground))"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {t.val}″
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={margin.left + drawW / 2}
          y={svgHeight - 6}
          fontSize="9"
          fill="hsl(var(--muted-foreground))"
          textAnchor="middle"
          fontWeight="600"
        >
          Circumference (in)
        </text>
        <text
          x={14}
          y={margin.top + drawH / 2}
          fontSize="9"
          fill="hsl(var(--muted-foreground))"
          textAnchor="middle"
          fontWeight="600"
          transform={`rotate(-90, 14, ${margin.top + drawH / 2})`}
        >
          Depth (ft)
        </text>

        {/* Slots — longitudinal (vertical) */}
        {Array.from({ length: displayRows }, (_, ri) => {
          const y = margin.top + rowGapPx * (ri + 1);
          return positions.map((cx, si) => (
            <rect
              key={`s-${ri}-${si}`}
              x={margin.left + cx - slotWPx / 2}
              y={y - slotHPx / 2}
              width={slotWPx}
              height={slotHPx}
              fill="hsl(var(--primary))"
              opacity="0.85"
              rx="0.5"
            >
              <title>
                Row {ri + 1}/{displayRows} • Slot {si + 1}/{slotsPerRow}
                {"\n"}Depth ≈ {depthForRow(ri).toFixed(0)} ft
                {"\n"}Slot: {slotLength}×{slotWidth} mm ({slotLengthIn.toFixed(1)}×{slotWidthIn.toFixed(1)} in)
              </title>
            </rect>
          ));
        })}

        {/* ── Dimension lines ── */}

        {/* Row spacing dimension (right side) */}
        {displayRows >= 2 && (() => {
          const y1 = margin.top + rowGapPx;
          const y2 = margin.top + rowGapPx * 2;
          const dx = margin.left + drawW + 8;
          return (
            <g>
              <line x1={dx} y1={y1} x2={dx} y2={y2} stroke="hsl(var(--primary))" strokeWidth="1" />
              <line x1={dx - 3} y1={y1} x2={dx + 3} y2={y1} stroke="hsl(var(--primary))" strokeWidth="0.8" />
              <line x1={dx - 3} y1={y2} x2={dx + 3} y2={y2} stroke="hsl(var(--primary))" strokeWidth="0.8" />
              <text
                x={dx + 5}
                y={(y1 + y2) / 2 + 3}
                fontSize="8"
                fill="hsl(var(--primary))"
                fontFamily="monospace"
                fontWeight="600"
              >
                {rowSpacing}″
              </text>
              <text
                x={dx + 5}
                y={(y1 + y2) / 2 + 12}
                fontSize="7"
                fill="hsl(var(--muted-foreground))"
                fontFamily="monospace"
              >
                spacing
              </text>
            </g>
          );
        })()}

        {/* Slot length dimension (next to first slot) */}
        {displayRows >= 1 && (() => {
          const y = margin.top + rowGapPx;
          const x = margin.left + positions[0] + slotWPx / 2 + 6;
          return (
            <g>
              <line x1={x} y1={y - slotHPx / 2} x2={x} y2={y + slotHPx / 2} stroke="hsl(var(--destructive))" strokeWidth="0.8" />
              <line x1={x - 2} y1={y - slotHPx / 2} x2={x + 2} y2={y - slotHPx / 2} stroke="hsl(var(--destructive))" strokeWidth="0.6" />
              <line x1={x - 2} y1={y + slotHPx / 2} x2={x + 2} y2={y + slotHPx / 2} stroke="hsl(var(--destructive))" strokeWidth="0.6" />
              <text
                x={x + 4}
                y={y + 2}
                fontSize="7"
                fill="hsl(var(--destructive))"
                fontFamily="monospace"
              >
                L={slotLength}mm
              </text>
            </g>
          );
        })()}

        {/* Slot width dimension (above first slot) */}
        {displayRows >= 1 && (() => {
          const y = margin.top + rowGapPx - slotHPx / 2 - 6;
          const cx = margin.left + positions[0];
          return (
            <g>
              <line x1={cx - slotWPx / 2} y1={y} x2={cx + slotWPx / 2} y2={y} stroke="hsl(var(--destructive))" strokeWidth="0.8" />
              <line x1={cx - slotWPx / 2} y1={y - 2} x2={cx - slotWPx / 2} y2={y + 2} stroke="hsl(var(--destructive))" strokeWidth="0.6" />
              <line x1={cx + slotWPx / 2} y1={y - 2} x2={cx + slotWPx / 2} y2={y + 2} stroke="hsl(var(--destructive))" strokeWidth="0.6" />
              <text
                x={cx}
                y={y - 3}
                fontSize="7"
                fill="hsl(var(--destructive))"
                textAnchor="middle"
                fontFamily="monospace"
              >
                W={slotWidth}mm
              </text>
            </g>
          );
        })()}

        {/* Slot-to-slot spacing dimension (between first two slots, top) */}
        {positions.length >= 2 && (() => {
          const y = margin.top + 14;
          const x1p = margin.left + positions[0];
          const x2p = margin.left + positions[1];
          return (
            <g>
              <line x1={x1p} y1={y} x2={x2p} y2={y} stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" strokeDasharray="2,2" />
              <text
                x={(x1p + x2p) / 2}
                y={y - 3}
                fontSize="7"
                fill="hsl(var(--muted-foreground))"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {(casingCircumference / slotsPerRow).toFixed(1)}″
              </text>
            </g>
          );
        })()}

        {/* "NOT TO SCALE" watermark */}
        <text
          x={margin.left + drawW - 4}
          y={margin.top + drawH - 6}
          fontSize="7"
          fill="hsl(var(--muted-foreground))"
          textAnchor="end"
          opacity="0.5"
          fontFamily="monospace"
        >
          SCHEMATIC
        </text>

        {/* Info: rows shown / total */}
        {totalRows > displayRows && (
          <text
            x={margin.left + drawW - 4}
            y={margin.top + drawH - 16}
            fontSize="7"
            fill="hsl(var(--muted-foreground))"
            textAnchor="end"
            opacity="0.6"
            fontFamily="monospace"
          >
            Showing {displayRows} of {totalRows} rows
          </text>
        )}
      </svg>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-muted/20 text-center">
          <p className="text-muted-foreground">Total Rows</p>
          <p className="font-mono font-bold text-foreground">{totalRows}</p>
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
          <p className="font-mono font-bold text-foreground">{slotLengthIn.toFixed(1)}×{slotWidthIn.toFixed(1)} in</p>
        </div>
      </div>
    </div>
  );
};

export default SlotVisualization;
