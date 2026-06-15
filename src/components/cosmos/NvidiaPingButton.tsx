import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { callCosmos } from "./useCosmosInference";

interface PingResult {
  status: string;
  response: string;
  latency_ms: number;
}

export function NvidiaPingButton() {
  const [state, setState] = useState<"idle" | "pinging" | "ok" | "fail">("idle");
  const [result, setResult] = useState<PingResult | null>(null);

  const ping = async () => {
    setState("pinging");
    setResult(null);
    const start = performance.now();
    try {
      const resp = await callCosmos<PingResult>("ping", {});
      if (resp?.live && resp.result?.status === "ok") {
        setState("ok");
        setResult(resp.result);
      } else {
        setState("fail");
      }
    } catch {
      setState("fail");
    }
  };

  const Icon = state === "pinging" ? Loader2 : state === "ok" ? Wifi : state === "fail" ? WifiOff : Wifi;
  const color =
    state === "ok"
      ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
      : state === "fail"
      ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
      : "border-primary/40 text-primary hover:bg-primary/10";

  return (
    <div className="flex items-center gap-2">
      {result && (
        <Badge variant="outline" className="font-mono text-[10px] border-emerald-500/30 text-emerald-400">
          {result.latency_ms}ms · {result.response}
        </Badge>
      )}
      <Button
        size="sm"
        variant="outline"
        className={color}
        onClick={ping}
        disabled={state === "pinging"}
      >
        <Icon className={`h-4 w-4 mr-1 ${state === "pinging" ? "animate-spin" : ""}`} />
        {state === "pinging" ? "Pinging…" : state === "ok" ? "NVIDIA Live" : state === "fail" ? "NVIDIA Offline" : "Ping NVIDIA"}
      </Button>
    </div>
  );
}

export default NvidiaPingButton;
