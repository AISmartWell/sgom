CREATE TABLE public.company_knowledge_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  source text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_knowledge_notes TO authenticated;
GRANT ALL ON public.company_knowledge_notes TO service_role;
ALTER TABLE public.company_knowledge_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read" ON public.company_knowledge_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = company_knowledge_notes.company_id AND uc.user_id = auth.uid()));
CREATE POLICY "admin insert" ON public.company_knowledge_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = company_knowledge_notes.company_id AND uc.user_id = auth.uid()));
CREATE POLICY "admin update" ON public.company_knowledge_notes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = company_knowledge_notes.company_id AND uc.user_id = auth.uid()));
CREATE POLICY "admin delete" ON public.company_knowledge_notes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = company_knowledge_notes.company_id AND uc.user_id = auth.uid()));

INSERT INTO public.company_knowledge_notes (company_id, title, source, content) VALUES
('00000000-0000-0000-0000-000000000001','Maxxwell HSP field economics and post-HSP stimulation ladder','Maxxwell Production 2011-2016 slides, pp. 44-49 (internal, minimum reference estimates, not a quote)',
'HSP rate uplift: low-rate oil well 5-10 bbl/d -> 30-40 bbl/d after HSP.
Post-HSP stimulation ladder (each step from previous level): acid treatment 30-40 -> 40-45 bbl/d, cost about $3,570; pulsed hydraulic shocks 40-45 -> 50-60 bbl/d, about $20,730 (+30%); gentle hydraulic fracturing 50-60 -> 75-80 bbl/d, about $40,095 (+60%).
Cement ring: if water cut > 70%, suspect cracks in the cement ring causing water flooding; options: cement ring repair about $11,250 or isolation of the watered interval with packers about $12,375.
Injector re-completion with HSP: about $134,602; can raise inflow of nearby oil wells by up to 20%; one injector typically supports 3-4 oil wells.
Always verify saturation (oil dominant) before recommending treatment. Present these as reference minimum estimates from Maxxwell 2011-2016, not a commercial quote. Do not disclose SPT/HSP tool know-how details.');