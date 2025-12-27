-- First drop the existing policy that was created
DROP POLICY IF EXISTS "Directores de turma podem ver alunos da sua turma" ON public.alunos;

-- Recreate the restrictive policy for alunos table
CREATE POLICY "Directores de turma podem ver alunos da sua turma"
ON public.alunos
FOR SELECT
USING (
  -- Admins can see all
  has_role(auth.uid(), 'admin')
  OR
  -- Secretarios can see all (administrative need)
  has_role(auth.uid(), 'secretario')
  OR
  -- Student can see own record
  user_id = auth.uid()
  OR
  -- Class directors can see students in their class (including guardian info)
  (
    has_role(auth.uid(), 'professor')
    AND turma_id IS NOT NULL
    AND is_director_turma(auth.uid(), turma_id)
  )
);

-- Create a secure view for professors to see basic student info (no guardian data)
CREATE OR REPLACE VIEW public.alunos_basico AS
SELECT 
  a.id,
  a.user_id,
  a.numero_matricula,
  a.turma_id,
  a.estado,
  a.data_matricula,
  a.created_at,
  p.nome_completo,
  p.email
FROM public.alunos a
JOIN public.profiles p ON p.id = a.user_id
WHERE 
  -- Admins can see all
  has_role(auth.uid(), 'admin')
  OR
  -- Secretarios can see all
  has_role(auth.uid(), 'secretario')
  OR
  -- Student can see own record
  a.user_id = auth.uid()
  OR
  -- Class directors can see their class
  (has_role(auth.uid(), 'professor') AND a.turma_id IS NOT NULL AND is_director_turma(auth.uid(), a.turma_id))
  OR
  -- Regular professors can see students from classes they teach (basic info only - NO guardian data)
  (
    has_role(auth.uid(), 'professor')
    AND a.turma_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.professor_disciplinas pd
      JOIN public.professores pr ON pr.id = pd.professor_id
      WHERE pr.user_id = auth.uid()
      AND pd.turma_id = a.turma_id
    )
  );

-- Grant access to the view
GRANT SELECT ON public.alunos_basico TO authenticated;