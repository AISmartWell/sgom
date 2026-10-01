CREATE TABLE public.verdict_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL UNIQUE REFERENCES public.wells(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  original_verdict text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved','corrected','rejected')),
  final_verdict text NOT NULL,
  notes text,
  reviewer_id uuid NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verdict_reviews TO authenticated;
GRANT ALL ON public.verdict_reviews TO service_role;
ALTER TABLE public.verdict_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read reviews" ON public.verdict_reviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.user_id = auth.uid() AND uc.company_id = verdict_reviews.company_id));
CREATE POLICY "Members insert reviews" ON public.verdict_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.user_id = auth.uid() AND uc.company_id = verdict_reviews.company_id));
CREATE POLICY "Members update reviews" ON public.verdict_reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.user_id = auth.uid() AND uc.company_id = verdict_reviews.company_id))
  WITH CHECK (reviewer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.user_id = auth.uid() AND uc.company_id = verdict_reviews.company_id));