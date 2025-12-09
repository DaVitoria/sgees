-- Allow secretarios to assign professor and funcionario roles (in addition to aluno)
DROP POLICY IF EXISTS "Secretarios can assign aluno role" ON public.user_roles;

CREATE POLICY "Secretarios can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'secretario'::app_role) 
  AND role IN ('aluno'::app_role, 'professor'::app_role, 'funcionario'::app_role)
);

-- Allow secretarios to view all user_roles for the assignment page
CREATE POLICY "Secretarios can view all user roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'secretario'::app_role));