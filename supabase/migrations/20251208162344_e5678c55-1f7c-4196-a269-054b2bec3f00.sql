-- Remove funcionarios access to professor_disciplinas
DROP POLICY IF EXISTS "Funcionarios can manage professor_disciplinas" ON public.professor_disciplinas;