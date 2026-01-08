-- Tornar a coluna classe opcional na tabela disciplinas
ALTER TABLE public.disciplinas ALTER COLUMN classe DROP NOT NULL;

-- Definir um valor padrão para registros existentes (se necessário)
UPDATE public.disciplinas SET classe = 0 WHERE classe IS NULL;