-- Drop existing overly permissive policy for funcionarios
DROP POLICY IF EXISTS "Funcionarios can view all profiles" ON public.profiles;

-- Create restricted policy: Funcionarios can only view profiles of students (users who have aluno records)
CREATE POLICY "Funcionarios view student profiles only"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'funcionario'::app_role) AND
  EXISTS (
    SELECT 1 FROM alunos a WHERE a.user_id = profiles.id
  )
);

-- Professors can only view profiles of students in their assigned classes
CREATE POLICY "Professors view assigned student profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'professor'::app_role) AND
  EXISTS (
    SELECT 1 FROM alunos a
    JOIN professor_disciplinas pd ON pd.turma_id = a.turma_id
    JOIN professores p ON p.id = pd.professor_id
    WHERE a.user_id = profiles.id AND p.user_id = auth.uid()
  )
);