
CREATE TABLE public.production_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  production_month date NOT NULL,
  oil_bbl double precision DEFAULT 0,
  gas_mcf double precision DEFAULT 0,
  water_bbl double precision DEFAULT 0,
  days_on integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (well_id, production_month)
);

CREATE INDEX idx_production_history_well ON public.production_history(well_id);
CREATE INDEX idx_production_history_month ON public.production_history(production_month);
CREATE INDEX idx_production_history_company ON public.production_history(company_id);

ALTER TABLE public.production_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view production history from their companies"
  ON public.production_history FOR SELECT TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can insert production history into their companies"
  ON public.production_history FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can update production history in their companies"
  ON public.production_history FOR UPDATE TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can delete production history from their companies"
  ON public.production_history FOR DELETE TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));
