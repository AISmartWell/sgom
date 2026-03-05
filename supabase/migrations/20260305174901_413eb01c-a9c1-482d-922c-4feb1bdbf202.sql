
-- Missing RLS: DELETE on well_alerts
CREATE POLICY "Users can delete alerts in their companies"
ON public.well_alerts
FOR DELETE
TO authenticated
USING (company_id IN (
  SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()
));

-- Missing RLS: UPDATE on core_analyses
CREATE POLICY "Users can update own core analyses"
ON public.core_analyses
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Missing RLS: UPDATE on companies (members only)
CREATE POLICY "Users can update their companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (id IN (
  SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()
))
WITH CHECK (id IN (
  SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()
));

-- Missing RLS: DELETE on companies (members only)
CREATE POLICY "Users can delete their companies"
ON public.companies
FOR DELETE
TO authenticated
USING (id IN (
  SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()
));

-- Missing RLS: UPDATE on user_companies (own membership)
CREATE POLICY "Users can update their memberships"
ON public.user_companies
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Missing RLS: DELETE on user_companies (leave company)
CREATE POLICY "Users can leave companies"
ON public.user_companies
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
