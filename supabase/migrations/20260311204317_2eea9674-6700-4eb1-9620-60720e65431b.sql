
-- Table: seismic_images (metadata for uploaded seismic section images)
CREATE TABLE public.seismic_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid REFERENCES public.wells(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  description text,
  image_type text DEFAULT '2d_section',
  formation text,
  api_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seismic_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company seismic images" ON public.seismic_images
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can insert seismic images" ON public.seismic_images
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can update own seismic images" ON public.seismic_images
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own seismic images" ON public.seismic_images
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Table: seismic_analyses (CV analysis results)
CREATE TABLE public.seismic_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seismic_image_id uuid REFERENCES public.seismic_images(id) ON DELETE CASCADE,
  well_id uuid REFERENCES public.wells(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  analysis_mode text NOT NULL DEFAULT 'full',
  model text,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seismic_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company seismic analyses" ON public.seismic_analyses
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can insert seismic analyses" ON public.seismic_analyses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can delete own seismic analyses" ON public.seismic_analyses
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
