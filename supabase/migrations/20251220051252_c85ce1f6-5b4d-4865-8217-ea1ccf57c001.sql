-- Drop existing function first to change return type
DROP FUNCTION IF EXISTS public.calcular_media_anual(uuid, uuid, uuid);

-- Recreate function with integer return type and ceiling rounding
CREATE OR REPLACE FUNCTION public.calcular_media_anual(
  p_aluno_id uuid,
  p_ano_lectivo_id uuid,
  p_disciplina_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_media numeric;
BEGIN
  SELECT CEIL(AVG(media_trimestral))
  INTO v_media
  FROM notas
  WHERE aluno_id = p_aluno_id
    AND ano_lectivo_id = p_ano_lectivo_id
    AND disciplina_id = p_disciplina_id
    AND media_trimestral IS NOT NULL;
  
  RETURN COALESCE(v_media::integer, NULL);
END;
$$;