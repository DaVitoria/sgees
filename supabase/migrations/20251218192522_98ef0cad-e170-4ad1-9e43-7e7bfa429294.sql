-- Add unique constraint to prevent duplicate professor-disciplina-turma assignments
-- A professor cannot be assigned to the same discipline in the same class for the same academic year more than once

ALTER TABLE public.professor_disciplinas
ADD CONSTRAINT unique_professor_disciplina_turma_ano 
UNIQUE (professor_id, disciplina_id, turma_id, ano_lectivo_id);