-- Add audit trigger for financas table to track all changes
CREATE OR REPLACE FUNCTION public.audit_financas_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id,
      table_name,
      action,
      record_id,
      new_values,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      'financas',
      'INSERT',
      NEW.id,
      to_jsonb(NEW),
      NULL,
      NULL
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      table_name,
      action,
      record_id,
      old_values,
      new_values,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      'financas',
      'UPDATE',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NULL,
      NULL
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      table_name,
      action,
      record_id,
      old_values,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      'financas',
      'DELETE',
      OLD.id,
      to_jsonb(OLD),
      NULL,
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for financas table
DROP TRIGGER IF EXISTS audit_financas_trigger ON public.financas;
CREATE TRIGGER audit_financas_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.financas
  FOR EACH ROW EXECUTE FUNCTION public.audit_financas_changes();