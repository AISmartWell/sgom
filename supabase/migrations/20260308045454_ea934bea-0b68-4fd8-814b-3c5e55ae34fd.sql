
-- Formation/KDOR codes reference table (public, no RLS needed - reference data)
CREATE TABLE public.formation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  state_code text NOT NULL,
  state_name text NOT NULL,
  county_fips text,
  county_name text,
  well_type text,
  formation text,
  basin text,
  description text,
  source text DEFAULT 'KDOR',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_formation_codes_code ON public.formation_codes(code);
CREATE INDEX idx_formation_codes_state ON public.formation_codes(state_code);
CREATE INDEX idx_formation_codes_county ON public.formation_codes(county_name);

-- Enable RLS but allow public read access (reference data)
ALTER TABLE public.formation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read formation codes"
  ON public.formation_codes FOR SELECT
  TO authenticated
  USING (true);
