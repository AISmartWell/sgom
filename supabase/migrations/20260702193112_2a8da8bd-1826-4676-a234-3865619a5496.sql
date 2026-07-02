
CREATE TABLE public.registry_scan_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_run_id UUID NOT NULL,
  company_id UUID,
  status TEXT NOT NULL DEFAULT 'ok',
  radius_miles NUMERIC,
  seeds_count INT NOT NULL DEFAULT 0,
  suggestions_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_registry_scan_runs_company_created ON public.registry_scan_runs (company_id, created_at DESC);

GRANT SELECT, INSERT ON public.registry_scan_runs TO authenticated;
GRANT ALL ON public.registry_scan_runs TO service_role;

ALTER TABLE public.registry_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view runs of their company"
  ON public.registry_scan_runs FOR SELECT
  TO authenticated
  USING (
    company_id IS NULL
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.user_id = auth.uid() AND uc.company_id = registry_scan_runs.company_id
    )
  );

CREATE POLICY "Service role manages runs"
  ON public.registry_scan_runs FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
