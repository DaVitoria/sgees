-- Create trigger to log profile bulk access by admins/secretários
CREATE OR REPLACE FUNCTION public.log_profile_bulk_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access when admin/secretário queries profiles
  IF has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'secretario') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
      auth.uid(),
      'SELECT',
      'profiles',
      NEW.id::text,
      jsonb_build_object('accessed_at', now(), 'accessed_profile_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create audit triggers for sensitive tables
-- Trigger for notas changes
CREATE OR REPLACE TRIGGER audit_notas_changes
AFTER INSERT OR UPDATE OR DELETE ON public.notas
FOR EACH ROW
EXECUTE FUNCTION public.log_notas_changes();

-- Trigger for alunos changes
CREATE OR REPLACE TRIGGER audit_alunos_changes
AFTER INSERT OR UPDATE OR DELETE ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.log_alunos_changes();

-- Trigger for financas changes
CREATE OR REPLACE TRIGGER audit_financas_changes
AFTER INSERT OR UPDATE OR DELETE ON public.financas
FOR EACH ROW
EXECUTE FUNCTION public.log_financas_changes();

-- Trigger for exames changes
CREATE OR REPLACE TRIGGER audit_exames_changes
AFTER INSERT OR UPDATE OR DELETE ON public.exames
FOR EACH ROW
EXECUTE FUNCTION public.log_exames_changes();

-- Trigger for profiles changes
CREATE OR REPLACE TRIGGER audit_profiles_changes
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_profiles_changes();