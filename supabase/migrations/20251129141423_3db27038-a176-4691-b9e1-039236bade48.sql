-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text NOT NULL DEFAULT 'info',
  lida boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notificacoes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notificacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications" 
ON public.notificacoes 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;

-- Create function to notify students when grades are posted
CREATE OR REPLACE FUNCTION public.notify_student_grade_posted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_user_id uuid;
  v_disciplina_nome text;
  v_trimestre_text text;
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
    INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      v_aluno_user_id,
      'Nova Nota Lançada',
      'A sua nota de ' || COALESCE(v_disciplina_nome, 'disciplina') || ' do ' || v_trimestre_text || ' foi lançada.',
      'nota',
      '/aluno'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new grades
DROP TRIGGER IF EXISTS notify_grade_posted ON public.notas;
CREATE TRIGGER notify_grade_posted
AFTER INSERT ON public.notas
FOR EACH ROW EXECUTE FUNCTION public.notify_student_grade_posted();

-- Create function to notify students when grades are updated
CREATE OR REPLACE FUNCTION public.notify_student_grade_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link)
      VALUES (
        v_aluno_user_id,
        'Nota Atualizada',
        'A sua nota de ' || COALESCE(v_disciplina_nome, 'disciplina') || ' do ' || v_trimestre_text || ' foi atualizada.',
        'nota',
        '/aluno'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updated grades
DROP TRIGGER IF EXISTS notify_grade_updated ON public.notas;
CREATE TRIGGER notify_grade_updated
AFTER UPDATE ON public.notas
FOR EACH ROW EXECUTE FUNCTION public.notify_student_grade_updated();