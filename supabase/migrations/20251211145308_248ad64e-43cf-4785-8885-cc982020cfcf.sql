-- Drop existing broad policy for admins and secretarios
DROP POLICY IF EXISTS "Admins and secretarios can view all profiles" ON public.profiles;

-- Admins retain full access (necessary for system management, with audit logging in place)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Secretarios can only view profiles of students, teachers, and staff (not other admins/secretarios)
CREATE POLICY "Secretarios view operational profiles only"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'secretario'::app_role) AND
  (
    -- Own profile
    auth.uid() = id
    OR
    -- Student profiles
    EXISTS (SELECT 1 FROM alunos a WHERE a.user_id = profiles.id)
    OR
    -- Teacher profiles
    EXISTS (SELECT 1 FROM professores p WHERE p.user_id = profiles.id)
    OR
    -- Staff profiles
    EXISTS (SELECT 1 FROM funcionarios f WHERE f.user_id = profiles.id)
  )
);