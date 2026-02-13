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
  const svgWidth = 500;
  const svgHeight = 400;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Casing dimensions in SVG units (scale down for visualization)
  const outerRadius = 80;
  const innerRadius = (casingID / casingOD) * outerRadius;

  // Perforation zone height in SVG
  const zoneStart = parseFloat(perforationZone.split("-")[0]);
  const zoneEnd = parseFloat(perforationZone.split("-")[1]);
  const zoneLength = zoneEnd - zoneStart;
  
  // Scale perforation zone to SVG height (max 300px)
  const svgZoneHeight = Math.min(300, (zoneLength / 1000) * 50);
  const zoneStartY = centerY - svgZoneHeight / 2;
  const zoneEndY = centerY + svgZoneHeight / 2;

  // Convert slot dimensions to SVG scale
  const slotLengthSvg = (slotLength / 25.4 / zoneLength) * svgZoneHeight; // mm to inches to SVG
  const slotWidthSvg = Math.max(1.5, slotWidth / 50); // visual width

  // Generate slot positions
  const slots: Array<{ x: number; y: number; angle: number }> = [];
  
  // Spacing between rows in SVG
  const rowSpacingSvg = (rowSpacing / zoneLength) * svgZoneHeight;
  
  // Generate rows
  let currentY = zoneStartY;
  let rowIndex = 0;
  
  while (currentY < zoneEndY) {
    // Distribute slots around the circumference
    const angleStep = 360 / slotsPerRow;
    
    for (let i = 0; i < slotsPerRow; i++) {
      const angle = i * angleStep;
      const radians = (angle * Math.PI) / 180;
      
      // Position on casing surface
      const x = centerX + Math.cos(radians) * ((outerRadius + innerRadius) / 2);
      const y = currentY;
      
      slots.push({ x, y, angle });
    }
    
    currentY += rowSpacingSvg;
    rowIndex++;
  }

  // Draw slot as elongated rectangle
  const drawSlot = (x: number, y: number, angle: number) => {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Slot vertices (tangent to casing surface, longitudinal)
    const halfLength = slotLengthSvg / 2;
    const halfWidth = slotWidthSvg / 2;

    // Slot is oriented vertically (along well depth) but rotated around casing
    const p1x = x - halfLength * sin - halfWidth * cos;
    const p1y = y - halfLength * cos + halfWidth * sin;
    
    const p2x = x + halfLength * sin - halfWidth * cos;
    const p2y = y + halfLength * cos + halfWidth * sin;
    
    const p3x = x + halfLength * sin + halfWidth * cos;
    const p3y = y + halfLength * cos - halfWidth * sin;
    
    const p4x = x - halfLength * sin + halfWidth * cos;
    const p4y = y - halfLength * cos - halfWidth * sin;

    return `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} Z`;
  };

  // Count total rows and slots
  const totalRows = Math.ceil((zoneEndY - zoneStartY) / rowSpacingSvg);

  return (
    <div className="space-y-3">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="border border-border/30 rounded-lg bg-muted/10"
      >
        {/* Casing outline */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* Perforation zone indicator */}
        <rect
          x={centerX - outerRadius - 15}
          y={zoneStartY}
          width="12"
          height={svgZoneHeight}
          fill="hsl(var(--accent))"
          opacity="0.3"
          rx="2"
        />
        <text
          x={centerX - outerRadius - 30}
          y={zoneStartY - 5}
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
          textAnchor="end"
        >
          Perf
        </text>

        {/* Slots */}
        {slots.map((slot, i) => (
          <path
            key={i}
            d={drawSlot(slot.x, slot.y, slot.angle)}
            fill="hsl(var(--primary))"
            opacity="0.8"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
          />
        ))}

        {/* Center depth marker */}
        <text
          x={centerX}
          y={centerY + outerRadius + 20}
          fontSize="12"
          fill="hsl(var(--muted-foreground))"
          textAnchor="middle"
          fontWeight="bold"
        >
          {zoneStart}-{zoneEnd} ft
        </text>
      </svg>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-muted/20">
          <p className="text-muted-foreground">Rows</p>
          <p className="font-mono font-medium text-foreground">{totalRows}</p>
        </div>
        <div className="p-2 rounded bg-muted/20">
          <p className="text-muted-foreground">Slots/Row</p>
          <p className="font-mono font-medium text-foreground">{slotsPerRow}</p>
        </div>
        <div className="p-2 rounded bg-muted/20">
          <p className="text-muted-foreground">Total Slots</p>
          <p className="font-mono font-medium text-foreground">{slots.length}</p>
        </div>
        <div className="p-2 rounded bg-muted/20">
          <p className="text-muted-foreground">Slot Size</p>
          <p className="font-mono font-medium text-foreground">
            {slotLength} × {slotWidth} mm
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlotVisualization;
