-- Add explicit authentication requirement policies for sensitive tables
-- These PERMISSIVE policies require auth.uid() to be non-null
-- Combined with existing RESTRICTIVE policies, this ensures only authenticated users can access data

-- Profiles: Require authentication for all operations
CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS PERMISSIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Alunos: Require authentication for all operations
CREATE POLICY "Require authentication for alunos"
ON public.alunos
AS PERMISSIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Financas: Require authentication for all operations
CREATE POLICY "Require authentication for financas"
ON public.financas
AS PERMISSIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Notas: Require authentication for all operations
CREATE POLICY "Require authentication for notas"
ON public.notas
AS PERMISSIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Professores: Require authentication for all operations
CREATE POLICY "Require authentication for professores"
ON public.professores
AS PERMISSIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Funcionarios: Require authentication for all operations
CREATE POLICY "Require authentication for funcionarios"
ON public.funcionarios
AS PERMISSIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Documentos: Require authentication for all operations
CREATE POLICY "Require authentication for documentos"
ON public.documentos
AS PERMISSIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Matriculas: Require authentication for all operations
CREATE POLICY "Require authentication for matriculas"
ON public.matriculas
AS PERMISSIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);