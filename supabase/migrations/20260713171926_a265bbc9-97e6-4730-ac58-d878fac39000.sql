
CREATE TABLE public.well_pressures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id UUID NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  estimation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  p_initial_psi NUMERIC,
  p_current_psi NUMERIC,
  depletion_pct NUMERIC,
  method TEXT NOT NULL DEFAULT 'gradient',
  gradient_psi_ft NUMERIC DEFAULT 0.465,
  datum_depth_ft NUMERIC,
  confidence NUMERIC DEFAULT 0.7,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_well_pressures_well ON public.well_pressures(well_id);
CREATE INDEX idx_well_pressures_company ON public.well_pressures(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.well_pressures TO authenticated;
GRANT ALL ON public.well_pressures TO service_role;

ALTER TABLE public.well_pressures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view pressures in their company"
  ON public.well_pressures FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users insert pressures for their company"
  ON public.well_pressures FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users update pressures in their company"
  ON public.well_pressures FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users delete pressures in their company"
  ON public.well_pressures FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE TRIGGER trg_well_pressures_updated
  BEFORE UPDATE ON public.well_pressures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
