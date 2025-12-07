-- Grant funcionarios full access to alunos table
CREATE POLICY "Funcionarios can view all alunos" 
ON public.alunos 
FOR SELECT 
USING (has_role(auth.uid(), 'funcionario'::app_role));

CREATE POLICY "Funcionarios can manage alunos" 
ON public.alunos 
FOR ALL 
USING (has_role(auth.uid(), 'funcionario'::app_role));

-- Grant funcionarios full access to matriculas table
CREATE POLICY "Funcionarios can view all matriculas" 
ON public.matriculas 
FOR SELECT 
USING (has_role(auth.uid(), 'funcionario'::app_role));

CREATE POLICY "Funcionarios can insert matriculas" 
ON public.matriculas 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'funcionario'::app_role));

CREATE POLICY "Funcionarios can delete matriculas" 
ON public.matriculas 
FOR DELETE 
USING (has_role(auth.uid(), 'funcionario'::app_role));