import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Cpu, FlaskConical, Info } from "lucide-react";

export type IntegrationMode = "live-nvidia" | "live-ai-hybrid" | "simulation";

interface Props {
  mode: IntegrationMode;
  /** Optional override for tooltip body */
  tooltip?: string;
}

const CONFIG: Record<IntegrationMode, {
  label: string;
  className: string;
  icon: typeof Activity;
  defaultTooltip: string;
}> = {
  "live-nvidia": {
    label: "Live NVIDIA API",
    className: "bg-[#76b900]/15 text-[#9bd400] border-[#76b900]/40",
    icon: Cpu,
    defaultTooltip:
      "Real inference via NVIDIA NIM (nvidia/nemotron-nano-12b-v2-vl) on NVIDIA API Catalog. Production-grade GPU endpoint.",
  },
  "live-ai-hybrid": {
    label: "Hybrid · Live AI + Physics",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/40",
    icon: Activity,
    defaultTooltip:
      "Calls Lovable AI Gateway (NVIDIA NIM upstream) for chain-of-thought reasoning, with deterministic physics-based fallback if the model is unavailable. Cosmos Predict foundation model itself is not yet wired (requires AWS H100 / DGX Cloud — Phase I R&D).",
  },
  "simulation": {
    label: "Simulation",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/40",
    icon: FlaskConical,
    defaultTooltip:
      "Deterministic client-side simulation calibrated against FORMATION_DB and historical SPT data. Cosmos foundation model not yet integrated — requires GPU H100 endpoint and adapter layer (Phase I R&D).",
  },
};

export const IntegrationStatusBadge = ({ mode, tooltip }: Props) => {
  const cfg = CONFIG[mode];
  const Icon = cfg.icon;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1.5 cursor-help font-mono text-[10px] tracking-wider uppercase ${cfg.className}`}
          >
            <Icon className="h-3 w-3" />
            {cfg.label}
            <Info className="h-3 w-3 opacity-60" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
          {tooltip ?? cfg.defaultTooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default IntegrationStatusBadge;
