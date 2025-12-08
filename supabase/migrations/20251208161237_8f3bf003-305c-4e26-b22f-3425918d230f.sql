-- 1. Grant funcionarios SELECT access to anos_lectivos (needed for turmas/matriculas)
-- Already has public SELECT, so no change needed

-- 2. Grant funcionarios management access to professor_disciplinas (for atribuição de disciplinas)
CREATE POLICY "Funcionarios can manage professor_disciplinas" 
ON public.professor_disciplinas 
FOR ALL 
USING (has_role(auth.uid(), 'funcionario'::app_role));

-- 3. Grant funcionarios SELECT access to professores (to view professors for assignment)
CREATE POLICY "Funcionarios can view all professores" 
ON public.professores 
FOR SELECT 
USING (has_role(auth.uid(), 'funcionario'::app_role));

-- 4. Grant funcionarios SELECT access to profiles (to view user data for management)
CREATE POLICY "Funcionarios can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'funcionario'::app_role));

-- 5. Grant funcionarios management access to documentos (administrative documents)
CREATE POLICY "Funcionarios can manage all documentos" 
ON public.documentos 
FOR ALL 
USING (has_role(auth.uid(), 'funcionario'::app_role));

-- 6. Fix audit_logs insert policy - restrict to service role only
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Only triggers can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (
  -- Only allow inserts from triggers (when current_user is the DB owner)
  -- or when there's no authenticated user (service role)
  auth.uid() IS NOT NULL OR current_setting('role', true) = 'service_role'
);

-- 7. Grant funcionarios access to user_roles for viewing (needed for user management)
CREATE POLICY "Funcionarios can view user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'funcionario'::app_role));