import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

const WellLogVisualization = () => {
  // Generate synthetic well log data
  const wellLogData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 50; i++) {
      const depth = 2800 + i * 20; // meters TVD
      
      // Gamma Ray (0-150 API)
      const baseGR = depth > 2900 && depth < 3200 ? 30 : 80;
      const gammaRay = baseGR + Math.random() * 40 - 20;
      
      // Resistivity (0.2-200 ohm.m, log scale)
      const baseRes = depth > 2900 && depth < 3200 ? 50 : 5;
      const resistivity = baseRes * (0.8 + Math.random() * 0.4);
      
      // Porosity (0-40%)
      const basePor = depth > 2900 && depth < 3200 ? 22 : 8;
      const porosity = basePor + Math.random() * 6 - 3;
      
      // Density (1.8-2.8 g/cc)
      const baseDen = depth > 2900 && depth < 3200 ? 2.2 : 2.5;
      const density = baseDen + Math.random() * 0.1 - 0.05;
      
      // Water Saturation (0-100%)
      const baseSw = depth > 2900 && depth < 3200 ? 25 : 100;
      const waterSat = Math.min(100, Math.max(0, baseSw + Math.random() * 20 - 10));

      data.push({
        depth,
        gammaRay: Math.max(0, gammaRay),
        resistivity: Math.max(0.2, resistivity),
        porosity: Math.max(0, Math.min(40, porosity)),
        density,
        waterSat,
      });
    }
    return data;
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">Depth: {label}m TVD</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              {entry.name === 'Porosity' && '%'}
              {entry.name === 'Water Sat' && '%'}
              {entry.name === 'Gamma Ray' && ' API'}
              {entry.name === 'Resistivity' && ' Ω·m'}
              {entry.name === 'Density' && ' g/cc'}
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
          <h4 className="font-semibold">Composite Well Log</h4>
          <p className="text-sm text-muted-foreground">GR, Resistivity, Porosity, Density curves with pay zone</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>GR</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Resistivity</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Porosity</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Pay Zone</span>
          </div>
        </div>
      </div>

      <div className="h-80 bg-slate-900/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            layout="vertical"
            data={wellLogData}
            margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              type="number" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              domain={[0, 150]}
            />
            <YAxis 
              dataKey="depth"
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              reversed
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Pay Zone highlight */}
            <ReferenceArea
              y1={2900}
              y2={3200}
              fill="hsl(var(--success))"
              fillOpacity={0.15}
              stroke="hsl(var(--success))"
              strokeDasharray="3 3"
            />

            {/* Log curves */}
            <Line
              type="monotone"
              dataKey="gammaRay"
              stroke="#eab308"
              strokeWidth={1.5}
              dot={false}
              name="Gamma Ray"
            />
            <Area
              type="monotone"
              dataKey="porosity"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              name="Porosity"
            />
            <Line
              type="monotone"
              dataKey="resistivity"
              stroke="#ef4444"
              strokeWidth={1.5}
              dot={false}
              name="Resistivity"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Petrophysical Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Avg. Porosity</span>
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">Good</span>
          </div>
          <p className="text-2xl font-bold text-primary">18.5%</p>
          <p className="text-xs text-muted-foreground mt-1">Pay zone: 2900-3200m</p>
        </div>
        <div className="p-4 bg-accent/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Permeability</span>
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">Excellent</span>
          </div>
          <p className="text-2xl font-bold text-accent">245 mD</p>
          <p className="text-xs text-muted-foreground mt-1">Core-calibrated</p>
        </div>
        <div className="p-4 bg-success/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Oil Saturation</span>
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">High</span>
          </div>
          <p className="text-2xl font-bold text-success">72%</p>
          <p className="text-xs text-muted-foreground mt-1">Sw = 28%</p>
        </div>
      </div>
    </div>
  );
};

export default WellLogVisualization;
