ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'engineer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'geologist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'production';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(user_id uuid, email text, role public.app_role, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email::text, r.role, u.created_at
  FROM auth.users u
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY u.created_at
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;