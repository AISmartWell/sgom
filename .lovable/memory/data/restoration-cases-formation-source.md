---
name: Restoration Cases — Formation Source
description: Formation for the 15 restoration cases is set manually from Maxxwell + public registries, not by algorithmic attribution
type: feature
---
For the 15 well restoration cases (`well_restorations`), the formation field is populated by **manual lookup** from Maxxwell internal data and public state registries (KGS, OCC, RRC). It is NOT derived via `formation-attribution.ts` / `formation_codes` scoring.

Implications:
- Do not overwrite `formation` on these cases with algorithmic attribution results.
- Treat these formations as REAL DATA (highest tier in the fallback ladder), not FORMATION-BASED or SYNTHETIC.
- Evidence trail for these cases = "Manual lookup (Maxxwell / public registry)", not score matrix.
- Any batch job that re-computes formations must exclude records where source = manual/registry.
