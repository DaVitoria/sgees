-- Drop ALL existing policies on alunos to start fresh
DROP POLICY IF EXISTS "Admins and secretarios can manage alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins and secretarios can view all alunos" ON public.alunos;
DROP POLICY IF EXISTS "Alunos can view their own data" ON public.alunos;
DROP POLICY IF EXISTS "Alunos podem criar seu proprio registro" ON public.alunos;
DROP POLICY IF EXISTS "Funcionarios can manage alunos" ON public.alunos;
DROP POLICY IF EXISTS "Funcionarios can view all alunos" ON public.alunos;
DROP POLICY IF EXISTS "Require authentication for alunos" ON public.alunos;

-- CREATE PERMISSIVE SELECT POLICIES (OR'd together - if ANY passes, access granted)

-- Students can only view their own record
CREATE POLICY "Students can view own data"
ON public.alunos
FOR SELECT
USING (auth.uid() = user_id);

-- Admins and secretarios can view all students
CREATE POLICY "Admins secretarios view all"
ON public.alunos
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretario'::app_role));

-- Funcionarios can view all students for enrollment management
CREATE POLICY "Funcionarios view all"
ON public.alunos
FOR SELECT
USING (has_role(auth.uid(), 'funcionario'::app_role));

-- Professors can view students in their assigned classes
CREATE POLICY "Professors view assigned students"
ON public.alunos
FOR SELECT
USING (
  has_role(auth.uid(), 'professor'::app_role) AND
  EXISTS (
    SELECT 1 FROM professor_disciplinas pd
    JOIN professores p ON p.id = pd.professor_id
    WHERE p.user_id = auth.uid() AND pd.turma_id = alunos.turma_id
  )
);

-- CREATE INSERT POLICIES

-- Students can create their own record during enrollment
CREATE POLICY "Students can create own record"
ON public.alunos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins and secretarios can insert student records
CREATE POLICY "Admins secretarios can insert"
ON public.alunos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretario'::app_role));

-- Funcionarios can insert student records
CREATE POLICY "Funcionarios can insert"
ON public.alunos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'funcionario'::app_role));

-- CREATE UPDATE POLICIES

-- Admins and secretarios can update all students
CREATE POLICY "Admins secretarios can update"
ON public.alunos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretario'::app_role));

-- Funcionarios can update all students
CREATE POLICY "Funcionarios can update"
ON public.alunos
FOR UPDATE
USING (has_role(auth.uid(), 'funcionario'::app_role));

-- CREATE DELETE POLICIES

-- Only admins and secretarios can delete students
CREATE POLICY "Admins secretarios can delete"
ON public.alunos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretario'::app_role));

-- Funcionarios can delete students
CREATE POLICY "Funcionarios can delete"
ON public.alunos
FOR DELETE
USING (has_role(auth.uid(), 'funcionario'::app_role));