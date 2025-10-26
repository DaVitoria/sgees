-- Remove any existing foreign keys first to avoid duplicates
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT constraint_name, table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_name IN ('professor_disciplinas', 'notas', 'alunos')
  ) LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
  END LOOP;
END $$;

-- Add foreign keys for professor_disciplinas
ALTER TABLE public.professor_disciplinas
  ADD CONSTRAINT fk_professor_disciplinas_professor 
    FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_professor_disciplinas_disciplina 
    FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_professor_disciplinas_turma 
    FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_professor_disciplinas_ano_lectivo 
    FOREIGN KEY (ano_lectivo_id) REFERENCES public.anos_lectivos(id) ON DELETE CASCADE;

-- Add foreign keys for notas
ALTER TABLE public.notas
  ADD CONSTRAINT fk_notas_aluno 
    FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notas_disciplina 
    FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notas_ano_lectivo 
    FOREIGN KEY (ano_lectivo_id) REFERENCES public.anos_lectivos(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notas_lancado_por 
    FOREIGN KEY (lancado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign keys for alunos
ALTER TABLE public.alunos
  ADD CONSTRAINT fk_alunos_turma 
    FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_alunos_user 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;