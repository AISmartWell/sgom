
-- 1. well_restorations: incoming raw data
CREATE TABLE public.well_restorations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  well_id uuid REFERENCES public.wells(id) ON DELETE SET NULL,
  well_external_ref text,
  restoration_date timestamptz NOT NULL DEFAULT now(),
  spt_depth_ft numeric,
  oil_price numeric,
  predicted_qoil numeric,
  actual_qoil numeric,
  predicted_cum numeric,
  actual_cum numeric,
  arps_b_used numeric,
  arps_di_used numeric,
  spt_multiplier_used numeric,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'api',
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.well_restorations TO authenticated;
GRANT ALL ON public.well_restorations TO service_role;
ALTER TABLE public.well_restorations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read restorations" ON public.well_restorations
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE POLICY "Tenant write restorations" ON public.well_restorations
  FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update restorations" ON public.well_restorations
  FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete restorations" ON public.well_restorations
  FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE INDEX idx_restorations_well ON public.well_restorations(well_id, restoration_date DESC);
CREATE INDEX idx_restorations_company ON public.well_restorations(company_id, processed);

-- 2. model_parameters: current calibrated state
CREATE TABLE public.model_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  scope_type text NOT NULL CHECK (scope_type IN ('well','formation','global')),
  scope_key text NOT NULL,
  arps_b numeric NOT NULL DEFAULT 0.5,
  arps_b_variance numeric NOT NULL DEFAULT 0.04,
  arps_di numeric NOT NULL DEFAULT 0.00018,
  arps_di_variance numeric NOT NULL DEFAULT 0.0000001,
  spt_multiplier numeric NOT NULL DEFAULT 1.45,
  spt_multiplier_variance numeric NOT NULL DEFAULT 0.05,
  confidence numeric NOT NULL DEFAULT 50,
  sample_count integer NOT NULL DEFAULT 0,
  model_version text NOT NULL DEFAULT 'v1.0',
  last_calibrated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, scope_type, scope_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_parameters TO authenticated;
GRANT ALL ON public.model_parameters TO service_role;
ALTER TABLE public.model_parameters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read params" ON public.model_parameters
  FOR SELECT TO authenticated
  USING (company_id IS NULL OR company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE POLICY "Tenant write params" ON public.model_parameters
  FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update params" ON public.model_parameters
  FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete params" ON public.model_parameters
  FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE INDEX idx_params_scope ON public.model_parameters(scope_type, scope_key);

-- 3. calibration_audit: log of every auto-calibration
CREATE TABLE public.calibration_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  model_parameter_id uuid REFERENCES public.model_parameters(id) ON DELETE SET NULL,
  restoration_id uuid REFERENCES public.well_restorations(id) ON DELETE SET NULL,
  well_id uuid REFERENCES public.wells(id) ON DELETE SET NULL,
  scope_type text,
  scope_key text,
  method text NOT NULL DEFAULT 'bayesian_1d',
  before_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  input_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  residual numeric,
  mape numeric,
  confidence_delta numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.calibration_audit TO authenticated;
GRANT ALL ON public.calibration_audit TO service_role;
ALTER TABLE public.calibration_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read audit" ON public.calibration_audit
  FOR SELECT TO authenticated
  USING (company_id IS NULL OR company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert audit" ON public.calibration_audit
  FOR INSERT TO authenticated
  WITH CHECK (company_id IS NULL OR company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));
CREATE INDEX idx_audit_scope ON public.calibration_audit(scope_type, scope_key, created_at DESC);
CREATE INDEX idx_audit_company ON public.calibration_audit(company_id, created_at DESC);

-- updated_at triggers
CREATE TRIGGER trg_restorations_updated BEFORE UPDATE ON public.well_restorations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_params_updated BEFORE UPDATE ON public.model_parameters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default global prior
INSERT INTO public.model_parameters (company_id, scope_type, scope_key, arps_b, arps_di, spt_multiplier, confidence, sample_count, model_version, last_calibrated_at)
VALUES (NULL, 'global', 'default', 0.50, 0.00018, 1.45, 50, 0, 'v1.0', now());
