import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CosmosSimulator from "@/components/cosmos/CosmosSimulator";

const CosmosSimulatorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">SGOM Physics Simulator</h1>
              <p className="text-xs text-muted-foreground">Interactive physics-aware well simulator</p>
            </div>
          </div>
          <Badge variant="outline" className="border-green-500/30 text-green-400 hidden sm:flex">
            <Cpu className="h-3 w-3 mr-1" /> NVIDIA Inception
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section className="space-y-3">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Interactive Simulator — Drag sliders, hit RUN
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">SGOM Physics Simulator · Powered by NVIDIA NIM</h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            Adjust reservoir and SPT parameters in real time. SGOM Physics treats depth as a time axis to
            forecast post-SPT production, drainage expansion, and water cut evolution over a 365-day horizon.
            Switch between <span className="text-foreground font-semibold">Predict</span>,{" "}
            <span className="text-foreground font-semibold">Transfer</span>, and{" "}
            <span className="text-foreground font-semibold">Reason</span> modes.
          </p>
        </section>

        <CosmosSimulator />
        <TrademarkDisclaimer />
      </main>
    </div>
  );
};

export default CosmosSimulatorPage;
