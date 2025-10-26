-- Adicionar foreign keys para garantir integridade referencial

-- Tabela alunos
ALTER TABLE public.alunos
  ADD CONSTRAINT fk_alunos_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_alunos_turma_id 
    FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE SET NULL;

-- Tabela documentos
ALTER TABLE public.documentos
  ADD CONSTRAINT fk_documentos_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_documentos_aluno_id 
    FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_documentos_gerado_por 
    FOREIGN KEY (gerado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Tabela financas
ALTER TABLE public.financas
  ADD CONSTRAINT fk_financas_aluno_id 
    FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_financas_registado_por 
    FOREIGN KEY (registado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Tabela funcionarios
ALTER TABLE public.funcionarios
  ADD CONSTRAINT fk_funcionarios_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela inventario
ALTER TABLE public.inventario
  ADD CONSTRAINT fk_inventario_responsavel_id 
    FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Tabela matriculas
ALTER TABLE public.matriculas
  ADD CONSTRAINT fk_matriculas_aluno_id 
    FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_matriculas_ano_lectivo_id 
    FOREIGN KEY (ano_lectivo_id) REFERENCES public.anos_lectivos(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_matriculas_turma_id 
    FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE SET NULL;

-- Tabela notas
ALTER TABLE public.notas
  ADD CONSTRAINT fk_notas_aluno_id 
    FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notas_ano_lectivo_id 
    FOREIGN KEY (ano_lectivo_id) REFERENCES public.anos_lectivos(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notas_disciplina_id 
    FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notas_lancado_por 
    FOREIGN KEY (lancado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Tabela noticias
ALTER TABLE public.noticias
  ADD CONSTRAINT fk_noticias_autor_id 
    FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela professor_disciplinas
ALTER TABLE public.professor_disciplinas
  ADD CONSTRAINT fk_professor_disciplinas_professor_id 
    FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_professor_disciplinas_disciplina_id 
    FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_professor_disciplinas_turma_id 
    FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_professor_disciplinas_ano_lectivo_id 
    FOREIGN KEY (ano_lectivo_id) REFERENCES public.anos_lectivos(id) ON DELETE CASCADE;

-- Tabela professores
ALTER TABLE public.professores
  ADD CONSTRAINT fk_professores_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela relatorios
ALTER TABLE public.relatorios
  ADD CONSTRAINT fk_relatorios_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela turmas
ALTER TABLE public.turmas
  ADD CONSTRAINT fk_turmas_ano_lectivo_id 
    FOREIGN KEY (ano_lectivo_id) REFERENCES public.anos_lectivos(id) ON DELETE CASCADE;