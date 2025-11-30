-- Add audit logging trigger for profiles table modifications
CREATE OR REPLACE FUNCTION public.log_profiles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', 'profiles', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for profiles modifications
DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profiles_changes();

-- Create a function for admins to access profiles with audit logging
-- This logs bulk profile access for compliance
CREATE OR REPLACE FUNCTION public.get_profiles_with_audit(
  limit_count integer DEFAULT 100,
  offset_count integer DEFAULT 0
)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_count integer;
BEGIN
  -- Only allow admins and secretarios
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'secretario')) THEN
    RAISE EXCEPTION 'Access denied: Only admins and secretaries can access all profiles';
  END IF;
  
  -- Get count for logging
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  -- Log the bulk access
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    auth.uid(), 
    'BULK_SELECT', 
    'profiles', 
    'bulk_access',
    jsonb_build_object(
      'total_profiles', profile_count,
      'limit', limit_count,
      'offset', offset_count,
      'accessed_at', now()
    )
  );
  
  -- Return the profiles
  RETURN QUERY SELECT * FROM profiles ORDER BY nome_completo LIMIT limit_count OFFSET offset_count;
END;
$$;