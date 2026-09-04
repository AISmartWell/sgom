# SGOM — Developer Onboarding

**Platform:** SGOM (AI Smart Well Inc.)
**Audience:** incoming software developer (full-stack / AI integration)
**Goal:** be able to run, read, extend and hand-hold the platform within one week.

---

## 1. What SGOM is

SGOM is a web platform for oil & gas well analytics. It takes raw and legacy well data
(satellite imagery, paper well logs, LAS files, production history, public registries),
runs it through a fixed 9-stage analysis pipeline, and produces a ranked list of wells
that are the best candidates for SPT (Slot Perforation Technology, US Patent 8,863,823)
restoration, together with economics and a work order.

Key idea: **deterministic physics engine = source of truth, LLM = reasoning layer.**
The AI never invents numbers; it explains and ranks results produced by our own formulas.

---

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, TypeScript 5, Tailwind CSS v3, shadcn/ui, Recharts, Leaflet |
| Backend | Supabase (PostgreSQL + Row Level Security, Auth, Storage, Realtime) |
| Server logic | Supabase Edge Functions (Deno, TypeScript) |
| AI inference | NVIDIA NIM (primary), Lovable AI Gateway (fallback), Gemini for some vision tasks |
| Heavy ML | Proxied to AWS (edge functions have CPU/time limits) |
| Video/media | Remotion, TTS narration |

Deployment: hosted build, custom domain `aismartwellsgom.com`.

---

## 3. Repository map

```
src/
  pages/               top-level routes (Index, TechnicalSpec, SGOMTaskMap, ...)
  pages/modules/       one file per dashboard module (~55 modules)
  components/          UI, grouped per feature (geophysical/, spt/, ocr/, reserves-map/)
  components/ui/       shadcn primitives — restyled, do not fork
  lib/                 deterministic domain logic (no React, unit-testable)
  hooks/               data hooks (useWellRanking, ...)
  integrations/supabase/  auto-generated client + types — never edit manually
  workers/             web workers (Monte Carlo 50k iterations)
supabase/functions/    edge functions (one folder per function)
docs/                  architecture and onboarding documentation
```

### Files to read first
1. `src/lib/petrophysics.ts` — the core engine: Vshale, Archie Sw, Timur permeability,
   lithology segmentation, fluid typing, net pay.
2. `src/lib/pvt.ts`, `src/lib/material-balance.ts`, `src/lib/pore-pressure.ts` —
   reservoir pressure chain (Eaton → PVT correlation → Havlena–Ode).
3. `supabase/functions/spt-advisor/index.ts` — candidate ingestion, AI loop, MCDA scoring.
4. `supabase/functions/geophysics-agent/index.ts` — AI expert reasoning over engine output.
5. `src/hooks/useWellRanking.ts` — how the ranked candidate list reaches the UI.

---

## 4. The 9-stage pipeline (fixed order — do not renumber)

1. Field scanning (satellite / regional screening)
2. Data classification (ingest, AI auto-fill, OCR of paper logs)
3. Core analysis (computer vision + text interpretation)
4. Cumulative analysis (IOIP, economic limit)
5. Seismic interpretation
6. SPT projection (candidate projection against patent criteria)
7. Economic analysis (Monte Carlo, QAE)
8. Geophysical expertise (petrophysics engine + AI agent)
9. EOR optimization (final recommendation)

Every module page shows a "Stage X" badge in its header.

---

## 5. Data and security model

- Multi-tenant: every domain table carries `company_id`; **always** validate it.
- RLS is enabled on all public tables, plus explicit `GRANT`s for `authenticated`
  and `service_role`. A table without grants is unreachable from the app.
- Roles live in a separate `user_roles` table (never on profiles) and are checked
  through a `SECURITY DEFINER` function `has_role()`. Unknown users default to `admin`;
  `demo@aismartwell.com` and the investor accounts get a restricted route set.
- No PostGIS: geospatial lookups use numeric lat/long composite indexes and bounding boxes.
- Sign-up is disabled — login only, accounts are provisioned manually.

---

## 6. AI integration rules

- Primary inference: NVIDIA NIM via an OpenAI-compatible endpoint, secret `NVIDIA_API_KEY`.
  Current models: `nvidia/nemotron-3-super-120b-a12b` (main),
  `nvidia/nemotron-3.5-lightning-30b-a3b` (backup). NVIDIA retires hosted models quickly —
  when a call returns `410 Gone`, swap the model id, this is expected maintenance.
- Fallback: Lovable AI Gateway, same JSON contract, transparent to the frontend.
- Every AI call: hard timeout (AbortController, 45 s) + max 2 retries with exponential backoff.
- Responses are parsed defensively: strip `<think>` blocks, markdown fences, comments and
  trailing commas before `JSON.parse`; validate required sections; fall back on failure.
- Determinism: never `Math.random()` in demo or synthetic data — use `stableHash`.
- Data provenance is always labelled: REAL DATA > FORMATION-BASED > SYNTHETIC.

---

## 7. Local workflow

```bash
npm install
npm run dev            # Vite dev server on :8080
npx supabase functions deploy <name>   # deploy one edge function
```

Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`) are managed by the platform — do not edit `.env` by hand.
Server-side secrets (`NVIDIA_API_KEY`, etc.) are stored in the backend secret store and
are only readable inside edge functions.

---

## 8. Conventions

- UI text is **strictly English**; team communication is in Russian.
- Imperial units (ft, bbl, BOPD); resistivity in Ohm·m.
- Colors, gradients and shadows are semantic tokens in `src/index.css` —
  never hardcode `text-white`, `bg-black` or `bg-[#hex]` in components.
- Typography: Space Grotesk (headings), Inter (body), JetBrains Mono (technical labels).
- Recharts containers need an explicit `minHeight`.
- Naming: platform = **SGOM**, company = **AI Smart Well Inc.** (legal/footer only).

---

## 9. Suggested first week

| Day | Task |
|---|---|
| 1 | Run locally, log in, walk the dashboard, read this document and `docs/ARCHITECTURE.md` |
| 2 | Read `petrophysics.ts` end to end; reproduce one well's interpretation by hand |
| 3 | Trace a full run of `/dashboard/geophysical` → engine → `geophysics-agent` → history table |
| 4 | Trace SPT Advisor: ingest → MCDA ranking → forecast → work order registry |
| 5 | Review the DB schema and RLS policies; verify `company_id` isolation |
| 6-7 | Pick one small backlog item and ship it end to end (UI + edge function + migration) |

---

## 10. Ownership and integrations

The codebase belongs to AI Smart Well Inc. Business logic lives in edge functions and in
`src/lib`, so it is never shipped to the browser. The planned Upstrima marketplace
integration is an API/MCP surface on top of the existing work-order flow —
see `supabase/functions/mcp/` and `src/lib/mcp/`.
