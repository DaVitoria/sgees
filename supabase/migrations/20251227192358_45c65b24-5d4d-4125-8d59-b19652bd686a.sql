-- Fix the SECURITY DEFINER view issue by using SECURITY INVOKER
DROP VIEW IF EXISTS public.alunos_basico;

CREATE VIEW public.alunos_basico 
WITH (security_invoker = on)
AS
SELECT 
  a.id,
  a.user_id,
  a.numero_matricula,
  a.turma_id,
  a.estado,
  a.data_matricula,
  a.created_at,
  p.nome_completo,
  p.email
FROM public.alunos a
JOIN public.profiles p ON p.id = a.user_id;

-- Grant access to the view
GRANT SELECT ON public.alunos_basico TO authenticated;

-- Also remove the overly permissive policies that allow regular professors to see ALL student data
-- Regular professors should use the alunos_basico view instead
DROP POLICY IF EXISTS "Professors view assigned students" ON public.alunos;
DROP POLICY IF EXISTS "Funcionarios view students only" ON public.alunos;