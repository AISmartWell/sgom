
-- Create the update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Table for real well data from state databases
CREATE TABLE public.wells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_number TEXT UNIQUE,
  well_name TEXT,
  operator TEXT,
  well_type TEXT,
  status TEXT,
  county TEXT,
  state TEXT NOT NULL DEFAULT 'OK',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  total_depth DOUBLE PRECISION,
  formation TEXT,
  spud_date DATE,
  completion_date DATE,
  production_oil DOUBLE PRECISION,
  production_gas DOUBLE PRECISION,
  water_cut DOUBLE PRECISION,
  source TEXT DEFAULT 'OCC',
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wells ENABLE ROW LEVEL SECURITY;

-- Public read access (public government data)
CREATE POLICY "Wells are publicly readable"
  ON public.wells FOR SELECT
  USING (true);

-- Only authenticated users can trigger imports
CREATE POLICY "Authenticated users can insert wells"
  ON public.wells FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update wells"
  ON public.wells FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_wells_state ON public.wells(state);
CREATE INDEX idx_wells_county ON public.wells(county);
CREATE INDEX idx_wells_well_type ON public.wells(well_type);
CREATE INDEX idx_wells_api_number ON public.wells(api_number);
CREATE INDEX idx_wells_lat_lng ON public.wells(latitude, longitude);

-- Trigger for updated_at
CREATE TRIGGER update_wells_updated_at
  BEFORE UPDATE ON public.wells
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
