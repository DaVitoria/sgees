-- 1. Adicionar campo sexo à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN sexo TEXT CHECK (sexo IN ('H', 'M'));

-- 2. Criar tabela para gerir períodos dos trimestres
CREATE TABLE public.trimestres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_lectivo_id UUID NOT NULL REFERENCES public.anos_lectivos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero >= 1 AND numero <= 3),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  bloqueado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ano_lectivo_id, numero)
);

-- Enable RLS
ALTER TABLE public.trimestres ENABLE ROW LEVEL SECURITY;

-- RLS policies for trimestres
CREATE POLICY "Authenticated users can view trimestres"
ON public.trimestres FOR SELECT
USING (true);

CREATE POLICY "Admins and secretarios can manage trimestres"
ON public.trimestres FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'secretario'));

-- 3. Adicionar director de turma à tabela turmas
ALTER TABLE public.turmas 
ADD COLUMN director_turma_id UUID REFERENCES public.professores(id) ON DELETE SET NULL;

-- 4. Criar função para verificar se trimestre está bloqueado
CREATE OR REPLACE FUNCTION public.is_trimestre_bloqueado(
  p_ano_lectivo_id UUID,
  p_trimestre INTEGER
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT bloqueado FROM public.trimestres 
     WHERE ano_lectivo_id = p_ano_lectivo_id 
     AND numero = p_trimestre),
    -- Se não houver registo, verificar se a data atual passou a data fim
    (SELECT CURRENT_DATE > data_fim FROM public.trimestres 
     WHERE ano_lectivo_id = p_ano_lectivo_id 
     AND numero = p_trimestre),
    false
  )
$$;

-- 5. Criar função para verificar se professor é director de turma
CREATE OR REPLACE FUNCTION public.is_director_turma(
  p_user_id UUID,
  p_turma_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.turmas t
    JOIN public.professores p ON p.id = t.director_turma_id
    WHERE t.id = p_turma_id AND p.user_id = p_user_id
  )
$$;

-- 6. Função para obter estatísticas de género
CREATE OR REPLACE FUNCTION public.get_gender_statistics()
RETURNS JSONB
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_homens', (SELECT COUNT(*) FROM profiles WHERE sexo = 'H'),
    'total_mulheres', (SELECT COUNT(*) FROM profiles WHERE sexo = 'M'),
    'alunos_homens', (SELECT COUNT(*) FROM alunos a JOIN profiles p ON p.id = a.user_id WHERE p.sexo = 'H'),
    'alunos_mulheres', (SELECT COUNT(*) FROM alunos a JOIN profiles p ON p.id = a.user_id WHERE p.sexo = 'M'),
    'professores_homens', (SELECT COUNT(*) FROM professores pr JOIN profiles p ON p.id = pr.user_id WHERE p.sexo = 'H'),
    'professores_mulheres', (SELECT COUNT(*) FROM professores pr JOIN profiles p ON p.id = pr.user_id WHERE p.sexo = 'M'),
    'funcionarios_homens', (SELECT COUNT(*) FROM funcionarios f JOIN profiles p ON p.id = f.user_id WHERE p.sexo = 'H'),
    'funcionarios_mulheres', (SELECT COUNT(*) FROM funcionarios f JOIN profiles p ON p.id = f.user_id WHERE p.sexo = 'M')
  )
$$;

-- 7. Função para contar utilizadores sem role
CREATE OR REPLACE FUNCTION public.get_users_without_role_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id
  )
$$;

-- 8. Adicionar políticas RLS para director de turma ver notas da sua turma
CREATE POLICY "Directores de turma podem ver notas da sua turma"
ON public.notas FOR SELECT
USING (
  has_role(auth.uid(), 'professor') AND
  EXISTS (
    SELECT 1 FROM turmas t
    JOIN professores p ON p.id = t.director_turma_id
    JOIN alunos a ON a.turma_id = t.id
    WHERE p.user_id = auth.uid() AND a.id = notas.aluno_id
  )
);

-- 9. Director de turma pode ver alunos da sua turma
CREATE POLICY "Directores de turma podem ver alunos da sua turma"
ON public.alunos FOR SELECT
USING (
  has_role(auth.uid(), 'professor') AND
  EXISTS (
    SELECT 1 FROM turmas t
    JOIN professores p ON p.id = t.director_turma_id
    WHERE p.user_id = auth.uid() AND t.id = alunos.turma_id
  )
);

-- 10. Director de turma pode ver profiles dos alunos da sua turma
CREATE POLICY "Directores de turma podem ver profiles dos alunos"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'professor') AND
  EXISTS (
    SELECT 1 FROM turmas t
    JOIN professores p ON p.id = t.director_turma_id
    JOIN alunos a ON a.turma_id = t.id
    WHERE p.user_id = auth.uid() AND a.user_id = profiles.id
  )
);