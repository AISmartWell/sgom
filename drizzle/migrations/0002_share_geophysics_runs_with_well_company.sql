-- The owning well is the authoritative tenant for an agent run.
-- Keep writes and deletion restricted to the author, and never expose a run
-- after that author loses access to its well's company.
ALTER POLICY "Users manage their own agent runs" ON public.geophysics_agent_runs
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.wells w
      WHERE w.id = geophysics_agent_runs.well_id
        AND w.company_id IN (
          SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.wells w
      WHERE w.id = geophysics_agent_runs.well_id
        AND w.company_id IN (
          SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Company members can read geophysics conclusions"
ON public.geophysics_agent_runs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wells w
    WHERE w.id = geophysics_agent_runs.well_id
      AND w.company_id IN (
        SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()
      )
  )
);