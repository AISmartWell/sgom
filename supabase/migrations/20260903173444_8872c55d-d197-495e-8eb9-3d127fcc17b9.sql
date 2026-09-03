CREATE TABLE public.geophysics_agent_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  well_id UUID,
  well_name TEXT,
  api_number TEXT,
  formation TEXT,
  reservoir_rating TEXT,
  confidence NUMERIC,
  conclusion JSONB NOT NULL,
  log_stats JSONB,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.geophysics_agent_runs TO authenticated;
GRANT ALL ON public.geophysics_agent_runs TO service_role;

ALTER TABLE public.geophysics_agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own agent runs"
ON public.geophysics_agent_runs FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_geophysics_agent_runs_well ON public.geophysics_agent_runs (well_id, created_at DESC);
CREATE INDEX idx_geophysics_agent_runs_user ON public.geophysics_agent_runs (user_id, created_at DESC);