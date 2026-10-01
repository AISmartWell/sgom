CREATE TABLE public.api_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.api_tokens(id) ON DELETE SET NULL,
  token_label text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  action text NOT NULL,
  status_code integer NOT NULL,
  well_ref text,
  verdict text,
  error_code text,
  request_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX api_call_log_created_idx ON public.api_call_log (created_at DESC);
CREATE INDEX api_call_log_token_idx ON public.api_call_log (token_id, created_at DESC);
GRANT SELECT ON public.api_call_log TO authenticated;
GRANT ALL ON public.api_call_log TO service_role;
ALTER TABLE public.api_call_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read api call log" ON public.api_call_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, UPDATE ON public.api_tokens TO authenticated;
CREATE POLICY "Admins read api tokens" ON public.api_tokens FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins revoke api tokens" ON public.api_tokens FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));