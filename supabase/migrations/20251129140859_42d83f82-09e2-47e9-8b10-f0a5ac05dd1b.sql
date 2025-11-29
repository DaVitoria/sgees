-- Fix 1: Update notas RLS policies to verify teachers are assigned to the class/discipline
DROP POLICY IF EXISTS "Professores can view notas of their turmas" ON public.notas;
DROP POLICY IF EXISTS "Professores can insert/update notas" ON public.notas;
DROP POLICY IF EXISTS "Professores can update notas" ON public.notas;

-- Create secure policy: Teachers can only view grades for students in classes they are assigned to
CREATE POLICY "Professores can view their assigned notas" 
ON public.notas 
FOR SELECT 
USING (
  has_role(auth.uid(), 'professor'::app_role) AND 
  EXISTS (
    SELECT 1 FROM professor_disciplinas pd 
    JOIN professores p ON p.id = pd.professor_id 
    WHERE p.user_id = auth.uid() 
    AND pd.turma_id IN (SELECT turma_id FROM alunos WHERE id = notas.aluno_id)
    AND pd.disciplina_id = notas.disciplina_id
  )
);

-- Create secure policy: Teachers can only insert grades for their assigned classes/disciplines
CREATE POLICY "Professores can insert their assigned notas" 
ON public.notas 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'professor'::app_role) AND 
  EXISTS (
    SELECT 1 FROM professor_disciplinas pd 
    JOIN professores p ON p.id = pd.professor_id 
    WHERE p.user_id = auth.uid() 
    AND pd.turma_id IN (SELECT turma_id FROM alunos WHERE id = notas.aluno_id)
    AND pd.disciplina_id = notas.disciplina_id
  )
);

-- Create secure policy: Teachers can only update grades for their assigned classes/disciplines
CREATE POLICY "Professores can update their assigned notas" 
ON public.notas 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'professor'::app_role) AND 
  EXISTS (
    SELECT 1 FROM professor_disciplinas pd 
    JOIN professores p ON p.id = pd.professor_id 
    WHERE p.user_id = auth.uid() 
    AND pd.turma_id IN (SELECT turma_id FROM alunos WHERE id = notas.aluno_id)
    AND pd.disciplina_id = notas.disciplina_id
  )
);

-- Fix 2: Create audit_logs table for tracking sensitive operations (addresses PUBLIC_DATA_EXPOSURE)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text
);

-- Enable RLS on audit_logs - only admins can read, no one can delete
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent all modifications to audit logs except inserts
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Create function to log profile access (for tracking mass PII queries)
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log when admins/secretarios access profiles (not self-access)
  IF auth.uid() IS NOT NULL AND NEW.id != auth.uid() THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'SELECT', 'profiles', NEW.id::text, jsonb_build_object('accessed_profile', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

-- Create function to log notas changes
CREATE OR REPLACE FUNCTION public.log_notas_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', 'notas', NEW.id::text, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', 'notas', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', 'notas', OLD.id::text, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for notas changes
DROP TRIGGER IF EXISTS audit_notas_changes ON public.notas;
CREATE TRIGGER audit_notas_changes
AFTER INSERT OR UPDATE OR DELETE ON public.notas
FOR EACH ROW EXECUTE FUNCTION public.log_notas_changes();

-- Create function to log alunos changes
CREATE OR REPLACE FUNCTION public.log_alunos_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', 'alunos', NEW.id::text, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', 'alunos', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', 'alunos', OLD.id::text, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for alunos changes
DROP TRIGGER IF EXISTS audit_alunos_changes ON public.alunos;
CREATE TRIGGER audit_alunos_changes
AFTER INSERT OR UPDATE OR DELETE ON public.alunos
FOR EACH ROW EXECUTE FUNCTION public.log_alunos_changes();

-- Create function to log financas changes
CREATE OR REPLACE FUNCTION public.log_financas_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', 'financas', NEW.id::text, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', 'financas', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', 'financas', OLD.id::text, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for financas changes
DROP TRIGGER IF EXISTS audit_financas_changes ON public.financas;
CREATE TRIGGER audit_financas_changes
AFTER INSERT OR UPDATE OR DELETE ON public.financas
FOR EACH ROW EXECUTE FUNCTION public.log_financas_changes();