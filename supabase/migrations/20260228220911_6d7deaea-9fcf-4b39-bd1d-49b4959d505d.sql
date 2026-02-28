
-- Table for core analysis history
CREATE TABLE public.core_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sample_name text,
  image_url text,
  analysis text NOT NULL,
  rock_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.core_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view analyses from their company
CREATE POLICY "Users can view company core analyses"
  ON public.core_analyses FOR SELECT
  USING (company_id IN (
    SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()
  ));

-- Users can insert analyses for their company
CREATE POLICY "Users can insert core analyses"
  ON public.core_analyses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (
      SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()
    )
  );

-- Users can delete their own analyses
CREATE POLICY "Users can delete own core analyses"
  ON public.core_analyses FOR DELETE
  USING (user_id = auth.uid());

-- Storage bucket for core images
INSERT INTO storage.buckets (id, name, public) VALUES ('core-images', 'core-images', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload core images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'core-images');

CREATE POLICY "Anyone can view core images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'core-images');

CREATE POLICY "Users can delete own core images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'core-images' AND (storage.foldername(name))[1] = auth.uid()::text);
