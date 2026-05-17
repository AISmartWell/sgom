import { useState } from "react";
import { LiveWellCard } from "@/components/realtime/LiveWellCard";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const DEMO_WELLS = [
  {
    wellId: "W-001",
    wellName: "Anadarko-Alpha",
    baseRate: 182,
    basePressure: 2780,
    baseWaterCut: 24,
    intervalMs: 2000,
  },
  {
    wellId: "W-002",
    wellName: "Anadarko-Beta",
    baseRate: 148,
    basePressure: 2450,
    baseWaterCut: 31,
    intervalMs: 2500,
  },
  {
    wellId: "W-003",
    wellName: "Anadarko-Gamma",
    baseRate: 195,
    basePressure: 2620,
    baseWaterCut: 28,
    intervalMs: 2200,
  },
  {
    wellId: "W-004",
    wellName: "Basin-Delta",
    baseRate: 62,
    basePressure: 1980,
    baseWaterCut: 58,
    intervalMs: 3000,
  },
  {
    wellId: "W-006",
    wellName: "Central-Zeta",
    baseRate: 110,
    basePressure: 2310,
    baseWaterCut: 42,
    intervalMs: 2800,
  },
];

const LiveWellCardDemo = () => {
  const [selectedId, setSelectedId] = useState<string>(DEMO_WELLS[0].wellId);
  const selectedWell =
    DEMO_WELLS.find((w) => w.wellId === selectedId) || DEMO_WELLS[0];

  return (
    <div className="space-y-6 p-6">
      <div>
        <Badge variant="outline" className="mb-2 border-primary/40 text-primary">
          Prototype · Realtime
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Live Well Card</h1>
        <p className="text-sm text-muted-foreground">
          Real-time well telemetry prototype — select a well to view live metrics.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-72 space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Select Well
          </label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Choose a well" />
            </SelectTrigger>
            <SelectContent>
              {DEMO_WELLS.map((w) => (
                <SelectItem key={w.wellId} value={w.wellId}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{w.wellName}</span>
                    <span className="text-muted-foreground text-xs">
                      • {w.wellId}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            const idx = DEMO_WELLS.findIndex((w) => w.wellId === selectedId);
            const next = DEMO_WELLS[(idx + 1) % DEMO_WELLS.length];
            setSelectedId(next.wellId);
          }}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Next Well
        </Button>
      </div>

      {/* Live Card */}
      <div className="max-w-xl">
        <LiveWellCard
          key={selectedWell.wellId}
          wellId={selectedWell.wellId}
          wellName={selectedWell.wellName}
          baseRate={selectedWell.baseRate}
          basePressure={selectedWell.basePressure}
          baseWaterCut={selectedWell.baseWaterCut}
          intervalMs={selectedWell.intervalMs}
        />
      </div>
    </div>
  );
};

export default LiveWellCardDemo;
