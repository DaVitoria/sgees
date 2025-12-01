-- ============================================
-- MIGRATION: Adicionar Validação de Integridade Referencial
-- Objetivo: Garantir integridade de dados e prevenir erros de relacionamento
-- ============================================

-- 1. Adicionar índices em colunas de foreign keys para melhor performance
CREATE INDEX IF NOT EXISTS idx_alunos_user_id ON public.alunos(user_id);
CREATE INDEX IF NOT EXISTS idx_alunos_turma_id ON public.alunos(turma_id);

CREATE INDEX IF NOT EXISTS idx_documentos_aluno_id ON public.documentos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_documentos_user_id ON public.documentos(user_id);
CREATE INDEX IF NOT EXISTS idx_documentos_gerado_por ON public.documentos(gerado_por);

CREATE INDEX IF NOT EXISTS idx_financas_aluno_id ON public.financas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_financas_registado_por ON public.financas(registado_por);

CREATE INDEX IF NOT EXISTS idx_funcionarios_user_id ON public.funcionarios(user_id);

CREATE INDEX IF NOT EXISTS idx_inventario_responsavel_id ON public.inventario(responsavel_id);

CREATE INDEX IF NOT EXISTS idx_matriculas_aluno_id ON public.matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_ano_lectivo_id ON public.matriculas(ano_lectivo_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_turma_id ON public.matriculas(turma_id);

CREATE INDEX IF NOT EXISTS idx_notas_aluno_id ON public.notas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_notas_disciplina_id ON public.notas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_notas_ano_lectivo_id ON public.notas(ano_lectivo_id);
CREATE INDEX IF NOT EXISTS idx_notas_lancado_por ON public.notas(lancado_por);

CREATE INDEX IF NOT EXISTS idx_noticias_autor_id ON public.noticias(autor_id);

CREATE INDEX IF NOT EXISTS idx_professor_disciplinas_professor_id ON public.professor_disciplinas(professor_id);
CREATE INDEX IF NOT EXISTS idx_professor_disciplinas_disciplina_id ON public.professor_disciplinas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_professor_disciplinas_turma_id ON public.professor_disciplinas(turma_id);
CREATE INDEX IF NOT EXISTS idx_professor_disciplinas_ano_lectivo_id ON public.professor_disciplinas(ano_lectivo_id);

CREATE INDEX IF NOT EXISTS idx_professores_user_id ON public.professores(user_id);

CREATE INDEX IF NOT EXISTS idx_relatorios_user_id ON public.relatorios(user_id);

CREATE INDEX IF NOT EXISTS idx_turmas_ano_lectivo_id ON public.turmas(ano_lectivo_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 2. Adicionar constraints únicos onde apropriado
-- Garantir que um aluno não pode ter múltiplas matrículas no mesmo ano letivo
CREATE UNIQUE INDEX IF NOT EXISTS idx_matriculas_unique_aluno_ano 
ON public.matriculas(aluno_id, ano_lectivo_id);

-- Garantir que um professor não pode ter a mesma disciplina/turma duplicada no mesmo ano
CREATE UNIQUE INDEX IF NOT EXISTS idx_professor_disciplinas_unique 
ON public.professor_disciplinas(professor_id, disciplina_id, turma_id, ano_lectivo_id);

-- Garantir que não há duplicação de notas (aluno, disciplina, trimestre, ano)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notas_unique 
ON public.notas(aluno_id, disciplina_id, trimestre, ano_lectivo_id);

-- 3. Adicionar CHECK constraints para validação de dados
-- Validar notas (devem estar entre 0 e 20)
ALTER TABLE public.notas 
DROP CONSTRAINT IF EXISTS check_nota_as1_range,
DROP CONSTRAINT IF EXISTS check_nota_as2_range,
DROP CONSTRAINT IF EXISTS check_nota_as3_range,
DROP CONSTRAINT IF EXISTS check_nota_at_range,
DROP CONSTRAINT IF EXISTS check_media_as_range,
DROP CONSTRAINT IF EXISTS check_media_trimestral_range;

ALTER TABLE public.notas 
ADD CONSTRAINT check_nota_as1_range CHECK (nota_as1 IS NULL OR (nota_as1 >= 0 AND nota_as1 <= 20)),
ADD CONSTRAINT check_nota_as2_range CHECK (nota_as2 IS NULL OR (nota_as2 >= 0 AND nota_as2 <= 20)),
ADD CONSTRAINT check_nota_as3_range CHECK (nota_as3 IS NULL OR (nota_as3 >= 0 AND nota_as3 <= 20)),
ADD CONSTRAINT check_nota_at_range CHECK (nota_at IS NULL OR (nota_at >= 0 AND nota_at <= 20)),
ADD CONSTRAINT check_media_as_range CHECK (media_as IS NULL OR (media_as >= 0 AND media_as <= 20)),
ADD CONSTRAINT check_media_trimestral_range CHECK (media_trimestral IS NULL OR (media_trimestral >= 0 AND media_trimestral <= 20));

-- Validar trimestre (deve estar entre 1 e 3)
ALTER TABLE public.notas 
DROP CONSTRAINT IF EXISTS check_trimestre_range;

ALTER TABLE public.notas 
ADD CONSTRAINT check_trimestre_range CHECK (trimestre >= 1 AND trimestre <= 3);

-- Validar classe (deve estar entre 7 e 12 - secundário em Moçambique)
ALTER TABLE public.disciplinas 
DROP CONSTRAINT IF EXISTS check_classe_range;

ALTER TABLE public.disciplinas 
ADD CONSTRAINT check_classe_range CHECK (classe >= 7 AND classe <= 12);

ALTER TABLE public.turmas 
DROP CONSTRAINT IF EXISTS check_classe_range;

ALTER TABLE public.turmas 
ADD CONSTRAINT check_classe_range CHECK (classe >= 7 AND classe <= 12);

-- Validar capacidade da turma (deve ser maior que 0)
ALTER TABLE public.turmas 
DROP CONSTRAINT IF EXISTS check_capacidade_positive;

ALTER TABLE public.turmas 
ADD CONSTRAINT check_capacidade_positive CHECK (capacidade IS NULL OR capacidade > 0);

-- Validar valores financeiros (devem ser maiores que 0)
ALTER TABLE public.financas 
DROP CONSTRAINT IF EXISTS check_valor_positive;

ALTER TABLE public.financas 
ADD CONSTRAINT check_valor_positive CHECK (valor > 0);

-- Validar quantidade de inventário (deve ser maior ou igual a 0)
ALTER TABLE public.inventario 
DROP CONSTRAINT IF EXISTS check_quantidade_non_negative;

ALTER TABLE public.inventario 
ADD CONSTRAINT check_quantidade_non_negative CHECK (quantidade >= 0);

-- Validar valor unitário de inventário (deve ser maior que 0 se definido)
ALTER TABLE public.inventario 
DROP CONSTRAINT IF EXISTS check_valor_unitario_positive;

ALTER TABLE public.inventario 
ADD CONSTRAINT check_valor_unitario_positive CHECK (valor_unitario IS NULL OR valor_unitario > 0);

-- 4. Adicionar comentários para documentação
COMMENT ON TABLE public.alunos IS 'Tabela de alunos com informações de matrícula e encarregado';
COMMENT ON TABLE public.professores IS 'Tabela de professores com qualificações e especialidades';
COMMENT ON TABLE public.notas IS 'Tabela de notas com sistema de avaliações AS1, AS2, AS3, AT e médias';
COMMENT ON TABLE public.matriculas IS 'Tabela de matrículas com status de aprovação e vinculação a turmas';
COMMENT ON TABLE public.professor_disciplinas IS 'Tabela de atribuição de disciplinas a professores por turma e ano letivo';
COMMENT ON TABLE public.turmas IS 'Tabela de turmas com capacidade e vinculação a ano letivo';
COMMENT ON TABLE public.disciplinas IS 'Tabela de disciplinas com carga horária e classe';
COMMENT ON TABLE public.financas IS 'Tabela de transações financeiras (entradas e saídas)';
COMMENT ON TABLE public.anos_lectivos IS 'Tabela de anos letivos com período ativo';

-- 5. Criar função para validar integridade antes de inserção
CREATE OR REPLACE FUNCTION public.validate_matricula_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o aluno existe
  IF NOT EXISTS (SELECT 1 FROM public.alunos WHERE id = NEW.aluno_id) THEN
    RAISE EXCEPTION 'Aluno não encontrado: %', NEW.aluno_id;
  END IF;
  
  -- Verificar se o ano letivo existe e está ativo
  IF NOT EXISTS (SELECT 1 FROM public.anos_lectivos WHERE id = NEW.ano_lectivo_id AND activo = true) THEN
    RAISE EXCEPTION 'Ano letivo não encontrado ou inativo: %', NEW.ano_lectivo_id;
  END IF;
  
  -- Se turma foi atribuída, verificar se existe
  IF NEW.turma_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.turmas WHERE id = NEW.turma_id) THEN
      RAISE EXCEPTION 'Turma não encontrada: %', NEW.turma_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger de validação em matriculas
DROP TRIGGER IF EXISTS trigger_validate_matricula_integrity ON public.matriculas;
CREATE TRIGGER trigger_validate_matricula_integrity
  BEFORE INSERT OR UPDATE ON public.matriculas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_matricula_integrity();

-- 6. Criar função para validar notas antes de inserção
CREATE OR REPLACE FUNCTION public.validate_nota_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o aluno existe
  IF NOT EXISTS (SELECT 1 FROM public.alunos WHERE id = NEW.aluno_id) THEN
    RAISE EXCEPTION 'Aluno não encontrado: %', NEW.aluno_id;
  END IF;
  
  -- Verificar se a disciplina existe
  IF NOT EXISTS (SELECT 1 FROM public.disciplinas WHERE id = NEW.disciplina_id) THEN
    RAISE EXCEPTION 'Disciplina não encontrada: %', NEW.disciplina_id;
  END IF;
  
  -- Verificar se o ano letivo existe
  IF NOT EXISTS (SELECT 1 FROM public.anos_lectivos WHERE id = NEW.ano_lectivo_id) THEN
    RAISE EXCEPTION 'Ano letivo não encontrado: %', NEW.ano_lectivo_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger de validação em notas
DROP TRIGGER IF EXISTS trigger_validate_nota_integrity ON public.notas;
CREATE TRIGGER trigger_validate_nota_integrity
  BEFORE INSERT OR UPDATE ON public.notas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_nota_integrity();

-- 7. Criar função para validar atribuição de professor antes de inserção
CREATE OR REPLACE FUNCTION public.validate_professor_disciplina_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o professor existe
  IF NOT EXISTS (SELECT 1 FROM public.professores WHERE id = NEW.professor_id) THEN
    RAISE EXCEPTION 'Professor não encontrado: %', NEW.professor_id;
  END IF;
  
  -- Verificar se a disciplina existe
  IF NOT EXISTS (SELECT 1 FROM public.disciplinas WHERE id = NEW.disciplina_id) THEN
    RAISE EXCEPTION 'Disciplina não encontrada: %', NEW.disciplina_id;
  END IF;
  
  -- Verificar se a turma existe
  IF NOT EXISTS (SELECT 1 FROM public.turmas WHERE id = NEW.turma_id) THEN
    RAISE EXCEPTION 'Turma não encontrada: %', NEW.turma_id;
  END IF;
  
  -- Verificar se o ano letivo existe
  IF NOT EXISTS (SELECT 1 FROM public.anos_lectivos WHERE id = NEW.ano_lectivo_id) THEN
    RAISE EXCEPTION 'Ano letivo não encontrado: %', NEW.ano_lectivo_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger de validação em professor_disciplinas
DROP TRIGGER IF EXISTS trigger_validate_professor_disciplina_integrity ON public.professor_disciplinas;
CREATE TRIGGER trigger_validate_professor_disciplina_integrity
  BEFORE INSERT OR UPDATE ON public.professor_disciplinas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_professor_disciplina_integrity();