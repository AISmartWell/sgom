import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Brain,
  Cpu,
  MessageSquare,
  Mic,
  Sparkles,
  Zap,
  BarChart3,
  Code2,
  ImageIcon,
  Wrench,
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  Layers,
} from "lucide-react";

interface ModelCard {
  id: string;
  name: string;
  provider: string;
  providerLabel: string;
  providerColor: string;
  description: string;
  bestFor: string[];
  useCases: string[];
  latency: string;
  cost: string;
  multimodal: boolean;
  icon: typeof Brain;
}

const MODELS: ModelCard[] = [
  // ── Lovable AI Gateway — Google ──
  {
    id: "gemini-3-flash-preview",
    name: "google/gemini-3-flash-preview",
    provider: "Lovable AI Gateway",
    providerLabel: "Google Gemini",
    providerColor: "hsl(140 80% 45%)",
    description:
      "Fast preview model for most chat, agent, extraction, and generation tasks. Balanced speed and capability with large context window.",
    bestFor: ["SPT Chat", "Text extraction", "Classification"],
    useCases: [
      "SPT consultant dialogue",
      "Document summarization",
      "Quick Q&A over well data",
      "Multi-turn conversations",
    ],
    latency: "Low",
    cost: "Low",
    multimodal: true,
    icon: Zap,
  },
  {
    id: "gemini-3.5-flash",
    name: "google/gemini-3.5-flash",
    provider: "Lovable AI Gateway",
    providerLabel: "Google Gemini",
    providerColor: "hsl(140 80% 45%)",
    description:
      "High-efficiency Gemini 3.5 for fast coding, reasoning, and agentic workflows. Strong at structured output and tool use.",
    bestFor: ["Coding", "Agentic workflows", "Reasoning"],
    useCases: [
      "Code generation for analytics scripts",
      "Tool-calling agents",
      "Structured data extraction",
      "Multi-step reasoning chains",
    ],
    latency: "Low",
    cost: "Low",
    multimodal: true,
    icon: Code2,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "google/gemini-3.1-pro-preview",
    provider: "Lovable AI Gateway",
    providerLabel: "Google Gemini",
    providerColor: "hsl(140 80% 45%)",
    description:
      "Latest preview of Google's next-gen reasoning model. Best when quality matters more than latency.",
    bestFor: ["Complex reasoning", "Deep analysis", "Research"],
    useCases: [
      "Geological interpretation",
      "Reservoir characterization",
      "Multi-source synthesis",
      "Long-context document analysis",
    ],
    latency: "Medium",
    cost: "Medium",
    multimodal: true,
    icon: Brain,
  },
  {
    id: "gemini-2.5-pro",
    name: "google/gemini-2.5-pro",
    provider: "Lovable AI Gateway",
    providerLabel: "Google Gemini",
    providerColor: "hsl(140 80% 45%)",
    description:
      "Strong multimodal and complex reasoning. Excellent for hard text+image tasks and large-context workloads.",
    bestFor: ["Image+text", "Large context", "Complex reasoning"],
    useCases: [
      "Core photo analysis with text",
      "Seismic image interpretation",
      "Well log + photo combined analysis",
      "Cross-modal data fusion",
    ],
    latency: "Medium",
    cost: "Medium-High",
    multimodal: true,
    icon: ImageIcon,
  },
  // ── Lovable AI Gateway — OpenAI ──
  {
    id: "gpt-5",
    name: "openai/gpt-5",
    provider: "Lovable AI Gateway",
    providerLabel: "OpenAI GPT",
    providerColor: "hsl(25 95% 55%)",
    description:
      "Powerful all-rounder for accuracy, nuance, and multimodal text+image tasks. Premium quality.",
    bestFor: ["Accuracy", "Nuance", "Multimodal"],
    useCases: [
      "High-stakes report writing",
      "Technical specification drafting",
      "Image-based diagnostics",
      "Precision extraction tasks",
    ],
    latency: "Medium",
    cost: "High",
    multimodal: true,
    icon: Sparkles,
  },
  {
    id: "gpt-5-mini",
    name: "openai/gpt-5-mini",
    provider: "Lovable AI Gateway",
    providerLabel: "OpenAI GPT",
    providerColor: "hsl(25 95% 55%)",
    description:
      "Lower-cost OpenAI model that keeps most reasoning and multimodal strengths. Good middle ground.",
    bestFor: ["Balanced cost/quality", "General tasks"],
    useCases: [
      "Daily analytics queries",
      "Data formatting and cleanup",
      "Template-based generation",
      "Batch processing",
    ],
    latency: "Low-Medium",
    cost: "Medium",
    multimodal: true,
    icon: BarChart3,
  },
  {
    id: "gpt-5.4",
    name: "openai/gpt-5.4",
    provider: "Lovable AI Gateway",
    providerLabel: "OpenAI GPT",
    providerColor: "hsl(25 95% 55%)",
    description:
      "Advanced reasoning model for complex multi-step reasoning, code generation, and analysis.",
    bestFor: ["Code generation", "Deep analysis", "Problem solving"],
    useCases: [
      "Monte Carlo simulation logic",
      "Economic model code",
      "Algorithm design",
      "Technical debugging",
    ],
    latency: "Medium-High",
    cost: "High",
    multimodal: true,
    icon: Code2,
  },
  {
    id: "gpt-5.5",
    name: "openai/gpt-5.5",
    provider: "Lovable AI Gateway",
    providerLabel: "OpenAI GPT",
    providerColor: "hsl(25 95% 55%)",
    description:
      "Most capable GPT-5.5 model for demanding reasoning, coding, and instruction-following tasks.",
    bestFor: ["Hardest tasks", "Coding", "Instruction following"],
    useCases: [
      "Autonomous agent orchestration",
      "Complex multi-tool workflows",
      "Advanced reservoir engineering",
      "Custom model fine-tuning prep",
    ],
    latency: "High",
    cost: "Premium",
    multimodal: true,
    icon: Brain,
  },
  // ── NVIDIA ──
  {
    id: "nemotron-super-49b",
    name: "nvidia/llama-3.3-nemotron-super-49b-v1",
    provider: "NVIDIA",
    providerLabel: "NVIDIA Nemotron",
    providerColor: "hsl(120 60% 45%)",
    description:
      "NVIDIA Nemotron Super 49B. Specialized large reasoning model optimized for enterprise use cases. Powers Maria AI Guide.",
    bestFor: ["Platform Q&A", "Enterprise reasoning", "Long context"],
    useCases: [
      "Maria AI Guide — platform questions",
      "SGOM system documentation",
      "Technical support dialogue",
      "Feature explanation",
    ],
    latency: "Medium",
    cost: "Medium",
    multimodal: false,
    icon: MessageSquare,
  },
  // ── NVIDIA Cosmos (hosted) ──
  {
    id: "cosmos-llama-70b",
    name: "meta/llama-3.3-70b-instruct",
    provider: "NVIDIA Cosmos",
    providerLabel: "NVIDIA Cosmos",
    providerColor: "hsl(260 70% 55%)",
    description:
      "Hosted Llama 3.3 70B Instruct via NVIDIA Cosmos. Used for SPT scoring and synthetic data generation.",
    bestFor: ["SPT scoring", "Synthetic data", "Classification"],
    useCases: [
      "SPT well scoring",
      "Synthetic production data generation",
      "Batch classification tasks",
      "Data augmentation for ML training",
    ],
    latency: "Medium",
    cost: "Medium",
    multimodal: false,
    icon: Layers,
  },
  // ── OpenAI TTS ──
  {
    id: "gpt-4o-mini-tts",
    name: "openai/gpt-4o-mini-tts",
    provider: "OpenAI TTS",
    providerLabel: "OpenAI TTS",
    providerColor: "hsl(190 100% 50%)",
    description:
      "Text-to-speech via OpenAI. Supports SSE streaming and full response_format set. Voice: shimmer (female). Powers Maria's voice.",
    bestFor: ["Voice synthesis", "Streaming audio", "Narration"],
    useCases: [
      "Maria voice responses",
      "Audio narration of reports",
      "Real-time voice feedback",
      "Accessibility audio output",
    ],
    latency: "Low",
    cost: "Low (per character)",
    multimodal: false,
    icon: Mic,
  },
];

const PROVIDERS = [
  {
    name: "Lovable AI Gateway",
    description:
      "Primary AI gateway for all chat, text, and multimodal tasks. Routes to Google Gemini and OpenAI GPT models without requiring separate API keys.",
    icon: Globe,
    color: "hsl(205 100% 55%)",
  },
  {
    name: "NVIDIA",
    description:
      "Enterprise-grade GPU-accelerated inference. Nemotron models provide deep reasoning for platform-specific and domain knowledge tasks.",
    icon: Cpu,
    color: "hsl(120 60% 45%)",
  },
  {
    name: "NVIDIA Cosmos",
    description:
      "Hosted inference platform for open-weight models. Optimized for batch workloads and synthetic data generation at scale.",
    icon: Layers,
    color: "hsl(260 70% 55%)",
  },
  {
    name: "OpenAI TTS",
    description:
      "Dedicated text-to-speech endpoint for high-quality voice synthesis. Streaming support enables real-time audio feedback.",
    icon: Mic,
    color: "hsl(190 100% 50%)",
  },
];

export default function ModelsReference() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredModels =
    filter === "all"
      ? MODELS
      : MODELS.filter((m) => m.provider === filter);

  const providersList = Array.from(new Set(MODELS.map((m) => m.provider)));

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">
              AI Model Catalog
            </h1>
            <p className="text-sm text-muted-foreground">
              All LLMs available on the AI Smart Well platform
            </p>
          </div>
        </div>
        <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">
          {MODELS.length} models across {providersList.length} providers
        </Badge>
      </div>

      {/* Provider overview cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {PROVIDERS.map((p) => (
          <div
            key={p.name}
            className="glass-card-hover rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${p.color}20` }}
              >
                <p.icon className="h-4 w-4" style={{ color: p.color }} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {p.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {p.description}
            </p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider mr-2">
            Filter:
          </span>
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition",
              filter === "all"
                ? "bg-primary/20 border-primary/50 text-primary font-medium"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
            )}
          >
            All
          </button>
          {providersList.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full border transition",
                filter === p
                  ? "bg-primary/20 border-primary/50 text-primary font-medium"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Model cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredModels.map((model, i) => {
          const isOpen = expanded.has(model.id);
          const Icon = model.icon;
          return (
            <div
              key={model.id}
              className={cn(
                "glass-card-hover rounded-xl overflow-hidden transition-all duration-300",
                `animate-fade-up-delay-${Math.min(i % 5, 4)}`
              )}
            >
              {/* Card header */}
              <div className="p-5 flex items-start gap-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${model.providerColor}18`,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: model.providerColor }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {model.name}
                    </h3>
                    {model.multimodal && (
                      <Badge className="text-[10px] bg-primary/15 text-primary border-primary/25 px-1.5 py-0">
                        Multimodal
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {model.providerLabel}
                  </p>
                </div>
                <button
                  onClick={() => toggle(model.id)}
                  className="text-muted-foreground hover:text-foreground transition shrink-0"
                >
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Quick stats row */}
              <div className="px-5 pb-3 flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] border-border/40 text-muted-foreground"
                >
                  Latency: {model.latency}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] border-border/40 text-muted-foreground"
                >
                  Cost: {model.cost}
                </Badge>
                {model.bestFor.map((tag) => (
                  <Badge
                    key={tag}
                    className="text-[10px] bg-accent/15 text-accent border-accent/25"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-border/30 mt-2 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {model.description}
                  </p>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                      Recommended Use Cases
                    </p>
                    <ul className="space-y-1.5">
                      {model.useCases.map((uc) => (
                        <li
                          key={uc}
                          className="flex items-start gap-2 text-sm text-foreground/80"
                        >
                          <Wrench className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          {uc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendation guide */}
      <div className="max-w-6xl mx-auto mt-12 glass-card rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 font-['Space_Grotesk']">
          <Search className="h-5 w-5 text-primary" />
          Quick Selection Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              task: "SPT Chat / Daily Q&A",
              model: "google/gemini-3-flash-preview",
              why: "Default model. Fast, cost-efficient, great at multi-turn dialogue.",
            },
            {
              task: "Code Generation",
              model: "google/gemini-3.5-flash",
              why: "Optimized for coding and agentic workflows with tool support.",
            },
            {
              task: "Complex Analysis",
              model: "google/gemini-3.1-pro-preview",
              why: "Deep reasoning for geological and reservoir analysis.",
            },
            {
              task: "Image + Text Tasks",
              model: "google/gemini-2.5-pro",
              why: "Best multimodal model for core photos, seismic, and logs.",
            },
            {
              task: "High-Stakes Reports",
              model: "openai/gpt-5",
              why: "Premium accuracy and nuance for critical deliverables.",
            },
            {
              task: "Platform Questions (Maria)",
              model: "nvidia/llama-3.3-nemotron-super-49b-v1",
              why: "Powers Maria AI Guide. Enterprise reasoning for SGOM docs.",
            },
            {
              task: "SPT Scoring / Synthetic Data",
              model: "meta/llama-3.3-70b-instruct",
              why: "Batch-optimized via NVIDIA Cosmos for scoring and data generation.",
            },
            {
              task: "Voice Synthesis (Maria)",
              model: "openai/gpt-4o-mini-tts",
              why: "High-quality streaming TTS with female voice (shimmer).",
            },
            {
              task: "Hardest Problems",
              model: "openai/gpt-5.5",
              why: "Most capable model for demanding reasoning and coding.",
            },
          ].map((item) => (
            <div
              key={item.task}
              className="rounded-lg border border-border/40 bg-card/40 p-4"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {item.task}
              </p>
              <p className="text-sm font-medium text-primary mb-1">
                {item.model}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.why}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="max-w-6xl mx-auto mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          All models are accessible through Lovable AI Gateway. No external API keys required. Billing is handled via workspace credits.
        </p>
      </div>
    </div>
  );
}
