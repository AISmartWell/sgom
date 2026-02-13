
-- 1. Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Create user_companies junction table
CREATE TABLE public.user_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- 3. Insert default company for existing data
INSERT INTO public.companies (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Company');

-- 4. Link all existing users to default company
INSERT INTO public.user_companies (user_id, company_id)
SELECT id, '00000000-0000-0000-0000-000000000001' FROM auth.users
ON CONFLICT (user_id, company_id) DO NOTHING;

-- 5. Add company_id to wells (nullable first)
ALTER TABLE public.wells ADD COLUMN company_id UUID;

-- 6. Set existing wells to default company
UPDATE public.wells SET company_id = '00000000-0000-0000-0000-000000000001';

-- 7. Make NOT NULL + FK
ALTER TABLE public.wells
  ALTER COLUMN company_id SET NOT NULL,
  ADD CONSTRAINT wells_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 8. Drop old wells RLS policies
DROP POLICY IF EXISTS "Wells are publicly readable" ON public.wells;
DROP POLICY IF EXISTS "Authenticated users can insert wells" ON public.wells;
DROP POLICY IF EXISTS "Authenticated users can update wells" ON public.wells;

-- 9. New company-isolated wells RLS
CREATE POLICY "Users can view wells from their companies"
ON public.wells FOR SELECT
USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert wells into their companies"
ON public.wells FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update wells in their companies"
ON public.wells FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete wells from their companies"
ON public.wells FOR DELETE
USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

-- 10. Companies RLS policies
CREATE POLICY "Users can view their companies"
ON public.companies FOR SELECT
USING (id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can create companies"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 11. user_companies RLS policies
CREATE POLICY "Users can view their memberships"
ON public.user_companies FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can join companies"
ON public.user_companies FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 12. Triggers
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
