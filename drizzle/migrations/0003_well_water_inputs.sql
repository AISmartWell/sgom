CREATE TABLE public.well_water_inputs (
  well_id uuid PRIMARY KEY REFERENCES public.wells(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  formation_tds_ppm numeric,
  injection_tds_ppm numeric,
  reservoir_temp_f numeric,
  cum_injected_bbl numeric,
  cum_produced_bbl numeric,
  rw_formation numeric,
  rw_injection numeric,
  injection_share_pct numeric,
  history_period text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.well_water_inputs TO authenticated;
GRANT ALL ON public.well_water_inputs TO service_role;
ALTER TABLE public.well_water_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members view water inputs" ON public.well_water_inputs FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE POLICY "Company members insert water inputs" ON public.well_water_inputs FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.wells w WHERE w.id = well_id AND w.company_id = well_water_inputs.company_id));
CREATE POLICY "Company members update water inputs" ON public.well_water_inputs FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.wells w WHERE w.id = well_id AND w.company_id = well_water_inputs.company_id));
CREATE POLICY "Company members delete water inputs" ON public.well_water_inputs FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE TRIGGER trg_well_water_inputs_updated BEFORE UPDATE ON public.well_water_inputs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();