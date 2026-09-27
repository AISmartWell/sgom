# Roadmap

## Current
- [ ] 2015 → SPT → 2026 Brawner comparison: awaits documented 2015 Brawner rate and measured post-SPT result, or confirmation to show a forecast instead. Current records contain neither a 2015 Brawner rate nor a post-treatment measurement.

## Done
- [x] Verify Brawner 10-15 rates: production history covers 2023–2024; the 2026 SPT work order is planned with 46.23 BOPD forecast baseline and 60.1 BOPD P50 forecast, with no measured post-SPT rate.
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
