-- Adicionar coluna de status à tabela matriculas se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matriculas' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.matriculas ADD COLUMN status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada'));
  END IF;
END $$;

-- Criar função para gerar número de matrícula incremental
CREATE OR REPLACE FUNCTION public.gerar_numero_matricula()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ultimo_numero text;
  proximo_numero integer;
BEGIN
  -- Buscar o último número de matrícula
  SELECT numero_matricula INTO ultimo_numero
  FROM alunos
  WHERE numero_matricula ~ '^M[0-9]{4}$'
  ORDER BY numero_matricula DESC
  LIMIT 1;
  
  -- Se não houver nenhum, começar de M0001
  IF ultimo_numero IS NULL THEN
    RETURN 'M0001';
  END IF;
  
  -- Extrair o número e incrementar
  proximo_numero := CAST(SUBSTRING(ultimo_numero FROM 2) AS integer) + 1;
  
  -- Retornar formatado com zeros à esquerda
  RETURN 'M' || LPAD(proximo_numero::text, 4, '0');
END;
$$;

-- Atualizar RLS policies para permitir alunos criarem suas próprias matrículas
DROP POLICY IF EXISTS "Alunos podem criar suas próprias matriculas" ON public.matriculas;
CREATE POLICY "Alunos podem criar suas próprias matriculas"
ON public.matriculas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM alunos
    WHERE alunos.id = matriculas.aluno_id
    AND alunos.user_id = auth.uid()
  )
);

-- Permitir que alunos criem seus próprios registros na tabela alunos
DROP POLICY IF EXISTS "Alunos podem criar seu proprio registro" ON public.alunos;
CREATE POLICY "Alunos podem criar seu proprio registro"
ON public.alunos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir que funcionários atualizem matrículas (aprovar/rejeitar)
DROP POLICY IF EXISTS "Funcionarios podem atualizar matriculas" ON public.matriculas;
CREATE POLICY "Funcionarios podem atualizar matriculas"
ON public.matriculas
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'secretario'::app_role) OR 
  has_role(auth.uid(), 'funcionario'::app_role)
);

-- Adicionar role 'secretario' ao enum app_role se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'app_role'::regtype 
    AND enumlabel = 'secretario'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'secretario';
  END IF;
END $$;

COMMENT ON FUNCTION public.gerar_numero_matricula IS 'Gera número de matrícula incremental no formato M0001, M0002, etc.';