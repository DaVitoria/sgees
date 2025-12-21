-- Revoke execute permissions from the insecure assign_admin_role_by_email function
-- This prevents privilege escalation attacks
REVOKE EXECUTE ON FUNCTION public.assign_admin_role_by_email(TEXT) FROM public, authenticated;

-- Drop the function entirely since admin_assign_role() should be used instead
DROP FUNCTION IF EXISTS public.assign_admin_role_by_email(TEXT);