# Roadmap

## Done
- [x] Add bilingual waterflood data checklist PDFs to Data Import as downloads.
- [x] Replace the Lovable social card with a 1200×630 SGOM image and give /geophysics-live its own accurate metadata.
- [x] Align Brawner LITH formation labels with documented Rodessa and James Lime depths; do not infer boundaries from the well formation name.
- [x] Make the depth-aligned illustrative composite well log the main visual on the standalone Brawner demonstration, visible before the nine stages.
- [x] Share Geophysical Agent conclusions with teammates in the same company; show loading errors instead of an empty state.
- [x] Standalone Brawner Expertise demonstration accessible by code without platform sign-in; public log is schematic and independent of private well data.
- [x] Brawner Expertise interactive nine-stage walkthrough with visible per-stage analysis, playback, direct stage selection and illustrative data labels.
- [x] Visual redesign of SGOM platform — direction "Cinematic Tech Workspace" applied
      (near-black base, emerald→cyan accent, JetBrains Mono technical captions,
      hairline borders, bracket corners, ambient glow) via design tokens in
      src/index.css + tailwind.config.ts, Card, Sidebar and DashboardLayout.
- [x] Autonomous Geophysical Expertise AI agent — edge function
      `supabase/functions/geophysics-agent` (openai/gpt-5.2, Lovable AI Gateway,
      3x retry) + UI panel `src/components/geophysical/GeophysicsAgentPanel.tsx`
      with "Run AI Agent" button in Stage 8 header; verified end-to-end on
      BRAWNER 10-15 (ARBUCKLE): conclusion, SPT candidacy, risks, confidence.


- [x] Product demo video: AI agent — data in → computes → results
- [ ] Case study: real field, agent prediction vs actual (waits on real post-treatment data)

## Open
- [ ] Casing Program: menu page, per-well company-scoped storage, editable strings and cementing, schematic and PDF export.
- [x] Stage 6 log-based SPT ranking (Stage 8 solver) with high-Sw / low-k risk intervals.
- [x] Injection & Water Salinity saved per well in the database, shared within the company; Stage 6/8 read it.
- [x] Upstrima integration docs: OpenAPI 3.0 spec for the sandbox API + Section 2 data/security response (Upstrima_Sandbox_OpenAPI.yaml, Upstrima_Section2_Data_Security_Response.md in Files).
- [ ] Recalculate SLB slotted-liner SPT review on real curves + RU/EN client PDF (waits on the LAS file for that well).
- [ ] Selective-review mechanism: risk-flag filter → geophysicist review queue → correction statistics → mode switch (full review first 1-3 months).
- [ ] Send Upstrima the selective-review letter only after the review mechanism is demonstrated (user decision, no deadline).
- [ ] Decide who performs geophysicist review (Maxxwell Production consultant vs. external hire) — user decision.
