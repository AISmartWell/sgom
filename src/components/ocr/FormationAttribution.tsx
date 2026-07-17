import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Layers, MapPin, Ruler, Activity, ScanLine, AlertTriangle,
  TrendingUp, TrendingDown, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useFormationCodes } from "@/hooks/useFormationCodes";
import {
  buildAttributionModel,
  normState,
  type Evidence,
  type OcrLite,
} from "@/lib/formation-attribution";

function Bar({ v }: { v: number }) {
  return (
    <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`,
          background: v > 0.9 ? "#22c55e" : v > 0.6 ? "#1A9FFF" : "#f59e0b",
        }}
      />
    </div>
  );
}

function iconFor(k: Evidence["icon"]) {
  return k === "map" ? MapPin
    : k === "ruler" ? Ruler
    : k === "tops" ? Layers
    : k === "sp" ? Activity
    : k === "warn" ? AlertTriangle
    : ScanLine;
}

export function FormationAttribution({ result }: { result: OcrLite }) {
  const stateCode = normState(result.state);
  const county = (result.county ?? "").trim();
  const { data: registry, isLoading } = useFormationCodes(
    stateCode ? { stateCode } : undefined,
  );

  const model = useMemo(
    () => buildAttributionModel(result, registry),
    [registry, result],
  );

  if (isLoading) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Loading formation registry…
      </Card>
    );
  }

  if (!stateCode) {
    return (
      <Card className="p-6 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <span className="font-medium">Formation attribution unavailable</span>
        </div>
        <p className="text-xs text-muted-foreground">
          No <span className="font-mono">state</span> field was recognised in the scan. Add or correct the
          state in the Quality Check panel above to unlock the regional formation registry lookup.
        </p>
      </Card>
    );
  }

  if (!model) {
    return (
      <Card className="p-6 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <span className="font-medium">No candidates found for {stateCode}{county ? ` · ${county}` : ""}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          The <span className="font-mono">formation_codes</span> registry has no entries matching this
          scope. Try broadening the county, or open{" "}
          <Link className="text-[#1A9FFF] underline" to="/dashboard/formation-codes">
            Formation Codes
          </Link>{" "}
          to add one.
        </p>
      </Card>
    );
  }

  const { candidates, evidence, scores, winner, hasGR } = model;
  const totalDelta = evidence.reduce((s, e) => s + (e.perCandidate?.[winner] ?? 0), 0);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1A9FFF]" />
          <h3 className="text-sm font-semibold">Formation attribution from OCR signals</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {stateCode}{county ? ` · ${county}` : ""}
          </Badge>
          <Badge className="bg-[#1A9FFF]/20 text-[#1A9FFF] border-[#1A9FFF]/30 text-[10px]">
            winner {(scores[winner]).toFixed(0)}%
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-md border border-white/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#1A9FFF]" />
            <span className="font-medium">1. Regional key</span>
          </div>
          State {stateCode}{county ? `, county ${county}` : ""} → registry returned {candidates.length} candidate{candidates.length > 1 ? "s" : ""}.
        </div>
        <div className="rounded-md border border-white/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <ScanLine className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-medium">2. Depth & tops</span>
          </div>
          {result.depth_range_ft?.top != null
            ? `${result.depth_range_ft.top}–${result.depth_range_ft.bottom ?? "?"} ft filters plausible tops.`
            : "No depth range parsed — filter is skipped."}
        </div>
        <div className="rounded-md border border-white/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span className="font-medium">3. Curve signature</span>
          </div>
          {(result.logged_curves ?? []).length
            ? `Curves ${(result.logged_curves ?? []).join(", ")} scored against expected suite.`
            : "No curves detected — scoring falls back to registry priors."}
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Evidence trail for the winner */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">
            Evidence trail — how each OCR signal moved{" "}
            <span className="text-foreground">{candidates[winner].formation}</span> confidence
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            50% prior {totalDelta >= 0 ? "+" : ""}
            {totalDelta} pp = {50 + totalDelta}%
          </Badge>
        </div>
        <div className="space-y-1.5">
          {(() => {
            let running = 50;
            return evidence.map((e) => {
              const d = e.perCandidate?.[winner] ?? e.delta;
              const start = running;
              running += d;
              const pos = d >= 0;
              const Icon = iconFor(e.icon);
              const from = Math.max(0, Math.min(start, running));
              const width = Math.min(100 - from, Math.abs(d));
              return (
                <div
                  key={e.source + e.ocrField}
                  className="grid grid-cols-[170px_1fr_60px] gap-3 items-center rounded-md border border-white/10 p-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Icon className={`w-3.5 h-3.5 ${pos ? "text-[#1A9FFF]" : "text-amber-300"}`} />
                      {e.source}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">
                      {e.ocrField}
                    </div>
                  </div>
                  <div>
                    <div className="relative h-4 rounded bg-white/5 overflow-hidden">
                      <div className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: "50%" }} />
                      <div
                        className="absolute top-0 bottom-0"
                        style={{
                          left: `${from}%`,
                          width: `${width}%`,
                          background: pos ? "rgba(34,197,94,0.55)" : "rgba(245,158,11,0.55)",
                          borderLeft: pos ? "2px solid #22c55e" : "2px solid #f59e0b",
                          borderRight: pos ? "2px solid #22c55e" : "2px solid #f59e0b",
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {e.signal}
                      {e.registryHit && (
                        <>
                          {" · "}
                          <span className="text-[#1A9FFF]/80 font-mono">{e.registryHit}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-right font-mono text-xs flex items-center justify-end gap-1 ${
                      pos ? "text-green-400" : "text-amber-300"
                    }`}
                  >
                    {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {pos ? "+" : ""}
                    {d} pp
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Score matrix */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">
          Same OCR signals scored against every candidate (Δ points per signal)
        </div>
        <div className="overflow-x-auto rounded-md border border-white/10">
          <table className="w-full text-xs">
            <thead className="bg-white/5">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">OCR signal</th>
                {candidates.map((c) => (
                  <th key={c.id} className="px-3 py-2 font-medium text-right">
                    {c.formation}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evidence.map((e) => (
                <tr key={e.source + e.ocrField} className="border-t border-white/5">
                  <td className="px-3 py-1.5 text-muted-foreground">{e.source}</td>
                  {candidates.map((_, i) => {
                    const v = e.perCandidate?.[i] ?? 0;
                    return (
                      <td
                        key={i}
                        className={`px-3 py-1.5 text-right font-mono ${
                          v > 0 ? "text-green-400" : v < 0 ? "text-amber-300" : "text-muted-foreground"
                        }`}
                      >
                        {v > 0 ? "+" : ""}
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-white/10 bg-white/5">
                <td className="px-3 py-2 font-medium">Total (from 50% prior)</td>
                {scores.map((s, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono font-semibold">
                    {s.toFixed(0)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Candidates */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">Candidate formations after scoring</div>
        <div className="space-y-2">
          {candidates.map((c, i) => (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_auto] gap-3 items-center rounded-md border border-white/10 p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  {i === winner ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                      Selected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      Rejected
                    </Badge>
                  )}
                  <span className="font-medium text-sm">{c.formation}</span>
                  {c.basin && (
                    <span className="text-xs text-muted-foreground">· {c.basin}</span>
                  )}
                  {c.county_name && (
                    <span className="text-xs text-muted-foreground">· {c.county_name}</span>
                  )}
                </div>
                {c.description && (
                  <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">match</div>
                <div className="font-mono text-sm">{scores[i].toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasGR && (
        <div className="rounded-md border border-amber-400/30 bg-amber-400/5 p-3 flex gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            No GR curve on this scan ⇒ Vsh is derived from SP with lower confidence. Uploading a modern
            LAS with GR/NPHI/RHOB in{" "}
            <Link className="text-[#1A9FFF] underline" to="/dashboard/geophysical">
              Geophysical Expertise
            </Link>{" "}
            typically raises formation confidence by 10–15 pp.
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" variant="outline" asChild>
          <Link to="/dashboard/formation-codes">
            Open formation registry <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/dashboard/ocr-formation-demo">See annotated demo walkthrough</Link>
        </Button>
      </div>
    </Card>
  );
}

export default FormationAttribution;
