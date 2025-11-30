-- Create table for school organizational structure (organograma)
CREATE TABLE public.organograma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo text NOT NULL,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organograma ENABLE ROW LEVEL SECURITY;

-- Everyone can view organograma
CREATE POLICY "Anyone can view organograma"
ON public.organograma
FOR SELECT
USING (true);

-- Admins and funcionarios can manage organograma
CREATE POLICY "Admins and funcionarios can manage organograma"
ON public.organograma
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'funcionario'));

-- Insert default structure
INSERT INTO public.organograma (cargo, nome, ordem) VALUES
  ('Presidente do Conselho', 'A definir', 1),
  ('Director da Escola', 'A definir', 2),
  ('Director Adjunto Pedagógico', 'A definir', 3),
  ('Director Adjunto Administrativo', 'A definir', 4);