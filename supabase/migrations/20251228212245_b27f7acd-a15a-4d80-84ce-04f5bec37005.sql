-- Add confirmation status to financas table for student payments
ALTER TABLE public.financas 
ADD COLUMN IF NOT EXISTS status_confirmacao TEXT DEFAULT 'confirmado' CHECK (status_confirmacao IN ('pendente', 'confirmado', 'rejeitado'));

-- Add column to track who confirmed the payment
ALTER TABLE public.financas 
ADD COLUMN IF NOT EXISTS confirmado_por UUID REFERENCES public.profiles(id);

-- Add column for confirmation date
ALTER TABLE public.financas 
ADD COLUMN IF NOT EXISTS data_confirmacao TIMESTAMP WITH TIME ZONE;

-- Add column for rejection reason
ALTER TABLE public.financas 
ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;

-- Update existing records to be confirmed (since they were entered by staff)
UPDATE public.financas SET status_confirmacao = 'confirmado' WHERE status_confirmacao IS NULL;

-- Create RLS policy for students to submit payments
CREATE POLICY "Alunos podem submeter pagamentos"
ON public.financas
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'aluno') AND
  tipo = 'entrada' AND
  status_confirmacao = 'pendente' AND
  aluno_id = (SELECT id FROM alunos WHERE user_id = auth.uid())
);

-- Create RLS policy for students to view their own payments
CREATE POLICY "Alunos podem ver seus pagamentos"
ON public.financas
FOR SELECT
USING (
  has_role(auth.uid(), 'aluno') AND
  aluno_id = (SELECT id FROM alunos WHERE user_id = auth.uid())
);

-- Create policy for secretario/tesoureiro/funcionario to confirm payments
CREATE POLICY "Staff pode confirmar pagamentos"
ON public.financas
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'secretario') OR 
  has_role(auth.uid(), 'tesoureiro') OR
  has_role(auth.uid(), 'funcionario')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'secretario') OR 
  has_role(auth.uid(), 'tesoureiro') OR
  has_role(auth.uid(), 'funcionario')
);

-- Add index for faster queries on pending payments
CREATE INDEX IF NOT EXISTS idx_financas_status_confirmacao ON public.financas(status_confirmacao);

-- Enable realtime for financas table
ALTER PUBLICATION supabase_realtime ADD TABLE public.financas;