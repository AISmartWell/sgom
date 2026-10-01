-- Upstrima sandbox: API tokens with expiry + isolated demo company

CREATE TABLE public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scopes text[] NOT NULL DEFAULT ARRAY['spt_screening','log_ranking','well_verdict'],
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.api_tokens TO service_role;
-- no grants to anon/authenticated: tokens are managed only by edge functions (service_role)

ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
-- no policies: direct client access is denied; edge functions use service_role

-- Sandbox company for Upstrima testing (demo data only)
INSERT INTO public.companies (name) VALUES ('SGOM Sandbox (Upstrima)') RETURNING id;

-- Demo wells in the sandbox company
INSERT INTO public.wells (company_id, api_number, well_name, operator, well_type, status, county, state, latitude, longitude, total_depth, formation, production_oil, production_gas, water_cut, source, raw_data)
SELECT c.id, v.* FROM public.companies c
CROSS JOIN (VALUES
  ('42-101-00001','Brawner 10-15 (Demo)','SGOM Demo','OIL','AC','Demo County','TX',31.85,-102.35,5070,'Rodessa / James Lime',12.5,45.0,68.0,'demo','{"note":"illustrative demo well, no client data"}'::jsonb),
  ('42-101-00002','SLB Slotted Liner Case Alfa (Demo)','SGOM Demo','GAS','AC','Demo County','TX',31.90,-102.40,14777,'Deep Gas Sand',NULL,850.0,NULL,'demo','{"note":"illustrative demo well, no client data"}'::jsonb),
  ('42-101-00003','Foote Lease 3 (Demo)','SGOM Demo','OIL','PA','Demo County','OK',35.20,-97.45,4200,'Booch',3.2,10.0,82.0,'demo','{"note":"illustrative demo well, no client data"}'::jsonb)
) AS v(api_number, well_name, operator, well_type, status, county, state, latitude, longitude, total_depth, formation, production_oil, production_gas, water_cut, source, raw_data)
WHERE c.name = 'SGOM Sandbox (Upstrima)';