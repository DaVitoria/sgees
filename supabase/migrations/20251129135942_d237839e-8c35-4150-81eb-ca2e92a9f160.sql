-- Drop the foreign key that creates the duplicate relation
ALTER TABLE public.professor_disciplinas
DROP CONSTRAINT IF EXISTS professor_disciplinas_ano_lectivo_id_fkey;

-- Ensure the main (correct) FK on turmas remains intact
ALTER TABLE public.turmas
DROP CONSTRAINT IF EXISTS turmas_ano_lectivo_id_fkey;

ALTER TABLE public.turmas
ADD CONSTRAINT turmas_ano_lectivo_id_fkey
FOREIGN KEY (ano_lectivo_id) REFERENCES public.anos_lectivos(id)
ON DELETE CASCADE;

-- Drop any duplicated FK involving professor_disciplinas → turmas
ALTER TABLE public.professor_disciplinas
DROP CONSTRAINT IF EXISTS professor_disciplinas_turma_id_fkey;

-- Recreate only the correct FK for professor_disciplinas → turmas
ALTER TABLE public.professor_disciplinas
ADD CONSTRAINT professor_disciplinas_turma_id_fkey
FOREIGN KEY (turma_id) REFERENCES public.turmas(id)
ON DELETE CASCADE;

-- Update notas table to use new grading structure (AS1, AS2, AS3, MAS, AT, MT, MA)
-- Use CASCADE to drop dependent objects
ALTER TABLE public.notas 
DROP COLUMN IF EXISTS nota_mac CASCADE,
DROP COLUMN IF EXISTS nota_cpp CASCADE,
DROP COLUMN IF EXISTS nota_cat CASCADE,
DROP COLUMN IF EXISTS media CASCADE;

ALTER TABLE public.notas
ADD COLUMN nota_as1 numeric CHECK (nota_as1 >= 0 AND nota_as1 <= 20),
ADD COLUMN nota_as2 numeric CHECK (nota_as2 >= 0 AND nota_as2 <= 20),
ADD COLUMN nota_as3 numeric CHECK (nota_as3 >= 0 AND nota_as3 <= 20),
ADD COLUMN media_as numeric CHECK (media_as >= 0 AND media_as <= 20),
ADD COLUMN nota_at numeric CHECK (nota_at >= 0 AND nota_at <= 20),
ADD COLUMN media_trimestral numeric CHECK (media_trimestral >= 0 AND media_trimestral <= 20);

-- Create a function to calculate annual average (MA) across trimesters
CREATE OR REPLACE FUNCTION public.calcular_media_anual(p_aluno_id uuid, p_disciplina_id uuid, p_ano_lectivo_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ROUND(AVG(media_trimestral)::numeric, 2)
  FROM public.notas
  WHERE aluno_id = p_aluno_id
    AND disciplina_id = p_disciplina_id
    AND ano_lectivo_id = p_ano_lectivo_id
    AND media_trimestral IS NOT NULL
$$;

-- Clean up Supabase metadata cache for relationships
NOTIFY pgrst, 'reload schema';