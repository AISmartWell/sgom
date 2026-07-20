---
name: Restoration Cases — Formation Source
description: Formation for well_restorations rows is set algorithmically via formation-attribution/v1, not manual lookup
type: feature
---
Formation on `well_restorations` is populated **algorithmically** by `src/lib/formation-attribution.ts` (`buildAttributionModel`) using state / county / depth / logged curves / formation tops from the linked well or the row's `payload`, scored against `formation_codes`.

- Trigger: "Auto-attribute formations" button on `/dashboard/ingest-restoration-diagnostics` (page `IngestRestorationDiagnostics.tsx`) — batch update.
- Output written to `payload.formation` (winner name) and `payload.formation_attribution` (method, algo version, score, candidates, evidence trail, computed_at).
- Fallback ladder is preserved: if a row lacks state, it is skipped and left as-is (kept as REAL DATA if source was manual).
- Any new manual override must set `payload.formation_attribution.method = "manual"` to prevent the batch job from overwriting it.
