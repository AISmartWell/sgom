import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CosmosPredictDemo from "@/components/cosmos/CosmosPredictDemo";
import CosmosTransferDemo from "@/components/cosmos/CosmosTransferDemo";
import CosmosReasonDemo from "@/components/cosmos/CosmosReasonDemo";
import {
  Eye,
  Database,
  MessageSquare,
  Sparkles,
  Cpu,
  Zap,
  Target,
  TrendingUp,
  Activity,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const CosmosDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">AI Smart Well</h1>
              <p className="text-xs text-muted-foreground">NVIDIA Cosmos Integration Demo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500/30 text-green-400 hidden sm:flex">
              <Cpu className="h-3 w-3 mr-1" />
              NVIDIA Inception
            </Badge>
            <Button size="sm" variant="default" asChild>
              <a href="/auth">
                Sign In <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-4 py-8">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Interactive Demo — No Login Required
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            NVIDIA Cosmos × Oil & Gas AI
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            World Foundation Model trained on{" "}
            <span className="text-foreground font-semibold">20M hours</span> of physics video,
            applied to well analysis, SPT optimization, and production forecasting.
          </p>

          {/* Three pillars */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4">
            {[
              { icon: Eye, label: "Predict", desc: "Post-SPT behavior simulation", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
              { icon: Database, label: "Transfer", desc: "Synthetic well log generation", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { icon: MessageSquare, label: "Reason", desc: "Explainable AI decisions", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
            ].map((m) => (
              <Card key={m.label} className={`${m.bg} border`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <m.icon className={`h-8 w-8 ${m.color} flex-shrink-0`} />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Cosmos {m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.desc}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Cosmos Predict Demo */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-400" />
            <h3 className="text-xl font-bold">Cosmos Predict</h3>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              Physics Simulation
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Predict post-SPT formation behavior before treatment — drag the SPT zone on the well log to see real-time production forecasts.
          </p>
          <CosmosPredictDemo />
        </section>

        <Separator />

        {/* Cosmos Transfer Demo */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            <h3 className="text-xl font-bold">Cosmos Transfer</h3>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              Data Augmentation
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Generate physically plausible synthetic well logs for data-sparse regions — 10× training data multiplication.
          </p>
          <CosmosTransferDemo />
        </section>

        <Separator />

        {/* Cosmos Reason Demo */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            <h3 className="text-xl font-bold">Cosmos Reason</h3>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
              Explainable AI
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Chain-of-thought reasoning with animated radar chart — understand why the AI recommends specific wells.
          </p>
          <CosmosReasonDemo />
        </section>

        <Separator />

        {/* Key Metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Training Data", value: "20M hrs", icon: Activity },
            { label: "Prediction Accuracy", value: "91%+", icon: Target },
            { label: "Data Augmentation", value: "10×", icon: TrendingUp },
            { label: "Inference Speed", value: "<2s", icon: Zap },
          ].map((m) => (
            <div key={m.label} className="text-center p-4 rounded-xl bg-muted/20 border border-border/30">
              <m.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="text-center py-8 space-y-4">
          <h3 className="text-2xl font-bold">Ready to Optimize Your Wells?</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            AI Smart Well combines NVIDIA Cosmos, GPU-accelerated analytics, and Maxxwell Production's patented SPT technology.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <a href="/auth">
                Get Started <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/investor-deck">
                Investor Deck <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AI Smart Well Inc. — Powered by NVIDIA Cosmos World Foundation Model
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CosmosDemo;
