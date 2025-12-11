-- Drop existing SELECT policies on alunos
DROP POLICY IF EXISTS "Admins and secretarios can view all alunos" ON public.alunos;
DROP POLICY IF EXISTS "Alunos can view their own data" ON public.alunos;
DROP POLICY IF EXISTS "Funcionarios can view all alunos" ON public.alunos;

-- Recreate as PERMISSIVE policies (default, properly OR'd together)
-- Students can only view their own data
CREATE POLICY "Alunos can view their own data"
ON public.alunos
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins and secretarios can view all student data including guardian info
CREATE POLICY "Admins and secretarios can view all alunos"
ON public.alunos
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretario'::app_role));

-- Funcionarios can view all alunos for enrollment management
CREATE POLICY "Funcionarios can view all alunos"
ON public.alunos
FOR SELECT
USING (has_role(auth.uid(), 'funcionario'::app_role));