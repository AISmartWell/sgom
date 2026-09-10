import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot, Brain, Radar, FileText, Sparkles, ArrowRight, Cpu, ShieldCheck, ScanEye,
} from "lucide-react";

const agents = [
  {
    title: "Geophysical AI Agent",
    description:
      "Expert-petrophysicist agent. Receives deterministic engine output (Vshale, porosity, Sw, permeability) and produces findings, verdict, reservoir rating, risks and SPT recommendation. Physics is never recomputed by the LLM — the engine stays the source of truth.",
    href: "/dashboard/geophysics-agent",
    icon: Brain,
    badge: "Expert Reasoning",
    status: "Live",
  },
  {
    title: "SPT Advisor (AI Agent)",
    description:
      "Autonomous SPT candidate selection. Ranks wells with MCDA scoring, benchmarks against the real SPT case, flags out-of-distribution cases, and issues a work order with production forecasts (P10/P50/P90).",
    href: "/dashboard/spt-advisor",
    icon: Bot,
    badge: "Decision Agent",
    status: "Live",
  },
  {
    title: "Maria — AI Platform Guide",
    description:
      "Conversational guide to the SGOM platform. Answers questions about modules, stages and workflows using a curated knowledge base with multi-step retrieval.",
    href: "/dashboard/ai-guide",
    icon: Sparkles,
    badge: "Assistant",
    status: "Live",
  },
  {
    title: "Autonomous Registry Scanner",
    description:
      "Scans well registries and autonomously ingests candidate wells into the platform — each OCR-recognized well automatically enters the SPT ranking pool.",
    href: "/dashboard/autonomous-scan",
    icon: Radar,
    badge: "Data Agent",
    status: "Live",
  },
  {
    title: "OCR Well Log Agent",
    description:
      "Computer-vision agent: digitizes paper well logs, detects formations and exports curves straight into Geophysical Expertise. Runs on NVIDIA vision models.",
    href: "/dashboard/ocr",
    icon: FileText,
    badge: "Vision",
    status: "Live",
  },
  {
    title: "AI Analyst",
    description:
      "Cross-module analyst: explains results, compares wells and answers ad-hoc questions about the analysis pipeline.",
    href: "/dashboard/ai-analyst",
    icon: Cpu,
    badge: "Analyst",
    status: "Live",
  },
];

const principles = [
  {
    icon: ShieldCheck,
    title: "Physics first, AI second",
    text: "Deterministic petrophysical engine computes all numbers. LLM agents only interpret, rank and explain — they never invent values.",
  },
  {
    icon: ScanEye,
    title: "NVIDIA-accelerated",
    text: "Inference runs on NVIDIA NIM (OpenAI-compatible endpoint) with automatic fallback to the managed gateway for resilience.",
  },
  {
    icon: Brain,
    title: "Auditable",
    text: "Every agent run is stored (inputs, outputs, model, latency) so results can be reviewed and compared against human interpretation.",
  },
];

const AIAgents = () => {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline" className="font-mono text-xs tracking-widest uppercase">
            AI Agents
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">SGOM AI Agents</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          All autonomous agents available on the platform. Each agent has a dedicated page —
          open it, run it on your wells, and review the saved history of runs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.title} className="flex flex-col border-border/60 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-start justify-between">
                <agent.icon className="h-8 w-8 text-primary" />
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-[10px]">{agent.badge}</Badge>
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30" variant="outline">
                    {agent.status}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-lg mt-3">{agent.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">{agent.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-0">
              <Button asChild variant="outline" className="w-full group">
                <Link to={agent.href}>
                  Open agent
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">How our agents work</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {principles.map((p) => (
            <Card key={p.title} className="border-border/60 bg-card/50 backdrop-blur">
              <CardHeader>
                <p.icon className="h-6 w-6 text-primary" />
                <CardTitle className="text-base mt-2">{p.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{p.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAgents;
