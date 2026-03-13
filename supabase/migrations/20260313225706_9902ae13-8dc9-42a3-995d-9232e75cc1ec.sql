
-- Create well_perforations table
CREATE TABLE public.well_perforations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  well_id UUID NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  depth_from DOUBLE PRECISION NOT NULL,
  depth_to DOUBLE PRECISION NOT NULL,
  shots_per_foot INTEGER DEFAULT 4,
  hole_diameter DOUBLE PRECISION DEFAULT 0.42,
  phasing INTEGER DEFAULT 120,
  date_perforated DATE,
  status TEXT DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.well_perforations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view perforations from their companies"
  ON public.well_perforations FOR SELECT TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can insert perforations into their companies"
  ON public.well_perforations FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can update perforations in their companies"
  ON public.well_perforations FOR UPDATE TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can delete perforations from their companies"
  ON public.well_perforations FOR DELETE TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

-- Index for fast lookup
CREATE INDEX idx_well_perforations_well_id ON public.well_perforations(well_id);
