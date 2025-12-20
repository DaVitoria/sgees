-- Remove unique constraint on nome + ano_lectivo_id to allow multiple turmas with same name
ALTER TABLE public.turmas DROP CONSTRAINT IF EXISTS turmas_nome_ano_lectivo_id_key;