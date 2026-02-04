import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const SeismicVisualization = () => {
  // Generate synthetic seismic trace data
  const seismicData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 100; i++) {
      const depth = i * 50; // meters
      const trace1 = Math.sin(i * 0.3) * 50 + Math.random() * 20 - 10;
      const trace2 = Math.cos(i * 0.25 + 1) * 40 + Math.random() * 15 - 7.5;
      const trace3 = Math.sin(i * 0.2 + 2) * 60 + Math.random() * 25 - 12.5;
      
      data.push({
        depth,
        trace1,
        trace2,
        trace3,
        amplitude: (trace1 + trace2 + trace3) / 3,
      });
    }
    return data;
  }, []);

  // Horizon markers
  const horizons = [
    { depth: 500, name: "Top Reservoir", color: "hsl(var(--success))" },
    { depth: 1200, name: "Base Sandstone", color: "hsl(var(--primary))" },
    { depth: 2000, name: "Fault Zone", color: "hsl(var(--destructive))" },
    { depth: 3500, name: "Basement", color: "hsl(var(--muted-foreground))" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">Depth: {label}m</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Seismic Amplitude Section</h4>
          <p className="text-sm text-muted-foreground">Multi-trace seismic interpretation with horizon picks</p>
        </div>
        <div className="flex gap-2">
          {horizons.map((h) => (
            <div key={h.name} className="flex items-center gap-1 text-xs">
              <div className="w-3 h-0.5" style={{ backgroundColor: h.color }} />
              <span className="text-muted-foreground">{h.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-80 bg-slate-900/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={seismicData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="depth" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              domain={[-100, 100]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Horizon reference lines */}
            {horizons.map((h) => (
              <ReferenceLine
                key={h.name}
                x={h.depth}
                stroke={h.color}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            ))}

            {/* Seismic traces */}
            <Area
              type="monotone"
              dataKey="trace1"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              name="Trace 1"
            />
            <Line
              type="monotone"
              dataKey="trace2"
              stroke="hsl(var(--accent))"
              strokeWidth={1.5}
              dot={false}
              name="Trace 2"
            />
            <Line
              type="monotone"
              dataKey="trace3"
              stroke="hsl(var(--success))"
              strokeWidth={1.5}
              dot={false}
              name="Trace 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Attribute Analysis */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-primary/10 rounded-lg text-center">
          <p className="text-lg font-bold text-primary">0.85</p>
          <p className="text-xs text-muted-foreground">Coherence</p>
        </div>
        <div className="p-3 bg-accent/10 rounded-lg text-center">
          <p className="text-lg font-bold text-accent">-12°</p>
          <p className="text-xs text-muted-foreground">Dip Angle</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg text-center">
          <p className="text-lg font-bold text-success">2.4 km/s</p>
          <p className="text-xs text-muted-foreground">Interval Velocity</p>
        </div>
        <div className="p-3 bg-warning/10 rounded-lg text-center">
          <p className="text-lg font-bold text-warning">0.12</p>
          <p className="text-xs text-muted-foreground">AVO Gradient</p>
        </div>
      </div>
    </div>
  );
};

export default SeismicVisualization;
