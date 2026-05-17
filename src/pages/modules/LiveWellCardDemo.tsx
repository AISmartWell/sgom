import { LiveWellCard } from "@/components/realtime/LiveWellCard";
import { Badge } from "@/components/ui/badge";

const LiveWellCardDemo = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Badge variant="outline" className="mb-2 border-primary/40 text-primary">
          Prototype · Realtime
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Live Well Card</h1>
        <p className="text-sm text-muted-foreground">
          Real-time well telemetry prototype — oil rate sparkline with current pressure and water cut.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LiveWellCard
          wellId="W-001"
          wellName="Anadarko-Alpha"
          baseRate={182}
          basePressure={2780}
          baseWaterCut={24}
        />
        <LiveWellCard
          wellId="W-002"
          wellName="Anadarko-Beta"
          baseRate={148}
          basePressure={2450}
          baseWaterCut={31}
          intervalMs={2500}
        />
        <LiveWellCard
          wellId="W-004"
          wellName="Basin-Delta"
          baseRate={62}
          basePressure={1980}
          baseWaterCut={58}
          intervalMs={3000}
        />
      </div>
    </div>
  );
};

export default LiveWellCardDemo;
