import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Layers, MapPin, Ruler, Activity, ScanLine, AlertTriangle,
  TrendingUp, TrendingDown, ArrowRight, GitCompare, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormationCodes } from "@/hooks/useFormationCodes";
import {
  buildAttributionModel,
  normState,
  type AttributionModel,
  type Evidence,
  type OcrLite,
} from "@/lib/formation-attribution";

function iconFor(k: Evidence["icon"]) {
  return k === "map" ? MapPin
    : k === "ruler" ? Ruler
    : k === "tops" ? Layers
    : k === "sp" ? Activity
    : k === "warn" ? AlertTriangle
    : ScanLine;
}

type Side = "A" | "B";

function useModel(result: OcrLite | null) {
  const stateCode = normState(result?.state ?? undefined);
  const { data: registry, isLoading } = useFormationCodes(
    stateCode ? { stateCode } : undefined,
  );
  const model = useMemo(
    () => (result ? buildAttributionModel(result, registry) : null),
    [result, registry],
  );
  return { model, isLoading, stateCode };
}

function ScanHeader({
  side, label, result, model,
}: {
  side: Side;
  label: string;
  result: OcrLite;
  model: AttributionModel | null;
}) {
  const state = normState(result.state);
  const county = (result.county ?? "").trim();
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Badge className="bg-white/10 text-foreground border-white/20 text-[10px] font-mono">
          Scan {side}
        </Badge>
        <span className="text-sm font-medium truncate max-w-[240px]">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-[10px]">
        <Badge variant="outline">{state ?? "no state"}{county ? ` · ${county}` : ""}</Badge>
        {model && (
          <Badge className="bg-[#1A9FFF]/20 text-[#1A9FFF] border-[#1A9FFF]/30">
            {model.candidates[model.winner].formation} · {model.scores[model.winner].toFixed(0)}%
          </Badge>
        )}
      </div>
    </div>
  );
}

function TrailRow({ e, side, model }: { e: Evidence; side: Side; model: AttributionModel }) {
  const d = e.perCandidate?.[model.winner] ?? e.delta;
  const pos = d >= 0;
  const Icon = iconFor(e.icon);
  return (
    <div className="grid grid-cols-[130px_1fr_54px] gap-2 items-center rounded-md border border-white/10 p-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-medium">
          <Icon className={`w-3 h-3 ${pos ? "text-[#1A9FFF]" : "text-amber-300"}`} />
          {e.source}
        </div>
        <div className="text-[9px] text-muted-foreground font-mono truncate">{e.ocrField}</div>
      </div>
      <div className="text-[10px] text-muted-foreground truncate">{e.signal}</div>
      <div
        className={`text-right font-mono text-[11px] flex items-center justify-end gap-1 ${
          pos ? "text-green-400" : "text-amber-300"
        }`}
      >
        {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {pos ? "+" : ""}{d}
      </div>
    </div>
  );
}

export function FormationComparison({
  a, b, labelA, labelB, onClear,
}: {
  a: OcrLite;
  b: OcrLite;
  labelA: string;
  labelB: string;
  onClear?: () => void;
}) {
  const A = useModel(a);
  const B = useModel(b);

  if (A.isLoading || B.isLoading) {
    return <Card className="p-6 text-sm text-muted-foreground">Loading formation registries…</Card>;
  }

  const winnerA = A.model ? A.model.candidates[A.model.winner].formation : null;
  const winnerB = B.model ? B.model.candidates[B.model.winner].formation : null;
  const winnerScoreA = A.model ? A.model.scores[A.model.winner] : null;
  const winnerScoreB = B.model ? B.model.scores[B.model.winner] : null;
  const winnersMatch = winnerA && winnerB && winnerA === winnerB;
  const confDelta =
    winnerScoreA != null && winnerScoreB != null ? winnerScoreB - winnerScoreA : null;

  // Union of evidence sources
  const sources = Array.from(
    new Set([
      ...(A.model?.evidence.map((e) => e.source) ?? []),
      ...(B.model?.evidence.map((e) => e.source) ?? []),
    ]),
  );

  // Cross-candidate score table: union of formations from both models
  const allFormations = Array.from(
    new Set([
      ...(A.model?.candidates.map((c) => c.formation ?? "") ?? []),
      ...(B.model?.candidates.map((c) => c.formation ?? "") ?? []),
    ]),
  ).filter(Boolean);

  const scoreForFormation = (m: AttributionModel | null, name: string): number | null => {
    if (!m) return null;
    const idx = m.candidates.findIndex((c) => c.formation === name);
    return idx >= 0 ? m.scores[idx] : null;
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-[#1A9FFF]" />
          <h3 className="text-sm font-semibold">Compare scans — evidence & confidence diff</h3>
        </div>
        {onClear && (
          <Button size="sm" variant="ghost" onClick={onClear}>
            <X className="w-3.5 h-3.5 mr-1" /> Exit compare
          </Button>
        )}
      </div>

      {/* Verdict banner */}
      <div
        className={`rounded-md border p-3 flex items-center gap-3 flex-wrap text-sm ${
          winnersMatch
            ? "border-green-500/30 bg-green-500/10"
            : "border-amber-400/30 bg-amber-400/10"
        }`}
      >
        <Badge className="bg-white/10 border-white/20 text-[10px] font-mono">A</Badge>
        <span className="font-medium">{winnerA ?? "—"}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {winnerScoreA != null ? `${winnerScoreA.toFixed(0)}%` : ""}
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <Badge className="bg-white/10 border-white/20 text-[10px] font-mono">B</Badge>
        <span className="font-medium">{winnerB ?? "—"}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {winnerScoreB != null ? `${winnerScoreB.toFixed(0)}%` : ""}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {winnersMatch ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
              Same formation
            </Badge>
          ) : (
            <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[10px]">
              Formation changed
            </Badge>
          )}
          {confDelta != null && (
            <Badge
              variant="outline"
              className={`text-[10px] font-mono ${
                confDelta >= 0 ? "text-green-400" : "text-amber-300"
              }`}
            >
              Δ confidence {confDelta >= 0 ? "+" : ""}
              {confDelta.toFixed(0)} pp
            </Badge>
          )}
        </div>
      </div>

      {/* Side-by-side headers + trails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(["A", "B"] as const).map((side) => {
          const src = side === "A" ? a : b;
          const lbl = side === "A" ? labelA : labelB;
          const m = side === "A" ? A.model : B.model;
          return (
            <div key={side} className="space-y-2 rounded-md border border-white/10 p-3">
              <ScanHeader side={side} label={lbl} result={src} model={m} />
              <Separator className="bg-white/10" />
              {m ? (
                <div className="space-y-1.5">
                  {m.evidence.map((e) => (
                    <TrailRow key={e.source} e={e} side={side} model={m} />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground p-2">
                  No candidates — check state / county in this scan.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Separator className="bg-white/10" />

      {/* Evidence Δ table: per-source shift on each side's winner */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">
          Signal-by-signal contribution to each winner (Δ pp vs 50% prior)
        </div>
        <div className="overflow-x-auto rounded-md border border-white/10">
          <table className="w-full text-xs">
            <thead className="bg-white/5">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">OCR signal</th>
                <th className="px-3 py-2 font-medium text-right">
                  A → {winnerA ?? "—"}
                </th>
                <th className="px-3 py-2 font-medium text-right">
                  B → {winnerB ?? "—"}
                </th>
                <th className="px-3 py-2 font-medium text-right">Δ (B − A)</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => {
                const ea = A.model?.evidence.find((x) => x.source === s);
                const eb = B.model?.evidence.find((x) => x.source === s);
                const va = ea?.perCandidate?.[A.model!.winner] ?? ea?.delta ?? null;
                const vb = eb?.perCandidate?.[B.model!.winner] ?? eb?.delta ?? null;
                const diff =
                  va != null && vb != null ? vb - va
                    : vb != null ? vb
                    : va != null ? -va : 0;
                const paint = (v: number | null) =>
                  v == null ? "text-muted-foreground/50"
                    : v > 0 ? "text-green-400"
                    : v < 0 ? "text-amber-300"
                    : "text-muted-foreground";
                return (
                  <tr key={s} className="border-t border-white/5">
                    <td className="px-3 py-1.5 text-muted-foreground">{s}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${paint(va)}`}>
                      {va == null ? "—" : (va > 0 ? "+" : "") + va}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-mono ${paint(vb)}`}>
                      {vb == null ? "—" : (vb > 0 ? "+" : "") + vb}
                    </td>
                    <td
                      className={`px-3 py-1.5 text-right font-mono font-semibold ${
                        diff > 0 ? "text-green-400" : diff < 0 ? "text-amber-300" : "text-muted-foreground"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-white/10 bg-white/5">
                <td className="px-3 py-2 font-medium">Winner confidence</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {winnerScoreA != null ? `${winnerScoreA.toFixed(0)}%` : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {winnerScoreB != null ? `${winnerScoreB.toFixed(0)}%` : "—"}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono font-semibold ${
                    confDelta == null ? "text-muted-foreground"
                      : confDelta >= 0 ? "text-green-400" : "text-amber-300"
                  }`}
                >
                  {confDelta == null
                    ? "—"
                    : (confDelta >= 0 ? "+" : "") + confDelta.toFixed(0) + " pp"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Candidate confidence shift across both scans */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">
          Confidence per candidate formation (union of both scans)
        </div>
        <div className="space-y-1.5">
          {allFormations.map((name) => {
            const sa = scoreForFormation(A.model, name);
            const sb = scoreForFormation(B.model, name);
            const d = sa != null && sb != null ? sb - sa : null;
            return (
              <div
                key={name}
                className="grid grid-cols-[1fr_60px_60px_70px] gap-3 items-center rounded-md border border-white/10 p-2.5 text-xs"
              >
                <div className="font-medium truncate">{name}</div>
                <div className="text-right font-mono">
                  {sa != null ? `${sa.toFixed(0)}%` : "—"}
                </div>
                <div className="text-right font-mono">
                  {sb != null ? `${sb.toFixed(0)}%` : "—"}
                </div>
                <div
                  className={`text-right font-mono font-semibold ${
                    d == null ? "text-muted-foreground"
                      : d > 0 ? "text-green-400"
                      : d < 0 ? "text-amber-300"
                      : "text-muted-foreground"
                  }`}
                >
                  {d == null ? "—" : (d > 0 ? "+" : "") + d.toFixed(0) + " pp"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export default FormationComparison;
