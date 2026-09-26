# Roadmap

## Done
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
