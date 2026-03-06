
-- Audit table: tracks which wells have been analyzed, by whom, with results
CREATE TABLE public.well_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  batch_number integer NOT NULL DEFAULT 1,
  stage_results jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_well_analyses_well_id ON public.well_analyses(well_id);
CREATE INDEX idx_well_analyses_company_id ON public.well_analyses(company_id);
CREATE INDEX idx_well_analyses_batch ON public.well_analyses(company_id, batch_number);

-- Enable RLS
ALTER TABLE public.well_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view analyses from their companies"
  ON public.well_analyses FOR SELECT TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can insert analyses into their companies"
  ON public.well_analyses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can delete own analyses"
  ON public.well_analyses FOR DELETE TO authenticated
  USING (user_id = auth.uid());
