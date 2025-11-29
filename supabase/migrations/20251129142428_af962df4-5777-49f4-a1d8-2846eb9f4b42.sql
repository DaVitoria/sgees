-- Enable the pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop existing triggers
DROP TRIGGER IF EXISTS notify_grade_posted ON public.notas;
DROP TRIGGER IF EXISTS notify_grade_updated ON public.notas;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.notify_student_grade_posted();
DROP FUNCTION IF EXISTS public.notify_student_grade_updated();

-- Create function to notify student when grade is posted (creates in-app notification and calls edge function for email)
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
  v_aluno_email text;
BEGIN
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
    
    -- Call edge function to send email notification
    PERFORM net.http_post(
      url := 'https://dohalwyalrmphycyrcfx.supabase.co/functions/v1/send-grade-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaGFsd3lhbHJtcGh5Y3lyY2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTc2MjAsImV4cCI6MjA3NjUzMzYyMH0.nWKt3RR3Zf1jd2mLkDDVQCobTarenreecGTHBJJGfVE'
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

-- Create function to notify student when grade is updated
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
BEGIN
  -- Only notify if grade values actually changed
  IF (OLD.nota_as1 IS DISTINCT FROM NEW.nota_as1) OR 
     (OLD.nota_as2 IS DISTINCT FROM NEW.nota_as2) OR 
     (OLD.nota_as3 IS DISTINCT FROM NEW.nota_as3) OR 
     (OLD.nota_at IS DISTINCT FROM NEW.nota_at) OR
     (OLD.media_trimestral IS DISTINCT FROM NEW.media_trimestral) THEN
    
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
      
      -- Call edge function to send email notification
      PERFORM net.http_post(
        url := 'https://dohalwyalrmphycyrcfx.supabase.co/functions/v1/send-grade-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaGFsd3lhbHJtcGh5Y3lyY2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTc2MjAsImV4cCI6MjA3NjUzMzYyMH0.nWKt3RR3Zf1jd2mLkDDVQCobTarenreecGTHBJJGfVE'
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

-- Create trigger for new grades
CREATE TRIGGER notify_grade_posted
  AFTER INSERT ON public.notas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_student_grade_posted();

-- Create trigger for updated grades
CREATE TRIGGER notify_grade_updated
  AFTER UPDATE ON public.notas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_student_grade_updated();