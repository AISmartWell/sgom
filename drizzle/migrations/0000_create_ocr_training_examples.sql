CREATE TABLE public.ocr_training_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  label TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'well_log',
  verified JSONB NOT NULL,
  curve_hints TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ocr_training_examples TO authenticated;
GRANT SELECT ON public.ocr_training_examples TO anon;
GRANT ALL ON public.ocr_training_examples TO service_role;

ALTER TABLE public.ocr_training_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read training examples of their companies"
ON public.ocr_training_examples FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR company_id IS NULL
  OR company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
);

CREATE POLICY "Users insert their own training examples"
ON public.ocr_training_examples FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own training examples"
ON public.ocr_training_examples FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete their own training examples"
ON public.ocr_training_examples FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_ocr_training_examples_active ON public.ocr_training_examples (is_active, created_at DESC);