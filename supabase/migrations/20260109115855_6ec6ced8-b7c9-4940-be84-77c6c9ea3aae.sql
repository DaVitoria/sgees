-- Drop the overly permissive audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a restrictive policy that only allows service_role to insert audit logs
-- This prevents client-side log injection attacks
CREATE POLICY "Only service role can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
);