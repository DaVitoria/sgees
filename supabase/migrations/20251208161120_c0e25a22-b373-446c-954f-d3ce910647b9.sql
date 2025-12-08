-- Grant funcionarios full access to turmas table
CREATE POLICY "Funcionarios can manage turmas" 
ON public.turmas 
FOR ALL 
USING (has_role(auth.uid(), 'funcionario'::app_role));
