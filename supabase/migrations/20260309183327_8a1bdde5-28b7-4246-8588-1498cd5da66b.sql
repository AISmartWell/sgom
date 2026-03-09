
-- Table for digitized well log curves (depth-indexed readings)
CREATE TABLE public.well_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  measured_depth double precision NOT NULL,
  gamma_ray double precision,
  resistivity double precision,
  porosity double precision,
  water_saturation double precision,
  sp double precision,
  density double precision,
  neutron_porosity double precision,
  source text NOT NULL DEFAULT 'digitized',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.well_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view well logs from their companies"
  ON public.well_logs FOR SELECT TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can insert well logs into their companies"
  ON public.well_logs FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can delete well logs from their companies"
  ON public.well_logs FOR DELETE TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

-- Index for fast lookup
CREATE INDEX idx_well_logs_well_depth ON public.well_logs(well_id, measured_depth);
