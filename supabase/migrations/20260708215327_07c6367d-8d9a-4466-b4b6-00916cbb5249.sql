
CREATE TABLE public.well_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  well_id uuid REFERENCES public.wells(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  doc_type text NOT NULL DEFAULT 'other',
  tags text[] NOT NULL DEFAULT '{}',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  notes text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_well_documents_company ON public.well_documents(company_id);
CREATE INDEX idx_well_documents_well ON public.well_documents(well_id);
CREATE INDEX idx_well_documents_tags ON public.well_documents USING GIN(tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.well_documents TO authenticated;
GRANT ALL ON public.well_documents TO service_role;

ALTER TABLE public.well_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view company documents"
  ON public.well_documents FOR SELECT TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users insert company documents"
  ON public.well_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

CREATE POLICY "Uploader or admin updates"
  ON public.well_documents FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Uploader or admin deletes"
  ON public.well_documents FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_well_documents_updated_at
  BEFORE UPDATE ON public.well_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for private bucket 'well-documents'
CREATE POLICY "Company members read well-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'well-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT uc.company_id::text FROM public.user_companies uc WHERE uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members upload well-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'well-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT uc.company_id::text FROM public.user_companies uc WHERE uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner or admin delete well-documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'well-documents'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );
