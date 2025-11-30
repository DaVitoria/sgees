-- Add foto_url column to organograma table
ALTER TABLE public.organograma ADD COLUMN foto_url text;

-- Create storage bucket for organograma photos
INSERT INTO storage.buckets (id, name, public) VALUES ('organograma', 'organograma', true);

-- Allow anyone to view organograma photos
CREATE POLICY "Anyone can view organograma photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'organograma');

-- Allow admins and funcionarios to manage organograma photos
CREATE POLICY "Admins and funcionarios can manage organograma photos"
ON storage.objects FOR ALL
USING (bucket_id = 'organograma' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'funcionario')))
WITH CHECK (bucket_id = 'organograma' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'funcionario')));