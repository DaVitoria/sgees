-- Fix 1: Drop and recreate the overly permissive INSERT policy on notificacoes
DROP POLICY IF EXISTS "System can insert notifications" ON public.notificacoes;

-- Create a more restrictive policy that allows:
-- 1. Authenticated users can only insert notifications for themselves
-- 2. Database triggers (SECURITY DEFINER functions) can insert any notification
CREATE POLICY "Users can insert own notifications or system via definer" 
ON public.notificacoes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  current_setting('role', true) = 'rls_definer'
);

-- Fix 2: Update the trigger functions to remove hardcoded Authorization headers
-- The edge functions already have verify_jwt = false in config.toml

-- Drop existing triggers first
DROP TRIGGER IF EXISTS notify_grade_posted ON public.notas;
DROP TRIGGER IF EXISTS notify_grade_updated ON public.notas;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.notify_student_grade_posted();
DROP FUNCTION IF EXISTS public.notify_student_grade_updated();

-- Recreate function to notify student when grade is posted (WITHOUT hardcoded Authorization header)
CREATE OR REPLACE FUNCTION public.notify_student_grade_posted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_aluno_user_id uuid;
  v_disciplina_nome text;
  v_trimestre_text text;
  v_supabase_url text;
BEGIN
  -- Get Supabase URL from environment
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://dohalwyalrmphycyrcfx.supabase.co';
  END IF;

  -- Get student's user_id
  SELECT user_id INTO v_aluno_user_id
  FROM alunos
  WHERE id = NEW.aluno_id;
  
  -- Get discipline name
  SELECT nome INTO v_disciplina_nome
  FROM disciplinas
  WHERE id = NEW.disciplina_id;
  
  -- Format trimester text
  v_trimestre_text := NEW.trimestre || 'º Trimestre';
  
  -- Only create notification if we have a valid user_id
  IF v_aluno_user_id IS NOT NULL THEN
    -- Create in-app notification
    INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      v_aluno_user_id,
      'Nova Nota Lançada',
      'A sua nota de ' || COALESCE(v_disciplina_nome, 'disciplina') || ' do ' || v_trimestre_text || ' foi lançada.',
      'nota',
      '/aluno'
    );
    
    -- Call edge function WITHOUT Authorization header (verify_jwt = false in config)
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-grade-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'aluno_id', NEW.aluno_id,
        'disciplina_id', NEW.disciplina_id,
        'trimestre', NEW.trimestre,
        'tipo', 'nova'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate function to notify student when grade is updated (WITHOUT hardcoded Authorization header)
CREATE OR REPLACE FUNCTION public.notify_student_grade_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_aluno_user_id uuid;
  v_disciplina_nome text;
  v_trimestre_text text;
  v_supabase_url text;
BEGIN
  -- Only notify if grade values actually changed
  IF (OLD.nota_as1 IS DISTINCT FROM NEW.nota_as1) OR 
     (OLD.nota_as2 IS DISTINCT FROM NEW.nota_as2) OR 
     (OLD.nota_as3 IS DISTINCT FROM NEW.nota_as3) OR 
     (OLD.nota_at IS DISTINCT FROM NEW.nota_at) OR
     (OLD.media_trimestral IS DISTINCT FROM NEW.media_trimestral) THEN
    
    -- Get Supabase URL from environment
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    IF v_supabase_url IS NULL THEN
      v_supabase_url := 'https://dohalwyalrmphycyrcfx.supabase.co';
    END IF;

    -- Get student's user_id
    SELECT user_id INTO v_aluno_user_id
    FROM alunos
    WHERE id = NEW.aluno_id;
    
    -- Get discipline name
    SELECT nome INTO v_disciplina_nome
    FROM disciplinas
    WHERE id = NEW.disciplina_id;
    
    -- Format trimester text
    v_trimestre_text := NEW.trimestre || 'º Trimestre';
    
    -- Only create notification if we have a valid user_id
    IF v_aluno_user_id IS NOT NULL THEN
      -- Create in-app notification
      INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link)
      VALUES (
        v_aluno_user_id,
        'Nota Atualizada',
        'A sua nota de ' || COALESCE(v_disciplina_nome, 'disciplina') || ' do ' || v_trimestre_text || ' foi atualizada.',
        'nota',
        '/aluno'
      );
      
      -- Call edge function WITHOUT Authorization header (verify_jwt = false in config)
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-grade-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'aluno_id', NEW.aluno_id,
          'disciplina_id', NEW.disciplina_id,
          'trimestre', NEW.trimestre,
          'tipo', 'atualizada'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate triggers
CREATE TRIGGER notify_grade_posted
  AFTER INSERT ON public.notas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_student_grade_posted();

CREATE TRIGGER notify_grade_updated
  AFTER UPDATE ON public.notas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_student_grade_updated();