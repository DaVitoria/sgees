-- Create function to notify students about enrollment status changes
CREATE OR REPLACE FUNCTION public.notify_student_enrollment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_user_id uuid;
  v_aluno_nome text;
  v_titulo text;
  v_mensagem text;
  v_tipo text;
BEGIN
  -- Only trigger when status changes to aprovada or rejeitada
  IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status IN ('aprovada', 'rejeitada')) THEN
    
    -- Get student's user_id and name
    SELECT a.user_id, p.nome_completo INTO v_aluno_user_id, v_aluno_nome
    FROM alunos a
    JOIN profiles p ON p.id = a.user_id
    WHERE a.id = NEW.aluno_id;
    
    IF v_aluno_user_id IS NOT NULL THEN
      -- Set notification content based on status
      IF NEW.status = 'aprovada' THEN
        v_titulo := 'Matrícula Aprovada';
        v_mensagem := 'Parabéns! A sua matrícula foi aprovada com sucesso.';
        v_tipo := 'sucesso';
        
        -- Add turma info if assigned
        IF NEW.turma_id IS NOT NULL THEN
          SELECT 'Parabéns! A sua matrícula foi aprovada. Turma atribuída: ' || t.classe || 'ª Classe - ' || t.nome
          INTO v_mensagem
          FROM turmas t
          WHERE t.id = NEW.turma_id;
        END IF;
      ELSE
        v_titulo := 'Matrícula Rejeitada';
        v_mensagem := 'Lamentamos informar que a sua matrícula foi rejeitada.';
        v_tipo := 'erro';
        
        -- Add observation if available
        IF NEW.observacoes IS NOT NULL AND NEW.observacoes != '' THEN
          v_mensagem := v_mensagem || ' Observação: ' || NEW.observacoes;
        END IF;
      END IF;
      
      -- Create in-app notification
      INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link)
      VALUES (
        v_aluno_user_id,
        v_titulo,
        v_mensagem,
        v_tipo,
        '/acompanhamento-matricula'
      );
      
      -- Call edge function to send email notification
      PERFORM net.http_post(
        url := 'https://dohalwyalrmphycyrcfx.supabase.co/functions/v1/send-enrollment-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaGFsd3lhbHJtcGh5Y3lyY2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTc2MjAsImV4cCI6MjA3NjUzMzYyMH0.nWKt3RR3Zf1jd2mLkDDVQCobTarenreecGTHBJJGfVE'
        ),
        body := jsonb_build_object(
          'aluno_id', NEW.aluno_id,
          'status', NEW.status,
          'turma_id', NEW.turma_id,
          'observacoes', NEW.observacoes
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for enrollment status changes
DROP TRIGGER IF EXISTS on_enrollment_status_change ON matriculas;
CREATE TRIGGER on_enrollment_status_change
  AFTER UPDATE ON matriculas
  FOR EACH ROW
  EXECUTE FUNCTION notify_student_enrollment_status();