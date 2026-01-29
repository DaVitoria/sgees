-- Drop the problematic view with SECURITY DEFINER (it's created as invoker by default, but the linter flagged it)
DROP VIEW IF EXISTS public.alunos_sem_dados_encarregado;

-- Recreate the view explicitly with SECURITY INVOKER (follows RLS of querying user)
CREATE VIEW public.alunos_sem_dados_encarregado 
WITH (security_invoker = true) AS
SELECT 
    a.id,
    a.user_id,
    a.numero_matricula,
    a.turma_id,
    a.data_matricula,
    a.estado,
    a.created_at
FROM public.alunos a;