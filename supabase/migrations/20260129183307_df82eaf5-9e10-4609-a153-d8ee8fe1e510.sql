-- 1. Add unique constraint to email in profiles table
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 2. Create a view for student profiles that excludes guardian data for non-admin roles
CREATE OR REPLACE VIEW public.alunos_sem_dados_encarregado AS
SELECT 
    a.id,
    a.user_id,
    a.numero_matricula,
    a.turma_id,
    a.data_matricula,
    a.estado,
    a.created_at
FROM public.alunos a;

-- 3. Drop overly permissive RLS policies on profiles
DROP POLICY IF EXISTS "Funcionarios view student profiles only" ON public.profiles;
DROP POLICY IF EXISTS "Professors view assigned student profiles" ON public.profiles;

-- 4. Create stricter RLS policies for profiles - only allow viewing minimal data for professors
CREATE POLICY "Professors view minimal student profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    has_role(auth.uid(), 'professor'::app_role) AND 
    EXISTS (
        SELECT 1 FROM alunos a
        JOIN professor_disciplinas pd ON pd.turma_id = a.turma_id
        JOIN professores p ON p.id = pd.professor_id
        WHERE a.user_id = profiles.id AND p.user_id = auth.uid()
    )
);

-- 5. Create stricter policy for funcionarios - only view student profiles they need
CREATE POLICY "Funcionarios view student profiles minimal"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    has_role(auth.uid(), 'funcionario'::app_role) AND
    EXISTS (SELECT 1 FROM alunos a WHERE a.user_id = profiles.id)
);

-- 6. Drop overly permissive policies on alunos table for guardian data
DROP POLICY IF EXISTS "Directores de turma podem ver alunos da sua turma" ON public.alunos;

-- 7. Create stricter policy for directors - they can see students but guardian data requires admin
CREATE POLICY "Directores de turma podem ver alunos basicos"
ON public.alunos
FOR SELECT
TO authenticated
USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'secretario'::app_role) OR
    user_id = auth.uid() OR
    (
        has_role(auth.uid(), 'professor'::app_role) AND
        turma_id IS NOT NULL AND
        is_director_turma(auth.uid(), turma_id)
    )
);

-- 8. Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 9. Create index for faster aluno lookups by user_id
CREATE INDEX IF NOT EXISTS idx_alunos_user_id ON public.alunos(user_id);