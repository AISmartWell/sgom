
-- Core images table: stores references to core sample photos linked to wells
CREATE TABLE public.core_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  well_id UUID REFERENCES public.wells(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'upload',
  depth_from DOUBLE PRECISION,
  depth_to DOUBLE PRECISION,
  rock_type TEXT,
  formation TEXT,
  api_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.core_images ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access core images from their company
CREATE POLICY "Users can view company core images"
  ON public.core_images FOR SELECT
  USING (company_id IN (
    SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert core images"
  ON public.core_images FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (
      SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own core images"
  ON public.core_images FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own core images"
  ON public.core_images FOR UPDATE
  USING (user_id = auth.uid());
