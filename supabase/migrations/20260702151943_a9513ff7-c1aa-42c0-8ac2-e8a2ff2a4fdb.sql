
CREATE TABLE public.registry_scan_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  api_number TEXT,
  well_name TEXT,
  operator TEXT,
  well_type TEXT,
  status TEXT,
  county TEXT,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  total_depth DOUBLE PRECISION,
  formation TEXT,
  source TEXT,
  distance_miles DOUBLE PRECISION,
  nearest_well_id UUID REFERENCES public.wells(id) ON DELETE SET NULL,
  score DOUBLE PRECISION,
  reason TEXT,
  raw_data JSONB,
  suggestion_status TEXT NOT NULL DEFAULT 'pending',
  scan_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registry_scan_suggestions_unique_pending UNIQUE (company_id, api_number)
);

CREATE INDEX idx_rss_company ON public.registry_scan_suggestions(company_id, suggestion_status);
CREATE INDEX idx_rss_created ON public.registry_scan_suggestions(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registry_scan_suggestions TO authenticated;
GRANT ALL ON public.registry_scan_suggestions TO service_role;

ALTER TABLE public.registry_scan_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see suggestions for their company"
ON public.registry_scan_suggestions
FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users update suggestions for their company"
ON public.registry_scan_suggestions
FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users delete suggestions for their company"
ON public.registry_scan_suggestions
FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages all suggestions"
ON public.registry_scan_suggestions
FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER trg_rss_updated
BEFORE UPDATE ON public.registry_scan_suggestions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
