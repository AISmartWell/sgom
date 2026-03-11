
-- Create seismic-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('seismic-images', 'seismic-images', true);

-- RLS policies for seismic-images bucket
CREATE POLICY "Users can upload seismic images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'seismic-images');

CREATE POLICY "Users can view seismic images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'seismic-images');

CREATE POLICY "Users can delete own seismic images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'seismic-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view seismic images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'seismic-images');
