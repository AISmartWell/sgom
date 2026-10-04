CREATE FUNCTION public.valid_casing_strings(items jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE r jsonb; t numeric; b numeric; od numeric; wall numeric; toc numeric;
BEGIN
 IF jsonb_typeof(items) <> 'array' OR jsonb_array_length(items) > 50 THEN RETURN false; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(items) LOOP
  IF jsonb_typeof(r) <> 'object' OR NOT (r ?& ARRAY['id','type','top_ft','bottom_ft','od_in','wall_in','grade','cement_status','cement_top_ft','notes']) THEN RETURN false; END IF;
  IF jsonb_typeof(r->'top_ft') <> 'number' OR jsonb_typeof(r->'bottom_ft') <> 'number' OR jsonb_typeof(r->'od_in') <> 'number' OR jsonb_typeof(r->'wall_in') <> 'number' THEN RETURN false; END IF;
  t := (r->>'top_ft')::numeric; b := (r->>'bottom_ft')::numeric; od := (r->>'od_in')::numeric; wall := (r->>'wall_in')::numeric;
  IF t < 0 OR b <= t OR b > 60000 OR od <= 0 OR od > 60 OR wall <= 0 OR wall * 2 >= od THEN RETURN false; END IF;
  IF length(trim(r->>'grade')) NOT BETWEEN 1 AND 80 OR length(r->>'notes') > 2000 OR (r->>'type') NOT IN ('Conductor','Surface','Intermediate','Production','Liner') OR (r->>'cement_status') NOT IN ('Unknown','Planned','Cemented','Not cemented') THEN RETURN false; END IF;
  IF r->'cement_top_ft' <> 'null'::jsonb THEN
   IF jsonb_typeof(r->'cement_top_ft') <> 'number' THEN RETURN false; END IF;
   toc := (r->>'cement_top_ft')::numeric; IF toc < t OR toc > b THEN RETURN false; END IF;
  END IF;
 END LOOP;
 RETURN true;
EXCEPTION WHEN others THEN RETURN false;
END; $$;
CREATE TABLE public.well_casing_programs (
 well_id uuid PRIMARY KEY REFERENCES public.wells(id) ON DELETE CASCADE,
 company_id uuid NOT NULL REFERENCES public.companies(id),
 strings jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (public.valid_casing_strings(strings)),
 source text NOT NULL DEFAULT '' CHECK (length(source) <= 1000),
 notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 4000),
 updated_by uuid DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.well_casing_programs TO authenticated;
GRANT ALL ON public.well_casing_programs TO service_role;
ALTER TABLE public.well_casing_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members read casing programs" ON public.well_casing_programs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_companies uc JOIN public.wells w ON w.company_id = uc.company_id WHERE uc.user_id = auth.uid() AND w.id = well_id AND w.company_id = well_casing_programs.company_id));
CREATE POLICY "Company members insert casing programs" ON public.well_casing_programs FOR INSERT TO authenticated WITH CHECK (updated_by = auth.uid() AND EXISTS (SELECT 1 FROM public.user_companies uc JOIN public.wells w ON w.company_id = uc.company_id WHERE uc.user_id = auth.uid() AND w.id = well_id AND w.company_id = well_casing_programs.company_id));
CREATE POLICY "Company members update casing programs" ON public.well_casing_programs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_companies uc JOIN public.wells w ON w.company_id = uc.company_id WHERE uc.user_id = auth.uid() AND w.id = well_id AND w.company_id = well_casing_programs.company_id)) WITH CHECK (updated_by = auth.uid() AND EXISTS (SELECT 1 FROM public.user_companies uc JOIN public.wells w ON w.company_id = uc.company_id WHERE uc.user_id = auth.uid() AND w.id = well_id AND w.company_id = well_casing_programs.company_id));
CREATE POLICY "Company members delete casing programs" ON public.well_casing_programs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_companies uc JOIN public.wells w ON w.company_id = uc.company_id WHERE uc.user_id = auth.uid() AND w.id = well_id AND w.company_id = well_casing_programs.company_id));
CREATE TRIGGER casing_program_updated BEFORE UPDATE ON public.well_casing_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX casing_program_company_idx ON public.well_casing_programs(company_id);