-- Allow secretarios to insert 'aluno' role only (prevents privilege escalation)
CREATE POLICY "Secretarios can assign aluno role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'secretario'::app_role) 
  AND role = 'aluno'::app_role
);

-- Allow funcionarios to insert 'aluno' role only
CREATE POLICY "Funcionarios can assign aluno role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'funcionario'::app_role) 
  AND role = 'aluno'::app_role
);