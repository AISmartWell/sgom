import { useEffect, useState } from "react";

interface StageVisualizationProps {
  stageKey: string;
  metrics: { label: string; value: string; color?: string }[];
}

// Animated gauge arc
const GaugeArc = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => {
  const [animValue, setAnimValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimValue(value), 50);
    return () => clearTimeout(t);
  }, [value]);

  const pct = Math.min(animValue / max, 1);
  const angle = pct * 180;
  const r = 36;
  const cx = 44;
  const cy = 42;
  const rad = (a: number) => ((a - 180) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(0));
  const y1 = cy + r * Math.sin(rad(0));
  const x2 = cx + r * Math.cos(rad(angle));
  const y2 = cy + r * Math.sin(rad(angle));
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="52" viewBox="0 0 88 52">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" strokeLinecap="round" />
        {angle > 0 && (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="bold">
          {Math.round(animValue)}
        </text>
      </svg>
      <span className="text-[10px] text-muted-foreground -mt-1">{label}</span>
    </div>
  );
};

// Animated bar
const AnimatedBar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW((value / max) * 100), 50);
    return () => clearTimeout(t);
  }, [value, max]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
    </div>
  );
};

// Mini sparkline
const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle
          key={i}
          cx={(i / (data.length - 1)) * w}
          cy={h - ((v - min) / range) * (h - 4) - 2}
          r="2"
          fill={color}
          className="animate-scale-in"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </svg>
  );
};

// Rock composition donut
const MiniDonut = ({ segments }: { segments: { pct: number; color: string; label: string }[] }) => {
  const r = 28;
  const cx = 36;
  const cy = 36;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72">
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * circ;
          const o = offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="8"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-o}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-700 ease-out"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          );
        })}
      </svg>
      <div className="space-y-0.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px]">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Generate fake decline data
const genDeclineData = (initial: number, rate: number, months: number) => {
  return Array.from({ length: months }, (_, i) => initial * Math.exp((-rate / 100) * (i / 12)));
};

export const StageVisualization = ({ stageKey, metrics }: StageVisualizationProps) => {
  const parseNum = (val: string) => parseFloat(val.replace(/[^0-9.]/g, "")) || 0;

  switch (stageKey) {
    case "field_scan": {
      return (
        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg animate-fade-in">
          <div className="relative w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
            <svg width="80" height="80" viewBox="0 0 80 80">
              {/* Radar sweep */}
              <circle cx="40" cy="40" r="30" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3" />
              <circle cx="40" cy="40" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3" />
              <circle cx="40" cy="40" r="10" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3" />
              <line x1="40" y1="40" x2="40" y2="10" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6">
                <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="3s" repeatCount="indefinite" />
              </line>
              <circle cx="52" cy="28" r="2.5" fill="hsl(var(--success))" className="animate-pulse" />
              <circle cx="30" cy="50" r="2" fill="hsl(var(--warning))" className="animate-pulse" />
              <circle cx="55" cy="48" r="1.5" fill="hsl(var(--primary))" className="animate-pulse" />
            </svg>
          </div>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>Scanning area: <span className="font-medium text-foreground">{metrics[1]?.value}</span></p>
            <p>Wells detected: <span className="font-medium text-foreground">3</span></p>
            <div className="flex gap-1 mt-1">
              {["Active", "Idle", "Monitoring"].map((s) => (
                <span key={s} className="px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary">{s}</span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case "classification": {
      const quality = parseNum(metrics[3]?.value || "90");
      return (
        <div className="flex items-center gap-5 p-3 bg-muted/30 rounded-lg animate-fade-in">
          <GaugeArc value={quality} max={100} color="hsl(var(--success))" label="Data Quality" />
          <div className="flex-1 space-y-1.5">
            <AnimatedBar value={85} max={100} color="hsl(var(--primary))" label="Production Data" />
            <AnimatedBar value={72} max={100} color="hsl(var(--success))" label="Geological Data" />
            <AnimatedBar value={quality} max={100} color="hsl(var(--warning))" label="Completeness" />
          </div>
        </div>
      );
    }

    case "core_analysis": {
      const porosity = parseNum(metrics[1]?.value || "14");
      const perm = parseNum(metrics[2]?.value || "80");
      const fractures = parseNum(metrics[3]?.value || "4");
      return (
        <div className="flex items-center gap-5 p-3 bg-muted/30 rounded-lg animate-fade-in">
          <MiniDonut segments={[
            { pct: 55, color: "hsl(var(--primary))", label: "Quartz" },
            { pct: 18, color: "hsl(var(--warning))", label: "Feldspar" },
            { pct: 15, color: "hsl(var(--success))", label: "Calcite" },
            { pct: 12, color: "hsl(var(--destructive))", label: "Clay" },
          ]} />
          <div className="flex gap-4">
            <GaugeArc value={porosity} max={30} color="hsl(var(--primary))" label="Porosity %" />
            <GaugeArc value={fractures} max={10} color="hsl(var(--destructive))" label="Fractures" />
          </div>
        </div>
      );
    }

    case "cumulative": {
      const rate = parseNum(metrics[0]?.value || "15");
      const decline = parseNum(metrics[1]?.value || "12");
      const data = genDeclineData(rate * 3.5, decline, 24);
      return (
        <div className="p-3 bg-muted/30 rounded-lg animate-fade-in space-y-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Production Forecast (24 months)</span>
            <span className="text-destructive font-medium">↓ {decline.toFixed(1)}%/yr</span>
          </div>
          <MiniSparkline data={data} color="hsl(var(--destructive))" />
        </div>
      );
    }

    case "spt_projection": {
      const score = parseNum(metrics[2]?.value || "80");
      const wc = parseNum(metrics[0]?.value || "45");
      const inflow = parseNum(metrics[1]?.value || "30");
      return (
        <div className="flex items-center gap-5 p-3 bg-muted/30 rounded-lg animate-fade-in">
          <GaugeArc value={score} max={100} color={score > 75 ? "hsl(var(--success))" : "hsl(var(--warning))"} label="SPT Score" />
          <div className="flex-1 space-y-1.5">
            <AnimatedBar value={wc} max={100} color={wc > 55 ? "hsl(var(--destructive))" : "hsl(var(--success))"} label={`Water Cut ${wc}%`} />
            <AnimatedBar value={inflow} max={60} color="hsl(var(--primary))" label={`Proj. Inflow ${inflow.toFixed(1)} bbl/d`} />
          </div>
        </div>
      );
    }

    case "economic": {
      const roi = parseNum(metrics[2]?.value || "300");
      const payback = parseNum(metrics[3]?.value || "2");
      // Revenue vs cost comparison bars
      const cost = parseNum(metrics[0]?.value || "30");
      const revenue = parseNum(metrics[1]?.value || "200");
      return (
        <div className="flex items-center gap-5 p-3 bg-muted/30 rounded-lg animate-fade-in">
          <GaugeArc value={Math.min(roi, 500)} max={500} color={roi > 200 ? "hsl(var(--success))" : "hsl(var(--warning))"} label={`ROI ${roi}%`} />
          <div className="flex-1 space-y-1.5">
            <AnimatedBar value={cost} max={Math.max(cost, revenue)} color="hsl(var(--destructive))" label={`Cost $${cost}k`} />
            <AnimatedBar value={revenue} max={Math.max(cost, revenue)} color="hsl(var(--success))" label={`Revenue $${revenue}k/yr`} />
            <div className="text-[10px] text-muted-foreground">
              Payback: <span className="font-medium text-foreground">{payback.toFixed(1)} months</span>
            </div>
          </div>
        </div>
      );
    }

    case "geophysical": {
      const porosity = parseNum(metrics[2]?.value || "14");
      const perm = parseNum(metrics[3]?.value || "80");
      // Simulated well log
      const logData = Array.from({ length: 20 }, () => 40 + Math.random() * 60);
      return (
        <div className="flex items-center gap-5 p-3 bg-muted/30 rounded-lg animate-fade-in">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground mb-1">Well Log (GR)</div>
            <div className="flex items-end gap-0.5 h-10">
              {logData.map((v, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-t transition-all duration-500 ease-out"
                  style={{
                    height: `${(v / 100) * 40}px`,
                    background: v > 70 ? "hsl(var(--warning))" : "hsl(var(--primary))",
                    animationDelay: `${i * 40}ms`,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <GaugeArc value={porosity} max={25} color="hsl(var(--primary))" label="Porosity %" />
            <GaugeArc value={perm} max={200} color="hsl(var(--success))" label="Perm. mD" />
          </div>
        </div>
      );
    }

    case "eor": {
      const score = parseNum(metrics[0]?.value || "80");
      const uplift = parseNum(metrics[3]?.value || "3");
      // Before/after production comparison
      const beforeData = Array.from({ length: 12 }, (_, i) => 30 * Math.exp(-0.15 * i));
      const afterData = Array.from({ length: 12 }, (_, i) => 30 * uplift * Math.exp(-0.08 * i));
      return (
        <div className="p-3 bg-muted/30 rounded-lg animate-fade-in space-y-2">
          <div className="flex items-center gap-5">
            <GaugeArc value={score} max={100} color={score > 75 ? "hsl(var(--success))" : "hsl(var(--warning))"} label="EOR Score" />
            <div className="flex-1 space-y-1">
              <div className="text-[10px] text-muted-foreground">Production: Before vs After SPT</div>
              <div className="relative">
                <MiniSparkline data={beforeData} color="hsl(var(--muted-foreground))" />
                <div className="absolute inset-0">
                  <MiniSparkline data={afterData} color="hsl(var(--success))" />
                </div>
              </div>
              <div className="flex gap-3 text-[9px]">
                <span className="text-muted-foreground">— Before</span>
                <span className="text-success">— After SPT ({uplift.toFixed(1)}x)</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};
