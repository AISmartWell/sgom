CREATE OR REPLACE FUNCTION public.can_import_well(_well_id uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'engineer')) THEN
    RAISE EXCEPTION 'Only admin or engineer roles can import data';
  END IF;
  SELECT w.company_id INTO cid FROM public.wells w
   WHERE w.id = _well_id AND EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.user_id = auth.uid() AND uc.company_id = w.company_id);
  IF cid IS NULL THEN RAISE EXCEPTION 'Well % not found in your company', _well_id; END IF;
  RETURN cid;
END $$;
REVOKE EXECUTE ON FUNCTION public.can_import_well(uuid) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.replace_well_logs(p_well_id uuid, p_top double precision, p_base double precision, p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; n integer;
BEGIN
  cid := public.can_import_well(p_well_id);
  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) < 1 OR jsonb_array_length(p_rows) > 50000 THEN
    RAISE EXCEPTION 'Rows must be an array of 1-50000 samples';
  END IF;
  IF p_top IS NULL OR p_base IS NULL OR p_base < p_top THEN RAISE EXCEPTION 'Invalid depth range'; END IF;
  DELETE FROM public.well_logs WHERE well_id = p_well_id AND company_id = cid AND measured_depth BETWEEN p_top AND p_base;
  INSERT INTO public.well_logs (well_id, company_id, measured_depth, gamma_ray, resistivity, porosity, water_saturation, sp, density, neutron_porosity, source)
  SELECT p_well_id, cid, (r->>'measured_depth')::float8, (r->>'gamma_ray')::float8, (r->>'resistivity')::float8, (r->>'porosity')::float8,
         (r->>'water_saturation')::float8, (r->>'sp')::float8, (r->>'density')::float8, (r->>'neutron_porosity')::float8, 'las_import'
  FROM jsonb_array_elements(p_rows) r;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.replace_well_logs(uuid, double precision, double precision, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_well_logs(uuid, double precision, double precision, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.import_maxxwell_batch(p_items jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it jsonb; c jsonb; wid uuid; cid uuid; n integer := 0;
BEGIN
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 500 THEN
    RAISE EXCEPTION 'Batch must contain 1-500 wells';
  END IF;
  FOR it IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    wid := (it->>'well_id')::uuid;
    cid := public.can_import_well(wid);
    c := it->'conditions';
    IF c IS NOT NULL AND jsonb_typeof(c) = 'object' THEN
      INSERT INTO public.well_water_inputs AS t (well_id, company_id, reservoir_pressure_psi, pressure_datum_ft, bht_f, bht_depth_ft, surface_temp_f, updated_by)
      VALUES (wid, cid, (c->>'reservoir_pressure_psi')::numeric, (c->>'pressure_datum_ft')::numeric, (c->>'bht_f')::numeric, (c->>'bht_depth_ft')::numeric, (c->>'surface_temp_f')::numeric, auth.uid())
      ON CONFLICT (well_id) DO UPDATE SET
        reservoir_pressure_psi = COALESCE(EXCLUDED.reservoir_pressure_psi, t.reservoir_pressure_psi),
        pressure_datum_ft = COALESCE(EXCLUDED.pressure_datum_ft, t.pressure_datum_ft),
        bht_f = COALESCE(EXCLUDED.bht_f, t.bht_f),
        bht_depth_ft = COALESCE(EXCLUDED.bht_depth_ft, t.bht_depth_ft),
        surface_temp_f = COALESCE(EXCLUDED.surface_temp_f, t.surface_temp_f),
        updated_by = auth.uid();
      IF c->>'water_cut_pct' IS NOT NULL THEN
        IF (c->>'water_cut_pct')::numeric NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Water cut must be 0-100'; END IF;
        UPDATE public.wells SET water_cut = (c->>'water_cut_pct')::float8 WHERE id = wid AND company_id = cid;
      END IF;
    END IF;
    IF jsonb_typeof(it->'casing') = 'array' AND jsonb_array_length(it->'casing') > 0 THEN
      IF NOT public.valid_casing_strings(it->'casing') THEN RAISE EXCEPTION 'Invalid casing strings for well %', wid; END IF;
      INSERT INTO public.well_casing_programs AS t (well_id, company_id, strings, source, notes, updated_by)
      VALUES (wid, cid, it->'casing', 'Maxxwell import ' || to_char(now(), 'YYYY-MM-DD'), 'Imported from Maxxwell CSV. Verify against well file before field use.', auth.uid())
      ON CONFLICT (well_id) DO UPDATE SET strings = EXCLUDED.strings, source = EXCLUDED.source, notes = EXCLUDED.notes, updated_by = EXCLUDED.updated_by;
    END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.import_maxxwell_batch(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_maxxwell_batch(jsonb) TO authenticated;