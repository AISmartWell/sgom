import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { ArrowDownUp } from "lucide-react";
import { arpsRate } from "@/lib/economics-config";

interface Props {
  baseOilPrice: number;
  baseTreatmentCost: number;
  baseOpex: number;
  wells: { name: string; addedProd: number; Di: number; b: number }[];
}

function calcROI(
  wells: Props["wells"],
  price: number,
  capex: number,
  opex: number,
  diFactor: number,
): number {
  let totalNet = 0;
  let totalCapex = 0;
  for (const w of wells) {
    const di = w.Di * diFactor;
    let net = 0;
    for (let m = 1; m <= 60; m++) {
      net += arpsRate(w.addedProd, di, w.b, m) * 30.44 * (price - opex);
    }
    totalNet += net;
    totalCapex += capex;
  }
  return totalCapex > 0 ? ((totalNet - totalCapex) / totalCapex) * 100 : 0;
}

const VARIATION_OPTIONS = [0.1, 0.2, 0.3, 0.5] as const;

const TornadoChart = ({ baseOilPrice, baseTreatmentCost, baseOpex, wells }: Props) => {
  const [variation, setVariation] = useState(0.3);

  const data = useMemo(() => {
    const baseROI = calcROI(wells, baseOilPrice, baseTreatmentCost, baseOpex, 1);
    const lo = 1 - variation;
    const hi = 1 + variation;

    const params = [
      {
        name: "Oil Price",
        low: calcROI(wells, baseOilPrice * lo, baseTreatmentCost, baseOpex, 1),
        high: calcROI(wells, baseOilPrice * hi, baseTreatmentCost, baseOpex, 1),
        lowLabel: `$${(baseOilPrice * lo).toFixed(0)}`,
        highLabel: `$${(baseOilPrice * hi).toFixed(0)}`,
      },
      {
        name: "CAPEX",
        low: calcROI(wells, baseOilPrice, baseTreatmentCost * hi, baseOpex, 1),
        high: calcROI(wells, baseOilPrice, baseTreatmentCost * lo, baseOpex, 1),
        lowLabel: `$${((baseTreatmentCost * hi) / 1000).toFixed(0)}K`,
        highLabel: `$${((baseTreatmentCost * lo) / 1000).toFixed(0)}K`,
      },
      {
        name: "OPEX",
        low: calcROI(wells, baseOilPrice, baseTreatmentCost, baseOpex * hi, 1),
        high: calcROI(wells, baseOilPrice, baseTreatmentCost, baseOpex * lo, 1),
        lowLabel: `$${(baseOpex * hi).toFixed(0)}`,
        highLabel: `$${(baseOpex * lo).toFixed(0)}`,
      },
      {
        name: "Decline Rate",
        low: calcROI(wells, baseOilPrice, baseTreatmentCost, baseOpex, hi),
        high: calcROI(wells, baseOilPrice, baseTreatmentCost, baseOpex, lo),
        lowLabel: `×${hi.toFixed(1)}`,
        highLabel: `×${lo.toFixed(1)}`,
      },
    ];

    return params
      .map((p) => ({
        name: p.name,
        lowDelta: p.low - baseROI,
        highDelta: p.high - baseROI,
        lowLabel: p.lowLabel,
        highLabel: p.highLabel,
        swing: Math.abs(p.high - p.low),
      }))
      .sort((a, b) => b.swing - a.swing)
      .map((p) => ({
        ...p,
        negative: Math.min(p.lowDelta, p.highDelta),
        positive: Math.max(p.lowDelta, p.highDelta),
      }));
  }, [wells, baseOilPrice, baseTreatmentCost, baseOpex, variation]);

  const baseROI = useMemo(
    () => calcROI(wells, baseOilPrice, baseTreatmentCost, baseOpex, 1),
    [wells, baseOilPrice, baseTreatmentCost, baseOpex],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4 text-primary" />
            Tornado Chart — Parameter Sensitivity on ROI
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {VARIATION_OPTIONS.map((v) => (
              <Badge
                key={v}
                variant={variation === v ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setVariation(v)}
              >
                ±{(v * 100).toFixed(0)}%
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Shows how ±{(variation * 100).toFixed(0)}% variation in each parameter affects ROI (base: {baseROI.toFixed(0)}%)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 90, right: 30, top: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
              label={{ value: "ΔROI (%)", position: "insideBottom", offset: -5 }}
            />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value > 0 ? "+" : ""}${value.toFixed(1)}%`,
                name === "negative" ? "Downside" : "Upside",
              ]}
              labelFormatter={(label) => {
                const item = data.find((d) => d.name === label);
                return item ? `${label} (${item.lowLabel} → ${item.highLabel})` : label;
              }}
            />
            <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={2} />
            <Bar dataKey="negative" stackId="a" name="negative" radius={[4, 0, 0, 4]}>
              {data.map((_, i) => (
                <Cell key={i} fill="hsl(0, 72%, 51%)" fillOpacity={0.7} />
              ))}
            </Bar>
            <Bar dataKey="positive" stackId="a" name="positive" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill="hsl(142, 71%, 45%)" fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend & detail table */}
        <div className="mt-4 grid grid-cols-4 gap-3 text-center text-xs">
          {data.map((d) => (
            <div key={d.name} className="p-2 rounded-lg bg-muted/30">
              <p className="font-medium text-foreground mb-1">{d.name}</p>
              <p className="text-red-400">{d.lowLabel}: {d.negative > 0 ? "+" : ""}{d.negative.toFixed(0)}%</p>
              <p className="text-green-400">{d.highLabel}: +{d.positive.toFixed(0)}%</p>
              <p className="text-muted-foreground mt-1">Swing: {d.swing.toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TornadoChart;
